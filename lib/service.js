var _ = require('lodash');
var debug = require('debug')('service');

var util = require('./util');
var docker = require('./docker');

module.exports = Service;

function Service(config, name, hash){
  this.config = config;
  this.name = name;
  this.hash = hash;
}

/*
 * Not supported
 * build 
  // env_file -> Env
 * 
 * TODO
 * extends
 */
Service.prototype.create = function(options, cb){
  // environment --> Env
  // expose -> ExposedPorts
  // ports -> ExposedPorts
  // labels --> labels (array, hash)
  // networks 
  // pid ?
  // ipc ?
  debug('%s configuration: %s', this.name, JSON.stringify(this.hash));
  hash = util.transform(this.hash, this.create.def);
  debug("Docker params: %s", JSON.stringify(hash));
  docker.createContainer(hash, cb);
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
  // environment --> Env
  // expose -> ExposedPorts
  // ports -> ExposedPorts
  // labels --> labels (array, hash)
  // networks 
  // pid ?
  // ipc ?
  debug('%s configuration: %s', this.name, JSON.stringify(this.hash));
  hash = util.transform(this.hash, this.create.def);
  debug("Docker params: %s", JSON.stringify(hash));
  docker.startContainer(hash, cb);
};
