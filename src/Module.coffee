
semver = require "node-semver"

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
        Promise.all @files, (file) ->
          file.parseDependencies()
