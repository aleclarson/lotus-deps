
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

    mods = sync.filter mods, (mod) ->
      { dependencies } = mod.config
      return no unless isType dependencies, Object
      return has dependencies, moduleName

    if mods.length
      log.moat 1
      log.gray "Which modules depend on "
      log.yellow moduleName
      log.gray "?"
      log.plusIndent 2
      sync.each mods, (mod) ->
        log.moat 1
        log.white mod.name

    else
      log.moat 1
      log.gray "No modules depend on "
      log.yellow moduleName
      log.gray "."

    log.popIndent()
    log.moat 1

    process.exit()
