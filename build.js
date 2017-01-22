#!/bin/env node

"use strict";

const FirefoxProfile = require("firefox-profile");
const FxRunner = require("fx-runner/lib/run");
const timer = require("timers");
const minimist = require("minimist");
const fs = require("fs");
const glob = require("glob");
const jszip = require("jszip");

const ARGV = minimist(process.argv.slice(2), {
  "string": ["firefox-binary", "output"],
  "boolean": ["help", "verbose"],
  "alias": {
    o: "output",
    f: "firefox-binary",
    v: "verbose",
    h: "help"
  }
});

const XPI_TARGET = {
  includes: [
    "*.rdf",
    "chrome.manifest",
    "bootstrap.js",
    "chrome/**/*.*",
    "lib/**/*",
//    "defaults/**/*",
  ],
  excludes: [
    "**/.*",
    "**/*{~,#,.bak,.orig,.rej}"
  ]
};

function printVerbose() {
  if (ARGV.verbose) {
    process.stdout.write.apply(process.stdout, arguments);
  }
}

function processError(ex) {
  if (ARGV.verbose && ex.stack) {
    process.stderr.write((ex.type)? `${ex.type}\n` : (ex.name)? `${ex.name}\n` : "");
    process.stderr.write(`${ex.message}\n`);
    process.stderr.write(ex.stack);
    process.stderr.write("\n");
  } else {
    process.stderr.write(`Error: ${ex.message}\n`);
  }
  process.exit(1);
}

function taskClean() {
  (new Promise((resolve, reject) => {
    glob("*.xpi", (err, list) => {
      if (err) {
        reject(err);
      } else {
        resolve(list);
      }
    });
  })).then((list) => {
    if (list.length === 0) {
      printVerbose("Note: *.xpi not found.\n");
    } else {
      return Promise.all(list.map((v) => new Promise((resolve, reject) => {
        fs.unlink(v, (err) => {
          if (err) {
            reject(err);
          }
          printVerbose(`  Removed: ${v}\n`);
          resolve();
        });
      })));
    }
  }).then(() => {
    printVerbose("Done.\n");
  }).catch((err) => {
    processError(err);
  });
}

function taskXPI() {
  if (!ARGV.output || !ARGV.output.endsWith(".xpi")) {
    throw new Error("output file foobar.xpi MUST be specified.");
  }

  let xpi = new jszip();
  Promise.all(XPI_TARGET.includes.map((item) => new Promise((resolve, reject) => {
    glob(item, {ignore: XPI_TARGET.excludes, nonull: true}, (err, matches) => {
      if (err) {
        reject(err);
      } else {
        for (let item of matches) {
          xpi.file(item, fs.createReadStream(item));
        }
        resolve();
      }
    });
  }))).then(() => {
    let currentFile = null;

    return new Promise((resolve, reject) => {
      xpi.generateNodeStream({}, (stat) => {
        if (stat.currentFile && stat.currentFile != currentFile) {
          printVerbose(`  Added: ${stat.currentFile}\n`);
        }
        currentFile = stat.currentFile;
      })
      .pipe(fs.createWriteStream(ARGV.output))
      .on("finish", () => {
        resolve();
      }).on("error", (err) => {
        reject(err);
      });
    });
  }).then((archive) => {
    printVerbose("Done.\n");
  }).catch((ex) => {
    processError(ex);
  });
}

function taskRun() {
  if (!ARGV.output || !ARGV.output.endsWith(".xpi")) {
    throw new Error("output file foobar.xpi MUST be specified.");
  }

  Promise.resolve(new FirefoxProfile()).then((profile) => new Promise((resolve, reject) => {
    profile.addExtension(ARGV.output, () => resolve(profile));
  })).then((profile) => new Promise((resolve, reject) => {
    profile.setPreference("devtools.debugger.remote-enabled", true);
    profile.setPreference("devtools.chrome.enabled", true);
    profile.setPreference("devtools.debugger.prompt-connection", false);
    profile.setPreference("xpinstall.signatures.required", false); // for addon debugging
    profile.updatePreferences();
  
    profile.encoded((zippedProfile) => {
      resolve(profile, zippedProfile);
    });
  })).then((profile, zippedProfile) => {
    return FxRunner({
      "no-remote": true,
      "binary": ARGV["firefox-binary"],
      "profile": profile.profileDir,
      "verbose": true,
      "listen": 6000,
    });
  }).then((runner) => new Promise((resolve, reject) => {
    timer.setTimeout(() => resolve(), 3000); // HACK wait
  })).then(() => {
    printVerbose("Done.\n");
  }).catch((ex) => {
    processError(ex);
  });
}

if (ARGV.help || ARGV._[0] === "help") {
  process.stdout.write("Usage: node build.js [OPTIONS]... COMMAND\n");
  process.stdout.write("\nOPTIONS:\n");
  process.stdout.write(" -o, --output=FILE           Path or alias to the XPI file output\n");
  process.stdout.write(" -f, --firefox-binary=FILE   Path or alias to a Firefox executable\n");
  process.stdout.write("\n");
} else {
  try {
    switch (ARGV._[0]) {
      case "clean":
        taskClean();
        break;
      case "xpi":
        taskXPI();
        break;
      case "run":
        taskRun();
        break;
      default:
        throw new Error(`unknown command: ${ARGV._[0]}\n`);
        break;
    }
  } catch (ex) {
    processError(ex);
  }
}

