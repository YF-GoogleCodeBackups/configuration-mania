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

Cu.import("resource://gre/modules/AddonManager.jsm");
const CONF_MANIA_ADDON_ID = "{c4d362ec-1cff-4ca0-9031-99a8fad7995a}";

function DialogObserver(windowtype, handlers) {
  this.windowtype = windowtype;
  this.handlers = handlers;
}
DialogObserver.prototype = {
  observe: function (aSubject, aTopic, aData) {
    if (aTopic == "domwindowopened") {
      aSubject.QueryInterface(Ci.nsIDOMWindow)
        .addEventListener("load", this, false);
    } else if (aTopic == "domwindowclosed") {
      if (aSubject.document.documentElement.getAttribute("windowtype") == this.windowtype) {
        this.handlers.onClose(aSubject);
      }
    }
  },
  handleEvent: function(aEvent) {
    let aWindow = aEvent.currentTarget;
    aWindow.removeEventListener(aEvent.type, this, false);
    if (aWindow.document.documentElement.getAttribute("windowtype") == this.windowtype) {
      this.handlers.onOpen(aWindow);
    }
  }
};

function CommonDialogObserver(handlers) {
  this.handlers = handlers;
}
CommonDialogObserver.prototype = {
  observe: function (aSubject, aTopic, aData) {
    if (aTopic == "domwindowopened") {
      aSubject.QueryInterface(Ci.nsIDOMWindow)
        .addEventListener("load", this, false);
    } else if (aTopic == "domwindowclosed") {
      if (aSubject.QueryInterface(Ci.nsIDOMWindow).location.href == "chrome://global/content/commonDialog.xul") {
        this.handlers.onClose(aSubject);
      }
    }
  },
  handleEvent: function(aEvent) {
    let aWindow = aEvent.currentTarget;
    aWindow.removeEventListener(aEvent.type, this, false);
    if (aWindow.location.href == "chrome://global/content/commonDialog.xul") {
      this.handlers.onOpen(aWindow);
    }
  }
};

