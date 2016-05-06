
emptyFunction = require "emptyFunction"
NODE_PATHS = require "node-paths"
inArray = require "in-array"
syncFs = require "io/sync"
prompt = require "prompt"
sync = require "sync"
Path = require "path"

core = require "../core"

module.exports = (options) ->

  modulePath = options._[2]

  if modulePath
    modulePath = resolveModulePath modulePath
    moduleName = Path.relative lotus.path, modulePath
    mod = lotus.Module moduleName
    core.initModule mod
    .then ->
      return if printDependencies mod
      log.moat 1
      log.bold mod.name
      log.plusIndent 2
      log.moat 1
      log.green.dim "All dependencies look correct!"
      log.moat 1
      log.popIndent()

  else
    core.initModules lotus.path
    .then (modules) ->
      sync.each modules, printDependencies
      process.exit()
    .done()

createImplicitMap = (mod) ->
  results = Object.create null
  config = mod.config.lotus
  if config
    deps = config.implicitDependencies
    if Array.isArray deps
      results[dep] = yes for dep in deps
  return results

saveImplicitDependency = (mod, dep) ->
  config = mod.config.lotus ?= {}
  implicit = config.implicitDependencies ?= []
  implicit.push dep
  implicit.sort (a, b) -> a > b # sorted by ascending
  return

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
    sync.each file.deps, (dep) ->

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
  return no unless unexpectedKeys.length or missingKeys.length or unusedKeys.length

  log.moat 1
  log.bold mod.name
  log.plusIndent 2

  if unusedKeys.length

    printResults "Unused absolutes: ", unusedKeys

    sync.each unusedKeys, (dep) ->
      log.moat 1
      log.gray "Should we remove "
      log.yellow dep
      log.gray "?"
      return unless prompt.sync { parseBool: yes }
      if explicit[dep] then delete explicit[dep]
      else implicit.splice implicit.indexOf(dep), 1
      core.saveConfig mod

  if unexpectedKeys.length

    printResults "Unexpected absolutes: ", unexpectedKeys, (dep) ->
      log.plusIndent 2
      sync.each unexpected[dep], (file) ->
        log.moat 0
        log.gray.dim Path.relative file.module.path, file.path
      log.popIndent()

    sync.each unexpectedKeys, (dep) ->
      log.moat 1
      log.gray "What version of "
      log.yellow dep
      log.gray " do we depend on?"
      log.gray.dim " (enter '.' to save implicitly)"
      result = prompt.sync()
      return unless result
      if result is "."
        saveImplicitDependency mod, dep
      else explicit[dep] = result
      core.saveConfig mod

  if missingKeys.length
    printResults "Missing relatives: ", missingKeys, (dep) ->
      log.plusIndent 2
      sync.each missing[dep], (file) ->
        log.moat 0
        log.gray.dim Path.relative file.module.path, file.path
      log.popIndent()

  log.popIndent()
  log.moat 1

  return yes

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

# TODO: Move this to 'lotus'
resolveModulePath = (modulePath) ->

  if modulePath[0] is "."
    modulePath = Path.relative process.cwd(), modulePath

  else if modulePath[0] isnt "/"
    modulePath = lotus.path + "/" + modulePath

  return modulePath
