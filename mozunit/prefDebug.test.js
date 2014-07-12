"use strict";
var TestCase = (typeof(mozlab) !== "undefined")? mozlab.mozunit.TestCase : mozunit.TestCase;
var assert   = (typeof(mozlab) !== "undefined")? mozlab.mozunit.assert   : mozunit.assert;

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");

function sleep(aWait) {
  let timerHandler = {
    timeup: false,
    notify: function(timer) {
      timerHandler.timeup = true;
    }
  };
  let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  timer.initWithCallback(timerHandler, aWait, Ci.nsITimer.TYPE_ONE_SHOT);

  while (!timerHandler.timeup) {
    Services.tm.mainThread.processNextEvent(true);
  }
}

var tc = new TestCase();
tc.tests = {
  setUp: function() {
    let win = Services.wm.getMostRecentWindow("navigator:browser");
    let cmd = win.document.getElementById("ConfMania:Open");
    let cmwin = Services.wm.getMostRecentWindow("Browser:Confmania");
    let prefWin  = cmwin.document.documentElement;
    prefWin.showPane(cmwin.document.getElementById("paneDebug"));

    this.window = cmwin.document.defaultView;
    this.document = cmwin.document;
  },
  tearDown: function() {
  },

  // TEST ####################
  
  testInit: function() {
    assert.isDefined(this.window.gPrefWindow.prefDebug);
  },
  testOnDebugDumpEnabledSyncFrom: function() {
    let checkbox = this.document.querySelector("checkbox[preference='browser.dom.window.dump.enabled']");
    let target1 = this.document.querySelector("textbox[preference='browser.dom.window.dump.file']");
    let target2 = this.document.querySelector("hbox button[oncommand*='onDebugDumpFileBrowse']");
    let target3 = this.document.querySelector("hbox button[oncommand*='onDebugDumpFileReset']");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target1.disabled);
      assert.equals(checkbox.checked, !target2.disabled);
      assert.equals(checkbox.checked, !target3.disabled);
      checkbox.click();
    }
  },
  //testOnDebugDumpFileBrowse: function() {
  //},
  testOnDebugDumpFileReset: function() {
    let target = this.document.querySelector("textbox[preference='browser.dom.window.dump.file']");
    let origval = target.value;
    let enabled = this.document.getElementById("browser.dom.window.dump.enabled")
    let origvalEnabled = enabled.value;
    enabled.value = true;

    let hasValue = function(aPref) {
      if (aPref.instantApply) {
        return (aPref.hasUserValue);
      } else {
        return (aPref.value !== undefined);
      }
    }

    target.value = "***USER DEFINED VALUE***";
    target.click();
    assert.isTrue(hasValue(this.document.getElementById("browser.dom.window.dump.file")));

    let resetBtn = this.document.querySelector("hbox button[oncommand*='onDebugDumpFileReset']");
    resetBtn.click();
    assert.equals("", target.value);
    assert.isFalse(hasValue(this.document.getElementById("browser.dom.window.dump.file")));

    enabled.value = origvalEnabled;
    target.value = origval;
    target.click();
  },
}
