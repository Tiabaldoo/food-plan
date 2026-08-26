(()=>{
  if(!window.MenuEngine||!window.AdaptivePortionEngine||!window.RecipeModel)return;
  function enriched(raw){return raw?(RecipeModel.get(raw.id)||raw):null}
  function otherMealKcal(state,key,type,person){return MenuEngine.mealsFor(state,key).filter(m=>!m.alcohol&&m.type!==type).reduce((s,m)=>s+Number(m.kcal?.[person]||0),0)}
  function alcoholKcal(state,key,person){const d=MenuEngine.getDay(state,key);return d.alcohol?Number(MenuEngine.alcoholInfo(state,key).kcal[person]||0):0}
  function desiredFor(state,key,type,person){return Math.max(0,MenuEngine.targetFor(state,key,person)-otherMealKcal(state,key,type,person)-alcoholKcal(state,key,person))}
  function optionFor(state,key,type,raw,index){
    const recipe=enriched(raw);if(!recipe)return null;
    const portions={};let penalty=0;
    ['ivan','wife'].forEach(person=>{const desired=desiredFor(state,key,type,person),result=AdaptivePortionEngine.calculate(recipe,desired);portions[person]={desired,result};if(!result.ok)penalty+=10000;else{penalty+=Math.abs(result.nutrition.kcal-desired);if(result.status==='below-range'||result.status==='above-range')penalty+=90;if(result.nutrition.p<12)penalty+=15}});
    const favorite=MenuEngine.isFavorite(state,raw.id),excluded=MenuEngine.isExcluded(state,raw.id),recent=MenuEngine.recentRecipeIds(state,type).has(raw.id);
    if(favorite)penalty-=20;if(recent)penalty+=12;if(excluded)penalty+=100000;
    return{recipe:raw,index,favorite,excluded,recent,score:penalty,portions};
  }
  function options(state,key,type){const d=MenuEngine.getDay(state,key),current=d[type]||0;return (window.RECIPES?.[type]||[]).map((r,i)=>optionFor(state,key,type,r,i)).filter(Boolean).map(o=>({...o,current:o.index===current})).sort((a,b)=>a.current?-1:b.current?1:a.score-b.score)}
  function bestIndex(state,key,type,onlyFavorites=false){const list=options(state,key,type).filter(o=>!o.current&&!o.excluded&&(!onlyFavorites||o.favorite));return list.length?list[0].index:null}
  MenuEngine.adaptiveReplacementOptions=options;
  MenuEngine.bestAdaptiveReplacementIndex=bestIndex;
})();