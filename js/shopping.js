(()=>{
  if(!window.ShoppingEngine||typeof state==='undefined')return;
  const root=document.getElementById('shoppingRoot');if(!root)return;
  const STORAGE='foodPlanShoppingCheckedV1';
  let mode=localStorage.getItem('foodPlanShoppingPeriodV1')||'week';
  let customStart=localStorage.getItem('foodPlanShoppingStartV1')||MenuEngine.localDateKey(new Date());
  let customEnd=localStorage.getItem('foodPlanShoppingEndV1')||ShoppingEngine.addDays(customStart,6);
  function loadChecked(){try{return JSON.parse(localStorage.getItem(STORAGE))||{}}catch(e){return{}}}
  function saveChecked(x){localStorage.setItem(STORAGE,JSON.stringify(x))}
  function listKey(p){return`${p.start}|${p.end}`}
  function catOrder(){return['meat','fish','eggs','dairy','grains','bread','vegetables','fruits','fats','nuts','sauces','other']}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function render(){
    const p=ShoppingEngine.period(mode,{start:customStart,end:customEnd}),data=ShoppingEngine.build(state,p),checked=loadChecked(),ck=checked[listKey(p)]||{};
    const groups=catOrder().filter(c=>data.groups[c]?.length).map(c=>`<section class="shopping-group"><h3>${ProductModel.categories[c]||'Прочее'}</h3><div class="shopping-items">${data.groups[c].map(i=>{const done=Boolean(ck[i.key]);return `<label class="shopping-item ${done?'bought':''}"><input type="checkbox" data-shopping-check="${esc(i.key)}" ${done?'checked':''}><span class="shopping-check">✓</span><span class="shopping-product"><strong>${esc(i.name)}</strong>${i.sources.includes('legacy')?'<small>старые порции</small>':''}</span><span class="shopping-amount">${esc(ShoppingEngine.formatAmount(i.amount,i.unit))}</span></label>`}).join('')}</div></section>`).join('');
    const warning=data.warnings.length?`<div class="shopping-warning"><strong>Обрати внимание</strong><p>${data.warnings.map(esc).join(' ')}</p></div>`:'';
    root.innerHTML=`<div class="shopping-head"><div><p class="eyebrow">Список покупок</p><h2>Продукты на выбранный период</h2><p class="shopping-subtitle">Суммируем реальные порции Ивана и Насти из меню.</p></div><button type="button" class="shopping-reset" data-shopping-reset ${Object.values(ck).some(Boolean)?'':'disabled'}>Сбросить купленное</button></div><div class="shopping-periods"><button data-shopping-period="today" class="${mode==='today'?'active':''}">Сегодня</button><button data-shopping-period="3days" class="${mode==='3days'?'active':''}">3 дня</button><button data-shopping-period="week" class="${mode==='week'?'active':''}">Неделя</button><button data-shopping-period="custom" class="${mode==='custom'?'active':''}">Свой период</button></div>${mode==='custom'?`<div class="shopping-custom"><label>С <input type="date" data-shopping-start value="${customStart}"></label><label>По <input type="date" data-shopping-end value="${customEnd}"></label></div>`:''}<div class="shopping-range">${MenuEngine.formatDate(p.start)} — ${MenuEngine.formatDate(p.end)} · ${p.keys.length} ${p.keys.length===1?'день':p.keys.length<5?'дня':'дней'}</div>${warning}${groups||'<div class="shopping-empty"><strong>Список пока пуст</strong><p>На выбранный период нет блюд с доступными ингредиентами.</p></div>'}<div class="shopping-summary">Позиций: <strong>${data.items.length}</strong></div>`;
  }
  root.addEventListener('click',e=>{
    const period=e.target.closest('[data-shopping-period]');if(period){mode=period.dataset.shoppingPeriod;localStorage.setItem('foodPlanShoppingPeriodV1',mode);render();return}
    const reset=e.target.closest('[data-shopping-reset]');if(reset){const p=ShoppingEngine.period(mode,{start:customStart,end:customEnd}),all=loadChecked();delete all[listKey(p)];saveChecked(all);render()}
  });
  root.addEventListener('change',e=>{
    if(e.target.matches('[data-shopping-start]')){customStart=e.target.value||customStart;if(customEnd<customStart)customEnd=customStart;localStorage.setItem('foodPlanShoppingStartV1',customStart);localStorage.setItem('foodPlanShoppingEndV1',customEnd);render();return}
    if(e.target.matches('[data-shopping-end]')){customEnd=e.target.value&&e.target.value>=customStart?e.target.value:customStart;localStorage.setItem('foodPlanShoppingEndV1',customEnd);render();return}
    if(e.target.matches('[data-shopping-check]')){const p=ShoppingEngine.period(mode,{start:customStart,end:customEnd}),all=loadChecked(),k=listKey(p);all[k]=all[k]||{};all[k][e.target.dataset.shoppingCheck]=e.target.checked;saveChecked(all);render()}
  });
  document.querySelectorAll('[data-section-target="shopping"]').forEach(b=>b.addEventListener('click',()=>setTimeout(render,0)));
  window.refreshShoppingList=render;render();
})();