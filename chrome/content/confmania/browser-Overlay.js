window.addEventListener("load", function () {
    (function () {
        function onConfManiaOpen() {
            var isInContent = gPrefService.getBoolPref('browser.preferences.inContent');
            var isInstantApply = gPrefService.getBoolPref('browser.preferences.instantApply');

            if (isInContent) {
                openUILinkIn("chrome://confmania/content/preferences_in_content.xul", "tab");
            } else {
                var features = 'chrome,titlebar,toolbar,centerscreen,resizable';
                features += (isInstantApply)? ',dialog=no' : ',modal';
  
                var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
                    .getService(Components.interfaces.nsIWindowMediator)
                    .getMostRecentWindow('Browser:Confmania');
                if (!!win) {
                    win.focus();
                } else {
                    openDialog("chrome://confmania/content/preferences.xul", "confmania", features);
                }
            }
        }

        var menuItem = window.document.getElementById("ConfMania:Open");
        menuItem.addEventListener("command", onConfManiaOpen, false);
    }).call(new Object());
}, false);
