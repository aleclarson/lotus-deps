
Promise = require "Promise"
Finder = require "finder"
syncFs = require "io/sync"

module.exports = (type) ->

  findRequire = Finder
    regex: /(\brequire\s*?\(\s*?)(['"])([^'"]+)(\2\s*?\))/g
    group: 3

  type.defineValues

    _parsingDependencies: null

  type.defineMethods

    parseDependencies: ->

      unless Promise.isRejected @_parsingDependencies
        return @_parsingDependencies

      @_parsingDependencies = @read()
      .then (contents) =>
        @dependencies = findRequire.all contents
        return
