const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

EXPORTED_SYMBOLS = ["startup", "shutdown", "browserWindowStartup", "browserWindowShutdown"];

Cu.import("resource://gre/modules/Services.jsm");

function openConfMania(aWindow) {
  var win = Services.wm.getMostRecentWindow('Browser:Confmania');
  if (!!win) {
    win.focus();
  } else {
    var features = 'chrome,titlebar,toolbar,centerscreen,resizable';
    features += (Services.prefs.getBoolPref('browser.preferences.instantApply'))? ",dialog=no" : ",modal";
    aWindow.openDialog("chrome://confmania/content/preferences.xul", "confmania", features);
  }
}

function startup(params, aReason) {
}

function shutdown(params, aReason) {
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

  removeElement("ConfMania:Open");
  removeElement("appmenu_confmania");
}
