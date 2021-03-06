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
const CONF_MANIA_LOCALES = "en-US ja-JP de es-ES fr lt pl pt-BR sv-SE zh-CN zh-TW".split(" ");

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
  },
  tearDown: function() {
  },

  // TEST ####################

  testQuickFileCheck: function() {
    let origULvalue = Services.prefs.getCharPref("general.useragent.locale");
    let origMOvalue = Services.prefs.getBoolPref("intl.locale.matchOS");

    try {
      for (let locale of CONF_MANIA_LOCALES) {
        Services.prefs.setCharPref("general.useragent.locale", locale);
        Services.prefs.setBoolPref("intl.locale.matchOS", false);

        // XUL and DTD files
        for (let fileName of ["paneAddons.xul", "paneDebug.xul", "paneBrowser.xul", "preferences_in_content.xul", "paneUI.xul", "paneSecurity.xul", "paneHTTP.xul"]) {
          let req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
                    .createInstance(Ci.nsIXMLHttpRequest);
          req.open("GET", "chrome://confmania/content/" + fileName, false);
          req.send();

          assert.isDefined(req.responseXML);
          assert.isDefined(req.responseXML.documentElement);

          assert.equals(req.responseXML.documentElement.namespaceURI,
                        "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");
        }
	
        // Properties files
        for (let fileName of ["confmania.properties"]) {
          Services.strings.flushBundles();
          let stringBundle = Services.strings.createBundle("chrome://confmania/locale/" + fileName);
          assert.isTrue(stringBundle.getSimpleEnumeration().hasMoreElements());
        }
      }
    } catch (e) {
      throw e;
    } finally {
      Services.prefs.setCharPref("general.useragent.locale", origULvalue);
      Services.prefs.setBoolPref("intl.locale.matchOS", origMOvalue);
    }
  },

  testLoadAllPaneInContent: function() {
    let browserWin = Services.wm.getMostRecentWindow("navigator:browser");

    let origULvalue = Services.prefs.getCharPref("general.useragent.locale");
    let origMOvalue = Services.prefs.getBoolPref("intl.locale.matchOS");

    try {
      for (let locale of CONF_MANIA_LOCALES) {
        Services.prefs.setCharPref("general.useragent.locale", locale);
        Services.prefs.setBoolPref("intl.locale.matchOS", false);

        browserWin.openUILinkIn("about:confmania", "tab");
        sleep(1000);

        assert.equals(browserWin.getBrowser().currentURI.spec,
                      "about:confmania");
        
        let win = browserWin.getBrowser().contentWindow;
        let webNav = browserWin.getBrowser().webNavigation;

        let listBox = win.document.getElementById("categories");
        let listItems = win.document.querySelectorAll("#categories richlistitem.category");
        let panes = "paneBrowser paneSecurity paneHTTP paneUI paneAddons paneDebug".split(" ");
        assert.equals(listItems.length, panes.length);

        for (let v of panes) {
          let thePane = win.document.getElementById(v);
          let listItem = win.document.querySelector("richlistitem[value=\"%s\"]".replace("%s", v)); 
          assert.equals(listItem.parentNode, listBox);

          // pane load
          listItem.click();
          sleep(250);

          assert.isTrue(thePane.loaded);
          assert.isTrue(thePane.childNodes.length > 0);
        }

        browserWin.getBrowser().removeCurrentTab();
      }
    } catch (e) {
      throw e;
    } finally {
      Services.prefs.setCharPref("general.useragent.locale", origULvalue);
      Services.prefs.setBoolPref("intl.locale.matchOS", origMOvalue);
    }
  },

  testRevertPrefDialog: function() {
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
        if (dialog.id === "commonDialog") {
          aWindow.close();
        }
      };

      let browserWin = Services.wm.getMostRecentWindow("navigator:browser");
      let origULvalue = Services.prefs.getCharPref("general.useragent.locale");
      let origMOvalue = Services.prefs.getBoolPref("intl.locale.matchOS");

      try {
        for (let locale of CONF_MANIA_LOCALES) {
          Services.prefs.setCharPref("general.useragent.locale", locale);
          Services.prefs.setBoolPref("intl.locale.matchOS", false);

          assert.equals(addonObj.userDisabled, false);

          addonObj.userDisabled = true;
          assert.equals(addonObj.userDisabled, true);
          sleep(500);

          assert.equals(addonObj.userDisabled, false);
        }
      } catch (e) {
        throw e;
      } finally {
        Services.prefs.setCharPref("general.useragent.locale", origULvalue);
        Services.prefs.setBoolPref("intl.locale.matchOS", origMOvalue);
      }
    } catch (e) {
      throw e;
    } finally {
      Services.ww.unregisterNotification(dialogObserver);
      addonObj.userDisabled = false;
    }
  },
}
