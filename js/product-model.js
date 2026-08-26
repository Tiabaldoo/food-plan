(()=>{
  const STORAGE_KEY='foodPlanCustomProductsV1';
  const categories={
    meat:'Мясо и птица',fish:'Рыба',eggs:'Яйца',dairy:'Молочные',grains:'Крупы и макароны',bread:'Хлеб и выпечка',vegetables:'Овощи',fruits:'Фрукты',fats:'Масла и жиры',nuts:'Орехи и семена',sauces:'Соусы',other:'Прочее'
  };
  const standard=[
    ['chicken-fillet','Куриное филе','meat','г',110,23.1,1.2,0,'protein'],
    ['turkey-fillet','Филе индейки','meat','г',112,24,1.5,0,'protein'],
    ['lean-beef','Говядина постная','meat','г',158,21.5,7.1,0,'protein'],
    ['chicken-thigh-skinless','Куриное бедро без кожи','meat','г',145,19,7.5,0,'protein'],
    ['lean-mince','Фарш нежирный','meat','г',170,20,10,0,'protein'],
    ['egg','Яйцо куриное','eggs','шт',72,6.3,4.8,.4,'protein','unit'],
    ['egg-white','Белок яичный','eggs','г',52,10.9,.2,.7,'protein'],
    ['rice-dry','Рис сухой','grains','г',344,6.7,.7,78.9,'carb'],
    ['buckwheat-dry','Гречка сухая','grains','г',343,13.3,3.4,71.5,'carb'],
    ['pasta-dry','Макароны из твёрдых сортов, сухие','grains','г',350,12,1.5,72,'carb'],
    ['oats','Овсяные хлопья','grains','г',366,12.3,6.1,59.5,'carb'],
    ['couscous-dry','Кускус сухой','grains','г',376,12.8,.6,77.4,'carb'],
    ['potato','Картофель','vegetables','г',77,2,.1,17,'carb'],
    ['sweet-potato','Батат','vegetables','г',86,1.6,.1,20.1,'carb'],
    ['tomato','Помидор','vegetables','г',18,.9,.2,3.9,'vegetable'],
    ['cucumber','Огурец','vegetables','г',15,.7,.1,3.1,'vegetable'],
    ['bell-pepper','Перец сладкий','vegetables','г',31,1,.3,6,'vegetable'],
    ['broccoli','Брокколи','vegetables','г',34,2.8,.4,6.6,'vegetable'],
    ['mixed-vegetables','Овощная смесь','vegetables','г',35,1.8,.3,6,'vegetable'],
    ['carrot','Морковь','vegetables','г',41,.9,.2,9.6,'vegetable'],
    ['banana','Банан','fruits','г',89,1.1,.3,22.8,'carb'],
    ['apple','Яблоко','fruits','г',52,.3,.2,13.8,'carb'],
    ['orange','Апельсин','fruits','г',47,.9,.1,11.8,'carb'],
    ['berries','Ягоды','fruits','г',50,1,.5,11,'carb'],
    ['greek-yogurt-2','Греческий йогурт 2%','dairy','г',73,9.5,2,3.8,'protein'],
    ['yogurt-natural','Йогурт натуральный','dairy','г',61,4.3,3,4.7,'protein'],
    ['milk-2-5','Молоко 2,5%','dairy','мл',52,2.8,2.5,4.7,'fixed'],
    ['cheese-light','Сыр 20–30%','dairy','г',270,28,17,2,'fat'],
    ['mozzarella-light','Моцарелла лёгкая','dairy','г',210,24,12,2,'protein'],
    ['wholegrain-bread','Хлеб цельнозерновой','bread','г',247,13,4.2,41,'carb'],
    ['lavash-thin','Лаваш тонкий','bread','г',275,8.5,1.2,56,'carb'],
    ['olive-oil','Масло оливковое','fats','г',899,0,99.9,0,'fat'],
    ['sunflower-oil','Масло подсолнечное','fats','г',899,0,99.9,0,'fat'],
    ['almond','Миндаль','nuts','г',579,21.2,49.9,21.6,'fat'],
    ['walnut','Грецкий орех','nuts','г',654,15.2,65.2,13.7,'fat'],
    ['peanut-butter','Арахисовая паста','nuts','г',588,25,50,20,'fat'],
    ['tomato-sauce','Томатный соус без сахара','sauces','г',35,1.5,.2,7,'vegetable'],
    ['yogurt-sauce','Йогуртовый соус','sauces','г',80,4,3,8,'fat'],
    ['honey','Мёд','other','г',304,.3,0,82.4,'carb']
  ].map(x=>({id:`std-${x[0]}`,name:x[1],category:x[2],unit:x[3],nutrition:{kcal:x[4],p:x[5],f:x[6],c:x[7]},defaultRole:x[8],nutritionBasis:x[9]||'100',source:'standard',brand:'',parentId:null,archived:false}));
  function load(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY));return Array.isArray(x)?x:[]}catch(e){return[]}}
  let custom=load();
  function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(custom))}
  function all({includeArchived=false}={}){return [...standard,...custom.filter(x=>includeArchived||!x.archived)]}
  function get(id){return all({includeArchived:true}).find(x=>x.id===id)||null}
  function search(text=''){const q=String(text).trim().toLowerCase();const list=all();if(!q)return list.slice(0,12);return list.filter(x=>`${x.name} ${x.brand||''}`.toLowerCase().includes(q)).sort((a,b)=>(a.source==='standard')-(b.source==='standard')).slice(0,12)}
  function validate(d){const e=[];if(!String(d.name||'').trim())e.push('Укажи название продукта.');if(!categories[d.category])e.push('Выбери категорию.');if(!['г','мл','шт'].includes(d.unit))e.push('Выбери единицу.');['kcal','p','f','c'].forEach(k=>{const n=Number(d.nutrition?.[k]);if(!Number.isFinite(n)||n<0)e.push(`Проверь значение ${k}.`)});return e}
  function save(d,id=null){const errors=validate(d);if(errors.length)return{ok:false,errors};const idx=id?custom.findIndex(x=>x.id===id):-1;const old=idx>=0?custom[idx]:null;const unit=d.unit||'г';const item={id:old?.id||`prd-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name:String(d.name).trim(),brand:String(d.brand||'').trim(),category:d.category,unit,nutritionBasis:unit==='шт'?'unit':'100',nutrition:{kcal:Number(d.nutrition.kcal),p:Number(d.nutrition.p),f:Number(d.nutrition.f),c:Number(d.nutrition.c)},defaultRole:d.defaultRole||'fixed',source:old?.source||'custom',parentId:d.parentId||old?.parentId||null,archived:false,createdAt:old?.createdAt||Date.now(),updatedAt:Date.now()};if(idx>=0)custom[idx]=item;else custom.push(item);persist();return{ok:true,product:item}}
  function createVariant(parentId,d={}){const p=get(parentId);if(!p)return null;return save({name:p.name,brand:d.brand||'',category:p.category,unit:p.unit,nutrition:{...p.nutrition},defaultRole:p.defaultRole,parentId:p.id,...d}).product||null}
  function archive(id){const x=custom.find(p=>p.id===id);if(!x)return false;x.archived=true;x.updatedAt=Date.now();persist();return true}
  window.ProductModel={STORAGE_KEY,categories,standard,all,get,search,validate,save,createVariant,archive};
})();