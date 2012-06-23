gPrefWindow.prefBrowser = {
  init : function(){
    try {
      let dirSvc = Components.classes["@mozilla.org/file/directory_service;1"]
       .getService(Components.interfaces.nsIProperties);
      let cachedir = dirSvc.get((dirSvc.has("ProfLD"))? "ProfLD" : "ProfD", Components.interfaces.nsILocalFile);
      document.getElementById("browserCacheDiskCacheFolder").placeholder = cachedir.path;
    } catch(ex){}

    if (! document.documentElement.instantApply) {
      document.getElementById("alertsPreviewButton").setAttribute("style", "display:none;");
    }
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
    req.open("GET", "useragent.xml", true);
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
      const UA_FIREFOX_DEFAULT = gPrefWindow.prefBrowser.getFirefoxUserAgent("{opt:platform}", "{opt:oscpu}", null);

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
  resetKeywordURL : function(){//#smartbrowsing-keywordsURL
    gPrefWindow.resetPref(document.getElementById("keyword.URL"));
  },
  getFirefoxUserAgent : function(platform, oscpu, language){
    // cf. nsGlobalWindow.cpp#GetUserAgent
    var m = Components.classes['@mozilla.org/network/protocol;1?name=http']
      .getService(Components.interfaces.nsIHttpProtocolHandler);
    var pref = Components.classes['@mozilla.org/preferences-service;1']
      .getService(Components.interfaces.nsIPrefService);
    var prefBranch = Components.classes['@mozilla.org/preferences-service;1']
      .getService(Components.interfaces.nsIPrefBranch);

    var isGecko2 = false;
    var mSecurity = null;
    if (prefBranch.getPrefType("general.useragent.security") != prefBranch.PREF_INVALID) {
      mSecurity = prefBranch.getCharPref("general.useragent.security");
    } else {
      isGecko2 = true;
      // "general.useragent.security" is not defined Gecko2 (Firefox 4+)
    }
    
    if (platform == null) platform = m.platform;
    if (oscpu    == null) oscpu    = m.oscpu;
    if (isGecko2) {
      language = null; // language is not displayed on Gecko2 (Firefox4+)
    } else {
      if (language == null) language = m.language;
    }
    
    var userAgent = m.appName + "/" + m.appVersion + " ";
    userAgent += "("+platform+"; ";
    if (mSecurity) userAgent += mSecurity + "; ";
    userAgent += oscpu;
    if(language && language != "") userAgent += "; "+language;
    if(m.misc && m.misc != "") userAgent += "; "+m.misc;
    userAgent += ")";

    var fooSubComment = function(foo,fooSub,fooComment){
      if(foo && foo != ""){
        userAgent += " "+foo;
        if(fooSub && fooSub != "") userAgent += "/"+fooSub;
        if(fooComment && fooComment != "") userAgent += " ("+fooComment+")";
      }
    };
    // In Gecko2, m.productComment and m.vendorComment are removed.
    fooSubComment(m.product, m.productSub, m.productComment || null);
    fooSubComment(m.vendor, m.vendorSub, m.vendorComment || null);

    if (isGecko2) {
      var appInfo = Components.classes['@mozilla.org/xre/app-info;1']
        .getService(Components.interfaces.nsIXULAppInfo);
      userAgent += " " + appInfo.name + "/" + appInfo.version;
    } else {
      var extras = pref.getBranch("general.useragent.extra.");
      var pCount = {value : 0};
      var list = extras.getChildList("", pCount);
      list = list.sort();
      for (var i = 0; i < pCount.value; i++){
        userAgent += " "+prefBranch.getCharPref("general.useragent.extra."+list[i]);
      }
    }
    return userAgent;
  },
  onUserAgentPresetCommanded : function(event) {
    var mData = document.getElementById("ua-value");
    mData.value = event.target.value;
    document.documentElement.currentPane.userChangedValue(mData);
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
    document.documentElement.currentPane.userChangedValue(mData);

    mData = document.getElementById("speed-max-tokenizing-time");
    mData.value = paintDelay * 500;
    document.documentElement.currentPane.userChangedValue(mData);
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
      document.documentElement.currentPane.userChangedValue(targetElem);
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
      document.documentElement.currentPane.userChangedValue(folderField);
    }
  },
  resetBrowserCacheDiskCacheFolder : function(){
    gPrefWindow.resetPref(document.getElementById("browser.cache.disk.parent_directory"));
  },
  previewAlert : function(title, val){
    var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
     .getService(Components.interfaces.nsIAlertsService);
    alertsService.showAlertNotification("", title, val, false, "cookie", null);
  },
  resetAlertsSlide : function(){//#alerts.slide*
    for each (let name in ["alerts.slideIncrement", "alerts.slideIncrementTime"]) {
      gPrefWindow.resetPref(document.getElementById(name));
    }
  },
  setAlertsSlideLight : function(){//#alerts.slide*
    document.getElementById("alerts.slideIncrement").value = 10;
    document.getElementById("alerts.slideIncrementTime").value = 20;
  }
};

