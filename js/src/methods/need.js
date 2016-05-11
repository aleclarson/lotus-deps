var Q, has, sync;

sync = require("sync");

has = require("has");

Q = require("q");

module.exports = function(options) {
  var Module, mods, moduleName;
  Module = lotus.Module;
  log.clear();
  moduleName = options._.shift();
  if (!isType(moduleName, String)) {
    log.moat(1);
    log.red("Error: ");
    log.white("Must provide a module name!");
    log.moat(1);
    log.gray.dim("lotus deps need ");
    log.gray("[moduleName]");
    log.moat(1);
    process.exit();
  }
  mods = Module.crawl(lotus.path);
  return Q.all(sync.map(mods, function(mod) {
    return mod.load(["config"]);
  })).then(function() {
    var deps;
    deps = Object.create(null);
    sync.each(mods, function(mod) {
      var configDeps;
      configDeps = mod.config.dependencies;
      if (!isType(configDeps, Object)) {
        return;
      }
      if (!has(configDeps, moduleName)) {
        return;
      }
      return deps[mod.name] = configDeps[moduleName];
    });
    if (Object.keys(deps).length) {
      log.moat(1);
      log.gray("Which modules depend on ");
      log.yellow(moduleName);
      log.gray("?");
      log.plusIndent(2);
      sync.each(deps, function(version, depName) {
        log.moat(1);
        log.white(depName);
        log.gray.dim(": ");
        return log.gray(version);
      });
      log.popIndent();
      log.moat(1);
    } else {
      log.moat(1);
      log.gray("No modules depend on ");
      log.yellow(moduleName);
      log.gray(".");
      log.moat(1);
    }
    return process.exit();
  });
};

//# sourceMappingURL=../../../map/src/methods/need.map
