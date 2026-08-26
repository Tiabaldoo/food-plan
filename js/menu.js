window.MenuEngine=(()=>{
  const days=['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
  const slots=[['breakfast','Завтрак'],['snack','Перекус'],['lunch','Обед'],['dinner','Ужин']];
  const RECENT_LIMIT=5;
  const ALCOHOL={
    beer:{label:'Пиво',unit:'0,5 л',kcal:215},
    gin:{label:'Джин + zero-тоник',unit:'50 мл джина',kcal:110},
    wine:{label:'Вино',unit:'150 мл',kcal:125},
    unknown:{label:'Пока не знаю',unit:'резерв',kcal:0}
  };

  function localDateKey(date=new Date()){
    const y=date.getFullYear();
    const m=String(date.getMonth()+1).padStart(2,'0');
    const d=String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  function dateFromKey(key){const [y,m,d]=key.split('-').map(Number);return new Date(y,m-1,d)}
  function mondayFor(date=new Date()){
    const x=new Date(date.getFullYear(),date.getMonth(),date.getDate());
    const weekday=x.getDay();
    x.setDate(x.getDate()-(weekday===0?6:weekday-1));
    return x;
  }
  function weekDateKeys(date=new Date()){
    const monday=mondayFor(date);
    return Array.from({length:7},(_,i)=>{const x=new Date(monday);x.setDate(monday.getDate()+i);return localDateKey(x)});
  }
  function weekdayIndex(key){const d=dateFromKey(key).getDay();return d===0?6:d-1}
  function dayLabel(key){return days[weekdayIndex(key)]}
  function formatDate(key){return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long'}).format(dateFromKey(key))}
  function emptyEaten(){return{ivan:false,wife:false}}
  function normalizeEatenValue(value){
    if(value===true)return{ivan:true,wife:true};
    if(value&&typeof value==='object')return{ivan:Boolean(value.ivan),wife:Boolean(value.wife)};
    return emptyEaten();
  }
  function currentTargets(){return{ivan:Number(PROFILES.ivan.target)||1900,wife:Number(PROFILES.wife.target)||1550}}
  function dayDefaults(key){
    const di=weekdayIndex(key);
    const day={targets:currentTargets(),alcohol:false,alcoholPlan:{type:'unknown',ivan:1,wife:1},alcoholEaten:{ivan:false,wife:false},eaten:{},manualFood:[]};
    slots.forEach(([type])=>{day[type]=di%RECIPES[type].length;day.eaten[type]=emptyEaten()});
    return day;
  }
  function normalizeDay(saved,key){
    const base=dayDefaults(key);
    saved=saved||{};
    const eaten={};
    slots.forEach(([type])=>eaten[type]=normalizeEatenValue(saved.eaten&&saved.eaten[type]));
    const targets={...base.targets,...(saved.targets||{})};
    return {...base,...saved,targets,alcoholPlan:{...base.alcoholPlan,...(saved.alcoholPlan||{})},alcoholEaten:normalizeEatenValue(saved.alcoholEaten),manualFood:Array.isArray(saved.manualFood)?saved.manualFood:[],eaten};
  }
  function defaultHistory(){return{breakfast:[],snack:[],lunch:[],dinner:[]}}
  function defaultState(){return{view:'today',daysByDate:{},favorites:{},excluded:{},history:defaultHistory()}}
  function normalize(state){
    const base=defaultState();
    state=state||{};
    const daysByDate={};
    if(state.daysByDate&&typeof state.daysByDate==='object'){
      Object.entries(state.daysByDate).forEach(([key,value])=>daysByDate[key]=normalizeDay(value,key));
    }else if(state.selections&&typeof state.selections==='object'){
      const currentWeek=weekDateKeys(new Date());
      currentWeek.forEach((key,i)=>{if(state.selections[i]||state.selections[String(i)])daysByDate[key]=normalizeDay(state.selections[i]||state.selections[String(i)],key)});
    }
    const savedHistory=state.history||{};
    return {...base,...state,daysByDate,favorites:{...(state.favorites||{})},excluded:{...(state.excluded||{})},history:{...defaultHistory(),...savedHistory},selections:undefined};
  }
  function ensureDay(state,key){if(!state.daysByDate[key])state.daysByDate[key]=dayDefaults(key);return state.daysByDate[key]}
  function getDay(state,key){return ensureDay(state,key)}
  function targetFor(state,key,person){
    const d=ensureDay(state,key);const value=Number(d.targets&&d.targets[person]);
    return Number.isFinite(value)&&value>0?value:Number(PROFILES[person]?.target)||0;
  }
  function rememberRecipe(state,type,recipeId){
    if(!state.history)state.history=defaultHistory();
    if(!Array.isArray(state.history[type]))state.history[type]=[];
    state.history[type]=[...state.history[type],recipeId].slice(-20);
  }
  function recentRecipeIds(state,type){const history=state.history&&Array.isArray(state.history[type])?state.history[type]:[];return new Set(history.slice(-RECENT_LIMIT))}
  function setRecipe(state,key,type,index){
    const list=RECIPES[type]||[];if(!list.length)return;
    const d=ensureDay(state,key);const safe=Math.max(0,Math.min(index,list.length-1));
    d[type]=safe;d.eaten[type]=emptyEaten();rememberRecipe(state,type,list[safe].id);Store.save(state);
  }
  function replacementOptions(state,key,type){
    const list=RECIPES[type]||[];const d=ensureDay(state,key);const current=d[type]||0;const recent=recentRecipeIds(state,type);
    return list.map((recipe,index)=>({recipe,index,current:index===current,favorite:isFavorite(state,recipe.id),excluded:isExcluded(state,recipe.id),recent:recent.has(recipe.id)}));
  }
  function weightedRandomIndex(state,key,type,onlyFavorites=false){
    const all=replacementOptions(state,key,type).filter(x=>!x.current&&!x.excluded&&(!onlyFavorites||x.favorite));if(!all.length)return null;
    const fresh=all.filter(x=>!x.recent);const options=fresh.length?fresh:all;const pool=[];
    options.forEach(x=>{const weight=x.favorite?3:1;for(let i=0;i<weight;i++)pool.push(x.index)});
    return pool[Math.floor(Math.random()*pool.length)];
  }
  function randomReplace(state,key,type,onlyFavorites=false){const index=weightedRandomIndex(state,key,type,onlyFavorites);if(index===null)return false;setRecipe(state,key,type,index);return true}
  function toggleEaten(state,key,type,person){if(!['ivan','wife'].includes(person))return;const d=ensureDay(state,key);d.eaten[type]=normalizeEatenValue(d.eaten[type]);d.eaten[type][person]=!d.eaten[type][person];Store.save(state)}
  function isEaten(state,key,type,person){const eaten=ensureDay(state,key).eaten[type];return Boolean(eaten&&eaten[person])}
  function eatenStatus(state,key,type){return{ivan:isEaten(state,key,type,'ivan'),wife:isEaten(state,key,type,'wife')}}
  function toggleFavorite(state,recipeId){state.favorites[recipeId]=!state.favorites[recipeId];Store.save(state)}
  function isFavorite(state,recipeId){return Boolean(state.favorites&&state.favorites[recipeId])}
  function toggleExcluded(state,recipeId){state.excluded[recipeId]=!state.excluded[recipeId];Store.save(state)}
  function isExcluded(state,recipeId){return Boolean(state.excluded&&state.excluded[recipeId])}
  function setAlcoholPlan(state,key,plan){const d=ensureDay(state,key);d.alcohol=true;d.alcoholPlan={type:plan.type||'unknown',ivan:Math.max(0,+plan.ivan||0),wife:Math.max(0,+plan.wife||0)};d.alcoholEaten=emptyEaten();Store.save(state)}
  function toggleAlcoholEaten(state,key,person){if(!['ivan','wife'].includes(person))return;const d=ensureDay(state,key);d.alcoholEaten=normalizeEatenValue(d.alcoholEaten);d.alcoholEaten[person]=!d.alcoholEaten[person];Store.save(state)}
  function disableAlcohol(state,key){const d=ensureDay(state,key);d.alcohol=false;d.alcoholEaten=emptyEaten();Store.save(state)}
  function alcoholInfo(state,key){
    const d=ensureDay(state,key);const plan=d.alcoholPlan||{type:'unknown',ivan:1,wife:1};const cfg=ALCOHOL[plan.type]||ALCOHOL.unknown;
    const kcal=plan.type==='unknown'?{ivan:500,wife:350}:{ivan:Math.round(cfg.kcal*plan.ivan),wife:Math.round(cfg.kcal*plan.wife)};
    return{...cfg,type:plan.type,counts:{ivan:plan.ivan,wife:plan.wife},kcal};
  }
  function alcoholHistory(state,key){
    const d=ensureDay(state,key);
    const info=alcoholInfo(state,key);
    const eaten=normalizeEatenValue(d.alcoholEaten);
    const person=(p)=>({
      planned:Boolean(d.alcohol)&&Number(info.counts[p])>0,
      consumed:Boolean(d.alcohol)&&Boolean(eaten[p]),
      count:Number(info.counts[p])||0,
      kcal:Boolean(d.alcohol)&&eaten[p]?info.kcal[p]:0
    });
    return{
      date:key,
      enabled:Boolean(d.alcohol),
      type:info.type,
      label:info.label,
      unit:info.unit,
      ivan:person('ivan'),
      wife:person('wife'),
      anyoneConsumed:Boolean(d.alcohol)&&(Boolean(eaten.ivan)||Boolean(eaten.wife))
    };
  }
  function resetDay(state,key){state.daysByDate[key]=dayDefaults(key);Store.save(state)}
  function rawMeals(state,key){const d=ensureDay(state,key);return slots.map(([type,label])=>({type,label,recipe:RECIPES[type][d[type]||0],eaten:eatenStatus(state,key,type)}))}
  function alcoholScales(state,key){
    const d=ensureDay(state,key);if(!d.alcohol)return{ivan:1,wife:1};
    const alcohol=alcoholInfo(state,key);const meals=rawMeals(state,key);const raw=meals.reduce((a,m)=>({ivan:a.ivan+m.recipe.kcal.ivan,wife:a.wife+m.recipe.kcal.wife}),{ivan:0,wife:0});
    const minFood={ivan:1100,wife:950};const target={ivan:targetFor(state,key,'ivan'),wife:targetFor(state,key,'wife')};
    const budget={ivan:Math.max(minFood.ivan,target.ivan-alcohol.kcal.ivan),wife:Math.max(minFood.wife,target.wife-alcohol.kcal.wife)};
    return{ivan:Math.min(1,budget.ivan/raw.ivan),wife:Math.min(1,budget.wife/raw.wife)};
  }
  function mealsFor(state,key){
    const d=ensureDay(state,key);const scales=alcoholScales(state,key);
    const meals=rawMeals(state,key).map(m=>({...m,scale:scales,kcal:{ivan:Math.round(m.recipe.kcal.ivan*scales.ivan),wife:Math.round(m.recipe.kcal.wife*scales.wife)}}));
    if(d.alcohol){const a=alcoholInfo(state,key);meals.push({type:'alcohol',label:'Алкогольный вечер',eaten:normalizeEatenValue(d.alcoholEaten),alcohol:true,kcal:a.kcal,recipe:{id:'alcohol-plan',name:a.label,kcal:a.kcal},alcoholInfo:a})}
    return meals;
  }
  function totals(state,key){return mealsFor(state,key).reduce((a,m)=>({ivan:a.ivan+m.kcal.ivan,wife:a.wife+m.kcal.wife}),{ivan:0,wife:0})}
  function eatenTotals(state,key){return mealsFor(state,key).reduce((a,m)=>({ivan:a.ivan+(m.eaten&&m.eaten.ivan?m.kcal.ivan:0),wife:a.wife+(m.eaten&&m.eaten.wife?m.kcal.wife:0)}),{ivan:0,wife:0})}

  return{days,slots,ALCOHOL,normalize,ensureDay,getDay,targetFor,localDateKey,weekDateKeys,dayLabel,formatDate,setRecipe,replacementOptions,randomReplace,toggleEaten,isEaten,eatenStatus,toggleFavorite,isFavorite,toggleExcluded,isExcluded,setAlcoholPlan,toggleAlcoholEaten,disableAlcohol,alcoholInfo,alcoholHistory,alcoholScales,resetDay,mealsFor,totals,eatenTotals,recentRecipeIds};
})();