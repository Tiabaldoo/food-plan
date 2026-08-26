(()=>{
  if(!window.PROFILE_CALCULATOR||!window.MenuEngine||typeof state==='undefined')return;
  const originalSave=PROFILE_CALCULATOR.save.bind(PROFILE_CALCULATOR);
  function hasRecordedData(day){
    if(!day)return false;
    const eaten=MenuEngine.slots.some(([type])=>Boolean(day.eaten?.[type]?.ivan)||Boolean(day.eaten?.[type]?.wife));
    const alcohol=Boolean(day.alcoholEaten?.ivan)||Boolean(day.alcoholEaten?.wife);
    const manual=Array.isArray(day.manualFood)&&day.manualFood.length>0;
    return eaten||alcohol||manual;
  }
  function syncTargets(){
    const today=MenuEngine.localDateKey(new Date());
    Object.entries(state.daysByDate||{}).forEach(([key,day])=>{
      if(key>today||(key===today&&!hasRecordedData(day))){
        day.targets={ivan:Number(PROFILES.ivan.target)||1900,wife:Number(PROFILES.wife.target)||1550};
      }
    });
    Store.save(state);
  }
  PROFILE_CALCULATOR.save=function(){originalSave();syncTargets()};
  window.syncProfileTargets=syncTargets;
})();