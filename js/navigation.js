(()=>{
  const titles={menu:'Наше меню',calendar:'Календарь',recipes:'Блюда',shopping:'Покупки',profile:'Мы'};
  const buttons=[...document.querySelectorAll('[data-section-target]')];
  const sections=[...document.querySelectorAll('[data-section-view]')];
  const title=document.getElementById('pageTitle');
  const viewSwitch=document.querySelector('.menu-view-switch');
  const key='foodPlanActiveSectionV1';

  function setSection(name,save=true){
    if(!titles[name]) name='menu';
    sections.forEach(section=>section.hidden=section.dataset.sectionView!==name);
    buttons.forEach(button=>{
      const active=button.dataset.sectionTarget===name;
      button.classList.toggle('active',active);
      button.setAttribute('aria-current',active?'page':'false');
    });
    if(title) title.textContent=titles[name];
    if(viewSwitch){
      const hide=name!=='menu';
      viewSwitch.hidden=hide;
      viewSwitch.classList.toggle('hidden',hide);
    }
    document.body.dataset.activeSection=name;
    if(save) localStorage.setItem(key,name);
    window.scrollTo({top:0,behavior:'instant'});
  }

  buttons.forEach(button=>button.addEventListener('click',()=>setSection(button.dataset.sectionTarget)));
  setSection(localStorage.getItem(key)||'menu',false);
})();