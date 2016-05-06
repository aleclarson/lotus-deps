
inArray = require "in-array"
Builder = require "Builder"
syncFs = require "io/sync"
Finder = require "finder"
globby = require "globby"
JSON = require "json"
Path = require "path"
Q = require "q"

findRequire = Finder
  regex: /(\brequire\s*?\(\s*?)(['"])([^'"]+)(\2\s*?\))/g
  group: 3

knownErrors =

  readPackage: [
    "'package.json' could not be found!"
  ]

type = Builder()

type.defineMethods

  initModules: (modulesDir, options = {}) ->

    lotus.Module.crawl modulesDir

    .then (newModules) =>

      Q.all sync.map newModules, (mod) =>
        @initModule mod, options

      .then -> newModules

  initModule: (mod, options = {}) ->

    promises = []

    if options.skipConfig isnt yes

      promise = Q.try => @_readConfig mod

      promise = promise.fail (error) ->
        return if inArray knownErrors.readPackage, error.message
        log.moat 1
        log.red "Error: "
        log.white mod.name
        log.moat 0
        log.gray.dim error.stack
        log.moat 1

      promises.push promise

    if options.skipSourceFiles isnt yes

      promise = @_readSourceFiles mod

      if options.skipDependencies isnt yes
        promise = promise.then =>
          @_parseDeps mod

      promises.push promise

    Q.all promises

  saveConfig: (mod) ->
    return unless mod.config
    configPath = mod.path + "/package.json"
    json = JSON.stringify mod.config, null, 2
    syncFs.write configPath, json
    return

  _readConfig: (mod) ->

    configPath = mod.path + "/package.json"
    unless syncFs.isFile configPath
      throw Error "'package.json' could not be found!"

    json = syncFs.read configPath
    mod.config = JSON.parse json
    return

  _readSourceFiles: (mod) ->

    # TODO: Make this customizable in 'package.json'!
    srcPath = mod.path + "/js/src"

    unless syncFs.isDir srcPath
      srcPath = mod.path + "/src"

    globby srcPath + "/**/*.js"

    .then (paths) ->
      for path in paths
        lotus.File path, mod
      return

  _parseDeps: (mod) ->
    for path, file of mod.files
      file = lotus.File path, mod
      body = syncFs.read path
      file.deps = findRequire.all body
    return

module.exports = type.construct()
