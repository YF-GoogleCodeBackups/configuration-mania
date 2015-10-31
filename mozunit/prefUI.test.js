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
    let win = Services.wm.getMostRecentWindow("navigator:browser");
    let cmd = win.document.getElementById("ConfMania:Open");
    let cmwin = Services.wm.getMostRecentWindow("Browser:Confmania");
    let prefWin  = cmwin.document.documentElement;
    prefWin.showPane(cmwin.document.getElementById("paneUI"));

    this.window = cmwin.document.defaultView;
    this.document = cmwin.document;
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

    origval1.checked = false;
    origval2.checked = false;
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
  testOnPreferenceInContentInvertedSyncFrom: function() {
    let checkbox = this.document.querySelector("checkbox[preference='browser.preferences.inContent']");
    let target1 = this.document.querySelector("checkbox[preference='browser.preferences.instantApply']");
    let target2 = this.document.querySelector("checkbox[preference='browser.preferences.instantApply']+description");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target1.disabled);
      assert.equals(checkbox.checked, !target2.disabled);
      checkbox.click();
    }
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
