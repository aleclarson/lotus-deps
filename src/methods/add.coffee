
# lotus deps add [moduleName] [version]

# 1. Unless --force is used, fail gracefully if the 'moduleName'
#    is already inside the 'package.json'
#
# 2. Warn if the given 'version' is out-of-date.
#
# 3. Throw if the given 'version' does not exist remotely or locally.
#
# 4. Prompt to see if a remote dependency should be downloaded or not.
