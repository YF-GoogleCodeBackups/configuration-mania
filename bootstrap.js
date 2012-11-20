const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

function _import(params, src, scope) {
    const IOS = Cc["@mozilla.org/network/io-service;1"]
      .getService(Ci.nsIIOService);
    let uri = null;
    if (params.installPath.isDirectory()) {
        let filepath = params.installPath.clone();
        src.split("/").forEach(function(v) { filepath.append(v); } );
        uri = IOS.newFileURI(filepath).spec;
    } else {
        let jarfileuri = IOS.newFileURI(params.installPath).spec;
        uri = "jar:" + jarfileuri + "!/" + src;
    }

    Cu.import(uri, scope);
}

function handleChromeManifestFile(params, aMode) {
    let appVer = Cc["@mozilla.org/xre/app-info;1"]
      .getService(Ci.nsIXULAppInfo)
      .platformVersion;
    let comp = Cc["@mozilla.org/xpcom/version-comparator;1"]
      .getService(Ci.nsIVersionComparator)
      .compare(appVer, "10.0");

    if (comp < 0) {
        if (aMode == "setup") {
            Components.manager.addBootstrappedManifestLocation(params.installPath);
        } else if (aMode == "release") {
            Components.manager.removeBootstrappedManifestLocation(params.installPath);
        }
    }
}

function BrowserWindowObserver(params, handlers) {
    this.params = params;
    this.handlers = handlers;
}
BrowserWindowObserver.prototype = {
    observe: function (aSubject, aTopic, aData) {
        if (aTopic == "domwindowopened") {
            // Let this notified when DOM content loaded.
            aSubject.QueryInterface(Ci.nsIDOMWindow)
              .addEventListener("DOMContentLoaded", this, false);
        } else if (aTopic == "domwindowclosed") {
            if (aSubject.document.documentElement.getAttribute("windowtype") == "navigator:browser") {
                this.handlers.onShutdown(this.params, aSubject);
            }
        }
    },
    handleEvent: function(aEvent) {
        let aWindow = aEvent.currentTarget;
        aWindow.removeEventListener(aEvent.type, this, false);

        if (aWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser") {
            this.handlers.onStartup(this.params, aWindow);
        }
    }
};
var _gWindowListener = null;
var _gScope = null;

function startup(params, aReason) {
    // setup the chrome.manifest.
    handleChromeManifestFile(params, "setup");

    // load main lib.
    _gScope = {};
    _import(params, "lib/main.js", _gScope);

    // notify startup to main lib.
    _gScope.startup(params, aReason);
    let ww = Cc["@mozilla.org/embedcomp/window-watcher;1"]
      .getService(Ci.nsIWindowWatcher);
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator);
    _gWindowListener = new BrowserWindowObserver(params, {
        onStartup: _gScope.browserWindowStartup,
        onShutdown: _gScope.browserWindowShutdown
    });
    ww.registerNotification(_gWindowListener);
    let winenu = wm.getEnumerator("navigator:browser");
    while (winenu.hasMoreElements()) {
        _gScope.browserWindowStartup(params, winenu.getNext());
    }
    
}

function shutdown(params, aReason) {
    // release the chrome.manifest.
    handleChromeManifestFile(params, "release");

    // notify startup to main lib.
    _gScope.shutdown(params, aReason);
    let ww = Cc["@mozilla.org/embedcomp/window-watcher;1"]
      .getService(Ci.nsIWindowWatcher);
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator);
    ww.unregisterNotification(_gWindowListener);
    _gWindowListener = null;
    let winenu = wm.getEnumerator("navigator:browser");
    while (winenu.hasMoreElements()) {
        _gScope.browserWindowShutdown(params, winenu.getNext());
    }
}

function install(params, aReason) {
}

function uninstall(params, aReason) {
}
