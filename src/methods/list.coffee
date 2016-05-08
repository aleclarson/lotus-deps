
Path = require "path"
sync = require "sync"
Q = require "q"

module.exports = (options) ->

  { Module } = lotus

  log.clear()

  moduleName = options._.shift()

  if moduleName

    if moduleName[0] is "."
      moduleName = Path.resolve process.cwd(), moduleName[0]

    if moduleName[0] is "/"
      moduleName = Path.relative lotus.path, moduleName

    mod = Module moduleName

    printDependencies mod

    .then -> process.exit()

    .done()

    return

  mods = Module.crawl lotus.path

  Q.all sync.map mods, (mod) ->
    printDependencies mod

  .then -> process.exit()

  .done()

printDependencies = (mod) ->

  mod.parseDependencies()

  .then ->

    absolutes = Object.create null
    relatives = Object.create null

    sync.each mod.files, (file) ->

      sync.each file.dependencies, (path) ->

        if path[0] is "."
          path = lotus.resolve file.path, path
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
