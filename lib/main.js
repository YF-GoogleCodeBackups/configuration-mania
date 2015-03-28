"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var hasCustomizableUI = false;

var EXPORTED_SYMBOLS = ["startup", "shutdown", "browserWindowStartup", "browserWindowShutdown"];

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
try {
  Cu.import("resource:///modules/CustomizableUI.jsm");
  hasCustomizableUI = true;
} catch (ex) {
  if ((ex.result !== Components.results.NS_ERROR_FILE_NOT_FOUND) &&
      (ex.result !== Components.results.NS_ERROR_ILLEGAL_VALUE)) {
    throw ex;
  }
}

const kNSXUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

function AboutConfMania() { }
AboutConfMania.prototype = {
  classDescription: "about:confmania",
  contractID: "@mozilla.org/network/protocol/about;1?what=confmania",
  classID: Components.ID("{da341d45-077c-47e2-a9a6-fea161c222b3}"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),
  
  getURIFlags: function(aURI) {
    return Ci.nsIAboutModule.ALLOW_SCRIPT;
  },
  newChannel: function(aURI) {
    let channel = Services.io.newChannel("chrome://confmania/content/preferences_in_content.xul", null, null);
    channel.originalURI = aURI;
    return channel;
  }
};
const AboutConfManiaFactory = Object.freeze({
  createInstance: function (aOuter, aIID) {
    if (aOuter) {  throw Components.results.NS_ERROR_NO_AGGREGATION; }
    return new AboutConfMania();
  },
  lockFactory: function (aLock) { /* unused */ },
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIFactory])
});

function openConfMania(aWindow) {
  if ((Services.prefs.getPrefType('browser.preferences.inContent') == Ci.nsIPrefBranch.PREF_BOOL)
   && (Services.prefs.getBoolPref('browser.preferences.inContent'))) {
    aWindow.openUILinkIn("about:confmania", "tab");
  } else {
    let win = Services.wm.getMostRecentWindow('Browser:Confmania');
    if (!!win) {
      win.focus();
    } else {
      let features = 'chrome,titlebar,toolbar,centerscreen,resizable';
      features += (Services.prefs.getBoolPref('browser.preferences.instantApply'))? ",dialog=no" : ",modal";
      aWindow.openDialog("chrome://confmania/content/preferences.xul", "confmania", features);
    }
  }
}

function releaseAllConfMania() {
  let windows = [];

  let enu = Services.wm.getEnumerator('Browser:Confmania');
  let win = null;
  while (enu.hasMoreElements()) {
    windows.push(enu.getNext().QueryInterface(Ci.nsIDOMWindow));
  }

  enu = Services.wm.getXULWindowEnumerator(null);
  win = null;
  while (enu.hasMoreElements()) {
    let windowDocShell = enu.getNext().QueryInterface(Ci.nsIXULWindow).docShell;
    let containedDocShells = windowDocShell.getDocShellEnumerator(Ci.nsIDocShellTreeItem.typeContent, Ci.nsIDocShell.ENUMERATE_FORWARDS);
    while (containedDocShells.hasMoreElements()) {
      let childDoc = containedDocShells.getNext().QueryInterface(Ci.nsIDocShell).contentViewer.DOMDocument;
      if ((childDoc.location.href.indexOf("chrome://confmania/") == 0)
          || (childDoc.location.href == "about:confmania")) {
        windows.push(childDoc.defaultView);
      }
    }
  }

  for (let i = 0; i < windows.length; i++) {
    windows[i].close();
  }
}

function startup(params, aReason) {
  // Regist about:confmania
  {
    const registrar = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
    registrar.registerFactory(AboutConfMania.prototype.classID,
                              AboutConfMania.prototype.classDescription,
                              AboutConfMania.prototype.contractID,
                              AboutConfManiaFactory);
  }

  // For the Australis
  if (hasCustomizableUI) {
    let widget = {
      id: "confmania-australis-button",
      type: "button",
      viewId: CustomizableUI.AREA_PANEL,
      removable: true,
      label: "Configuration Mania", // TODO i18n
      tooltiptext: "Configuration Mania", // TODO i18n
      onCommand: function (aEvent) {
        if (aEvent.target && aEvent.target.ownerDocument && aEvent.target.ownerDocument.defaultView) {
          openConfMania(aEvent.target.ownerDocument.defaultView);
        }
      }
    };
    CustomizableUI.createWidget(widget);

    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    let uri = Services.io.newURI("chrome://confmania/skin/austrails.css", null, null);
    if (!sss.sheetRegistered(uri, sss.AGENT_SHEET)) {
      sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
    }
  }
}

