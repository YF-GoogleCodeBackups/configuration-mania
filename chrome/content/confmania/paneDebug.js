
gPrefWindow.prefDebug = {
  init : function() {
  },
  _openBrowse: function(aFilters, aTargetID, aValueTypes) {
    let targetElem = document.getElementById(aTargetID);
    let valueTypes = (aValueTypes)? aValueTypes.split(/\s+/) : [];
    let isUri = valueTypes.some(function(v) { return (v === "uri") || (v === "url"); });
    let isDirectory = valueTypes.some(function(v) { return (v === "directory"); });
    let isSave = valueTypes.some(function(v) { return (v === "save"); });

    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    let fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    if (isDirectory) {
      fp.init(window, document.title, nsIFilePicker.modeGetFolder);
    } else if (isSave) {
      fp.init(window, document.title, nsIFilePicker.modeSave);
    } else {
      fp.init(window, document.title, nsIFilePicker.modeOpen);
    }

    for (let filter of aFilters) {
      if (typeof(filter) === "number") {
        fp.appendFilters(filter);
      } else {
        fp.appendFilter(filter.name, filter.filter);
      }
    }

    try {
      let file = null;
      if (isUri) {
        file = new FileUtils.File(OS.Path.fromFileURI((targetElem.value === "")? targetElem.placeholder : targetElem.value));
      } else {
        file = new FileUtils.File((targetElem.value === "")? targetElem.placeholder : targetElem.value);
      }

      fp.displayDirectory = file.parent;
      fp.defaultString = file.leafName;
    } catch (ex) {}

    let ret = fp.show();
    if ((ret === nsIFilePicker.returnOK) || (ret === nsIFilePicker.returnReplace)) {
      targetElem.value = (isUri)? fp.fileURL.spec : fp.file.path;
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
    gPrefWindow.prefDebug._openBrowse(filters, "debug-dump-file", "file save");
  },
  onDebugDumpFileReset : function () {
    gPrefWindow.resetPref(document.getElementById("browser.dom.window.dump.file"));
  }
};

window.addEventListener("DOMContentLoaded", gPrefWindow.prefDebug.init, false);
