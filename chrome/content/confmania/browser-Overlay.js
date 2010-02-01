if ("undefined" == typeof(window["ConfMania"])) {
  window["ConfMania"] = {
    "open": function() {
      var features = 'chrome,titlebar,toolbar,centerscreen,resizable';
      features += gPrefService.getBoolPref('browser.preferences.instantApply')? ',dialog=no' : ',modal';
  
      var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
       .getService(Components.interfaces.nsIWindowMediator)
       .getMostRecentWindow('Browser:Confmania');
      if (!!win) {
        win.focus();
      } else {
        openDialog("chrome://confmania/content/preferences.xul", "confmania", features);
      }
    }
  };
}
