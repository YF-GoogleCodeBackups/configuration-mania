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

      cmwin.document.getElementById("category-security").click();
    } else {
      throw new Error("about:confmania not found");
    }
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
    Array.forEach(target.querySelectorAll("listitem"), function(item) {
      if (item.checked) {
        val.push(item.value);
      }
    });
    assert.equals(mData.value.split(/\s+/).sort().join(" "), val.sort().join(" "));

    mData.value = "";
    this.window.gPrefWindow.prefSecurity.syncFromPopupwin();
    Array.forEach(target.querySelectorAll("listitem"), function(item) {
      assert.isFalse(item.checked);
    });

    mData.value = Array.map(target.querySelectorAll("listitem"), function(item) { return item.value }).join(" ");
    this.window.gPrefWindow.prefSecurity.syncFromPopupwin();
    Array.forEach(target.querySelectorAll("listitem"), function(item) {
      assert.isTrue(item.checked);
    });

    mData.value = origval;
    this.window.gPrefWindow.prefSecurity.syncFromPopupwin();
  },
  testSyncToPopupwin: function() {
    let mData = this.document.getElementById("dom.popup_allowed_events");
    let target = this.document.getElementById("popupwin-e");
    let origval = mData.value;

    assert.equals(mData.value.split(/\s+/).sort().join(" "), this.window.gPrefWindow.prefSecurity.syncToPopupwin().split(/\s+/).sort().join(" "));

    Array.forEach(target.querySelectorAll("listitem"), function(item) {
      item.checked = false;
    });
    assert.matches(/^\s*$/, this.window.gPrefWindow.prefSecurity.syncToPopupwin());

    let fullValues = [];
    Array.forEach(target.querySelectorAll("listitem"), function(item) {
      item.checked = true;
      fullValues.push(item.value);
    });
    assert.equals(fullValues.join(" "), this.window.gPrefWindow.prefSecurity.syncToPopupwin());

    mData.value = origval;
    this.window.gPrefWindow.prefSecurity.syncFromPopupwin();
  },
  testOnSSLProtocolVersionsSyncFrom: function() {
    let mData = [this.document.getElementById("security.tls.version.min"),
                 this.document.getElementById("security.tls.version.max")];
    let origval = Array.map(mData, function (v) { return v.value; });
    let target = [this.document.getElementById("allowSSL30"),
                  this.document.getElementById("allowTLS10"),
                  this.document.getElementById("allowTLS11"),
                  this.document.getElementById("allowTLS12"),
                  this.document.getElementById("allowTLS13")];

    let applyValues = (function() {
      for (let i = 0; i < mData.length; i++) {
        mData[i].value = arguments[i];
      }
    }).bind(this);

    const TESTCASE = [
      { min: 0, max: 0, expected: "-...." },
      { min: 0, max: 1, expected: "xx..." },
      { min: 0, max: 2, expected: "x-x.." },
      { min: 0, max: 3, expected: "x--x." },
      { min: 0, max: 4, expected: "x---x" },
      { min: 1, max: 1, expected: ".-..." },
      { min: 1, max: 2, expected: ".xx.." },
      { min: 1, max: 3, expected: ".x-x." },
      { min: 1, max: 4, expected: ".x--x" },
      { min: 2, max: 2, expected: "..-.." },
      { min: 2, max: 3, expected: "..xx." },
      { min: 3, max: 3, expected: "...-." },
      { min: 3, max: 4, expected: "...xx" },
      { min: 4, max: 4, expected: "....-" },
    ];
    for (let tc_id = 0; tc_id < TESTCASE.length; tc_id++) {
      let tc = TESTCASE[tc_id];
      applyValues(tc.min, tc.max);

      let result = "";
      for (let i = 0; i < target.length; i++) {
        let val = " ";
        if (!target[i].checked && !target[i].disabled) {
          result += ".";
        } else if (target[i].checked && !target[i].disabled) {
          result += "x";
        } else if (target[i].checked && target[i].disabled && (target[i].getAttribute("nogray") == "true")) {
          result += "-";
        } else {
          result += "E";
        }
      }

      if (result !== tc.expected) {
        assert.fail("TC " + JSON.stringify(tc) + " : [" + tc.expected + "] is expected but actual is [" + result + "].");
      }
    }

    applyValues.apply(this, origval);
  },
  testOnSSLProtocolVersionsChange: function() {
    let mData = [this.document.getElementById("security.tls.version.min"),
                 this.document.getElementById("security.tls.version.max")];
    let origval = Array.map(mData, function (v) { return v.value; });
    let target = [this.document.getElementById("allowSSL30"),
                  this.document.getElementById("allowTLS10"),
                  this.document.getElementById("allowTLS11"),
                  this.document.getElementById("allowTLS12"),
                  this.document.getElementById("allowTLS13")];

    for (let min = 0; min < target.length; min++) {
      for (let max = min; max < target.length; max++) {
        for (let i = 0; i < target.length; i++) {
          target[i].checked = false;
          target[i].disabled = false;
        }
        target[min].click();
        target[max].click();

        if ((mData[0].value !== min) || (mData[1].value !== max)) {
          assert.fail("TC " + JSON.stringify({min: min, max: max}) + ": " +
                      JSON.stringify([min, max]) + " is expected but actual is " +
                      JSON.stringify([mData[0].value, mData[1].value]) + ".");
        }
      }
    }

    for (let i = 0; i < mData.length; i++) {
      mData[i].value = origval[i];
    }
  },
  testOnSSLProtocolVersionsReset: function() {
    let mData = [this.document.getElementById("security.tls.version.min"),
                 this.document.getElementById("security.tls.version.max")];
    let origval = Array.map(mData, function (v) { return v.value; });
    let target = [this.document.getElementById("allowSSL30"),
                  this.document.getElementById("allowTLS10"),
                  this.document.getElementById("allowTLS11"),
                  this.document.getElementById("allowTLS12"),
                  this.document.getElementById("allowTLS13")];

    mData[0].value = 0;
    mData[1].value = target.length - 1;

    let resetBtn = this.document.querySelector("#security-pane-ssl groupbox button[oncommand*=onSSLProtocolVersionsReset]");
    resetBtn.click();

    assert.isFalse(mData[0].hasUserValue);
    assert.isFalse(mData[1].hasUserValue);
    assert.isTrue(target[mData[0].value].checked);
    assert.isTrue(target[mData[1].value].checked);

    for (let i = 0; i < mData.length; i++) {
      mData[i].value = origval[i];
    }
  },
  testOnSendRefererSecureXSiteSyncFrom: function() {
    let radiogroup = this.document.getElementById("sendReferer");
    let target1 = this.document.querySelector("checkbox[preference=\"network.http.referer.spoofSource\"]");
    let target2 = this.document.getElementById("sendRefererTrimmingPolicy");
    let target3 = this.document.getElementById("sendRefererXOriginPolicy");
    let target4 = this.document.getElementById("sendRefererSecureXSite");
    
    for (let i = 0; i < radiogroup.itemCount; i++) {
      let index = (radiogroup.selectedIndex + 1) % radiogroup.itemCount
      radiogroup.getItemAtIndex(index).click();
      assert.equals(radiogroup.value != 0, !target1.disabled);
      assert.equals(radiogroup.value != 0, !target2.disabled);
      assert.equals(radiogroup.value != 0, !target2.labelElement.disabled);
      assert.equals(radiogroup.value != 0, !target3.disabled);
      assert.equals(radiogroup.value != 0, !target3.labelElement.disabled);
      assert.equals(radiogroup.value != 0, !target4.disabled);
    }
  },
  testOnTrackingProtectionEnabledSyncFrom: function() {
    let checkbox = this.document.getElementById("trackingprotection-enable");
    let target = this.document.getElementById("trackingprotection-pbmode-enable");
    
    for (let i = 0; i < 2; i++) {
      assert.equals(checkbox.checked, target.disabled);
      checkbox.click();
    }
  },
  //testOnTrackingProtectionExceptionsCommand: function() {
  //},
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
