var core, has;

has = require("has");

core = require("../core");

module.exports = function(options) {
  var moduleName;
  moduleName = options._[2];
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
  return core.initModules(lotus.path).then(function(modules) {
    log.moat(1);
    log.gray("Modules that depend on ");
    log.white(moduleName);
    log.gray(": ");
    log.moat(1);
    log.plusIndent(2);
    sync.each(modules, function(mod) {
      var dependencies;
      dependencies = mod.config.dependencies;
      if (!isType(dependencies, Object)) {
        return;
      }
      if (!has(dependencies, moduleName)) {
        return;
      }
      log.moat(0);
      return log.yellow(mod.name);
    });
    log.popIndent();
    return process.exit();
  }).done();
};

//# sourceMappingURL=../../../map/src/methods/need.map
