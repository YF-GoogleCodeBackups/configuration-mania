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
    let cmwin = null;
    let browserEnumerator = Services.wm.getEnumerator("navigator:browser");
    while (browserEnumerator.hasMoreElements()) {
      let browserWin = browserEnumerator.getNext();
      let tabbrowser = browserWin.gBrowser;
      let tabLength = tabbrowser.tabs.length;

      for (let i = 0; i < tabLength; i++) {
        let currentBrowser = tabbrowser.getBrowserAtIndex(i);
        if (currentBrowser.currentURI.spec.startsWith("about:confmania")) {
          cmwin = currentBrowser.contentWindow;
          //browserWin.focus();
          tabbrowser.selectTabAtIndex(i);
          break;
        }
      }
    }

    if (cmwin) {
      this.window = cmwin;
      this.document = cmwin.document;
    } else {
      throw new Error("about:confmania not found");
    }
  },
  tearDown: function() {
  },

  // TEST ####################
  
  testEditElemExistance: function() {
    for (let v of this.document.querySelectorAll("preference[id]")) {
      assert.equals(v.getAttribute("id"), v.getAttribute("name"));

      let editElem = this.document.querySelector("*[preference='"+v.id+"']");
      if (!(editElem instanceof XULElement)) {
        assert.fail("\"" + v.id + "\" elem could not found.");
      }
    }
  },
  testPrefElemExistance: function() {
    let editElems = this.document.querySelectorAll("*[preference]");

    let isTemplateAction = function(v) {
      for (let elem = v.parentNode; elem != null; elem = elem.parentNode) {
        if ((elem instanceof XULElement) && (elem.tagName === "action")) {
          return true;
        }
      }
      return false;
    };

    for (let v of editElems) {
      if (!isTemplateAction(v)) {
        let prefElem = this.document.getElementById(v.getAttribute("preference"));
        if (!(prefElem instanceof XULElement) || (prefElem.tagName !== "preference")) {
          assert.fail("\"" + v.getAttribute("preference") + "\" elem could not found.");
        }
        assert.equals(prefElem.name, v.getAttribute("preference"));
      }
    }
  },
}
