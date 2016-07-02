
Promise = require "Promise"
semver = require "node-semver"
sync = require "sync"

module.exports = (type) ->

  type.defineValues

    _parsingDependencies: null

  type.defineMethods

    parseDependencies: (options) ->

      unless Promise.isRejected @_parsingDependencies
        return @_parsingDependencies

      @_parsingDependencies = @load [ "config" ]

      .then =>
        @crawl options

      .then =>
        Promise.map @files, (file) ->
          file.parseDependencies()
