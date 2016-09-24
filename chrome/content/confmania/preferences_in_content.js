var gPrefWindow = {
  onLoad: function(){
    window.removeEventListener("DOMContentLoaded", gPrefWindow.onLoad, false);

    // In-content
    document.documentElement.instantApply = true;

    var categories = document.getElementById("categories");
    categories.addEventListener("select", function(event) {
      gPrefWindow.gotoPref(event.target.value);
    }, false);
    window.addEventListener("hashchange", function(event) {
      var category = window.location.hash.substr(1) || "paneBrowser";
      gPrefWindow.selectCategory(category);
      gPrefWindow.showPage(category);
    }, false);

    var category = window.location.hash.substr(1) || "paneBrowser";
    gPrefWindow.selectCategory(category);
    gPrefWindow.showPage(category);

    // context menu
    var prefContextPopup = document.getElementById("prefContextPopup");
    prefContextPopup.addEventListener("popupshowing", gPrefWindow.onPrefContexPopupShowing, true);

    // version info
    var stringBundle = Services.strings.createBundle("chrome://confmania/locale/confmania.properties");
    for (let e of document.querySelectorAll("[data-obsolete-version-since]")) {
      let msg = stringBundle.formatStringFromName("versionInfo.obsoleteSince.label", [e.getAttribute("data-obsolete-version-since")], 1);
      e.setAttribute("data-obsolete-msg", msg);
    }
    for (let e of document.querySelectorAll("[data-require-version]")) {
      let msg = stringBundle.formatStringFromName("versionInfo.requires.label", [e.getAttribute("data-require-version")], 1);
      e.setAttribute("data-require-msg", msg);
    }
  },

  // =========================
  // In-content
  // =========================
  selectCategory: function(name) {
    let categories = document.getElementById("categories");
    categories.selectedItem = categories.querySelector(".category[value=" + name + "]");
  },
  showPage: function(aPage) {
    for (let elem of document.querySelectorAll("prefpane")) {
      if (elem.id == aPage) {
        elem.selected = true;
        elem.hidden = false;

        document.querySelector(".main-content .header-name").value = elem.getAttribute("label");
      } else {
        elem.selected = false;
        elem.hidden = true;
      }
    }
  },
  gotoPref: function(page) {
    if ((window.location.hash === "") && (page === "paneBrowser")) {
      // window.location.hash = "";
    } else if (window.location.hash !== "#" + page) {
      window.location.hash = page;
    }
    gPrefWindow.showPage(page);
  },

  // =========================
  // App bar
  // =========================
  ensureVisible: function (node) {
    Array.from((function* () {
      for (let e = node; e; e = e.parentNode) { yield e; }
    })()).reverse().forEach((e) => {
      if (e.nodeType === Node.ELEMENT_NODE) {
        if (node.scrollIntoView) { node.scrollIntoView(); }
        if (e.tagName === "prefpane") {
          gPrefWindow.gotoPref(e.id);
        }
        if (e.classList.contains("subtabpanel") && e.id) {
          document.querySelector(".subtab[value=\"" + e.id + "\"]").click();
        }
      }
    });
  },
  getNodeIteratorForKeyword: function(keyword) {
    let findtext = keyword.trim().toLocaleLowerCase();

    let isFindMatch = (v) => (typeof(v) === "string") && (v.toLocaleLowerCase().indexOf(findtext) >= 0);
    let iter = document.createNodeIterator(document.querySelector(".main-content"), NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return (isFindMatch(node.data))? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.classList.contains("header-name")) {
            return NodeFilter.FILTER_REJECT;
          } else if (["menuitem", "data"].indexOf(node.localName) >= 0) {
            return NodeFilter.FILTER_REJECT;
          } else if (node.hasAttribute("preference") && (node.getAttribute("preference").toLocaleLowerCase() == findtext)) {
            return NodeFilter.FILTER_ACCEPT;
          } else {
            return ((isFindMatch(node.getAttribute("label"))) ||
                    ((node.localName === "label") && isFindMatch(node.getAttribute("value"))))? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
          }
        } else {
          return NodeFilter.FILTER_REJECT;
        }
      }
    });

    return (function* () {
      for (let node = iter.nextNode(); node; node = iter.nextNode()) { yield node; }
    })();
  },
  prefFindShow: function (type) {
    let mPrefFind = document.getElementById("pref-find").mPrefFind;
    if (mPrefFind) {
      switch (type) {
        case "prev":
          mPrefFind.index = (mPrefFind.index - 1 + mPrefFind.foundNodes.length) % mPrefFind.foundNodes.length;
          break;
        case "next":
          mPrefFind.index = (mPrefFind.index + 1) % mPrefFind.foundNodes.length;
          break;
        default:
          break;
      }

      gPrefWindow.ensureVisible(mPrefFind.foundNodes[mPrefFind.index]);
      for (let elem of document.querySelectorAll("[data-highlight=active]")) {
        elem.setAttribute("data-highlight", "");
      }
      let node = mPrefFind.foundNodes[mPrefFind.index];
      ((node.nodeType === Node.TEXT_NODE)? node.parentElement : node).setAttribute("data-highlight", "active");
      document.getElementById("pref-find-status").value = [mPrefFind.index+1, mPrefFind.foundNodes.length].join("/");
    }
  },
  onPrefFind: function(event) {
    let prefFind = document.getElementById("pref-find");
    let findtext = prefFind.value.trim().toLocaleLowerCase();
    if (findtext != "") {
      if (prefFind.mPrefFind && (prefFind.mPrefFind.findtext == findtext)) {
        gPrefWindow.prefFindShow("next");
      } else {
        for (let elem of document.querySelectorAll("[data-highlight]")) {
          elem.removeAttribute("data-highlight");
        }

        let foundNodes = Array.from(gPrefWindow.getNodeIteratorForKeyword(findtext));
        if (foundNodes.length > 0) {
          for (let node of foundNodes) {
            ((node.nodeType === Node.TEXT_NODE)? node.parentElement : node).setAttribute("data-highlight", "active");
          }

          prefFind.mPrefFind = { findtext, foundNodes, index: 0 };
          gPrefWindow.prefFindShow("current");
          document.getElementById("pref-find-status").value = [0+1, foundNodes.length].join("/");
          prefFind.setAttribute("status", "found");
        } else {
          prefFind.mPrefFind = undefined;
          document.getElementById("pref-find-status").value = "";
          prefFind.setAttribute("status", "notfound");
        }
      }
    } else {
      for (let elem of document.querySelectorAll("[data-highlight]")) {
        elem.removeAttribute("data-highlight");
      }
      prefFind.mPrefFind = undefined;
      document.getElementById("pref-find-status").value = "";
      prefFind.removeAttribute("status");
    }

    document.getElementById("pref-find-previous").disabled = !prefFind.mPrefFind;
    document.getElementById("pref-find-next").disabled = !prefFind.mPrefFind;
  },
  onResetSettings: function(event, msgtmpl){
    var currentPane = gPrefWindow.getCurrentPrefPane();
    var ps = Services.prompt;
    var stringBundle = Services.strings.createBundle("chrome://confmania/locale/confmania.properties");

    var prefOnInstall = undefined;
    if (Services.prefs.prefHasUserValue("extensions.confmania.prefOnInstall")) {
      try {
        prefOnInstall = JSON.parse(Services.prefs.getCharPref("extensions.confmania.prefOnInstall"));
      } catch (e) {}
    }

    var buttonPressed = ps.confirmEx(null,
      stringBundle.GetStringFromName("resetDialogOnResetTab.title"),
      stringBundle.formatStringFromName("resetDialogOnResetTab.message", [currentPane.label], 1),
      ps.BUTTON_TITLE_IS_STRING * ps.BUTTON_POS_0 +
      ps.BUTTON_TITLE_CANCEL    * ps.BUTTON_POS_1 +
      ps.BUTTON_TITLE_IS_STRING * ps.BUTTON_POS_2 * ((prefOnInstall)? 1 : 0) +
      ps.BUTTON_POS_0_DEFAULT,
      stringBundle.GetStringFromName("resetDialogOnResetTab.reset.label"),
      null,
      stringBundle.GetStringFromName("resetDialogOnResetTab.revert.label"),
      null,
      { value: null });

    switch (buttonPressed) {
      case 0: // Reset
        Array.forEach(currentPane.preferences, gPrefWindow.resetPref);
        break;
      case 2: // Revert
        Array.forEach(currentPane.preferences, function (v) {
          var prefName = v.getAttribute("name");
          if (prefOnInstall && prefOnInstall[prefName]) {
            v.value = prefOnInstall[prefName];
          } else {
            gPrefWindow.resetPref(v);
          }
        });
        break;
      default: // Cancel
        break;
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
      aPref.value = (aPref.defaultValue === null)? undefined :aPref.defaultValue;
      aPref.updateElements();
    }
  },
  _contextPrefString: null,
  _setPrefObj: function(event){
    var o = event.target.triggerNode;
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
  onPrefContexPopupShowing: function(event){
    gPrefWindow._setPrefObj(event)
    if (gPrefWindow._contextPrefString == null) { event.preventDefault(); }
  },
  onResetPopupClicked: function(event){
    var prefstr = gPrefWindow._contextPrefString;
    var p = document.getElementById(prefstr);
    gPrefWindow.resetPref(p);
  },
  onOpenAboutConfigClicked: function(event){
    var prefstr = gPrefWindow._contextPrefString;
    openURL("about:config?filter="+encodeURI(prefstr));
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
  radioGroupConnectionSyncFrom: function(elem, radioGroupId, defaultValue) {
    let prefName = elem.getAttribute("preference");
    let preference = document.getElementById(prefName);
    let radioGroupElem = document.getElementById(radioGroupId);

    if (!radioGroupElem.mLinkedElement) {
      radioGroupElem.mLinkedElement = elem;
      radioGroupElem.addEventListener("command", (event) => {
        if (event.target.radioGroup === radioGroupElem) {
          if (radioGroupElem.value === "") {
            preference.reset();
          } else {
            radioGroupElem.mLinkedElement.value = radioGroupElem.value;
            gPrefWindow.getCurrentPrefPane().userChangedValue(radioGroupElem.mLinkedElement);
          }
          event.stopPropagation();
        }
      }, false);
    }

    let val = defaultValue;
    if ((Services.prefs.getPrefType(prefName) !== Components.interfaces.nsIPrefBranch.PREF_INVALID)
        && (preference.value !== undefined)) {
      val = preference.value;
    }

    let radioItemOther   = undefined;
    let radioItemMatched = undefined;
    for (let i = 0; i < radioGroupElem.itemCount; i++) {
      let oRadio = radioGroupElem.getItemAtIndex(i);
      if (oRadio.value === "*") {
        radioItemOther = oRadio;
      } else if (oRadio.value === String(val)) {
        radioItemMatched = oRadio;
      }
    }
    radioGroupElem.selectedItem = radioItemMatched || radioItemOther;

    return val;
  }
};

document.addEventListener("DOMContentLoaded", gPrefWindow.onLoad, false);

