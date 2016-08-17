var Path, Promise, assert, assertValidVersion, createImplicitMap, emptyFunction, has, log, parseBool, parseDependencies, printDependencies, printMissingRelatives, printResults, printUnexpectedAbsolutes, printUnusedAbsolutes, prompt, sync, syncFs;

assertValidVersion = require("assertValidVersion");

emptyFunction = require("emptyFunction");

parseBool = require("parse-bool");

Promise = require("Promise");

syncFs = require("io/sync");

prompt = require("prompt");

assert = require("assert");

sync = require("sync");

Path = require("path");

log = require("log");

has = require("has");

module.exports = function(options) {
  var moduleName;
  if (moduleName = options._.shift()) {
    return lotus.Module.load(moduleName).then(parseDependencies);
  }
  return lotus.Module.crawl(lotus.path).then(function(mods) {
    return Promise.chain(mods, parseDependencies);
  });
};

parseDependencies = function(mod) {
  if (lotus.isModuleIgnored(mod.name)) {
    return;
  }
  return mod.parseDependencies({
    ignore: "**/{node_modules,__tests__}/**"
  }).then(function() {
    return printDependencies(mod);
  });
};

printDependencies = function(mod) {
  var base, explicitDeps, foundDeps, implicitDeps, missingDepPaths, missingDeps, unexpectedDepNames, unexpectedDeps, unusedDepNames, unusedDeps;
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
  if (!(unexpectedDepNames.length || missingDepPaths.length || unusedDepNames.length)) {
    return;
  }
  log.moat(1);
  log.bold(mod.name);
  log.plusIndent(2);
  return Promise["try"](function() {
    return printUnexpectedAbsolutes(mod, unexpectedDepNames, unexpectedDeps);
  }).then(function() {
    printUnusedAbsolutes(mod, unusedDepNames, implicitDeps);
    printMissingRelatives(mod, missingDepPaths, missingDeps);
    log.popIndent();
    return log.moat(1);
  });
};

printUnusedAbsolutes = function(mod, depNames, implicitDeps) {
  var dependencies;
  if (!depNames.length) {
    return;
  }
  printResults("Unused absolutes: ", depNames);
  dependencies = mod.config.dependencies;
  return Promise.chain(depNames, function(depName) {
    var shouldRemove;
    log.moat(1);
    log.gray("Should ");
    log.yellow(depName);
    log.gray(" be removed?");
    try {
      shouldRemove = prompt.sync();
    } catch (error1) {}
    if (shouldRemove === "s") {
      throw Error("skip dependency");
    }
    shouldRemove = parseBool(shouldRemove);
    if (!shouldRemove) {
      return;
    }
    if (has(dependencies, depName)) {
      return delete dependencies[depName];
    } else {
      return delete implicitDeps[depName];
    }
  }).fail(function(error) {
    if (error.message === "skip dependency") {
      return;
    }
    log.moat(1);
    log.red(error.stack);
    log.moat(1);
    throw error;
  }).then(function() {
    log.moat(1);
    log.green("Done!");
    log.moat(1);
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

printUnexpectedAbsolutes = function(mod, depNames, dependers) {
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
  return Promise.chain(depNames, function(depName) {
    var base, config, implicitDeps, ref, ref1, username, version;
    log.moat(1);
    log.gray("Which version of ");
    log.yellow(depName);
    log.gray(" should be depended on?");
    try {
      version = prompt.sync();
    } catch (error1) {}
    if (version == null) {
      return;
    }
    if (version === "s") {
      throw Error("skip dependency");
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
    if (0 <= version.indexOf(":")) {
      ref = version.split(":"), username = ref[0], version = ref[1];
      if (!username.length) {
        username = (ref1 = lotus.config.github) != null ? ref1.username : void 0;
      }
      assert(username.length, "Must provide a username for git dependencies!");
      version = username + "/" + depName + "#" + version;
    }
    return assertValidVersion(depName, version).then(function() {
      var base1;
      if ((base1 = mod.config).dependencies == null) {
        base1.dependencies = {};
      }
      mod.config.dependencies[depName] = version;
      return mod.saveConfig();
    }).fail(function(error) {
      log.moat(1);
      log.gray.dim("{ depName: ");
      log.white(depName);
      log.gray.dim(", version: ");
      log.white(version);
      log.gray.dim(" }");
      log.moat(0);
      log.red(error.stack);
      return log.moat(1);
    });
  }).fail(function(error) {
    if (error.message === "skip dependency") {
      return;
    }
    throw error;
  });
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

//# sourceMappingURL=map/scan.map
