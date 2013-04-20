window.addEventListener("load", (function () {
    const PREF_IN_CONTENT_URI = "chrome://confmania/content/preferences_in_content.xul";
    const PREF_ON_THE_DIALOG  = "chrome://confmania/content/preferences.xul";

    function onConfManiaOpen() {
        var isInContent = gPrefService.getBoolPref('browser.preferences.inContent');
        var isInstantApply = gPrefService.getBoolPref('browser.preferences.instantApply');

        if (isInContent) {
            openUILinkIn(PREF_IN_CONTENT_URI, "tab");
        } else {
            var features = 'chrome,titlebar,toolbar,centerscreen,resizable';
            features += (isInstantApply)? ',dialog=no' : ',modal';

            var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
                .getService(Components.interfaces.nsIWindowMediator)
                .getMostRecentWindow('Browser:Confmania');
            if (!!win) {
                win.focus();
            } else {
                openDialog(PREF_ON_THE_DIALOG, "confmania", features);
            }
        }
    }

    var menuItem = window.document.getElementById("ConfMania:Open");
    menuItem.addEventListener("command", onConfManiaOpen, false);

    // confmania page hides chrome automatically.
    if (XULBrowserWindow.inContentWhitelist.indexOf(PREF_IN_CONTENT_URI) < 0) {
        XULBrowserWindow.inContentWhitelist.push(PREF_IN_CONTENT_URI);
    }
}).bind({}), false);
