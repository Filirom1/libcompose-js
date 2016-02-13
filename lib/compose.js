var yaml = require('js-yaml');
var async = require('async');
var _ = require('lodash');
var DepGraph = require('dependency-graph').DepGraph;
var debug = require('debug')('compose');

var Service = require('./service');

exports.Compose = Compose;

function Compose(config){
  this.config = config;
  this.config.projectName = this.config.projectName.toLowerCase().replace(/[^a-z\d]/g, '');
}

Compose.prototype.parse = function(str){
  var self = this;
  var obj = yaml.safeLoad(str);
  self.services = {};
  _(obj.services).forEach(function(hash, key){
    self.services[key] = new Service(self.config, key, hash);
  });
  return this;
};

Compose.prototype.dependencies = function(services){
  var self = this;
  services = services || _(this.services).keys();

  var graph = new DepGraph();
  _(services).forEach(function(serviceName){
    graph.addNode(serviceName);
    var links = self.services[serviceName].hash.links || [];
    var dependsOn = self.services[serviceName].hash.depends_on || [];
    
    _.concat(links, dependsOn).forEach(function(link){
      var service = link.split(':')[0];
      graph.addNode(service);
      graph.addDependency(serviceName, service);
    });
  });

  var array =  graph.overallOrder();
  debug('dependencies ordered: %s', array.join(', '));
  return array;
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
  services = this.dependencies(services);
  async.mapSeries(services, function(service_name, cb){
    self.services[service_name].create(options, cb);
  }, cb);
  return this;
};

Compose.prototype.start = function(options, services, cb){
  var self = this;
  options = options || {};
  services = this.dependencies(services);
  async.mapSeries(services, function(service_name, cb){
    self.services[service_name].start(options, cb);
  }, cb);
  return this;
};

Compose.prototype.stop = function(options, services, cb){
  var self = this;
  options = options || {};
  services = this.dependencies(services);
  async.mapSeries(services.reverse(), function(service_name, cb){
    self.services[service_name].stop(options, cb);
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
