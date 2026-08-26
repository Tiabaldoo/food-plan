(()=>{
  if(!window.MenuEngine)return;
  function decorate(){
    const root=document.getElementById('replaceContent');if(!root||!root.innerHTML)return;
    const eyebrow=root.querySelector('.eyebrow');if(!eyebrow)return;
    const text=eyebrow.textContent||'',parts=text.split('·').map(x=>x.trim());if(parts.length<3)return;
    const typeLabel=parts[2],type=(MenuEngine.slots.find(x=>x[1]===typeLabel)||[])[0];if(!type)return;
    const key=document.querySelector('#replaceModal.open')?document.querySelector('[data-replace].replace-open')?.dataset?.replace?.split('|')[0]:null;
  }
  // Expose helpers used by app.js without replacing its modal/event lifecycle.
  MenuEngine.replacementDisplayOptions=function(state,key,type){return MenuEngine.adaptiveReplacementOptions?MenuEngine.adaptiveReplacementOptions(state,key,type):MenuEngine.replacementOptions(state,key,type)};
  MenuEngine.smartReplace=function(state,key,type,onlyFavorites=false){
    const idx=MenuEngine.bestAdaptiveReplacementIndex?MenuEngine.bestAdaptiveReplacementIndex(state,key,type,onlyFavorites):null;
    if(idx===null||idx===undefined)return MenuEngine.randomReplace(state,key,type,onlyFavorites);
    MenuEngine.setRecipe(state,key,type,idx);return true;
  };
})();