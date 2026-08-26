(()=>{
  const DEFAULT_SHARES={breakfast:.25,snack:.10,lunch:.35,dinner:.30};
  const SHARE_RANGES={breakfast:[.20,.30],snack:[.06,.14],lunch:[.30,.40],dinner:[.25,.35]};
  const PROTEIN_PER_KG={loss:1.4,maintain:1.2,gain:1.5};
  const MIN_PROTEIN={male:90,female:75};
  const MAX_PROTEIN={male:180,female:145};
  const TYPES=['breakfast','snack','lunch','dinner'];
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function round1(v){return Math.round((Number(v)||0)*10)/10}
  function proteinTarget(person){
    const p=window.PROFILES?.[person]||{};const weight=Number(p.weight)||0;const goal=p.goal||'loss';const sex=p.sex||'male';
    return Math.round(clamp(weight*(PROTEIN_PER_KG[goal]||1.3),MIN_PROTEIN[sex]||75,MAX_PROTEIN[sex]||160));
  }
  function recipeFor(state,key,type){const d=window.MenuEngine.getDay(state,key),list=window.RECIPES?.[type]||[];return list[d[type]||0]||null}
  function mealBudget(target,type){return Math.round(target*(DEFAULT_SHARES[type]||0))}
  function calc(recipe,target){return window.AdaptivePortionEngine?.calculate(recipe,target)||{ok:false}}
  function planPerson(state,key,person){
    const target=window.MenuEngine.targetFor(state,key,person);const day=window.MenuEngine.getDay(state,key);let foodTarget=target;
    if(day.alcohol){const a=window.MenuEngine.alcoholInfo(state,key);foodTarget=Math.max(person==='ivan'?1100:950,target-a.kcal[person])}
    const meals={};
    TYPES.forEach(type=>{const recipe=recipeFor(state,key,type);const desired=mealBudget(foodTarget,type);meals[type]={type,recipe,desired,result:recipe?calc(recipe,desired):{ok:false}}});
    // Balance remaining kcal across meals that still have room, preserving normal recipe ranges.
    for(let pass=0;pass<5;pass++){
      const total=TYPES.reduce((s,t)=>s+(meals[t].result.ok?meals[t].result.nutrition.kcal:0),0);const diff=foodTarget-total;if(Math.abs(diff)<=18)break;
      const direction=diff>0?1:-1;
      const candidates=TYPES.map(type=>meals[type]).filter(m=>m.result.ok).filter(m=>direction>0?m.result.nutrition.kcal<m.result.maxNutrition.kcal-5:m.result.nutrition.kcal>m.result.minNutrition.kcal+5);
      if(!candidates.length)break;
      const weights={breakfast:.8,snack:.5,lunch:1,dinner:.9};const sum=candidates.reduce((s,m)=>s+(weights[m.type]||1),0);
      candidates.forEach(m=>{const share=(weights[m.type]||1)/sum;const next=Math.round(m.result.nutrition.kcal+diff*share);m.result=calc(m.recipe,next);m.desired=next});
    }
    const nutrition=TYPES.reduce((a,t)=>{const n=meals[t].result.ok?meals[t].result.nutrition:null;if(n){a.kcal+=n.kcal;a.p+=n.p;a.f+=n.f;a.c+=n.c}return a},{kcal:0,p:0,f:0,c:0});
    nutrition.kcal=Math.round(nutrition.kcal);nutrition.p=round1(nutrition.p);nutrition.f=round1(nutrition.f);nutrition.c=round1(nutrition.c);
    const proteinGoal=proteinTarget(person);const proteinStatus=nutrition.p>=proteinGoal?'ok':nutrition.p>=proteinGoal*.85?'near':'low';
    const impossible=TYPES.some(t=>meals[t].result.ok&&['below-range','above-range'].includes(meals[t].result.status));
    return{person,target,foodTarget,proteinGoal,proteinStatus,nutrition,meals,status:impossible?'range-warning':Math.abs(nutrition.kcal-foodTarget)<=25?'ok':'closest'};
  }
  function planDay(state,key){return{key,ivan:planPerson(state,key,'ivan'),wife:planPerson(state,key,'wife'),shares:{...DEFAULT_SHARES},ranges:{...SHARE_RANGES}}}
  window.AdaptiveDayEngine={planDay,planPerson,proteinTarget,DEFAULT_SHARES,SHARE_RANGES};
})();