function shutdown(params, aReason) {
  // Open a dialog that asks users on disabling/uninstalling if they want to keep the changes.
  if (aReason == 4/*ADDON_DISABLE*/ || aReason == 6/*ADDON_UNINSTALL*/) {
    let ps = Services.prompt;
    let buttonPressed = ps.confirmEx(null,
      "Configuration Mania",
      "Are you sure to revert to default all the Configuration Mania preference?", // TODO i18n
      ps.BUTTON_TITLE_IS_STRING * ps.BUTTON_POS_0 +
      ps.BUTTON_TITLE_CANCEL    * ps.BUTTON_POS_1 +
      ps.BUTTON_TITLE_IS_STRING * ps.BUTTON_POS_2,
      "Revert all the preference", // MDC requirement: "the default must be to revert them"
      null,
      "No. Keep all the preference.",
      null,
      { value: null });

    switch (buttonPressed) {
      case 0: // Revert
        for each (let fileName in ["paneBrowser.xul", "paneSecurity.xul", "paneHTTP.xul", "paneUI.xul", "paneAddons.xul", "paneDebug.xul"]) {
          let req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
                      .createInstance(Ci.nsIXMLHttpRequest);
          req.open("GET", "chrome://confmania/content/" + fileName, false);
          req.send(null);
          let doc = req.responseXML;
          Array.forEach(doc.querySelectorAll("preference[name]"), function (v) {
            let prefName = v.getAttribute("name");
            if (Services.prefs.prefHasUserValue(prefName)) {
              Services.prefs.clearUserPref(prefName);
            }
          });
        }
        break;
      case 2: // Keep
        // do nothing.
        break;
      default: // Cancel
        let am = {};
        Cu.import("resource://gre/modules/AddonManager.jsm", am);
        am.AddonManager.getAddonByID(params.id, function (addon) {
          if (addon) {
            addon.userDisabled = false; // Cancel disabling the addon.
          }
        });
        break;
    }
  }

  releaseAllConfMania();

  // Unregist about:confmania
  {
    const registrar = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
    registrar.unregisterFactory(AboutConfMania.prototype.classID,
                                AboutConfManiaFactory);
  }


  // For the Australis
  if (hasCustomizableUI) {
    CustomizableUI.destroyWidget("confmania-australis-button");

    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    let uri = Services.io.newURI("chrome://confmania/skin/austrails.css", null, null);
    if (sss.sheetRegistered(uri, sss.AGENT_SHEET)) {
      sss.unregisterSheet(uri, sss.AGENT_SHEET);
    }
  }
}

function browserWindowStartup(params, aWindow) {
  let document = aWindow.document;

  let oMainCommandSet = document.getElementById("mainCommandSet");
  if (oMainCommandSet) {
    let oConfManiaOpen = document.createElement("command");
    oConfManiaOpen.setAttribute("id", "ConfMania:Open");
    oConfManiaOpen.addEventListener("command", function (event) {
      openConfMania(aWindow);
    }, false);
    oMainCommandSet.appendChild(oConfManiaOpen);
  }

  // On the classical menubar
  let oMenuPreferences = document.getElementById("menu_preferences");
  if (oMenuPreferences) {
    let oMenuPrefParent = oMenuPreferences.parentNode;

    let oMenuConfmania = document.createElement("menuitem");
    oMenuConfmania.setAttribute("id", "confmania");
    oMenuConfmania.setAttribute("command", "ConfMania:Open");
    oMenuConfmania.setAttribute("label", "Configuration Mania");// TODO i18n

    oMenuPrefParent.insertBefore(oMenuConfmania, oMenuPreferences.nextSibling);
  }

  // On the Firefox menu
  let oAppmenuPreferences = document.getElementById("appmenu_preferences");
  if (oAppmenuPreferences) {
    let oAppmenuPrefParent = oAppmenuPreferences.parentNode;

    let oAppmenuConfmania = document.createElement("menuitem");
    oAppmenuConfmania.setAttribute("id", "appmenu_confmania");
    oAppmenuConfmania.setAttribute("command", "ConfMania:Open");
    oAppmenuConfmania.setAttribute("label", "Configuration Mania");// TODO i18n

    oAppmenuPrefParent.insertBefore(oAppmenuConfmania, oAppmenuPreferences.nextSibling);
  }
}

function browserWindowShutdown(params, aWindow) {
  let document = aWindow.document;

  for each (let id in ["ConfMania:Open", "confmania", "appmenu_confmania"]) {
    let oElem = document.getElementById(id);
    while (oElem != null) {
      oElem.parentNode.removeChild(oElem);
      oElem = document.getElementById(id);
    }
  }
}
