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
    let win = Services.wm.getMostRecentWindow("navigator:browser");
    let cmd = win.document.getElementById("ConfMania:Open");
    let cmwin = Services.wm.getMostRecentWindow("Browser:Confmania");
    let prefWin  = cmwin.document.documentElement;
    prefWin.showPane(cmwin.document.getElementById("paneSecurity"));

    this.window = cmwin.document.defaultView;
    this.document = cmwin.document;
  },
  tearDown: function() {
  },

  // TEST ####################
  
  testInit: function() {
    assert.isDefined(this.window.gPrefWindow.prefSecurity);
  },
  testSyncFromPopwin: function() {
    let mData = this.document.getElementById("dom.popup_allowed_events");
    let target = this.document.getElementById("popupwin-e");
    let origval = mData.value;

    let val = [];
    for (let i = 0; i < target.itemCount; i++) {
      if (target.getItemAtIndex(i).checked) {
        val.push(target.getItemAtIndex(i).value);
      }
    }
    assert.equals(mData.value.split(/\s+/).sort().join(" "), val.sort().join(" "));

    mData.value = "";
    this.window.gPrefWindow.prefSecurity.syncFromPopupwin();
    for (let i = 0; i < target.itemCount; i++) {
      assert.isFalse(target.getItemAtIndex(i).checked);
    }

    mData.value = "";
    for (let i = 0; i < target.itemCount; i++) {
      mData.value += " " + target.getItemAtIndex(i).value;
    }
    this.window.gPrefWindow.prefSecurity.syncFromPopupwin();
    for (let i = 0; i < target.itemCount; i++) {
      assert.isTrue(target.getItemAtIndex(i).checked);
    }

    mData.value = origval;
    this.window.gPrefWindow.prefSecurity.syncFromPopupwin();
  },
  testSyncToPopupwin: function() {
    let mData = this.document.getElementById("dom.popup_allowed_events");
    let target = this.document.getElementById("popupwin-e");
    let origval = mData.value;

    assert.equals(mData.value.split(/\s+/).sort().join(" "), this.window.gPrefWindow.prefSecurity.syncToPopupwin().split(/\s+/).sort().join(" "));

    for (let i = 0; i < target.itemCount; i++) {
      target.getItemAtIndex(i).checked = false;
    }
    assert.matches(/^\s*$/, this.window.gPrefWindow.prefSecurity.syncToPopupwin());

    let fullValues = [];
    for (let i = 0; i < target.itemCount; i++) {
      target.getItemAtIndex(i).checked = true;
      fullValues.push(target.getItemAtIndex(i).value);
    }
    assert.equals(fullValues.join(" "), this.window.gPrefWindow.prefSecurity.syncToPopupwin());

    mData.value = origval;
    this.window.gPrefWindow.prefSecurity.syncFromPopupwin();
  },
  testOnDisableIDNSyncFrom: function() {
    let checkbox = this.document.getElementById("disableIDN");
    let target = this.document.getElementById("showPunycode");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, target.disabled);
      checkbox.click();
    }
  },
  testOnSendRefererSecureXSiteSyncFrom: function() {
    let radiogroup = this.document.getElementById("sendReferer");
    let target = this.document.getElementById("sendRefererSecureXSite");
    
    for (let i = 0; i < radiogroup.itemCount; i++) {
      let index = (radiogroup.selectedIndex + 1) % radiogroup.itemCount
      radiogroup.getItemAtIndex(index).click();
      assert.equals(radiogroup.value != 0, !target.disabled);
    }
  },
  testUpdatePasswordAskTimes: function() {
    let radiogroup = this.document.getElementById("passwordAskTimes");
    let target1 = this.document.getElementById("passwordTimeout");
    let target2 = this.document.getElementById("askEveryTimeHidden");
    
    for (let i = 0; i < radiogroup.itemCount; i++) {
      let index = (radiogroup.selectedIndex + 1) % radiogroup.itemCount
      radiogroup.getItemAtIndex(index).click();
      assert.equals(radiogroup.value == 1, !target1.disabled);
      assert.equals(radiogroup.value == -1, target2.checked);
    }
  },
  testOnPaneSecurityBoxTabSelected: function() {
    let paneSecurityBoxTab = this.document.getElementById("paneSecurityBoxTab");

    for (let i = 0; i < paneSecurityBoxTab.itemCount; i++) {
      paneSecurityBoxTab.getItemAtIndex(i).click();
      assert.equals(i, paneSecurityBoxTab.selectedIndex);
      sleep(100);
      assert.equals("true", this.document.getElementById(paneSecurityBoxTab.value).getAttribute("selected"));
    }
  },
  

}
