gPrefWindow.prefUI = {
  init : function(){
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
  onUseSystemDefaultSyncFrom : function(elem) {
    let disabled = document.getElementById(elem.getAttribute("preference")).value;
    let numlinesid = elem.getAttribute("preference").replace(/\.[^\.]*$/, ".numlines");
    document.getElementById(numlinesid).disabled = disabled;
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
