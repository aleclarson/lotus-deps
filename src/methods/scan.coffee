
assertValidVersion = require "assertValidVersion"
emptyFunction = require "emptyFunction"
syncFs = require "io/sync"
prompt = require "prompt"
assert = require "assert"
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
    promise = parseDependencies mod

  else
    mods = Module.crawl lotus.path
    promise = sync.reduce mods, Q(), (promise, mod) ->
      promise.then -> parseDependencies mod

  promise
    .then ->
      log.moat 1
      log.green "Finished without errors!"
      log.moat 1
      process.exit()
    .done()

parseDependencies = (mod) ->
  mod.parseDependencies()
  .then -> printDependencies mod
  .fail (error) -> throwFailure error, { mod }

printDependencies = (mod) ->

  return unless mod.files
  return unless Object.keys(mod.files).length

  # The map of explicit dependencies in 'package.json'
  explicitDeps = mod.config.dependencies ?= {}

  # The list of implicit dependencies in 'package.json'
  implicitDeps = createImplicitMap mod

  # Absolute dependencies that were imported, but are not listed in 'package.json'
  unexpectedDeps = Object.create null

  # Relative dependencies that were imported, but do not exist
  missingDeps = Object.create null

  # Absolute dependencies that were imported and are already listed in 'package.json'
  foundDeps = Object.create null

  sync.each mod.files, (file) ->

    sync.each file.dependencies, (dep) ->

      if dep[0] is "."
        depPath = lotus.resolve dep, file.path
        return if depPath
        files = missingDeps[dep] ?= []
        files.push file
        return

      parts = dep.split "/"
      dep = parts[0] if parts.length

      if explicitDeps[dep] or implicitDeps[dep]
        files = foundDeps[dep] ?= []
        files.push file
        return

      files = unexpectedDeps[dep] ?= []
      files.push file

  # Absolute dependencies that are never imported.
  unusedDeps = Object.create null
  sync.each explicitDeps, (_, dep) ->
    return if foundDeps[dep]
    unusedDeps[dep] = yes

  unexpectedDepNames = Object.keys unexpectedDeps
  missingDepPaths = Object.keys missingDeps
  unusedDepNames = Object.keys unusedDeps

  hasIssues =
    (unexpectedDepNames.length > 0) or
    (missingDepPaths.length > 0) or
    (unusedDepNames.length > 0)

  log.moat 1
  log.bold mod.name
  log.plusIndent 2

  if hasIssues
    return Q.try ->
      printUnexpectedAbsolutes mod, unexpectedDepNames, unexpectedDeps
    .then ->
      printUnusedAbsolutes mod, unusedDepNames, implicitDeps
      printMissingRelatives mod, missingDepPaths, missingDeps
      log.popIndent()
      log.moat 1

  log.moat 1
  log.green.dim "All dependencies look correct!"
  log.popIndent()
  log.moat 1

printUnusedAbsolutes = (mod, depNames, implicitDeps) ->

  return unless depNames.length

  printResults "Unused absolutes: ", depNames

  { dependencies } = mod.config
  sync.each depNames, (depName) ->
    log.moat 1
    log.gray "Should we remove "
    log.yellow depName
    log.gray "?"
    return unless prompt.sync { parseBool: yes }
    if dependencies[depName]
      delete dependencies[depName]
    else delete implicitDeps[depName]

  mod.saveConfig()

printMissingRelatives = (mod, depNames, dependers) ->

  return unless depNames.length

  printResults "Missing relatives: ", depNames, (depName) ->
    log.plusIndent 2
    sync.each dependers[depName], (file) ->
      log.moat 0
      log.gray.dim Path.relative file.module.path, file.path
    log.popIndent()

printUnexpectedAbsolutes = (mod, depNames, dependers) ->

  return unless depNames.length

  printResults "Unexpected absolutes: ", depNames, (depName) ->
    log.plusIndent 2
    sync.each dependers[depName], (file) ->
      log.moat 0
      log.gray.dim Path.relative file.module.path, file.path
    log.popIndent()

  promise = Q()

  sync.each depNames, (depName) ->

    log.moat 1
    log.gray "Which version of "
    log.yellow depName
    log.gray " should be depended on?"

    version = prompt.sync()
    return if version is null

    if version is "."
      config = mod.config.lotus ?= {}
      implicitDeps = config.implicitDependencies ?= []
      implicitDeps.push depName
      implicitDeps.sort (a, b) -> a > b # sorted by ascending
      mod.saveConfig()
      return

    if version[0] is "#"
      user = lotus.config.github?.username
      assert user, "Must define 'github.username' in 'lotus.json' first!"
      version = user + "/" + depName + version

    if version[0] is "@"
      version = version.slice(1).split "#"
      version = version[0] + "/" + depName + "#" + version

    promise = promise.then ->

      assertValidVersion depName, version

      .then ->
        mod.config.dependencies[depName] = version
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

  return promise

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

createImplicitMap = (mod) ->
  results = Object.create null
  config = mod.config.lotus
  if config
    deps = config.implicitDependencies
    if Array.isArray deps
      results[dep] = yes for dep in deps
  return results
