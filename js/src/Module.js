var Q, sync;

sync = require("sync");

Q = require("q");

module.exports = function(type) {
  type.defineValues({
    _parsingDependencies: null
  });
  return type.defineMethods({
    parseDependencies: function() {
      if (!Q.isRejected(this._parsingDependencies)) {
        return this._parsingDependencies;
      }
      return this._parsingDependencies = this.load(["config"]).then((function(_this) {
        return function() {
          return _this.crawl();
        };
      })(this)).then((function(_this) {
        return function() {
          return Q.all(sync.reduce(_this.files, [], function(promises, file) {
            promises.push(file.parseDependencies());
            return promises;
          }));
        };
      })(this));
    }
  });
};

//# sourceMappingURL=../../map/src/Module.map
