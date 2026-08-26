(()=>{
  const root=document.getElementById('calendarRoot');
  if(!root)return;
  let cursor=new Date();cursor=new Date(cursor.getFullYear(),cursor.getMonth(),1);
  let detailKey=null;
  const monthFmt=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'});

  function keyFor(date){return MenuEngine.localDateKey(date)}
  function targetFor(person){return person==='ivan'?PROFILES.ivan.target:PROFILES.wife.target}
  function personName(person){return person==='ivan'?PROFILES.ivan.name:PROFILES.wife.name}
  function manualKcal(day,person){return (Array.isArray(day?.manualFood)?day.manualFood:[]).reduce((s,x)=>s+Math.max(0,Number(x.kcal?.[person])||0),0)}
  function hasAnyData(day,person){if(!day)return false;const planned=MenuEngine.slots.some(([type])=>Boolean(day.eaten?.[type]?.[person]));const alcohol=Boolean(day.alcohol&&day.alcoholEaten?.[person]);return planned||alcohol||manualKcal(day,person)>0}
  function allPlannedEaten(day,person){return MenuEngine.slots.every(([type])=>Boolean(day?.eaten?.[type]?.[person]))}
  function statusFor(key,person){const day=state.daysByDate?.[key];if(!day||!hasAnyData(day,person))return{code:'none',label:'Нет данных',className:'status-none',kcal:0,alcohol:false,hasData:false};const totals=MenuEngine.eatenTotals(state,key),kcal=totals[person],alcohol=Boolean(day.alcohol&&day.alcoholEaten?.[person]);if(kcal>targetFor(person))return{code:'over',label:'Выше плана',className:'status-over',kcal,alcohol,hasData:true};if(allPlannedEaten(day,person))return{code:'good',label:'В плане',className:'status-good',kcal,alcohol,hasData:true};return{code:'partial',label:'Неполный день',className:'status-partial',kcal,alcohol,hasData:true}}
  function monthKeys(year,month){const out=[];const d=new Date(year,month,1);while(d.getMonth()===month){out.push(keyFor(d));d.setDate(d.getDate()+1)}return out}
  function summary(person){const keys=monthKeys(cursor.getFullYear(),cursor.getMonth()),stats={good:0,over:0,partial:0,alcohol:0};keys.forEach(k=>{const s=statusFor(k,person);if(stats[s.code]!==undefined)stats[s.code]++;if(s.alcohol)stats.alcohol++});return stats}
  function summaryMarkup(person){const s=summary(person);return `<div class="calendar-person-summary"><strong>${personName(person)}</strong><div class="calendar-summary-line">В плане: ${s.good} · Выше плана: ${s.over} · Неполных: ${s.partial} · 🍺 ${s.alcohol}</div></div>`}
  function personStatusRow(person,status){const short=person==='ivan'?'И':'Н';return `<div class="calendar-person-row" data-person="${person}"><span class="status-dot ${status.className}"></span><span class="person-short">${short}</span><span class="status-label">${status.label}</span>${status.alcohol?'<span class="calendar-alcohol">🍺</span>':''}</div>`}
  function dayCell(date,inMonth){const key=keyFor(date),iv=statusFor(key,'ivan'),wi=statusFor(key,'wife'),today=key===keyFor(new Date());let statuses='';if(!iv.hasData&&!wi.hasData)statuses='<div class="calendar-no-data"><span class="status-dot status-none"></span><span class="status-label">Нет данных</span></div>';else{if(iv.hasData)statuses+=personStatusRow('ivan',iv);if(wi.hasData)statuses+=personStatusRow('wife',wi)}return `<button type="button" class="calendar-day ${inMonth?'':'outside'} ${today?'today':''}" data-calendar-date="${key}" aria-label="Открыть ${MenuEngine.dayLabel(key)}, ${MenuEngine.formatDate(key)}"><span class="calendar-date-number">${date.getDate()}</span><span class="calendar-statuses">${statuses}</span></button>`}

  function escapeHtml(value){return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
  function manualFoodMarkup(key){const day=MenuEngine.getDay(state,key),items=Array.isArray(day.manualFood)?day.manualFood:[];return `<section class="manual-food-section" data-manual-food-section="${key}"><div class="manual-food-head"><div><strong>Дополнительно съедено</strong><small>Еда вне плана сразу учитывается в «Съедено»</small></div><button class="manual-food-add" data-add-manual="${key}">+ Добавить еду</button></div>${items.length?`<div class="manual-food-list">${items.map(item=>{const parts=[];if(item.kcal?.ivan)parts.push(`${PROFILES.ivan.name}: ${item.kcal.ivan} ккал`);if(item.kcal?.wife)parts.push(`${PROFILES.wife.name}: ${item.kcal.wife} ккал`);return `<div class="manual-food-item"><div><strong>${escapeHtml(item.name)}</strong><small>${parts.join(' · ')}</small></div><button class="manual-food-delete" data-delete-manual="${key}|${item.id}" aria-label="Удалить">×</button></div>`}).join('')}</div>`:''}</section>`}

  function renderDetail(key){detailKey=key;MenuEngine.ensureDay(state,key);root.innerHTML=`<div class="calendar-detail"><button class="calendar-back-btn" data-calendar-back>← Назад к календарю</button><div class="calendar-detail-title"><span>День из календаря</span><strong>${MenuEngine.dayLabel(key)}, ${MenuEngine.formatDate(key)}</strong></div><div class="calendar-detail-card">${typeof renderDay==='function'?renderDay(key):''}</div></div>`;const card=root.querySelector('.calendar-detail-card .day-card');if(card){const list=card.querySelector('.meal-list');if(list)list.insertAdjacentHTML('afterend',manualFoodMarkup(key))}if(typeof bindDynamic==='function')bindDynamic();const back=root.querySelector('[data-calendar-back]');if(back)back.onclick=()=>{detailKey=null;openDayMenu=null;renderCalendar()}}

  function renderCalendar(){detailKey=null;openDayMenu=null;const y=cursor.getFullYear(),m=cursor.getMonth(),first=new Date(y,m,1),jsDay=first.getDay(),mondayIndex=jsDay===0?6:jsDay-1,start=new Date(y,m,1-mondayIndex),cells=[];for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);cells.push(dayCell(d,d.getMonth()===m))}root.innerHTML=`<div class="calendar-card"><div class="calendar-toolbar"><button class="calendar-nav-btn" data-cal-prev aria-label="Предыдущий месяц">‹</button><h2>${monthFmt.format(cursor)}</h2><button class="calendar-nav-btn" data-cal-next aria-label="Следующий месяц">›</button></div><div class="calendar-summary">${summaryMarkup('ivan')}${summaryMarkup('wife')}</div><div class="calendar-legend"><span class="legend-item"><i class="status-dot status-good"></i>В плане</span><span class="legend-item"><i class="status-dot status-over"></i>Выше плана</span><span class="legend-item"><i class="status-dot status-partial"></i>Неполный</span><span class="legend-item"><i class="status-dot status-none"></i>Нет данных</span><span>🍺 алкоголь отмечен как выпитый</span></div><div class="calendar-weekdays"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div><div class="calendar-grid">${cells.join('')}</div></div>`;root.querySelector('[data-cal-prev]').onclick=()=>{cursor=new Date(y,m-1,1);renderCalendar()};root.querySelector('[data-cal-next]').onclick=()=>{cursor=new Date(y,m+1,1);renderCalendar()};root.querySelectorAll('[data-calendar-date]').forEach(cell=>cell.onclick=()=>renderDetail(cell.dataset.calendarDate))}

  function refreshDetailSoon(){if(detailKey)setTimeout(()=>{if(detailKey)renderDetail(detailKey)},40)}

  document.addEventListener('click',e=>{
    if(!detailKey)return;
    const menuBtn=e.target.closest('#calendarRoot [data-day-menu]');
    if(!menuBtn)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const key=menuBtn.dataset.dayMenu;
    openDayMenu=openDayMenu===key?null:key;
    renderDetail(detailKey);
  },true);

  document.addEventListener('change',e=>{if(detailKey&&e.target.closest('#calendarRoot'))refreshDetailSoon()});
  document.addEventListener('click',e=>{if(e.target.closest('[data-section-target="calendar"]'))setTimeout(()=>detailKey?renderDetail(detailKey):renderCalendar(),0);if(!detailKey)return;if(e.target.closest('#calendarRoot [data-favorite],#calendarRoot [data-excluded],#calendarRoot [data-disable-alcohol],#calendarRoot [data-reset-day],#calendarRoot [data-delete-manual],#calendarRoot [data-alcohol-eaten]'))refreshDetailSoon();if(e.target.closest('[data-save-alcohol],[data-pick-recipe],[data-random-replace],[data-favorite-replace],[data-restore-recipe],[data-save-manual]'))refreshDetailSoon()});

  window.refreshFoodCalendar=()=>detailKey?renderDetail(detailKey):renderCalendar();
  renderCalendar();
})();