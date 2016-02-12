var _ = require('lodash');

var util = require('./util');
var docker = require('./docker');

exports.Service = Service;

function Service(config, hash){
  this.config = config;
  this.hash = hash;
}

/*
 * Not supported
 * build 
 * 
 * TODO
 * extends
 */
function.prototype.create(options, cb){
  // env_file -> Env
  // environment --> Env
  // expose -> ExposedPorts
  // ports -> ExposedPorts
  // labels --> labels (array, hash)
  // networks 
  // pid ?
  // ipc ?
  hash = util.transform(this.create.def, options)
  docker.createContainer(hash, cb)
}

function.prototype.create.def = {
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
}
