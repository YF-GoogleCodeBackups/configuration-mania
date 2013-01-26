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

var tc = new TestCase();
tc.tests = {
  setUp: function() {
    this.win = Services.wm.getMostRecentWindow("navigator:browser");
  },
  tearDown: function() {
  },

  // TEST ####################
  
  testOpenConfMania: function() {
    assert.isDefined(this.win.gPrefWindow);

    let cmd = this.win.document.getElementById("ConfMania:Open");
    assert.isDefined(cmd);

    cmd.click();
    sleep(2000);
    let cmwin = Services.wm.getMostRecentWindow("Browser:Confmania");
    assert.isDefined(cmwin);

    cmd.click();
    let cmwin2 = Services.wm.getMostRecentWindow("Browser:Confmania");
    assert.isTrue(cmwin === cmwin2);
  },

  testLoadAllPane: function() {
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
  },
}
