function initRadioGroupConnect2(groupid,dataid,defaultdat){
  var mData = document.getElementById(dataid);
  var mGroup = document.getElementById(groupid);
  var preference = document.getElementById(mData.getAttribute("preference"));
  var val = preference.value;

  if(defaultdat != null && val == null)
    val = defaultdat;

  const _oncommandHandler = function (event) {
    var oRadio = event.target;
    var mData = oRadio.mData;
    mData.value = oRadio.value;
    if (mData.value == "") {
      document.getElementById(mData.getAttribute('preference')).reset();
    }else{
      document.documentElement.currentPane.userChangedValue(mData);
    }
    event.stopPropagation();
  };

  var oOthers; var found = false;
  Array.forEach(mGroup._getRadioChildren(), function(oRadio){
    oRadio.mData = mData;
    if(oRadio.value == "*"){
      oOthers = oRadio;
    }else{
      oRadio.addEventListener("command", _oncommandHandler, false);
      if(oRadio.value == String(val)){
        found = true;
        mGroup.selectedItem = oRadio;
      }
    }
  });
  if(!found) mGroup.selectedItem = oOthers;

  return val;
}
