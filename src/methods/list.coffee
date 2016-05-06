
has = require "has"

core = require "../core"

module.exports = (options) ->

  moduleName = options._[2]

  if moduleName
    mod = lotus.Module moduleName
    printDependencies mod
    return

  core.initModules lotus.path

  .then (modules) ->
    sync.each modules, (mod) ->
      printDependencies mod
    process.exit()

  .done()

printDependencies = (mod) ->

  unless mod.config
    log.moat 1
    log.gray "No config found."
    log.moat 1
    repl.sync { mod }
    return

  { dependencies } = mod.config
  unless dependencies
    log.moat 1
    log.gray "No dependencies found."
    log.moat 1
    return

  log.moat 1
  log.bold mod.name
  log.plusIndent 2
  sync.each dependencies, (version, dep) ->
    log.moat 0
    log.yellow dep
  log.popIndent()
  log.moat 1
