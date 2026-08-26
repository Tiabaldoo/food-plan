(()=>{
  if(!window.MenuEngine||!window.AdaptiveDayEngine||!window.AdaptivePortionEngine||!window.RecipeModel)return;
  const TYPES=['breakfast','snack','lunch','dinner'];
  const TYPE_LABEL={breakfast:'Завтрак',snack:'Перекус',lunch:'Обед',dinner:'Ужин'};
  function enriched(raw){return raw?(RecipeModel.get(raw.id)||raw):null}
  function hasRecorded(day){return TYPES.some(t=>day.eaten?.[t]?.ivan||day.eaten?.[t]?.wife)||day.alcoholEaten?.ivan||day.alcoholEaten?.wife||(Array.isArray(day.manualFood)&&day.manualFood.length)}
  function planHealth(state,key){
    const plan=AdaptiveDayEngine.planDay(state,key);const people=['ivan','wife'].map(p=>plan[p]);
    const details=[];people.forEach(p=>TYPES.forEach(type=>{const r=p.meals[type]?.result;if(r?.ok&&['below-range','above-range'].includes(r.status))details.push({person:p.person,type,status:r.status,kcal:r.nutrition.kcal,target:r.targetKcal})}));
    const misses=people.map(p=>Math.abs(p.nutrition.kcal-p.foodTarget));const lowProtein=people.some(p=>p.proteinStatus==='low');
    const severe=details.length>=2||misses.some(x=>x>100)||(details.length>=1&&misses.some(x=>x>60));
    return{plan,severe,details,misses,lowProtein};
  }
  function candidateScore(state,key,type,index){
    const list=window.RECIPES?.[type]||[],raw=list[index],recipe=enriched(raw);if(!recipe||MenuEngine.isExcluded(state,raw.id))return Infinity;
    const d=MenuEngine.getDay(state,key),old=d[type];d[type]=index;const h=planHealth(state,key);d[type]=old;
    let score=h.misses.reduce((a,b)=>a+b,0)+h.details.length*90+(h.lowProtein?45:0);if(MenuEngine.isFavorite(state,raw.id))score-=18;if(MenuEngine.recentRecipeIds(state,type).has(raw.id))score+=10;return score;
  }
  function bestForType(state,key,type){const list=window.RECIPES?.[type]||[];let best=null;list.forEach((r,i)=>{if(MenuEngine.isExcluded(state,r.id))return;const score=candidateScore(state,key,type,i);if(!best||score<best.score)best={index:i,score}});return best}
  function rebuild(state,key){
    const day=MenuEngine.getDay(state,key);if(hasRecorded(day))return{ok:false,reason:'recorded'};
    const before={};TYPES.forEach(t=>before[t]=day[t]);
    for(let pass=0;pass<2;pass++){
      TYPES.forEach(type=>{const best=bestForType(state,key,type);if(best)day[type]=best.index});
    }
    if(MenuEngine.invalidateAdaptivePlan)MenuEngine.invalidateAdaptivePlan(state,key);
    const snapshot=MenuEngine.adaptiveSnapshotFor?MenuEngine.adaptiveSnapshotFor(state,key):null;TYPES.forEach(type=>{const list=window.RECIPES?.[type]||[],r=list[day[type]];if(r)MenuEngine.recentRecipeIds(state,type)});if(window.Store)Store.save(state);
    return{ok:true,before,after:Object.fromEntries(TYPES.map(t=>[t,day[t]])),snapshot,health:planHealth(state,key)};
  }
  MenuEngine.adaptivePlanHealth=planHealth;
  MenuEngine.rebuildAdaptiveDay=rebuild;
  window.AdaptiveRebuild={planHealth,rebuild,TYPE_LABEL};
})();