(()=>{
  if(!window.RecipeModel)return;
  const KEY='foodPlanRecipeProductLinksV1';
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return{}}}
  let links=load();
  function persist(){localStorage.setItem(KEY,JSON.stringify(links))}
  const originalSave=RecipeModel.saveCustom.bind(RecipeModel);
  const originalGet=RecipeModel.get.bind(RecipeModel);
  const originalAll=RecipeModel.all.bind(RecipeModel);
  function apply(recipe){if(!recipe)return recipe;const map=links[recipe.id];if(!map||!Array.isArray(recipe.ingredients))return recipe;const ingredients=recipe.ingredients.map((i,idx)=>({...i,productId:map[idx]||i.productId||null}));const adaptive=recipe.adaptive?{...recipe.adaptive,ingredients:ingredients.map(x=>({...x}))}:recipe.adaptive;return{...recipe,ingredients,adaptive}}
  RecipeModel.saveCustom=function(draft,id=null){const res=originalSave(draft,id);if(res?.ok&&res.recipe){const map={};(draft.ingredients||[]).forEach((i,idx)=>{if(i.productId)map[idx]=i.productId});links[res.recipe.id]=map;persist();res.recipe=apply(res.recipe)}return res};
  RecipeModel.get=function(id){return apply(originalGet(id))};
  RecipeModel.all=function(opts){return originalAll(opts).map(apply)};
  window.RecipeProductLinks={KEY};
})();