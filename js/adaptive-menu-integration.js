(()=>{
  if(!window.MenuEngine||!window.AdaptiveDayEngine||!window.RecipeModel)return;
  const VERSION=1;
  const original={
    mealsFor:MenuEngine.mealsFor.bind(MenuEngine),
    setRecipe:MenuEngine.setRecipe.bind(MenuEngine),
    setDayTargets:MenuEngine.setDayTargets.bind(MenuEngine),
    setAlcoholPlan:MenuEngine.setAlcoholPlan.bind(MenuEngine),
    disableAlcohol:MenuEngine.disableAlcohol.bind(MenuEngine),
    resetDay:MenuEngine.resetDay.bind(MenuEngine)
  };
  function recipeIdFor(day,type){const list=window.RECIPES?.[type]||[];return list[day[type]||0]?.id||null}
  function recipeSignature(day){return MenuEngine.slots.map(([type])=>`${type}:${recipeIdFor(day,type)||''}`).join('|')}
  function targetSignature(state,key){return `i${MenuEngine.targetFor(state,key,'ivan')}-w${MenuEngine.targetFor(state,key,'wife')}`}
  function alcoholSignature(state,key){const d=MenuEngine.getDay(state,key);if(!d.alcohol)return 'none';const a=MenuEngine.alcoholInfo(state,key);return `${a.type}:${a.counts.ivan}:${a.counts.wife}:${a.kcal.ivan}:${a.kcal.wife}`}
  function hasRecordedData(day){
    const eaten=MenuEngine.slots.some(([type])=>Boolean(day.eaten?.[type]?.ivan)||Boolean(day.eaten?.[type]?.wife));
    return eaten||Boolean(day.alcoholEaten?.ivan)||Boolean(day.alcoholEaten?.wife)||(Array.isArray(day.manualFood)&&day.manualFood.length>0);
  }
  function invalidate(state,key){const d=MenuEngine.getDay(state,key);delete d.adaptivePlan;delete d.adaptivePlanMeta}
  function snapshotMeal(m){const r=m.result;if(!r?.ok)return null;return{recipeId:r.recipeId,recipeName:r.recipeName,targetKcal:r.targetKcal,status:r.status,nutrition:{...r.nutrition},ingredients:r.ingredients.map(i=>({productId:i.productId||null,name:i.name,unit:i.unit,role:i.role,amount:i.amount,nutrition:{...i.nutrition}}))}}
  function makeSnapshot(state,key){
    const plan=AdaptiveDayEngine.planDay(state,key),day=MenuEngine.getDay(state,key);
    const people={};
    ['ivan','wife'].forEach(person=>{const p=plan[person],meals={};MenuEngine.slots.forEach(([type])=>meals[type]=snapshotMeal(p.meals[type]));people[person]={target:p.target,foodTarget:p.foodTarget,proteinGoal:p.proteinGoal,proteinStatus:p.proteinStatus,nutrition:{...p.nutrition},status:p.status,meals}});
    const snap={version:VERSION,createdAt:Date.now(),date:key,targets:{ivan:MenuEngine.targetFor(state,key,'ivan'),wife:MenuEngine.targetFor(state,key,'wife')},recipeSignature:recipeSignature(day),alcoholSignature:alcoholSignature(state,key),people};
    day.adaptivePlan=snap;day.adaptivePlanMeta={version:VERSION};
    if(window.Store)Store.save(state);
    return snap;
  }
  function isValid(state,key,snap){const day=MenuEngine.getDay(state,key);return Boolean(snap&&snap.version===VERSION&&snap.recipeSignature===recipeSignature(day)&&snap.alcoholSignature===alcoholSignature(state,key)&&Number(snap.targets?.ivan)===MenuEngine.targetFor(state,key,'ivan')&&Number(snap.targets?.wife)===MenuEngine.targetFor(state,key,'wife'))}
  function snapshotFor(state,key){
    const day=MenuEngine.getDay(state,key),today=MenuEngine.localDateKey(new Date());
    if(isValid(state,key,day.adaptivePlan))return day.adaptivePlan;
    // Preserve untouched historical days created before adaptive portions existed.
    if(key<today&&!day.adaptivePlan)return null;
    // Today's already-recorded intake should not silently move because profile settings changed.
    if(key===today&&hasRecordedData(day)&&day.adaptivePlan&&!isValid(state,key,day.adaptivePlan))return day.adaptivePlan;
    return makeSnapshot(state,key);
  }
  function adaptiveMeals(state,key){
    const snap=snapshotFor(state,key);if(!snap)return original.mealsFor(state,key);
    const day=MenuEngine.getDay(state,key);
    const meals=MenuEngine.slots.map(([type,label])=>{
      const list=window.RECIPES?.[type]||[],recipe=list[day[type]||0];const iv=snap.people.ivan.meals[type],wi=snap.people.wife.meals[type];
      if(!recipe||!iv||!wi)return original.mealsFor(state,key).find(x=>x.type===type);
      return{type,label,recipe,eaten:MenuEngine.eatenStatus(state,key,type),adaptive:true,portion:{ivan:iv,wife:wi},kcal:{ivan:iv.nutrition.kcal,wife:wi.nutrition.kcal},macros:{ivan:iv.nutrition,wife:wi.nutrition}};
    }).filter(Boolean);
    if(day.alcohol){const old=original.mealsFor(state,key).find(x=>x.alcohol);if(old)meals.push(old)}
    return meals;
  }
  MenuEngine.mealsFor=adaptiveMeals;
  MenuEngine.totals=function(state,key){return adaptiveMeals(state,key).reduce((a,m)=>({ivan:a.ivan+Number(m.kcal?.ivan||0),wife:a.wife+Number(m.kcal?.wife||0)}),{ivan:0,wife:0})};
  MenuEngine.eatenTotals=function(state,key){return adaptiveMeals(state,key).reduce((a,m)=>({ivan:a.ivan+(m.eaten?.ivan?Number(m.kcal?.ivan||0):0),wife:a.wife+(m.eaten?.wife?Number(m.kcal?.wife||0):0)}),{ivan:0,wife:0})};
  MenuEngine.adaptiveSnapshotFor=snapshotFor;
  MenuEngine.invalidateAdaptivePlan=invalidate;
  MenuEngine.setRecipe=function(state,key,type,index){invalidate(state,key);original.setRecipe(state,key,type,index);invalidate(state,key);if(key>=MenuEngine.localDateKey(new Date()))snapshotFor(state,key);if(window.Store)Store.save(state)};
  MenuEngine.setDayTargets=function(state,key,targets){invalidate(state,key);original.setDayTargets(state,key,targets);invalidate(state,key);snapshotFor(state,key);if(window.Store)Store.save(state)};
  MenuEngine.setAlcoholPlan=function(state,key,plan){invalidate(state,key);original.setAlcoholPlan(state,key,plan);invalidate(state,key);snapshotFor(state,key);if(window.Store)Store.save(state)};
  MenuEngine.disableAlcohol=function(state,key){invalidate(state,key);original.disableAlcohol(state,key);invalidate(state,key);snapshotFor(state,key);if(window.Store)Store.save(state)};
  MenuEngine.resetDay=function(state,key){original.resetDay(state,key);invalidate(state,key);if(key>=MenuEngine.localDateKey(new Date()))snapshotFor(state,key);if(window.Store)Store.save(state)};
})();