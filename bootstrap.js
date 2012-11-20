const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

function convertUrl(params, src) {
    let uri = null;
    if (params.installPath.isDirectory()) {
        let filepath = params.installPath.clone();
        src.split("/").forEach(function(v) { filepath.append(v); } );
        uri = Services.io.newFileURI(filepath).spec;
    } else {
        let jarfileuri = Services.io.newFileURI(params.installPath).spec;
        uri = "jar:" + jarfileuri + "!/" + src;
    }

    return uri;
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
    // load main lib.
    _gScope = {};
    Cu.import(convertUrl(params, "lib/main.js"), _gScope);

    // notify startup to main lib.
    _gScope.startup(params, aReason);
    
    _gWindowListener = new BrowserWindowObserver(params, {
        onStartup: _gScope.browserWindowStartup,
        onShutdown: _gScope.browserWindowShutdown
    });
    Services.ww.registerNotification(_gWindowListener);
    let winenu = Services.wm.getEnumerator("navigator:browser");
    while (winenu.hasMoreElements()) {
        _gScope.browserWindowStartup(params, winenu.getNext());
    }
    
}

function shutdown(params, aReason) {
    // notify startup to main lib.
    _gScope.shutdown(params, aReason);
    Services.ww.unregisterNotification(_gWindowListener);
    _gWindowListener = null;
    let winenu = Services.wm.getEnumerator("navigator:browser");
    while (winenu.hasMoreElements()) {
        _gScope.browserWindowShutdown(params, winenu.getNext());
    }

    Cu.unload(convertUrl(params, "lib/main.js"));
}

function install(params, aReason) {
}

function uninstall(params, aReason) {
}
