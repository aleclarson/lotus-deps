var Builder, Finder, JSON, Path, Q, findRequire, globby, inArray, knownErrors, syncFs, type;

inArray = require("in-array");

Builder = require("Builder");

syncFs = require("io/sync");

Finder = require("finder");

globby = require("globby");

JSON = require("json");

Path = require("path");

Q = require("q");

findRequire = Finder({
  regex: /(\brequire\s*?\(\s*?)(['"])([^'"]+)(\2\s*?\))/g,
  group: 3
});

knownErrors = {
  readPackage: ["'package.json' could not be found!"]
};

type = Builder();

type.defineMethods({
  initModules: function(modulesDir, options) {
    if (options == null) {
      options = {};
    }
    return lotus.Module.crawl(modulesDir).then((function(_this) {
      return function(newModules) {
        return Q.all(sync.map(newModules, function(mod) {
          return _this.initModule(mod, options);
        })).then(function() {
          return newModules;
        });
      };
    })(this));
  },
  initModule: function(mod, options) {
    var promise, promises;
    if (options == null) {
      options = {};
    }
    promises = [];
    if (options.skipConfig !== true) {
      promise = Q["try"]((function(_this) {
        return function() {
          return _this._readConfig(mod);
        };
      })(this));
      promise = promise.fail(function(error) {
        if (inArray(knownErrors.readPackage, error.message)) {
          return;
        }
        log.moat(1);
        log.red("Error: ");
        log.white(mod.name);
        log.moat(0);
        log.gray.dim(error.stack);
        return log.moat(1);
      });
      promises.push(promise);
    }
    if (options.skipSourceFiles !== true) {
      promise = this._readSourceFiles(mod);
      if (options.skipDependencies !== true) {
        promise = promise.then((function(_this) {
          return function() {
            return _this._parseDeps(mod);
          };
        })(this));
      }
      promises.push(promise);
    }
    return Q.all(promises);
  },
  saveConfig: function(mod) {
    var configPath, json;
    if (!mod.config) {
      return;
    }
    configPath = mod.path + "/package.json";
    json = JSON.stringify(mod.config, null, 2);
    syncFs.write(configPath, json);
  },
  _readConfig: function(mod) {
    var configPath, json;
    configPath = mod.path + "/package.json";
    if (!syncFs.isFile(configPath)) {
      throw Error("'package.json' could not be found!");
    }
    json = syncFs.read(configPath);
    mod.config = JSON.parse(json);
  },
  _readSourceFiles: function(mod) {
    var srcPath;
    srcPath = mod.path + "/js/src";
    if (!syncFs.isDir(srcPath)) {
      srcPath = mod.path + "/src";
    }
    return globby(srcPath + "/**/*.js").then(function(paths) {
      var i, len, path;
      for (i = 0, len = paths.length; i < len; i++) {
        path = paths[i];
        lotus.File(path, mod);
      }
    });
  },
  _parseDeps: function(mod) {
    var body, file, path, ref;
    ref = mod.files;
    for (path in ref) {
      file = ref[path];
      file = lotus.File(path, mod);
      body = syncFs.read(path);
      file.deps = findRequire.all(body);
    }
  }
});

module.exports = type.construct();

//# sourceMappingURL=../../map/src/core.map
