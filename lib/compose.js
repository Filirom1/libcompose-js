var EventEmitter = require('events').EventEmitter;
var util = require('util');
var yaml = require('js-yaml');
var async = require('async');
var _ = require('lodash');
var debug = require('debug')('compose');
var dag = require('breeze-dag');
var tsort = require('gaia-tsort');

var Service = require('./service');

exports.Compose = Compose;

function Compose(config){
  var self = this;
  this.config = config;
  this.config.projectName = this.config.projectName.toLowerCase().replace(/[^a-z\d]/g, '');
  EventEmitter.call(this);
}

util.inherits(Compose, EventEmitter);

Compose.prototype.parse = function(str){
  var self = this;
  var obj = yaml.safeLoad(str);
  self.services = {};
  _(obj.services).forEach(function(hash, key){
    self.services[key] = new Service(self.config, key, hash).pipe(self)
  });
  return this;
};

Compose.prototype.dependenciesEdges = function(services){
  var self = this;
  services = services || _.keys(this.services);

  var edges = [];
  _(services).forEach(function(serviceName){
    var links = self.services[serviceName].hash.links || [];
    var dependsOn = self.services[serviceName].hash.depends_on || [];
    
    _.concat(links, dependsOn).forEach(function(link){
      var dependencyServiceName = link.split(':')[0];
      edges.push([dependencyServiceName, serviceName]);
    });
  });
  
  debug('dependencies edges %j', edges);
  return edges;
};

Compose.prototype.dependentsEdges = function(services){
  var edges = this.dependenciesEdges();
  services = services || _.keys(this.services);

  var graph = tsort(edges);
  if (graph.error) throw graph.error;
  if (!graph.path.length) return [];

  graph = _.keyBy(graph.graph, 'id');
  
  var revertedEdges = [];
  function computeRevertedEdges(services){
    _.forEach(services, function(serviceName){
      var children = graph[serviceName].children
      _.forEach(children, function(childrenServiceName){
        revertedEdges.push([childrenServiceName, serviceName])
      })
      computeRevertedEdges(children);
    })
  }
  computeRevertedEdges(services);

  debug('dependents edges %j', revertedEdges);

  return revertedEdges;
}

Compose.prototype.forEachDependenciesOf = function(services, iterator, cb){
  var edges = this.dependenciesEdges(services);
  this.forEachNode(services, edges, iterator, cb);
};

Compose.prototype.forEachDependentsOf = function(services, iterator, cb){
  try{
    var edges = this.dependentsEdges(services);
  }catch(err){
    return cb(err);
  }
  this.forEachNode(services, edges, iterator, cb);
};

Compose.prototype.forEachNode = function(nodes, edges, iterator, cb){
  dag(edges, 10, iterator, function(err){
    if(err){
      return cb(err);
    }
    var edgesNodes = _.flatten(edges)
    var nodesNotCalled = _.difference(nodes, edgesNodes);
    async.forEach(nodesNotCalled, iterator, cb);
  });
};

Compose.prototype.ps = function(options, services, cb){
  var self = this;
  options = options || {};
  services = this.dependencies(services);
  async.map(services, function(service_name, cb){
    self.services[service_name].ps(options, cb);
  }, cb);
  return this;
};

Compose.prototype.create = function(options, services, cb){
  var self = this;
  options = options || {};

  this.forEachDependenciesOf(services, function(service_name, cb){
    self.services[service_name].create(options, cb);
  }, cb);
  return this;
};

Compose.prototype.start = function(options, services, cb){
  var self = this;
  options = options || {};
  this.forEachDependenciesOf(services, function(service_name, cb){
    self.services[service_name].start(options, cb);
  }, cb);
  return this;
};

Compose.prototype.stop = function(options, services, cb){
  var self = this;
  options = options || {};
  this.forEachDependentsOf(services, function(service_name, cb){
    self.services[service_name].stop(options, cb);
  }, cb);
  return this;
};

Compose.prototype.rm = function(options, services, cb){
  var self = this;
  options = options || {};
  this.forEachDependentsOf(services, function(service_name, cb){
    self.services[service_name].rm(options, cb);
  }, cb);
  return this;
};

Compose.prototype.up = function(options, services, cb){
  var self = this;
  self.create(options, services, function(err){
    if(err){
      return cb(err);
    }
    self.start(options, services, cb);
  });
  return this;
};
