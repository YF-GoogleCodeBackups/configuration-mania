var gPrefWindow = {
  onLoad: function(){
    // context menu
    var prefContextPopup = document.getElementById("prefContextPopup");
    prefContextPopup.addEventListener("popupshowing", gPrefWindow.onPrefContexPopupShowing, true);

    // version info
    var stringBundle = Services.strings.createBundle("chrome://confmania/locale/confmania.properties");
    for (let e of document.querySelectorAll("*[data-obsolete-version-since]")) {
      let msg = stringBundle.formatStringFromName("versionInfo.obsoleteSince.label", [e.getAttribute("data-obsolete-version-since")], 1);
      e.setAttribute("data-obsolete-msg", msg);
    }
    for (let e of document.querySelectorAll("*[data-require-version]")) {
      let msg = stringBundle.formatStringFromName("versionInfo.requires.label", [e.getAttribute("data-require-version")], 1);
      e.setAttribute("data-require-msg", msg);
    }
  },

  // =========================
  // Dialog buttons
  // =========================
  onResetSettings: function(event, msgtmpl){
    var currentPane = gPrefWindow.getCurrentPrefPane();
    var ps = Services.prompt;
    var stringBundle = Services.strings.createBundle("chrome://confmania/locale/confmania.properties");

    var prefOnInstall = undefined;
    if (Services.prefs.prefHasUserValue("extensions.confmania.prefOnInstall")) {
      try {
        prefOnInstall = JSON.parse(Services.prefs.getCharPref("extensions.confmania.prefOnInstall"));
      } catch (e) {}
    }

    var buttonPressed = ps.confirmEx(null,
      stringBundle.GetStringFromName("resetDialogOnResetTab.title"),
      stringBundle.formatStringFromName("resetDialogOnResetTab.message", [currentPane.label], 1),
      ps.BUTTON_TITLE_IS_STRING * ps.BUTTON_POS_0 +
      ps.BUTTON_TITLE_CANCEL    * ps.BUTTON_POS_1 +
      ps.BUTTON_TITLE_IS_STRING * ps.BUTTON_POS_2 * ((prefOnInstall)? 1 : 0) +
      ps.BUTTON_POS_0_DEFAULT,
      stringBundle.GetStringFromName("resetDialogOnResetTab.reset.label"),
      null,
      stringBundle.GetStringFromName("resetDialogOnResetTab.revert.label"),
      null,
      { value: null });

    switch (buttonPressed) {
      case 0: // Reset
        Array.forEach(currentPane.preferences, gPrefWindow.resetPref);
        break;
      case 2: // Revert
        Array.forEach(currentPane.preferences, function (v) {
          var prefName = v.getAttribute("name");
          if (prefOnInstall && prefOnInstall[prefName]) {
            v.value = prefOnInstall[prefName];
          } else {
            gPrefWindow.resetPref(v);
          }
        });
        break;
      default: // Cancel
        break;
    }
  },
  // =========================
  // Context menu
  // =========================
  resetPref: function(aPref) {
    if (aPref.instantApply) {
      if (aPref.hasUserValue) {
        aPref.reset();
        aPref.updateElements();
      }
    } else {
      aPref.value = (aPref.defaultValue === null)? undefined :aPref.defaultValue;
      aPref.updateElements();
    }
  },
  _contextPrefString: null,
  _setPrefObj: function(event){
    var o = event.target.triggerNode;
    if (o.labeledControlElement) o = o.labeledControlElement;
    if (o.nodeName == "radio") {
      if ((o.value == "*") && (o.nextSibling != null) && (o.nextSibling.hasAttribute("preference"))) {
        o = o.nextSibling;
      } else if (o.radioGroup) {
        o = o.radioGroup;
      }
    }

    if (o.hasAttribute("preference")) {
      gPrefWindow._contextPrefString = o.getAttribute("preference");
    } else if (o._linkedpreference) {
      gPrefWindow._contextPrefString = o._linkedpreference;
    } else {
      gPrefWindow._contextPrefString = null;
    }
  },
  onPrefContexPopupShowing: function(event){
    gPrefWindow._setPrefObj(event)
    if (gPrefWindow._contextPrefString == null) { event.preventDefault(); }
  },
  onResetPopupClicked: function(event){
    var prefstr = gPrefWindow._contextPrefString;
    var p = document.getElementById(prefstr);
    gPrefWindow.resetPref(p);
  },
  onOpenAboutConfigClicked: function(event){
    var prefstr = gPrefWindow._contextPrefString;
    openURL("about:config?filter="+encodeURI(prefstr));
  },
  onCopyNamePopupClicked: function(event){
    var prefstr = gPrefWindow._contextPrefString;
    var clipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
                    .getService(Components.interfaces.nsIClipboardHelper);
    clipboard.copyString(prefstr);
  },
  onMkbPopupClicked: function(event){
    var prefstr = gPrefWindow._contextPrefString;
    openURL("http://kb.mozillazine.org/"+encodeURI(prefstr));
  },

  getCurrentPrefPane: function(){
    // for prefwindow
    if (document.documentElement.tagName == "prefwindow") {
      return document.documentElement.currentPane;
    }
    // otherwise (i.e. in-content)
    return document.querySelector("prefpane[selected=true]");
  },
  syncFrom : function(elem,defaultValue){
    var val = document.getElementById(elem.getAttribute("preference")).value;
    return (val != null)? val : defaultValue;
  },
  syncTo : function(elem,defaultValue){
    var value = elem.value;
    if (elem.localName == "checkbox") { value = elem.checked; }
    if (elem.localName == "colorpicker") { value = elem.color; }
    if (value == defaultValue) {
      gPrefWindow.resetPref(document.getElementById(elem.getAttribute("preference")));
      return null;
    } else {
      return undefined;
    }
  },
  radioGrConnSyncFrom: function (groupid, dataid, defaultdat) {
        var mData = document.getElementById(dataid);
        var mGroup = document.getElementById(groupid);
        var preference = document.getElementById(mData.getAttribute("preference"));
        var val = preference.value;

        mGroup._linkedpreference = preference.name;

        if (defaultdat != null && val == null) {
            val = defaultdat;
        }

        const _oncommandHandler = function (event) {
            var oRadio = event.target;
            var mData = oRadio.mData;
            mData.value = oRadio.value;
            if (mData.value == "") {
              document.getElementById(mData.getAttribute('preference')).reset();
            }else{
              gPrefWindow.getCurrentPrefPane().userChangedValue(mData);
            }
            event.stopPropagation();
        };

        var oOthers = null;
        var found = false;
        Array.forEach(mGroup._getRadioChildren(), function (oRadio) {
            oRadio.mData = mData;
            if (oRadio.value == "*"){
                oOthers = oRadio;
            } else {
                oRadio.addEventListener("command", _oncommandHandler, false);
                if(oRadio.value == String(val)){
                    found = true;
                    mGroup.selectedItem = oRadio;
                }
            }
        });
        if (!found) {
            mGroup.selectedItem = oOthers;
        }
        return val;
  }
};
