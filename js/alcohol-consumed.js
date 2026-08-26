(()=>{
  const originalEatenTotals=MenuEngine.eatenTotals;
  const originalSetAlcoholPlan=MenuEngine.setAlcoholPlan;
  const originalDisableAlcohol=MenuEngine.disableAlcohol;
  const originalRenderMeal=renderMeal;

  MenuEngine.eatenTotals=function(state,day){
    const total=originalEatenTotals(state,day);
    const selected=state.selections[day];
    if(!selected||!selected.alcohol)return total;
    const eaten=selected.eaten&&selected.eaten.alcohol;
    if(!eaten)return total;
    const alcohol=MenuEngine.alcoholInfo(state,day);
    return{
      ivan:total.ivan+(eaten.ivan?alcohol.kcal.ivan:0),
      wife:total.wife+(eaten.wife?alcohol.kcal.wife:0)
    };
  };

  MenuEngine.setAlcoholPlan=function(state,day,plan){
    originalSetAlcoholPlan(state,day,plan);
    if(!state.selections[day].eaten)state.selections[day].eaten={};
    state.selections[day].eaten.alcohol={ivan:false,wife:false};
    Store.save(state);
  };

  MenuEngine.disableAlcohol=function(state,day){
    originalDisableAlcohol(state,day);
    if(state.selections[day].eaten)state.selections[day].eaten.alcohol={ivan:false,wife:false};
    Store.save(state);
  };

  renderMeal=function(day,m){
    if(!m.alcohol)return originalRenderMeal(day,m);
    const a=m.alcoholInfo;
    const amount=a.type==='unknown'
      ?'резерв без точного напитка'
      :`${PROFILES.ivan.name}: ${a.counts.ivan} × ${a.unit} · ${PROFILES.wife.name}: ${a.counts.wife} × ${a.unit}`;
    const eaten=state.selections[day].eaten&&state.selections[day].eaten.alcohol||{ivan:false,wife:false};
    const both=eaten.ivan&&eaten.wife;
    return `<div class="meal alcohol-meal ${both?'meal-eaten':''}"><div class="meal-main"><div class="meal-copy"><div class="meal-type">${m.label}</div><div class="meal-name">${m.recipe.name}</div><div class="meal-meta">${amount}</div><div class="meal-meta">${PROFILES.ivan.name}: ${m.kcal.ivan} ккал · ${PROFILES.wife.name}: ${m.kcal.wife} ккал</div><div class="eaten-people"><span class="alcohol-consumed-label">Выпито:</span>${personEatenToggle(day,'alcohol','ivan',PROFILES.ivan.name,eaten.ivan)}${personEatenToggle(day,'alcohol','wife',PROFILES.wife.name,eaten.wife)}</div></div></div><div class="meal-actions"><button class="action-btn" data-alcohol="${day}">Настроить</button></div></div>`;
  };

  render();
})();
