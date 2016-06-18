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

function getAddonVersionInfo() {
  let { AddonManager } = Cu.import("resource://gre/modules/AddonManager.jsm");
  const CONF_MANIA_ADDON_ID = "{c4d362ec-1cff-4ca0-9031-99a8fad7995a}";
  
  let addonVersionInfo = {};
  AddonManager.getAddonByID(CONF_MANIA_ADDON_ID, function (addon) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", addon.getResourceURI("install.rdf").spec, true);
    xhr.onload = function () {
      if (xhr.readyState === 4) {
        let doc = xhr.responseXML;
        let minVersion = undefined;
        let maxVersion = undefined;

        if (doc.querySelector("targetApplication minVersion")) {
          addonVersionInfo.minVersion = doc.querySelector("targetApplication minVersion").textContent;
        }
        if (doc.querySelector("targetApplication maxVersion")) {
          addonVersionInfo.maxVersion = doc.querySelector("targetApplication maxVersion").textContent;
        }
      }
    };
    xhr.send(null);
  });
  sleep(1000);

  return addonVersionInfo;
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
  testDataObsoleteVersion: function() {
    let elems = this.document.querySelectorAll("*[data-obsolete-version-since]");
    let addonVersionInfo = getAddonVersionInfo();

    for (let v of elems) {
      let dataVersion = v.getAttribute("data-obsolete-version-since");

      if (parseInt(dataVersion, 10) !== 0) {
        // assert addonVersionInfo.minVersion < dataVersion <= addonVersionInfo.maxVersion
        assert.isTrue(Services.vc.compare(addonVersionInfo.minVersion, dataVersion) <  0);
        assert.isTrue(Services.vc.compare(addonVersionInfo.maxVersion, dataVersion) >= 0);
      }
    }
  },
  testDataRequireVersion: function() {
    let elems = this.document.querySelectorAll("*[data-require-version]");
    let addonVersionInfo = getAddonVersionInfo();

    for (let v of elems) {
      let dataVersion = v.getAttribute("data-require-version");

      if (parseInt(dataVersion, 10) !== 0) {
        // assert addonVersionInfo.minVersion < dataVersion <= addonVersionInfo.maxVersion
        assert.isTrue(Services.vc.compare(addonVersionInfo.minVersion, dataVersion) <  0);
        assert.isTrue(Services.vc.compare(addonVersionInfo.maxVersion, dataVersion) >= 0);
      }
    }
  },
}
