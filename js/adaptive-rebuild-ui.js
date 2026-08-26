(()=>{
  if(!window.MenuEngine||!window.AdaptiveRebuild)return;
  const TYPES=['breakfast','snack','lunch','dinner'];
  function hasRecorded(day){return TYPES.some(t=>day.eaten?.[t]?.ivan||day.eaten?.[t]?.wife)||day.alcoholEaten?.ivan||day.alcoholEaten?.wife||(Array.isArray(day.manualFood)&&day.manualFood.length)}
  function today(){return MenuEngine.localDateKey(new Date())}
  function warningFor(key){
    const day=MenuEngine.getDay(state,key);if(key<today()||hasRecorded(day))return null;
    const h=MenuEngine.adaptivePlanHealth(state,key);if(!h?.severe)return null;
    const who=[];if(h.misses[0]>60)who.push(`${PROFILES.ivan.name}: отклонение ${Math.round(h.misses[0])} ккал`);if(h.misses[1]>60)who.push(`${PROFILES.wife.name}: отклонение ${Math.round(h.misses[1])} ккал`);
    const limits=h.details.length?`${h.details.length} приёма пищи упёрлись в допустимые границы порций.`:'Текущие блюда плохо подстраиваются под новую цель.';
    return{limits,who:who.join(' · ')};
  }
  function inject(){
    document.querySelectorAll('.day-card[data-date]').forEach(card=>{
      card.querySelector('.adaptive-rebuild-warning')?.remove();const key=card.dataset.date,w=warningFor(key);if(!w)return;
      const box=document.createElement('div');box.className='adaptive-rebuild-warning';box.innerHTML=`<div><strong>Цель значительно изменилась</strong><p>${w.limits}${w.who?` ${w.who}.`:''} Можно оставить ближайшие нормальные порции или пересобрать блюда под эту цель.</p></div><button type="button" data-rebuild-day="${key}">Пересобрать меню</button>`;
      const calories=card.querySelector('.day-calories');(calories||card.firstElementChild)?.insertAdjacentElement('afterend',box);
    });
  }
  function rebuild(key){
    const result=MenuEngine.rebuildAdaptiveDay(state,key);if(!result?.ok){if(result?.reason==='recorded')alert('В этом дне уже есть отмеченная еда. Чтобы не менять историю, автоматическая пересборка отключена.');return}
    if(typeof window.render==='function')window.render();if(typeof window.refreshFoodCalendar==='function')window.refreshFoodCalendar();
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-rebuild-day]');if(!b)return;e.preventDefault();if(confirm('Подобрать другие блюда и заново рассчитать порции для этого дня?'))rebuild(b.dataset.rebuildDay)});
  const obs=new MutationObserver(()=>inject());function init(){inject();const root=document.getElementById('menuContainer');if(root)obs.observe(root,{childList:true,subtree:true})}document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
  window.refreshAdaptiveRebuildWarnings=inject;
})();