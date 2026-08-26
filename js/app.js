let state=MenuEngine.normalize(Store.load());
Store.save(state);

const container=document.getElementById('menuContainer');
const modal=document.getElementById('recipeModal');
const replaceModal=document.getElementById('replaceModal');
const alcoholModal=document.getElementById('alcoholModal');
let openDayMenu=null;
let replaceContext=null;
let alcoholDay=null;

function todayKey(){return MenuEngine.localDateKey(new Date())}
function currentWeek(){return MenuEngine.weekDateKeys(new Date())}

function render(){
  document.querySelectorAll('.view-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
  container.classList.toggle('week-view',state.view==='week');
  const keys=state.view==='week'?currentWeek():[todayKey()];
  keys.forEach(key=>MenuEngine.ensureDay(state,key));
  container.innerHTML=keys.map(renderDay).join('');
  Store.save(state);
  bindDynamic();
}

function renderDay(key){
  const selected=MenuEngine.getDay(state,key);
  const eaten=MenuEngine.eatenTotals(state,key);
  const total=MenuEngine.totals(state,key);
  const overIvan=Math.max(0,total.ivan-PROFILES.ivan.target);
  const overWife=Math.max(0,total.wife-PROFILES.wife.target);
  return `<article class="day-card" data-date="${key}">
    <div class="day-head">
      <div class="day-title-wrap"><div><h2>${MenuEngine.dayLabel(key)}</h2><div class="day-date">${MenuEngine.formatDate(key)}</div></div>${selected.alcohol?'<span class="day-status" title="Алкогольный вечер включён">🍺</span>':''}</div>
      <div class="day-menu-wrap">
        <button class="day-menu-btn" data-day-menu="${key}" aria-label="Настройки дня" aria-expanded="${openDayMenu===key}">⋯</button>
        ${openDayMenu===key?`<div class="day-dropdown"><button class="day-option ${selected.alcohol?'active':''}" data-alcohol="${key}">${selected.alcohol?'⚙️ Настроить алкогольный вечер':'Алкогольный вечер'}</button>${selected.alcohol?`<button class="day-option" data-disable-alcohol="${key}">Убрать алкогольный вечер</button>`:''}<button class="day-option danger" data-reset-day="${key}">Сбросить изменения дня</button></div>`:''}
      </div>
    </div>
    <div class="day-calories">
      <div class="person-calories"><span class="person-name">${PROFILES.ivan.name}</span><span>План: <strong>${PROFILES.ivan.target} ккал</strong></span><span>Съедено: <strong>${eaten.ivan} ккал</strong></span>${selected.alcohol?`<span>Запланировано: <strong>${total.ivan} ккал</strong></span>`:''}</div>
      <div class="person-calories"><span class="person-name">${PROFILES.wife.name}</span><span>План: <strong>${PROFILES.wife.target} ккал</strong></span><span>Съедено: <strong>${eaten.wife} ккал</strong></span>${selected.alcohol?`<span>Запланировано: <strong>${total.wife} ккал</strong></span>`:''}</div>
    </div>
    ${selected.alcohol&&((overIvan>0)||(overWife>0))?`<div class="alcohol-warning">При выбранном количестве алкоголя дневной план превышен${overIvan?` · ${PROFILES.ivan.name} +${overIvan} ккал`:''}${overWife?` · ${PROFILES.wife.name} +${overWife} ккал`:''}. Еду ниже разумного минимума сайт не урезает.</div>`:''}
    <div class="meal-list">${MenuEngine.mealsFor(state,key).map(m=>renderMeal(key,m)).join('')}</div>
  </article>`;
}

function personEatenToggle(key,type,person,name,checked,prefix='Съел'){
  return `<label class="person-eaten ${checked?'active':''}" title="${name}: ${checked?'отмечено':'отметить'}"><input type="checkbox" data-eaten="${key}|${type}|${person}" ${checked?'checked':''}><span class="person-eaten-check">✓</span><span>${name}</span></label>`;
}
function alcoholEatenToggle(key,person,name,checked){
  return `<label class="person-eaten ${checked?'active':''}"><input type="checkbox" data-alcohol-eaten="${key}|${person}" ${checked?'checked':''}><span class="person-eaten-check">✓</span><span>${name}</span></label>`;
}

function renderMeal(key,m){
  if(m.alcohol){
    const a=m.alcoholInfo;
    const amount=a.type==='unknown'?'резерв без точного напитка':`${PROFILES.ivan.name}: ${a.counts.ivan} × ${a.unit} · ${PROFILES.wife.name}: ${a.counts.wife} × ${a.unit}`;
    return `<div class="meal alcohol-meal">
      <div class="meal-main"><div class="meal-copy"><div class="meal-type">${m.label}</div><div class="meal-name">${m.recipe.name}</div><div class="meal-meta">${amount}</div><div class="meal-meta">${PROFILES.ivan.name}: ${m.kcal.ivan} ккал · ${PROFILES.wife.name}: ${m.kcal.wife} ккал</div><div class="eaten-people"><span class="eaten-label">Выпито:</span>${alcoholEatenToggle(key,'ivan',PROFILES.ivan.name,m.eaten.ivan)}${alcoholEatenToggle(key,'wife',PROFILES.wife.name,m.eaten.wife)}</div></div></div>
      <div class="meal-actions"><button class="action-btn" data-alcohol="${key}">Настроить</button></div>
    </div>`;
  }
  const favorite=MenuEngine.isFavorite(state,m.recipe.id);
  const excluded=MenuEngine.isExcluded(state,m.recipe.id);
  const adjusted=m.scale&&(m.scale.ivan<.999||m.scale.wife<.999);
  const bothEaten=m.eaten&&m.eaten.ivan&&m.eaten.wife;
  return `<div class="meal ${bothEaten?'meal-eaten':''} ${excluded?'meal-excluded':''}">
    <div class="meal-main"><div class="meal-copy"><div class="meal-type">${m.label}${adjusted?' · порция уменьшена под вечер':''}</div>
      <div class="meal-title-row"><div class="meal-name" data-recipe="${m.recipe.id}" data-recipe-day="${key}" data-recipe-type="${m.type}">${m.recipe.name}</div><div class="meal-preference-actions"><button class="favorite-btn ${favorite?'active':''}" data-favorite="${m.recipe.id}">${favorite?'♥':'♡'}</button><button class="exclude-heart-btn ${excluded?'active':''}" data-excluded="${m.recipe.id}"><span>♡</span></button></div></div>
      <div class="meal-meta">${PROFILES.ivan.name}: ${m.kcal.ivan} ккал · ${PROFILES.wife.name}: ${m.kcal.wife} ккал</div>
      <div class="eaten-people">${personEatenToggle(key,m.type,'ivan',PROFILES.ivan.name,m.eaten&&m.eaten.ivan)}${personEatenToggle(key,m.type,'wife',PROFILES.wife.name,m.eaten&&m.eaten.wife)}</div>
    </div></div>
    <div class="meal-actions"><button class="action-btn primary" data-recipe="${m.recipe.id}" data-recipe-day="${key}" data-recipe-type="${m.type}">Рецепт</button><button class="action-btn" data-replace="${key}|${m.type}">Заменить</button></div>
  </div>`;
}

function findRecipe(id){return Object.values(RECIPES).flat().find(r=>r.id===id)}
function round1(v){return Math.round(v*10)/10}
function formatAmount(v,unit){return `${Number.isInteger(v)?v:round1(v)} ${unit}`}
function ingredientRows(r,mode,scale={ivan:1,wife:1}){return (r.ingredients||[]).map(i=>{const iv=i.ivan*scale.ivan,wi=i.wife*scale.wife;const value=mode==='both'?iv+wi:(mode==='ivan'?iv:wi);return `<li><span>${i.name}</span><strong>${formatAmount(round1(value),i.unit)}</strong></li>`}).join('')}
function scaledMacros(macros,s){return{p:round1(macros.p*s),f:round1(macros.f*s),c:round1(macros.c*s)}}
function nutritionCard(name,kcal,macros){return `<div class="nutrition-card"><strong>${name}</strong><span>${kcal} ккал</span><span>Б ${macros.p} г</span><span>Ж ${macros.f} г</span><span>У ${macros.c} г</span></div>`}
function preferenceButtons(id){const favorite=MenuEngine.isFavorite(state,id);const excluded=MenuEngine.isExcluded(state,id);return `<div class="recipe-pref-actions"><button class="favorite-btn ${favorite?'active':''}" data-recipe-favorite="${id}">${favorite?'♥':'♡'}</button><button class="exclude-heart-btn ${excluded?'active':''}" data-recipe-excluded="${id}"><span>♡</span></button></div>`}
function openRecipe(id,key=null,type=null){
  const r=findRecipe(id);if(!r)return;
  const scale=key?MenuEngine.alcoholScales(state,key):{ivan:1,wife:1};
  const kcal={ivan:Math.round(r.kcal.ivan*scale.ivan),wife:Math.round(r.kcal.wife*scale.wife)};
  const mi=scaledMacros(r.macros.ivan,scale.ivan),mw=scaledMacros(r.macros.wife,scale.wife);
  const adjusted=scale.ivan<.999||scale.wife<.999;
  document.getElementById('recipeContent').innerHTML=`<p class="eyebrow">Рецепт</p><div class="recipe-heading"><h2 id="recipeTitle">${r.name}</h2>${preferenceButtons(r.id)}</div><div class="recipe-facts"><span>⏱ ${r.time||'—'}</span><span>🍳 ${r.method||'—'}</span>${adjusted?'<span>🍺 Порции пересчитаны под алкогольный вечер</span>':''}</div><section class="recipe-section"><h3>Калории и БЖУ</h3><div class="nutrition-grid">${nutritionCard(PROFILES.ivan.name,kcal.ivan,mi)}${nutritionCard(PROFILES.wife.name,kcal.wife,mw)}</div></section><section class="recipe-section"><h3>Ингредиенты на двоих</h3><ul class="ingredient-list combined">${ingredientRows(r,'both',scale)}</ul></section><div class="recipe-grid recipe-portions"><section class="portion"><h3>${PROFILES.ivan.name}</h3><ul class="ingredient-list">${ingredientRows(r,'ivan',scale)}</ul></section><section class="portion"><h3>${PROFILES.wife.name}</h3><ul class="ingredient-list">${ingredientRows(r,'wife',scale)}</ul></section></div><section class="recipe-section"><h3>Как приготовить</h3><ol class="recipe-steps">${r.steps.map(x=>`<li>${x}</li>`).join('')}</ol></section><p class="recipe-disclaimer">Калории и БЖУ ориентировочные.</p>`;
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');bindRecipeActions(r.id,key,type);
}
function bindRecipeActions(id,key,type){
  document.querySelectorAll('[data-recipe-favorite]').forEach(b=>b.onclick=()=>{MenuEngine.toggleFavorite(state,b.dataset.recipeFavorite);openRecipe(id,key,type);render()});
  document.querySelectorAll('[data-recipe-excluded]').forEach(b=>b.onclick=()=>{MenuEngine.toggleExcluded(state,b.dataset.recipeExcluded);openRecipe(id,key,type);render()});
}
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}

