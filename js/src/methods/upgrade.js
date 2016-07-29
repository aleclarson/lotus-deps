var Promise, assert, isType, semver, upgradeDependency;

Promise = require("Promise");

semver = require("node-semver");

assert = require("assert");

isType = require("isType");

module.exports = function(options) {
  options.name = options._.shift();
  assert(isType(options.name, String), "Missing dependency name!");
  options.version = options._.shift();
  assert(isType(options.version, String), "Missing version!");
  if (options.all) {
    return lotus.Module.crawl().then(function(modules) {
      return Promise.map(modules, function(module) {
        return upgradeDependency(module, options);
      });
    });
  }
  options.force = true;
  return lotus.Module.load(process.cwd()).then(function(module) {
    return upgradeDependency(module, options);
  });
};

upgradeDependency = function(module, options) {
  return module.load(["config"]).then(function() {
    var configKey, deps, newUsername, newVersion, oldVersion, ref, ref1;
    configKey = options.dev ? "devDependencies" : "dependencies";
    deps = module.config[configKey];
    if (!isType(deps, Object)) {
      deps = {};
    }
    oldVersion = deps[options.name];
    if (!(oldVersion || options.force)) {
      return;
    }
    if (0 <= options.version.indexOf(":")) {
      ref = options.version.split(":"), newUsername = ref[0], newVersion = ref[1];
      assert(semver.validRange(newVersion), "'options.version' is not valid: '" + newVersion + "'");
      if (!newUsername.length) {
        newUsername = (ref1 = lotus.config.github) != null ? ref1.username : void 0;
      }
      if (oldVersion) {
        if (0 <= oldVersion.indexOf("#")) {
          oldVersion = deps[options.name].split("#")[1];
        }
      }
      assert(newUsername.length, "Must provide username for git dependencies!");
      deps[options.name] = newUsername + "/" + options.name + "#" + newVersion;
    } else {
      assert(semver.validRange(options.version), "'options.version' is not valid: '" + options.version + "'");
      deps[options.name] = options.version;
    }
    log.moat(1);
    log.green.dim(lotus.relative(module.path + " { "));
    log.white(options.name + ": ");
    log.yellow(deps[options.name]);
    oldVersion && log.gray(" (prev: " + oldVersion + ")");
    log.green.dim(" }");
    log.moat(1);
    if (options.dry) {
      return;
    }
    module.config[configKey] = deps;
    return module.saveConfig();
  });
};

//# sourceMappingURL=map/upgrade.map
