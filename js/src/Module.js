var Promise, semver, sync;

Promise = require("Promise");

semver = require("node-semver");

sync = require("sync");

module.exports = function(type) {
  type.defineValues({
    _parsingDependencies: null
  });
  return type.defineMethods({
    parseDependencies: function(options) {
      if (!Promise.isRejected(this._parsingDependencies)) {
        return this._parsingDependencies;
      }
      return this._parsingDependencies = this.load(["config"]).then((function(_this) {
        return function() {
          return _this.crawl(options);
        };
      })(this)).then((function(_this) {
        return function() {
          return Promise.map(_this.files, function(file) {
            return file.parseDependencies();
          });
        };
      })(this));
    }
  });
};

//# sourceMappingURL=../../map/src/Module.map
