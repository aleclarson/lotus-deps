
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
      .then => @crawl()
      .then =>
        # Q.map @files, (file) ->
        #   file.parseDependencies
        Q.all sync.reduce @files, [], (promises, file) ->
          promises.push file.parseDependencies()
          return promises
