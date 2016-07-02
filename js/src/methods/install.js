var Promise, exec, fs;

Promise = require("Promise");

exec = require("exec");

fs = require("io");

module.exports = function(options) {
  var mod, moduleName, modulePath;
  modulePath = options._.shift();
  if (modulePath == null) {
    modulePath = ".";
  }
  modulePath = lotus.Module.resolvePath(modulePath);
  moduleName = lotus.relative(modulePath);
  mod = lotus.Module(moduleName);
  return mod.load(["config"]).then(function() {
    var depNames, deps;
    deps = options.dev ? mod.config.devDependencies : mod.config.dependencies;
    depNames = Object.keys(deps);
    return Promise.chain(depNames, function(depName) {
      return fs.async.isDir(lotus.path + "/" + depName).then(function(isLocal) {
        if (isLocal) {
          log.moat(1);
          log.gray.dim("local dependency: ");
          log.green(depName);
          log.moat(1);
          return;
        }
        if (!semver.validRange(deps[depName])) {
          return;
        }
        return fs.async.isDir(mod.path + "/node_modules/" + depName).then(function(isInstalled) {
          var dep;
          if (isInstalled) {
            log.moat(1);
            log.gray.dim("installed dependency: ");
            log.green(depName);
            log.moat(1);
            return;
          }
          dep = depName + "@" + deps[depName];
          log.moat(1);
          log.white("npm install ");
          log.yellow(dep);
          log.moat(1);
          return exec.async("npm install " + dep, {
            cwd: mod.path
          }).fail(function(error) {
            if (/^npm WARN/.test(error.message)) {
              return;
            }
            throw error;
          });
        });
      });
    });
  });
};

//# sourceMappingURL=../../../map/src/methods/install.map
