(()=>{
  const STORAGE_KEY='foodPlanProfilesV1';
  const defaults={
    shared:{lossPercent:15,gainPercent:10},
    ivan:{name:'Иван',sex:'male',age:31,height:180,weight:102,targetWeight:null,activity:'sedentary',goal:'loss',calorieMode:'manual',manualTarget:1900,target:1900,body:{fat:null,muscle:null,water:null,visceral:null,scaleBmr:null}},
    wife:{name:'Настя',sex:'female',age:31,height:172,weight:72,targetWeight:null,activity:'sedentary',goal:'loss',calorieMode:'manual',manualTarget:1550,target:1550,body:{fat:null,muscle:null,water:null,visceral:null,scaleBmr:null}}
  };
  const activities={
    sedentary:{label:'Минимальная',description:'В основном сидячий день, тренировок мало',factor:1.2},
    light:{label:'Лёгкая',description:'Много ходьбы или 1–3 тренировки в неделю',factor:1.375},
    moderate:{label:'Средняя',description:'3–5 тренировок в неделю',factor:1.55},
    high:{label:'Высокая',description:'Интенсивные тренировки почти каждый день',factor:1.725}
  };
  function numberOr(value,fallback){const n=Number(value);return Number.isFinite(n)?n:fallback}
  function mergePerson(base,saved={}){return{...base,...saved,body:{...base.body,...(saved.body||{})}}}
  function load(){
    let saved={};try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY))||{}}catch(e){}
    return{shared:{...defaults.shared,...(saved.shared||{})},ivan:mergePerson(defaults.ivan,saved.ivan),wife:mergePerson(defaults.wife,saved.wife)};
  }
  const data=load();
  function bmr(person){
    const w=numberOr(person.weight,0),h=numberOr(person.height,0),a=numberOr(person.age,0);
    if(!w||!h||!a)return 0;
    return Math.round(10*w+6.25*h-5*a+(person.sex==='female'?-161:5));
  }
  function tdee(person){const base=bmr(person),activity=activities[person.activity]||activities.sedentary;return base?Math.round(base*activity.factor):0}
  function recommendations(person,shared=data.shared){
    const maintain=tdee(person);if(!maintain)return{loss:0,maintain:0,gain:0};
    const loss=Math.round(maintain*(1-numberOr(shared.lossPercent,15)/100)/10)*10;
    const gain=Math.round(maintain*(1+numberOr(shared.gainPercent,10)/100)/10)*10;
    return{loss,maintain:Math.round(maintain/10)*10,gain};
  }
  function effectiveTarget(person,shared=data.shared){
    if(person.calorieMode==='auto')return recommendations(person,shared)[person.goal]||numberOr(person.manualTarget,0);
    return Math.round(numberOr(person.manualTarget,person.target||0));
  }
  function refreshTargets(){['ivan','wife'].forEach(key=>{data[key].target=effectiveTarget(data[key],data.shared)})}
  function save(){refreshTargets();localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
  refreshTargets();
  window.PROFILE_DATA=data;
  window.PROFILE_CALCULATOR={STORAGE_KEY,activities,bmr,tdee,recommendations,effectiveTarget,save,refreshTargets};
  window.PROFILES={ivan:data.ivan,wife:data.wife};
})();