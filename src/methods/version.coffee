
Promise = require "Promise"
Path = require "path"
sync = require "sync"
log = require "log"

module.exports = (options) ->

  if moduleName = options._.shift()
    return lotus.Module.load moduleName
    .then printVersion
    .then -> log.moat 1

  lotus.Module.crawl lotus.path
  .then (mods) ->
    Promise.chain mods, (module) ->
      return if lotus.isModuleIgnored module.name
      printVersion module
  .then ->
    log.moat 1
    log.green "Done!"
    log.moat 1

printVersion = (mod) ->

  mod.load [ "config" ]

  .then ->
    log.moat 0
    log.white mod.name
    log.green " " + mod.config.version
    log.moat 0
