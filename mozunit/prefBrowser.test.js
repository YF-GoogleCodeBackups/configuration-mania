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

      cmwin.document.getElementById("category-browser").click();
    } else {
      throw new Error("about:confmania not found");
    }
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
        let menuitems = menu.querySelectorAll("menupopup menuitem");
        assert.isTrue(menuitems.length > 0);
        for (let j = 0; j < menuitems.length; j++) {
          let item = menuitems[j];
          assert.isTrue(item.hasAttribute("label"));
          assert.notEquals(item.getAttribute("label"), "");
          assert.isTrue(item.hasAttribute("value"));
          assert.notEquals(item.getAttribute("value"), "");
        }
        assert.isTrue(menu.querySelectorAll("menu").length == 0);
      } else if (menu.tagName == "menuseparator") {
      } else if (menu.tagName == "menuitem") {
        assert.fail("Illegal menuitem");
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
  testOnAutoCompleteSyncFrom: function() {
    let checkbox = this.document.getElementById("urlbar-autoComplete-disabled");
    let target = this.document.getElementById("urlbar-delay");

    for (let i = 0; i < 2; i++) {
      assert.equals(!checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  testOnDomainGaussSyncFrom: function() {
    let checkbox = this.document.getElementById("urlbar-domainGuessingEnabled");
    let target1 = this.document.getElementById("urlbar-domainGuessingPrefix");
    let target2 = this.document.getElementById("urlbar-domainGuessingSuffix");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target1.disabled);
      assert.equals(checkbox.checked, !target2.disabled);
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
  testOnSessionStoreRestoreOnDemandSyncFrom: function() {
    let checkbox = this.document.querySelector("checkbox[preference='browser.sessionstore.restore_on_demand']");
    let target1 = this.document.querySelector("checkbox[preference='browser.sessionstore.restore_hidden_tabs']");
    let target2 = this.document.querySelector("checkbox[preference='browser.sessionstore.restore_pinned_tabs_on_demand']");

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
  testOnMultiMediaMediaSourceEnabledSyncFrom : function () {
    let checkbox = this.document.querySelector("checkbox[preference='media.mediasource.enabled']");
    let targets = this.document.querySelectorAll("checkbox[preference='media.mediasource.youtubeonly'], #multimedia-mediasource-formats checkbox[preference]");

    assert.isTrue(targets.length >= 2);
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < targets.length; j++) {
        assert.equals(checkbox.checked, !targets[j].disabled);
      }
      checkbox.click();
    }
  },
  testOnWebAPIGeoEnabledSyncFrom : function () {
    let checkbox = this.document.querySelector("checkbox[preference='geo.enabled']");
    let target1 = this.document.getElementById("webapi-geoExceptions");
    let target2 = this.document.getElementById("webapi-geoWifiUri");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target1.disabled);
      assert.equals(checkbox.checked, !target2.disabled);
      checkbox.click();
    }
  },
  //testOnWebAPIGeoExceptionsCommand : function() {
  //},
  //testOnWebAPIGeoWifiUriBrowse: function() {
  //},
  testOnWebAPIGeoWifiUriReset: function() {
    let target = this.document.getElementById("webapi-geoWifiUri");
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

    let resetBtn = this.document.querySelector("hbox button[oncommand*=onWebAPIGeoWifiUriReset]");
    resetBtn.click();
    assert.isFalse(hasValue(this.document.getElementById("geo.wifi.uri")));

    target.value = origval;
    target.click();
  },
  testOnWebAPIFullScreenEnabledSyncFrom : function () {
    let checkbox = this.document.querySelector("checkbox[preference='full-screen-api.enabled']");
    let target = this.document.getElementById("webapi-full_screenExceptions");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  testOnWebAPINetworkPredictorEnabledSyncFrom : function () {
    let checkbox = this.document.querySelector("checkbox[preference='network.predictor.enabled']");
    let target = this.document.querySelector("checkbox[preference='network.predictor.enable-hover-on-ssl']");

    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, !target.disabled);
      checkbox.click();
    }
  },
  //testOnWebAPIGeoExceptionsCommand : function() {
  //},
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

    assert.equals(false, checkbox.disabled);
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

    target.value = origval;
    target.click();

    let menuitemparent = this.document.querySelector("#ua-presets-popup menu menupopup");
    let menuitem = menuitemparent.querySelector("menuitem[value]");
    assert.isDefined(menuitem);

    // Ensure that the menuitem is built.
    this.document.getElementById("ua-presets-popup").showPopup();
    menuitemparent.showPopup();
    //sleep(100);
    menuitemparent.hidePopup();
    this.document.getElementById("ua-presets-popup").hidePopup();
    assert.isDefined(menuitem.value);

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
  //testOnBrowserCacheDiskCacheFolderBrowse: function() {
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
  testOnHelloAccessTokenSyncFrom : function() {
    let target = this.document.getElementById("browser-others-loop-forget");
    let checkbox = this.document.querySelector("checkbox[preference='loop.enabled']");

    let origvalLoopEnabled = this.document.getElementById("loop.enabled").value;
    let origvalHawkSessionToken = this.document.getElementById("loop.hawk-session-token").value;
    let origvalLoopKey = this.document.getElementById("loop.key").value;
    let origvalOtGuid = this.document.getElementById("loop.ot.guid").value;

    checkbox.checked = true;
    checkbox.click();
    assert.isFalse(checkbox.checked);

    assert.isTrue(target.disabled);
    this.document.getElementById("loop.hawk-session-token").value = "loop.hawk-session-token";
    assert.isTrue(target.disabled);
    this.document.getElementById("loop.key").value = "loop.key";
    assert.isTrue(target.disabled);
    this.document.getElementById("loop.ot.guid").value = "loop.ot.guid";
    assert.isTrue(target.disabled);

    checkbox.click();
    assert.isTrue(checkbox.checked);

    assert.isFalse(target.disabled);
    this.document.getElementById("loop.hawk-session-token").value = undefined;
    assert.isFalse(target.disabled);
    this.document.getElementById("loop.key").value = undefined;
    assert.isFalse(target.disabled);
    this.document.getElementById("loop.ot.guid").value = undefined;
    assert.isTrue(target.disabled);

    this.document.getElementById("loop.enabled").value = origvalLoopEnabled;
    this.document.getElementById("loop.hawk-session-token").value = origvalHawkSessionToken;
    this.document.getElementById("loop.key").value = origvalLoopKey;
    this.document.getElementById("loop.ot.guid").value = origvalOtGuid;
  },
  testOnHelloForgetAccessTokenCommanded : function() {
    let origvalLoopEnabled = this.document.getElementById("loop.enabled").value;
    let origvalHawkSessionToken = this.document.getElementById("loop.hawk-session-token").value;
    let origvalLoopKey = this.document.getElementById("loop.key").value;
    let origvalOtGuid = this.document.getElementById("loop.ot.guid").value;

    let hasValue = function(aPref) {
      if (aPref.instantApply) {
        return (aPref.hasUserValue);
      } else {
        return (aPref.value !== undefined);
      }
    }

    this.document.getElementById("loop.enabled").value = true;
    this.document.getElementById("loop.hawk-session-token").value = "loop.hawk-session-token";
    this.document.getElementById("loop.key").value = "loop.key";
    this.document.getElementById("loop.ot.guid").value = "loop.ot.guid";

    let resetBtn = this.document.getElementById("browser-others-loop-forget");
    assert.isFalse(resetBtn.disabled);
    resetBtn.click();

    assert.isTrue(resetBtn.disabled);

    assert.isFalse(hasValue(this.document.getElementById("loop.hawk-session-token")));
    assert.isFalse(hasValue(this.document.getElementById("loop.key")));
    assert.isFalse(hasValue(this.document.getElementById("loop.ot.guid")));

    this.document.getElementById("loop.enabled").value = origvalLoopEnabled;
    this.document.getElementById("loop.hawk-session-token").value = origvalHawkSessionToken;
    this.document.getElementById("loop.key").value = origvalLoopKey;
    this.document.getElementById("loop.ot.guid").value = origvalOtGuid;
  },
}
