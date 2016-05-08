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
    mods = sync.filter(mods, function(mod) {
      var dependencies;
      dependencies = mod.config.dependencies;
      if (!isType(dependencies, Object)) {
        return false;
      }
      return has(dependencies, moduleName);
    });
    if (mods.length) {
      log.moat(1);
      log.gray("Which modules depend on ");
      log.yellow(moduleName);
      log.gray("?");
      log.plusIndent(2);
      sync.each(mods, function(mod) {
        log.moat(1);
        return log.white(mod.name);
      });
    } else {
      log.moat(1);
      log.gray("No modules depend on ");
      log.yellow(moduleName);
      log.gray(".");
    }
    log.popIndent();
    log.moat(1);
    return process.exit();
  });
};

//# sourceMappingURL=../../../map/src/methods/need.map
