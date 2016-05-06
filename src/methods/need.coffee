
has = require "has"

core = require "../core"

module.exports = (options) ->

  moduleName = options._[2]

  unless isType moduleName, String
    log.moat 1
    log.red "Error: "
    log.white "Must provide a module name!"
    log.moat 1
    log.gray.dim "lotus deps need "
    log.gray "[moduleName]"
    log.moat 1
    process.exit()

  core.initModules lotus.path

  .then (modules) ->

    log.moat 1
    log.gray "Modules that depend on "
    log.white moduleName
    log.gray ": "
    log.moat 1

    log.plusIndent 2
    sync.each modules, (mod) ->
      { dependencies } = mod.config
      return unless isType dependencies, Object
      return unless has dependencies, moduleName
      log.moat 0
      log.yellow mod.name
    log.popIndent()

    process.exit()

  .done()
