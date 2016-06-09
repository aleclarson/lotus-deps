var Path, Promise, log, printDependencies, sync;

Promise = require("Promise");

Path = require("path");

sync = require("sync");

log = require("log");

module.exports = function(options) {
  var Module, mod, mods, moduleName, modulePath;
  Module = lotus.Module;
  log.clear();
  modulePath = options._.shift();
  if (modulePath) {
    modulePath = Module.resolvePath(modulePath);
    moduleName = Path.basename(modulePath);
    mod = Module(moduleName);
    return mod.parseDependencies().then(function() {
      return printDependencies(mod);
    });
  }
  mods = Module.crawl(lotus.path);
  return Promise.chain(mods, function(mod) {
    return mod.parseDependencies().then(function() {
      return printDependencies(mod);
    });
  });
};

printDependencies = function(mod) {
  var absolutePaths, absolutes, relatives;
  absolutes = Object.create(null);
  relatives = Object.create(null);
  sync.each(mod.files, function(file) {
    return sync.each(file.dependencies, function(path) {
      var files;
      if (path[0] === ".") {
        path = lotus.resolve(file.path, path);
        files = relatives[path] != null ? relatives[path] : relatives[path] = [];
      } else {
        files = absolutes[path] != null ? absolutes[path] : absolutes[path] = [];
      }
      return files.push(file);
    });
  });
  absolutePaths = Object.keys(absolutes);
  if (!absolutePaths.length) {
    return;
  }
  absolutePaths.sort(function(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (a > b) {
      return 1;
    } else if (a < b) {
      return -1;
    } else {
      return 0;
    }
  });
  log.moat(1);
  log.gray("Which modules does ");
  log.yellow(mod.name);
  log.gray(" depend on?");
  log.plusIndent(2);
  sync.each(absolutePaths, function(path) {
    log.moat(1);
    log.white(path);
    log.plusIndent(2);
    sync.each(absolutes[path], function(file) {
      log.moat(0);
      return log.gray.dim(Path.relative(file.module.path, file.path));
    });
    return log.popIndent();
  });
  log.popIndent();
  return log.moat(1);
};

//# sourceMappingURL=../../../map/src/methods/list.map
