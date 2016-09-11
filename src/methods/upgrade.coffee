
semver = require "node-semver"
isType = require "isType"
exec = require "exec"
path = require "path"
fs = require "io/sync"

module.exports = (options) ->

  options.name = options._.shift()
  if not isType options.name, String
    log.warn "Must provide a module name:\n  lotus deps upgrade [module-name] 1.0.0"
    return process.exit()

  options.version = options._.shift()
  if not isType options.version, String
    log.warn "Must provide a version:\n  lotus deps upgrade [module-name] 1.0.0"
    return process.exit()

  if options.all
    return lotus.Module.crawl()
    .then (modules) ->
      Promise.all modules, (module) ->
        upgradeDependency module, options

  options.force = yes
  lotus.Module.load process.cwd()
  .then (module) ->
    upgradeDependency module, options

upgradeDependency = (module, options) ->

  module.load [ "config" ]

  .then ->

    configKey =
      if options.dev then "devDependencies"
      else "dependencies"

    deps = module.config[configKey]
    deps = {} if not isType deps, Object

    oldVersion = deps[options.name]
    return unless oldVersion or options.force

    if 0 <= options.version.indexOf ":"

      [newUsername, newVersion] = options.version.split ":"

      if not semver.validRange newVersion
        log.warn "Invalid version: " + newVersion
        return process.exit()

      if not newUsername.length
        newUsername = lotus.config.github?.username

      if oldVersion

        if 0 <= oldVersion.indexOf "#"
          oldVersion = deps[options.name].split("#")[1]

        if oldVersion is newVersion
          log.warn "You passed the current version!"
          return process.exit()

        if semver.gt oldVersion, newVersion
          log.warn "Current version (#{oldVersion}) greater than new version (#{newVersion})!"
          return process.exit()

      if not newUsername.length
        log.warn "Must provide username for git dependencies!"
        return process.exit()

      newVersion = newUsername + "/" + options.name + "#" + newVersion

    else
      newVersion = options.version
      if not semver.validRange newVersion
        log.warn "'Invalid version: " + newVersion
        return process.exit()

    log.moat 1
    log.white options.name + ": "
    if oldVersion
      log.gray oldVersion
      log.white " -> "
    log.yellow newVersion
    log.moat 1

    return if options.dry
    deps[options.name] = newVersion
    module.config[configKey] = deps
    module.saveConfig()

    installedPath = path.join module.path, "node_modules", options.name
    return if fs.exists installedPath

    # Install remote dependencies.
    if newUsername and newVersion.startsWith newUsername
      log.moat 1
      log.white "Installing remote dependency: "
      log.green options.name
      log.moat 1
      try exec.sync "npm install #{options.name}", cwd: module.path
      catch error
         throw error unless /WARN/.test error.message

    else
      globalPath = path.join process.env.HOME, "lib/node_modules"
      if fs.exists globalPath
        log.warn "Directory does not exist: " + log.color.red globalPath
        return process.exit()

      # Ensure the 'node_modules' dir exists.
      fs.makeDir depJson.path + "/node_modules"

      log.moat 1
      log.white "Linking local dependency: "
      log.green options.name
      log.moat 1
      exec.sync "ln -s #{globalPath} #{installedPath}"
      return
