(()=>{
  const ROLE_LABELS={protein:'Белковая основа',carb:'Гарнир / углеводы',vegetable:'Овощи / объём',fat:'Жиры / добавка',fixed:'Почти не менять'};
  const REDUCE_ORDER=['fat','carb','protein','vegetable','fixed'];
  const INCREASE_ORDER=['carb','protein','fat','vegetable','fixed'];
  const TOLERANCE_KCAL=8;

  function round1(v){return Math.round((Number(v)||0)*10)/10}
  function cloneIngredient(i){return {...i,nutrition:{...(i.nutrition||{})},amount:Number(i.amount)||0,min:Number(i.min??i.amount)||0,max:Number(i.max??i.amount)||0}}
  function kcalPerAmount(i){const kcal=Number(i.nutrition?.kcal)||0;return i.nutritionBasis==='unit'?kcal:kcal/100}
  function stepFor(i){if(i.nutritionBasis==='unit'||i.unit==='шт')return 1;if(i.role==='fat')return 1;if(i.role==='vegetable')return 10;return 5}
  function snap(v,step){return step===1?Math.round(v):Math.round(v/step)*step}
  function ingredientNutrition(i){const factor=i.nutritionBasis==='unit'?i.amount:i.amount/100,n=i.nutrition||{};return{kcal:round1((n.kcal||0)*factor),p:round1((n.p||0)*factor),f:round1((n.f||0)*factor),c:round1((n.c||0)*factor)}}
  function totalNutrition(items){return items.reduce((a,i)=>{const n=ingredientNutrition(i);a.kcal+=n.kcal;a.p+=n.p;a.f+=n.f;a.c+=n.c;return a},{kcal:0,p:0,f:0,c:0})}
  function roundedNutrition(items){const n=totalNutrition(items);return{kcal:Math.round(n.kcal),p:round1(n.p),f:round1(n.f),c:round1(n.c)}}
  function boundNutrition(base,which){return roundedNutrition(base.map(i=>({...i,amount:Number(i[which]??i.amount)})))}
  function candidates(items,role,direction){return items.filter(i=>i.role===role&&(direction<0?i.amount>i.min:i.amount<i.max)).sort((a,b)=>{
    const ka=kcalPerAmount(a)*stepFor(a),kb=kcalPerAmount(b)*stepFor(b);
    return direction<0?kb-ka:kb-ka;
  })}
  function moveIngredient(i,direction,remaining){
    const step=stepFor(i),per=kcalPerAmount(i);if(per<=0)return 0;
    const room=direction<0?i.amount-i.min:i.max-i.amount;if(room<=0)return 0;
    let amountByNeed=remaining/per;
    let move=Math.min(room,Math.max(step,snap(amountByNeed,step)));
    if(move>room)move=room;
    if(direction<0)i.amount=Math.max(i.min,i.amount-move);else i.amount=Math.min(i.max,i.amount+move);
    if(i.nutritionBasis==='unit'||i.unit==='шт')i.amount=Math.round(i.amount);
    else i.amount=round1(i.amount);
    return move*per;
  }
  function tune(items,target,order,direction){
    let total=totalNutrition(items).kcal;
    for(const role of order){
      let guard=0;
      while(guard++<200){
        const diff=target-total;if((direction<0&&diff>=-TOLERANCE_KCAL)||(direction>0&&diff<=TOLERANCE_KCAL))break;
        const list=candidates(items,role,direction);if(!list.length)break;
        let changed=false;
        for(const item of list){
          const before=item.amount;moveIngredient(item,direction,Math.abs(diff));if(item.amount!==before){changed=true;total=totalNutrition(items).kcal;break}
        }
        if(!changed)break;
      }
      total=totalNutrition(items).kcal;
      const diff=target-total;if(Math.abs(diff)<=TOLERANCE_KCAL)break;
    }
    return total;
  }
  function refine(items,target,direction){
    let best={items:items.map(cloneIngredient),diff:Math.abs(totalNutrition(items).kcal-target)};
    const order=direction<0?REDUCE_ORDER:INCREASE_ORDER;
    for(const role of order){
      for(const item of items.filter(x=>x.role===role&&x.unit!=='шт'&&x.nutritionBasis!=='unit')){
        const per=kcalPerAmount(item);if(per<=0)continue;
        const from=item.amount;
        for(let delta=-4;delta<=4;delta++){
          const candidate=Math.min(item.max,Math.max(item.min,round1(from+delta)));
          item.amount=candidate;
          const diff=Math.abs(totalNutrition(items).kcal-target);
          if(diff<best.diff){best={items:items.map(cloneIngredient),diff}}
        }
        item.amount=from;
      }
    }
    return best.items;
  }
  function calculate(recipeOrId,targetKcal,options={}){
    const recipe=typeof recipeOrId==='string'?window.RecipeModel?.get(recipeOrId):recipeOrId;
    const target=Math.round(Number(targetKcal)||0);
    if(!recipe)return{ok:false,error:'recipe-not-found'};
    if(!recipe.adaptive?.enabled||!Array.isArray(recipe.adaptive.ingredients)||!recipe.adaptive.ingredients.length)return{ok:false,error:'recipe-not-adaptive',recipeId:recipe.id};
    if(target<=0)return{ok:false,error:'invalid-target',recipeId:recipe.id};
    const base=recipe.adaptive.ingredients.map(cloneIngredient);
    const baseNutrition=roundedNutrition(base),minNutrition=boundNutrition(base,'min'),maxNutrition=boundNutrition(base,'max');
    const direction=target<baseNutrition.kcal?-1:target>baseNutrition.kcal?1:0;
    let items=base.map(cloneIngredient);
    if(direction)tune(items,target,direction<0?REDUCE_ORDER:INCREASE_ORDER,direction);
    items=refine(items,target,direction||1);
    const nutrition=roundedNutrition(items);
    const delta=nutrition.kcal-target;
    let status='ok';
    if(target<minNutrition.kcal-TOLERANCE_KCAL)status='below-range';
    else if(target>maxNutrition.kcal+TOLERANCE_KCAL)status='above-range';
    else if(Math.abs(delta)>TOLERANCE_KCAL)status='closest';
    const ingredients=items.map((i,idx)=>{const b=base[idx];return{productId:i.productId||null,name:i.name,unit:i.unit,role:i.role,roleLabel:ROLE_LABELS[i.role]||i.role,amount:round1(i.amount),baseAmount:round1(b.amount),min:round1(i.min),max:round1(i.max),changed:Math.abs(i.amount-b.amount)>.01,nutrition:ingredientNutrition(i)}});
    return{ok:true,recipeId:recipe.id,recipeName:recipe.name,targetKcal:target,status,tolerance:TOLERANCE_KCAL,baseNutrition,minNutrition,maxNutrition,nutrition,deltaKcal:delta,ingredients,proteinPreserved:ingredients.filter(i=>i.role==='protein').every(i=>i.amount>=i.baseAmount*.8),options:{...options}};
  }
  function explain(result){if(!result?.ok)return 'Не удалось рассчитать порцию.';if(result.status==='below-range')return `Для этого блюда ${result.targetKcal} ккал ниже разумного диапазона. Ближайшая нормальная порция — около ${result.nutrition.kcal} ккал.`;if(result.status==='above-range')return `Для этого блюда ${result.targetKcal} ккал выше разумного диапазона. Ближайшая нормальная порция — около ${result.nutrition.kcal} ккал.`;if(result.status==='closest')return `Получилась ближайшая удобная порция: ${result.nutrition.kcal} ккал вместо ${result.targetKcal}.`;return `Порция рассчитана примерно на ${result.nutrition.kcal} ккал.`}
  window.AdaptivePortionEngine={calculate,explain,totalNutrition,ingredientNutrition,ROLE_LABELS,TOLERANCE_KCAL};
})();