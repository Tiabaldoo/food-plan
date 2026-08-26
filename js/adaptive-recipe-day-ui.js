(()=>{
  if(typeof window.openRecipe!=='function'||!window.MenuEngine)return;
  const legacyOpen=window.openRecipe;
  function r1(v){return Math.round((Number(v)||0)*10)/10}
  function fmt(v,u){const n=r1(v);return `${Number.isInteger(n)?n:n} ${u}`}
  function recipeById(id){return Object.values(window.RECIPES||{}).flat().find(r=>r.id===id)||window.RecipeModel?.get(id)||null}
  function nutritionCardLocal(name,n){return `<div class="nutrition-card"><strong>${name}</strong><span>${Math.round(n.kcal)} ккал</span><span>Б ${r1(n.p)} г</span><span>Ж ${r1(n.f)} г</span><span>У ${r1(n.c)} г</span></div>`}
  function rows(items){return (items||[]).map(i=>`<li><span>${i.name}</span><strong>${fmt(i.amount,i.unit)}</strong></li>`).join('')}
  function combined(iv,wi){const map=new Map();[...(iv||[]),...(wi||[])].forEach(i=>{const k=i.productId||`${i.name}|${i.unit}`;const x=map.get(k)||{name:i.name,unit:i.unit,amount:0};x.amount+=Number(i.amount)||0;map.set(k,x)});return rows([...map.values()])}
  window.openRecipe=function(id,key=null,type=null){
    if(!key||!type||typeof state==='undefined'){legacyOpen(id,key,type);return}
    const snap=MenuEngine.adaptiveSnapshotFor?.(state,key),personI=snap?.people?.ivan?.meals?.[type],personW=snap?.people?.wife?.meals?.[type];
    if(!personI||!personW||personI.recipeId!==id||personW.recipeId!==id){legacyOpen(id,key,type);return}
    const r=recipeById(id);if(!r){legacyOpen(id,key,type);return}
    const modal=document.getElementById('recipeModal'),content=document.getElementById('recipeContent');if(!modal||!content)return;
    const pref=typeof window.preferenceButtons==='function'?window.preferenceButtons(r.id):'';
    content.innerHTML=`<p class="eyebrow">Рецепт · порции на ${MenuEngine.formatDate(key)}</p><div class="recipe-heading"><h2 id="recipeTitle">${r.name}</h2>${pref}</div><div class="recipe-facts"><span>⏱ ${r.time||'—'}</span><span>🍳 ${r.method||'—'}</span><span>⚖️ Адаптивные порции</span></div><section class="recipe-section"><h3>Калории и БЖУ</h3><div class="nutrition-grid">${nutritionCardLocal(PROFILES.ivan.name,personI.nutrition)}${nutritionCardLocal(PROFILES.wife.name,personW.nutrition)}</div></section><section class="recipe-section"><h3>Ингредиенты на двоих</h3><ul class="ingredient-list combined">${combined(personI.ingredients,personW.ingredients)}</ul></section><div class="recipe-grid recipe-portions"><section class="portion"><h3>${PROFILES.ivan.name}</h3><ul class="ingredient-list">${rows(personI.ingredients)}</ul></section><section class="portion"><h3>${PROFILES.wife.name}</h3><ul class="ingredient-list">${rows(personW.ingredients)}</ul></section></div><section class="recipe-section"><h3>Как приготовить</h3><ol class="recipe-steps">${(r.steps||[]).map(x=>`<li>${x}</li>`).join('')}</ol></section><p class="recipe-disclaimer">Это сохранённые порции конкретного дня. Калории и БЖУ ориентировочные.</p>`;
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');
    if(typeof window.bindRecipeActions==='function')window.bindRecipeActions(r.id,key,type);
  };
})();