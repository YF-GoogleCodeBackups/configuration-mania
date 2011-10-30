gPrefWindow.prefUI = {
  init : function(){
    this.updateMouseWheelMode();

    var tabNavPref = parseInt(document.getElementById("tabFocus").value) | 1;
    document.getElementById("tabNavigationLinks").checked = ((tabNavPref & 4) != 0);
    document.getElementById("tabNavigationForms").checked = ((tabNavPref & 2) != 0);
    this.initMultitouchPopup();
    this.tabNavPrefChanged();
  },
  initMultitouchPopup: function(){
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
    var win = wm.getMostRecentWindow("navigator:browser");
    var winMenubar = win.document.getElementById("main-menubar");
    if ( win == null ) return;
    var cmds = Array.map(win.document.getElementsByTagName("command"), function(elem){
      return elem.id;
    });

    var oMenupop = document.createElement("menupopup");
    cmds.sort().forEach(function(v){
      var oMenuitem = document.createElement("menuitem");
      oMenuitem.setAttribute("label", v);

      var labelResult = win.document.evaluate("//*[(@label) and (@command='"+v+"')]", win.document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
      if ( labelResult && labelResult.singleNodeValue ) {
        oMenuitem.setAttribute("description", labelResult.singleNodeValue.label);
      }

      oMenupop.appendChild(oMenuitem);
    });

    Array.forEach(document.getElementById("multitouch-gestures-box").getElementsByTagName("menulist"), function(e){
      e.appendChild(oMenupop.cloneNode(true));
      e.setAttribute("sizetopopup", "none");
    });
  },
  _currentIDs : {mousewheelAction : "mousewheelWithNoKeyAction",
                 mousewheelNumlines : "mousewheelWithNoKeyNumlines",
                 mousewheelSysNumlines : "mousewheelWithNoKeySysNumlines"},
  updateMouseWheelMode : function(){
    var prefix = "mousewheel";
    if(this.isHorizScroll()) prefix += "HorizScroll"
    prefix += "With" + this.getModKey() + "Key";

    this._currentIDs["mousewheelAction"] = prefix + "Action";
    this._currentIDs["mousewheelNumlines"] = prefix + "Numlines";
    this._currentIDs["mousewheelSysNumlines"] = prefix + "SysNumlines";

    document.getElementById("mousewheelAction").selectedIndex =
     parseInt( document.getElementById(this._currentIDs["mousewheelAction"]).value );
    document.getElementById("mousewheelNumlines").value =
     document.getElementById(this._currentIDs["mousewheelNumlines"]).value;
    document.getElementById("mousewheelSysNumlines").checked =
     document.getElementById(this._currentIDs["mousewheelSysNumlines"]).value == "true";
    this.mousewheelNumlineDoEnabled();
  },
  changed_mousewheelAction : function(){
    var mousewheelAction = document.getElementById(this._currentIDs["mousewheelAction"]);
    mousewheelAction.value = document.getElementById("mousewheelAction").value;

    this.updateValueAt(mousewheelAction);
    return false;
  },
  changed_mousewheelNumlines : function(){
    var mousewheelNumlines = document.getElementById(this._currentIDs["mousewheelNumlines"]);
    mousewheelNumlines.value = document.getElementById("mousewheelNumlines").value;

    this.updateValueAt(mousewheelNumlines);
    return false;
  },
  changed_mousewheelSysNumlines : function(){
    var mousewheelSysNumlines = document.getElementById(this._currentIDs["mousewheelSysNumlines"]);
    mousewheelSysNumlines.value = document.getElementById("mousewheelSysNumlines").value;
    this.mousewheelNumlineDoEnabled();

    this.updateValueAt(mousewheelSysNumlines);
    return false;
  },
  mousewheelNumlineDoEnabled : function(){
    document.getElementById("mousewheelNumlines").disabled
     = document.getElementById("mousewheelSysNumlines").checked;
  },
  isHorizScroll : function(){
    return document.getElementById("mousewheelOriental").value == "h";
  },
  getModKey : function(){// (No|Alt|Ctrl|Shift)
    return document.getElementById("mousewheelMod").value;
  },

  tabNavPrefChanged : function(){
    var tabNavPref = 1;
    if(document.getElementById("tabNavigationLinks").checked) tabNavPref |= 4;
    if(document.getElementById("tabNavigationForms").checked) tabNavPref |= 2;
    var tabFocus = document.getElementById("tabFocus");
    tabFocus.value = tabNavPref;
    this.updateValueAt(tabFocus);
  },

  updateValueAt : function(target){
    document.getElementById("paneUI").userChangedValue(target);
  }
};
