const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var hasCustomizableUI = false;

EXPORTED_SYMBOLS = ["startup", "shutdown", "browserWindowStartup", "browserWindowShutdown"];

Cu.import("resource://gre/modules/Services.jsm");
try {
  Cu.import("resource://modules/CustomizableUI.jsm");
  hasCustomizableUI = true;
} catch (ex) {
  if (ex.result !== Components.results.NS_ERROR_FILE_NOT_FOUND) {
    throw ex;
  }
}

function openConfMania(aWindow) {
  if (Services.prefs.getBoolPref('browser.preferences.inContent')) {
    aWindow.openUILinkIn("chrome://confmania/content/preferences_in_content.xul", "tab");
  } else {
    var win = Services.wm.getMostRecentWindow('Browser:Confmania');
    if (!!win) {
      win.focus();
    } else {
      var features = 'chrome,titlebar,toolbar,centerscreen,resizable';
      features += (Services.prefs.getBoolPref('browser.preferences.instantApply'))? ",dialog=no" : ",modal";
      aWindow.openDialog("chrome://confmania/content/preferences.xul", "confmania", features);
    }
  }
}

function releaseAllConfMania() {
  var windows = [];

  var enu = Services.wm.getEnumerator('Browser:Confmania');
  var win = null;
  while (enu.hasMoreElements()) {
    windows.push(enu.getNext().QueryInterface(Ci.nsIDOMWindow));
  }

  enu = Services.wm.getXULWindowEnumerator(null);
  win = null;
  while (enu.hasMoreElements()) {
    var windowDocShell = enu.getNext().QueryInterface(Ci.nsIXULWindow).docShell;
    var containedDocShells = windowDocShell.getDocShellEnumerator(Ci.nsIDocShellTreeItem.typeContent, Ci.nsIDocShell.ENUMERATE_FORWARDS);
    while (containedDocShells.hasMoreElements()) {
      var childDoc = containedDocShells.getNext().QueryInterface(Ci.nsIDocShell).contentViewer.DOMDocument;
      if (childDoc.location.href.indexOf("chrome://confmania/") == 0) {
        windows.push(childDoc.defaultView);
      }
    }
  }

  for (var i = 0; i < windows.length; i++) {
    windows[i].close();
  }
}

function startup(params, aReason) {
  // For the Australis
  if (hasCustomizableUI) {
    var widget = {
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
      },
      onCreated: function (aNode) {
        aNode.style.minWidth = "16px"; // TODO force text visible or add icon
      }
    };
    CustomizableUI.createWidget(widget);
  }
}

function shutdown(params, aReason) {
  releaseAllConfMania();

  // For the Australis
  if (hasCustomizableUI) {
    CustomizableUI.destroyWidget("confmania-australis-button");
  }
}

function browserWindowStartup(params, aWindow) {
  var document = aWindow.document;

  var oMainCommandSet = document.getElementById("mainCommandSet");
  if (oMainCommandSet) {
    var oConfManiaOpen = document.createElement("command");
    oConfManiaOpen.setAttribute("id", "ConfMania:Open");
    oConfManiaOpen.addEventListener("command", function (event) {
      openConfMania(aWindow);
    }, false);
    oMainCommandSet.appendChild(oConfManiaOpen);
  }

  // On the classical menubar
  var oMenuPreferences = document.getElementById("menu_preferences");
  if (oMenuPreferences) {
    var oMenuPrefParent = oMenuPreferences.parentNode;

    var oMenuConfmania = document.createElement("menuitem");
    oMenuConfmania.setAttribute("id", "confmania");
    oMenuConfmania.setAttribute("command", "ConfMania:Open");
    oMenuConfmania.setAttribute("label", "Configuration Mania");// TODO i18n

    oMenuPrefParent.insertBefore(oMenuConfmania, oMenuPreferences.nextSibling);
  }

  // On the Firefox menu
  var oAppmenuPreferences = document.getElementById("appmenu_preferences");
  if (oAppmenuPreferences) {
    var oAppmenuPrefParent = oAppmenuPreferences.parentNode;

    var oAppmenuConfmania = document.createElement("menuitem");
    oAppmenuConfmania.setAttribute("id", "appmenu_confmania");
    oAppmenuConfmania.setAttribute("command", "ConfMania:Open");
    oAppmenuConfmania.setAttribute("label", "Configuration Mania");// TODO i18n

    oAppmenuPrefParent.insertBefore(oAppmenuConfmania, oAppmenuPreferences.nextSibling);
  }
}

function browserWindowShutdown(params, aWindow) {
  var document = aWindow.document;

  var removeElement = function (id) {
    var oElem = document.getElementById(id);
    while (oElem != null) {
      oElem.parentNode.removeChild(oElem);
      oElem = document.getElementById(id);
    }
  };
  removeElement("confmania");
  removeElement("ConfMania:Open");
  removeElement("appmenu_confmania");
}
