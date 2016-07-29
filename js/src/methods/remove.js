var Promise, assert, hasKeys, isType, removeDependency;

Promise = require("Promise");

hasKeys = require("hasKeys");

assert = require("assert");

isType = require("isType");

module.exports = function(options) {
  options.name = options._.shift();
  assert(isType(options.name, String), "Missing dependency name!");
  if (options.all) {
    return lotus.Module.crawl().then(function(modules) {
      return Promise.map(modules, function(module) {
        return removeDependency(module, options);
      });
    });
  }
  return lotus.Module.load(process.cwd()).then(function(module) {
    return removeDependency(module, options);
  });
};

removeDependency = function(module, options) {
  return module.load(["config"]).then(function() {
    var configKey, deps;
    configKey = options.dev ? "devDependencies" : "dependencies";
    deps = module.config[configKey];
    if (!(deps && deps[options.name])) {
      return;
    }
    log.moat(1);
    log.green.dim(lotus.relative(module.path + " { "));
    log.white(options.name + ": ");
    log.red(deps[options.name]);
    log.green.dim(" }");
    log.moat(1);
    if (options.dry) {
      return;
    }
    delete deps[options.name];
    if (!hasKeys(deps)) {
      delete module.config[configKey];
    }
    return module.saveConfig();
  });
};

//# sourceMappingURL=map/remove.map
