(()=>{
  if(!window.RecipeModel||!window.MenuEngine)return;
  const modal=document.getElementById('recipeModal'),content=document.getElementById('recipeContent');
  if(!modal||!content)return;
  const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const r1=v=>Math.round((Number(v)||0)*10)/10;
  const fmt=(v,u)=>`${Number.isInteger(r1(v))?r1(v):r1(v)} ${u||'г'}`;
  function nutritionCard(name,n){return `<div class="nutrition-card"><strong>${esc(name)}</strong><span>${Math.round(Number(n?.kcal)||0)} ккал</span><span>Б ${r1(n?.p)} г</span><span>Ж ${r1(n?.f)} г</span><span>У ${r1(n?.c)} г</span></div>`}
  function rows(items,showRange=false){return (items||[]).map(i=>`<li><span>${esc(i.name)}</span><strong>${fmt(i.amount,i.unit)}</strong>${showRange&&i.min!=null&&i.max!=null?`<small>можно ${fmt(i.min,i.unit)}–${fmt(i.max,i.unit)}</small>`:''}</li>`).join('')}
  function combined(a,b){const map=new Map();[...(a||[]),...(b||[])].forEach(i=>{const k=i.productId||`${i.name}|${i.unit}`;const x=map.get(k)||{name:i.name,unit:i.unit,amount:0};x.amount+=Number(i.amount)||0;map.set(k,x)});return rows([...map.values()])}
  function legacyPersonIngredients(r,person){return (r.ingredients||[]).filter(i=>i&&i[person]!=null).map(i=>({name:i.name,unit:i.unit||'г',amount:Number(i[person])||0,productId:i.productId||null}))}
  function legacyNutrition(r,person){const m=r.macros?.[person]||{};return{kcal:Number(r.kcal?.[person])||0,p:Number(m.p)||0,f:Number(m.f)||0,c:Number(m.c)||0}}
  function openDayRecipe(id,key,type){
    if(!key||!type||typeof state==='undefined')return false;
    const snap=MenuEngine.adaptiveSnapshotFor?.(state,key),iv=snap?.people?.ivan?.meals?.[type],wi=snap?.people?.wife?.meals?.[type];
    if(!iv||!wi||iv.recipeId!==id||wi.recipeId!==id)return false;
    const r=RecipeModel.get(id);if(!r)return false;
    content.innerHTML=`<p class="eyebrow">Рецепт · порции на ${MenuEngine.formatDate(key)}</p><div class="recipe-heading"><h2 id="recipeTitle">${esc(r.name)}</h2></div><div class="recipe-facts"><span>⏱ ${esc(r.time||'—')}</span><span>🍳 ${esc(r.method||'—')}</span><span>⚖️ Адаптивные порции</span></div><section class="recipe-section"><h3>Калории и БЖУ</h3><div class="nutrition-grid">${nutritionCard(PROFILES.ivan.name,iv.nutrition)}${nutritionCard(PROFILES.wife.name,wi.nutrition)}</div></section><section class="recipe-section"><h3>Ингредиенты на двоих</h3><ul class="ingredient-list combined">${combined(iv.ingredients,wi.ingredients)}</ul></section><div class="recipe-grid recipe-portions"><section class="portion"><h3>${esc(PROFILES.ivan.name)}</h3><ul class="ingredient-list">${rows(iv.ingredients)}</ul></section><section class="portion"><h3>${esc(PROFILES.wife.name)}</h3><ul class="ingredient-list">${rows(wi.ingredients)}</ul></section></div><section class="recipe-section"><h3>Как приготовить</h3><ol class="recipe-steps">${(r.steps||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section><p class="recipe-disclaimer">Это сохранённые порции конкретного дня. Калории и БЖУ ориентировочные.</p>`;
    return true;
  }
  function openBaseRecipe(id){
    const r=RecipeModel.get(id);if(!r)return false;
    const iv=legacyPersonIngredients(r,'ivan'),wi=legacyPersonIngredients(r,'wife');
    const hasLegacy=iv.length&&wi.length&&r.kcal?.ivan!=null&&r.kcal?.wife!=null;
    if(hasLegacy){
      content.innerHTML=`<p class="eyebrow">Рецепт · ${esc(RecipeModel.categoryLabels[r.category]||'Блюдо')}</p><div class="recipe-heading"><h2 id="recipeTitle">${esc(r.name)}</h2></div><div class="recipe-facts"><span>⏱ ${esc(r.time||'—')}</span><span>🍳 ${esc(r.method||'—')}</span>${r.adaptive?.enabled?'<span>⚖️ Базовые порции</span>':''}</div><section class="recipe-section"><h3>Калории и БЖУ</h3><div class="nutrition-grid">${nutritionCard(PROFILES.ivan.name,legacyNutrition(r,'ivan'))}${nutritionCard(PROFILES.wife.name,legacyNutrition(r,'wife'))}</div></section><section class="recipe-section"><h3>Ингредиенты на двоих</h3><ul class="ingredient-list combined">${combined(iv,wi)}</ul></section><div class="recipe-grid recipe-portions"><section class="portion"><h3>${esc(PROFILES.ivan.name)}</h3><ul class="ingredient-list">${rows(iv)}</ul></section><section class="portion"><h3>${esc(PROFILES.wife.name)}</h3><ul class="ingredient-list">${rows(wi)}</ul></section></div><section class="recipe-section"><h3>Как приготовить</h3>${(r.steps||[]).length?`<ol class="recipe-steps">${r.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:'<p class="recipe-disclaimer">Шаги приготовления пока не заполнены.</p>'}</section>${r.adaptive?.enabled?'<p class="recipe-disclaimer">Это базовые порции рецепта. В конкретном дне сайт рассчитывает индивидуальные граммовки под цель калорий.</p>':''}`;
      return true;
    }
    const ingredients=r.adaptive?.enabled?(r.adaptive.ingredients||[]):(r.ingredients||[]);
    let n;if(ingredients.length)n=RecipeModel.totalNutrition(ingredients);else n={kcal:r.kcal?.ivan||0,p:r.macros?.ivan?.p||0,f:r.macros?.ivan?.f||0,c:r.macros?.ivan?.c||0};
    const range=RecipeModel.adaptiveRange(r);
    content.innerHTML=`<p class="eyebrow">Рецепт · ${esc(RecipeModel.categoryLabels[r.category]||'Блюдо')}</p><div class="recipe-heading"><h2 id="recipeTitle">${esc(r.name)}</h2></div><div class="recipe-facts"><span>⏱ ${esc(r.time||'—')}</span><span>🍳 ${esc(r.method||'—')}</span>${r.adaptive?.enabled?'<span>⚙️ Адаптивный рецепт</span>':''}</div><section class="recipe-section"><h3>Базовая порция</h3><div class="nutrition-grid"><div class="nutrition-card"><strong>${Math.round(n.kcal)} ккал</strong><span>Б ${r1(n.p)} г</span><span>Ж ${r1(n.f)} г</span><span>У ${r1(n.c)} г</span></div>${range?`<div class="nutrition-card"><strong>${range.min}–${range.max} ккал</strong><span>База ${range.base} ккал</span><span>Допустимый диапазон порции</span></div>`:''}</div></section><section class="recipe-section"><h3>Ингредиенты</h3>${ingredients.length?`<ul class="ingredient-list base-recipe-ingredients">${rows(ingredients,true)}</ul>`:'<p class="recipe-disclaimer">Для этого рецепта подробные ингредиенты пока не сохранены.</p>'}</section><section class="recipe-section"><h3>Как приготовить</h3>${(r.steps||[]).length?`<ol class="recipe-steps">${r.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:'<p class="recipe-disclaimer">Шаги приготовления пока не заполнены.</p>'}</section>`;
    return true;
  }
  function show(id,key=null,type=null){
    const ok=openDayRecipe(id,key,type)||openBaseRecipe(id);if(!ok)return;
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  }
  document.addEventListener('click',e=>{
    const menuBtn=e.target.closest('[data-recipe]');
    const libBtn=e.target.closest('[data-open-library-recipe]');
    if(!menuBtn&&!libBtn)return;
    const id=menuBtn?.dataset.recipe||libBtn?.dataset.openLibraryRecipe;if(!id)return;
    e.preventDefault();e.stopImmediatePropagation();
    show(id,menuBtn?.dataset.recipeDay||null,menuBtn?.dataset.recipeType||null);
  },true);
  window.openUnifiedRecipe=show;
})();