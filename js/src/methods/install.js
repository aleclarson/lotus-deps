var Promise, exec, fs, semver;

Promise = require("Promise");

semver = require("node-semver");

exec = require("exec");

fs = require("io");

module.exports = function(options) {
  return lotus.Module.load(options._.shift() || ".").then(function(module) {
    return module.load(["config"]).then(function() {
      var depNames, deps;
      deps = options.dev ? module.config.devDependencies : module.config.dependencies;
      depNames = Object.keys(deps);
      return Promise.chain(depNames, function(depName) {
        return fs.async.isDir(lotus.path + "/" + depName).then(function(isLocal) {
          if (isLocal) {
            log.moat(1);
            log.gray.dim("local: ");
            log.cyan(depName);
            log.moat(1);
            return;
          }
          if (!semver.validRange(deps[depName])) {
            return;
          }
          return fs.async.isDir(module.path + "/node_modules/" + depName).then(function(isInstalled) {
            var dep;
            if (isInstalled) {
              log.moat(1);
              log.gray.dim("installed: ");
              log.yellow(depName);
              log.moat(1);
              return;
            }
            dep = depName + "@" + deps[depName];
            log.moat(1);
            log.gray.dim("installing: ");
            log.green(dep);
            log.moat(1);
            return exec.async("npm install " + dep, {
              cwd: module.path
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
  });
};

//# sourceMappingURL=map/install.map
