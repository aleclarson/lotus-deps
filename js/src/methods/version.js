var Path, Promise, log, printVersion, sync;

Promise = require("Promise");

Path = require("path");

sync = require("sync");

log = require("log");

module.exports = function(options) {
  var moduleName;
  if (moduleName = options._.shift()) {
    return lotus.Module.load(moduleName).then(printVersion).then(function() {
      return log.moat(1);
    });
  }
  return lotus.Module.crawl(lotus.path).then(function(mods) {
    return Promise.chain(mods, function(module) {
      if (lotus.isModuleIgnored(module.name)) {
        return;
      }
      return printVersion(module);
    });
  }).then(function() {
    log.moat(1);
    log.green("Done!");
    return log.moat(1);
  });
};

printVersion = function(mod) {
  return mod.load(["config"]).then(function() {
    log.moat(0);
    log.white(mod.name);
    log.green(" " + mod.config.version);
    return log.moat(0);
  });
};

//# sourceMappingURL=map/version.map
