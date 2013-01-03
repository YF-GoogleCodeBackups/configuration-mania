var gPrefWindow = {
  onLoad: function(){
    // In-content
    document.documentElement.instantApply = true;
    window.history.replaceState("landing", document.title);
    window.addEventListener("popstate", gPrefWindow.onStatePopped, true);
    gPrefWindow.showPanel("landing");
    gPrefWindow.updateCommands();

    // context menu
    var prefWin = document.documentElement;
    prefWin.addEventListener("contextmenu", gPrefWindow.onContextMenu, true);
  },

  // =========================
  // In-content
  // =========================
  loadPrefPane: function(aPane) {
    if (!aPane.loaded) {
      var OverlayLoadObserver = function(aPane) {
        this._pane = aPane;
      };
      OverlayLoadObserver.prototype = {
        observe: function (aSubject, aTopic, aData) {
Components.utils.reportError("observe() " + [this._pane.src, aSubject,aTopic,aData].join(","));
          try {
            this._pane.loaded = true;

            // fire onpaneload event.
            var event = document.createEvent("Events");
            event.initEvent("paneload", true, true);
            return !this._pane.dispatchEvent(event);
          } catch (e) {
            Components.utils.reportError(e);
          }
        }
      };

      var obs = new OverlayLoadObserver(aPane);
      document.loadOverlay(aPane.src, obs);
    }
  },
  updateCommands: function() {
    var webNav = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                 .getInterface(Components.interfaces.nsIWebNavigation);
    document.getElementById("back-btn").disabled = !webNav.canGoBack;
    document.getElementById("forward-btn").disabled = !webNav.canGoForward;
  },
  showPanel: function(aDataCategory) {
    var elems = document.getElementsByTagName("prefpane");
    for (var i = 0; i < elems.length; i++) {
      if (elems[i].getAttribute("data-category") == aDataCategory) {
        gPrefWindow.loadPrefPane(elems[i]);
        elems[i].hidden = false;
      } else {
        elems[i].hidden = true;
      }
    }
  },
  onStatePopped: function(aEvent) {
    gPrefWindow.updateCommands();
    gPrefWindow.showPanel(aEvent.state);
  },
  gotoPref: function(page) {
    gPrefWindow.showPanel(page);
    window.history.pushState(page, document.title);
    gPrefWindow.updateCommands();
  },

  // =========================
  // Context menu
  // =========================
  onResetSettings: function(event, msgtmpl){
    var currentPane = document.documentElement.currentPane;
    var srcbtn = document.documentElement.getButton("extra2");
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                   .getService(Components.interfaces.nsIPromptService);

    var msg = msgtmpl.replace(/__TABNAME__/, currentPane.label);
    if( prompts.confirm(window, srcbtn.label, msg) ) {
      Array.forEach(currentPane.preferences, gPrefWindow.resetPref);
    }
  },
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
              document.documentElement.currentPane.userChangedValue(mData);
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
