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

var tc = new TestCase();
tc.tests = {
  setUp: function() {
    this.win = Services.wm.getMostRecentWindow("navigator:browser");
  },
  tearDown: function() {
  },

  // TEST ####################

  testURIRegistration: function() {
    var addonObj = undefined;
    AddonManager.getAddonByID(CONF_MANIA_ADDON_ID, function (v) { addonObj = v; });
    sleep(1000);
    assert.isDefined(addonObj);

    let channel;

    assert.equals(addonObj.userDisabled, false);
    channel = Services.io.newChannel("chrome://confmania/content/preferences.xul", null, null);
    assert.isDefined(channel);
    channel = Services.io.newChannel("chrome://confmania/skin/preferences.css", null, null);
    assert.isDefined(channel);
    channel = Services.io.newChannel("chrome://confmania/locale/confmania.dtd", null, null);
    assert.isDefined(channel);
    channel = Services.io.newChannel("about:confmania", null, null);
    assert.isDefined(channel);

    addonObj.userDisabled = true;
    sleep(100);
    assert.equals(addonObj.userDisabled, true);
    try {
      channel = Services.io.newChannel("chrome://confmania/content/preferences.xul", null, null);
      assert.fail("chrome://confmania/content/preferences.xul is not unloaded.");
    } catch (e) {
    }
    try {
      channel = Services.io.newChannel("chrome://confmania/skin/preferences.css", null, null);
      assert.fail("chrome://confmania/skin/preferences.css is not unloaded.");
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
    channel = Services.io.newChannel("chrome://confmania/content/preferences.xul", null, null);
    assert.isDefined(channel);
    channel = Services.io.newChannel("chrome://confmania/skin/preferences.css", null, null);
    assert.isDefined(channel);
    channel = Services.io.newChannel("chrome://confmania/locale/confmania.dtd", null, null);
    assert.isDefined(channel);
    channel = Services.io.newChannel("about:confmania", null, null);
    assert.isDefined(channel);
  },
  
  testOpenConfMania: function() {
    let origICvalue = Services.prefs.getBoolPref("browser.preferences.inContent");
    let origIAvalue = Services.prefs.getBoolPref("browser.preferences.instantApply");

    let cmd = this.win.document.getElementById("ConfMania:Open");
    assert.isDefined(cmd);

    var dialogHandler = { onOpen: function(){}, onClose: function(){} };
    let dialogObserver = new DialogObserver("Browser:Confmania", dialogHandler);
    try {
      Services.ww.registerNotification(dialogObserver);

      // inContent.
      {
        Services.prefs.setBoolPref("browser.preferences.inContent", true);
        Services.prefs.setBoolPref("browser.preferences.instantApply", true);

        let browserWin = Services.wm.getMostRecentWindow("navigator:browser");

        cmd.click();
        sleep(2000);

        assert.equals(browserWin.getBrowser().currentURI.spec,
                      "about:confmania");

        browserWin.getBrowser().removeCurrentTab();

        Services.prefs.setBoolPref("browser.preferences.inContent", true);
        Services.prefs.setBoolPref("browser.preferences.instantApply", false);

        cmd.click();
        sleep(2000);

        assert.equals(browserWin.getBrowser().currentURI.spec,
                      "about:confmania");

        browserWin.getBrowser().removeCurrentTab();
      }

      // instantApply.
      {
        Services.prefs.setBoolPref("browser.preferences.inContent", false);
        Services.prefs.setBoolPref("browser.preferences.instantApply", true);

        cmd.click();
        sleep(1000);
        let cmwin = Services.wm.getMostRecentWindow("Browser:Confmania");
        assert.isDefined(cmwin);

        cmd.click();
        sleep(100);
        let cmwin2 = Services.wm.getMostRecentWindow("Browser:Confmania");
        assert.isTrue(cmwin === cmwin2);

        cmwin.close();
        sleep(1000);

        assert.isNull(Services.wm.getMostRecentWindow("Browser:Confmania"));
      }
      {
        Services.prefs.setBoolPref("browser.preferences.inContent", false);
        Services.prefs.setBoolPref("browser.preferences.instantApply", false);
      
        var confmaniaIsOpened = false;
        dialogHandler.onOpen = (function (cmwin) {
          sleep(100);
          confmaniaIsOpened = true;
          cmwin.close();
        }).bind(this);
        cmd.click();

        dialogHandler.onOpen = function () {};

        assert.isTrue(confmaniaIsOpened);
      }
    } catch (e) {
      throw e;
    } finally {
      Services.ww.unregisterNotification(dialogObserver);

      Services.prefs.setBoolPref("browser.preferences.inContent", origICvalue);
      Services.prefs.setBoolPref("browser.preferences.instantApply", origIAvalue);
    }
  },

  testLoadAllPaneInContent: function() {
    let origIAvalue = Services.prefs.getBoolPref("browser.preferences.instantApply");
    let origICvalue = Services.prefs.getBoolPref("browser.preferences.inContent");

    let cmd = this.win.document.getElementById("ConfMania:Open");
    assert.isDefined(cmd);

    try {
      // in-content
      {
        Services.prefs.setBoolPref("browser.preferences.inContent", true);
        Services.prefs.setBoolPref("browser.preferences.instantApply", true);

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

        for each (let [i,v] in Iterator(panes)) {
          let thePane = win.document.getElementById(v);

          let listItem = win.document.querySelector("richlistitem[value=\"%s\"]".replace("%s", v)); 
          assert.equals(listItem.parentNode, listBox);

          // pane load
          listItem.click();
          sleep(1000);
          assert.isTrue(listItem.selected);
          assert.isTrue(thePane.loaded);
          assert.isTrue(thePane.childNodes.length > 0);

          for each (let [j,u] in Iterator(panes)) {
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
      // in-content
      {
        Services.prefs.setBoolPref("browser.preferences.inContent", true);
        Services.prefs.setBoolPref("browser.preferences.instantApply", false);

        cmd.click();
        sleep(2000);

        let browserWin = Services.wm.getMostRecentWindow("navigator:browser");

        assert.equals(browserWin.getBrowser().currentURI.spec,
                      "about:confmania");

        let win = browserWin.getBrowser().contentWindow;

        assert.isTrue(win.document.documentElement.instantApply);

        browserWin.getBrowser().removeCurrentTab();
      }
    } catch (e) {
      throw e;
    } finally {
      Services.prefs.setBoolPref("browser.preferences.inContent", origICvalue);
      Services.prefs.setBoolPref("browser.preferences.instantApply", origIAvalue);
    }
  },
  testLoadAllPaneOnDialog: function() {
    let origIAvalue = Services.prefs.getBoolPref("browser.preferences.instantApply");
    let origICvalue = Services.prefs.getBoolPref("browser.preferences.inContent");

    let cmd = this.win.document.getElementById("ConfMania:Open");
    assert.isDefined(cmd);

    var dialogHandler = { onOpen: function(){}, onClose: function(){} };
    let dialogObserver = new DialogObserver("Browser:Confmania", dialogHandler);
    try {
      Services.ww.registerNotification(dialogObserver);

      // instantApply.
      {
        Services.prefs.setBoolPref("browser.preferences.inContent", false);
        Services.prefs.setBoolPref("browser.preferences.instantApply", true);

        cmd.click();
        sleep(2000);

        let cmwin = Services.wm.getMostRecentWindow("Browser:Confmania");
        let document = cmwin.document;
        let prefWin  = document.documentElement;

        assert.isTrue(prefWin.currentPane.loaded);

        assert.isTrue(document.documentElement.instantApply);

        assert.equals(
          "paneBrowser paneSecurity paneHTTP paneUI paneAddons paneDebug",
          Array.map(prefWin.preferencePanes, function(v) { return v.id; }).join(" ")
        );

        for each (let [k,v] in Iterator("paneBrowser paneSecurity paneHTTP paneUI paneAddons paneDebug".split(" "))) {
          prefWin.showPane(document.getElementById(v));
          sleep(1000);
          assert.equals(v, prefWin.currentPane.id);
          assert.isTrue(prefWin.currentPane.loaded);

          assert.isTrue(prefWin.currentPane.childNodes.length > 0);
        }

        cmwin.close();
      }
      // non-instantApply.
      {
        Services.prefs.setBoolPref("browser.preferences.inContent", false);
        Services.prefs.setBoolPref("browser.preferences.instantApply", false);

        let exception = undefined;
        dialogHandler.onOpen = function (cmwin) {
          try {
            let document = cmwin.document;
            let prefWin  = document.documentElement;

            assert.isTrue(prefWin.currentPane.loaded);

            assert.isFalse(document.documentElement.instantApply);

            assert.equals(
              "paneBrowser paneSecurity paneHTTP paneUI paneAddons paneDebug",
              Array.map(prefWin.preferencePanes, function(v) { return v.id; }).join(" ")
            );

            for each (let [k,v] in Iterator("paneBrowser paneSecurity paneHTTP paneUI paneAddons paneDebug".split(" "))) {
              prefWin.showPane(document.getElementById(v));
              sleep(1000);
              assert.equals(v, prefWin.currentPane.id);
              assert.isTrue(prefWin.currentPane.loaded);

              assert.isTrue(prefWin.currentPane.childNodes.length > 0);
            }
          } catch (e) {
            exception = e;
          } finally {
            cmwin.close();
          }
        };
        cmd.click();
        dialogHandler.onOpen = function () {};

        if (!!exception) {
          throw exception;
        }
      }
    } catch (e) {
      throw e;
    } finally {
      Services.ww.unregisterNotification(dialogObserver);

      Services.prefs.setBoolPref("browser.preferences.inContent", origICvalue);
      Services.prefs.setBoolPref("browser.preferences.instantApply", origIAvalue);
    }
  },
}
