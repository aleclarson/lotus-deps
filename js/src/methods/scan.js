var NODE_PATHS, Path, core, createImplicitMap, emptyFunction, inArray, printDependencies, printResults, prompt, resolveModulePath, saveImplicitDependency, sync, syncFs;

emptyFunction = require("emptyFunction");

NODE_PATHS = require("node-paths");

inArray = require("in-array");

syncFs = require("io/sync");

prompt = require("prompt");

sync = require("sync");

Path = require("path");

core = require("../core");

module.exports = function(options) {
  var mod, moduleName, modulePath;
  modulePath = options._[2];
  if (modulePath) {
    modulePath = resolveModulePath(modulePath);
    moduleName = Path.relative(lotus.path, modulePath);
    mod = lotus.Module(moduleName);
    return core.initModule(mod).then(function() {
      if (printDependencies(mod)) {
        return;
      }
      log.moat(1);
      log.bold(mod.name);
      log.plusIndent(2);
      log.moat(1);
      log.green.dim("All dependencies look correct!");
      log.moat(1);
      return log.popIndent();
    });
  } else {
    return core.initModules(lotus.path).then(function(modules) {
      sync.each(modules, printDependencies);
      return process.exit();
    }).done();
  }
};

createImplicitMap = function(mod) {
  var config, dep, deps, i, len, results;
  results = Object.create(null);
  config = mod.config.lotus;
  if (config) {
    deps = config.implicitDependencies;
    if (Array.isArray(deps)) {
      for (i = 0, len = deps.length; i < len; i++) {
        dep = deps[i];
        results[dep] = true;
      }
    }
  }
  return results;
};

saveImplicitDependency = function(mod, dep) {
  var base, config, implicit;
  config = (base = mod.config).lotus != null ? base.lotus : base.lotus = {};
  implicit = config.implicitDependencies != null ? config.implicitDependencies : config.implicitDependencies = [];
  implicit.push(dep);
  implicit.sort(function(a, b) {
    return a > b;
  });
};

printDependencies = function(mod) {
  var base, explicit, found, implicit, missing, missingKeys, unexpected, unexpectedKeys, unused, unusedKeys;
  if (!mod.files) {
    return false;
  }
  explicit = (base = mod.config).dependencies != null ? base.dependencies : base.dependencies = {};
  implicit = createImplicitMap(mod);
  unexpected = Object.create(null);
  missing = Object.create(null);
  found = Object.create(null);
  sync.each(mod.files, function(file) {
    return sync.each(file.deps, function(dep) {
      var depPath, files, parts;
      if (dep[0] === ".") {
        depPath = lotus.resolve(dep, file.path);
        if (depPath) {
          return;
        }
        files = missing[dep] != null ? missing[dep] : missing[dep] = [];
        files.push(file);
        return;
      }
      parts = dep.split("/");
      if (parts.length) {
        dep = parts[0];
      }
      if (explicit[dep] || implicit[dep] || inArray(NODE_PATHS, dep)) {
        files = found[dep] != null ? found[dep] : found[dep] = [];
        files.push(file);
        return;
      }
      files = unexpected[dep] != null ? unexpected[dep] : unexpected[dep] = [];
      return files.push(file);
    });
  });
  unused = Object.create(null);
  sync.each(explicit, function(_, dep) {
    if (found[dep]) {
      return;
    }
    return unused[dep] = true;
  });
  unexpectedKeys = Object.keys(unexpected);
  missingKeys = Object.keys(missing);
  unusedKeys = Object.keys(unused);
  if (!(unexpectedKeys.length || missingKeys.length || unusedKeys.length)) {
    return false;
  }
  log.moat(1);
  log.bold(mod.name);
  log.plusIndent(2);
  if (unusedKeys.length) {
    printResults("Unused absolutes: ", unusedKeys);
    sync.each(unusedKeys, function(dep) {
      log.moat(1);
      log.gray("Should we remove ");
      log.yellow(dep);
      log.gray("?");
      if (!prompt.sync({
        parseBool: true
      })) {
        return;
      }
      if (explicit[dep]) {
        delete explicit[dep];
      } else {
        implicit.splice(implicit.indexOf(dep), 1);
      }
      return core.saveConfig(mod);
    });
  }
  if (unexpectedKeys.length) {
    printResults("Unexpected absolutes: ", unexpectedKeys, function(dep) {
      log.plusIndent(2);
      sync.each(unexpected[dep], function(file) {
        log.moat(0);
        return log.gray.dim(Path.relative(file.module.path, file.path));
      });
      return log.popIndent();
    });
    sync.each(unexpectedKeys, function(dep) {
      var result;
      log.moat(1);
      log.gray("What version of ");
      log.yellow(dep);
      log.gray(" do we depend on?");
      log.gray.dim(" (enter '.' to save implicitly)");
      result = prompt.sync();
      if (!result) {
        return;
      }
      if (result === ".") {
        saveImplicitDependency(mod, dep);
      } else {
        explicit[dep] = result;
      }
      return core.saveConfig(mod);
    });
  }
  if (missingKeys.length) {
    printResults("Missing relatives: ", missingKeys, function(dep) {
      log.plusIndent(2);
      sync.each(missing[dep], function(file) {
        log.moat(0);
        return log.gray.dim(Path.relative(file.module.path, file.path));
      });
      return log.popIndent();
    });
  }
  log.popIndent();
  log.moat(1);
  return true;
};

printResults = function(title, deps, iterator) {
  var dep, i, len;
  if (iterator == null) {
    iterator = emptyFunction;
  }
  log.moat(1);
  log.yellow(title);
  log.plusIndent(2);
  for (i = 0, len = deps.length; i < len; i++) {
    dep = deps[i];
    log.moat(1);
    log.white(dep);
    log.moat(0);
    iterator(dep);
    log.moat(1);
  }
  log.popIndent();
  return log.moat(1);
};

resolveModulePath = function(modulePath) {
  if (modulePath[0] === ".") {
    modulePath = Path.relative(process.cwd(), modulePath);
  } else if (modulePath[0] !== "/") {
    modulePath = lotus.path + "/" + modulePath;
  }
  return modulePath;
};

//# sourceMappingURL=../../../map/src/methods/scan.map
