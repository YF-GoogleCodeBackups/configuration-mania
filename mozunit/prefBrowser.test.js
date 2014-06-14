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
    prefWin.showPane(cmwin.document.getElementById("paneBrowser"));

    this.window = cmwin.document.defaultView;
    this.document = cmwin.document;
  },
  tearDown: function() {
  },

  // TEST ####################
  
  testInit: function() {
    assert.isDefined(this.window.gPrefWindow.prefBrowser);

    assert.isTrue(this.document.getElementById("browserCacheDiskCacheFolder").placeholder != "");
  },
  testInitUA: function() {
    assert.isTrue(this.document.getElementById("ua-value").placeholder != "");

    let presetpopup = this.document.getElementById("ua-presets-popup");
    assert.isTrue(presetpopup.childNodes.length > 0);
    assert.isTrue(Array.some(presetpopup.childNodes, function(v) {
      return (v.tagName == "menu");
    }));

    for (let i = 0; i < presetpopup.childNodes.length; i++) {
      let menu = presetpopup.childNodes[i];
      if (menu.tagName == "menu") {
        assert.isTrue(menu.itemCount > 0);
        for (let j = 0; j < menu.length; j++) {
          let item = menu.getItemAtIndex(j);
          assert.equals(item.tagName == "menuitem");
          assert.isTrue(item.label != "");
          assert.isTrue(item.value != "");
        }
      } else if (menu.tagName == "menuseparator") {
      }
    }
  },
  testInitBrowserBoxTab: function() {
    let paneBrowserBoxTab = this.document.getElementById("paneBrowserBoxTab");
    assert.equals("true", this.document.getElementById(paneBrowserBoxTab.value).getAttribute("selected"));
  },
  testOnPaneBrowserBoxTabSelected: function() {
    let paneBrowserBoxTab = this.document.getElementById("paneBrowserBoxTab");

    for (let i = 0; i < paneBrowserBoxTab.itemCount; i++) {
      paneBrowserBoxTab.getItemAtIndex(i).click();
      assert.equals(i, paneBrowserBoxTab.selectedIndex);
      sleep(100);
      assert.equals("true", this.document.getElementById(paneBrowserBoxTab.value).getAttribute("selected"));
    }
  },
  testOnDomainGaussSyncFrom: function() {
    let checkbox = this.document.getElementById("smartbrowsing-domainGuessingEnabled");
    let target = this.document.getElementById("smartbrowsing-domainGuessingPrefix");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  testOnAutoCompleteSyncFrom: function() {
    let checkbox = this.document.getElementById("urlbar-autoComplete-disabled");
    let target = this.document.getElementById("urlbar-delay");

    for (let i = 0; i < 2; i++) {
      assert.equals(!checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  testOnHtmlFrameSyncFrom: function() {
    let checkbox = this.document.getElementById("html-frameEnabled");
    let target = this.document.getElementById("html-frameForceResizability");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  testOnHTMLLoadImageSyncFrom: function() {
    let pref = this.document.getElementById("permissions.default.image");
    let origval = pref.value;

    pref.value = 0;  assert.equals(false, this.window.gPrefWindow.prefBrowser.onHTMLLoadImageSyncFrom());
    pref.value = 1;  assert.equals(true,  this.window.gPrefWindow.prefBrowser.onHTMLLoadImageSyncFrom());
    pref.value = 2;  assert.equals(false, this.window.gPrefWindow.prefBrowser.onHTMLLoadImageSyncFrom());
    pref.value = 3;  assert.equals(true,  this.window.gPrefWindow.prefBrowser.onHTMLLoadImageSyncFrom());

    pref.value = origval;
  },
  testOnHTMLLoadImageSyncTo: function() {
    let pref = this.document.getElementById("permissions.default.image");
    let origval = pref.value;
    let checkbox = this.document.getElementById("html-loadImages");

    for (let i = 0; i < 2; i++) {
      checkbox.click();
      assert.equals((checkbox.checked)? 1 : 2, pref.value);
    }

    pref.value = origval;
  },
  testOnFocusHighlightSyncFrom: function() {
    let checkbox = this.document.getElementById("focus-highlight-enabled");
    let target = this.document.getElementById("focus-bg-color");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  testOnAccelerationSyncFrom: function() {
    let checkbox = this.document.querySelector("checkbox[preference='layers.acceleration.disabled']");
    let target = this.document.querySelector("checkbox[preference='layers.acceleration.force-enabled']");

    for (let i = 0; i < 2; i++) {
      assert.equals(!checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  testOnDirect2DSyncFrom: function() {
    let checkbox = this.document.querySelector("checkbox[preference='gfx.direct2d.disabled']");
    let target = this.document.querySelector("checkbox[preference='gfx.direct2d.force-enabled']");

    for (let i = 0; i < 2; i++) {
      assert.equals(!checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  testOnTabsCloseButtonSyncFrom: function() {
    let radiogroup = this.document.querySelector("radiogroup[preference='browser.tabs.closeButtons']");
    let target = this.document.getElementById("tabs-tabClipWidth");
    
    for (let i = 0; i < radiogroup.itemCount; i++) {
      let index = (radiogroup.selectedIndex + 1) % radiogroup.itemCount
      radiogroup.getItemAtIndex(index).click();
      assert.equals(radiogroup.value == 1, !target.disabled);
    }
  },
  testOnSessionStoreRestoreOnDemandSyncFrom: function() {
    let checkbox = this.document.querySelector("checkbox[preference='browser.sessionstore.restore_on_demand']");
    let target1 = this.document.querySelector("checkbox[preference='browser.sessionstore.restore_hidden_tabs']");
    let target2 = this.document.querySelector("checkbox[preference='browser.sessionstore.restore_pinned_tabs_on_demand"']");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, target1.disabled);
      assert.equals(checkbox.checked, !target2.disabled);
      checkbox.click();
    }
  },
  testOnSessionStoreWarnOnQuitSyncFrom: function() {
    let checkbox = this.document.querySelector("checkbox[preference='browser.warnOnQuit']");
    let target = this.document.querySelector("checkbox[preference='browser.showQuitWarning']");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  testOnMultiMediaWMFEnabledSyncFrom: function() {
    let checkbox = this.document.querySelector("checkbox[preference='media.windows-media-foundation.enabled']");
    let target = this.document.querySelector("checkbox[preference='media.windows-media-foundation.play-stand-alone']");
    let checkbox_origval = checkbox.value;
    let target_origval = target.value;

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target.disabled);
      checkbox.click();
    }
    checkbox.value = checkbox_origval;
    target.value = target_origval;
  },
  testOnDownloadUseToolkitUISyncFrom: function() {
    let checkbox = this.document.querySelector("checkbox[preference='browser.download.useToolkitUI']");
    let label = this.document.querySelector("label[control='browserDLFlashCount-gr']");
    let radiogroup = this.document.getElementById("browserDLFlashCount-gr");
    let target = this.document.querySelector("textbox[preference='browser.download.manager.flashCount']")

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, label.disabled);
      assert.equals(checkbox.checked, radiogroup.disabled);
      for (let j = 0; j < radiogroup.itemCount; j++) {
        assert.equals(checkbox.checked, radiogroup.getItemAtIndex(j).disabled);
      }
      assert.equals(checkbox.checked, target.disabled);

      checkbox.click();
    }
  },
  testOnInterruptParseSyncFrom: function() {
    let checkbox = this.document.getElementById("speed-interrupt-parsing");
    let target = this.document.getElementById("speed-max-tokenizing-time");

    for (let i = 0; i < 2; i++) {
      assert.equals(!checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  testOnMemoryEnableSyncFrom: function() {
    let checkbox = this.document.getElementById("speed-cache-memory-enable");
    let target = this.document.getElementById("speed-cache-memory-capacity");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  testOnEditorExternalSyncFrom: function() {
    let checkbox = this.document.getElementById("others-editorExternal");
    let target = this.document.getElementById("others-editorExternal-path");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  testGetFirefoxUserAgent: function() {
    let ua = this.window.gPrefWindow.prefBrowser.getFirefoxUserAgent();

    assert.matches(/^Mozilla\/5.0 \(/, ua);
    assert.matches(/Gecko\/[0-9\.]+/, ua);
    assert.matches(/Firefox\/[0-9\.]+/, ua);

    ua = this.window.gPrefWindow.prefBrowser.getFirefoxUserAgent({
      platform: "%PLATFORM%",
      comatDevice: undefined,
      oscpu: "%OSCPU%",
      misc: "%MISC%"
    });
    assert.matches(/^Mozilla\/5.0 \(/, ua);
    assert.matches(/Gecko\/[0-9\.]+/, ua);
    assert.matches(/Firefox\/[0-9\.]+/, ua);
    assert.matches(/%PLATFORM%/, ua);
    assert.matches(/%OSCPU%/, ua);
    assert.matches(/%MISC%/, ua);
  },
  testOnUserAgentPresetCommanded: function() {
    let target = this.document.getElementById("ua-value");
    let origval = target.value;

    this.window.gPrefWindow.prefBrowser.onUserAgentPresetCommanded({
      target: {value: "***TEST UA***"} /* Dummy Event Object */
    });
    assert.equals("***TEST UA***", target.value);

    let menuitem = this.document.querySelector("#ua-presets-popup menuitem[value]");
    assert.isDefined(menuitem);

    menuitem.click();
    assert.equals(menuitem.value, target.value);

    target.value = origval;
    target.click();
  },
  testOnResetUserAgent: function() {
    let target = this.document.getElementById("ua-value");
    let origval = target.value;

    let hasValue = function(aPref) {
      if (aPref.instantApply) {
        return (aPref.hasUserValue);
      } else {
        return (aPref.value !== undefined);
      }
    }

    target.value = "***USER DEFINED VALUE***";
    target.click();
    assert.isTrue(hasValue(this.document.getElementById("general.useragent.override")));

    let resetBtn = this.document.querySelector("#ua hbox button[oncommand*=resetUserAgent]");
    resetBtn.click();
    assert.equals("", target.value);
    assert.isFalse(hasValue(this.document.getElementById("general.useragent.override")));

    target.value = origval;
    target.click();
  },
  //testOnSpeedPaintReset: function() {
  //},
  //testOnSynchNotifyInterval: function() {
  //},
  //testOpenBrowse: function() {
  //},
  testOnOthersGeoEnabledSyncFrom : function () {
    let checkbox = this.document.querySelector("checkbox[preference='geo.enabled']");
    let target1 = this.document.getElementById("others-geoExceptions");
    let target2 = this.document.getElementById("others-geoWifiUri");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target1.disabled);
      assert.equals(checkbox.checked, !target2.disabled);
      checkbox.click();
    }
  },
  //testOnOthersGeoExceptionsCommand : function() {
  //},
  //testOnOthersGeoWifiUriBrowse: function() {
  //},
  testOnOthersGeoWifiUriReset: function() {
    let target = this.document.getElementById("others-geoWifiUri");
    let origval = target.value;

    let hasValue = function(aPref) {
      if (aPref.instantApply) {
        return (aPref.hasUserValue);
      } else {
        return (aPref.value !== undefined);
      }
    }

    target.value = "***USER DEFINED VALUE***";
    target.click();
    assert.isTrue(hasValue(this.document.getElementById("geo.wifi.uri")));

    let resetBtn = this.document.querySelector("hbox button[oncommand*=onOthersGeoWifiUriReset]");
    resetBtn.click();
    assert.equals("", target.value);
    assert.isFalse(hasValue(this.document.getElementById("geo.wifi.uri")));

    target.value = origval;
    target.click();
  },
  testOnOthersFullScreenEnabledSyncFrom : function () {
    let checkbox = this.document.querySelector("checkbox[preference='full-screen-api.enabled']");
    let target = this.document.getElementById("others-full_screenExceptions");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  //testOnOthersGeoExceptionsCommand : function() {
  //},
  //testOnnBrowserCacheDiskCacheFolderBrowse: function() {
  //},
  testResetBrowserCacheDiskFolder: function() {
    let target = this.document.getElementById("browserCacheDiskCacheFolder");
    let origval = target.value;

    let hasValue = function(aPref) {
      if (aPref.instantApply) {
        return (aPref.hasUserValue);
      } else {
        return (aPref.value !== undefined);
      }
    }

    let file = Services.dirsvc.get("TmpD", Ci.nsIFile);
    file.append("test" + (new Date()).getTime() + "d");
    target.value = file.path;
    target.click();
    assert.isTrue(hasValue(this.document.getElementById("browser.cache.disk.parent_directory")));

    let resetBtn = this.document.querySelector("#speed-cache button[oncommand*=resetBrowserCacheDiskCacheFolder]");
    resetBtn.click();
    assert.equals("", target.value);
    assert.isFalse(hasValue(this.document.getElementById("browser.cache.disk.parent_directory")));

    target.value = origval;
    target.click();
  },
  //testResetAlertsSlide: function() {
  //},
  //testSetAlertsSlideLight: function() {
  //},
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
}
