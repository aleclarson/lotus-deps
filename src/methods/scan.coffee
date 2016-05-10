
assertValidVersion = require "assertValidVersion"
emptyFunction = require "emptyFunction"
NODE_PATHS = require "node-paths"
inArray = require "in-array"
syncFs = require "io/sync"
prompt = require "prompt"
sync = require "sync"
Path = require "path"
Q = require "q"

module.exports = (options) ->

  { Module } = lotus

  log.clear()

  modulePath = options._.shift()

  if modulePath
    modulePath = Module.resolvePath modulePath
    moduleName = Path.relative lotus.path, modulePath
    mod = Module moduleName
    mod.parseDependencies()
    .then -> printDependencies mod
    .then -> process.exit()
    .done()

  else
    mods = Module.crawl lotus.path
    Q.all sync.map mods, (mod) ->
      mod.parseDependencies()
      .then -> printDependencies mod
    .then -> process.exit()
    .done()

createImplicitMap = (mod) ->
  results = Object.create null
  config = mod.config.lotus
  if config
    deps = config.implicitDependencies
    if Array.isArray deps
      results[dep] = yes for dep in deps
  return results

printDependencies = (mod) ->

  return no unless mod.files

  # The map of explicit dependencies in 'package.json'
  explicit = mod.config.dependencies ?= {}

  # The list of implicit dependencies in 'package.json'
  implicit = createImplicitMap mod

  # Absolute dependencies that were imported, but are not listed in 'package.json'
  unexpected = Object.create null

  # Relative dependencies that were imported, but do not exist
  missing = Object.create null

  # Absolute dependencies that were imported and are already listed in 'package.json'
  found = Object.create null

  sync.each mod.files, (file) ->

    sync.each file.dependencies, (dep) ->

      if dep[0] is "."
        depPath = lotus.resolve dep, file.path
        return if depPath
        files = missing[dep] ?= []
        files.push file
        return

      parts = dep.split "/"
      dep = parts[0] if parts.length

      if explicit[dep] or implicit[dep] or inArray(NODE_PATHS, dep)
        files = found[dep] ?= []
        files.push file
        return

      files = unexpected[dep] ?= []
      files.push file

  # Absolute dependencies that are never imported.
  unused = Object.create null
  sync.each explicit, (_, dep) ->
    return if found[dep]
    unused[dep] = yes

  unexpectedKeys = Object.keys unexpected
  missingKeys = Object.keys missing
  unusedKeys = Object.keys unused

  hasIssues =
    (unexpectedKeys.length > 0) or
    (missingKeys.length > 0) or
    (unusedKeys.length > 0)

  log.moat 1
  log.bold mod.name
  log.plusIndent 2

  if hasIssues
    promise = printUnexpectedAbsolutes mod, unexpectedKeys, unexpected, explicit
    printUnusedAbsolutes mod, unusedKeys, explicit, implicit
    printMissingRelatives mod, missingKeys, missing

  else
    log.moat 1
    log.green.dim "All dependencies look correct!"
    promise = Q()

  log.popIndent()
  log.moat 1

  return promise

printUnusedAbsolutes = (mod, depNames, explicit, implicit) ->

  return unless depNames.length

  printResults "Unused absolutes: ", depNames

  sync.each depNames, (depName) ->
    log.moat 1
    log.gray "Should we remove "
    log.yellow depName
    log.gray "?"
    return unless prompt.sync { parseBool: yes }
    if explicit[depName] then delete explicit[depName]
    else delete implicit[depName]
    mod.saveConfig()

printMissingRelatives = (mod, depNames, dependers) ->

  return unless depNames.length

  printResults "Missing relatives: ", depNames, (depName) ->
    log.plusIndent 2
    sync.each dependers[depName], (file) ->
      log.moat 0
      log.gray.dim Path.relative file.module.path, file.path
    log.popIndent()

printUnexpectedAbsolutes = (mod, depNames, dependers, explicit) ->

  return Q() unless depNames.length

  printResults "Unexpected absolutes: ", depNames, (depName) ->
    log.plusIndent 2
    sync.each dependers[depName], (file) ->
      log.moat 0
      log.gray.dim Path.relative file.module.path, file.path
    log.popIndent()

  return Q.all sync.map depNames, (depName) ->

    log.moat 1
    log.gray "What version of "
    log.yellow depName
    log.gray " do we depend on?"
    log.gray.dim " (enter '.' to save implicitly)"

    version = prompt.sync()
    return if version is null

    assertValidVersion depName, version

    .then ->

      if version isnt "."
        explicit[depName] = version

      else
        config = mod.config.lotus ?= {}
        implicit = config.implicitDependencies ?= []
        implicit.push depName
        implicit.sort (a, b) -> a > b # sorted by ascending

      mod.saveConfig()

    .fail (error) ->
      failure = Failure error
      log.moat 1
      log.red error.constructor.name + ": "
      log.white error.message
      log.gray.dim " { key: '#{depName}', value: '#{version}' }"
      if error.format isnt "simple"
        log.moat 1
        log.plusIndent 2
        log.gray.dim Failure(error).stacks.format()
        log.popIndent()
      log.moat 1

printResults = (title, deps, iterator = emptyFunction) ->

  log.moat 1
  log.yellow title
  log.plusIndent 2

  for dep in deps
    log.moat 1
    log.white dep
    log.moat 0
    iterator dep
    log.moat 1

  log.popIndent()
  log.moat 1
