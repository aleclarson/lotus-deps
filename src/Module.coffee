
sync = require "sync"
Q = require "q"

module.exports = (type) ->

  type.defineValues

    _parsingDependencies: null

  type.defineMethods

    parseDependencies: ->

      unless Q.isRejected @_parsingDependencies
        return @_parsingDependencies

      @_parsingDependencies = @load [ "config" ]

      .then =>

        unless @dest
          log.moat 1
          log.yellow "Warning: "
          log.white @name
          log.moat 0
          log.gray.dim "A valid 'dest' must exist before 'lotus-deps' can work!"
          log.moat 1
          return

        @crawl()

        .then =>
          Q.all sync.reduce @files, [], (promises, file) ->
            promises.push file.parseDependencies()
            return promises
