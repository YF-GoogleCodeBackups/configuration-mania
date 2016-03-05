module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jpm_option: {
      binary: grunt.option('binary') || process.env.FIREFOX_BIN || "/usr/bin/firefox",
      forceAOM: true
    }
  });

  grunt.registerTask('run', function () {
    var done = this.async();
    var jpm_utils = require("jpm/lib/utils");
    var jpm_run = require("jpm/lib/run");

    var getManifest = jpm_utils.getManifest();
    getManifest.then(function(manifest) {
      return jpm_run(manifest, grunt.config.data.jpm_option);
    }).then(done);
  });
  grunt.registerTask('xpi', function () {
    var done = this.async();
    var jpm_utils = require("jpm/lib/utils");
    var jpm_xpi = require("jpm/lib/xpi");

    var start = Date.now();

    var getManifest = jpm_utils.getManifest();
    getManifest.then(function(manifest) {
      return jpm_xpi(manifest, grunt.config.data.jpm_option);
    }).then(function(xpiPath) {
      var diff = Date.now() - start;
      console.log("Successfully created XPI at " + xpiPath.replace(process.cwd(), ".") + " (" + diff + "ms)");
    }).catch(function(err) {
      console.log("Failed to creating XPI " + err);
      done(false);
    }).then(done);
  });
  grunt.registerTask('clean', function () {
    grunt.file.expand(["*.xpi"]).forEach(function (v) {
      grunt.file.delete(v);
    });
  });
  grunt.registerTask('default', ['xpi']);
};
