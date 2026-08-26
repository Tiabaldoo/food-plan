(()=>{
  const root=document.getElementById('calendarRoot');
  if(!root)return;
  let cursor=new Date();cursor=new Date(cursor.getFullYear(),cursor.getMonth(),1);
  const monthFmt=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'});

  function keyFor(date){return MenuEngine.localDateKey(date)}
  function targetFor(person){return person==='ivan'?PROFILES.ivan.target:PROFILES.wife.target}
  function personName(person){return person==='ivan'?PROFILES.ivan.name:PROFILES.wife.name}
  function manualKcal(day,person){return (Array.isArray(day.manualFood)?day.manualFood:[]).reduce((s,x)=>s+Math.max(0,Number(x.kcal?.[person])||0),0)}
  function hasAnyData(day,person){
    if(!day)return false;
    const planned=MenuEngine.slots.some(([type])=>Boolean(day.eaten?.[type]?.[person]));
    const alcohol=Boolean(day.alcohol&&day.alcoholEaten?.[person]);
    return planned||alcohol||manualKcal(day,person)>0;
  }
  function allPlannedEaten(day,person){return MenuEngine.slots.every(([type])=>Boolean(day?.eaten?.[type]?.[person]))}
  function statusFor(key,person){
    const day=state.daysByDate?.[key];
    if(!day||!hasAnyData(day,person))return{code:'none',label:'Нет данных',className:'status-none',kcal:0,alcohol:false,hasData:false};
    const totals=MenuEngine.eatenTotals(state,key);const kcal=totals[person];
    const alcohol=Boolean(day.alcohol&&day.alcoholEaten?.[person]);
    if(kcal>targetFor(person))return{code:'over',label:'Выше плана',className:'status-over',kcal,alcohol,hasData:true};
    if(allPlannedEaten(day,person))return{code:'good',label:'В плане',className:'status-good',kcal,alcohol,hasData:true};
    return{code:'partial',label:'Неполный день',className:'status-partial',kcal,alcohol,hasData:true};
  }
  function monthKeys(year,month){
    const out=[];const d=new Date(year,month,1);while(d.getMonth()===month){out.push(keyFor(d));d.setDate(d.getDate()+1)}return out;
  }
  function summary(person){
    const keys=monthKeys(cursor.getFullYear(),cursor.getMonth());
    const stats={good:0,over:0,partial:0,alcohol:0};
    keys.forEach(k=>{const s=statusFor(k,person);if(stats[s.code]!==undefined)stats[s.code]++;if(s.alcohol)stats.alcohol++});
    return stats;
  }
  function summaryMarkup(person){const s=summary(person);return `<div class="calendar-person-summary"><strong>${personName(person)}</strong><div class="calendar-summary-line">В плане: ${s.good} · Выше плана: ${s.over} · Неполных: ${s.partial} · 🍺 ${s.alcohol}</div></div>`}
  function personStatusRow(person,status){
    const short=person==='ivan'?'И':'Н';
    return `<div class="calendar-person-row" data-person="${person}"><span class="status-dot ${status.className}"></span><span class="person-short">${short}</span><span class="status-label">${status.label}</span>${status.alcohol?'<span class="calendar-alcohol">🍺</span>':''}</div>`;
  }
  function dayCell(date,inMonth){
    const key=keyFor(date);const iv=statusFor(key,'ivan'),wi=statusFor(key,'wife');const today=key===keyFor(new Date());
    let statuses='';
    if(!iv.hasData&&!wi.hasData){
      statuses='<div class="calendar-no-data"><span class="status-dot status-none"></span><span class="status-label">Нет данных</span></div>';
    }else{
      if(iv.hasData)statuses+=personStatusRow('ivan',iv);
      if(wi.hasData)statuses+=personStatusRow('wife',wi);
    }
    return `<div class="calendar-day ${inMonth?'':'outside'} ${today?'today':''}" data-calendar-date="${key}"><div class="calendar-date-number">${date.getDate()}</div><div class="calendar-statuses">${statuses}</div></div>`;
  }
  function render(){
    const y=cursor.getFullYear(),m=cursor.getMonth();const first=new Date(y,m,1);const jsDay=first.getDay();const mondayIndex=jsDay===0?6:jsDay-1;const start=new Date(y,m,1-mondayIndex);
    const cells=[];for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);cells.push(dayCell(d,d.getMonth()===m))}
    root.innerHTML=`<div class="calendar-card"><div class="calendar-toolbar"><button class="calendar-nav-btn" data-cal-prev aria-label="Предыдущий месяц">‹</button><h2>${monthFmt.format(cursor)}</h2><button class="calendar-nav-btn" data-cal-next aria-label="Следующий месяц">›</button></div><div class="calendar-summary">${summaryMarkup('ivan')}${summaryMarkup('wife')}</div><div class="calendar-legend"><span class="legend-item"><i class="status-dot status-good"></i>В плане</span><span class="legend-item"><i class="status-dot status-over"></i>Выше плана</span><span class="legend-item"><i class="status-dot status-partial"></i>Неполный</span><span class="legend-item"><i class="status-dot status-none"></i>Нет данных</span><span>🍺 алкоголь отмечен как выпитый</span></div><div class="calendar-weekdays"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div><div class="calendar-grid">${cells.join('')}</div></div>`;
    root.querySelector('[data-cal-prev]').onclick=()=>{cursor=new Date(y,m-1,1);render()};root.querySelector('[data-cal-next]').onclick=()=>{cursor=new Date(y,m+1,1);render()};
  }
  window.refreshFoodCalendar=render;
  document.addEventListener('click',e=>{if(e.target.closest('[data-section-target="calendar"]'))setTimeout(render,0)});
  render();
})();