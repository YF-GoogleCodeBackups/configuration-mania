function initRadioGroupConnect(groupid,dataid){
  var mGroup = document.getElementById(groupid);
  var mData = document.getElementById(dataid);

  const _oncommand = 
   "var mData = document.getElementById('" + dataid +"');"
   +"mData.value = event.target.value;"
   +"if(mData.value == ''){"
   +"document.getElementById(mData.getAttribute('preference')).reset();"
   +"}else{"
   +"document.documentElement.currentPane.userChangedValue(mData);"
   +"}event.preventBubble();";

  var oOthers; var found = false;
  Array.forEach(mGroup._getRadioChildren(), function(oRadio){
    oRadio.mData = mData;
    if(oRadio.value == "*"){
      oOthers = oRadio;
    }else{
      oRadio.setAttribute("oncommand", _oncommand);
      if(oRadio.value == mData.value){
        found = true;
        mGroup.selectedItem = oRadio;
      }
    }
  });
  if(!found) mGroup.selectedItem = oOthers;
}
function initRadioGroupConnect2(groupid,dataid,defaultdat){
  var mData = document.getElementById(dataid);
  var preference = document.getElementById(mData.getAttribute("preference"));
  if((preference.instantApply || !mData._xconnect_loaded) && (mData.value != preference.valueFromPreferences))
    mData.value = preference.valueFromPreferences;
  if(defaultdat != null && String(mData.value) == "") mData.value = defaultdat;
  mData._xconnect_loaded = true;
  initRadioGroupConnect(groupid,dataid);
  return mData.value;
}
