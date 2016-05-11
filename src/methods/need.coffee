
sync = require "sync"
has = require "has"
Q = require "q"

module.exports = (options) ->

  { Module } = lotus

  log.clear()

  moduleName = options._.shift()

  unless isType moduleName, String
    log.moat 1
    log.red "Error: "
    log.white "Must provide a module name!"
    log.moat 1
    log.gray.dim "lotus deps need "
    log.gray "[moduleName]"
    log.moat 1
    process.exit()

  mods = Module.crawl lotus.path

  Q.all sync.map mods, (mod) ->
    mod.load [ "config" ]

  .then ->

    deps = Object.create null
    sync.each mods, (mod) ->
      configDeps = mod.config.dependencies
      return unless isType configDeps, Object
      return unless has configDeps, moduleName
      deps[mod.name] = configDeps[moduleName]

    if Object.keys(deps).length
      log.moat 1
      log.gray "Which modules depend on "
      log.yellow moduleName
      log.gray "?"
      log.plusIndent 2
      sync.each deps, (version, depName) ->
        log.moat 1
        log.white depName
        log.gray.dim ": "
        log.gray version
      log.popIndent()
      log.moat 1

    else
      log.moat 1
      log.gray "No modules depend on "
      log.yellow moduleName
      log.gray "."
      log.moat 1

    process.exit()
