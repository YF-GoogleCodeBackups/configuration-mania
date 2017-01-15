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

      cmwin.document.getElementById("category-http").click();
    } else {
      throw new Error("about:confmania not found");
    }
  },
  tearDown: function() {
  },

  // TEST ####################
  
  testInit: function() {
    assert.isDefined(this.window.gPrefWindow.prefHTTP);
  },
  testOnPaneHTTPBoxTabSelected: function() {
    let paneHTTPBoxTab = this.document.getElementById("paneHTTPBoxTab");

    for (let i = 0; i < paneHTTPBoxTab.itemCount; i++) {
      paneHTTPBoxTab.getItemAtIndex(i).click();
      assert.equals(i, paneHTTPBoxTab.selectedIndex);
      sleep(100);
      assert.equals("true", this.document.getElementById(paneHTTPBoxTab.value).getAttribute("selected"));
    }
  },
  

}
