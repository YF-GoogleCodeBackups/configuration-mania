gPrefWindow.prefDebug = {
  init : function() {
  },
  _openBrowse: function(aFilters, aTargetID, aValueType) {
    // Open File Dialog
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    if (aValueType == "url" || aValueType == "uri") {
      fp.init(window, document.title, nsIFilePicker.modeOpen);
    } else if (aValueType == "directory") {
      fp.init(window, document.title, nsIFilePicker.modeGetFolder);
    } else {
      fp.init(window, document.title, nsIFilePicker.modeOpen);
    }

    Array.forEach(aFilters, function(filter) {
      if (typeof(filter) == "number") {
        fp.appendFilters(filter);
      } else {
        fp.appendFilter(filter.name, filter.filter);
      }
    });

    try{
      var targetElem = document.getElementById(aTargetID);
      var file = null;
      if (aValueType == "url" || aValueType == "uri") {
        file = Components.classes["@mozilla.org/network/io-service;1"]
         .getService(Components.interfaces.nsIIOService)
         .getProtocolHandler("file")
         .QueryInterface(Components.interfaces.nsIFileProtocolHandler)
         .getFileFromURLSpec((targetElem.value == "")? targetElem.placeholder : targetElem.value);
      } else {
        file = Components.classes["@mozilla.org/file/local;1"]
         .createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath((targetElem.value == "")? targetElem.placeholder : targetElem.value);
      }

      fp.displayDirectory = file.parent;
      fp.defaultString = file.leafName;
    }catch(ex){}

    if(fp.show() == nsIFilePicker.returnOK) {
      if (aValueType == "url" || aValueType == "uri") {
        targetElem.value = fp.fileURL.spec;
      } else if (aValueType == "directory") {
        targetElem.value = fp.file.path;
      } else {
        targetElem.value = fp.file.path;
      }
      gPrefWindow.getCurrentPrefPane().userChangedValue(targetElem);
    }
  },
  onDebugDumpEnabledSyncFrom : function () {
    let disabled = ! document.getElementById("browser.dom.window.dump.enabled").value;
    document.getElementById("browser.dom.window.dump.file").disabled = disabled;
    return undefined;
  },
  onDebugDumpFileBrowse : function () {
    const filters = [Components.interfaces.nsIFilePicker.filterAll];
    this._openBrowse(filters, "debug-dump-file", "file");
  },
  onDebugDumpFileReset : function () {
    gPrefWindow.resetPref(document.getElementById("browser.dom.window.dump.file"));
  }
};

document.getElementById("paneDebug").addEventListener("paneload", gPrefWindow.prefDebug.init, false);
