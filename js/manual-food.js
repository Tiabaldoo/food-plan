(()=>{
  const modal=document.getElementById('manualFoodModal');
  const content=document.getElementById('manualFoodContent');
  let activeDate=null;

  function ensureList(key){
    const day=MenuEngine.getDay(state,key);
    if(!Array.isArray(day.manualFood)) day.manualFood=[];
    return day.manualFood;
  }

  function escapeHtml(value){
    return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  const baseEatenTotals=MenuEngine.eatenTotals.bind(MenuEngine);
  MenuEngine.eatenTotals=(appState,key)=>{
    const total=baseEatenTotals(appState,key);
    const day=MenuEngine.getDay(appState,key);
    const items=Array.isArray(day.manualFood)?day.manualFood:[];
    items.forEach(item=>{
      total.ivan+=Math.max(0,Number(item.kcal?.ivan)||0);
      total.wife+=Math.max(0,Number(item.kcal?.wife)||0);
    });
    return total;
  };

  function manualFoodMarkup(key){
    const items=ensureList(key);
    return `<section class="manual-food-section" data-manual-food-section="${key}">
      <div class="manual-food-head"><div><strong>Дополнительно съедено</strong><small>Еда вне плана сразу учитывается в «Съедено»</small></div><button class="manual-food-add" data-add-manual="${key}">+ Добавить еду</button></div>
      ${items.length?`<div class="manual-food-list">${items.map(item=>{
        const parts=[];
        if(item.kcal.ivan) parts.push(`${PROFILES.ivan.name}: ${item.kcal.ivan} ккал`);
        if(item.kcal.wife) parts.push(`${PROFILES.wife.name}: ${item.kcal.wife} ккал`);
        return `<div class="manual-food-item"><div><strong>${escapeHtml(item.name)}</strong><small>${parts.join(' · ')}</small></div><button class="manual-food-delete" data-delete-manual="${key}|${item.id}" aria-label="Удалить">×</button></div>`;
      }).join('')}</div>`:''}
    </section>`;
  }

  function injectSections(){
    document.querySelectorAll('.day-card[data-date]').forEach(card=>{
      const key=card.dataset.date;
      const old=card.querySelector('[data-manual-food-section]');
      if(old) old.remove();
      const list=card.querySelector('.meal-list');
      if(list) list.insertAdjacentHTML('afterend',manualFoodMarkup(key));
    });
  }

  function openModal(key){
    activeDate=key;
    content.innerHTML=`<p class="eyebrow">${MenuEngine.dayLabel(key)} · ${MenuEngine.formatDate(key)}</p>
      <h2 id="manualFoodTitle">Добавить еду</h2>
      <p class="manual-food-note">Добавь то, что было съедено помимо плана. Достаточно примерной калорийности.</p>
      <div class="manual-person-choice">
        <label><input type="radio" name="manualPerson" value="ivan" checked><span>${PROFILES.ivan.name}</span></label>
        <label><input type="radio" name="manualPerson" value="wife"><span>${PROFILES.wife.name}</span></label>
        <label><input type="radio" name="manualPerson" value="both"><span>Оба</span></label>
      </div>
      <label class="manual-field"><span>Что съели</span><input id="manualFoodName" type="text" maxlength="100" placeholder="Например: 2 куска пиццы"></label>
      <label class="manual-field"><span>Примерно калорий</span><input id="manualFoodKcal" type="number" min="1" max="5000" step="1" inputmode="numeric" placeholder="500"></label>
      <p class="manual-food-error" id="manualFoodError" hidden></p>
      <button class="manual-food-save" data-save-manual>Добавить в съеденное</button>`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    setTimeout(()=>document.getElementById('manualFoodName')?.focus(),0);
  }

  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    activeDate=null;
  }

  function saveManualFood(){
    if(!activeDate) return;
    const name=document.getElementById('manualFoodName')?.value.trim();
    const kcal=Math.round(Number(document.getElementById('manualFoodKcal')?.value));
    const person=document.querySelector('input[name="manualPerson"]:checked')?.value||'ivan';
    const error=document.getElementById('manualFoodError');
    if(!name||!Number.isFinite(kcal)||kcal<=0){
      error.textContent='Укажи название еды и калорийность больше нуля.';
      error.hidden=false;
      return;
    }
    const item={id:`mf-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name,kcal:{ivan:0,wife:0},createdAt:Date.now()};
    if(person==='ivan'||person==='both') item.kcal.ivan=kcal;
    if(person==='wife'||person==='both') item.kcal.wife=kcal;
    ensureList(activeDate).push(item);
    Store.save(state);
    closeModal();
    render();
  }

  function deleteManualFood(key,id){
    const day=MenuEngine.getDay(state,key);
    day.manualFood=(Array.isArray(day.manualFood)?day.manualFood:[]).filter(item=>item.id!==id);
    Store.save(state);
    render();
  }

  document.addEventListener('click',e=>{
    const add=e.target.closest('[data-add-manual]');
    if(add){openModal(add.dataset.addManual);return}
    const del=e.target.closest('[data-delete-manual]');
    if(del){const [key,id]=del.dataset.deleteManual.split('|');deleteManualFood(key,id);return}
    if(e.target.closest('[data-close-manual]')){closeModal();return}
    if(e.target.closest('[data-save-manual]')){saveManualFood();return}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeModal()});

  const observer=new MutationObserver(()=>injectSections());
  observer.observe(document.getElementById('menuContainer'),{childList:true,subtree:false});
  injectSections();
  render();
})();