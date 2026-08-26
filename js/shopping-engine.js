(()=>{
  if(!window.MenuEngine||!window.ProductModel)return;
  const TYPES=['breakfast','snack','lunch','dinner'];
  function dateKey(d){return MenuEngine.localDateKey(d)}
  function addDays(key,n){const [y,m,d]=key.split('-').map(Number),x=new Date(y,m-1,d);x.setDate(x.getDate()+n);return dateKey(x)}
  function range(start,end){const out=[];for(let k=start;k<=end;k=addDays(k,1))out.push(k);return out}
  function period(type,custom={}){
    const today=dateKey(new Date());
    if(type==='today')return{start:today,end:today,keys:[today],label:'Сегодня'};
    if(type==='3days'){const end=addDays(today,2);return{start:today,end,keys:range(today,end),label:'3 дня'}};
    if(type==='week'){const keys=MenuEngine.weekDateKeys(new Date());return{start:keys[0],end:keys[6],keys,label:'Неделя'}};
    const start=custom.start||today,end=custom.end&&custom.end>=start?custom.end:start;return{start,end,keys:range(start,end),label:'Свой период'};
  }
  function productMeta(id,name,unit){const p=id?ProductModel.get(id):null;return{product:p,name:p?(p.brand?`${p.name} — ${p.brand}`:p.name):name||'Продукт',category:p?.category||'other',unit:p?.unit||unit||'г'}}
  function merge(map,id,name,unit,amount,source,key){
    if(!Number.isFinite(Number(amount))||Number(amount)<=0)return;
    const meta=productMeta(id,name,unit),mergeKey=id||`name:${meta.name.toLowerCase()}|${meta.unit}`;
    if(!map[mergeKey])map[mergeKey]={key:mergeKey,productId:id||null,...meta,amount:0,sources:new Set(),days:new Set()};
    map[mergeKey].amount+=Number(amount);map[mergeKey].sources.add(source);map[mergeKey].days.add(key);
  }
  function addSnapshotDay(map,state,key,snap){
    TYPES.forEach(type=>['ivan','wife'].forEach(person=>{const meal=snap?.people?.[person]?.meals?.[type];(meal?.ingredients||[]).forEach(i=>merge(map,i.productId,i.name,i.unit,i.amount,'adaptive',key))}));
  }
  function addLegacyDay(map,state,key){
    const day=MenuEngine.getDay(state,key);let any=false;
    TYPES.forEach(type=>{const r=(window.RECIPES?.[type]||[])[day[type]||0];if(!r)return;(r.ingredients||[]).forEach(i=>{const amount=Number(i.ivan||0)+Number(i.wife||0);if(amount>0){merge(map,i.productId||null,i.name,i.unit,amount,'legacy',key);any=true}})});return any;
  }
  function build(state,periodInfo){
    const map={},warnings=[],used=[];
    periodInfo.keys.forEach(key=>{
      const day=state.daysByDate?.[key]||null;let snap=day?.adaptivePlan||null;
      if(!snap&&key>=dateKey(new Date())&&MenuEngine.adaptiveSnapshotFor){try{snap=MenuEngine.adaptiveSnapshotFor(state,key)}catch(e){snap=null}}
      if(snap){addSnapshotDay(map,state,key,snap);used.push({key,source:'adaptive'});return}
      if(day&&addLegacyDay(map,state,key)){used.push({key,source:'legacy'});warnings.push(`${MenuEngine.formatDate(key)}: использованы старые сохранённые порции.`);return}
      warnings.push(`${MenuEngine.formatDate(key)}: нет надёжных данных о порциях, день пропущен.`);
    });
    const items=Object.values(map).map(x=>({...x,sources:[...x.sources],days:[...x.days]}));
    const groups={};items.forEach(i=>{(groups[i.category]||(groups[i.category]=[])).push(i)});Object.values(groups).forEach(a=>a.sort((x,y)=>x.name.localeCompare(y.name,'ru')));
    return{period:periodInfo,items,groups,warnings,used};
  }
  function formatAmount(amount,unit){const n=Number(amount)||0;if(unit==='г'&&n>=1000)return`${(n/1000).toFixed(n%1000?2:0).replace(/\.00$/,'').replace(/0$/,'')} кг`;if(unit==='мл'&&n>=1000)return`${(n/1000).toFixed(n%1000?2:0).replace(/\.00$/,'').replace(/0$/,'')} л`;if(unit==='шт')return`${Math.ceil(n)} шт.`;return`${Math.round(n)} ${unit}`}
  window.ShoppingEngine={period,build,formatAmount,addDays,range};
})();