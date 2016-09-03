
Promise = require "Promise"
semver = require "node-semver"
assert = require "assert"
isType = require "isType"

module.exports = (options) ->

  options.name = options._.shift()
  assert isType(options.name, String), "Missing dependency name!"

  options.version = options._.shift()
  assert isType(options.version, String), "Missing version!"

  if options.all
    return lotus.Module.crawl()
    .then (modules) ->
      Promise.map modules, (module) ->
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

      assert semver.validRange(newVersion), "'options.version' is not valid: '#{newVersion}'"

      if not newUsername.length
        newUsername = lotus.config.github?.username

      if oldVersion

        if 0 <= oldVersion.indexOf "#"
          oldVersion = deps[options.name].split("#")[1]

        if oldVersion is newVersion
          return

      assert newUsername.length, "Must provide username for git dependencies!"
      deps[options.name] = newUsername + "/" + options.name + "#" + newVersion

    else
      assert semver.validRange(options.version), "'options.version' is not valid: '#{options.version}'"
      deps[options.name] = options.version

    log.moat 1
    log.green.dim lotus.relative module.path + " { "
    log.white options.name + ": "
    log.yellow deps[options.name]
    oldVersion and log.gray " (prev: #{oldVersion})"
    log.green.dim " }"
    log.moat 1
    return if options.dry

    module.config[configKey] = deps
    module.saveConfig()

    # TODO: Re-install remote modules.
