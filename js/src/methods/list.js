var core, has, printDependencies;

has = require("has");

core = require("../core");

module.exports = function(options) {
  var mod, moduleName;
  moduleName = options._[2];
  if (moduleName) {
    mod = lotus.Module(moduleName);
    printDependencies(mod);
    return;
  }
  return core.initModules(lotus.path).then(function(modules) {
    sync.each(modules, function(mod) {
      return printDependencies(mod);
    });
    return process.exit();
  }).done();
};

printDependencies = function(mod) {
  var dependencies;
  if (!mod.config) {
    log.moat(1);
    log.gray("No config found.");
    log.moat(1);
    repl.sync({
      mod: mod
    });
    return;
  }
  dependencies = mod.config.dependencies;
  if (!dependencies) {
    log.moat(1);
    log.gray("No dependencies found.");
    log.moat(1);
    return;
  }
  log.moat(1);
  log.bold(mod.name);
  log.plusIndent(2);
  sync.each(dependencies, function(version, dep) {
    log.moat(0);
    return log.yellow(dep);
  });
  log.popIndent();
  return log.moat(1);
};

//# sourceMappingURL=../../../map/src/methods/list.map
