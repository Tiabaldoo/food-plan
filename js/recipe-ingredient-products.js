(()=>{
  if(!window.ProductModel)return;
  const modal=document.getElementById('recipeEditorModal');
  if(!modal)return;
  const isMobile=()=>window.matchMedia('(max-width:650px)').matches;
  let activeInput=null;
  let activeIndex=null;
  let picker=null;

  function esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
  function closeDropdown(){document.querySelectorAll('.ingredient-product-suggest').forEach(x=>x.remove())}
  function closePicker(){if(picker){picker.remove();picker=null}activeInput=null;activeIndex=null}
  function closeAll(){closeDropdown();closePicker()}
  function setField(idx,path,value){const el=modal.querySelector(`[data-ing="${idx}|${path}"]`);if(el){el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}}
  function pick(idx,id){
    const p=ProductModel.get(id);if(!p)return;
    setField(idx,'name',p.name+(p.brand?` — ${p.brand}`:''));
    setField(idx,'unit',p.unit);
    setField(idx,'nutrition.kcal',p.nutrition.kcal);
    setField(idx,'nutrition.p',p.nutrition.p);
    setField(idx,'nutrition.f',p.nutrition.f);
    setField(idx,'nutrition.c',p.nutrition.c);
    setField(idx,'role',p.defaultRole||'fixed');
    let hidden=modal.querySelector(`[data-ing="${idx}|productId"]`);
    if(!hidden){hidden=document.createElement('input');hidden.type='hidden';hidden.dataset.ing=`${idx}|productId`;modal.querySelector(`[data-ing="${idx}|name"]`)?.closest('.editor-ingredient')?.appendChild(hidden)}
    hidden.value=p.id;
    const target=modal.querySelector(`[data-ing="${idx}|name"]`);
    closeAll();
    setTimeout(()=>target?.scrollIntoView({behavior:'smooth',block:'center'}),50);
  }

  function resultButtons(items,query,idx){
    if(items.length)return items.map(p=>`<button type="button" data-mobile-pick-product="${p.id}"><strong>${esc(p.brand?`${p.name} — ${p.brand}`:p.name)}</strong><small>${p.source==='standard'?'Стандартный':'Мой'} · ${p.nutrition.kcal} ккал ${p.nutritionBasis==='unit'?'на 1 шт':`на 100 ${p.unit}`}</small></button>`).join('');
    return `<button type="button" class="mobile-product-add" data-mobile-new-product>+ Добавить «${esc(query)}» как новый продукт</button>`;
  }

  function renderPickerResults(query){
    if(!picker||activeIndex===null)return;
    const items=ProductModel.search(query).slice(0,20);
    const results=picker.querySelector('[data-mobile-product-results]');
    results.innerHTML=resultButtons(items,query,activeIndex);
    results.querySelectorAll('[data-mobile-pick-product]').forEach(b=>b.onclick=()=>pick(activeIndex,b.dataset.mobilePickProduct));
    results.querySelector('[data-mobile-new-product]')?.addEventListener('click',()=>{
      const name=picker.querySelector('[data-mobile-product-search]').value.trim();
      document.querySelector('[data-close-recipe-editor]')?.click();
      window.showDishesSubsection?.('products');
      window.dispatchEvent(new CustomEvent('foodplan:add-product',{detail:{name}}));
      closeAll();
    });
  }

  function openMobilePicker(input){
    closeAll();
    activeInput=input;
    activeIndex=Number(input.dataset.ing.split('|')[0]);
    picker=document.createElement('div');
    picker.className='mobile-product-picker';
    picker.innerHTML=`<div class="mobile-product-picker-backdrop" data-close-mobile-product-picker></div><section class="mobile-product-picker-sheet"><div class="mobile-product-picker-head"><div><p class="eyebrow">Ингредиент ${activeIndex+1}</p><h3>Выбрать продукт</h3></div><button type="button" data-close-mobile-product-picker aria-label="Закрыть">×</button></div><div class="mobile-product-picker-search"><span>⌕</span><input type="search" value="${esc(input.value)}" placeholder="Начни вводить продукт" data-mobile-product-search autocomplete="off"></div><div class="mobile-product-picker-results" data-mobile-product-results></div></section>`;
    document.body.appendChild(picker);
    const search=picker.querySelector('[data-mobile-product-search]');
    renderPickerResults(search.value);
    search.addEventListener('input',()=>renderPickerResults(search.value));
    picker.querySelectorAll('[data-close-mobile-product-picker]').forEach(b=>b.addEventListener('click',closePicker));
    setTimeout(()=>{search.focus();const pos=search.value.length;search.setSelectionRange?.(pos,pos)},50);
  }

  function positionBox(box,input){
    const rect=input.getBoundingClientRect();const gap=5;
    box.style.left=`${Math.max(8,rect.left)}px`;
    box.style.width=`${Math.min(rect.width,window.innerWidth-Math.max(8,rect.left)-8)}px`;
    box.style.top=`${rect.bottom+gap}px`;
    box.style.maxHeight='300px';
  }

  function showDesktop(input){
    closeDropdown();activeInput=input;
    const [idx]=input.dataset.ing.split('|');const items=ProductModel.search(input.value).slice(0,8);
    const box=document.createElement('div');box.className='ingredient-product-suggest';
    if(items.length){box.innerHTML=items.map(p=>`<button type="button" data-pick-product="${p.id}"><strong>${esc(p.brand?`${p.name} — ${p.brand}`:p.name)}</strong><small>${p.source==='standard'?'Стандартный':'Мой'} · ${p.nutrition.kcal} ккал ${p.nutritionBasis==='unit'?'на 1 шт':`на 100 ${p.unit}`}</small></button>`).join('')}else{box.innerHTML=`<button type="button" class="add-new-product-suggest" data-new-product-from="${esc(input.value)}">+ Добавить «${esc(input.value)}» как новый продукт</button>`}
    document.body.appendChild(box);positionBox(box,input);
    box.querySelectorAll('[data-pick-product]').forEach(b=>b.onclick=()=>pick(Number(idx),b.dataset.pickProduct));
    box.querySelector('[data-new-product-from]')?.addEventListener('click',()=>{const name=input.value.trim();document.querySelector('[data-close-recipe-editor]')?.click();window.showDishesSubsection?.('products');window.dispatchEvent(new CustomEvent('foodplan:add-product',{detail:{name}}));closeAll()});
  }

  function bindName(input){
    if(input.dataset.productBound)return;input.dataset.productBound='1';input.setAttribute('autocomplete','off');
    input.addEventListener('focus',e=>{if(isMobile()){e.preventDefault();setTimeout(()=>openMobilePicker(input),0)}else if(input.value.trim())showDesktop(input)});
    input.addEventListener('click',()=>{if(isMobile()&&!picker)openMobilePicker(input)});
    input.addEventListener('input',()=>{if(!isMobile())showDesktop(input)});
  }
  function scan(){modal.querySelectorAll('[data-ing$="|name"]').forEach(bindName)}
  const observer=new MutationObserver(scan);observer.observe(modal,{childList:true,subtree:true});scan();
  document.addEventListener('click',e=>{if(!isMobile()&&!e.target.closest('.ingredient-product-suggest')&&!e.target.matches('[data-ing$="|name"]'))closeDropdown()});
  window.addEventListener('resize',()=>{if(isMobile())closeDropdown();else closePicker()});
})();