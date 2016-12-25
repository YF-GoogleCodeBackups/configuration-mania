gPrefWindow.prefSecurity = {
  init : function(){
    window.removeEventListener("DOMContentLoaded", gPrefWindow.prefSecurity.init, false);

    document.getElementById("passwordTimeout").value
     = Components.classes["@mozilla.org/security/pk11tokendb;1"]
     .getService(Components.interfaces.nsIPK11TokenDB)
     .getInternalKeyToken().getAskPasswordTimeout();

    gPrefWindow.prefSecurity.onPaneSecurityBoxTabSelected();
  },
  onSSLProtocolVersionsSyncFrom: function() {
    let gTlsPrefElements = document.querySelectorAll("#security-tls-version checkbox");

    // get minimum and maximum allowed protocol and locked status
    let minVersion = document.getElementById("security.tls.version.min").value;
    let maxVersion = document.getElementById("security.tls.version.max").value;
    let minLocked  = document.getElementById("security.tls.version.min").locked;
    let maxLocked  = document.getElementById("security.tls.version.max").locked;

    // set checked, disabled, and locked status for each protocol checkbox
    for (let index = 0; index < gTlsPrefElements.length; index++) {
      let currentBox = gTlsPrefElements[index];
      currentBox.checked = (index >= minVersion) && (index <= maxVersion);

      if ((minLocked && maxLocked) || (minLocked && index <= minVersion) ||
                                      (maxLocked && index >= maxVersion)) {
        // boxes subject to a preference's locked status are disabled and grayed
        currentBox.removeAttribute("nogray");
        currentBox.disabled = true;
      } else {
        // boxes which the user can't uncheck are disabled but not grayed
        currentBox.setAttribute("nogray", "true");
        currentBox.disabled = (index > minVersion && index < maxVersion) ||
                              (index == minVersion && index == maxVersion);
      }
    }

    // set data-preference-for-context attribute
    for (let index = 0; index < gTlsPrefElements.length; index++) {
      let currentBox = gTlsPrefElements[index];
      if (index <= minVersion) {
        currentBox.setAttribute("data-preference-for-context", "security.tls.version.min");
      } else if (maxVersion <= index) {
        // Note: care nothing in case of "minVersion == maxVersion == index == gTlsPrefElements.length"
        currentBox.setAttribute("data-preference-for-context", "security.tls.version.max");
      } else {
        currentBox.removeAttribute("data-preference-for-context");
      }
    }

    return undefined;
  },
  onSSLProtocolVersionsChange: function() {
    let gTlsPrefElements = document.querySelectorAll("#security-tls-version checkbox");

    // this is called whenever a checkbox changes
    let minVersion = -1;
    let maxVersion = -1;
  
    // find the first and last checkboxes which are now checked
    for (let index = 0; index < gTlsPrefElements.length; index++) {
      if (gTlsPrefElements[index].checked) {
        if (minVersion < 0) { // first box checked
          minVersion = index;
        }
        maxVersion = index;  // last box checked so far
      }
    }
  
    // if minVersion is valid, then maxVersion is as well -> update prefs
    if (minVersion >= 0) {
      document.getElementById("security.tls.version.min").value = minVersion;
      document.getElementById("security.tls.version.max").value = maxVersion;
    }
  },
  onSSLProtocolVersionsReset: function() {
    gPrefWindow.resetPref(document.getElementById("security.tls.version.min"));
    gPrefWindow.resetPref(document.getElementById("security.tls.version.max"));
  },
  syncFromPopupwin: function() {
    var mData = document.getElementById("dom.popup_allowed_events");
    var options = (mData.value || "").split(/\s+/);
    var checks = document.getElementById("popupwin-e").getElementsByTagName("listitem");
    Array.forEach(checks, function(v) {
      v.checked = (options.indexOf(v.getAttribute("value")) >= 0)? true : false;
    });

    return undefined;
  },
  syncToPopupwin: function() {
    var checks = document.getElementById("popupwin-e").getElementsByTagName("listitem");
    var val = Array.map(checks, function(v) {
      return (v.checked)? v.getAttribute("value") : "";
    }).join(" ").replace(/\s+/g, " ");

    return val;
  },
  onSendRefererSecureXSiteSyncFrom: function() {
    let disabled = document.getElementById("network.http.sendRefererHeader").value == "0";
    for (let v of document.querySelectorAll('[id^="network.http.referer."], [id="network.http.sendSecureXSiteReferrer"]')) {
      v.disabled = disabled;
    }
    return undefined; // no override
  },
  onTrackingProtectionEnabledSyncFrom: function() {
    let disabled = document.getElementById("privacy.trackingprotection.enabled").value;
    document.getElementById("privacy.trackingprotection.pbmode.enabled").disabled = disabled;
    return undefined; // no override
  },
  onTrackingProtectionExceptionsCommand: function() {
    let params = { blockVisible: true,  sessionVisible: false, allowVisible: true, prefilledHost: "", permissionType: "trackingprotection" };
    params.windowTitle = document.getElementById("trackingprotection-showTrackingProtectionExceptions").getAttribute("data-dialog-title");
    params.introText   = document.getElementById("trackingprotection-showTrackingProtectionExceptions").getAttribute("data-dialog-desc");

    openDialog("chrome://browser/content/preferences/permissions.xul", 
               "Browser:Permissions", "resizable=yes", params);
  },
  updatePasswordAskTimes : function(){
    var radiogroup = document.getElementById("passwordAskTimes");
    var askEveryTimeHidden = document.getElementById("askEveryTimeHidden");
    document.getElementById("passwordTimeout").disabled = (String(radiogroup.value) != "1");
    askEveryTimeHidden.checked = (String(radiogroup.value) == "-1");
    if(askEveryTimeHidden._initilized) {
      document.getElementById("paneSecurity").userChangedValue(askEveryTimeHidden);
    } else {
      askEveryTimeHidden._initilized = true;
    }
  },
  onPaneSecurityBoxTabSelected : function () {
    let paneSecurityBoxTab = document.getElementById("paneSecurityBoxTab");
    let selectedPanel = document.getElementById(paneSecurityBoxTab.value);
    selectedPanel.parentNode.selectedPanel = selectedPanel;

    for (let i = 0; i < paneSecurityBoxTab.itemCount; i++) {
      let radioItem = paneSecurityBoxTab.getItemAtIndex(i);
      let pane = document.getElementById(radioItem.value);
      pane.setAttribute("selected", (radioItem.selected)? "true" : "false");
    }
  }
};

window.addEventListener("DOMContentLoaded", gPrefWindow.prefSecurity.init, false);
