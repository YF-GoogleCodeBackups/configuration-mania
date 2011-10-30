gPrefWindow.prefHTTP = {
  resetAdvMaxSess : function(){
    Array.forEach(document.getElementById("http-ad-maxsess").getElementsByTagName("textbox"), function(elem){
      gPrefWindow.resetPref(document.getElementById(elem.getAttribute("preference")));
    });
  }
};
