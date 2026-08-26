(()=>{
  const CUSTOM_KEY='foodPlanCustomRecipesV1';
  const categoryLabels={breakfast:'Завтрак',lunch:'Обед',dinner:'Ужин',snack:'Перекус'};
  const roleLabels={protein:'Белковая основа',carb:'Регулятор / гарнир',vegetable:'Овощи / объём',fat:'Жиры / добавка',fixed:'Почти не менять'};

  const adaptiveTests={
    'oats-eggs':{
      basePerson:'ivan',
      ingredients:[
        {name:'Овсяные хлопья',amount:55,unit:'г',role:'carb',min:35,max:85,nutrition:{kcal:366,p:12.3,f:6.1,c:59.5}},
        {name:'Банан',amount:80,unit:'г',role:'carb',min:50,max:130,nutrition:{kcal:89,p:1.1,f:.3,c:22.8}},
        {name:'Яйца',amount:2,unit:'шт',role:'protein',min:1,max:3,nutrition:{kcal:72,p:6.3,f:4.8,c:.4},nutritionBasis:'unit'}
      ]
    },
    'chicken-rice':{
      basePerson:'ivan',
      ingredients:[
        {name:'Куриное филе',amount:180,unit:'г',role:'protein',min:150,max:230,nutrition:{kcal:110,p:23.1,f:1.2,c:0}},
        {name:'Рис сухой',amount:75,unit:'г',role:'carb',min:40,max:115,nutrition:{kcal:344,p:6.7,f:.7,c:78.9}},
        {name:'Овощи',amount:200,unit:'г',role:'vegetable',min:150,max:350,nutrition:{kcal:35,p:1.8,f:.3,c:6}},
        {name:'Масло',amount:5,unit:'г',role:'fat',min:0,max:12,nutrition:{kcal:899,p:0,f:99.9,c:0}}
      ]
    },
    'shawarma':{
      basePerson:'ivan',
      ingredients:[
        {name:'Куриное филе',amount:160,unit:'г',role:'protein',min:130,max:220,nutrition:{kcal:110,p:23.1,f:1.2,c:0}},
        {name:'Тонкий лаваш',amount:70,unit:'г',role:'carb',min:45,max:100,nutrition:{kcal:275,p:8.5,f:1.2,c:56}},
        {name:'Овощи',amount:180,unit:'г',role:'vegetable',min:150,max:300,nutrition:{kcal:30,p:1.5,f:.2,c:5.5}},
        {name:'Йогуртовый соус',amount:50,unit:'г',role:'fat',min:25,max:80,nutrition:{kcal:80,p:4,f:3,c:8}}
      ]
    },
    'yogurt-fruit':{
      basePerson:'ivan',
      ingredients:[
        {name:'Греческий йогурт 2%',amount:200,unit:'г',role:'protein',min:170,max:300,nutrition:{kcal:73,p:9.5,f:2,c:3.8}},
        {name:'Фрукт',amount:150,unit:'г',role:'carb',min:100,max:220,nutrition:{kcal:55,p:.6,f:.2,c:13}},
        {name:'Миндаль',amount:15,unit:'г',role:'fat',min:5,max:25,nutrition:{kcal:579,p:21.2,f:49.9,c:21.6}}
      ]
    }
  };

  function round1(v){return Math.round((Number(v)||0)*10)/10}
  function loadCustom(){try{const x=JSON.parse(localStorage.getItem(CUSTOM_KEY));return Array.isArray(x)?x:[]}catch(e){return[]}}
  let custom=loadCustom();
  function persist(){localStorage.setItem(CUSTOM_KEY,JSON.stringify(custom))}
  function builtinList(){
    const out=[];
    ['breakfast','lunch','dinner','snack'].forEach(category=>{
      (RECIPES[category]||[]).forEach(recipe=>{
        const adaptive=adaptiveTests[recipe.id];
        out.push({...recipe,category,source:'builtIn',adaptive:adaptive?{enabled:true,...adaptive}:{enabled:false}});
      });
    });
    return out;
  }
  function all({includeArchived=false}={}){return [...builtinList(),...custom.filter(x=>includeArchived||!x.archived)]}
  function get(id){return all({includeArchived:true}).find(r=>r.id===id)||null}
  function isCustom(id){return custom.some(x=>x.id===id)}
  function nutritionForIngredient(i){
    const amount=Math.max(0,Number(i.amount)||0),n=i.nutrition||{};
    const factor=i.nutritionBasis==='unit'?amount:amount/100;
    return {kcal:round1((n.kcal||0)*factor),p:round1((n.p||0)*factor),f:round1((n.f||0)*factor),c:round1((n.c||0)*factor)};
  }
  function totalNutrition(ingredients=[]){return ingredients.reduce((a,i)=>{const n=nutritionForIngredient(i);return{kcal:round1(a.kcal+n.kcal),p:round1(a.p+n.p),f:round1(a.f+n.f),c:round1(a.c+n.c)}},{kcal:0,p:0,f:0,c:0})}
  function adaptiveRange(recipe){
    if(!recipe?.adaptive?.enabled||!Array.isArray(recipe.adaptive.ingredients))return null;
    const calc=(which)=>totalNutrition(recipe.adaptive.ingredients.map(i=>({...i,amount:Number(i[which]??i.amount)}))).kcal;
    return{min:Math.round(calc('min')),base:Math.round(totalNutrition(recipe.adaptive.ingredients).kcal),max:Math.round(calc('max'))};
  }
  function validateDraft(d){
    const errors=[];
    if(!String(d.name||'').trim())errors.push('Укажи название блюда.');
    if(!categoryLabels[d.category])errors.push('Выбери категорию.');
    if(!Array.isArray(d.ingredients)||!d.ingredients.length)errors.push('Добавь хотя бы один ингредиент.');
    (d.ingredients||[]).forEach((i,index)=>{
      const p=`Ингредиент ${index+1}`;
      if(!String(i.name||'').trim())errors.push(`${p}: нет названия.`);
      if(!(Number(i.amount)>0))errors.push(`${p}: укажи количество.`);
      if(!(Number(i.nutrition?.kcal)>=0))errors.push(`${p}: укажи калорийность.`);
      if(!(Number(i.nutrition?.p)>=0&&Number(i.nutrition?.f)>=0&&Number(i.nutrition?.c)>=0))errors.push(`${p}: заполни БЖУ.`);
      if(!roleLabels[i.role])errors.push(`${p}: выбери роль.`);
      if(!(Number(i.min)>=0)||!(Number(i.max)>0)||Number(i.min)>Number(i.amount)||Number(i.max)<Number(i.amount))errors.push(`${p}: min ≤ базового количества ≤ max.`);
    });
    if(!Array.isArray(d.steps)||!d.steps.some(x=>String(x).trim()))errors.push('Добавь хотя бы один шаг приготовления.');
    return errors;
  }
  function normalizeDraft(d,existing=null){
    const ingredients=(d.ingredients||[]).map((i,idx)=>({
      id:i.id||`ing-${Date.now()}-${idx}-${Math.random().toString(36).slice(2,6)}`,
      name:String(i.name||'').trim(),amount:Number(i.amount)||0,unit:i.unit||'г',
      nutritionBasis:(i.unit==='шт'?'unit':'100'),
      nutrition:{kcal:Number(i.nutrition?.kcal)||0,p:Number(i.nutrition?.p)||0,f:Number(i.nutrition?.f)||0,c:Number(i.nutrition?.c)||0},
      role:i.role||'fixed',min:Number(i.min)||0,max:Number(i.max)||Number(i.amount)||0
    }));
    const total=totalNutrition(ingredients);
    return{
      id:existing?.id||`custom-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      source:'custom',category:d.category,name:String(d.name||'').trim(),time:String(d.time||'').trim()||'—',method:String(d.method||'').trim()||'—',
      ingredients,steps:(d.steps||[]).map(x=>String(x).trim()).filter(Boolean),
      baseNutrition:total,adaptive:{enabled:true,basePerson:'base',ingredients},archived:Boolean(existing?.archived),createdAt:existing?.createdAt||Date.now(),updatedAt:Date.now()
    };
  }
  function saveCustom(draft,id=null){
    const errors=validateDraft(draft);if(errors.length)return{ok:false,errors};
    const idx=id?custom.findIndex(x=>x.id===id):-1,existing=idx>=0?custom[idx]:null,next=normalizeDraft(draft,existing);
    if(idx>=0)custom[idx]=next;else custom.push(next);persist();return{ok:true,recipe:next};
  }
  function archive(id){const r=custom.find(x=>x.id===id);if(!r)return false;r.archived=true;r.updatedAt=Date.now();persist();return true}
  function restore(id){const r=custom.find(x=>x.id===id);if(!r)return false;r.archived=false;r.updatedAt=Date.now();persist();return true}
  function duplicate(id){const r=get(id);if(!r)return null;const draft={...r,name:`${r.name} — копия`,ingredients:(r.adaptive?.ingredients||r.ingredients||[]).map(x=>({...x,nutrition:{...(x.nutrition||{})}})),steps:[...(r.steps||[])]};return saveCustom(draft).recipe||null}

  window.RecipeModel={CUSTOM_KEY,categoryLabels,roleLabels,all,get,isCustom,totalNutrition,nutritionForIngredient,adaptiveRange,validateDraft,saveCustom,archive,restore,duplicate};
})();