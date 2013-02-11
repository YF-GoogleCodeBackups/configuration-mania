var TestCase = mozunit.TestCase;
var assert = mozunit.assert;

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
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
  
  testOpenConfMania: function() {
    let origIAvalue = Services.prefs.getBoolPref("browser.preferences.instantApply");

    let cmd = this.win.document.getElementById("ConfMania:Open");
    assert.isDefined(cmd);

    var dialogHandler = { onOpen: function(){}, onClose: function(){} };
    let dialogObserver = new DialogObserver("Browser:Confmania", dialogHandler);
    try {
      Services.ww.registerNotification(dialogObserver);

      // instantApply.
      {
        Services.prefs.setBoolPref("browser.preferences.instantApply", true);

        cmd.click();
        sleep(2000);
        let cmwin = Services.wm.getMostRecentWindow("Browser:Confmania");
        assert.isDefined(cmwin);

        cmd.click();
        let cmwin2 = Services.wm.getMostRecentWindow("Browser:Confmania");
        assert.isTrue(cmwin === cmwin2);

        cmwin.close();
      }
      // non-instantApply.
      {
        Services.prefs.setBoolPref("browser.preferences.instantApply", false);

        let confmaniaIsOpened = false;
        dialogHandler.onOpen = function (cmwin) {
          sleep(100);
          confmaniaIsOpened = true;
          cmwin.close();
        };
        cmd.click();
        dialogHandler.onOpen = function () {};

        assert.isTrue(confmaniaIsOpened);
      }
    } catch (e) {
      throw e;
    } finally {
      Services.ww.unregisterNotification(dialogObserver);

      Services.prefs.setBoolPref("browser.preferences.instantApply", origIAvalue);
    }
  },

  testLoadAllPane: function() {
    let origIAvalue = Services.prefs.getBoolPref("browser.preferences.instantApply");

    let cmd = this.win.document.getElementById("ConfMania:Open");
    assert.isDefined(cmd);

    var dialogHandler = { onOpen: function(){}, onClose: function(){} };
    let dialogObserver = new DialogObserver("Browser:Confmania", dialogHandler);
    try {
      Services.ww.registerNotification(dialogObserver);

      // instantApply.
      {
        Services.prefs.setBoolPref("browser.preferences.instantApply", true);

        cmd.click();
        sleep(2000);

        let cmwin = Services.wm.getMostRecentWindow("Browser:Confmania");
        let document = cmwin.document;
        let prefWin  = document.documentElement;

        assert.isTrue(prefWin.currentPane.loaded);

        assert.equals(
          "paneBrowser paneSecurity paneHTTP paneUI paneAddons paneDebug",
          Array.map(prefWin.preferencePanes, function(v) { return v.id; }).join(" ")
        );

        for each (let [k,v] in Iterator("paneBrowser paneSecurity paneHTTP paneUI paneAddons paneDebug".split(" "))) {
          prefWin.showPane(document.getElementById(v));
          sleep(2000);
          assert.equals(v, prefWin.currentPane.id);
          assert.isTrue(prefWin.currentPane.loaded);

          assert.isTrue(prefWin.currentPane.childNodes.length > 0);
        }

        cmwin.close();
      }
      // non-instantApply.
      {
        Services.prefs.setBoolPref("browser.preferences.instantApply", false);

        let exception = undefined;
        dialogHandler.onOpen = function (cmwin) {
          try {
            let document = cmwin.document;
            let prefWin  = document.documentElement;

            assert.isTrue(prefWin.currentPane.loaded);

            assert.equals(
              "paneBrowser paneSecurity paneHTTP paneUI paneAddons paneDebug",
              Array.map(prefWin.preferencePanes, function(v) { return v.id; }).join(" ")
            );

            for each (let [k,v] in Iterator("paneBrowser paneSecurity paneHTTP paneUI paneAddons paneDebug".split(" "))) {
              prefWin.showPane(document.getElementById(v));
              sleep(2000);
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

      Services.prefs.setBoolPref("browser.preferences.instantApply", origIAvalue);
    }
  },
}
