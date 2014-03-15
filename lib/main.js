"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var hasCustomizableUI = false;

var EXPORTED_SYMBOLS = ["startup", "shutdown", "browserWindowStartup", "browserWindowShutdown"];

Cu.import("resource://gre/modules/Services.jsm");
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

function openConfMania(aWindow) {
  if (Services.prefs.getBoolPref('browser.preferences.inContent')) {
    aWindow.openUILinkIn("chrome://confmania/content/preferences_in_content.xul", "tab");
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
      if (childDoc.location.href.indexOf("chrome://confmania/") == 0) {
        windows.push(childDoc.defaultView);
      }
    }
  }

  for (let i = 0; i < windows.length; i++) {
    windows[i].close();
  }
}

function startup(params, aReason) {
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
  releaseAllConfMania();

  // For the Australis
  if (hasCustomizableUI) {
    CustomizableUI.destroyWidget("confmania-australis-button");

    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    let uri = Services.io.newURI("chrome://confmania/skin/austrails.css", null, null);
    if (sss.sheetRegistered(uri, sss.AGENT_SHEET)) {
      sss.unregisterAndRegisterSheet(uri, sss.AGENT_SHEET);
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
