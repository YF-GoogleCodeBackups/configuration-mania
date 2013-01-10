var gPrefWindow = {
  onLoad: function(){
    var prefWin = document.documentElement;
    prefWin.addEventListener("contextmenu", gPrefWindow.onContextMenu, true);
  },

  // =========================
  // Dialog buttons
  // =========================
  onResetSettings: function(event, msgtmpl){
    var currentPane = gPrefWindow.getCurrentPrefPane();
    var srcbtn = document.documentElement.getButton("extra2");
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                   .getService(Components.interfaces.nsIPromptService);

    var msg = msgtmpl.replace(/__TABNAME__/, currentPane.label);
    if( prompts.confirm(window, srcbtn.label, msg) ) {
      Array.forEach(currentPane.preferences, gPrefWindow.resetPref);
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
      aPref.value = aPref.defaultValue;
      aPref.updateElements();
    }
  },
  _contextPrefString: null,
  _setPrefObj: function(event){
    var o = event.target;
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
  onContextMenu: function(event){
    gPrefWindow._setPrefObj(event)
    if (gPrefWindow._contextPrefString == null) event.preventDefault();
  },
  onResetPopupClicked: function(event){
    var prefstr = gPrefWindow._contextPrefString;
    var p = document.getElementById(prefstr);
    gPrefWindow.resetPref(p);
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
