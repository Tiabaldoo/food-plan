(()=>{
  const recipes=document.getElementById('recipesRoot'),products=document.getElementById('productsRoot'),nav=document.querySelector('[data-dishes-subnav]');
  if(!recipes||!products||!nav)return;
  let active=localStorage.getItem('foodPlanDishesSubsectionV1')||'recipes';
  function show(name){active=name==='products'?'products':'recipes';recipes.hidden=active!=='recipes';products.hidden=active!=='products';nav.querySelectorAll('[data-dishes-view]').forEach(b=>b.classList.toggle('active',b.dataset.dishesView===active));localStorage.setItem('foodPlanDishesSubsectionV1',active);if(active==='products'&&typeof window.renderProductsLibrary==='function')window.renderProductsLibrary()}
  nav.querySelectorAll('[data-dishes-view]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.dishesView)));
  window.showDishesSubsection=show;show(active);
})();