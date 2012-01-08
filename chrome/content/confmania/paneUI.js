gPrefWindow.prefUI = {
  init : function(){
    this.initMultitouchPopup();
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

  onTabNavSyncFrom : function(aField) {
    let curval = document.getElementById("accessibility.tabfocus").value;
    let bit = (aField.id == "tabNavigationLinks")? 4 : 2;
    return (curval & bit) != 0;
  },
  onTabNavSyncTo : function(aField) {
    let curval = document.getElementById("accessibility.tabfocus").value;
    curval |= 1; // Textboxes are always part of the tab order
    let bit = (aField.id == "tabNavigationLinks")? 4 : 2;
    if (aField.checked) {
      return curval | bit;
    } else {
      return curval & ~bit;
    }
  },
  onBrowseWithCaretSyncFrom : function() {
    let disabled = ! document.getElementById("accessibility.browsewithcaret_shortcut.enabled").value;
    document.getElementById("accessibility.warn_on_browsewithcaret").disabled = disabled;
  }
};
