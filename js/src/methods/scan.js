var Failure, Path, Q, assert, assertValidVersion, createImplicitMap, emptyFunction, has, log, parseDependencies, printDependencies, printMissingRelatives, printResults, printUnexpectedAbsolutes, printUnusedAbsolutes, prompt, sync, syncFs, throwFailure;

throwFailure = (Failure = require("failure")).throwFailure;

assertValidVersion = require("assertValidVersion");

emptyFunction = require("emptyFunction");

syncFs = require("io/sync");

prompt = require("prompt");

assert = require("assert");

sync = require("sync");

Path = require("path");

log = require("log");

has = require("has");

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
    return parseDependencies(mod);
  }
  mods = Module.crawl(lotus.path);
  return sync.reduce(mods, Q(), function(promise, mod) {
    return promise.then(function() {
      return parseDependencies(mod);
    });
  });
};

parseDependencies = function(mod) {
  return mod.parseDependencies().then(function() {
    return printDependencies(mod);
  }).fail(function(error) {
    return throwFailure(error, {
      mod: mod
    });
  });
};

printDependencies = function(mod) {
  var base, explicitDeps, foundDeps, hasIssues, implicitDeps, missingDepPaths, missingDeps, unexpectedDepNames, unexpectedDeps, unusedDepNames, unusedDeps;
  if (!mod.files) {
    return;
  }
  if (!Object.keys(mod.files).length) {
    return;
  }
  explicitDeps = (base = mod.config).dependencies != null ? base.dependencies : base.dependencies = {};
  implicitDeps = createImplicitMap(mod);
  unexpectedDeps = Object.create(null);
  missingDeps = Object.create(null);
  foundDeps = Object.create(null);
  sync.each(mod.files, function(file) {
    return sync.each(file.dependencies, function(dep) {
      var depPath, files, parts;
      if (dep[0] === ".") {
        depPath = lotus.resolve(dep, file.path);
        if (depPath) {
          return;
        }
        files = missingDeps[dep] != null ? missingDeps[dep] : missingDeps[dep] = [];
        files.push(file);
        return;
      }
      parts = dep.split("/");
      if (parts.length) {
        dep = parts[0];
      }
      if (explicitDeps[dep] || implicitDeps[dep]) {
        files = foundDeps[dep] != null ? foundDeps[dep] : foundDeps[dep] = [];
        files.push(file);
        return;
      }
      files = unexpectedDeps[dep] != null ? unexpectedDeps[dep] : unexpectedDeps[dep] = [];
      return files.push(file);
    });
  });
  unusedDeps = Object.create(null);
  sync.each(explicitDeps, function(_, dep) {
    if (foundDeps[dep]) {
      return;
    }
    return unusedDeps[dep] = true;
  });
  unexpectedDepNames = Object.keys(unexpectedDeps);
  missingDepPaths = Object.keys(missingDeps);
  unusedDepNames = Object.keys(unusedDeps);
  hasIssues = (unexpectedDepNames.length > 0) || (missingDepPaths.length > 0) || (unusedDepNames.length > 0);
  log.moat(1);
  log.bold(mod.name);
  log.plusIndent(2);
  if (hasIssues) {
    return Q["try"](function() {
      return printUnexpectedAbsolutes(mod, unexpectedDepNames, unexpectedDeps);
    }).then(function() {
      printUnusedAbsolutes(mod, unusedDepNames, implicitDeps);
      printMissingRelatives(mod, missingDepPaths, missingDeps);
      log.popIndent();
      return log.moat(1);
    });
  }
  log.moat(1);
  log.green.dim("All dependencies look correct!");
  log.popIndent();
  return log.moat(1);
};

printUnusedAbsolutes = function(mod, depNames, implicitDeps) {
  var dependencies;
  if (!depNames.length) {
    return;
  }
  printResults("Unused absolutes: ", depNames);
  dependencies = mod.config.dependencies;
  sync.each(depNames, function(depName) {
    var shouldRemove;
    log.moat(1);
    log.gray("Should we remove ");
    log.yellow(depName);
    log.gray("?");
    try {
      shouldRemove = prompt.sync({
        parseBool: true
      });
    } catch (error1) {}
    if (!shouldRemove) {
      return;
    }
    if (has(dependencies, depName)) {
      return delete dependencies[depName];
    } else {
      return delete implicitDeps[depName];
    }
  });
  return mod.saveConfig();
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

printUnexpectedAbsolutes = function(mod, depNames, dependers) {
  var promise;
  if (!depNames.length) {
    return;
  }
  printResults("Unexpected absolutes: ", depNames, function(depName) {
    log.plusIndent(2);
    sync.each(dependers[depName], function(file) {
      log.moat(0);
      return log.gray.dim(Path.relative(file.module.path, file.path));
    });
    return log.popIndent();
  });
  promise = Q();
  sync.each(depNames, function(depName) {
    var base, config, error, implicitDeps, ref, user, version;
    log.moat(1);
    log.gray("Which version of ");
    log.yellow(depName);
    log.gray(" should be depended on?");
    try {
      version = prompt.sync();
    } catch (error1) {
      error = error1;
      throwFailure(error, {
        mod: mod,
        depName: depName
      });
    }
    if (version == null) {
      return;
    }
    if (version === ".") {
      config = (base = mod.config).lotus != null ? base.lotus : base.lotus = {};
      implicitDeps = config.implicitDependencies != null ? config.implicitDependencies : config.implicitDependencies = [];
      implicitDeps.push(depName);
      implicitDeps.sort(function(a, b) {
        return a > b;
      });
      mod.saveConfig();
      return;
    }
    if (version[0] === "#") {
      user = (ref = lotus.config.github) != null ? ref.username : void 0;
      assert(user, "Must define 'github.username' in 'lotus.json' first!");
      version = user + "/" + depName + version;
    }
    if (version[0] === "@") {
      version = version.slice(1).split("#");
      version = version[0] + "/" + depName + "#" + version;
    }
    return promise = promise.then(function() {
      return assertValidVersion(depName, version).then(function() {
        mod.config.dependencies[depName] = version;
        return mod.saveConfig();
      }).fail(function(error) {
        log.moat(1);
        log.gray.dim("depName = ");
        log.white(depName);
        log.moat(0);
        log.gray.dim("version = ");
        log.white(version);
        log.moat(0);
        log.red(error.constructor.name + ": ");
        log.white(error.message);
        if (error.format !== "simple") {
          log.moat(1);
          log.plusIndent(2);
          log.gray.dim(Failure(error).stacks.format());
          log.popIndent();
        }
        return log.moat(1);
      });
    });
  });
  return promise;
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

//# sourceMappingURL=../../../map/src/methods/scan.map
