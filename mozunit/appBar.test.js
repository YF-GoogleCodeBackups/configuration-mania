"use strict";
var TestCase = (typeof(mozlab) !== "undefined")? mozlab.mozunit.TestCase : mozunit.TestCase;
var assert   = (typeof(mozlab) !== "undefined")? mozlab.mozunit.assert   : mozunit.assert;

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");

function sleep(aWait) {
  let timerHandler = {
    timeup: false,
    notify: function(timer) {
      timerHandler.timeup = true;
    }
  };
  let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  timer.initWithCallback(timerHandler, aWait, Ci.nsITimer.TYPE_ONE_SHOT);

  while (!timerHandler.timeup) {
    Services.tm.mainThread.processNextEvent(true);
  }
}

var tc = new TestCase();
tc.tests = {
  setUp: function() {
    let cmwin = null;
    let browserEnumerator = Services.wm.getEnumerator("navigator:browser");
    while (browserEnumerator.hasMoreElements()) {
      let browserWin = browserEnumerator.getNext();
      let tabbrowser = browserWin.gBrowser;
      let tabLength = tabbrowser.tabs.length;

      for (let i = 0; i < tabLength; i++) {
        let currentBrowser = tabbrowser.getBrowserAtIndex(i);
        if (currentBrowser.currentURI.spec.startsWith("about:confmania")) {
          cmwin = currentBrowser.contentWindow;
          //browserWin.focus();
          tabbrowser.selectTabAtIndex(i);
          break;
        }
      }
    }

    if (cmwin) {
      this.window = cmwin;
      this.document = cmwin.document;

      cmwin.document.getElementById("category-browser").click();
    } else {
      throw new Error("about:confmania not found");
    }
  },
  tearDown: function() {
  },

  // TEST ####################
  
  testEnsureVisible: function() {
    let lastOf = function (v) { return v[v.length - 1]; };
    let assert_visible = (function (node) {
      let rect = node.getBoundingClientRect();
      if (!(rect.width > 0))                      { assert.fail("rect.width > 0 : " + node.getAttribute("preference")); }
      if (!(rect.top >= 0))                       { assert.fail("rect.top >= 0 : " + node.getAttribute("preference")); }
      if (!(rect.top <= this.window.innerHeight)) { assert.fail("rect.top <= this.window.innerHeight : " + node.getAttribute("preference")); }
      if (!(rect.left >= 0))                      { assert.fail("rect.left >= 0 : " + node.getAttribute("preference")); }
      if (!(rect.left <= this.window.innerWidth)) { assert.fail("rect.left <= this.window.innerWidth : " + node.getAttribute("preference")); }
    }).bind(this);

    for (let prefpane of this.document.querySelectorAll("prefpane")) {
      let subtabpanels = prefpane.querySelectorAll(".subtabpanel");
      if (subtabpanels.length > 0) {
        for (let subtabpanel of subtabpanels) {
          let node = lastOf(subtabpanel.querySelectorAll("textbox[preference], checkbox[preference], radio[preference]"));
          if (node) {
            this.window.gPrefWindow.ensureVisible(node);
            assert_visible(node);
            assert.isTrue(subtabpanel.hasAttribute("selected"));
            assert.isTrue(prefpane.selected);
          }
        }
      } else {
        let node = lastOf(prefpane.querySelectorAll("textbox[preference], checkbox[preference], radio[preference]"));
        if (node) {
          this.window.gPrefWindow.ensureVisible(node);
          assert_visible(node);
          assert.isTrue(prefpane.selected);
        }
      }
    }
    for (let prefpane of this.document.querySelectorAll("prefpane")) {
      let subtabpanels = prefpane.querySelectorAll(".subtabpanel");
      if (subtabpanels.length > 0) {
        for (let subtabpanel of subtabpanels) {
          let node = lastOf(subtabpanel.querySelectorAll("description"));
          if (node) {
            this.window.gPrefWindow.ensureVisible(node);
            assert_visible(node.parentElement);
            assert.isTrue(subtabpanel.hasAttribute("selected"));
            assert.isTrue(prefpane.selected);
          }
        }
      } else {
        let node = lastOf(prefpane.querySelectorAll("description"));
        if (node) {
          this.window.gPrefWindow.ensureVisible(node);
          assert_visible(node.parentElement);
          assert.isTrue(prefpane.selected);
        }
      }
    }
  },
  testGetNodeIteratorForKeyword: function() {
    // Text Node
    try {
      let node = this.document.createElement("description");
      node.setAttribute("mozunit-temp", "");
      node.appendChild(this.document.createTextNode("___TEST_PHRASE___"));
      this.document.querySelector("prefpane:last-child").appendChild(node);

      let nodeIter = this.window.gPrefWindow.getNodeIteratorForKeyword("__test_phrase__");
      assert.equals(node.firstChild.value, nodeIter.next().value.value);
      assert.isTrue(nodeIter.next().done);
    } finally {
      for (let e of this.document.querySelectorAll("*[mozunit-temp]")) {
        e.parentNode.removeChild(e);
      }
    }

    // header-name
    {
      let oHeader = this.document.querySelector(".header .header-name");
      let headerValueOrig = oHeader.value;

      oHeader.value = "__TEST_PHRASE__";

      let nodeIter = this.window.gPrefWindow.getNodeIteratorForKeyword("__test_phrase__");
      assert.isTrue(nodeIter.next().done);

      oHeader.value = headerValueOrig;
    }

    // menuitem, data
    try {
      let node = this.document.createElement("menuitem");
      node.setAttribute("mozunit-temp", "");
      node.setAttribute("label", "__TEST_PHRASE__");
      this.document.querySelector("prefpane:last-child").appendChild(node);

      node = this.document.createElement("data");
      node.setAttribute("mozunit-temp", "");
      node.setAttribute("label", "__TEST_PHRASE__");
      this.document.querySelector("prefpane:last-child").appendChild(node);

      let nodeIter = this.window.gPrefWindow.getNodeIteratorForKeyword("__test_phrase__");
      assert.isTrue(nodeIter.next().done);
    } finally {
      for (let e of this.document.querySelectorAll("*[mozunit-temp]")) {
        e.parentNode.removeChild(e);
      }
    }

    // preference
    try {
      let node = this.document.createElement("textbox");
      node.setAttribute("mozunit-temp", "");
      node.setAttribute("preference", "extensions.confmania.__TEST_PHRASE__");
      this.document.querySelector("prefpane:last-child").appendChild(node);

      let nodeIter = this.window.gPrefWindow.getNodeIteratorForKeyword("__test_phrase__");
      assert.isTrue(nodeIter.next().done);
      nodeIter = this.window.gPrefWindow.getNodeIteratorForKeyword("extensions.confmania.__TEST_PHRASE__");
      assert.equals(node, nodeIter.next().value);
      assert.isTrue(nodeIter.next().done);
    } finally {
      for (let e of this.document.querySelectorAll("*[mozunit-temp]")) {
        e.parentNode.removeChild(e);
      }
    }

    // label
    try {
      let node1 = this.document.createElement("label");
      node1.setAttribute("mozunit-temp", "");
      node1.setAttribute("value", "__TEST_PHRASE__");
      this.document.querySelector("prefpane:last-child").appendChild(node1);

      let node2 = this.document.createElement("button");
      node2.setAttribute("mozunit-temp", "");
      node2.setAttribute("label", "__TEST_PHRASE__");
      this.document.querySelector("prefpane:last-child").appendChild(node2);

      let nodeIter = this.window.gPrefWindow.getNodeIteratorForKeyword("__test_phrase__");
      assert.equals(node1, nodeIter.next().value);
      assert.equals(node2, nodeIter.next().value);
      assert.isTrue(nodeIter.next().done);
    } finally {
      for (let e of this.document.querySelectorAll("*[mozunit-temp]")) {
        e.parentNode.removeChild(e);
      }
    }
  },
  testOnPrefFind: function() {
    try {
      let node1 = this.document.createElement("label");
      node1.setAttribute("mozunit-temp", "");
      node1.setAttribute("value", "__TEST_PHRASE__");
      this.document.querySelector("prefpane").appendChild(node1);

      let node2 = this.document.createElement("button");
      node2.setAttribute("mozunit-temp", "");
      node2.setAttribute("label", "__TEST_PHRASE__");
      this.document.querySelector("prefpane:last-child").appendChild(node2);

      let node3 = this.document.createElement("button");
      node3.setAttribute("mozunit-temp", "");
      node3.setAttribute("label", "__TEST_PHRASE__");
      this.document.querySelector("prefpane:last-child").appendChild(node3);

      sleep(100);

      let prefFind = this.document.getElementById("pref-find");
      prefFind.value = "";
      prefFind.doCommand();
      prefFind.value = "__TEST_PHRASE__";
      prefFind.doCommand();
      sleep(1000);

      assert.equals(3, this.document.querySelectorAll("*[data-highlight]").length);
      assert.isTrue(node1.hasAttribute("data-highlight"));
      assert.isTrue(node2.hasAttribute("data-highlight"));
      assert.isTrue(node3.hasAttribute("data-highlight"));
      assert.equals("active", node1.getAttribute("data-highlight"));
      assert.isFalse(this.document.getElementById("pref-find-previous").disabled);
      assert.isFalse(this.document.getElementById("pref-find-next").disabled);
      assert.equals("1/3", this.document.getElementById("pref-find-status").value);

      prefFind.doCommand();
      assert.equals(3, this.document.querySelectorAll("*[data-highlight]").length);
      assert.isTrue(node1.hasAttribute("data-highlight"));
      assert.isTrue(node2.hasAttribute("data-highlight"));
      assert.isTrue(node3.hasAttribute("data-highlight"));
      assert.equals("active", node2.getAttribute("data-highlight"));
      assert.isFalse(this.document.getElementById("pref-find-previous").disabled);
      assert.isFalse(this.document.getElementById("pref-find-next").disabled);
      assert.equals("2/3", this.document.getElementById("pref-find-status").value);

      prefFind.doCommand();
      assert.equals(3, this.document.querySelectorAll("*[data-highlight]").length);
      assert.isTrue(node1.hasAttribute("data-highlight"));
      assert.isTrue(node2.hasAttribute("data-highlight"));
      assert.isTrue(node3.hasAttribute("data-highlight"));
      assert.equals("active", node3.getAttribute("data-highlight"));
      assert.isFalse(this.document.getElementById("pref-find-previous").disabled);
      assert.isFalse(this.document.getElementById("pref-find-next").disabled);
      assert.equals("3/3", this.document.getElementById("pref-find-status").value);

      prefFind.doCommand();
      assert.equals(3, this.document.querySelectorAll("*[data-highlight]").length);
      assert.isTrue(node1.hasAttribute("data-highlight"));
      assert.isTrue(node2.hasAttribute("data-highlight"));
      assert.isTrue(node3.hasAttribute("data-highlight"));
      assert.equals("active", node1.getAttribute("data-highlight"));
      assert.isFalse(this.document.getElementById("pref-find-previous").disabled);
      assert.isFalse(this.document.getElementById("pref-find-next").disabled);
      assert.equals("1/3", this.document.getElementById("pref-find-status").value);

      this.document.getElementById("pref-find-next").doCommand();
      assert.equals(3, this.document.querySelectorAll("*[data-highlight]").length);
      assert.isTrue(node1.hasAttribute("data-highlight"));
      assert.isTrue(node2.hasAttribute("data-highlight"));
      assert.isTrue(node3.hasAttribute("data-highlight"));
      assert.equals("active", node2.getAttribute("data-highlight"));
      assert.isFalse(this.document.getElementById("pref-find-previous").disabled);
      assert.isFalse(this.document.getElementById("pref-find-next").disabled);
      assert.equals("2/3", this.document.getElementById("pref-find-status").value);

      this.document.getElementById("pref-find-previous").doCommand();
      assert.equals(3, this.document.querySelectorAll("*[data-highlight]").length);
      assert.isTrue(node1.hasAttribute("data-highlight"));
      assert.isTrue(node2.hasAttribute("data-highlight"));
      assert.isTrue(node3.hasAttribute("data-highlight"));
      assert.equals("active", node1.getAttribute("data-highlight"));
      assert.isFalse(this.document.getElementById("pref-find-previous").disabled);
      assert.isFalse(this.document.getElementById("pref-find-next").disabled);
      assert.equals("1/3", this.document.getElementById("pref-find-status").value);

      prefFind.value = "__NOT_EXIST_TEXT_PHRASE__";
      prefFind.doCommand();
      sleep(100);
      assert.equals(0, this.document.querySelectorAll("*[data-highlight]").length);
      assert.equals("notfound", prefFind.getAttribute("status"));
      assert.isTrue(this.document.getElementById("pref-find-previous").disabled);
      assert.isTrue(this.document.getElementById("pref-find-next").disabled);
      assert.equals("", this.document.getElementById("pref-find-status").value);

      prefFind.value = "";
      prefFind.doCommand();
      sleep(100);
      assert.equals(0, this.document.querySelectorAll("*[data-highlight]").length);
      assert.isFalse(prefFind.hasAttribute("status"));
      assert.isTrue(this.document.getElementById("pref-find-previous").disabled);
      assert.isTrue(this.document.getElementById("pref-find-next").disabled);
      assert.equals("", this.document.getElementById("pref-find-status").value);
    } finally {
      for (let e of this.document.querySelectorAll("*[mozunit-temp]")) {
        e.parentNode.removeChild(e);
      }
    }
  },
}