function openAlcohol(key){
  alcoholDay=key;const d=MenuEngine.getDay(state,key);const p=d.alcoholPlan||{type:'unknown',ivan:1,wife:1};
  document.getElementById('alcoholContent').innerHTML=`<p class="eyebrow">${MenuEngine.dayLabel(key)} · ${MenuEngine.formatDate(key)}</p><h2 id="alcoholTitle">Алкогольный вечер</h2><p class="replace-note">Выберите напиток и примерное количество отдельно для каждого.</p><div class="alcohol-types">${Object.entries(MenuEngine.ALCOHOL).map(([k,v])=>`<label class="alcohol-type"><input type="radio" name="alcoholType" value="${k}" ${p.type===k?'checked':''}><span><strong>${v.label}</strong><small>${k==='unknown'?'сайт оставит примерный резерв':`≈ ${v.kcal} ккал за ${v.unit}`}</small></span></label>`).join('')}</div><div class="alcohol-counts"><label><span>${PROFILES.ivan.name} · количество порций</span><input id="alcoholIvan" type="number" min="0" max="20" step="1" value="${p.ivan}"></label><label><span>${PROFILES.wife.name} · количество порций</span><input id="alcoholWife" type="number" min="0" max="20" step="1" value="${p.wife}"></label></div><div class="alcohol-preview" id="alcoholPreview"></div><button class="alcohol-save" data-save-alcohol>Сохранить и перестроить день</button>`;
  alcoholModal.classList.add('open');alcoholModal.setAttribute('aria-hidden','false');bindAlcoholModal();updateAlcoholPreview();
}
function selectedAlcoholType(){return document.querySelector('input[name="alcoholType"]:checked')?.value||'unknown'}
function updateAlcoholPreview(){const type=selectedAlcoholType(),cfg=MenuEngine.ALCOHOL[type],iv=Math.max(0,+document.getElementById('alcoholIvan')?.value||0),wi=Math.max(0,+document.getElementById('alcoholWife')?.value||0);const ik=type==='unknown'?500:Math.round(cfg.kcal*iv),wk=type==='unknown'?350:Math.round(cfg.kcal*wi);document.getElementById('alcoholPreview').innerHTML=`Резерв на вечер: <strong>${PROFILES.ivan.name} ${ik} ккал</strong> · <strong>${PROFILES.wife.name} ${wk} ккал</strong>`}
function bindAlcoholModal(){document.querySelectorAll('input[name="alcoholType"],#alcoholIvan,#alcoholWife').forEach(x=>x.oninput=updateAlcoholPreview);document.querySelector('[data-save-alcohol]').onclick=()=>{MenuEngine.setAlcoholPlan(state,alcoholDay,{type:selectedAlcoholType(),ivan:document.getElementById('alcoholIvan').value,wife:document.getElementById('alcoholWife').value});closeAlcohol();render()}}
function closeAlcohol(){alcoholModal.classList.remove('open');alcoholModal.setAttribute('aria-hidden','true');alcoholDay=null}

