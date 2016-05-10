exports.initCommands = function() {
  return {
    deps: function() {
      return require("./cli");
    }
  };
};

exports.initModuleType = function() {
  return require("./Module");
};

exports.initFileType = function() {
  return require("./File");
};

//# sourceMappingURL=../../map/src/index.map