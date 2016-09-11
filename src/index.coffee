
#
# [ TODO ]
#
#   1. Implement "reinstalling" all remote deps.
#
#   2. Implement seeing which deps can be updated.
#

exports.initCommands = ->
  deps: -> require "./cli"

exports.initModuleType = ->
  require "./Module"

exports.initFileType = ->
  require "./File"
