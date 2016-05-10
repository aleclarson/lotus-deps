var Finder, Q, assert, assertType, exec, fetch, findTagName, inArray, isType, ref, semver;

ref = require("type-utils"), isType = ref.isType, assert = ref.assert, assertType = ref.assertType;

fetch = require("fetch").fetch;

inArray = require("in-array");

semver = require("node-semver");

Finder = require("finder");

exec = require("exec");

Q = require("q");

findTagName = Finder({
  regex: "<span class=\"tag-name\">([^\<]+)<\/span>",
  group: 1
});

module.exports = Q.fbind(function(depName, version) {
  var ref1, ref2, repoName, tagName, userName;
  assertType(depName, String);
  assertType(version, String);
  if (0 <= version.indexOf("/")) {
    ref1 = version.split("/"), userName = ref1[0], repoName = ref1[1];
    assert(userName.length, "Invalid version format!");
    assert(repoName.length, "Invalid version format!");
    if (0 <= repoName.indexOf("#")) {
      ref2 = repoName.split("#"), repoName = ref2[0], tagName = ref2[1];
      return fetch("https://github.com/" + userName + "/" + repoName + "/tags").then(function(res) {
        var tagNames;
        if (res._bodyText === "{\"error\":\"Not Found\"}") {
          throw Error("Github repository does not exist!");
        }
        tagNames = findTagName.all(res._bodyText);
        return inArray(tagNames, tagName);
      });
    }
    return fetch("https://github.com/" + userName + "/" + repoName).then(function(res) {
      if (res._bodyText === "{\"error\":\"Not Found\"}") {
        throw Error("Github repository does not exist!");
      }
      return true;
    });
  }
  return exec("npm view " + depName + " --json").then(function(stdout) {
    var versions;
    versions = JSON.parse(stdout).versions;
    if (semver.validRange(version)) {
      version = semver.maxSatisfying(versions, version);
      return version !== null;
    }
    if (semver.valid(version)) {
      return inArray(versions, version);
    }
    throw Error("Invalid version format!");
  });
});

//# sourceMappingURL=../../../map/src/helpers/isValidVersion.map
