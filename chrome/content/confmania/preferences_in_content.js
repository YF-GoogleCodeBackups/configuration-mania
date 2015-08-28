var gPrefWindow = {
  onLoad: function(){
    // In-content
    document.documentElement.instantApply = true;

    var categories = document.getElementById("categories");
    categories.addEventListener("select", function(event) {
      gPrefWindow.gotoPref(event.target.value);
    }, false);
    window.addEventListener("hashchange", function(event) {
      var category = window.location.hash.substr(1) || "paneBrowser";
      gPrefWindow.selectCategory(category);
      gPrefWindow.showPage(category);
    }, false);

    var category = window.location.hash.substr(1) || "paneBrowser";
    gPrefWindow.selectCategory(category);
    gPrefWindow.showPage(category);

    // context menu
    var prefContextPopup = document.getElementById("prefContextPopup");
    prefContextPopup.addEventListener("popupshowing", gPrefWindow.onPrefContexPopupShowing, true);
  },

  // =========================
  // In-content
  // =========================
  selectCategory: function(name) {
    var categories = document.getElementById("categories");
    var item = categories.querySelector(".category[value=" + name + "]");
    categories.selectedItem = item;
  },
  showPage: function(aPage) {
    var elems = document.getElementsByTagName("prefpane");
    for (var i = 0; i < elems.length; i++) {
      if (elems[i].id == aPage) {
        elems[i].selected = true;
        elems[i].hidden = false;

        document.querySelector(".main-content .header-name").value = elems[i].getAttribute("label");
      } else {
        elems[i].selected = false;
        elems[i].hidden = true;
      }
    }
  },
  gotoPref: function(page) {
    if ((window.location.hash === "") && (page === "paneBrowser")) {
      // window.location.hash = "";
    } else if (window.location.hash !== "#" + page) {
      window.location.hash = page;
    }
    gPrefWindow.showPage(page);
  },

  // =========================
  // Dialog buttons
  // =========================
  onResetSettings: function(event, msgtmpl){
    var currentPane = gPrefWindow.getCurrentPrefPane();
    var ps = Services.prompt;
    var stringBundle = Services.strings.createBundle("chrome://confmania/locale/confmania.properties");

    var prefOnInstall = undefined;
    if (scope.Services.prefs.prefHasUserValue("extensions.confmania.prefOnInstall")) {
      try {
        prefOnInstall = JSON.parse(scope.Services.prefs.getCharPref("extensions.confmania.prefOnInstall"));
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

document.addEventListener("DOMContentLoaded", gPrefWindow.onLoad, false);

