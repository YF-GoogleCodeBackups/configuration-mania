gPrefWindow.prefBrowser = {
  init : function(){
    try {
      let dirSvc = Components.classes["@mozilla.org/file/directory_service;1"]
       .getService(Components.interfaces.nsIProperties);
      let cachedir = dirSvc.get((dirSvc.has("ProfLD"))? "ProfLD" : "ProfD", Components.interfaces.nsILocalFile);
      document.getElementById("browserCacheDiskCacheFolder").placeholder = cachedir.path;
    } catch(ex){}

    gPrefWindow.prefBrowser.initUA();
    gPrefWindow.prefBrowser.initBrowserBoxTab();
  },
  initUA : function(){
    var oUAValue = document.getElementById("ua-value");
    try {
      oUAValue.placeholder = gPrefWindow.prefBrowser.getFirefoxUserAgent();
    } catch (ex) {}
    var prefBranch = Components.classes['@mozilla.org/preferences-service;1']
      .getService(Components.interfaces.nsIPrefBranch);
    var language = prefBranch.getCharPref("general.useragent.locale");
    var appversion = Components.classes["@mozilla.org/xre/app-info;1"]
      .getService(Components.interfaces.nsIXULAppInfo).version;

    var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
              .createInstance(Components.interfaces.nsIXMLHttpRequest);
    req.open("GET", "chrome://confmania/content/useragent.xml", true);
    req.onreadystatechange = function (event) {
      if(req.readyState != 4) return;
      var doc = req.responseXML;

      var presetpopup = document.getElementById("ua-presets-popup");
      var menupopuptable = {"{opt:this}": document.getElementById("ua-presets-this-popup")};

      const OS_PARAM_LANGUAGE        = /\{language\??\}/g;
      const OS_PARAM_APP_VERSION     = /\{appversion\??\}/g;
      const OPT_PARAM_GENERIC        = /\{opt:([a-zA-Z]+)\??\}/g;
      const OPT_PARAM_DEFAULT        = /\{opt:default\}/g;
      const OS_PARAM_OPTIONAL        = /\{\w+\?\}/g;
      const UA_FIREFOX_DEFAULT       = gPrefWindow.prefBrowser.getFirefoxUserAgent({
        platform: "{opt:platform}",
        oscpu: "{opt:oscpu}"
      });

      Array.forEach(doc.getElementsByTagName("group"), function(b) {
        var name = b.getAttribute("name");
        if (name != "{opt:this}") {
          menupopuptable[name] = document.createElement("menupopup");
          var oMenu = document.createElement("menu");
          oMenu.setAttribute("label", name);
          oMenu.appendChild(menupopuptable[name]);
          presetpopup.appendChild(oMenu);
        }
      });
      Array.forEach(doc.getElementsByTagName("option"), function(o) {
        var b     = o.parentNode;
        var bname = b.getAttribute("name");
        var name  = o.getAttribute("name");
        var value = o.getAttribute("value") || b.getAttribute("value");

        value = value.replace(OPT_PARAM_DEFAULT, UA_FIREFOX_DEFAULT);
        value = value.replace(OPT_PARAM_GENERIC, function(str, optattr) {
          return o.getAttribute(optattr) || b.getAttribute(optattr) || "";
        });
        value = value.replace(OS_PARAM_OPTIONAL, "");
        value = value.replace(OS_PARAM_LANGUAGE, language);
        value = value.replace(OS_PARAM_APP_VERSION, appversion);

        var oMenupopup = menupopuptable[bname];
        var oMenuItem = document.createElement("menuitem");
        oMenuItem.setAttribute("label", name);
        oMenuItem.setAttribute("value", value);
        oMenupopup.appendChild(oMenuItem);
      });
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
  onSmartBrowsingSyncFrom : function () {
    let disabled = ! document.getElementById("keyword.enabled").value;
    document.getElementById("keyword.URL").disabled = disabled;
    return undefined; // no override
  },
  onDomainGaussSyncFrom : function () {
    let disabled = ! document.getElementById("browser.fixup.alternate.enabled").value;
    for each (let name in ["browser.fixup.alternate.prefix", "browser.fixup.alternate.suffix"]) {
      document.getElementById(name).disabled = disabled;
    }
    return undefined; // no override
  },
  onAutoCompleteSyncFrom : function (){
    let disabled = document.getElementById("browser.urlbar.autocomplete.enabled").value;
    for each (let name in ["browser.urlbar.autoFill", "browser.urlbar.filter.javascript", "browser.urlbar.maxRichResults", "browser.urlbar.delay"]) {
      document.getElementById(name).disabled = disabled;
    }
    return undefined; // no override
  },
  onHtmlFrameSyncFrom : function() {
    let disabled = ! document.getElementById("browser.frames.enabled").value;
    document.getElementById("layout.frames.force_resizability").disabled = disabled;
    return undefined; // no override
  },
  onWebGLSyncFrom : function() {
    let disabled = ! document.getElementById("webgl.disabled").value;
    document.getElementById("webgl.force_osmesa").disabled = disabled;
    return gPrefWindow.prefBrowser.onWebGLSFRenderSyncFrom();
  },
  onWebGLSFRenderSyncFrom : function() {
    let disabled = ! (document.getElementById("webgl.disabled").value && document.getElementById("webgl.force_osmesa").value);
    document.getElementById("webgl.osmesalib").disabled = disabled;
    return undefined; // no override
  },
  onFocusHighlightSyncFrom : function() {
    let disabled = ! document.getElementById("browser.display.use_focus_colors").value;
    for each (let name in ["browser.display.focus_background_color", "browser.display.focus_text_color"]) {
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
  onTabsCloseButtonSyncFrom : function() {
    let disabled = document.getElementById("browser.tabs.closeButtons").value != 1;
    document.getElementById("browser.tabs.tabClipWidth").disabled = disabled;
    return undefined; // no override
  },
  onSessionStoreWarnOnQuitSyncFrom : function() {
    let disabled = ! document.getElementById("browser.warnOnQuit").value;
    document.getElementById("browser.showQuitWarning").disabled = disabled;
    document.getElementById("browser.warnOnRestart").disabled = disabled;
    return undefined; // no override
  },
  onInterruptParseSyncFrom : function() {
    let disabled = document.getElementById("content.interrupt.parsing").value;
    document.getElementById("content.max.tokenizing.time").disabled = disabled;
    return undefined; // no override
  },
  onMemoryEnableSyncFrom : function() {
    let disabled = ! document.getElementById("browser.cache.memory.enable").value;
    for each (let name in ["speed-cache-memory-capacity-type", "speed-cache-memory-capacity-type-label", "browser.cache.memory.capacity"]) {
      document.getElementById(name).disabled = disabled;
    }
    return undefined; // no override
  },
  onEditorExternalSyncFrom : function() {
    let disabled = ! document.getElementById("view_source.editor.external").value;
    document.getElementById("view_source.editor.path").disabled = disabled;
    return undefined; // no override
  },
  getFirefoxUserAgent : function(option) {
    let ua = "";
    // cf. nsHttpHandler.cpp#BuildUserAgent()
    let m = Components.classes['@mozilla.org/network/protocol;1?name=http']
      .getService(Components.interfaces.nsIHttpProtocolHandler);
    let appInfo = Components.classes['@mozilla.org/xre/app-info;1']
      .getService(Components.interfaces.nsIXULAppInfo);
    let versionComp = Components.classes['@mozilla.org/xpcom/version-comparator;1']
      .getService(Components.interfaces.nsIVersionComparator);

    if (option == null) {
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
    Array.forEach(expander.querySelectorAll("*[preference]"), function(e) {
      gPrefWindow.resetPref(document.getElementById(e.getAttribute("preference")));
    });
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
  _openBrowse: function(aFilter, aTargetID) {
    // Open File Dialog
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, document.title, nsIFilePicker.modeOpen);
    fp.appendFilters(aFilter);
    try{
      var file = Components.classes["@mozilla.org/file/local;1"]
       .createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath(document.getElementById(aTargetID).value);
      fp.displayDirectory = file.parent;
      fp.defaultString = file.leafName;
    }catch(ex){}

    if(fp.show() == nsIFilePicker.returnOK) {
      var targetElem = document.getElementById(aTargetID);
      targetElem.value = fp.file.path;
      gPrefWindow.getCurrentPrefPane().userChangedValue(targetElem);
    }
  },
  onWebGLOSMesaBrowse : function() {
    this._openBrowse(Components.interfaces.nsIFilePicker.filterAll, "html-webgl-osmesa-path");
  },
  onEditorExternalBrowse : function(){
    const filter = Components.interfaces.nsIFilePicker.filterApps | Components.interfaces.nsIFilePicker.filterAll;
    this._openBrowse(filter, "others-editorExternal-path");
  },
  onBrowserCacheDiskCacheFolderBrowse : function(){
    var folderField = document.getElementById("browserCacheDiskCacheFolder");

    // Open File Dialog
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, document.title, nsIFilePicker.modeGetFolder);
    try{
      var file = Components.classes["@mozilla.org/file/local;1"]
       .createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath((folderField.value == "")? folderField.placeholder : folderField.value);
      fp.displayDirectory = file.parent;
      fp.defaultString = file.leafName;
    }catch(ex){throw ex}

    if(fp.show() == nsIFilePicker.returnOK) {
      folderField.value = fp.file.path;
      gPrefWindow.getCurrentPrefPane().userChangedValue(folderField);
    }
  },
  resetBrowserCacheDiskCacheFolder : function(){
    gPrefWindow.resetPref(document.getElementById("browser.cache.disk.parent_directory"));
  }
};

document.getElementById("paneBrowser").addEventListener("paneload", gPrefWindow.prefBrowser.init, false);