var tc = new TestCase();
tc.tests = {
  setUp: function() {
    this.win = Services.wm.getMostRecentWindow("navigator:browser");
  },
  tearDown: function() {
  },

  // TEST ####################

  testCancelDisabling: function() {
    var addonObj = undefined;
    AddonManager.getAddonByID(CONF_MANIA_ADDON_ID, function (v) { addonObj = v; });
    for (let i = 0; i < 100; i++) {
      if (!!addonObj) { break; }
      sleep(1);
    }
    assert.isDefined(addonObj);

    var dialogHandler = { onOpen: function(){}, onClose: function(){} };
    let dialogObserver = new CommonDialogObserver(dialogHandler);
    try {
      Services.ww.registerNotification(dialogObserver);
      dialogHandler.onOpen = function (aWindow) {
        let dialog = aWindow.document.documentElement;
        if (dialog.textContent.indexOf("Configuration Mania") >= 0) {
          aWindow.close();
        }
      };

      assert.equals(addonObj.userDisabled, false);

      addonObj.userDisabled = true;
      assert.equals(addonObj.userDisabled, true);
      sleep(500);

      assert.equals(addonObj.userDisabled, false);
    } catch (e) {
      throw e;
    } finally {
      Services.ww.unregisterNotification(dialogObserver);
      addonObj.userDisabled = false;
    }
  },

  testURIRegistration: function() {
    var addonObj = undefined;
    AddonManager.getAddonByID(CONF_MANIA_ADDON_ID, function (v) { addonObj = v; });
    for (let i = 0; i < 100; i++) {
      if (!!addonObj) { break; }
      sleep(1);
    }
    assert.isDefined(addonObj);

    var dialogHandler = { onOpen: function(){}, onClose: function(){} };
    let dialogObserver = new CommonDialogObserver(dialogHandler);
    try {
      Services.ww.registerNotification(dialogObserver);
      dialogHandler.onOpen = function (aWindow) {
        let dialog = aWindow.document.documentElement;
        if (dialog.textContent.indexOf("Configuration Mania") >= 0) {
          dialog.getButton("extra1").click(); // Keep pref.
        }
      };

      let channel;

      assert.equals(addonObj.userDisabled, false);
      channel = Services.io.newChannel("chrome://confmania/skin/preferences-in-content.css", null, null);
      assert.isDefined(channel);
      channel = Services.io.newChannel("chrome://confmania/locale/confmania.dtd", null, null);
      assert.isDefined(channel);
      channel = Services.io.newChannel("about:confmania", null, null);
      assert.isDefined(channel);

      addonObj.userDisabled = true;
      sleep(100);
      assert.equals(addonObj.userDisabled, true);
      try {
        channel = Services.io.newChannel("chrome://confmania/skin/preferences-in-content.css", null, null);
        assert.fail("chrome://confmania/skin/preferences-in-content.css is not unloaded.");
      } catch (e) {
      }
      try {
        channel = Services.io.newChannel("chrome://confmania/locale/confmania.dtd", null, null);
        assert.fail("chrome://confmania/locale/confmania.dtd is not unloaded.");
      } catch (e) {
      }
      try {
        channel = Services.io.newChannel("about:confmania", null, null);
        assert.fail("about:confmania is not unloaded.");
      } catch (e) {
      }

      addonObj.userDisabled = false;
      sleep(100);
      assert.equals(addonObj.userDisabled, false);
      channel = Services.io.newChannel("chrome://confmania/skin/preferences-in-content.css", null, null);
      assert.isDefined(channel);
      channel = Services.io.newChannel("chrome://confmania/locale/confmania.dtd", null, null);
      assert.isDefined(channel);
      channel = Services.io.newChannel("about:confmania", null, null);
      assert.isDefined(channel);
    } catch (e) {
      throw e;
    } finally {
      Services.ww.unregisterNotification(dialogObserver);
    }
  },
  
  testOpenConfMania: function() {
    let cmd = this.win.document.getElementById("ConfMania:Open");
    assert.isDefined(cmd);

    var dialogHandler = { onOpen: function(){}, onClose: function(){} };
    let dialogObserver = new DialogObserver("Browser:Confmania", dialogHandler);
    try {
      Services.ww.registerNotification(dialogObserver);

      // inContent.
      {
        let browserWin = Services.wm.getMostRecentWindow("navigator:browser");

        cmd.click();
        sleep(2000);

        assert.equals(browserWin.getBrowser().currentURI.spec,
                      "about:confmania");

        browserWin.getBrowser().removeCurrentTab();
      }
    } catch (e) {
      throw e;
    } finally {
      Services.ww.unregisterNotification(dialogObserver);
    }
  },

  testLoadAllPaneInContent: function() {
    let cmd = this.win.document.getElementById("ConfMania:Open");
    assert.isDefined(cmd);

    try {
      // in-content
      {
        cmd.click();
        sleep(2000);

        let browserWin = Services.wm.getMostRecentWindow("navigator:browser");

        assert.equals(browserWin.getBrowser().currentURI.spec,
                      "about:confmania");

        let win = browserWin.getBrowser().contentWindow;
        let webNav = browserWin.getBrowser().webNavigation;

        assert.isTrue(win.document.documentElement.instantApply);

        let listBox = win.document.getElementById("categories");
        let listItems = win.document.querySelectorAll("#categories richlistitem.category");
        let panes = "paneBrowser paneSecurity paneHTTP paneUI paneAddons paneDebug".split(" ");
        assert.equals(listItems.length, panes.length);

        for (let [i,v] of panes.entries()) {
          let thePane = win.document.getElementById(v);

          let listItem = win.document.querySelector("richlistitem[value=\"%s\"]".replace("%s", v)); 
          assert.equals(listItem.parentNode, listBox);

          // pane load
          listItem.click();
          sleep(250);
          assert.isTrue(listItem.selected);
          assert.isTrue(thePane.loaded);
          assert.isTrue(thePane.childNodes.length > 0);

          for (let [j,u] of panes.entries()) {
            if (j === i) {
              assert.isTrue(win.document.getElementById(u).selected);
            } else {
              assert.isFalse(win.document.getElementById(u).selected);
            }
          }

          // history
          if (i === 0) {
            assert.isFalse(webNav.canGoBack);
            assert.isFalse(webNav.canGoForward);
          } else {
            var prevPane = win.document.getElementById(panes[i - 1]);
            assert.isTrue(webNav.canGoBack);
            assert.isFalse(webNav.canGoForward);

            win.history.back();
            sleep(100);
            assert.isTrue(webNav.canGoForward);
            assert.isTrue(prevPane.selected);
            assert.isFalse(thePane.selected);
            win.history.forward();
            sleep(100);
            assert.isTrue(webNav.canGoBack);
            assert.isFalse(webNav.canGoForward);
            assert.isFalse(prevPane.selected);
            assert.isTrue(thePane.selected);
          }
        }

        browserWin.getBrowser().removeCurrentTab();
      }
    } catch (e) {
      throw e;
    } finally {
    }
  },
}
