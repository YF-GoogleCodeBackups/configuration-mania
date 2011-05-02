function initRadioGroupConnect2(groupid,dataid,defaultdat){
  var mData = document.getElementById(dataid);
  var mGroup = document.getElementById(groupid);
  var preference = document.getElementById(mData.getAttribute("preference"));
  var val = preference.value;

  if(defaultdat != null && val == null)
    val = defaultdat;

  const _oncommand = 
   "var mData = document.getElementById('" + dataid +"');"
   +"mData.value = event.target.value;"
   +"if(mData.value == ''){"
   +"document.getElementById(mData.getAttribute('preference')).reset();"
   +"}else{"
   +"document.documentElement.currentPane.userChangedValue(mData);"
   +"}event.stopPropagation();";
  const _oncommandHandler = new Function("event", _oncommand);

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
