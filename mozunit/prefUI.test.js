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

      cmwin.document.getElementById("category-ui").click();
    } else {
      throw new Error("about:confmania not found");
    }
  },
  tearDown: function() {
  },

  // TEST ####################
  
  testInit: function() {
    assert.isDefined(this.window.gPrefWindow.prefUI);
  },
  testInitMultitouchPopup: function() {
    let menulists = this.document.querySelectorAll("#multitouch-gestures-box menulist");

    for (let i = 0; i < menulists.length; i++) {
      assert.isTrue(menulists[i].itemCount > 0);
      for (let j = 0; j < menulists[i].itemCount; j++) {
        let menuitem = menulists[i].getItemAtIndex(j);
        let win = Services.wm.getMostRecentWindow("navigator:browser");

        let cmd = win.document.getElementById(menuitem.label);
        assert.isDefined(cmd);
      }

      assert.equals("none", menulists[i].getAttribute("sizetopopup"));
    }
  },
  testInitI18nBoxTab: function() {
    // ref testOnPaneUIBoxTabSelected
  },
  testInitUIBoxTab: function() {
    // ref testOnPaneUIBoxTabSelected
  },
  testOnPaneUIBoxTabSelected: function() {
    let paneUIBoxTab = this.document.getElementById("paneUIBoxTab");

    for (let i = 0; i < paneUIBoxTab.itemCount; i++) {
      paneUIBoxTab.getItemAtIndex(i).click();
      assert.equals(i, paneUIBoxTab.selectedIndex);
      sleep(100);
      assert.equals("true", this.document.getElementById(paneUIBoxTab.value).getAttribute("selected"));
    }
  },
  testOnTabNavSyncFrom: function() {
    let mData = this.document.getElementById("accessibility.tabfocus");
    let origval = mData.value;
    let target1 = this.document.getElementById("tabNavigationLinks");
    let target2 = this.document.getElementById("tabNavigationForms");

    mData.value = 1;
    assert.equals(false, this.window.gPrefWindow.prefUI.onTabNavSyncFrom(target1));
    assert.equals(false, this.window.gPrefWindow.prefUI.onTabNavSyncFrom(target2));

    mData.value = 3;
    assert.equals(false, this.window.gPrefWindow.prefUI.onTabNavSyncFrom(target1));
    assert.equals(true,  this.window.gPrefWindow.prefUI.onTabNavSyncFrom(target2));

    mData.value = 5;
    assert.equals(true,  this.window.gPrefWindow.prefUI.onTabNavSyncFrom(target1));
    assert.equals(false, this.window.gPrefWindow.prefUI.onTabNavSyncFrom(target2));

    mData.value = 7;
    assert.equals(true,  this.window.gPrefWindow.prefUI.onTabNavSyncFrom(target1));
    assert.equals(true,  this.window.gPrefWindow.prefUI.onTabNavSyncFrom(target2));

    mData.value = origval;
  },
  testOnTabNavSyncTo: function() {
    let mData = this.document.getElementById("accessibility.tabfocus");
    let target1 = this.document.getElementById("tabNavigationLinks");
    let target2 = this.document.getElementById("tabNavigationForms");
    let origval1 = target1.checked;
    let origval2 = target2.checked;

    target1.checked = false;
    target2.checked = false;
    mData.value = 0;

    target1.click();
    assert.equals(5, mData.value);
    
    target2.click();
    assert.equals(7, mData.value);

    target1.click();
    assert.equals(3, mData.value);

    target2.click();
    assert.equals(1, mData.value);

    target1.checked = !origval1;
    target1.click();
    target2.checked = !origval2;
    target2.click();
  },
  testOnBrowseWithCaretSyncFrom: function() {
    let checkbox = this.document.querySelector("checkbox[preference='accessibility.browsewithcaret_shortcut.enabled']");
    let target = this.document.querySelector("checkbox[preference='accessibility.warn_on_browsewithcaret']");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  testOnLocaleMatchOSSyncFrom: function() {
    let checkbox = this.document.querySelector("checkbox[preference='intl.locale.matchOS']");
    let target = this.document.querySelector("textbox[preference='general.useragent.locale']");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, target.disabled);
      checkbox.click();
    }
  },
  testOnUiSubmenuDelaySyncFrom: function() {
    let target = this.document.getElementById("uiSubmenuDelay");
    let radioGroup = this.document.getElementById("uiSubmenuDelay-radio");
    let prefName = target.getAttribute("preference");
    let origval = target.value;

    target.value = 1000; // dummy

    radioGroup.getItemAtIndex(1).click();
    assert.equals("-1", radioGroup.value);
    assert.equals(-1, target.value);

    assert.isTrue(this.document.getElementById(prefName).hasUserValue);
    radioGroup.getItemAtIndex(0).click();
    assert.equals("0", radioGroup.value);
    assert.equals(0, target.value);
    assert.isFalse(this.document.getElementById(prefName).hasUserValue);

    target.value = -1;
    target.click();
    assert.equals("-1", radioGroup.value);
    assert.isTrue(this.document.getElementById(prefName).hasUserValue);
    target.value = 0;
    target.click();
    assert.equals("0", radioGroup.value);
    assert.isFalse(this.document.getElementById(prefName).hasUserValue);
    target.value = 1;
    target.click();
    assert.equals("*", radioGroup.value);
    assert.isTrue(this.document.getElementById(prefName).hasUserValue);

    target.value = 1000; // dummy
    Services.prefs.clearUserPref(prefName);
    assert.equals("0", radioGroup.value);
    assert.equals(0, target.value);
    
    target.value = origval;
    target.click();
  },
  testOnJumplistEnabledSyncFrom: function() {
    let checkbox = this.document.querySelector("checkbox[preference='browser.taskbar.lists.enabled']");
    let target_frequent = this.document.querySelector("checkbox[preference='browser.taskbar.lists.frequent.enabled']");
    let target_recent = this.document.querySelector("checkbox[preference='browser.taskbar.lists.recent.enabled']");
    let target_tasks = this.document.querySelector("checkbox[preference='browser.taskbar.lists.tasks.enabled']");
    let target_maxListItemCount = this.document.querySelector("textbox[preference='browser.taskbar.lists.maxListItemCount']");
    let target_refreshInSeconds = this.document.querySelector("textbox[preference='browser.taskbar.lists.refreshInSeconds']");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target_frequent.disabled);
      assert.equals(checkbox.checked, !target_recent.disabled);
      assert.equals(checkbox.checked, !target_tasks.disabled);
      assert.equals(checkbox.checked, !target_maxListItemCount.disabled);
      assert.equals(checkbox.checked, !target_refreshInSeconds.disabled);

      checkbox.click();
    }
  },
  testOnCssDppRadioTextChange : function () {
    let target = this.document.getElementById("layout.css.devPixelsPerPx");
    let radioGroup = this.document.getElementById("uiCssDpp-radio");
    let textbox = this.document.getElementById("uiCssDpp-text");
    let origval = target.value;

    radioGroup.getItemAtIndex(0).click();
    assert.equals("-1.0", radioGroup.value);
    assert.equals(true, textbox.disabled);
    //assert.equals("-1.0", target.value);
    textbox.value = 1.1;
    textbox.click();
    //assert.equals("-1.0", target.value);

    radioGroup.getItemAtIndex(1).click();
    assert.equals("*", radioGroup.value);
    assert.equals(false, textbox.disabled);
    textbox.value = 1.1;
    textbox.click();
    assert.equals("1.1", target.value);
    textbox.value = 1.2;
    textbox.click();
    assert.equals("1.2", target.value);

    target.value = origval;
  },
  testOnCssDppSyncFrom : function () {
    let preference = this.document.getElementById("layout.css.devPixelsPerPx");
    let radioGroup = this.document.getElementById("uiCssDpp-radio");
    let textbox = this.document.getElementById("uiCssDpp-text");
    let origval = preference.value;

    preference.value = "-1.0";
    assert.equals("-1.0", radioGroup.value);
    assert.equals(true, textbox.disabled);

    preference.value = "-0.1";
    assert.equals("-1.0", radioGroup.value);
    assert.equals(true, textbox.disabled);
    preference.value = "0.0";
    assert.equals("-1.0", radioGroup.value);
    assert.equals(true, textbox.disabled);

    preference.value = "0.1";
    assert.equals("*", radioGroup.value);
    assert.equals(false, textbox.disabled);

    preference.value = "1.0";
    assert.equals("*", radioGroup.value);
    assert.equals(false, textbox.disabled);

    preference.value = origval;
  },
  testOnMiddlemousePasteSyncFrom: function () {
    let checkbox = this.document.querySelector("checkbox[preference='middlemouse.paste']");
    let target = this.document.querySelector("checkbox[preference='middlemouse.contentLoadURL']");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, target.disabled);
      checkbox.click();
    }
  }
}
