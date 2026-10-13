
  // ── Tomato teaching content, in English and 华语 ─────────────────────────────
  const tomatoStagesEn=[
    {name:'A tiny seed',short:'Seed',phase:'The beginning',icon:'seed',sub:'A flat, hairy seed. Inside, an embryo\ncurled around its food store.',change:'The tomato seed is small and flat, covered in fine hairs. Inside, a curled embryo lies next to the endosperm, its food store. The seed stays dormant until it takes up water.',observe:'Choose Seed, then Open seed. Notice how the embryo is curled inside a seed only a few millimetres across.',question:'Why do you think tomato seeds are so much smaller than bean seeds?'},
    {name:'The first root',short:'Young root',phase:'Root emergence',icon:'root',sub:'The seed swells. The radicle breaks\nthrough the coat and grows down.',change:'After water uptake, the radicle is the first part of the embryo to emerge. It turns downward in response to gravity and soon develops fine root hairs.',observe:'Use the cutaway to follow the young root from the seed. Look for the fuzz of root hairs just behind the tip.',question:'Why is it useful for the root to grow before the shoot?'},
    {name:'Breaking ground',short:'Germination',phase:'The hook',icon:'plant',sub:'A thin, hooked stem pulls the\ncotyledons up through the soil.',change:'The hypocotyl elongates in a tight hook. The hook leads the way through the soil, protecting the cotyledons, which are pulled up behind it — often still wearing the seed coat like a cap.',observe:'Focus on Seed and rotate. Trace the hypocotyl from the root to the hook, then down to the cotyledons still inside the seed coat.',question:'How does growing in a hook protect the young leaves?'},
    {name:'Seed leaves open',short:'Seedling',phase:'First light',icon:'leaf',sub:'The hook straightens. Two narrow\ncotyledons spread and turn green.',change:'In light, the hook straightens and the seed coat is shed. The two narrow cotyledons open, turn green and begin photosynthesis while the first true leaves form between them.',observe:'Compare the smooth, narrow cotyledons with the first true leaves beginning to appear at the tip of the stem.',question:'What job do cotyledons do before the true leaves are ready?'},
    {name:'True leaves',short:'True leaves',phase:'Young plant',icon:'leaf',sub:'Lobed, hairy true leaves appear.\nThe tomato scent begins.',change:'True leaves grow from the shoot tip. They are divided into leaflets and covered in glandular hairs that release the typical tomato smell and deter insects.',observe:'Focus on Leaf. Look at the leaflets and their veins. Real tomato leaves feel slightly sticky.',question:'How might sticky, scented hairs help a plant survive?'},
    {name:'Growing tall',short:'Growing',phase:'Vegetative growth',icon:'plant',sub:'Large compound leaves spiral\nup a hairy stem.',change:'The stem thickens and grows tall. Leaves are pinnately compound: pairs of large leaflets with small leaflets between them. The root system branches widely.',observe:'Count the leaflets on one compound leaf, including the tiny ones. Hide the soil to see how far the roots spread.',question:'Why might a large plant need many leaflets instead of one huge leaf?'},
    {name:'Flower trusses',short:'Flowering',phase:'Buzz pollination',icon:'flower',sub:'Clusters of yellow, star-shaped\nflowers nod from the stem.',change:'Flowers grow in clusters called trusses. Each has five or six reflexed yellow petals around a cone of fused anthers. Bees vibrate the flower to shake out the pollen.',observe:'Focus on Flower. Find the cone of anthers in the centre and the green sepals behind the petals.',question:'Why can shaking a flower help pollination?'},
    {name:'Ripe tomatoes',short:'Fruiting',phase:'The cycle continues',icon:'fruit',sub:'Ovaries swell into berries that\nripen from green to red.',change:'After fertilization, each ovary grows into a fruit — botanically a berry. Ripening starts at the blossom end: chlorophyll breaks down, red lycopene builds up and the fruit softens.',observe:'Choose Fruit, then Slice fruit. Find the jelly-filled locules and the seeds inside. Notice the green shoulders on fruits that are still ripening.',question:'How does the red colour help the plant spread its seeds?'}
  ];
  const tomatoStagesZh=[
    {name:'一颗小种子',short:'种子',phase:'生命的起点',sub:'扁平、有细毛的种子，\n胚卷曲在养分旁边。',change:'番茄种子小而扁平，表面长着细毛。种子里有卷曲的胚和储存养分的胚乳。种子吸水之前一直处于休眠状态。',observe:'选择「种子」，再点击「打开种子」。观察只有几毫米大的种子里，胚是如何卷曲的。',question:'你认为番茄种子为什么比菜豆种子小得多？'},
    {name:'第一条幼根',short:'长出幼根',phase:'胚根伸出',sub:'种子吸水膨胀，\n胚根突破种皮向下生长。',change:'种子吸水后，胚根最先长出。它受重力影响向下生长，并很快长出细小的根毛。',observe:'利用土壤剖面，从种子开始追踪幼根，寻找根尖后方毛茸茸的根毛。',question:'根比芽更早生长有什么好处？'},
    {name:'破土萌发',short:'萌发',phase:'弯钩出土',sub:'纤细的弯钩状幼茎，\n把子叶拉出土壤。',change:'下胚轴弯成紧密的钩状并不断伸长。弯钩在前方开路，保护后面的子叶；子叶被拉出土壤时，常常还戴着种皮，像一顶小帽子。',observe:'聚焦「种子」并旋转模型，从根部沿着下胚轴追踪到弯钩，再向下找到仍包在种皮里的子叶。',question:'以弯钩的形态生长，如何保护幼嫩的叶片？'},
    {name:'子叶展开',short:'幼苗',phase:'迎接阳光',sub:'弯钩伸直，两片狭长的\n子叶展开并变绿。',change:'见光后，弯钩伸直，种皮脱落。两片狭长的子叶展开、变绿并开始光合作用，第一片真叶在它们之间形成。',observe:'比较光滑狭长的子叶，与茎顶刚开始出现的第一片真叶。',question:'在真叶长好之前，子叶承担什么工作？'},
    {name:'长出真叶',short:'真叶',phase:'幼株生长',sub:'有裂片、带绒毛的真叶长出，\n开始散发番茄特有的气味。',change:'真叶从茎顶长出，分成多片小叶，并覆盖腺毛。腺毛会散发番茄特有的气味，帮助驱赶昆虫。',observe:'聚焦「叶」，观察小叶和叶脉。真实的番茄叶摸起来有点黏。',question:'黏黏的、带气味的绒毛如何帮助植物生存？'},
    {name:'植株长高',short:'生长',phase:'营养生长',sub:'大型复叶沿着\n多毛的茎螺旋排列。',change:'茎变粗并不断长高。叶是羽状复叶：成对的大小叶之间夹着细小的小叶。根系向四周大量分枝。',observe:'数一数一片复叶上有几片小叶，包括细小的那些。隐藏土壤，观察根系伸展的范围。',question:'为什么大型植物适合长很多小叶，而不是一片巨大的叶？'},
    {name:'花序开放',short:'开花',phase:'振动传粉',sub:'一簇簇黄色星形小花\n从茎上垂下。',change:'番茄花成簇生长，称为花序。每朵花有五至六片向后反卷的黄色花瓣，中央是由花药合生成的圆锥。蜜蜂振动花朵，把花粉抖落出来。',observe:'聚焦「花」，找到中央的花药圆锥，以及花瓣后方的绿色萼片。',question:'为什么摇动花朵有助于传粉？'},
    {name:'番茄成熟',short:'结果',phase:'生命循环延续',sub:'子房膨大成浆果，\n由绿逐渐转红。',change:'受精后，子房发育成果实，在植物学上属于浆果。成熟从果实底部开始：叶绿素分解，红色的番茄红素积累，果肉逐渐变软。',observe:'选择「果实」，再点击「切开果实」，寻找充满胶状物的子房室和里面的种子。留意尚未完全成熟的果实顶部仍带绿色。',question:'红色如何帮助植物传播种子？'}
  ];
  const tomatoAnatomyEn={
    seed:{title:'Tomato seed',focus:'seed',text:'A small, flat seed covered in fine silky hairs. The seed coat protects a curled embryo and its food store. Each ripe tomato can hold a hundred or more seeds.'},
    cotyledon:{title:'Cotyledons',focus:'seed',text:'Two narrow, smooth seed leaves. They are pulled out of the soil by the hypocotyl hook, shed the seed coat, then turn green and feed the seedling until true leaves take over.'},
    embryo:{title:'The embryo',focus:'seed',text:'The embryo lies curled inside the seed, wrapped around the endosperm. It already has a radicle, a hypocotyl and two tiny cotyledons.'},
    root:{title:'Primary root',focus:'root',text:'The primary root grows deep and branches widely. Tomato roots can also form from the stem, which is why gardeners sometimes plant tomatoes deeply.'},
    radicle:{title:'Radicle · the first root',focus:'root',text:'The radicle is the first structure to emerge from the seed. Its tip is protected by a root cap and grows downward in response to gravity.'},
    lateral:{title:'Lateral roots & root hairs',focus:'root',text:'Lateral roots branch from the primary root. Tiny root hairs greatly increase the surface for taking up water and mineral ions. The hairs are enlarged here to make them visible.'},
    hypocotyl:{title:'Hypocotyl hook',focus:'seed',text:'The hypocotyl is the stem below the cotyledons. It grows in a tight hook through the soil, then straightens in light. Tomato hypocotyls are often tinged purple by anthocyanin.'},
    stem:{title:'Hairy stem',focus:'whole',text:'The stem is covered with trichomes — some simple, some glandular. Glandular hairs release the familiar tomato smell and help protect the plant from insects.'},
    leaf:{title:'First true leaf',focus:'leaf',text:'The first true leaves are already divided into lobed leaflets. They are hairy and aromatic, unlike the smooth cotyledons below them.'},
    trifoliate:{title:'Compound leaf',focus:'leaf',text:'A mature tomato leaf is pinnately compound: a central rachis carries pairs of large leaflets, a terminal leaflet, and small leaflets in between.'},
    flower:{title:'Tomato flower',focus:'flower',text:'Five or six yellow petals fold back around a cone of fused anthers. Pollen is released through small pores when bees vibrate the flower — buzz pollination.'},
    fruit:{title:'Tomato fruit · a berry',focus:'fruit',text:'The fruit develops from the ovary. Its wall (pericarp) surrounds jelly-filled locules that hold the seeds. Use Slice fruit to see a cross-section.'},
    newseed:{title:'Seeds in the locules',focus:'fruit',text:'Seeds sit in a jelly inside each locule. The jelly contains substances that stop the seeds germinating inside the fruit. Dried seeds can start the life cycle again.'}
  };
  const tomatoAnatomyZh={
    seed:{title:'番茄种子',text:'小而扁平的种子，表面覆盖着细软的绒毛。种皮保护着卷曲的胚和养分。一个成熟的番茄里可能有一百多颗种子。'},
    cotyledon:{title:'子叶',text:'两片狭长光滑的子叶。它们被下胚轴弯钩拉出土壤，脱去种皮后变绿，在真叶长好之前为幼苗提供养分。'},
    embryo:{title:'胚',text:'胚卷曲在种子里，包围着胚乳。胚已经具有胚根、下胚轴和两片细小的子叶。'},
    root:{title:'主根',text:'主根向下深扎并大量分枝。番茄的茎也能长出根，所以园丁有时会把番茄苗种得深一些。'},
    radicle:{title:'胚根 · 第一条根',text:'胚根是最先伸出种子的结构。根尖由根冠保护，受重力影响向下生长。'},
    lateral:{title:'侧根与根毛',text:'侧根从主根上分枝长出。细小的根毛大大增加了吸收水和矿物离子的表面积。模型中的根毛经过放大，方便观察。'},
    hypocotyl:{title:'下胚轴弯钩',text:'下胚轴是子叶下方的茎。它以紧密的弯钩穿过土壤，见光后伸直。番茄的下胚轴常因花青素而带紫色。'},
    stem:{title:'多毛的茎',text:'茎上覆盖着表皮毛，有的是普通毛，有的是腺毛。腺毛散发熟悉的番茄气味，并帮助植物抵御昆虫。'},
    leaf:{title:'第一片真叶',text:'第一片真叶已经分裂成带裂片的小叶。它们多毛且有香味，与下方光滑的子叶不同。'},
    trifoliate:{title:'复叶',text:'成熟的番茄叶是羽状复叶：中央的叶轴上长着成对的大小叶、一片顶生小叶，以及夹在中间的细小小叶。'},
    flower:{title:'番茄花',text:'五至六片黄色花瓣向后反卷，围绕着由花药合生成的圆锥。蜜蜂振动花朵时，花粉从小孔中释放出来，这称为振动传粉。'},
    fruit:{title:'番茄果实 · 浆果',text:'果实由子房发育而来。果皮包围着充满胶状物的子房室，种子就在其中。点击「切开果实」可观察横切面。'},
    newseed:{title:'子房室里的种子',text:'种子藏在每个子房室的胶状物中。胶状物含有抑制种子在果实内萌发的物质。晒干的种子可以开始新的生命循环。'}
  };
  Object.assign(chineseText,{
    'Bean':'菜豆','Tomato':'番茄','Choose plant':'选择植物',
    'Bean plant (Phaseolus vulgaris)':'菜豆（Phaseolus vulgaris）','Tomato plant (Solanum lycopersicum)':'番茄（Solanum lycopersicum）',
    'Bean plant · Phaseolus vulgaris':'菜豆 · Phaseolus vulgaris','Tomato plant · Solanum lycopersicum':'番茄 · Solanum lycopersicum',
    'Viewing tools':'观察工具','More viewing tools':'更多观察工具',
    'Cinematic rendering':'电影级渲染','Cinematic rendering (C)':'电影级渲染（C）',
    'Cinematic rendering on · soft focus, glow and film grading':'已开启电影级渲染 · 柔焦、光晕与电影调色',
    'Cinematic rendering off · direct rendering':'已关闭电影级渲染 · 直接渲染',
    'Lighting mood':'光线氛围','Lighting mood · {mood}':'光线氛围 · {mood}','Light: {mood}':'光线：{mood}',
    'Daylight':'日光','Golden hour':'黄金时刻','Soft studio':'柔和影棚',
    'Water the plant':'给植物浇水','Watering · water soaks into the soil, where roots take it up':'正在浇水 · 水渗入土壤，被根系吸收',
    'Measure growth':'测量生长','Measure growth (M)':'测量生长（M）',
    'Growth ruler on · approximate classroom measurements':'已显示生长标尺 · 数值为课堂估算',
    'Save a snapshot':'保存截图','Save a snapshot (P)':'保存截图（P）','Snapshot saved':'截图已保存',
    'Height':'株高','Roots':'根深','Day ~{n}':'约第 {n} 天','{n} cm':'{n} 厘米',
    'Slice fruit':'切开果实','Join fruit':'合上果实','Slice fruit · inspect the seeds inside':'切开果实 · 观察里面的种子',
    'Sliced fruit view · jelly-filled locules hold the seeds':'果实剖面 · 胶状的子房室里藏着种子',
    'Tomatoes appear in the fruiting stage.':'进入结果阶段后即可观察番茄果实。',
    'The tomatoes are ripe · slice one to find the seeds of the next generation.':'番茄成熟了 · 切开一个，寻找下一代的种子。',
    'Tomato':'番茄','Hairy stem':'多毛的茎','Compound leaf':'复叶','Seeds inside':'种子',
    'Viewing tools':'观察工具',
    'In the top bar: lighting mood, watering, photosynthesis (O), microscope (Z), growth measurement (M), and snapshot (P). On small screens they sit behind the ⋯ button.':'位于顶部工具栏：光线氛围、浇水、光合作用（O）、显微镜（Z）、生长测量（M）和截图（P）。在小屏幕上，这些工具收在「⋯」按钮里。',
    'Educational representations of the common bean and the tomato, from seed to fruit. The models illustrate selected visible structures; they are not botanical scans or growth predictions.':'本教学模型展示菜豆和番茄从种子到结果的过程，以及部分可见结构。它们并非植物扫描结果，也不是生长预测。',
    'An offline, cinematic 3D plant life cycle for the classroom. Explore bean and tomato through eight stages: germination, roots, leaves, flowers, pods and fruit.':'离线的电影级三维植物生命循环教学模型。',
    'Seed → hook:':'种子 → 弯钩：',
    'focus on the seed during germination. Watch the thin hypocotyl form a hook and pull the cotyledons — still wearing the seed coat — out of the soil.':'在萌发阶段聚焦种子，观察纤细的下胚轴如何形成弯钩，把仍戴着种皮的子叶拉出土壤。',
    'Seedling:':'幼苗：',
    'compare the two narrow, smooth cotyledons with the first lobed true leaves above them.':'比较两片狭长光滑的子叶，与上方第一片带裂片的真叶。',
    'Compound leaves:':'复叶：',
    'count the leaflets on one large leaf, including the tiny leaflets between the big pairs.':'数一数一片大叶上的小叶，包括夹在大小叶之间的细小小叶。',
    'Flowers → fruit:':'花 → 果实：',
    'focus on a flower truss, advance to ripe fruit, then slice a tomato open. Find the locules, the jelly and the seeds.':'聚焦花序，推进到果实成熟，再切开一个番茄，找出子房室、胶状物和种子。',
    'This model represents the tomato (':'本模型以番茄（',
    '), a flowering dicot with epigeal germination. Its tiny seed lifts two narrow cotyledons above the soil, often still capped by the seed coat. Tomato leaves are pinnately compound and hairy, the flowers are yellow and buzz-pollinated, and the fruit is a berry with seeds in jelly-filled locules.':'）为例。番茄是双子叶开花植物，萌发时子叶出土；两片狭长的子叶被带出土壤时，常常还戴着种皮。番茄叶是多毛的羽状复叶，黄色的花依靠振动传粉，果实是浆果，种子藏在充满胶状物的子房室里。',
    'Slicing the fruit is a teaching view. Transitions are compressed, fruit and leaves are enlarged for observation, and the stages do not represent equal periods of time. Measurements are approximate classroom estimates, not growth predictions.':'切开果实是教学用的剖面视图。生长过程经过时间压缩，果实和叶片为便于观察而放大；各阶段持续时间并不相等。测量数值是课堂估算，并非生长预测。'
  });
  // Stage and anatomy objects stay the same references; their content follows species and language.
  const speciesText={
    bean:{stagesEn:stages.map(s=>({...s})),stagesZh:chineseStages,anatomyEn:Object.fromEntries(Object.entries(anatomy).map(([k,v])=>[k,{...v}])),anatomyZh:chineseAnatomy},
    tomato:{stagesEn:tomatoStagesEn,stagesZh:tomatoStagesZh,anatomyEn:tomatoAnatomyEn,anatomyZh:tomatoAnatomyZh}
  };
  let activeKind='bean';
  function localizeSpecies(){
    const d=speciesText[activeKind];
    stages.forEach((stage,i)=>{for(const k of Object.keys(stage))delete stage[k];Object.assign(stage,d.stagesEn[i],language==='zh'?d.stagesZh[i]:{});});
    for(const k of Object.keys(anatomy))delete anatomy[k];
    for(const [k,v] of Object.entries(d.anatomyEn))anatomy[k]=Object.assign({},v,language==='zh'?d.anatomyZh[k]:{});
  }

  let language='en',savedLanguage='en',refreshLocalizedScene=()=>{};
  try{if(localStorage.getItem('plant-growth-lab-language')==='zh')savedLanguage='zh';}catch(e){}
  function tr(source,values={}){
    const translated=language==='zh'?(chineseText[source]??source):source;
    return translated.replace(/\{(\w+)\}/g,(_,key)=>{
      const value=values[key]??'';
      return typeof value==='string'&&language==='zh'?(chineseText[value]??value):String(value);
    });
  }
  const staticLanguageNodes=[],staticLanguageAttributes=[];
  function captureStaticLanguage(){
    const dynamic='.stage-button,.license-text,[data-language],#stagePhase,#stageTitle,#stageSubtitle,#changeText,#observeText,#questionText,#timelineStatus,#toast,#labels,#measureLayer,#fxLayer,#microscope';
    for(const root of [document.querySelector('main'),$('guideDialog'),$('aboutDialog')]){
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      let node;
      while((node=walker.nextNode())){
        if(node.parentElement?.closest(dynamic))continue;
        const original=node.nodeValue,key=original.trim();
        if(Object.prototype.hasOwnProperty.call(chineseText,key))staticLanguageNodes.push({node,original,key});
      }
      for(const element of [root,...root.querySelectorAll('[title],[aria-label]')]){
        if(element.closest('.stage-button,[data-language]'))continue;
        for(const name of ['title','aria-label']){
          const original=element.getAttribute(name);
          if(original&&Object.prototype.hasOwnProperty.call(chineseText,original))staticLanguageAttributes.push({element,name,original});
        }
      }
    }
  }
  function renderStageButtons(){
    $('stages').innerHTML=stages.map((s,i)=>`<button class="stage-button${i===Math.max(0,selectedStage)?' active':''}" data-stage="${i}" aria-pressed="${i===Math.max(0,selectedStage)}"><span class="stage-top">${icon(s.icon)}</span><span class="name"></span></button>`).join('');
    document.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>chooseStageHandler(Number(b.dataset.stage))));
    labelStageButtons();
  }
  function labelStageButtons(){
    document.querySelectorAll('[data-stage]').forEach(b=>{const index=Number(b.dataset.stage),stage=stages[index];b.querySelector('.name').textContent=stage.short;b.title=`${index+1}. ${stage.name}`;b.setAttribute('aria-label',tr('Stage {n}: {name}',{n:index+1,name:stage.name}));b.querySelector('.stage-top').innerHTML=icon(stage.icon);});
  }
  function setLanguage(next){
    language=next==='zh'?'zh':'en';
    localizeSpecies();
    for(const record of staticLanguageNodes){if(record.node.isConnected)record.node.nodeValue=record.original.replace(record.key,tr(record.key));}
    for(const record of staticLanguageAttributes)record.element.setAttribute(record.name,tr(record.original));
    document.documentElement.lang=language==='zh'?'zh-Hans':'en';
    document.title=tr('Plant Growth Lab — a life in eight stages');
    document.querySelectorAll('[data-language]').forEach(b=>{const active=b.dataset.language===language;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    labelStageButtons();
    const current=Math.max(0,selectedStage);selectedStage=-1;updateStageText(current);
    $('growthSlider').setAttribute('aria-valuetext',tr('Stage {n} of 8: {name}',{n:current+1,name:stages[current].name}));
    if($('errorMessage').dataset.source)$('errorMessage').textContent=tr($('errorMessage').dataset.source);
    refreshLocalizedScene();
    try{localStorage.setItem('plant-growth-lab-language',language);}catch(e){}
  }

  // Teaching copy lives in the guide, leaving the model itself edge to edge.
  $('guideDialog').insertBefore($('stageNotesTemplate').content,$('guideDialog').querySelector('h3'));
  let selectedStage=-1,chooseStageHandler=()=>{};
  function updateStageText(index){
    if(index===selectedStage)return;
    selectedStage=index;
    const s=stages[index];
    $('stageCounter').textContent=`0${index+1} / 08`;
    $('stagePhase').textContent=s.phase;
    $('stageTitle').textContent=s.name;
    $('stageSubtitle').textContent=s.sub;
    $('stageSubtitle').style.whiteSpace='pre-line';
    $('changeText').textContent=s.change;
    $('observeText').textContent=s.observe;
    $('questionText').textContent=s.question;
    document.querySelectorAll('[data-stage]').forEach(b=>{
      const n=Number(b.dataset.stage);
      b.classList.toggle('active',n===index);
      b.classList.toggle('completed',n<index);
      b.setAttribute('aria-pressed',String(n===index));
      if(n===index&&b.parentElement.scrollWidth>b.parentElement.clientWidth){
        b.parentElement.scrollLeft=Math.max(0,b.offsetLeft-(b.parentElement.clientWidth-b.offsetWidth)/2);
      }
    });
  }
  localizeSpecies();
  renderStageButtons();
  updateStageText(0);
  captureStaticLanguage();
  document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.language)));
  setLanguage(savedLanguage);

  function showDialog(id){const d=$(id);if(!d.open)d.showModal();}
  $('guideButton').addEventListener('click',()=>showDialog('guideDialog'));
  $('aboutButton').addEventListener('click',()=>showDialog('aboutDialog'));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  $('reloadButton').addEventListener('click',()=>location.reload());

  function failScene(message){
    $('sceneError').hidden=false;
    if(message){$('errorMessage').dataset.source=message;$('errorMessage').textContent=tr(message);}
    document.querySelectorAll('.viewport button,.sequence button,.sequence input,.sequence select').forEach(b=>{if(b.id!=='reloadButton'&&!b.dataset.language)b.disabled=true;});
  }
  if(!window.THREE){failScene('The embedded 3D library could not load. Please download a fresh copy of the complete HTML file.');return;}
