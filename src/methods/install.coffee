
# lotus deps install [moduleName]

# 1. Clear the 'node_modules' directory.
# 2. Install all remote deps.
# 3. Ignore local deps, unless an old version is needed (prompt if this happens).

Promise = require "Promise"
semver = require "node-semver"
exec = require "exec"
fs = require "io"

module.exports = (options) ->

  lotus.Module.load options._.shift() or "."

  .then (module) ->

    module.load [ "config" ]

    .then ->

      deps =
        if options.dev then module.config.devDependencies
        else module.config.dependencies

      depNames = Object.keys deps

      Promise.chain depNames, (depName) ->

        fs.async.isDir lotus.path + "/" + depName
        .then (isLocal) ->

          if isLocal
            log.moat 1
            log.gray.dim "local: "
            log.cyan depName
            log.moat 1
            return

          return if not semver.validRange deps[depName]

          fs.async.isDir module.path + "/node_modules/" + depName
          .then (isInstalled) ->

            if isInstalled
              log.moat 1
              log.gray.dim "installed: "
              log.yellow depName
              log.moat 1
              return

            dep = depName + "@" + deps[depName]

            log.moat 1
            log.gray.dim "installing: "
            log.green dep
            log.moat 1

            exec.async "npm install " + dep,
              cwd: module.path

            .fail (error) ->
              return if /^npm WARN/.test error.message
              throw error
