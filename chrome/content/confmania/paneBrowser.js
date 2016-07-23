gPrefWindow.prefBrowser = {
  init : function(){
    window.removeEventListener("DOMContentLoaded", gPrefWindow.prefBrowser.init, false);

    try {
      let cachedirpath = OS.Constants.Path.localProfileDir || OS.Constants.Path.profileDir;
      document.getElementById("browserCacheDiskCacheFolder").placeholder = cachedirpath;
    } catch(ex){}

    gPrefWindow.prefBrowser.initUA();
    gPrefWindow.prefBrowser.initBrowserBoxTab();
  },
  initUA : function(){
    var oUAValue = document.getElementById("ua-value");
    try {
      oUAValue.placeholder = gPrefWindow.prefBrowser.getFirefoxUserAgent();
    } catch (ex) {}
    var appversion = Services.appinfo.version;

    var req = new XMLHttpRequest();
    req.open("GET", "chrome://confmania/content/useragent.xml", true);
    req.onreadystatechange = function (event) {
      if(req.readyState != 4) return;
      var doc = req.responseXML;

      var df = document.createDocumentFragment();
      var menupopuptable = {"{opt:this}": document.getElementById("ua-presets-this-popup")};

      const OS_PARAM_APP_VERSION     = /\{appversion\??\}/g;
      const OPT_PARAM_GENERIC        = /\{opt:([a-zA-Z]+)\??\}/g;
      const OPT_PARAM_DEFAULT        = /\{opt:default\}/g;
      const OS_PARAM_OPTIONAL        = /\{\w+\?\}/g;

      Array.forEach(doc.getElementsByTagName("group"), function(b) {
        var name = b.getAttribute("name");
        if (name != "{opt:this}") {
          menupopuptable[name] = document.createElement("menupopup");
          var oMenu = document.createElement("menu");
          oMenu.setAttribute("label", name);
          oMenu.appendChild(menupopuptable[name]);
          df.appendChild(oMenu);
        }
      });
      Array.forEach(doc.getElementsByTagName("option"), function(o) {
        var b     = o.parentNode;
        var bname = b.getAttribute("name");
        var name  = o.getAttribute("name");
        var value = o.getAttribute("value") || b.getAttribute("value");

        value = value.replace(OPT_PARAM_DEFAULT, function() {
          return gPrefWindow.prefBrowser.getFirefoxUserAgent({
            platform: o.getAttribute("platform") || b.getAttribute("platform") || undefined,
            compatDevice: o.getAttribute("compatDevice") || b.getAttribute("compatDevice") || undefined,
            oscpu: o.getAttribute("oscpu") || b.getAttribute("oscpu") || undefined,
            misc: o.getAttribute("misc") || b.getAttribute("misc") || undefined
          });
        });
        value = value.replace(OPT_PARAM_GENERIC, function(str, optattr) {
          return o.getAttribute(optattr) || b.getAttribute(optattr) || "";
        });
        value = value.replace(OS_PARAM_OPTIONAL, "");
        value = value.replace(OS_PARAM_APP_VERSION, appversion);

        var oMenupopup = menupopuptable[bname];
        var oMenuItem = document.createElement("menuitem");
        oMenuItem.setAttribute("label", name);
        oMenuItem.setAttribute("value", value);
        oMenupopup.appendChild(oMenuItem);
      });

      var presetpopup = document.getElementById("ua-presets-popup");
      presetpopup.appendChild(df);
    };
    req.send(null);
  },
  initBrowserBoxTab : function () {
    gPrefWindow.prefBrowser.onPaneBrowserBoxTabSelected();
  },
  onPaneBrowserBoxTabSelected : function () {
    let paneBrowserBoxTab = document.getElementById("paneBrowserBoxTab");
    let selectedPanel = document.getElementById(paneBrowserBoxTab.value);
    selectedPanel.parentNode.selectedPanel = selectedPanel;

    for (let i = 0; i < paneBrowserBoxTab.itemCount; i++) {
      let radioItem = paneBrowserBoxTab.getItemAtIndex(i);
      let pane = document.getElementById(radioItem.value);
      pane.setAttribute("selected", (radioItem.selected)? "true" : "false");
    }
  },
  onAutoCompleteSyncFrom : function (){
    let disabled = document.getElementById("browser.urlbar.autocomplete.enabled").value;
    for (let name of ["browser.urlbar.autoFill", "browser.urlbar.filter.javascript", "browser.urlbar.maxRichResults", "browser.urlbar.delay"]) {
      document.getElementById(name).disabled = disabled;
    }
    return undefined; // no override
  },
  onDomainGaussSyncFrom : function () {
    let disabled = ! document.getElementById("browser.fixup.alternate.enabled").value;
    for (let name of ["browser.fixup.alternate.prefix", "browser.fixup.alternate.suffix"]) {
      document.getElementById(name).disabled = disabled;
    }
    return undefined; // no override
  },
  onHTMLLoadImageSyncFrom : function() {
    let pref = document.getElementById("permissions.default.image");
    return (pref.value == 1 || pref.value == 3);
  },
  onHTMLLoadImageSyncTo : function() {
    return (document.getElementById("html-loadImages").checked) ? 1 : 2;
  },
  onHTMLShowImageExceptionsCommand : function() {
    let params = { blockVisible: true,  sessionVisible: false, allowVisible: true, prefilledHost: "", permissionType: "image" };
    params.windowTitle = document.getElementById("html-showImageExceptions").getAttribute("data-dialog-title");
    params.introText   = document.getElementById("html-showImageExceptions").getAttribute("data-dialog-desc");

    openDialog("chrome://browser/content/preferences/permissions.xul", 
               "Browser:Permissions", "resizable=yes", params);
  },
  onFocusHighlightSyncFrom : function() {
    let disabled = ! document.getElementById("browser.display.use_focus_colors").value;
    for (let name of ["browser.display.focus_background_color", "browser.display.focus_text_color"]) {
      document.getElementById(name).disabled = disabled;
    }
    return undefined; // no override
  },
  onAccelerationSyncFrom : function() {
    let disabled = document.getElementById("layers.acceleration.disabled").value;
    document.getElementById("layers.acceleration.force-enabled").disabled = disabled;
    return undefined; // no override
  },
  onDirect2DSyncFrom : function() {
    let disabled = document.getElementById("gfx.direct2d.disabled").value;
    document.getElementById("gfx.direct2d.force-enabled").disabled = disabled;
    return undefined; // no override
  },
  onSessionStoreRestoreOnDemandSyncFrom: function() {
    let disabled_hidden_tabs =   document.getElementById("browser.sessionstore.restore_on_demand").value;
    let disabled_pinned_tabs = ! document.getElementById("browser.sessionstore.restore_on_demand").value;
    document.getElementById("browser.sessionstore.restore_hidden_tabs").disabled = disabled_hidden_tabs;
    document.getElementById("browser.sessionstore.restore_pinned_tabs_on_demand").disabled = disabled_pinned_tabs;
  },
  onSessionStoreWarnOnQuitSyncFrom : function() {
    let disabled = ! document.getElementById("browser.warnOnQuit").value;
    document.getElementById("browser.showQuitWarning").disabled = disabled;
    document.getElementById("browser.warnOnRestart").disabled = disabled;
    return undefined; // no override
  },
  onDownloadNouseToolkitUISyncFrom : function() {
    let disabled = document.getElementById("browser.download.useToolkitUI").value;
    document.getElementById("browserDLFlashCount-gr").disabled = disabled;
    document.querySelector("label[control='browserDLFlashCount-gr']").disabled = disabled;
    document.getElementById("browser.download.manager.flashCount").disabled = disabled;
    return undefined; // no override
  },
  onMultiMediaMediaSourceEnabledSyncFrom: function () {
    let disabled = ! document.getElementById("media.mediasource.enabled").value;
    document.getElementById("media.mediasource.mp4.enabled").disabled = disabled;
    document.getElementById("media.mediasource.webm.enabled").disabled = disabled;
    return undefined; // no override
  },
  onWebAPIGeoEnabledSyncFrom : function () {
    let disabled = document.getElementById("geo.enabled").value;
    document.getElementById("webapi-geoExceptions").disabled = disabled;
    document.getElementById("geo.wifi.uri").disabled = disabled;
    return undefined; // no override
  },
  onWebAPIGeoWifiUriBrowse: function() {
    const filters = [{name: null, filter: "*.json"}, Components.interfaces.nsIFilePicker.filterAll];
    this._openBrowse(filters, "webapi-geoWifiUri", "uri");
  },
  onWebAPIGeoWifiUriReset: function() {
    gPrefWindow.resetPref(document.getElementById("geo.wifi.uri"));
  },
  onWebAPIGeoExceptionsCommand : function() {
    let params = { blockVisible: true,  sessionVisible: false, allowVisible: true, prefilledHost: "", permissionType: "geo" };
    params.windowTitle = document.getElementById("webapi-geoExceptions").getAttribute("data-dialog-title");
    params.introText   = document.getElementById("webapi-geoExceptions").getAttribute("data-dialog-desc");

    openDialog("chrome://browser/content/preferences/permissions.xul", 
               "Browser:Permissions", "resizable=yes", params);
  },
  onWebAPIFullScreenEnabledSyncFrom : function () {
    let disabled = document.getElementById("full-screen-api.enabled").value;
    document.getElementById("webapi-full_screenExceptions").disabled = disabled;
    return undefined; // no override
  },
  onWebAPIFullScreenExceptionsCommand : function() {
    let params = { blockVisible: true,  sessionVisible: false, allowVisible: true, prefilledHost: "", permissionType: "fullscreen" };
    params.windowTitle = document.getElementById("webapi-full_screenExceptions").getAttribute("data-dialog-title");
    params.introText   = document.getElementById("webapi-full_screenExceptions").getAttribute("data-dialog-desc");

    openDialog("chrome://browser/content/preferences/permissions.xul", 
               "Browser:Permissions", "resizable=yes", params);
  },
  onInterruptParseSyncFrom : function() {
    let disabled = document.getElementById("content.interrupt.parsing").value;
    document.getElementById("content.max.tokenizing.time").disabled = disabled;
    return undefined; // no override
  },
  onMemoryEnableSyncFrom : function() {
    let disabled = ! document.getElementById("browser.cache.memory.enable").value;
    for (let name of ["speed-cache-memory-capacity-type", "speed-cache-memory-capacity-type-label", "browser.cache.memory.capacity"]) {
      document.getElementById(name).disabled = disabled;
    }
    return undefined; // no override
  },
  onEditorExternalSyncFrom : function() {
    let disabledPath = ! document.getElementById("view_source.editor.external").value;
    document.getElementById("view_source.editor.path").disabled = disabledPath;
    return undefined; // no override
  },
  getFirefoxUserAgent : function(option) {
    let ua = "";
    // cf. nsHttpHandler.cpp#BuildUserAgent()
    let m = Services.io.getProtocolHandler("http").QueryInterface(Components.interfaces.nsIHttpProtocolHandler);
    let appInfo = Services.appinfo;
    let versionComp = Services.vc;

    if (!option) {
      option = {
        platform:     m.platform,
        compatDevice: undefined,
        oscpu:        m.oscpu,
        misc:         undefined
      };
    }

    let firefoxVersion = appInfo.version;
    let geckotrail     = firefoxVersion;
    if (versionComp.compare(appInfo.version, "10.0") < 0) {
      // If Firefox 4-9: firefox version contains full, and geckotrail is buildID.
      firefoxVersion   = appInfo.version;
      geckotrail       = appInfo.appBuildID.substring(0,8);
    } else if (versionComp.compare(appInfo.version, "16.0") < 0) {
      // If Firefox 10-15: firefox version contains full, and geckotrail is same as firefox version.
      firefoxVersion   = appInfo.version;
      geckotrail       = firefoxVersion;
    } else {
      // If Firefox 16-: firefox version is just only major version, and geckotrail is same as firefox version.
      firefoxVersion   = appInfo.version.toString().split(".").splice(0, 2).join(".");
      geckotrail       = firefoxVersion;
    }
    // On Desktop, geckotrail is the fixed string "20100101"
    if ((!!option.oscpu) && (option.oscpu !== "Mobile") && (option.oscpu !== "Tablet")) {
      geckotrail       = "20100101";
    }

    if (option.misc === undefined) {
      option.misc = "rv:" + firefoxVersion;
    }

    // Application portion
    ua += m.appName; // legacy app name
    ua += "/";
    ua += m.appVersion; // legacy app version
    ua += " ";

    // Application comment
    ua += "(";
    if (!!option.platform) {
      ua += option.platform;
      ua += "; ";
    }
    if (!!option.compatDevice) {
      ua += option.compatDevice;
      ua += "; ";
    } else if (!!option.oscpu) {
      ua += option.oscpu;
      ua += "; ";
    }
    ua += option.misc || "";
    ua += ")";

    // Product portion
    ua += " ";
    ua += "Gecko";
    ua += "/";
    ua += geckotrail;

    // App portion
    ua += " ";
    ua += "Firefox";
    ua += "/";
    ua += firefoxVersion;

    return ua;
  },
  onUserAgentPresetCommanded : function(event) {
    var mData = document.getElementById("ua-value");
    mData.value = event.target.value;
    gPrefWindow.getCurrentPrefPane().userChangedValue(mData);
  },
  resetUserAgent : function(){
    gPrefWindow.resetPref(document.getElementById("general.useragent.override"));
  },
  onSpeedPaintReset : function(){
    let expander = document.getElementById("speed-paint");
    for (let e of expander.querySelectorAll("[preference]")) {
      gPrefWindow.resetPref(document.getElementById(e.getAttribute("preference")));
    }
  },
  synchNotifyInterval : function(){
    var paintDelay = document.getElementById("nglayout.initialpaint.delay").value;
    if(paintDelay == null) paintDelay = 250;

    var mData = document.getElementById("speed-notify-interval");
    mData.value = paintDelay * 1000;
    gPrefWindow.getCurrentPrefPane().userChangedValue(mData);

    mData = document.getElementById("speed-max-tokenizing-time");
    mData.value = paintDelay * 500;
    gPrefWindow.getCurrentPrefPane().userChangedValue(mData);
  },
  _openBrowse: function(aFilters, aTargetID, aValueType) {
    // Open File Dialog
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    if (aValueType == "url" || aValueType == "uri") {
      fp.init(window, document.title, nsIFilePicker.modeOpen);
    } else if (aValueType == "directory") {
      fp.init(window, document.title, nsIFilePicker.modeGetFolder);
    } else {
      fp.init(window, document.title, nsIFilePicker.modeOpen);
    }

    Array.forEach(aFilters, function(filter) {
      if (typeof(filter) == "number") {
        fp.appendFilters(filter);
      } else {
        fp.appendFilter(filter.name, filter.filter);
      }
    });

    try{
      var targetElem = document.getElementById(aTargetID);
      var file = null;
      if (aValueType == "url" || aValueType == "uri") {
        file = new FileUtils.File(OS.Path.fromFileURI((targetElem.value == "")? targetElem.placeholder : targetElem.value));
      } else {
        file = new FileUtils.File((targetElem.value == "")? targetElem.placeholder : targetElem.value);
      }

      fp.displayDirectory = file.parent;
      fp.defaultString = file.leafName;
    }catch(ex){}

    if(fp.show() == nsIFilePicker.returnOK) {
      if (aValueType == "url" || aValueType == "uri") {
        targetElem.value = fp.fileURL.spec;
      } else if (aValueType == "directory") {
        targetElem.value = fp.file.path;
      } else {
        targetElem.value = fp.file.path;
      }
      gPrefWindow.getCurrentPrefPane().userChangedValue(targetElem);
    }
  },
  onOtherNetworkPredictorEnabledSyncFrom : function () {
    let disabled = ! document.getElementById("network.predictor.enabled").value;
    document.getElementById("network.predictor.enable-hover-on-ssl").disabled = disabled;
    return undefined; // no override
  },
  onEditorExternalBrowse : function(){
    const filters = [Components.interfaces.nsIFilePicker.filterApps, Components.interfaces.nsIFilePicker.filterAll];
    this._openBrowse(filters, "others-editorExternal-path", "file");
  },
  onBrowserCacheDiskCacheFolderBrowse : function(){
    this._openBrowse([], "browserCacheDiskCacheFolder", "directory");
  },
  resetBrowserCacheDiskCacheFolder : function(){
    gPrefWindow.resetPref(document.getElementById("browser.cache.disk.parent_directory"));
  },
  onHelloEnableSyncFrom : function() {
    gPrefWindow.prefBrowser.onHelloAccessTokenSyncFrom();    
    return undefined; // no override
  },
  onHelloAccessTokenSyncFrom : function() {
    let disabled = !(document.getElementById("loop.enabled").value &&
                   (document.getElementById("loop.hawk-session-token").hasUserValue ||
                   document.getElementById("loop.key").hasUserValue ||
                   document.getElementById("loop.ot.guid").hasUserValue));
    document.getElementById("browser-others-loop-forget").disabled = disabled;
    document.getElementById("browser-others-loop-forget-desc").disabled = disabled;
    return undefined; // no override
  },
  onHelloForgetAccessTokenCommanded: function() {
    gPrefWindow.resetPref(document.getElementById("loop.hawk-session-token"));
    gPrefWindow.resetPref(document.getElementById("loop.key"));
    gPrefWindow.resetPref(document.getElementById("loop.ot.guid"));
  }
};

window.addEventListener("DOMContentLoaded", gPrefWindow.prefBrowser.init, false);
