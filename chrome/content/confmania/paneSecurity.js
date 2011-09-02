gPrefWindow.prefSecurity = {
  init : function(){
    document.getElementById("passwordTimeout").value
     = Components.classes["@mozilla.org/security/pk11tokendb;1"]
     .getService(Components.interfaces.nsIPK11TokenDB)
     .getInternalKeyToken().getAskPasswordTimeout();
  },
  syncFromPopupwin: function() {
    var mData = document.getElementById("dom.popup_allowed_events");
    var options = (mData.value || "").split(/\s+/);
    var checks = document.getElementById("popupwin-e").getElementsByTagName("listitem");
    Array.forEach(checks, function(v) {
      v.checked = (options.indexOf(v.getAttribute("value")) >= 0)? true : false;
    });

    return undefined;
  },
  syncToPopupwin: function() {
    var checks = document.getElementById("popupwin-e").getElementsByTagName("listitem");
    var val = Array.map(checks, function(v) {
      return (v.checked)? v.getAttribute("value") : "";
    }).join(" ").replace(/\s+/g, " ");

    return val;
  },
  onIDNSyncFrom: function() {
    let disabled = ! document.getElementById("network.enableIDN").value;
    for each (let name in ["network.IDN_show_punycode", "showPunycodeDesc"]) {
      document.getElementById(name).disabled = disabled;
    }
    return undefined; // no override
  },
  updatePasswordAskTimes : function(){
    var radiogroup = document.getElementById("passwordAskTimes");
    var askEveryTimeHidden = document.getElementById("askEveryTimeHidden");
    document.getElementById("passwordTimeout").disabled = (String(radiogroup.value) != "1");
    askEveryTimeHidden.checked = (String(radiogroup.value) == "-1");
    if(askEveryTimeHidden._initilized) {
      document.getElementById("paneSecurity").userChangedValue(askEveryTimeHidden);
    } else {
      askEveryTimeHidden._initilized = true;
    }
  }
};
