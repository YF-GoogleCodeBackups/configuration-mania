gPrefWindow.prefHTTP = {
  init : function() {
    gPrefWindow.prefHTTP.onPaneHTTPBoxTabSelected();
  },
  onPaneHTTPBoxTabSelected : function () {
    let paneHTTPBoxTab = document.getElementById("paneHTTPBoxTab");
    let selectedPanel = document.getElementById(paneHTTPBoxTab.value);
    selectedPanel.parentNode.selectedPanel = selectedPanel;

    for (let i = 0; i < paneHTTPBoxTab.itemCount; i++) {
      let radioItem = paneHTTPBoxTab.getItemAtIndex(i);
      let pane = document.getElementById(radioItem.value);
      pane.setAttribute("selected", (radioItem.selected)? "true" : "false");
    }
  }
};