function openReplace(key,type){replaceContext={key,type};renderReplaceModal();replaceModal.classList.add('open');replaceModal.setAttribute('aria-hidden','false')}
function closeReplace(){replaceModal.classList.remove('open');replaceModal.setAttribute('aria-hidden','true');replaceContext=null}
function renderReplaceModal(){
  if(!replaceContext)return;const{key,type}=replaceContext;const label=(MenuEngine.slots.find(x=>x[0]===type)||['',type])[1];const options=MenuEngine.replacementOptions(state,key,type);const alternatives=options.filter(x=>!x.current);const activeAlternatives=alternatives.filter(x=>!x.excluded);const favoriteAlternatives=activeAlternatives.filter(x=>x.favorite);
  document.getElementById('replaceContent').innerHTML=`<p class="eyebrow">${MenuEngine.dayLabel(key)} · ${MenuEngine.formatDate(key)} · ${label}</p><h2 id="replaceTitle">Заменить блюдо</h2><div class="replace-quick"><button class="replace-quick-btn" data-random-replace ${activeAlternatives.length?'':'disabled'}>🎲 Случайное</button><button class="replace-quick-btn" data-favorite-replace ${favoriteAlternatives.length?'':'disabled'}>♥ Любимое</button></div><p class="replace-note">Любимые блюда выпадают чаще. Блюда с зачёркнутым сердечком исключены из автоматической замены.</p><div class="replace-options">${alternatives.length?alternatives.map(x=>`<div class="replace-option-wrap ${x.excluded?'excluded-option':''}"><button class="replace-option ${x.favorite?'favorite-option':''}" data-pick-recipe="${x.index}" ${x.excluded?'disabled':''}><span><strong>${x.recipe.name}</strong>${x.favorite?'<span class="mini-heart">♥</span>':''}${x.excluded?'<span class="blocked-badge">Не предлагать</span>':''}</span><small>${PROFILES.ivan.name}: ${x.recipe.kcal.ivan} ккал · ${PROFILES.wife.name}: ${x.recipe.kcal.wife} ккал</small></button>${x.excluded?`<button class="restore-option-btn" data-restore-recipe="${x.recipe.id}">Вернуть</button>`:''}</div>`).join(''):'<div class="replace-empty">Пока для этого приёма пищи нет других вариантов.</div>'}</div>`;
  bindReplaceModal();
}
function bindReplaceModal(){
  document.querySelectorAll('[data-pick-recipe]').forEach(b=>b.onclick=()=>{if(!replaceContext)return;MenuEngine.setRecipe(state,replaceContext.key,replaceContext.type,+b.dataset.pickRecipe);closeReplace();render()});
  document.querySelectorAll('[data-restore-recipe]').forEach(b=>b.onclick=()=>{MenuEngine.toggleExcluded(state,b.dataset.restoreRecipe);renderReplaceModal();render()});
  const randomBtn=document.querySelector('[data-random-replace]');if(randomBtn)randomBtn.onclick=()=>{if(replaceContext&&MenuEngine.randomReplace(state,replaceContext.key,replaceContext.type,false)){closeReplace();render()}};
  const favBtn=document.querySelector('[data-favorite-replace]');if(favBtn)favBtn.onclick=()=>{if(replaceContext&&MenuEngine.randomReplace(state,replaceContext.key,replaceContext.type,true)){closeReplace();render()}};
}

