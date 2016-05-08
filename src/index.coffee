
#
# [ TODO ]
#
#   1. Implement "adding/removing" individual deps.
#
#   2. Implement "replacing" a dep with a new version and/or alias.
#
#   3. Implement "reinstalling" all remote deps.
#
#   4. Implement seeing which deps can be updated.
#

exports.initCommands = ->
  deps: -> require "./cli"

exports.initModuleType = ->
  require "./Module"

exports.initFileType = ->
  require "./File"
