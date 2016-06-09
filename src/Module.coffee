
Promise = require "Promise"
sync = require "sync"

module.exports = (type) ->

  type.defineValues

    _parsingDependencies: null

  type.defineMethods

    parseDependencies: ->

      unless Promise.isRejected @_parsingDependencies
        return @_parsingDependencies

      @_parsingDependencies = @load [ "config" ]
      .then => @crawl()
      .then =>
        Promise.map @files, (file) ->
          file.parseDependencies()
