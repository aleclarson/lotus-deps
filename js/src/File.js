var Finder, Q, syncFs;

syncFs = require("io/sync");

Finder = require("finder");

Q = require("q");

module.exports = function(type) {
  var findRequire;
  findRequire = Finder({
    regex: /(\brequire\s*?\(\s*?)(['"])([^'"]+)(\2\s*?\))/g,
    group: 3
  });
  type.defineValues({
    _parsingDependencies: null
  });
  return type.defineMethods({
    parseDependencies: function() {
      if (!Q.isRejected(this._parsingDependencies)) {
        return this._parsingDependencies;
      }
      return this._parsingDependencies = this.read().then((function(_this) {
        return function(contents) {
          return _this.dependencies = findRequire.all(contents);
        };
      })(this));
    }
  });
};

//# sourceMappingURL=../../map/src/File.map