function bindDynamic(){
  document.querySelectorAll('[data-replace]').forEach(b=>b.onclick=()=>{const[key,type]=b.dataset.replace.split('|');openReplace(key,type)});
  document.querySelectorAll('[data-recipe]').forEach(b=>b.onclick=()=>openRecipe(b.dataset.recipe,b.dataset.recipeDay||null,b.dataset.recipeType||null));
  document.querySelectorAll('[data-eaten]').forEach(input=>input.onchange=()=>{const[key,type,person]=input.dataset.eaten.split('|');MenuEngine.toggleEaten(state,key,type,person);render()});
  document.querySelectorAll('[data-alcohol-eaten]').forEach(input=>input.onchange=()=>{const[key,person]=input.dataset.alcoholEaten.split('|');MenuEngine.toggleAlcoholEaten(state,key,person);render()});
  document.querySelectorAll('[data-favorite]').forEach(b=>b.onclick=e=>{e.stopPropagation();MenuEngine.toggleFavorite(state,b.dataset.favorite);render()});
  document.querySelectorAll('[data-excluded]').forEach(b=>b.onclick=e=>{e.stopPropagation();MenuEngine.toggleExcluded(state,b.dataset.excluded);render()});
  document.querySelectorAll('[data-day-menu]').forEach(b=>b.onclick=e=>{e.stopPropagation();const key=b.dataset.dayMenu;openDayMenu=openDayMenu===key?null:key;render()});
  document.querySelectorAll('[data-alcohol]').forEach(b=>b.onclick=e=>{e.stopPropagation();openDayMenu=null;openAlcohol(b.dataset.alcohol);render()});
  document.querySelectorAll('[data-disable-alcohol]').forEach(b=>b.onclick=e=>{e.stopPropagation();MenuEngine.disableAlcohol(state,b.dataset.disableAlcohol);openDayMenu=null;render()});
  document.querySelectorAll('[data-reset-day]').forEach(b=>b.onclick=e=>{e.stopPropagation();const key=b.dataset.resetDay;if(confirm(`Сбросить все изменения за ${MenuEngine.dayLabel(key).toLowerCase()}, ${MenuEngine.formatDate(key)}?`)){MenuEngine.resetDay(state,key);openDayMenu=null;render()}});
}

document.querySelectorAll('.view-btn').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;openDayMenu=null;Store.save(state);render()});
document.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=closeModal);
document.querySelectorAll('[data-close-replace]').forEach(b=>b.onclick=closeReplace);
document.querySelectorAll('[data-close-alcohol]').forEach(b=>b.onclick=closeAlcohol);
document.addEventListener('click',e=>{if(openDayMenu!==null&&!e.target.closest('.day-menu-wrap')){openDayMenu=null;render()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeReplace();closeAlcohol();if(openDayMenu!==null){openDayMenu=null;render()}}});
render();