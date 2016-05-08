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
          if (!_this.dest) {
            log.moat(1);
            log.yellow("Warning: ");
            log.white(_this.name);
            log.moat(0);
            log.gray.dim("A valid 'dest' must exist before 'lotus-deps' can work!");
            log.moat(1);
            return;
          }
          return _this.crawl().then(function() {
            return Q.all(sync.reduce(_this.files, [], function(promises, file) {
              promises.push(file.parseDependencies());
              return promises;
            }));
          });
        };
      })(this));
    }
  });
};

//# sourceMappingURL=../../map/src/Module.map
