"use strict";

let {Cc, Ci, Cu, Cr, Cm } = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");

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
var _gScope = require("./lib/main.js");

exports.main = function main(aOptions, aCallback) {
    // notify startup to main lib.
    _gScope.startup(aOptions);
    
    _gWindowListener = new BrowserWindowObserver({reason: aOptions.reason}, {
        onStartup: _gScope.browserWindowStartup,
        onShutdown: _gScope.browserWindowShutdown
    });
    Services.ww.registerNotification(_gWindowListener);
    let winenu = Services.wm.getEnumerator("navigator:browser");
    while (winenu.hasMoreElements()) {
        _gScope.browserWindowStartup({reason: aOptions.reason}, winenu.getNext());
    }
};

exports.onUnload = function onUnload(aReason) {
    // notify startup to main lib.
    _gScope.shutdown(aReason);
    Services.ww.unregisterNotification(_gWindowListener);
    _gWindowListener = null;
    let winenu = Services.wm.getEnumerator("navigator:browser");
    while (winenu.hasMoreElements()) {
        _gScope.browserWindowShutdown({reason: aReason}, winenu.getNext());
    }
}
