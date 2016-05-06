
# TODO
#
#   1. Add the ability to remove deps entirely.
#
#   2. Add the ability to replace a dep with a new version and/or alias.
#
#   3. Add the ability to reinstall all deps.
#
#   4. Add the ability to find unused deps.
#
#   5. Add the ability to see the deps of every module in a list.
#
#   6. Add the ability to see all modules that have a specific dep.
#
#   7. Add the ability to see which modules have deps with new versions.
#

module.exports = ->

  @commands.deps = ->

    methodName = process.options._[1]

    unless isType methodName, String
      log.moat 1
      log.red "Error: "
      log.white "Must provide a method name!"
      log.moat 1
      log.gray.dim "lotus deps "
      log.gray "[methodName]"
      log.moat 1
      process.exit()

    modulePath = __dirname + "/methods/" + methodName

    if lotus.exists modulePath

      method = require modulePath

      if isType method,Function
        method process.options

      else
        log.moat 1
        log.white "Method must return function: "
        log.red "'#{modulePath}'"
        log.moat 1
        process.exit()

    else
      log.moat 1
      log.white "Unrecognized method: "
      log.red "'" + (methodName or "") + "'"
      log.moat 1
      process.exit()

  return null
