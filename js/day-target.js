(()=>{
  if(!window.MenuEngine||typeof state==='undefined')return;

  const originalSetDayTargets=MenuEngine.setDayTargets.bind(MenuEngine);
  MenuEngine.setDayTargets=function(appState,key,targets){
    originalSetDayTargets(appState,key,targets);
    const day=MenuEngine.getDay(appState,key);day.targetOverride=true;Store.save(appState);
  };
  const originalResetDay=MenuEngine.resetDay.bind(MenuEngine);
  MenuEngine.resetDay=function(appState,key){
    const day=MenuEngine.getDay(appState,key);const override=Boolean(day.targetOverride);const targets={ivan:MenuEngine.targetFor(appState,key,'ivan'),wife:MenuEngine.targetFor(appState,key,'wife')};
    originalResetDay(appState,key);
    appState.daysByDate[key].targets=targets;appState.daysByDate[key].targetOverride=override;Store.save(appState);
  };

  const modal=document.createElement('div');
  modal.id='dayTargetModal';
  modal.className='modal';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML=`<div class="modal-backdrop" data-close-day-target></div><article class="modal-card day-target-modal-card" role="dialog" aria-modal="true" aria-labelledby="dayTargetTitle"><button class="modal-close" data-close-day-target aria-label="Закрыть">×</button><div id="dayTargetContent"></div></article>`;
  document.body.appendChild(modal);
  const content=modal.querySelector('#dayTargetContent');
  let activeKey=null;

  const originalRenderDay=window.renderDay;
  if(typeof originalRenderDay==='function'){
    window.renderDay=function(key){
      const selected=MenuEngine.getDay(state,key);
      const targetIvan=MenuEngine.targetFor(state,key,'ivan');
      const targetWife=MenuEngine.targetFor(state,key,'wife');
      let html=originalRenderDay(key);
      html=html.replace(`<button class="day-option danger" data-reset-day="${key}">`,`<button class="day-option" data-day-target="${key}">Изменить цель калорий</button><button class="day-option danger" data-reset-day="${key}">`);
      if(selected.targetOverride){
        html=html.replace(`План: <strong>${targetIvan} ккал</strong>`,`План: <strong>${targetIvan} ккал</strong><em class="individual-target">индивидуально</em>`);
        html=html.replace(`План: <strong>${targetWife} ккал</strong>`,`План: <strong>${targetWife} ккал</strong><em class="individual-target">индивидуально</em>`);
      }
      return html;
    };
  }

  function open(key){
    activeKey=key;
    const iv=MenuEngine.targetFor(state,key,'ivan'),wi=MenuEngine.targetFor(state,key,'wife');
    const piv=Number(window.PROFILE_DATA?.ivan?.target||PROFILES.ivan.target)||iv;
    const pwi=Number(window.PROFILE_DATA?.wife?.target||PROFILES.wife.target)||wi;
    content.innerHTML=`<p class="eyebrow">${MenuEngine.dayLabel(key)} · ${MenuEngine.formatDate(key)}</p><h2 id="dayTargetTitle">Цель калорий на этот день</h2><p class="day-target-note">Изменение действует только для этой даты и не меняет профили.</p><div class="day-target-fields"><label><span>${PROFILES.ivan.name}</span><input id="dayTargetIvan" type="number" min="900" max="6000" step="10" value="${iv}"></label><label><span>${PROFILES.wife.name}</span><input id="dayTargetWife" type="number" min="900" max="6000" step="10" value="${wi}"></label></div><div class="day-target-current">Текущие цели профилей: <strong>${PROFILES.ivan.name} ${piv} ккал</strong> · <strong>${PROFILES.wife.name} ${pwi} ккал</strong></div><button class="day-target-use-current" type="button" data-use-current-targets>Взять текущие цели из профилей</button><button class="day-target-save" type="button" data-save-day-target>Сохранить для этого дня</button>`;
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  }
  function close(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');activeKey=null}
  function refresh(){if(typeof window.render==='function')window.render();if(typeof window.refreshFoodCalendar==='function')window.refreshFoodCalendar()}
  function save(){if(!activeKey)return;const iv=Math.round(Number(document.getElementById('dayTargetIvan')?.value)),wi=Math.round(Number(document.getElementById('dayTargetWife')?.value));if(!Number.isFinite(iv)||!Number.isFinite(wi)||iv<900||wi<900)return;MenuEngine.setDayTargets(state,activeKey,{ivan:iv,wife:wi});close();refresh()}

  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-day-target]');
    if(btn){
      e.preventDefault();e.stopPropagation();
      const key=btn.dataset.dayTarget;
      openDayMenu=null;
      if(btn.closest('#calendarRoot')&&typeof window.refreshFoodCalendar==='function')window.refreshFoodCalendar();
      else if(typeof window.render==='function')window.render();
      open(key);
      return;
    }
    if(e.target.closest('[data-close-day-target]')){close();return}
    if(e.target.closest('[data-use-current-targets]')){document.getElementById('dayTargetIvan').value=Number(window.PROFILE_DATA?.ivan?.target||PROFILES.ivan.target)||'';document.getElementById('dayTargetWife').value=Number(window.PROFILE_DATA?.wife?.target||PROFILES.wife.target)||'';return}
    if(e.target.closest('[data-save-day-target]')){save();return}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))close()});
})();