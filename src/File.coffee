
syncFs = require "io/sync"
Finder = require "finder"
Q = require "q"

module.exports = (type) ->

  findRequire = Finder
    regex: /(\brequire\s*?\(\s*?)(['"])([^'"]+)(\2\s*?\))/g
    group: 3

  type.defineValues

    _parsingDependencies: null

  type.defineMethods

    parseDependencies: ->

      unless Q.isRejected @_parsingDependencies
        return @_parsingDependencies

      @_parsingDependencies = @read()
      .then (contents) =>
        @dependencies = findRequire.all contents
        return
