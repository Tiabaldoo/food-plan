(()=>{
  const root=document.getElementById('profileRoot');
  if(!root||!window.PROFILE_DATA||!window.PROFILE_CALCULATOR)return;
  const calc=PROFILE_CALCULATOR;
  const data=PROFILE_DATA;
  const keys=['ivan','wife'];
  const goalLabels={loss:'Похудение',maintain:'Поддержание',gain:'Набор'};
  let mobileActive=localStorage.getItem('foodPlanMobileProfileV1')||'ivan';
  if(!keys.includes(mobileActive))mobileActive='ivan';

  function esc(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
  function num(value){const n=Number(value);return Number.isFinite(n)?n:''}
  function personTitle(key){return key==='ivan'?'Профиль Ивана':'Профиль Насти'}
  function sexOptions(value){return `<option value="male" ${value==='male'?'selected':''}>Мужской</option><option value="female" ${value==='female'?'selected':''}>Женский</option>`}
  function activityOptions(value){return Object.entries(calc.activities).map(([key,item])=>`<option value="${key}" ${value===key?'selected':''}>${item.label} — ${item.description}</option>`).join('')}
  function bodyValue(value){return value==null?'':value}

  function recommendationCards(key){
    const p=data[key],r=calc.recommendations(p,data.shared);
    return `<div class="calorie-goals">${['loss','maintain','gain'].map(goal=>`<button type="button" class="calorie-goal ${p.goal===goal?'active':''}" data-profile-goal="${key}|${goal}"><span>${goal==='loss'?'↘':goal==='gain'?'↗':'≈'} ${goalLabels[goal]}</span><strong>${r[goal]||'—'}${r[goal]?' ккал':''}</strong>${goal==='loss'?`<small>дефицит ${data.shared.lossPercent}%</small>`:goal==='gain'?`<small>профицит ${data.shared.gainPercent}%</small>`:'<small>примерный расход за день</small>'}</button>`).join('')}</div>`;
  }

  function calculationInfo(key){
    const p=data[key],base=calc.bmr(p),maintain=calc.tdee(p),activity=calc.activities[p.activity]||calc.activities.sedentary;
    if(!base||!maintain)return '<p class="profile-calc-empty">Заполни возраст, рост и текущий вес — калькулятор покажет рекомендации.</p>';
    return `<div class="calculation-explain"><div><span>Базовый обмен</span><strong>${base} ккал</strong></div><div><span>С учётом активности</span><strong>${maintain} ккал</strong></div></div><p class="calculation-note">Расчёт: Mifflin–St Jeor · ${activity.label.toLowerCase()} активность × ${activity.factor}. Значение ориентировочное и со временем лучше уточнять по динамике веса.</p>`;
  }

  function personCard(key){
    const p=data[key],recommended=calc.recommendations(p,data.shared)[p.goal]||'—';
    return `<article class="profile-card" data-profile-card="${key}">
      <div class="profile-card-head"><div><p class="eyebrow">${personTitle(key)}</p><h2>${esc(p.name)}</h2><div class="profile-mobile-summary"><span>${p.weight||'—'} кг</span><span>цель ${p.targetWeight||'—'} кг</span></div></div><div class="profile-target-badge"><span>Текущая цель</span><strong>${p.target||'—'} ккал</strong></div></div>
      <div class="profile-fields">
        <label class="profile-field-name"><span>Имя</span><input type="text" maxlength="40" value="${esc(p.name)}" data-profile-field="${key}|name"></label>
        <label><span>Пол</span><select data-profile-field="${key}|sex">${sexOptions(p.sex)}</select></label>
        <label><span>Возраст</span><input type="number" min="14" max="100" step="1" value="${num(p.age)}" data-profile-field="${key}|age"></label>
        <label><span>Рост, см</span><input type="number" min="120" max="230" step="1" value="${num(p.height)}" data-profile-field="${key}|height"></label>
        <label><span>Текущий вес, кг</span><input type="number" min="35" max="300" step="0.1" value="${num(p.weight)}" data-profile-field="${key}|weight"></label>
        <label><span>Целевой вес, кг</span><input type="number" min="35" max="300" step="0.1" value="${num(p.targetWeight)}" data-profile-field="${key}|targetWeight"></label>
        <label class="profile-field-wide"><span>Активность</span><select data-profile-field="${key}|activity">${activityOptions(p.activity)}</select></label>
      </div>

      <section class="profile-calculator">
        <div class="profile-section-title"><p class="eyebrow">Мини-калькулятор</p><h3>Сколько калорий в день</h3></div>
        ${recommendationCards(key)}${calculationInfo(key)}
        <div class="target-mode">
          <label class="target-mode-option"><input type="radio" name="targetMode-${key}" value="auto" data-profile-mode="${key}" ${p.calorieMode==='auto'?'checked':''}><span><strong>Автоматически</strong><small>Использовать расчёт</small></span></label>
          <label class="target-mode-option"><input type="radio" name="targetMode-${key}" value="manual" data-profile-mode="${key}" ${p.calorieMode!=='auto'?'checked':''}><span><strong>Вручную</strong><small>Оставить своё значение</small></span></label>
        </div>
        <label class="manual-target ${p.calorieMode==='auto'?'muted':''}"><span>Моя цель, ккал</span><input type="number" min="900" max="6000" step="10" value="${num(p.manualTarget)}" data-profile-field="${key}|manualTarget" ${p.calorieMode==='auto'?'disabled':''}><small>${p.calorieMode==='auto'?`Сейчас применяется расчёт: ${recommended} ккал`:`Расчёт сайта для «${goalLabels[p.goal].toLowerCase()}»: ${recommended} ккал`}</small></label>
      </section>

      <details class="body-details"><summary>Дополнительные параметры тела</summary><p>Необязательно. Пока эти данные сохраняются для будущей статистики и уточнения расчётов.</p><div class="profile-fields body-fields">
        <label><span>Жир, %</span><input type="number" min="2" max="70" step="0.1" value="${bodyValue(p.body.fat)}" data-body-field="${key}|fat"></label>
        <label><span>Мышечная масса, кг</span><input type="number" min="10" max="150" step="0.1" value="${bodyValue(p.body.muscle)}" data-body-field="${key}|muscle"></label>
        <label><span>Вода, %</span><input type="number" min="20" max="80" step="0.1" value="${bodyValue(p.body.water)}" data-body-field="${key}|water"></label>
        <label><span>Висцеральный жир</span><input type="number" min="1" max="40" step="1" value="${bodyValue(p.body.visceral)}" data-body-field="${key}|visceral"></label>
        <label><span>Основной обмен с весов</span><input type="number" min="500" max="5000" step="1" value="${bodyValue(p.body.scaleBmr)}" data-body-field="${key}|scaleBmr"></label>
      </div></details>

      <div class="weight-history-soon"><div><strong>История веса</strong><span>Следующий этап</span></div><p>Позже здесь появятся записи веса по датам, график и прогресс к целевому весу.</p></div>
    </article>`;
  }

  function render(){
    root.dataset.mobileProfile=mobileActive;
    root.innerHTML=`<div class="profiles-intro"><div><p class="eyebrow">Наши параметры</p><h2>Профили и цели</h2><p>Изменения профиля применяются к новым дням. У каждого дня сохраняется собственная цель калорий.</p></div></div>
      <div class="profile-mobile-tabs" role="tablist" aria-label="Выбор профиля"><button type="button" class="profile-mobile-tab ${mobileActive==='ivan'?'active':''}" data-mobile-profile="ivan">${esc(data.ivan.name)}</button><button type="button" class="profile-mobile-tab ${mobileActive==='wife'?'active':''}" data-mobile-profile="wife">${esc(data.wife.name)}</button></div>
      <div class="profiles-grid">${keys.map(personCard).join('')}</div>
      <article class="shared-settings"><div><p class="eyebrow">Общие настройки</p><h2>Настройки расчёта</h2><p>Эти проценты используются только в рекомендациях калькулятора.</p></div><div class="shared-fields"><label><span>Дефицит для похудения, %</span><input type="number" min="5" max="35" step="1" value="${data.shared.lossPercent}" data-shared-field="lossPercent"></label><label><span>Профицит для набора, %</span><input type="number" min="3" max="30" step="1" value="${data.shared.gainPercent}" data-shared-field="gainPercent"></label></div></article>`;
    root.dataset.mobileProfile=mobileActive;
  }

  function parseValue(field,value){if(['name','sex','activity'].includes(field))return value;const n=Number(value);return Number.isFinite(n)?n:null}
  function refreshApp(){if(typeof window.refreshFoodCalendar==='function')window.refreshFoodCalendar();if(typeof window.render==='function')window.render()}

  root.addEventListener('change',e=>{
    const field=e.target.dataset.profileField;
    if(field){const [key,name]=field.split('|');data[key][name]=parseValue(name,e.target.value);calc.save();render();refreshApp();return}
    const body=e.target.dataset.bodyField;
    if(body){const [key,name]=body.split('|');const raw=e.target.value.trim();data[key].body[name]=raw===''?null:Number(raw);calc.save();return}
    const shared=e.target.dataset.sharedField;
    if(shared){data.shared[shared]=Math.max(0,Number(e.target.value)||0);calc.save();render();refreshApp();return}
    const mode=e.target.dataset.profileMode;
    if(mode){data[mode].calorieMode=e.target.value;calc.save();render();refreshApp();return}
  });
  root.addEventListener('click',e=>{
    const mobile=e.target.closest('[data-mobile-profile]');
    if(mobile){mobileActive=mobile.dataset.mobileProfile;localStorage.setItem('foodPlanMobileProfileV1',mobileActive);render();return}
    const goal=e.target.closest('[data-profile-goal]');if(!goal)return;
    const [key,value]=goal.dataset.profileGoal.split('|');data[key].goal=value;calc.save();render();refreshApp();
  });

  const originalRenderDay=window.renderDay;
  if(typeof originalRenderDay==='function'){
    window.renderDay=function(key){
      const oldIvan=PROFILES.ivan.target,oldWife=PROFILES.wife.target;
      PROFILES.ivan.target=MenuEngine.targetFor(state,key,'ivan');
      PROFILES.wife.target=MenuEngine.targetFor(state,key,'wife');
      try{return originalRenderDay(key)}finally{PROFILES.ivan.target=oldIvan;PROFILES.wife.target=oldWife}
    };
  }

  render();
  if(typeof window.render==='function')window.render();
})();