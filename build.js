#!/bin/env node

"use strict";

const minimist = require("minimist");
const fs = require("fs");
const glob = require("glob");
const archiver = require("archiver");

const ARGV = minimist(process.argv.slice(2), {
  "string": ["firefox-binary", "exclude", "output"],
  "boolean": ["help", "verbose"],
  "alias": {
    o: "output",
    f: "firefox-binary",
    x: "exclude",
    v: "verbose",
    h: "help"
  }
});

function printVerbose() {
  if (ARGV.verbose) {
    process.stdout.write.apply(process.stdout, arguments);
  }
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
  let includes = ARGV._.splice(1);
  let excludes = (Array.isArray(ARGV.exclude))? ARGV.exclude :
                 (typeof(ARGV.exclude) === "string")? [ARGV.exclude] : [];

  if (includes.length === 0) {
    throw new Error(`no file pattern is specified.`);
  }
  if (!ARGV.output || !ARGV.output.endsWith(".xpi")) {
    throw new Error("output file foobar.xpi MUST be specified.");
  }

  Promise.all(excludes.map((v) => {
    if (v.startsWith("@")) {
      return new Promise((resolve, reject) => {
        fs.readFile(v.substring(1), "utf8", (err, data) => {
          if (err) {
            reject(err);
          } else {
            excludes = data.split(/\n+/).filter((v) => v.length > 0);
            resolve();
          }
        });
      });
    } else {
      return v;
    }
  })).then(() => new Promise((resolve, reject) => {
    let output = fs.createWriteStream(ARGV.output);
    let archive = archiver("zip");

    output.on("close", () => resolve(archive));
    archive.on("error", (err) => {
      try {
        archive.abort();
      } catch (ex) { /* ignore */ }
      reject(err);
    });
    archive.on("entry", (data) => {
      printVerbose(`  Added: ${data.name}\n`);
    });

    archive.pipe(output);

    for (let item of includes) {
      archive.glob(item, {
        nonull: true,
        ignore: excludes,
        absolute: false
      });
    }

    archive.finalize();
  })).then((archive) => {
    printVerbose(`Done. (${archive.pointer()} bytes)\n`);
  }).catch((ex) => {
    processError(ex);
  });
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

if (ARGV.help || ARGV._[0] === "help") {
  process.stdout.write("Usage: node build.js [OPTIONS]... COMMAND\n");
  process.stdout.write("\nOPTIONS:\n");
  process.stdout.write(" -o, --output=FILE           Path or alias to the XPI file output\n");
  process.stdout.write(" -f, --firefox-binary=FILE   Path or alias to a Firefox executable\n");
  process.stdout.write(" -x, --exclude=PATTERN       exclude the following names from XPI\n");
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
      default:
        throw new Error(`unknown command: ${ARGV._[0]}\n`);
        break;
    }
  } catch (ex) {
    processError(ex);
  }
}

