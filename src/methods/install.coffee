
# lotus deps install [moduleName]

# 1. Clear the 'node_modules' directory.
# 2. Install all remote deps.
# 3. Ignore local deps, unless an old version is needed (prompt if this happens).

Promise = require "Promise"
exec = require "exec"
fs = require "io"

module.exports = (options) ->

  modulePath = options._.shift()
  modulePath ?= "."

  modulePath = lotus.Module.resolvePath modulePath
  moduleName = lotus.relative modulePath
  mod = lotus.Module moduleName

  mod.load [ "config" ]

  .then ->

    deps =
      if options.dev then mod.config.devDependencies
      else mod.config.dependencies

    depNames = Object.keys deps

    Promise.chain depNames, (depName) ->
      fs.async.isDir lotus.path + "/" + depName
      .then (isLocal) ->
        if isLocal
          log.moat 1
          log.gray.dim "local dependency: "
          log.green depName
          log.moat 1
          return
        return if not semver.validRange deps[depName]
        fs.async.isDir mod.path + "/node_modules/" + depName
        .then (isInstalled) ->
          if isInstalled
            log.moat 1
            log.gray.dim "installed dependency: "
            log.green depName
            log.moat 1
            return
          dep = depName + "@" + deps[depName]
          log.moat 1
          log.white "npm install "
          log.yellow dep
          log.moat 1
          exec.async "npm install " + dep,
            cwd: mod.path
          .fail (error) ->
            return if /^npm WARN/.test error.message
            throw error
