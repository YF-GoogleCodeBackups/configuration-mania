gPrefWindow.prefUI = {
  init : function(){
    gPrefWindow.prefUI.initMultitouchPopup();
    gPrefWindow.prefUI.initUIBoxTab();
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

    gPrefWindow.prefUI.initI18nBoxTab();
  },
  initI18nBoxTab : function () {
    gPrefWindow.prefUI.onPaneUIBoxTabSelected();
  },
  initUIBoxTab : function () {
    gPrefWindow.prefUI.onPaneUIBoxTabSelected();
  },
  onPaneUIBoxTabSelected : function () {
    let paneUIBoxTab = document.getElementById("paneUIBoxTab");
    let selectedPanel = document.getElementById(paneUIBoxTab.value);
    selectedPanel.parentNode.selectedPanel = selectedPanel;

    for (let i = 0; i < paneUIBoxTab.itemCount; i++) {
      let radioItem = paneUIBoxTab.getItemAtIndex(i);
      let pane = document.getElementById(radioItem.value);
      pane.setAttribute("selected", (radioItem.selected)? "true" : "false");
    }
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
  },
  onLocaleMatchOSSyncFrom : function() {
    let disabled = document.getElementById("intl.locale.matchOS").value;
    document.getElementById("general.useragent.locale").disabled = disabled;
  },
  onPreferenceInContentSyncFrom : function() {
    let disabled = document.getElementById("browser.preferences.inContent").value;
    document.getElementById("browser.preferences.instantApply").disabled = disabled;
    document.querySelector("#ui-pane-others-pref-instanceAccept description").disabled = disabled;
  }
};

document.getElementById("paneUI").addEventListener("paneload", gPrefWindow.prefUI.init, false);
