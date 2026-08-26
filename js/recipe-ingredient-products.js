(()=>{
  if(!window.ProductModel)return;
  const modal=document.getElementById('recipeEditorModal');
  if(!modal)return;
  let activeInput=null;
  function esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
  function closeAll(){document.querySelectorAll('.ingredient-product-suggest').forEach(x=>x.remove());activeInput=null}
  function bindName(input){if(input.dataset.productBound)return;input.dataset.productBound='1';input.setAttribute('autocomplete','off');input.addEventListener('input',()=>show(input));input.addEventListener('focus',()=>{if(input.value.trim())show(input)})}
  function positionBox(box,input){
    const rect=input.getBoundingClientRect();
    const vv=window.visualViewport;
    const viewportH=vv?.height||window.innerHeight;
    const viewportTop=vv?.offsetTop||0;
    const gap=5;
    const safeBottom=window.innerWidth<=650?82:12;
    const below=viewportTop+viewportH-rect.bottom-safeBottom-gap;
    const above=rect.top-viewportTop-gap-8;
    const maxH=Math.max(110,Math.min(300,Math.max(below,above)));
    box.style.left=`${Math.max(8,rect.left)}px`;
    box.style.width=`${Math.min(rect.width,window.innerWidth-Math.max(8,rect.left)-8)}px`;
    box.style.maxHeight=`${maxH}px`;
    const natural=Math.min(box.scrollHeight,maxH);
    if(below>=150||below>=above){box.style.top=`${rect.bottom+gap}px`}else{box.style.top=`${Math.max(viewportTop+8,rect.top-gap-natural)}px`}
  }
  function show(input){
    closeAll();activeInput=input;
    const [idx]=input.dataset.ing.split('|');
    const items=ProductModel.search(input.value).slice(0,8);
    const box=document.createElement('div');box.className='ingredient-product-suggest';
    if(items.length){box.innerHTML=items.map(p=>`<button type="button" data-pick-product="${p.id}"><strong>${esc(p.brand?`${p.name} — ${p.brand}`:p.name)}</strong><small>${p.source==='standard'?'Стандартный':'Мой'} · ${p.nutrition.kcal} ккал ${p.nutritionBasis==='unit'?'на 1 шт':`на 100 ${p.unit}`}</small></button>`).join('')}else{box.innerHTML=`<button type="button" class="add-new-product-suggest" data-new-product-from="${esc(input.value)}">+ Добавить «${esc(input.value)}» как новый продукт</button>`}
    document.body.appendChild(box);positionBox(box,input);
    box.querySelectorAll('[data-pick-product]').forEach(b=>b.onclick=()=>pick(Number(idx),b.dataset.pickProduct));
    box.querySelector('[data-new-product-from]')?.addEventListener('click',()=>{const name=input.value.trim();document.querySelector('[data-close-recipe-editor]')?.click();window.showDishesSubsection?.('products');window.dispatchEvent(new CustomEvent('foodplan:add-product',{detail:{name}}));closeAll()});
  }
  function setField(idx,path,value){const el=modal.querySelector(`[data-ing="${idx}|${path}"]`);if(el){el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}}
  function pick(idx,id){const p=ProductModel.get(id);if(!p)return;setField(idx,'name',p.name+(p.brand?` — ${p.brand}`:''));setField(idx,'unit',p.unit);setField(idx,'nutrition.kcal',p.nutrition.kcal);setField(idx,'nutrition.p',p.nutrition.p);setField(idx,'nutrition.f',p.nutrition.f);setField(idx,'nutrition.c',p.nutrition.c);setField(idx,'role',p.defaultRole||'fixed');let hidden=modal.querySelector(`[data-ing="${idx}|productId"]`);if(!hidden){hidden=document.createElement('input');hidden.type='hidden';hidden.dataset.ing=`${idx}|productId`;modal.querySelector(`[data-ing="${idx}|name"]`)?.closest('.editor-ingredient')?.appendChild(hidden)}hidden.value=p.id;closeAll()}
  function reposition(){const box=document.querySelector('.ingredient-product-suggest');if(box&&activeInput&&document.body.contains(activeInput))positionBox(box,activeInput)}
  function scan(){modal.querySelectorAll('[data-ing$="|name"]').forEach(bindName)}
  const observer=new MutationObserver(scan);observer.observe(modal,{childList:true,subtree:true});scan();
  document.addEventListener('click',e=>{if(!e.target.closest('.ingredient-product-suggest')&&!e.target.matches('[data-ing$="|name"]'))closeAll()});
  window.addEventListener('resize',reposition);window.addEventListener('scroll',reposition,true);window.visualViewport?.addEventListener('resize',reposition);window.visualViewport?.addEventListener('scroll',reposition);
})();