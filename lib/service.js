var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('lodash');
var debug = require('debug')('service');
var async = require('async');

var utilities = require('./util');
var docker = require('./docker');

module.exports = Service;

var FALSE = "False";
var LABEL_ONEOFF="com.docker.compose.oneoff";
var LABEL_PROJECT="com.docker.compose.project";
var LABEL_SERVICE="com.docker.compose.service";

function Service(config, name, hash){
  this.config = config;
  this.name = name;
  this.hash = hash;
  this.fullName = this.config.projectName + "_" + this.name;
  EventEmitter.call(this);
}

util.inherits(Service, EventEmitter);

Service.prototype.ps = function(options, cb){
  debug('service ps: %j', options);
  labels = { };
  labels[LABEL_ONEOFF] = false;
  labels[LABEL_PROJECT + "=" + this.config.projectName] = true;
  labels[LABEL_SERVICE + "=" + this.name] = true;

  docker.listContainers({
    all: true,
    limit: -1,
    filters: {
      label: labels
    }
  }, cb);
};

/*
 * Not supported
 * build 
  // env_file -> Env
 * 
 * TODO
 * extends
 */
Service.prototype.create = function(options, cb){
  debug('service %s create: %j', this.namen, options);
  var self = this;
  // environment --> Env
  // expose -> ExposedPorts
  // ports -> ExposedPorts
  // networks 
  // pid ?
  // ipc ?
  this.ps({}, function(err, containers){
    if(err){
      return cb(err);
    }
    if(containers.length){
      return cb();
    }
    self.emit('log', 'Creating ' + 'TODO')
    debug('container create %s, configuration: %j', self.name, self.hash);
    dockerParams = utilities.transform(self.hash, self.create.def);

    // labels (array, hash) --> Labels (hash)
    dockerParams.Labels = {};
    if(_.isArray(self.hash.labels)){
      _.forEach(self.hash.labels, function(el){
        var kv = el.split('=');
        dockerParams.Labels[kv[0]] = kv[1];
      });
    }
    if(_.isObject(self.hash.labels)){
      dockerParams.Labels = self.hash.labels;
    }
    dockerParams.Labels[LABEL_ONEOFF] = FALSE;
    dockerParams.Labels[LABEL_PROJECT] = self.config.projectName;
    dockerParams.Labels[LABEL_SERVICE] = self.name;
		// TODO
		//"com.docker.compose.config-hash": "6c3856fe9b41acbf91a24ce17376b23b683c4110ac3cd138f62b8b04ff9efe9b",
		//"com.docker.compose.container-number": "1",
		//"com.docker.compose.version": "1.6.0"

    // cmd (string) -> Cmd (Array)
    if(_.isString(dockerParams.Cmd)){
      dockerParams.Cmd = dockerParams.Cmd.split(' ');
    }

    debug("container docker params: %j", dockerParams);
    docker.createContainer(dockerParams, function(err, containerInfo){
      if(err){
        return cb(err);
      }
      docker.getContainer(containerInfo.id).inspect(cb);
    });
  });
};

Service.prototype.create.def = {
  cap_add: 'HostConfig.CapAdd',
  cap_drop: 'HostConfig.CapDrop',
  command: 'Cmd',
  container_name: 'name',
  cgroup_parent: 'HostConfig.CgroupParent',
  devices: 'HostConfig.Devices',
  dns: 'HostConfig.Dns',
  dns_search: 'HostConfig.DnsSearch',
  entrypoint: 'Entrypoint',
  extra_hosts: 'HostConfig.ExtraHosts',
  image: 'Image',
  links: 'HostConfig.Links',
  'logging.driver': 'LogConfig.Type',
  'logging.options': 'LogConfig.Config',
  network_mode: 'HostConfig.NetworkMode',
  security_opt: 'HostConfig.SecurityOpt',
  stop_signal: 'StopSignal',
  ulimits: 'HostConfig.Ulimits',
  volumes: 'HostConfig.Binds',
  volume_driver: 'HostConfig.VolumeDriver',
  volumes_from: 'HostConfig.VolumesFrom',
  cpu_shares: 'HostConfig.CpuShares',
  cpu_quota: 'HostConfig.CpuQuota',
  cpuset: 'HostConfig.CpusetCpus',
  domainname: 'Domainname',
  hostname: 'Hostname',
  mac_address: 'MacAddress',
  mem_limit: 'HostConfig.Memory',
  memswap_limit: 'HostConfig.MemorySwap',
  privileged: 'HostConfig.Privileged',
  read_only: 'HostConfig.ReadonlyRootfs',
  restart: 'HostConfig.RestartPolicy.Name',
  stdin_open: 'OpenStdin',
  tty: 'Tty',
  user: 'User',
  working_dir: 'WorkingDir'
};

Service.prototype.start = function(options, cb){
  debug('service %s start: %j', this.name, options);
  return cb()
  var self = this;
  this.ps({}, function(err, containers){
    if(err){
      return cb(err);
    }
    async.map(containers, function(containerInfo, cb){
      if(containerInfo.Status.match(/up /i)){
        return cb();
      }
      self.emit('log', 'Starting ' + containerInfo.Names[0].replace(/\//, ''))
      debug("container start: %s", containerInfo.Id);
      docker.getContainer(containerInfo.Id).start(function(err){
        if(err){
          return cb(err);
        }
        cb(null, containerInfo);
      });
    }, cb);
  });
};

Service.prototype.stop = function(options, cb){
  debug('service %s stop: %j', this.name, options);
  return cb()
  var self = this;
  this.ps({}, function(err, containers){
    if(err){
      return cb(err);
    }
    async.map(containers, function(containerInfo, cb){
      if(!containerInfo.Status.match(/up /i)){
        return cb();
      }
      self.emit('log', 'Stopping ' + containerInfo.Names[0].replace(/\//, ''))
      debug("conatiner stop: %s", containerInfo.Id);
      docker.getContainer(containerInfo.Id).stop({t: options.timeout}, function(err){
        if(err){
          return cb(err);
        }
        cb(null, containerInfo);
      });
    }, cb);
  });
};
