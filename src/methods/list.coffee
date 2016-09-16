
Path = require "path"
sync = require "sync"
log = require "log"

module.exports = (options) ->

  if moduleName = options._.shift()
    return lotus.Module.load moduleName
    .then (module) ->
      module.parseDependencies()
      .then -> printDependencies module

  lotus.Module.crawl lotus.path
  .then (mods) ->
    Promise.chain mods, (module) ->
      return if lotus.isModuleIgnored module.name
      module.parseDependencies()
      .then -> printDependencies module
  .then ->
    log.moat 1
    log.green "Done!"
    log.moat 1

printDependencies = (mod) ->

  absolutes = Object.create null
  relatives = Object.create null

  sync.each mod.files, (file) ->
    sync.each file.dependencies, (path) ->

      if path[0] is "."
        path = lotus.resolve path, file.path
        files = relatives[path] ?= []
      else
        files = absolutes[path] ?= []

      files.push file

  absolutePaths = Object.keys absolutes
  return unless absolutePaths.length

  # Sort alphabetically.
  absolutePaths.sort (a, b) ->
    a = a.toLowerCase()
    b = b.toLowerCase()
    if a > b then 1
    else if a < b then -1
    else 0

  log.moat 1
  log.gray "Which modules does "
  log.yellow mod.name
  log.gray " depend on?"
  log.plusIndent 2
  sync.each absolutePaths, (path) ->
    log.moat 1
    log.white path
    log.plusIndent 2
    sync.each absolutes[path], (file) ->
      log.moat 0
      log.gray.dim Path.relative file.module.path, file.path
    log.popIndent()
  log.popIndent()
  log.moat 1

  # TODO: Support printing the 'relatives'.
