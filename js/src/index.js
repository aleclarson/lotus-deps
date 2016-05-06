module.exports = function() {
  this.commands.deps = function() {
    var method, methodName, modulePath;
    methodName = process.options._[1];
    if (!isType(methodName, String)) {
      log.moat(1);
      log.red("Error: ");
      log.white("Must provide a method name!");
      log.moat(1);
      log.gray.dim("lotus deps ");
      log.gray("[methodName]");
      log.moat(1);
      process.exit();
    }
    modulePath = __dirname + "/methods/" + methodName;
    if (lotus.exists(modulePath)) {
      method = require(modulePath);
      if (isType(method, Function)) {
        return method(process.options);
      } else {
        log.moat(1);
        log.white("Method must return function: ");
        log.red("'" + modulePath + "'");
        log.moat(1);
        return process.exit();
      }
    } else {
      log.moat(1);
      log.white("Unrecognized method: ");
      log.red("'" + (methodName || "") + "'");
      log.moat(1);
      return process.exit();
    }
  };
  return null;
};

//# sourceMappingURL=../../map/src/index.map
