var NODE_PATHS, Path, Q, assertValidVersion, createImplicitMap, emptyFunction, inArray, printDependencies, printMissingRelatives, printResults, printUnexpectedAbsolutes, printUnusedAbsolutes, prompt, sync, syncFs;

assertValidVersion = require("assertValidVersion");

emptyFunction = require("emptyFunction");

NODE_PATHS = require("node-paths");

inArray = require("in-array");

syncFs = require("io/sync");

prompt = require("prompt");

sync = require("sync");

Path = require("path");

Q = require("q");

module.exports = function(options) {
  var Module, mod, mods, moduleName, modulePath;
  Module = lotus.Module;
  log.clear();
  modulePath = options._.shift();
  if (modulePath) {
    modulePath = Module.resolvePath(modulePath);
    moduleName = Path.relative(lotus.path, modulePath);
    mod = Module(moduleName);
    return mod.parseDependencies().then(function() {
      return printDependencies(mod);
    }).then(function() {
      return process.exit();
    }).done();
  } else {
    mods = Module.crawl(lotus.path);
    return Q.all(sync.map(mods, function(mod) {
      return mod.parseDependencies().then(function() {
        return printDependencies(mod);
      });
    })).then(function() {
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

printDependencies = function(mod) {
  var base, explicit, found, hasIssues, implicit, missing, missingKeys, promise, unexpected, unexpectedKeys, unused, unusedKeys;
  if (!mod.files) {
    return false;
  }
  explicit = (base = mod.config).dependencies != null ? base.dependencies : base.dependencies = {};
  implicit = createImplicitMap(mod);
  unexpected = Object.create(null);
  missing = Object.create(null);
  found = Object.create(null);
  sync.each(mod.files, function(file) {
    return sync.each(file.dependencies, function(dep) {
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
  hasIssues = (unexpectedKeys.length > 0) || (missingKeys.length > 0) || (unusedKeys.length > 0);
  log.moat(1);
  log.bold(mod.name);
  log.plusIndent(2);
  if (hasIssues) {
    promise = printUnexpectedAbsolutes(mod, unexpectedKeys, unexpected, explicit);
    printUnusedAbsolutes(mod, unusedKeys, explicit, implicit);
    printMissingRelatives(mod, missingKeys, missing);
  } else {
    log.moat(1);
    log.green.dim("All dependencies look correct!");
    promise = Q();
  }
  log.popIndent();
  log.moat(1);
  return promise;
};

printUnusedAbsolutes = function(mod, depNames, explicit, implicit) {
  if (!depNames.length) {
    return;
  }
  printResults("Unused absolutes: ", depNames);
  return sync.each(depNames, function(depName) {
    log.moat(1);
    log.gray("Should we remove ");
    log.yellow(depName);
    log.gray("?");
    if (!prompt.sync({
      parseBool: true
    })) {
      return;
    }
    if (explicit[depName]) {
      delete explicit[depName];
    } else {
      delete implicit[depName];
    }
    return mod.saveConfig();
  });
};

printMissingRelatives = function(mod, depNames, dependers) {
  if (!depNames.length) {
    return;
  }
  return printResults("Missing relatives: ", depNames, function(depName) {
    log.plusIndent(2);
    sync.each(dependers[depName], function(file) {
      log.moat(0);
      return log.gray.dim(Path.relative(file.module.path, file.path));
    });
    return log.popIndent();
  });
};

printUnexpectedAbsolutes = function(mod, depNames, dependers, explicit) {
  if (!depNames.length) {
    return Q();
  }
  printResults("Unexpected absolutes: ", depNames, function(depName) {
    log.plusIndent(2);
    sync.each(dependers[depName], function(file) {
      log.moat(0);
      return log.gray.dim(Path.relative(file.module.path, file.path));
    });
    return log.popIndent();
  });
  return Q.all(sync.map(depNames, function(depName) {
    var version;
    log.moat(1);
    log.gray("What version of ");
    log.yellow(depName);
    log.gray(" do we depend on?");
    log.gray.dim(" (enter '.' to save implicitly)");
    version = prompt.sync();
    if (version === null) {
      return;
    }
    return assertValidVersion(depName, version).then(function() {
      var base, config, implicit;
      if (version !== ".") {
        explicit[depName] = version;
      } else {
        config = (base = mod.config).lotus != null ? base.lotus : base.lotus = {};
        implicit = config.implicitDependencies != null ? config.implicitDependencies : config.implicitDependencies = [];
        implicit.push(depName);
        implicit.sort(function(a, b) {
          return a > b;
        });
      }
      return mod.saveConfig();
    }).fail(function(error) {
      var failure;
      failure = Failure(error);
      log.moat(1);
      log.red(error.constructor.name + ": ");
      log.white(error.message);
      log.gray.dim(" { key: '" + depName + "', value: '" + version + "' }");
      if (error.format !== "simple") {
        log.moat(1);
        log.plusIndent(2);
        log.gray.dim(Failure(error).stacks.format());
        log.popIndent();
      }
      return log.moat(1);
    });
  }));
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

//# sourceMappingURL=../../../map/src/methods/scan.map
