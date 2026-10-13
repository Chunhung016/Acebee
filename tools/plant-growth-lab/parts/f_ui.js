
  // ══════════════════════════════════════════════════════════════════════════
  //  State, rigs, navigation, labels, controls, tools and the render loop
  // ══════════════════════════════════════════════════════════════════════════
  let growth=0,targetGrowth=0,seedOpen=false,podOpen=false,seedOpenValue=0,podOpenValue=0,growthTransition=null;
  const seedSpring={value:0,velocity:0},podSpring={value:0,velocity:0};
  let soilMode='cutaway',labelsVisible=false,autoOrbit=false,playing=false,playback=null,measureOn=false;
  let reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('motionCheckbox').checked=reducedMotion;
  let focusMode='whole',followFocus=true,fitCamera=true;
  let width=1,height=1,sceneTop=76,sceneBottom=1,ready=false,disposed=false;

  const rigs={bean:buildBean(),tomato:buildTomato()};
  let rig=rigs.bean,inspectedFruit=null,scrollMode='move';
  applyMood('day');
  const cameraState={theta:.46,phi:1.15,radius:8.3,wantedTheta:.46,wantedPhi:1.15,wantedRadius:8.3,target:V(0,-1,0),wantedTarget:V(0,-1,0)};
  function aimCamera(angle){cameraState.wantedTheta=cameraState.theta+Math.atan2(Math.sin(angle-cameraState.theta),Math.cos(angle-cameraState.theta));}
  function available(part,g=growth){return rig.available(part,g);}
  function worldAnchor(name){const a=rig.anchors[name];return a?a.getWorldPosition(V()):V();}
  function fitDistance(verticalSpan,horizontalSpan){
    const tangent=Math.tan(camera.fov*Math.PI/360),usableHeight=Math.max(.2,(sceneBottom-sceneTop)/height),usableWidth=Math.max(.65,(width-(width<600?54:100))/width);
    return Math.max(verticalSpan/(2*tangent*usableHeight),horizontalSpan/(2*tangent*Math.max(.3,camera.aspect)*usableWidth));
  }
  function trulyVisible(object){let o=object;while(o){if(!o.visible)return false;o=o.parent;}return true;}
  function fruitBounds(fruit){
    if(!fruit||!trulyVisible(fruit.group))return null;
    rig.model.updateMatrixWorld(true);
    const box=new T.Box3().setFromObject(fruit.group,true);
    if(box.isEmpty())return null;
    const size=box.getSize(V()),center=box.getCenter(V());
    if(Math.max(size.x,size.y,size.z)<.004)return null;
    return {center,size,radius:size.length()*.5};
  }
  function fruitFromObject(object){
    for(const fruit of rig.fruits){let node=object;while(node){if(node===fruit.group)return fruit;node=node.parent;}}
    return null;
  }
  function selectVisibleFruit(){
    let best=null,bestScore=Infinity;
    for(const fruit of rig.fruits){
      const bounds=fruitBounds(fruit);if(!bounds)continue;
      const projected=bounds.center.clone().project(camera);
      const score=projected.x*projected.x+projected.y*projected.y+(projected.z>1?10:0)-Math.min(.3,bounds.radius);
      if(score<bestScore){bestScore=score;best=fruit;}
    }return best;
  }
  function minimumZoom(){const bounds=focusMode==='fruit'&&inspectedFruit?fruitBounds(inspectedFruit):null;return bounds?Math.max(.035,bounds.radius*1.06+.008):.12;}
  function focusView(part){
    {let w=null;try{w=whatIfView(part);}catch(e){}if(w)return w;}
    const p=rig.params;
    let center,verticalSpan,horizontalSpan;
    if(part==='seed'){
      center=worldAnchor('seed');const [vs,hs]=rig.seedSpan(growth);verticalSpan=vs;horizontalSpan=seedOpenValue>.2?hs*1.4:hs;
    }else if(part==='root'){
      center=rig.model.localToWorld(p.J.clone()).add(V(-.06,-p.rootLength*.5,0));verticalSpan=Math.max(1.6,p.rootLength+1.12);horizontalSpan=Math.max(1.65,Math.min(3.45,p.rootLength+1));
    }else if(part==='leaf'){
      center=worldAnchor(growth>(rig.kind==='bean'?3.65:4.2)?'trifoliate':'leaf');verticalSpan=2.2;horizontalSpan=2.8;
    }else if(part==='flower'){
      center=worldAnchor('flower');verticalSpan=1.1;horizontalSpan=1.25;
    }else if(part==='fruit'){
      if(!inspectedFruit||!fruitBounds(inspectedFruit))inspectedFruit=selectVisibleFruit();
      const bounds=fruitBounds(inspectedFruit);
      if(bounds){center=bounds.center;verticalSpan=Math.max(.08,Math.max(bounds.size.y,bounds.size.z)*1.55);horizontalSpan=Math.max(.08,Math.max(bounds.size.x,bounds.size.z)*1.55);}
      else{center=worldAnchor('fruit');verticalSpan=1.3;horizontalSpan=1.3;}
    }else{
      const top=Math.max(.5,p.height+(growth>2.5?.65:0));
      center=V(0,(top-3.12)/2,0);verticalSpan=top+3.12+1.25;horizontalSpan=growth>2.5?4.9:4.7;
    }
    return {center,distance:fitDistance(verticalSpan,horizontalSpan)};
  }
  function syncScrollMode(){document.querySelectorAll('[data-scroll-mode]').forEach(b=>{const active=b.dataset.scrollMode===scrollMode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
  function setScrollMode(mode){
    scrollMode=mode==='zoom'?'zoom':'move';
    if(scrollMode==='move'&&inspectedFruit){inspectedFruit=null;followFocus=false;fitCamera=false;focusMode='whole';syncFocusButtons();}
    syncScrollMode();
  }
  function syncFocusButtons(){
    document.querySelectorAll('[data-focus]').forEach(b=>{
      const on=available(b.dataset.focus);b.disabled=!on;b.classList.toggle('active',b.dataset.focus===focusMode&&followFocus);b.setAttribute('aria-pressed',String(b.dataset.focus===focusMode&&followFocus));
      b.title=on?tr(`Focus on ${b.dataset.focus==='whole'?'the whole plant':b.dataset.focus}`):tr({seed:'The original seed is visible during the first five stages.',root:'A root becomes visible after germination begins.',leaf:'True leaves appear in the first-leaves stage.',flower:'Flowers appear in the flowering stage.',fruit:rig.kind==='bean'?'Pods appear in the fruiting stage.':'Tomatoes appear in the fruiting stage.'}[b.dataset.focus]||'');
    });
  }
  function focusOn(part,showMessage=false){
    if(!available(part))return;
    if(part==='fruit'){if(!inspectedFruit)inspectedFruit=selectVisibleFruit();scrollMode='zoom';syncScrollMode();}
    else inspectedFruit=null;
    focusMode=part;followFocus=true;fitCamera=true;
    if(part==='flower')aimCamera(rig.flowerAngle(growth));
    else if(part==='fruit'&&inspectedFruit){
      const bounds=fruitBounds(inspectedFruit),origin=rig.model.localToWorld(rig.params.J.clone());
      if(bounds){const outward=bounds.center.clone().sub(origin);if(outward.x*outward.x+outward.z*outward.z>.004)aimCamera(Math.atan2(outward.x,outward.z));}
    }
    else if(part!=='fruit')aimCamera(.34);
    cameraState.wantedPhi=part==='whole'?1.15:part==='leaf'?1.0:part==='fruit'?1.3:part==='flower'?1.55:1.43;
    syncFocusButtons();
    if(showMessage)toast(part==='whole'?'Whole plant view':part==='fruit'?'Fruit close-up · scroll to zoom; use ↑ / ↓ to move along the plant.':'{part} in focus · drag to explore',{part:part[0].toUpperCase()+part.slice(1)});
  }
  function inspectFruit(fruit,showMessage=false){if(!fruitBounds(fruit))return false;inspectedFruit=fruit;focusOn('fruit',showMessage);return true;}
  function resetCamera(){inspectedFruit=null;scrollMode='move';syncScrollMode();focusOn('whole');aimCamera(.46);cameraState.wantedPhi=1.15;toast('View reset · current growth stage preserved');}
  function moveCamera(dt){
    if(focusMode!=='fruit')inspectedFruit=null;
    if(followFocus){const view=focusView(focusMode);cameraState.wantedTarget.copy(view.center);if(fitCamera)cameraState.wantedRadius=clamp(view.distance,minimumZoom(),34);}
    if(inspectedFruit)cameraState.wantedRadius=Math.max(minimumZoom(),cameraState.wantedRadius);
    if(autoOrbit&&!reducedMotion&&pointers.size===0)cameraState.wantedTheta+=dt*.11;
    const a=reducedMotion?1:1-Math.exp(-dt*6);
    cameraState.theta=mix(cameraState.theta,cameraState.wantedTheta,a);cameraState.phi=mix(cameraState.phi,cameraState.wantedPhi,a);cameraState.radius=mix(cameraState.radius,cameraState.wantedRadius,a);cameraState.target.lerp(cameraState.wantedTarget,a);
    // a barely perceptible cinematic drift keeps the frame alive
    const drift=post.enabled&&!reducedMotion&&pointers.size===0?1:0,tt=ambientTime;
    const th=cameraState.theta+drift*.012*Math.sin(tt*.13),ph=cameraState.phi+drift*.006*Math.sin(tt*.17+1);
    const s=Math.sin(ph),c=Math.cos(ph);
    camera.position.set(cameraState.target.x+cameraState.radius*s*Math.sin(th),cameraState.target.y+cameraState.radius*c,cameraState.target.z+cameraState.radius*s*Math.cos(th));
    const near=clamp(cameraState.radius*.015,.001,.025);
    if(Math.abs(camera.near-near)>.0001){camera.near=near;camera.updateProjectionMatrix();}
    camera.lookAt(cameraState.target);camera.updateMatrixWorld();
  }
  function zoom(factor){fitCamera=false;cameraState.wantedRadius=clamp(cameraState.wantedRadius*factor,minimumZoom(),34);}
  function moveVertical(amount){
    inspectedFruit=null;followFocus=false;fitCamera=false;focusMode='whole';scrollMode='move';
    cameraState.wantedTarget.y=clamp(cameraState.wantedTarget.y+amount,-3.5,Math.max(.65,rig.params.height+.9));
    syncFocusButtons();syncScrollMode();
  }
  function pan(dx,dy){
    if(Math.hypot(dx,dy)<.4)return;
    inspectedFruit=null;followFocus=false;fitCamera=false;
    const scale=2*cameraState.radius*Math.tan(camera.fov*Math.PI/360)/height;
    const right=V().setFromMatrixColumn(camera.matrixWorld,0),up=V().setFromMatrixColumn(camera.matrixWorld,1);
    cameraState.wantedTarget.addScaledVector(right,-dx*scale).addScaledVector(up,dy*scale);
    cameraState.wantedTarget.x=clamp(cameraState.wantedTarget.x,-9,9);cameraState.wantedTarget.y=clamp(cameraState.wantedTarget.y,-3.5,Math.max(.65,rig.params.height+.9));cameraState.wantedTarget.z=clamp(cameraState.wantedTarget.z,-9,9);
    syncFocusButtons();
  }
  function handleNavigationWheel(e){
    e.preventDefault();
    const delta=clamp(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?height:1),-240,240);
    if(!delta)return;
    if(e.shiftKey){moveVertical(-delta*Math.max(1.4,cameraState.wantedRadius)*.0011);return;}
    const hit=pick(e.clientX,e.clientY),fruit=hit?fruitFromObject(hit.object):null;
    if(!e.ctrlKey&&delta<0&&fruit&&fruit!==inspectedFruit){if(inspectFruit(fruit,true))return;}
    if(scrollMode==='zoom'||inspectedFruit||e.ctrlKey||e.altKey)zoom(Math.exp(delta*(e.ctrlKey?.006:.0018)));
    else moveVertical(-delta*Math.max(1.4,cameraState.wantedRadius)*.0011);
  }
  document.querySelectorAll('[data-scroll-mode]').forEach(b=>b.addEventListener('click',()=>setScrollMode(b.dataset.scrollMode)));
  $('moveUp').addEventListener('click',()=>moveVertical(Math.max(.16,cameraState.wantedRadius*.075)));
  $('moveDown').addEventListener('click',()=>moveVertical(-Math.max(.16,cameraState.wantedRadius*.075)));

  const microState={picking:false,open:false,onPick:null,close:null};
  const pointers=new Map();let dragDistance=0,multiGesture=null,lastHover=0;
  function gestureState(){const p=[...pointers.values()];return {distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2};}
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0&&e.button!==2)return;
    canvas.focus({preventScroll:true});pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,button:e.button});canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');
    if(pointers.size===1)dragDistance=0;
    if(pointers.size===2){multiGesture=gestureState();dragDistance=20;}
  });
  canvas.addEventListener('pointermove',e=>{
    const prev=pointers.get(e.pointerId);
    if(!prev){if(e.pointerType==='mouse'&&performance.now()-lastHover>100){lastHover=performance.now();const hit=pick(e.clientX,e.clientY);canvas.style.cursor=hit?(microState.picking?'zoom-in':'pointer'):'grab';canvas.title=hit?tr('{name} — click to inspect',{name:anatomy[hit.part].title}):'';}return;}
    const dx=e.clientX-prev.x,dy=e.clientY-prev.y;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,button:prev.button});
    dragDistance+=Math.abs(dx)+Math.abs(dy);
    if(pointers.size>=2){const next=gestureState();if(multiGesture){zoom(multiGesture.distance/Math.max(4,next.distance));if(!inspectedFruit)pan(next.x-multiGesture.x,next.y-multiGesture.y);}multiGesture=next;}
    else if(e.shiftKey||prev.button===2)pan(dx,dy);
    else{cameraState.wantedTheta-=dx*.006;cameraState.wantedPhi=clamp(cameraState.wantedPhi-dy*.006,.12,Math.PI-.12);}
  });
  function finishPointer(e){
    if(!pointers.has(e.pointerId))return;
    const isClick=e.type==='pointerup'&&dragDistance<6&&pointers.size===1&&pointers.get(e.pointerId).button===0;
    pointers.delete(e.pointerId);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    multiGesture=pointers.size>=2?gestureState():null;
    if(pointers.size===0)canvas.classList.remove('dragging');
    if(isClick){const hit=pick(e.clientX,e.clientY);if(microState.picking&&microState.onPick){microState.onPick(hit,e);return;}if(hit)showDetail(hit.part,hit.object);else closeDetail();}
  }
  canvas.addEventListener('pointerup',finishPointer);canvas.addEventListener('pointercancel',finishPointer);
  canvas.addEventListener('lostpointercapture',e=>{pointers.delete(e.pointerId);if(!pointers.size)canvas.classList.remove('dragging');});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('wheel',handleNavigationWheel,{passive:false});

  const raycaster=new T.Raycaster(),mouse=new T.Vector2();
  function pick(x,y){
    if(!ready)return null;const rect=canvas.getBoundingClientRect();mouse.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);
    const hits=raycaster.intersectObjects(pickables.filter(trulyVisible),false);
    for(const hit of hits){
      if(soilMode==='cutaway'&&hit.point.y<0&&hit.point.z<-.143){const direction=camera.position.clone().sub(hit.point).normalize();if(direction.z<.04)continue;}
      const part=hit.object.userData.part;if(anatomy[part])return {part,point:hit.point,object:hit.object};
    }return null;
  }
  let detailPart=null,detailOpener=null;
  function showDetail(part,object=null){const data=anatomy[part];if(!data)return;const fruit=object?fruitFromObject(object):null;if(fruit)inspectFruit(fruit);detailOpener=document.activeElement;detailPart=part;$('detailTitle').textContent=data.title;$('detailText').textContent=data.text;$('detailPopover').hidden=false;$('detailFocus').disabled=!available(data.focus);}
  function closeDetail(returnFocus=false){$('detailPopover').hidden=true;detailPart=null;if(returnFocus&&detailOpener?.isConnected)detailOpener.focus({preventScroll:true});}
  $('closeDetail').addEventListener('click',()=>closeDetail(true));
  $('detailFocus').addEventListener('click',()=>{if(detailPart&&anatomy[detailPart])focusOn(anatomy[detailPart].focus);closeDetail();});

  // Projected labels remain attached to actual points in the 3D model (one set per plant).
  for(const r of Object.values(rigs)){
    r.labels=r.labelSpecs.map(spec=>{
      const line=document.createElement('span');line.className='leader';line.setAttribute('aria-hidden','true');line.hidden=true;$('labels').appendChild(line);
      const button=document.createElement('button');button.className=`label ${spec.class||''}`;button.hidden=true;button.addEventListener('click',()=>showDetail(spec.key));$('labels').appendChild(button);
      return {...spec,line,button};
    });
  }
  function labelText(){for(const r of Object.values(rigs))for(const l of r.labels){l.button.textContent=tr(l.text);l.button.setAttribute('aria-label',tr('Learn about {name}',{name:l.text}));}}
  function updateLabels(){
    const placed=[];
    for(const r of Object.values(rigs))for(const label of r.labels){
      if(r!==rig||!labelsVisible||!label.visible(growth)){label.button.hidden=true;label.line.hidden=true;continue;}
      const world=worldAnchor(label.key),projected=world.clone().project(camera);
      if(projected.z<-1||projected.z>1||Math.abs(projected.x)>1.15||Math.abs(projected.y)>1.05){label.button.hidden=true;label.line.hidden=true;continue;}
      const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height;
      label.button.hidden=false;const w=label.button.offsetWidth||85,h=label.button.offsetHeight||24;
      const dx=width<600?label.dx*.72:label.dx;
      let bx=clamp(x+dx,w*.5+10,width-w*.5-52),by=clamp(y+label.dy,sceneTop,sceneBottom-8);
      for(let pass=0;pass<7;pass++){
        const collision=placed.find(p=>Math.abs(p.x-bx)<(p.w+w)/2+7&&Math.abs(p.y-by)<(p.h+h)/2+5);
        if(!collision)break;
        by=collision.y+(h+collision.h)/2+8;
        if(by>sceneBottom-8){by=Math.max(sceneTop,collision.y-(h+collision.h)/2-9);bx=clamp(bx+(dx<0?-22:22),w/2+10,width-w/2-52);}
      }
      if(Math.hypot(bx-x,by-y)>225||x<0||x>width||y<sceneTop-30||y>sceneBottom+12){label.button.hidden=true;label.line.hidden=true;continue;}
      label.button.style.left=`${bx}px`;label.button.style.top=`${by}px`;placed.push({x:bx,y:by,w,h});
      const edgeX=bx+(x<bx?-w/2:w/2),edgeY=by,distance=Math.hypot(edgeX-x,edgeY-y);
      label.line.hidden=false;label.line.style.left=`${x}px`;label.line.style.top=`${y}px`;label.line.style.width=`${distance}px`;label.line.style.transform=`rotate(${Math.atan2(edgeY-y,edgeX-x)}rad)`;
    }
  }
  let toastTimer,lastToast=null;
  function toast(message,values={},ms=2600){lastToast={message,values};clearTimeout(toastTimer);$('toast').textContent=tr(message,values);$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),ms);}
  function setSoil(mode){
    soilMode=mode;soilCut.visible=mode==='cutaway';soilXray.visible=mode==='xray';soilBase.visible=mode!=='hidden';
    document.querySelectorAll('[data-soil]').forEach(b=>{b.classList.toggle('active',b.dataset.soil===mode);b.setAttribute('aria-pressed',String(b.dataset.soil===mode));});renderer.shadowMap.needsUpdate=true;
    if(mode==='xray')toast('Transparent soil · roots stay visible as you rotate');
  }
  document.querySelectorAll('[data-soil]').forEach(b=>b.addEventListener('click',()=>setSoil(b.dataset.soil)));
  document.querySelectorAll('[data-focus]').forEach(b=>b.addEventListener('click',()=>focusOn(b.dataset.focus,true)));
  function toggleLabels(){labelsVisible=!labelsVisible;$('labelsButton').classList.toggle('active',labelsVisible);$('labelsButton').setAttribute('aria-pressed',String(labelsVisible));}
  $('labelsButton').addEventListener('click',toggleLabels);
  $('zoomIn').addEventListener('click',()=>zoom(.8));$('zoomOut').addEventListener('click',()=>zoom(1.25));$('resetView').addEventListener('click',resetCamera);
  $('orbitButton').addEventListener('click',()=>{if(reducedMotion){toast('Turn off Reduce motion in the educator guide to auto-rotate.');return;}autoOrbit=!autoOrbit;$('orbitButton').classList.toggle('active',autoOrbit);$('orbitButton').setAttribute('aria-pressed',String(autoOrbit));});
  function updateAnatomyButtons(){
    const [openLabel,closeLabel,openTitle]=rig.fruitCloseStrings;
    $('seedOpenButton').querySelector('span').textContent=tr(seedOpen?'Close seed':'Open seed');$('seedOpenButton').title=tr(seedOpen?'Close seed':'Open seed · inspect the embryo');
    $('podOpenButton').querySelector('span').textContent=tr(podOpen?closeLabel:openLabel);$('podOpenButton').title=tr(podOpen?closeLabel:openTitle);
    $('podOpenButton').setAttribute('aria-label',tr(podOpen?closeLabel:openLabel));$('seedOpenButton').setAttribute('aria-label',tr(seedOpen?'Close seed':'Open seed'));
  }
  $('seedOpenButton').addEventListener('click',()=>{seedOpen=!seedOpen;$('seedOpenButton').classList.toggle('active',seedOpen);$('seedOpenButton').setAttribute('aria-pressed',String(seedOpen));updateAnatomyButtons();focusOn('seed');if(seedOpen)toast('Exploded seed view · coat, cotyledons, and embryo');});
  $('podOpenButton').addEventListener('click',()=>{podOpen=!podOpen;$('podOpenButton').classList.toggle('active',podOpen);$('podOpenButton').setAttribute('aria-pressed',String(podOpen));updateAnatomyButtons();focusOn('fruit');if(podOpen)toast(rig.fruitCloseStrings[3]);});
  $('motionCheckbox').addEventListener('change',e=>{reducedMotion=e.target.checked;if(reducedMotion){autoOrbit=false;$('orbitButton').classList.remove('active');$('orbitButton').setAttribute('aria-pressed','false');}renderer.shadowMap.needsUpdate=true;});
  $('fullscreenButton').addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('Use your browser’s full-screen option on this device.');}catch(e){toast('Full screen is not available in this browser window.');}
  });
  document.addEventListener('fullscreenchange',()=>{$('fullscreenButton').classList.toggle('active',!!document.fullscreenElement);$('fullscreenButton').setAttribute('aria-label',tr(document.fullscreenElement?'Exit full screen':'Enter full screen'));resize();});

  function updatePlayButton(){
    $('playButton').innerHTML=icon(playing?'pause':'play')+`<span>${tr(playing?'Pause growth':targetGrowth>=6.999?'Replay growth':'Play growth')}</span>`;
    $('playButton').setAttribute('aria-pressed',String(playing));
    $('playButton').title=tr(playing?'Pause growth (Space)':targetGrowth>=6.999?'Replay growth (Space)':'Play growth (Space)');
    $('timelineStatus').textContent=tr('{state} · Stage {n} of 8',{state:playing?'Growing':targetGrowth>=6.999?'Cycle complete':'Ready to explore',n:selectedStage+1});
  }
  function stopPlayback(){playing=false;playback=null;updatePlayButton();}
  function togglePlayback(){
    if(playing){stopPlayback();return;}
    growthTransition=null;
    if(growth>=6.999&&targetGrowth>=6.999){targetGrowth=0;growth=0;}else targetGrowth=growth;
    closeDetail();playing=true;focusMode='whole';followFocus=true;fitCamera=true;
    playback={from:targetGrowth,to:Math.min(7,Math.floor(targetGrowth+.0001)+1),time:-1.8};updatePlayButton();syncFocusButtons();
  }
  function chooseStage(index){
    stopPlayback();targetGrowth=clamp(index,0,7);
    growthTransition=reducedMotion?null:{from:growth,to:targetGrowth,time:0,duration:1.45+Math.min(2.5,Math.abs(targetGrowth-growth)*.42)};
    updateStageText(Math.round(targetGrowth));closeDetail();
    focusMode='whole';followFocus=true;fitCamera=true;syncFocusButtons();updatePlayButton();
  }
  chooseStageHandler=chooseStage;
  $('playButton').addEventListener('click',togglePlayback);
  $('growthSlider').addEventListener('input',e=>{
    stopPlayback();growthTransition=null;targetGrowth=Number(e.target.value)/100;updateStageText(Math.round(targetGrowth));closeDetail();
    if(!available(focusMode,targetGrowth)){focusMode='whole';followFocus=true;fitCamera=true;}updatePlayButton();
  });

  // ── Viewing tools in the dock ──────────────────────────────────────────────

  function updateLightButton(){const b=$('lightButton');b.dataset.mood=moodKey;b.title=tr('Lighting mood · {mood}',{mood:mood.name});b.setAttribute('aria-label',tr('Lighting mood · {mood}',{mood:mood.name}));}
  $('lightButton').addEventListener('click',()=>{applyMood(moodOrder[(moodOrder.indexOf(moodKey)+1)%moodOrder.length]);updateLightButton();toast('Light: {mood}',{mood:mood.name});});
  // ── Watering: rain → wetting front in the soil → uptake by root hairs → xylem → transpiration ──
  Object.assign(chineseText,{
    'Rain falls · water soaks down into the soil':'下雨了 · 雨水渗入土壤深处',
    'Root hairs absorb water from the wet soil':'根毛从湿润的土壤中吸收水分',
    'Water travels up the stem through the xylem':'水分经由木质部沿茎向上运输',
    'Leaves release water vapour · transpiration pulls more water up':'叶片释放水蒸气 · 蒸腾作用拉动更多水分上升',
    'The seed absorbs water and swells · this wakes the embryo':'种子吸水膨胀 · 唤醒里面的胚',
    'Water moves up to the growing shoot and seed leaves':'水分向上输送到正在生长的幼芽和子叶'
  });
  const water={armed:false,silent:false,noRain:false,hasLeaves:false,t:99,moisture:0,front:0,rootFlow:0,stemFlow:0,leafMist:0,step:-1,seedOnly:false};
  const wetU={uWet:{value:0},uFront:{value:0},uDry:{value:0},uSide:{value:0},uSideC:{value:new T.Vector2(-1.45,-1.25)}},flowU={root:{value:0},stem:{value:0},sugar:{value:0},time:{value:0}};
  // Soil darkens and turns glossy behind a slightly irregular wetting front that sinks through the cut face.
  function addWetChain(m){
    const prev=m.onBeforeCompile,prevKey=m.customProgramCacheKey();
    m.onBeforeCompile=function wetChain(sh,r){
      if(prev)prev.call(m,sh,r);
      sh.uniforms.uWet=wetU.uWet;sh.uniforms.uFront=wetU.uFront;sh.uniforms.uDry=wetU.uDry;sh.uniforms.uSide=wetU.uSide;sh.uniforms.uSideC=wetU.uSideC;
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWetW;').replace('#include <project_vertex>',`#include <project_vertex>
        #ifdef USE_INSTANCING
        vWetW=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;
        #else
        vWetW=(modelMatrix*vec4(transformed,1.)).xyz;
        #endif`);
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWetW;uniform float uWet,uFront,uDry,uSide;uniform vec2 uSideC;')
        .replace('#include <color_fragment>',`#include <color_fragment>
          float wd=-vWetW.y+.07*sin(vWetW.x*11.)*sin(vWetW.z*9.+1.)+.035*sin(vWetW.x*23.+vWetW.z*17.);
          float wet=uWet*(1.-smoothstep(uFront-.14,uFront+.08,wd));
          float sdist=length(vWetW.xy-uSideC)+.12*sin(vWetW.x*9.+vWetW.y*7.);wet=max(wet,uSide*(1.-smoothstep(.55,1.75,sdist)));
          float dryK=max(uDry,uSide*.75*smoothstep(-.3,1.3,vWetW.x));
          diffuseColor.rgb*=mix(1.,.5,wet);
          if(dryK>.001){float lum=dot(diffuseColor.rgb,vec3(.3,.59,.11));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(lum)*vec3(1.25,1.1,.88),dryK*.75)*(1.+dryK*.45);
            float cr=abs(sin(vWetW.x*8.+sin(vWetW.z*6.3)*1.8)*sin(vWetW.z*7.4+sin(vWetW.x*5.7)*1.6));
            diffuseColor.rgb*=1.-dryK*.6*smoothstep(.09,.0,cr)*smoothstep(-.35,-.05,vWetW.y);}
          diffuseColor.rgb+=vec3(.01,.02,.036)*uWet*exp(-pow((wd-uFront)*15.,2.))*step(.02,uFront)*step(uFront,3.2);`)
        .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.36,wet);');
    };
    m.customProgramCacheKey=()=>prevKey+'|wet';m.needsUpdate=true;
  }
  // Xylem glow: pulses travel toward the root junction in roots and upward in stems and leaf stalks.
  function addFlowChain(m,u,up){
    const prev=m.onBeforeCompile,prevKey=m.customProgramCacheKey();
    m.onBeforeCompile=function flowChain(sh,r){
      if(prev)prev.call(m,sh,r);
      sh.uniforms.uFlow=u;sh.uniforms.uFlowTime=flowU.time;sh.uniforms.uSugar=flowU.sugar;
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uFlow,uFlowTime,uSugar;')
        .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
          #ifdef USE_MAP
          if(uFlow>.001){float ph=fract(vMapUv.y*1.6${up?'-':'+'}uFlowTime*.85);float band=smoothstep(0.,.05,ph)*(1.-smoothstep(.05,.3,ph));
            totalEmissiveRadiance+=vec3(.14,.5,1.)*uFlow*(.1+band*.95);}
          if(uSugar>.001){float ps=fract(vMapUv.y*1.3${up?'+':'-'}uFlowTime*.6+.37);float bs=smoothstep(0.,.08,ps)*(1.-smoothstep(.08,.36,ps));
            totalEmissiveRadiance+=vec3(1.,.55,.1)*uSugar*(.05+bs*.55);}
          #endif`);
    };
    m.customProgramCacheKey=()=>prevKey+(up?'|flowUp':'|flowIn');m.needsUpdate=true;
  }
  addWetChain(earthMaterial);addWetChain(crumbMaterial);
  addFlowChain(M.rootB,flowU.root,false);addFlowChain(M.stemB,flowU.stem,true);addFlowChain(M.stemT,flowU.stem,true);
  // Rain streaks over the soil block, and small splash rings where drops land.
  const dropCount=1400,dropSeeds=new Float32Array(dropCount*4),dropPos=new Float32Array(dropCount*3);
  for(let i=0;i<dropCount;i++){dropSeeds.set([hash3(i,1,5),hash3(i,2,5),hash3(i,3,5),hash3(i,4,5)],i*4);}
  const dropGeo=new T.BufferGeometry();dropGeo.setAttribute('position',new T.BufferAttribute(dropPos,3));dropGeo.setAttribute('aSeed',new T.BufferAttribute(dropSeeds,4));
  const dropUniforms={uTime:{value:0},uRain:{value:0},uScale:{value:1},uPixelRatio:{value:1}};
  const drops=new T.Points(dropGeo,new T.ShaderMaterial({uniforms:dropUniforms,transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`attribute vec4 aSeed;uniform float uTime,uRain,uScale,uPixelRatio;varying float vA;
      void main(){float life=fract(aSeed.w+uTime*(.9+aSeed.z*.4));
        float x=(aSeed.x*2.-1.)*2.,z=mix(-2.05,-.2,aSeed.y);
        vec3 p=vec3(x+life*.12,mix(5.6,-.02,life),z);
        float inside=step(x*x+z*z,4.3);
        vA=uRain*inside*smoothstep(0.,.1,life)*(1.-smoothstep(.95,1.,life))*(.35+.3*aSeed.z);
        vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(.16*uScale/max(.1,-mv.z),2.,30.)*uPixelRatio;if(vA<.003)gl_PointSize=0.;}`,
    fragmentShader:`varying float vA;void main(){vec2 q=gl_PointCoord*2.-1.;float a=exp(-q.x*q.x*90.)*smoothstep(-1.,-.1,-q.y)*(1.-smoothstep(.6,1.,abs(q.y)));if(a*vA<.004)discard;gl_FragColor=vec4(.66,.77,.9,min(1.,a*vA*1.4));}`}));
  drops.frustumCulled=false;drops.visible=false;drops.renderOrder=3;scene.add(drops);
  const splashCount=220,splashPos=new Float32Array(splashCount*3),splashSeed=new Float32Array(splashCount);
  for(let i=0;i<splashCount;i++){
    let x=(hash3(i,7,3)*2-1)*2;const z=mix(-2.05,-.24,hash3(i,8,3));while(x*x+z*z>4.2&&Math.abs(x)>.01)x*=.8;
    splashPos.set([x,-.025+.115*(noise3(x*3.8,9,z*3.8)-.5)+.025*Math.sin(x*5+z*3)+.012,z],i*3);splashSeed[i]=hash3(i,9,3);
  }
  const splashGeo=new T.BufferGeometry();splashGeo.setAttribute('position',new T.BufferAttribute(splashPos,3));splashGeo.setAttribute('aSeed',new T.BufferAttribute(splashSeed,1));
  const splashes=new T.Points(splashGeo,new T.ShaderMaterial({uniforms:dropUniforms,transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`attribute float aSeed;uniform float uTime,uRain,uScale,uPixelRatio;varying float vLife,vA;
      void main(){vLife=fract(aSeed*7.3+uTime*(1.3+aSeed));vA=uRain;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(.13*uScale/max(.1,-mv.z),2.,34.)*uPixelRatio;if(vA<.01)gl_PointSize=0.;}`,
    fragmentShader:`varying float vLife,vA;void main(){vec2 q=gl_PointCoord*2.-1.;float r=length(vec2(q.x,q.y*2.6));
      float ring=exp(-pow((r-vLife*.9)*10.,2.))*(1.-vLife);float bead=exp(-dot(q,q)*40.)*smoothstep(.25,0.,vLife);
      float a=(ring*.55+bead*.8)*vA;if(a<.004)discard;gl_FragColor=vec4(.88,.94,1.,a);}`}));
  splashes.frustumCulled=false;splashes.visible=false;splashes.renderOrder=3;scene.add(splashes);
  // Water droplets: seep down through the soil face, enter the root-hair zone and travel through the plant.
  const FLOW_N=300,flowPos=new Float32Array(FLOW_N*3),flowAlpha=new Float32Array(FLOW_N),flowTint=new Float32Array(FLOW_N);
  const flowGeo=new T.BufferGeometry();
  flowGeo.setAttribute('position',new T.BufferAttribute(flowPos,3).setUsage(T.DynamicDrawUsage));
  flowGeo.setAttribute('aAlpha',new T.BufferAttribute(flowAlpha,1).setUsage(T.DynamicDrawUsage));
  flowGeo.setAttribute('aTint',new T.BufferAttribute(flowTint,1).setUsage(T.DynamicDrawUsage));
  const flowUniforms={uScale:{value:1},uPixelRatio:{value:1}};
  const flowPoints=new T.Points(flowGeo,new T.ShaderMaterial({uniforms:flowUniforms,transparent:true,depthWrite:false,depthTest:false,toneMapped:false,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor,blendSrcAlpha:T.OneFactor,blendDstAlpha:T.OneMinusSrcAlphaFactor,
    vertexShader:`attribute float aAlpha,aTint;uniform float uScale,uPixelRatio;varying float vA,vT;
      void main(){vA=aAlpha;vT=aTint;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(mix(.075,.11,aTint)*uScale/max(.08,-mv.z),1.5,22.)*uPixelRatio;if(aAlpha<.01)gl_PointSize=0.;}`,
    fragmentShader:`varying float vA,vT;void main(){vec2 q=gl_PointCoord*2.-1.;float r=dot(q,q);if(r>1.)discard;
      float core=exp(-r*7.),rim=smoothstep(.55,.3,r),halo=exp(-r*2.6)*.35;
      vec3 c=mix(vec3(.08,.42,1.),vec3(.8,.9,1.),vT);float a=clamp((rim*.85+halo)*vA,0.,1.);
      vec3 col=c*(.9+core*mix(1.6,.3,vT))+vec3(.9,.97,1.)*pow(core,6.)*.8*(1.-vT);
      gl_FragColor=vec4(col*a,a*mix(1.,.6,vT));}`}));
  flowPoints.frustumCulled=false;flowPoints.visible=false;flowPoints.renderOrder=4;scene.add(flowPoints);
  const fp={stage:new Uint8Array(FLOW_N),src:new Uint16Array(FLOW_N),dst:new Uint16Array(FLOW_N),d:new Float32Array(FLOW_N),t:new Float32Array(FLOW_N),
    dur:new Float32Array(FLOW_N),start:Array.from({length:FLOW_N},()=>V()),speed:new Float32Array(FLOW_N)};
  const waterPaths={roots:[],ups:[],age:9};
  function makePoly(pts){const cum=new Float32Array(pts.length);for(let i=1;i<pts.length;i++)cum[i]=cum[i-1]+pts[i].distanceTo(pts[i-1]);return {pts,cum,len:cum[pts.length-1]||0};}
  function sampleAt(p,d,out){
    const n=p.pts.length;if(n<2||d<=0)return out.copy(p.pts[0]);if(d>=p.len)return out.copy(p.pts[n-1]);
    let i=1;while(i<n-1&&p.cum[i]<d)i++;
    const a=p.cum[i-1],span=Math.max(1e-6,p.cum[i]-a);return out.copy(p.pts[i-1]).lerp(p.pts[i],(d-a)/span);
  }
  function buildWaterPaths(){
    const R=rig.root,roots=[],ups=[];
    rig.model.updateMatrixWorld(true);
    water.seedOnly=!R.visible||rig.params.rootLength<.12;
    if(water.seedOnly){const s=worldAnchor('seed');roots.push(makePoly([s,s.clone()]));waterPaths.roots=roots;waterPaths.ups=[];return;}
    const prim=[];for(let i=0;i<=24;i++)prim.push(R.localToWorld(R.pointAt(1-i/24,V())));
    roots.push(makePoly(prim));
    rig.branches.forEach(b=>{
      if(!b.mesh.visible||b.mesh.grownAmount<.3)return;
      const pts=[];for(let i=0;i<=10;i++)pts.push(b.mesh.localToWorld(b.mesh.pointAt(1-i/10,V())));
      for(let i=Math.ceil((1-b.fraction)*24);i<=24;i++)pts.push(prim[i].clone());
      roots.push(makePoly(pts));
    });
    const base=[];
    if(rig.hyp.visible)for(let i=1;i<=14;i++)base.push(rig.hyp.localToWorld(rig.hyp.pointAt(i/14,V())));
    const stemPts=[];
    if(rig.stem.visible&&rig.stemLen>.03)for(let i=1;i<=30;i++)stemPts.push(rig.stem.localToWorld(rig.stem.pointAt(i/30,V())));
    const leaves=rig.leaves.filter(e=>e.unfold>.2&&trulyVisible(e.group));
    const pick=leaves.length>12?leaves.filter((_,k)=>k%Math.ceil(leaves.length/12)===0):leaves;
    for(const e of pick){
      e.group.updateMatrixWorld(true);
      const lb=e.group.getWorldPosition(V());let idx=-1,best=Infinity;
      stemPts.forEach((p,k)=>{const dd=p.distanceToSquared(lb);if(dd<best){best=dd;idx=k;}});
      const pts=[...base.map(p=>p.clone()),...stemPts.slice(0,idx+1).map(p=>p.clone()),lb];
      for(const f of [.22,.45,.68])pts.push(V(0,f,.02).applyMatrix4(e.group.matrixWorld));
      ups.push(makePoly(pts));
    }
    water.hasLeaves=ups.length>0;
    if(!ups.length&&base.length)ups.push(makePoly([...base,...stemPts]));
    waterPaths.roots=roots;waterPaths.ups=ups;
  }
  const _wp=V(),_wq=V();
  function spawnDroplet(i){
    const roots=waterPaths.roots;if(!roots.length)return;
    const r=Math.floor(Math.random()*roots.length),rp=roots[r];
    const d0=water.seedOnly?0:Math.random()*rp.len*.4;sampleAt(rp,d0,_wp);
    fp.stage[i]=1;fp.src[i]=r;fp.dst[i]=waterPaths.ups.length?Math.floor(Math.random()*waterPaths.ups.length):0;fp.d[i]=d0;fp.t[i]=0;
    fp.start[i].set(_wp.x+(Math.random()-.5)*.6,-.03,-.13+Math.random()*.05);
    fp.dur[i]=Math.max(.5,(fp.start[i].y-_wp.y)/(.75+Math.random()*.35));fp.speed[i]=.8+Math.random()*.4;
  }
  let spawnDebt=0;
  function updateWater(dt){
    const w=water;
    if(!w.armed){drops.visible=splashes.visible=flowPoints.visible=false;return;}w.t+=dt;const t=w.t,active=t<18;
    if(!reducedMotion&&active){
      const rainOn=t<3.8&&!w.noRain;
      if(rainOn)w.moisture=Math.min(1,w.moisture+dt*.6);
      w.front=Math.max(w.front,Math.min(3.3,Math.max(0,t-.35)*.6));
      w.rootFlow=smooth(2.6,3.8,t)*(1-smooth(13,16,t));
      w.stemFlow=water.seedOnly?0:smooth(5.2,6.8,t)*(1-smooth(14,17.5,t));
      w.leafMist=smooth(8.5,10,t)*(1-smooth(14,17,t));
      dropUniforms.uRain.value=mix(dropUniforms.uRain.value,rainOn?1:0,1-Math.exp(-dt*(rainOn?3:1.6)));
      const steps=w.seedOnly?[[0,'Rain falls · water soaks down into the soil'],[3.2,'The seed absorbs water and swells · this wakes the embryo']]:
        w.hasLeaves?[[0,'Rain falls · water soaks down into the soil'],[3.2,'Root hairs absorb water from the wet soil'],[6.6,'Water travels up the stem through the xylem'],[10,'Leaves release water vapour · transpiration pulls more water up']]:
        [[0,'Rain falls · water soaks down into the soil'],[3.2,'Root hairs absorb water from the wet soil'],[6.6,'Water moves up to the growing shoot and seed leaves']];
      let s=-1;steps.forEach((st,k)=>{if(t>=st[0])s=k;});
      if(s!==w.step){w.step=s;if(!w.silent)toast(steps[s][1],{},3300);}
    }else{
      w.rootFlow=Math.max(0,w.rootFlow-dt*.5);w.stemFlow=Math.max(0,w.stemFlow-dt*.5);w.leafMist=Math.max(0,w.leafMist-dt*.5);
      dropUniforms.uRain.value=Math.max(0,dropUniforms.uRain.value-dt*2);
      if(!active)w.moisture=Math.max(0,w.moisture-dt*.018);
    }
    if(w.moisture<.02)w.front=0;
    wetU.uWet.value=w.moisture;wetU.uFront.value=w.front;
    flowU.root.value=w.rootFlow;flowU.stem.value=w.stemFlow;flowU.time.value+=dt;
    drops.visible=splashes.visible=dropUniforms.uRain.value>.01;dropUniforms.uTime.value+=dt;
    const scale=height/(2*Math.tan(camera.fov*Math.PI/360));
    dropUniforms.uScale.value=flowUniforms.uScale.value=scale;dropUniforms.uPixelRatio.value=flowUniforms.uPixelRatio.value=renderer.getPixelRatio();
    // droplets
    let any=false;
    const emitting=!reducedMotion&&active&&t>.7&&t<11;
    if(emitting||flowPoints.visible){
      waterPaths.age+=dt;if(waterPaths.age>.25){waterPaths.age=0;buildWaterPaths();}
      if(emitting)spawnDebt+=dt*(water.seedOnly?20:34);
      for(let i=0;i<FLOW_N;i++){
        if(fp.stage[i]===0){if(spawnDebt>=1&&waterPaths.roots.length){spawnDebt-=1;spawnDroplet(i);}else{flowAlpha[i]=0;continue;}}
        any=true;fp.t[i]+=dt;
        const rp=waterPaths.roots[fp.src[i]%Math.max(1,waterPaths.roots.length)];
        if(!rp){fp.stage[i]=0;flowAlpha[i]=0;continue;}
        const up=waterPaths.ups.length?waterPaths.ups[fp.dst[i]%waterPaths.ups.length]:null;
        if(fp.stage[i]===1){
          const k=clamp(fp.t[i]/fp.dur[i]);sampleAt(rp,fp.d[i],_wp);
          _wq.copy(fp.start[i]).lerp(_wp,smoother(k));_wq.x+=Math.sin(fp.t[i]*7+i)*.025*(1-k);
          flowPos[i*3]=_wq.x;flowPos[i*3+1]=_wq.y;flowPos[i*3+2]=_wq.z;flowAlpha[i]=smooth(0,.25,k)*.75;flowTint[i]=.35*(1-k);
          if(k>=1){fp.stage[i]=water.seedOnly?3:2;fp.t[i]=0;}
        }else if(fp.stage[i]===2){
          fp.d[i]+=dt*fp.speed[i]*(fp.d[i]<rp.len?.75:1.05);
          const total=rp.len+(up?up.len:0);
          if(fp.d[i]<rp.len)sampleAt(rp,fp.d[i],_wq);else if(up)sampleAt(up,fp.d[i]-rp.len,_wq);else _wq.copy(rp.pts[rp.pts.length-1]);
          flowPos[i*3]=_wq.x;flowPos[i*3+1]=_wq.y;flowPos[i*3+2]=_wq.z;flowAlpha[i]=.95;flowTint[i]=0;
          if(fp.d[i]>=total){fp.stage[i]=_wq.y<.05?4:3;fp.t[i]=0;fp.start[i].copy(_wq);}
        }else{
          // leaves: water leaves as vapour through stomata; in a seed it simply soaks in
          const soak=water.seedOnly||fp.stage[i]===4,k=clamp(fp.t[i]/(soak?.6:1.6));
          if(!soak){fp.start[i].x+=Math.sin(fp.t[i]*3+i)*dt*.05;fp.start[i].y+=dt*(.16+.1*k);}
          flowPos[i*3]=fp.start[i].x;flowPos[i*3+1]=fp.start[i].y;flowPos[i*3+2]=fp.start[i].z;
          flowAlpha[i]=(1-k)*(soak?.9:.45);flowTint[i]=soak?0:smooth(0,.4,k);
          if(k>=1){fp.stage[i]=0;flowAlpha[i]=0;}
        }
      }
      spawnDebt=Math.min(spawnDebt,4);
      flowGeo.attributes.position.needsUpdate=flowGeo.attributes.aAlpha.needsUpdate=flowGeo.attributes.aTint.needsUpdate=true;
    }
    flowPoints.visible=any;
    $('waterButton').classList.toggle('active',active&&t<16&&!w.silent);
  }
  function startWatering(opts={}){
    water.armed=true;
    water.silent=!!opts.silent;water.noRain=!!opts.noRain;
    if(opts.noRain){if(reducedMotion)return;water.moisture=Math.max(water.moisture,.6);water.t=opts.t0||0;water.step=-1;fp.stage.fill(0);spawnDebt=0;waterPaths.age=9;return;}
    if(reducedMotion){water.moisture=1;water.front=3.3;water.t=99;toast('Watering · water soaks into the soil, where roots take it up');return;}
    water.t=0;water.step=-1;water.front=Math.min(water.front,.05);fp.stage.fill(0);spawnDebt=0;waterPaths.age=9;
  }
  $('waterButton').addEventListener('click',()=>startWatering());
  // ── Photosynthesis: light + CO₂ + H₂O → glucose + O₂, shown step by step on the living plant ──
  Object.assign(chineseText,{
    'Show photosynthesis':'演示光合作用','Show photosynthesis (O)':'演示光合作用（O）',
    'Sunlight reaches the leaves · chlorophyll captures its energy':'阳光照到叶片 · 叶绿素吸收光能',
    'Carbon dioxide from the air enters the leaves through tiny pores (stomata)':'空气中的二氧化碳经由叶片上的小孔（气孔）进入叶片',
    'Water arrives from the roots through the xylem':'水分从根部经由木质部运到叶片',
    'Leaves make sugar (glucose) · the phloem carries it to feed the whole plant':'叶片制造糖分（葡萄糖）· 韧皮部把它输送到全株',
    'Oxygen is released into the air':'氧气被释放到空气中',
    'Photosynthesis needs green leaves · choose a stage with true leaves':'光合作用需要绿色叶片 · 请选择已长出真叶的阶段',
    'Photosynthesis · light + carbon dioxide + water → sugar + oxygen':'光合作用 · 光 + 二氧化碳 + 水 → 糖 + 氧气',
    'carbon dioxide + water → glucose (sugar) + oxygen':'二氧化碳 + 水 → 葡萄糖（糖）+ 氧气',
    'sugar':'糖分','light':'光'
  });
  const photo={t:99,step:-1,beam:0,glow:0,still:false,glowOn:false};
  // Equation chip and the small tags that ride on representative molecules.
  const fxLayer=$('fxLayer');
  const eq=document.createElement('div');eq.className='photo-eq';eq.hidden=true;fxLayer.appendChild(eq);
  function renderEquation(){
    eq.innerHTML=`<div class="eq-line"><span class="t" data-t="co2">6CO₂</span> + <span class="t" data-t="h2o">6H₂O</span> <span class="t arrow" data-t="light"><i>${tr('light')}</i>→</span> <span class="t" data-t="sugar">C₆H₁₂O₆</span> + <span class="t" data-t="o2">6O₂</span></div><small>${tr('carbon dioxide + water → glucose (sugar) + oxygen')}</small>`;
    if(typeof photo!=='undefined')eq.querySelectorAll('.t').forEach(el=>{const k=photoSteps.findIndex(x=>x[2]===el.dataset.t);el.classList.toggle('on',photo.still||k<=photo.step);el.classList.toggle('now',!photo.still&&k===photo.step);});
  }
  const fxTags={};
  for(const [k,text] of [['co2','CO₂'],['o2','O₂'],['h2o','H₂O'],['sugar','sugar']]){const e=document.createElement('span');e.className='fx-tag';e.dataset.k=k;e.dataset.text=text;e.hidden=true;fxLayer.appendChild(e);fxTags[k]={el:e,index:-1};}
  function tagText(){for(const k in fxTags){const t=fxTags[k];t.el.textContent=t.el.dataset.text==='sugar'?tr('sugar'):t.el.dataset.text;}}
  tagText();
  // Light shafts along the sun direction.
  const beamUniforms={uI:{value:0},uTime:{value:0}};
  const beamMat=new T.ShaderMaterial({uniforms:beamUniforms,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,
    blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.OneFactor,blendDst:T.OneFactor,blendSrcAlpha:T.OneFactor,blendDstAlpha:T.OneMinusSrcAlphaFactor,
    vertexShader:`varying vec2 vUv;varying vec3 vN,vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalMatrix*normal;vV=-mv.xyz;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform float uI,uTime;varying vec2 vUv;varying vec3 vN,vV;
      void main(){float edge=pow(abs(dot(normalize(vN),normalize(vV))),2.2);
        float along=smoothstep(0.,.1,vUv.y)*(1.-smoothstep(.3,1.,vUv.y));
        float shimmer=.75+.25*sin(uTime*1.4+vUv.y*9.+vUv.x*6.283);
        float a=uI*edge*along*shimmer*.17*smoothstep(1.,3.2,length(vV));gl_FragColor=vec4(vec3(1.,.9,.62)*a*1.6,a*.55);}`});
  const beams=new T.Group();beams.visible=false;scene.add(beams);
  const beamGeo=new T.CylinderGeometry(1,1,1,28,1,true);beamGeo.translate(0,.5,0);
  const beamOffsets=[[-.9,.2,.26],[-.3,-.35,.2],[.35,.3,.3],[.95,-.1,.18],[.1,.8,.22],[-.55,-.95,.16],[.6,-.85,.2]];
  beamOffsets.forEach(()=>beams.add(new T.Mesh(beamGeo,beamMat)));
  const _sunDir=V(),_side=V(),_up2=V(),_canopy=V();
  function placeBeams(){
    _sunDir.subVectors(sun.position,sun.target.position).normalize();
    _side.crossVectors(_sunDir,V(0,1,0));if(_side.lengthSq()<1e-4)_side.set(1,0,0);_side.normalize();_up2.crossVectors(_side,_sunDir).normalize();
    const q=new T.Quaternion().setFromUnitVectors(V(0,1,0),_sunDir);
    beams.children.forEach((b,i)=>{const [a,c,w]=beamOffsets[i];
      b.position.copy(_canopy).addScaledVector(_side,a*.8).addScaledVector(_up2,c*.8).addScaledVector(_sunDir,-.4);
      b.quaternion.copy(q);b.scale.set(w,8,w);});
  }
  // Molecules and sugar: one sprite system with per-particle colour, size, shape and rotation.
  const FX_N=460;
  const fxPos=new Float32Array(FX_N*3),fxCol=new Float32Array(FX_N*3),fxAlpha=new Float32Array(FX_N),fxSize=new Float32Array(FX_N),fxShape=new Float32Array(FX_N),fxRot=new Float32Array(FX_N);
  const fxGeo=new T.BufferGeometry();
  [['position',fxPos,3],['aColor',fxCol,3],['aAlpha',fxAlpha,1],['aSize',fxSize,1],['aShape',fxShape,1],['aRot',fxRot,1]].forEach(([n,a,s])=>fxGeo.setAttribute(n,new T.BufferAttribute(a,s).setUsage(T.DynamicDrawUsage)));
  const fxUniforms={uScale:{value:1},uPixelRatio:{value:1}};
  const fxPoints=new T.Points(fxGeo,new T.ShaderMaterial({uniforms:fxUniforms,transparent:true,depthWrite:false,depthTest:false,toneMapped:false,
    blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor,blendSrcAlpha:T.OneFactor,blendDstAlpha:T.OneMinusSrcAlphaFactor,
    vertexShader:`attribute vec3 aColor;attribute float aAlpha,aSize,aShape,aRot;uniform float uScale,uPixelRatio;varying vec3 vC;varying float vA,vS,vR;
      void main(){vC=aColor;vA=aAlpha;vS=aShape;vR=aRot;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(aSize*uScale/max(.08,-mv.z),1.5,64.)*uPixelRatio;if(aAlpha<.01)gl_PointSize=0.;}`,
    fragmentShader:`varying vec3 vC;varying float vA,vS,vR;
      vec4 ball(vec2 q,vec2 c,float r,vec3 col){vec2 d=(q-c)/r;float rr=dot(d,d);if(rr>1.)return vec4(0.);float z=sqrt(1.-rr);
        float lit=.35+.65*clamp(dot(vec3(d,z),normalize(vec3(-.45,.55,.7))),0.,1.);float spec=pow(clamp(dot(vec3(d,z),normalize(vec3(-.3,.45,.84))),0.,1.),28.);
        return vec4(col*lit+spec*.55,smoothstep(1.,.86,rr));}
      float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
      float fbm(vec2 p){return vn(p)*.55+vn(p*2.1+3.7)*.3+vn(p*4.3+1.3)*.15;}
      vec4 over(vec4 top,vec4 b){return vec4(top.rgb*top.a+b.rgb*(1.-top.a),top.a+b.a*(1.-top.a));}
      void main(){vec2 q=gl_PointCoord*2.-1.;q.y=-q.y;float cs=cos(vR),sn=sin(vR);q=mat2(cs,-sn,sn,cs)*q;
        vec4 c=vec4(0.);vec3 O=vec3(.86,.24,.2),C=vec3(.2,.21,.22);
        if(vS<.5){float r=dot(q,q);if(r>1.)discard;float core=exp(-r*8.),halo=exp(-r*2.6)*.45;float a=clamp(core+halo,0.,1.);c=vec4(vC*(1.+core*1.4)*a,a);gl_FragColor=c*vA;return;}
        else if(vS<1.5){vec4 b1=ball(q,vec2(-.26,0.),.3,O),b2=ball(q,vec2(.26,0.),.3,O);vec4 m=over(b1,b2);vec4 mp=vec4(m.rgb*m.a,m.a);
          float rr=length(q);float ring=exp(-pow((rr-.86)*13.,2.))*.55+smoothstep(.9,.3,rr)*.07;vec4 bub=vec4(vec3(.82,.93,1.)*ring,ring);
          c=vec4(mp.rgb+bub.rgb*(1.-mp.a),mp.a+bub.a*(1.-mp.a));}
        else if(vS<2.5){
          vec2 p=q*1.7+vec2(vR*3.1,vR*1.7);float n=fbm(p)*.62+fbm(p*2.3+vec2(vR))*.38;
          float r=length(q);float body=smoothstep(1.,.15,r+(.5-n)*.55);
          float a=clamp(body*(.3+.7*n)*.95,0.,.85);vec3 col=mix(vC*.62,min(vC*1.12+.02,vec3(1.)),smoothstep(.3,.85,n));
          c=vec4(col*a,a);}
        else{float ang=atan(q.y,q.x),r=length(q);float hex=cos(3.14159/6.)/cos(mod(ang+3.14159/6.,3.14159/3.)-3.14159/6.);float d=r/(.62*hex);
          float fill=smoothstep(1.,.9,d),line=exp(-pow((d-.82)*9.,2.));float glow=exp(-r*r*3.)*.5;
          vec3 col=vC*(.75+line*.9)+vec3(1.,.95,.7)*line*.4;float a=clamp(fill*.92+glow*(1.-fill),0.,1.);c=vec4(col*a,a);}
        if(c.a<.01)discard;gl_FragColor=c*vA;}`}));
  fxPoints.frustumCulled=false;fxPoints.visible=false;fxPoints.renderOrder=5;scene.add(fxPoints);
  const fx={kind:new Uint8Array(FX_N),t:new Float32Array(FX_N),life:new Float32Array(FX_N),leaf:new Array(FX_N),local:Array.from({length:FX_N},()=>V()),
    start:Array.from({length:FX_N},()=>V()),pos:Array.from({length:FX_N},()=>V()),vel:Array.from({length:FX_N},()=>V()),src:new Uint16Array(FX_N),dst:new Uint16Array(FX_N),d:new Float32Array(FX_N),stop:new Float32Array(FX_N)};
  const KIND={spark:1,co2:2,o2:3,sugar:4};
  const debt={spark:0,co2:0,o2:0,sugar:0};
  let photoLeaves=[],photoPathAge=9;
  const _f1=V(),_f2=V();
  function leafPoint(e,out,local){return out.copy(local).applyMatrix4(e.group.matrixWorld);}
  function freeSlot(){for(let i=0;i<FX_N;i++)if(!fx.kind[i])return i;return -1;}
  function randomLeafLocal(out){return out.set((Math.random()-.5)*.22,.18+Math.random()*.55,.03);}
  function spawnFx(kind){
    const i=freeSlot();if(i<0||!photoLeaves.length)return;
    const e=photoLeaves[Math.floor(Math.random()*photoLeaves.length)];
    fx.kind[i]=kind;fx.t[i]=0;fx.leaf[i]=e;randomLeafLocal(fx.local[i]);fxRot[i]=Math.random()*TAU;
    leafPoint(e,fx.pos[i],fx.local[i]);
    if(kind===KIND.spark){fx.life[i]=.5+Math.random()*.6;fxSize[i]=.045+Math.random()*.035;fxShape[i]=0;fxCol.set([1,.93,.5],i*3);}
    else if(kind===KIND.co2){
      fx.life[i]=2.6+Math.random()*1.4;fxSize[i]=.3;fxShape[i]=2;fxCol.set([.66,.7,.76],i*3);
      const dir=V(Math.random()-.5,-.25-Math.random()*.5,Math.random()-.5).normalize();
      fx.start[i].copy(fx.pos[i]).addScaledVector(dir,.8+Math.random()*.7);
    }else if(kind===KIND.o2){
      fx.life[i]=2.8+Math.random()*1.4;fxSize[i]=.26;fxShape[i]=2;fxCol.set([.18,.82,1.],i*3);
      fx.vel[i].set((Math.random()-.5)*.25,.28+Math.random()*.2,(Math.random()-.5)*.25);
    }else{
      const ups=waterPaths.ups,roots=waterPaths.roots;
      if(!ups.length||!roots.length){fx.kind[i]=0;return;}
      fx.dst[i]=Math.floor(Math.random()*ups.length);fx.src[i]=Math.floor(Math.random()*roots.length);fx.d[i]=0;
      fx.stop[i]=.35+Math.random()*.5;fx.life[i]=99;fxSize[i]=.14;fxShape[i]=3;fxCol.set([1,.66,.16],i*3);
    }
    fxAlpha[i]=0;
  }
  function stopPhotosynthesis(){
    photo.t=99;photo.step=-1;fx.kind.fill(0);fxAlpha.fill(0);fxPoints.visible=false;beams.visible=false;eq.hidden=true;
    flowU.sugar.value=0;setLeafGlow(0);sun.intensity=mood.sunI;$('photoButton').classList.remove('active');$('photoButton').setAttribute('aria-pressed','false');
  }
  function setLeafGlow(v){
    if(v<=.001&&!photo.glowOn)return;photo.glowOn=v>.001;
    for(const r of Object.values(rigs))for(const e of r.leaves)e.mat.emissive.setRGB(.045*v,.16*v,.018*v);
  }
  function startPhotosynthesis(){
    if(photo.t<21){stopPhotosynthesis();return;}
    rig.model.updateMatrixWorld(true);
    photoLeaves=rig.leaves.filter(e=>e.unfold>.25&&trulyVisible(e.group));
    if(!photoLeaves.length){toast('Photosynthesis needs green leaves · choose a stage with true leaves');return;}
    if(whatIf.active==='dark'){toast('No light, no photosynthesis · switch the light back on to see it',{},3600);return;}
    photo.t=0;photo.step=-1;photo.still=reducedMotion;fx.kind.fill(0);for(const k in debt)debt[k]=0;photoPathAge=9;
    eq.hidden=false;eq.querySelectorAll('.t').forEach(s=>s.classList.toggle('on',photo.still));
    $('photoButton').classList.add('active');$('photoButton').setAttribute('aria-pressed','true');
    if(photo.still)toast('Photosynthesis · light + carbon dioxide + water → sugar + oxygen',{},4200);
  }
  const photoSteps=[[0,'Sunlight reaches the leaves · chlorophyll captures its energy','light'],[3.2,'Carbon dioxide from the air enters the leaves through tiny pores (stomata)','co2'],
    [6.6,'Water arrives from the roots through the xylem','h2o'],[9.8,'Leaves make sugar (glucose) · the phloem carries it to feed the whole plant','sugar'],[13.4,'Oxygen is released into the air','o2']];
  let waterKicked=false;
  function updatePhotosynthesis(dt){
    const p=photo,active=p.t<21;
    if(!active){if(beams.visible||fxPoints.visible||photo.glowOn){stopPhotosynthesis();}return;}
    p.t+=dt;const t=p.t;
    if(p.t>=21){stopPhotosynthesis();return;}
    photoLeaves=photoLeaves.filter(e=>rig.leaves.includes(e)&&trulyVisible(e.group));
    if(!photoLeaves.length){stopPhotosynthesis();return;}
    // canopy centre for the light shafts
    _canopy.set(0,0,0);photoLeaves.forEach(e=>_canopy.add(leafPoint(e,_f1,_f2.set(0,.45,0))));_canopy.multiplyScalar(1/photoLeaves.length);
    p.beam=p.still?1-smooth(18,21,t):smooth(0,1.6,t)*(1-smooth(19,21,t));
    beamUniforms.uI.value=p.beam;beamUniforms.uTime.value+=dt;beams.visible=p.beam>.01;if(beams.visible)placeBeams();
    sun.intensity=mood.sunI*(1+.14*p.beam);
    const sugarPulse=p.still?0:smooth(9.8,11,t)*(.5+.5*Math.sin(t*3.2));
    setLeafGlow((p.still?.45:smooth(.6,2.6,t)*.42+sugarPulse*.35)*(1-smooth(19,21,t)));
    if(p.still){eq.style.top=`${sceneTop}px`;return;}
    flowU.sugar.value=smooth(9.8,11.5,t)*(1-smooth(18,21,t));
    if(t>4.4&&!waterKicked){waterKicked=true;startWatering({silent:true,noRain:true,t0:2.6});}
    if(t<4.4)waterKicked=false;
    let s=-1;photoSteps.forEach((st,k)=>{if(t>=st[0])s=k;});
    if(s!==p.step){p.step=s;toast(photoSteps[s][1],{},3300);eq.querySelectorAll('.t').forEach(el=>{const k=photoSteps.findIndex(x=>x[2]===el.dataset.t);el.classList.toggle('on',k<=s);el.classList.toggle('now',k===s);});}
    eq.style.top=`${sceneTop}px`;
    photoPathAge+=dt;if(photoPathAge>.3){photoPathAge=0;if(!(water.t<18))buildWaterPaths();}
    const emit=(k,rate,from,to)=>{if(t>from&&t<to){debt[k]+=dt*rate;while(debt[k]>=1){debt[k]-=1;spawnFx(KIND[k]);}}};
    emit('spark',26,.4,4.5);emit('co2',18,3.2,15.5);emit('sugar',11,9.8,18);emit('o2',15,13.4,19.2);
    let any=false;
    for(let i=0;i<FX_N;i++){
      const k=fx.kind[i];if(!k){fxAlpha[i]=0;continue;}
      any=true;fx.t[i]+=dt;const u=fx.t[i]/fx.life[i];
      if(k===KIND.spark){leafPoint(fx.leaf[i],fx.pos[i],fx.local[i]);fxAlpha[i]=Math.sin(Math.PI*clamp(u))*.95;}
      else if(k===KIND.co2){
        leafPoint(fx.leaf[i],_f1,fx.local[i]);const e2=smoother(clamp(u*1.1));
        fx.pos[i].copy(fx.start[i]).lerp(_f1,e2);fx.pos[i].x+=Math.sin(fx.t[i]*2.3+i)*.05*(1-e2);fx.pos[i].y+=Math.sin(fx.t[i]*1.7+i*.7)*.04*(1-e2);
        fxRot[i]+=dt*.35;fxAlpha[i]=smooth(0,.2,u)*(1-smooth(.7,1,u))*.9;fxSize[i]=(.26+.22*Math.sin(Math.PI*clamp(u*1.2)))*(1-.7*smooth(.72,1,u));
      }else if(k===KIND.o2){
        if(fx.t[i]<dt*1.5)leafPoint(fx.leaf[i],fx.pos[i],fx.local[i]);
        fx.pos[i].addScaledVector(fx.vel[i],dt);fx.pos[i].x+=Math.sin(fx.t[i]*2.2+i)*dt*.1;fxRot[i]+=dt*.3;
        fxAlpha[i]=smooth(0,.15,u)*(1-smooth(.62,1,u))*.9;fxSize[i]=.16+.26*smooth(0,1,u);
      }else{
        const up=waterPaths.ups[fx.dst[i]%Math.max(1,waterPaths.ups.length)],rp=waterPaths.roots[fx.src[i]%Math.max(1,waterPaths.roots.length)];
        if(!up||!rp){fx.kind[i]=0;fxAlpha[i]=0;continue;}
        fx.d[i]+=dt*.62;const end=up.len+rp.len*fx.stop[i];
        if(fx.d[i]<up.len)sampleAt(up,up.len-fx.d[i],fx.pos[i]);else sampleAt(rp,rp.len-(fx.d[i]-up.len),fx.pos[i]);
        fxAlpha[i]=smooth(0,.25,fx.d[i])*(1-smooth(end-.25,end,fx.d[i]));fxRot[i]+=dt*.5;
        if(fx.d[i]>=end)fx.kind[i]=0;
      }
      if(k!==KIND.sugar&&u>=1){fx.kind[i]=0;fxAlpha[i]=0;}
      const P=fx.pos[i];fxPos[i*3]=P.x;fxPos[i*3+1]=P.y;fxPos[i*3+2]=P.z;
    }
    fxPoints.visible=any;
    fxUniforms.uScale.value=height/(2*Math.tan(camera.fov*Math.PI/360));fxUniforms.uPixelRatio.value=renderer.getPixelRatio();
    ['position','aColor','aAlpha','aSize','aShape','aRot'].forEach(n=>fxGeo.attributes[n].needsUpdate=true);
  }
  // Tags follow one representative particle of each kind.
  const _tp=V();
  function updateFxTags(){
    const pick=(key,alive,posOf)=>{
      const tag=fxTags[key];
      if(tag.index<0||!alive(tag.index)){tag.index=-1;for(let i=0;i<FX_N;i++){const j=(i*37+Math.floor(ambientTime*3))%FX_N;if(alive(j)){tag.index=j;break;}}}
      if(tag.index<0){tag.el.hidden=true;return;}
      posOf(tag.index,_tp);const p=_tp.project(camera);
      if(p.z>1||Math.abs(p.x)>1.05||Math.abs(p.y)>1.05){tag.el.hidden=true;return;}
      tag.el.hidden=false;tag.el.style.left=`${(p.x*.5+.5)*width}px`;tag.el.style.top=`${(-p.y*.5+.5)*height}px`;
    };
    const photoOn=photo.t<21&&!photo.still;
    pick('co2',i=>photoOn&&fx.kind[i]===KIND.co2&&fx.t[i]/fx.life[i]<.75&&fxAlpha[i]>.3,(i,o)=>o.copy(fx.pos[i]));
    pick('o2',i=>photoOn&&fx.kind[i]===KIND.o2&&fx.t[i]/fx.life[i]<.65&&fxAlpha[i]>.3,(i,o)=>o.copy(fx.pos[i]));
    pick('sugar',i=>photoOn&&fx.kind[i]===KIND.sugar&&fxAlpha[i]>.5,(i,o)=>o.copy(fx.pos[i]));
    pick('h2o',i=>water.t<16&&fp.stage[i]===2&&flowAlpha[i]>.5,(i,o)=>o.set(flowPos[i*3],flowPos[i*3+1],flowPos[i*3+2]));
  }
  renderEquation();
  $('photoButton').addEventListener('click',startPhotosynthesis);

  // Growth ruler: a scale bar with centimetre ticks, height and root-depth readouts, and an approximate day.
  const ruler=new T.Group();ruler.visible=false;scene.add(ruler);
  const rulerMat=new T.LineBasicMaterial({color:0x2f5a3d,transparent:true,opacity:.8});
  const rulerGeo=new T.BufferGeometry();rulerGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(200*6),3).setUsage(T.DynamicDrawUsage));
  const rulerLines=new T.LineSegments(rulerGeo,rulerMat);rulerLines.frustumCulled=false;ruler.add(rulerLines);
  const measureLayer=$('measureLayer'),chip=document.createElement('div');chip.className='measure-chip';measureLayer.appendChild(chip);
  const tickLabels=Array.from({length:16},()=>{const e=document.createElement('span');e.className='ruler-tick';measureLayer.appendChild(e);return e;});
  function updateRuler(){
    if(!measureOn){ruler.visible=false;measureLayer.hidden=true;return;}
    ruler.visible=true;measureLayer.hidden=false;
    const P=rig.params,cm=rig.cfg.scaleCm,x=1.45,z=rig.cfg.jZ+.2,topY=Math.max(0,P.top),rootY=P.J.y-P.rootLength;
    const step=rig.kind==='bean'?10:20,unit=step/cm,arr=rulerGeo.attributes.position.array;let k=0;
    const seg=(a,b,c,d,e,f)=>{arr[k++]=a;arr[k++]=b;arr[k++]=c;arr[k++]=d;arr[k++]=e;arr[k++]=f;};
    const hi=Math.max(topY,unit),lo=Math.min(rootY,-unit);
    seg(x,lo,z,x,hi,z);
    let li=0;
    for(let v=Math.ceil(lo/unit)*unit;v<=hi+1e-6&&k<arr.length-12;v+=unit){
      const major=Math.abs(Math.round(v/unit))%2===0;seg(x,v,z,x-(major?.12:.07),v,z);
      if(major&&li<tickLabels.length){const p=V(x-.14,v,z).project(camera);const e=tickLabels[li++];e.hidden=p.z>1;e.style.left=`${(p.x*.5+.5)*width}px`;e.style.top=`${(-p.y*.5+.5)*height}px`;e.textContent=`${Math.abs(Math.round(v/unit*step))}`;}
    }
    seg(x-.3,topY,z,x+.08,topY,z);seg(x-.3,rootY,z,x+.08,rootY,z);
    while(k<arr.length)arr[k++]=0;
    for(;li<tickLabels.length;li++)tickLabels[li].hidden=true;
    rulerGeo.attributes.position.needsUpdate=true;
    const h=Math.round(topY*cm),rd=Math.round(Math.max(0,-rootY)*cm),day=Math.round(keys(rig.cfg.days,growth));
    const p=V(x,hi,z).project(camera);chip.style.left=`${clamp((p.x*.5+.5)*width,70,width-70)}px`;chip.style.top=`${clamp((-p.y*.5+.5)*height-10,sceneTop+30,sceneBottom)}px`;
    chip.innerHTML=`<b>${tr('Height')}</b> ${tr('{n} cm',{n:h})} · <b>${tr('Roots')}</b> ${tr('{n} cm',{n:rd})}<small>${tr('Day ~{n}',{n:day})} · cm</small>`;
  }
  $('measureButton').addEventListener('click',()=>{measureOn=!measureOn;$('measureButton').classList.toggle('active',measureOn);$('measureButton').setAttribute('aria-pressed',String(measureOn));if(measureOn)toast('Growth ruler on · approximate classroom measurements');});
  function snapshot(){
    moveCamera(0);renderFrame(true);
    const url=canvas.toDataURL('image/png'),a=document.createElement('a');
    a.href=url;a.download=`plant-growth-${rig.kind}-stage-${selectedStage+1}.png`;document.body.appendChild(a);a.click();a.remove();
    toast('Snapshot saved');
  }
  $('snapshotButton').addEventListener('click',snapshot);
  $('toolsMore').addEventListener('click',()=>{const open=!$('dockTools').classList.contains('open');$('dockTools').classList.toggle('open',open);$('toolsMore').setAttribute('aria-expanded',String(open));});
  document.addEventListener('pointerdown',e=>{if(!$('dockTools').contains(e.target)){$('dockTools').classList.remove('open');$('toolsMore').setAttribute('aria-expanded','false');}});

  document.addEventListener('keydown',e=>{
    if(document.querySelector('dialog[open]'))return;
    const tagName=e.target.tagName;
    if(tagName==='INPUT'||tagName==='SELECT'||tagName==='TEXTAREA'||e.target.isContentEditable)return;
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    const key=e.key.toLowerCase();
    if(key==='escape'){closeDetail(true);$('dockTools').classList.remove('open');return;}
    if(key===' '){if(tagName==='BUTTON')return;e.preventDefault();togglePlayback();}
    else if(key==='arrowup'||key==='pageup'){e.preventDefault();moveVertical(Math.max(.16,cameraState.wantedRadius*.075));}
    else if(key==='arrowdown'||key==='pagedown'){e.preventDefault();moveVertical(-Math.max(.16,cameraState.wantedRadius*.075));}
    else if(key==='arrowleft'){e.preventDefault();chooseStage(Math.max(0,Math.round(targetGrowth)-1));}
    else if(key==='arrowright'){e.preventDefault();chooseStage(Math.min(7,Math.round(targetGrowth)+1));}
    else if(key==='r'){e.preventDefault();resetCamera();}
    else if(key==='l'){e.preventDefault();toggleLabels();}
    else if(key==='m'){e.preventDefault();$('measureButton').click();}
    else if(key==='o'){e.preventDefault();startPhotosynthesis();}
    else if(key==='p'){e.preventDefault();snapshot();}
    else if(key==='+'||key==='='){e.preventDefault();zoom(.83);}
    else if(key==='-'||key==='_'){e.preventDefault();zoom(1.2);}
    else if(e.target===canvas&&['w','a','s','d'].includes(key)){
      e.preventDefault();if(key==='a')cameraState.wantedTheta-=.13;if(key==='d')cameraState.wantedTheta+=.13;
      if(key==='w')cameraState.wantedPhi=clamp(cameraState.wantedPhi-.1,.12,Math.PI-.12);if(key==='s')cameraState.wantedPhi=clamp(cameraState.wantedPhi+.1,.12,Math.PI-.12);
    }
  });
  let controlsCollapsed=false;
  const panelToggle=$('panelToggle');
  const panelSections=[$('growthControls'),$('speedControl'),$('languageControl'),$('stages'),$('focusDock')];
  function updatePanelToggle(){const label=tr(controlsCollapsed?'Expand controls':'Collapse controls');panelToggle.title=label;panelToggle.setAttribute('aria-label',label);panelToggle.setAttribute('aria-expanded',String(!controlsCollapsed));}
  function setControlsCollapsed(collapsed){
    controlsCollapsed=collapsed;
    if(collapsed&&panelSections.some(section=>section.contains(document.activeElement)))panelToggle.focus({preventScroll:true});
    panelSections.forEach(section=>{section.hidden=collapsed;});
    $('sequence').classList.toggle('is-collapsed',collapsed);$('lab').classList.toggle('controls-collapsed',collapsed);
    $('sequence').classList.remove('dock-opening');updatePanelToggle();resize();
    if(!collapsed&&!reducedMotion)$('sequence').classList.add('dock-opening');
  }
  panelToggle.addEventListener('click',()=>setControlsCollapsed(!controlsCollapsed));
  $('sequence').addEventListener('animationend',()=>$('sequence').classList.remove('dock-opening'));

  function resize(){
    const previousWidth=width,previousHeight=height;
    const rect=viewport.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);
    const dock=$('sequence').getBoundingClientRect();
    $('lab').style.setProperty('--dock-height',`${dock.height}px`);
    const focusRect=$('focusDock').getBoundingClientRect(),focusHidden=$('focusDock').hidden,focusIsAbove=!focusHidden&&focusRect.bottom-rect.top<height*.45;
    sceneTop=width<600?71:83;
    if(focusIsAbove)sceneTop=Math.max(sceneTop,focusRect.bottom-rect.top+14);
    sceneBottom=Math.max(sceneTop+80,Math.min(height-50,(focusHidden||focusIsAbove?dock.top:focusRect.top)-rect.top-19));
    renderer.setPixelRatio(deviceRatio*qualityScale);
    renderer.setSize(width,height,false);camera.aspect=width/height;
    camera.setViewOffset(width,height,0,(height-sceneTop-sceneBottom)/2,width,height);
    camera.updateProjectionMatrix();
    if(followFocus&&(Math.abs(width-previousWidth)>1||Math.abs(height-previousHeight)>1))fitCamera=true;
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);resizeObserver.observe($('sequence'));resizeObserver.observe($('focusDock'));
  window.addEventListener('resize',resize);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stopPlayback();disposed=true;failScene('The browser paused the 3D graphics context. Reload the file to restore the model. Your browser may need more graphics memory.');});

  // ── Living motion: one coherent breeze; leaves, flowers and fruit respond elastically ──
  let lastTime=performance.now(),ambientTime=0,lastGrowth=-1,lastSeed=-1,lastPod=-1,lastUiStage=-1,frameId=0,shadowElapsed=0;
  const sway=new T.Quaternion(),yawAxis=V(0,1,0),pitchAxis=V(1,0,0),rollAxis=V(0,0,1);
  function animateRig(r,dt){
    if(!reducedMotion)ambientTime+=dt;
    const time=ambientTime,canopy=smooth(1.8,3.5,growth);
    const gust=.55+.23*Math.sin(time*.23-.4)+.13*Math.sin(time*.43+1.1);
    if(reducedMotion)r.pivot.rotation.set(0,0,0);
    else r.pivot.rotation.set(Math.sin(time*.52+.4)*.012*canopy*gust,Math.sin(time*.27)*.004*canopy,(Math.sin(time*.61)*.018+Math.sin(time*.29+.8)*.005)*canopy*gust);
    for(const e of r.leaves){
      if(!e.group.visible)continue;
      e.group.quaternion.copy(e.rest);
      if(reducedMotion){e.wind.value=e.wind.velocity=e.pitch.value=e.pitch.velocity=0;e.blade.morphTargetInfluences[1]=0;continue;}
      const phase=e.group.position.y*.65+e.phase*.27,flex=(.3+.7*e.unfold)*e.flex;
      const yaw=settle(e.wind,(Math.sin(time*.77-phase)*.05+Math.sin(time*1.37+phase)*.011)*gust*flex,4.5+e.unfold,dt);
      const pitch=settle(e.pitch,Math.sin(time*.71-phase*.6)*.024*gust*flex,4.7,dt);
      e.group.quaternion.multiply(sway.setFromAxisAngle(yawAxis,yaw));e.group.quaternion.multiply(sway.setFromAxisAngle(pitchAxis,pitch));
      if(e.blade.morphTargetInfluences.length>1)e.blade.morphTargetInfluences[1]=(Math.sin(time*1.19-phase)*.28+Math.sin(time*2.1+phase)*.05)*gust*e.unfold;
    }
    const swing=(obj,rest,i)=>{obj.quaternion.copy(rest);if(!reducedMotion&&obj.visible){obj.quaternion.multiply(sway.setFromAxisAngle(rollAxis,Math.sin(time*.52-i*.9)*.02*gust));obj.quaternion.multiply(sway.setFromAxisAngle(pitchAxis,Math.sin(time*.4-i*.8)*.012*gust));}};
    if(r.kind==='bean')r.sites.forEach((s,i)=>swing(s.pod,s.rest,i));
    else r.trusses.forEach((tr,ti)=>tr.items.forEach((it,i)=>swing(it.group,it.rest,ti*4+i)));
    shadowElapsed+=dt;
    if(!reducedMotion&&canopy>.01&&shadowElapsed>.3){renderer.shadowMap.needsUpdate=true;shadowElapsed=0;}
  }

  // ── Growth particles (root tips, breaking soil, leaf transpiration shimmer, pollen) ──
  const particleBudget=(navigator.hardwareConcurrency||4)<=4?320:512;
  const particlePositions=new Float32Array(particleBudget*3),particleSeeds=new Float32Array(particleBudget*4),particleSlots=new Float32Array(particleBudget);
  for(let i=0;i<particleBudget;i++){particleSlots[i]=i%16;particleSeeds.set([hash3(i,1,57),hash3(i,2,57),hash3(i,3,57),hash3(i,4,57)],i*4);}
  const particleGeometry=new T.BufferGeometry();
  particleGeometry.setAttribute('position',new T.BufferAttribute(particlePositions,3));
  particleGeometry.setAttribute('aSeed',new T.BufferAttribute(particleSeeds,4));
  particleGeometry.setAttribute('aSlot',new T.BufferAttribute(particleSlots,1));
  const particleSites=Array.from({length:16},()=>V()),particleWeights=new Float32Array(16),particleWanted=new Float32Array(16);
  const particleUniforms={uTime:{value:0},uSites:{value:particleSites},uWeights:{value:particleWeights},uScale:{value:1},uPixelRatio:{value:1}};
  const particleMaterial=new T.ShaderMaterial({uniforms:particleUniforms,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,
    vertexShader:`attribute vec4 aSeed;attribute float aSlot;uniform float uTime,uScale,uPixelRatio;uniform vec3 uSites[16];uniform float uWeights[16];varying float vAlpha;varying vec3 vColor;
      void main(){vec3 center=vec3(0.);float weight=0.;
        for(int i=0;i<16;i++){if(abs(aSlot-float(i))<.5){center=uSites[i];weight=uWeights[i];}}
        float age=fract(aSeed.y+uTime*(.1+aSeed.z*.075));float angle=aSeed.x*6.283185+age*.9;float pulse=sin(age*3.141593);pulse*=pulse;
        vec3 p=center;float size=.009+aSeed.w*.012;
        if(aSlot<6.){float r=(.075+aSeed.z*.1)*(1.-age);p+=vec3(cos(angle)*r,sin(angle*1.4)*r*.75,sin(angle)*r);vColor=vec3(.95,.9,.68);vAlpha=pulse*.4*weight;}
        else if(aSlot<8.){float r=(.018+aSeed.z*.12)*age;p+=vec3(cos(angle)*r,.018+(.18+aSeed.z*.1)*age-.3*age*age,sin(angle)*r);vColor=vec3(.42,.31,.19);vAlpha=pulse*.5*weight;}
        else if(aSlot<12.){float r=.06+aSeed.z*.13;p+=vec3(cos(angle)*r,age*.21-.09,sin(angle)*r);vColor=vec3(.8,.9,.62);vAlpha=pulse*.16*weight;size*=.7;}
        else{float r=.018+age*(.06+aSeed.z*.055);p+=vec3(cos(angle)*r,.015+age*.075,sin(angle)*r);vColor=vec3(1.,.82,.3);vAlpha=pulse*.5*weight;size*=.7;}
        vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(size*uScale/max(.07,-mv.z),.7,6.)*uPixelRatio;if(weight<.002||mv.z>0.){vAlpha=0.;gl_PointSize=0.;}}`,
    fragmentShader:`varying float vAlpha;varying vec3 vColor;void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.||vAlpha<.002)discard;float soft=exp(-r*3.8)*(1.-smoothstep(.45,1.,r));gl_FragColor=vec4(vColor*1.6,soft*vAlpha);}`});
  const growthParticles=new T.Points(particleGeometry,particleMaterial);growthParticles.frustumCulled=false;growthParticles.renderOrder=2;scene.add(growthParticles);
  const particleState={growth:0,kind:'bean',activity:0,frameAverage:1/60,slowTime:0,fastTime:0,density:1,quietTime:0};
  function updateGrowthParticles(dt){
    growthParticles.visible=!reducedMotion;
    if(!growthParticles.visible){particleState.growth=growth;particleWeights.fill(0);return;}
    if(particleState.kind!==rig.kind){particleWeights.fill(0);particleState.kind=rig.kind;particleState.growth=growth;particleState.activity=0;}
    const speed=dt>0?Math.max(0,growth-particleState.growth)/dt:0;particleState.growth=growth;
    particleState.activity=mix(particleState.activity,clamp(speed*9),1-Math.exp(-dt*4));
    particleWanted.fill(0);
    for(let i=0;i<6;i++){
      const tube=i<2?rig.root:rig.branches[Math.min(rig.branches.length-1,1+(i-2)*3)].mesh;
      if(!tube.visible)continue;
      tube.pointAt(i===0?.72:i===1?.93:.8,particleSites[i]);rig.model.localToWorld(particleSites[i]);
      particleWanted[i]=smooth(.24,1.2,growth)*(.3+.5*particleState.activity);
    }
    for(let i=6;i<8;i++){
      particleSites[i].set(rig.params.breakX+(i===6?-.05:.05),.006,rig.cfg.jZ);rig.model.localToWorld(particleSites[i]);
      particleWanted[i]=smooth(1.7,2.1,growth)*(1-smooth(2.7,3.1,growth))*particleState.activity;
    }
    const leafPick=[0,2,6,12];
    for(let i=8;i<12;i++){
      const e=rig.leaves[Math.min(rig.leaves.length-1,leafPick[i-8]+(rig.kind==='tomato'?4:0))];
      if(!e||!trulyVisible(e.group))continue;
      particleSites[i].set(0,.56,.025).applyMatrix4(e.group.matrixWorld);
      particleWanted[i]=e.unfold>.15?.35+.3*particleState.activity+water.leafMist*.9:0;
    }
    for(let i=12;i<16;i++){
      const f=rig.flowers[(i-12)*(rig.kind==='tomato'?3:1)];if(!f)continue;const fg=f.group;
      if(!trulyVisible(fg)||fg.scale.x<.2)continue;
      fg.getWorldPosition(particleSites[i]);particleWanted[i]=smooth(.2,.75,fg.scale.x)*.65;
    }
    const blend=1-Math.exp(-dt*5);
    for(let i=0;i<16;i++)particleWeights[i]=mix(particleWeights[i],particleWanted[i],blend);
    particleUniforms.uTime.value+=dt;
    particleUniforms.uScale.value=height/(2*Math.tan(camera.fov*Math.PI/360));
    particleUniforms.uPixelRatio.value=renderer.getPixelRatio();
    particleGeometry.setDrawRange(0,Math.floor(particleBudget*particleState.density/16)*16);
  }
  // Adaptive quality: lower the internal resolution on slow devices, restore it when there is headroom.
  function adaptQuality(dt){
    const s=particleState;s.frameAverage=mix(s.frameAverage,dt,1-Math.exp(-dt*1.5));
    s.slowTime=s.frameAverage>.036?s.slowTime+dt:0;s.fastTime=s.frameAverage<.02?s.fastTime+dt:0;
    if(s.slowTime>2.5){s.slowTime=0;s.density=Math.max(.375,s.density-.125);if(deviceRatio*qualityScale>1.01){qualityScale=Math.max(1/deviceRatio,qualityScale*.8);resize();}}
    if(s.fastTime>8){s.fastTime=0;s.density=Math.min(1,s.density+.125);if(qualityScale<1){qualityScale=Math.min(1,qualityScale*1.15);resize();}}
  }

  // ── Plant switching keeps the current stage so the two species can be compared ──
  const fadeEl=$('plantSwitchFade');
  function applySpeciesUI(){
    document.querySelectorAll('[data-plant]').forEach(b=>{const on=b.dataset.plant===rig.kind;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    document.querySelectorAll('[data-species]').forEach(el=>{el.hidden=el.dataset.species!==rig.kind;});
    localizeSpecies();labelStageButtons();const cur=Math.round(targetGrowth);selectedStage=-1;updateStageText(cur);
    updateAnatomyButtons();syncFocusButtons();updatePlayButton();
  }
  function switchPlant(name){
    if(rig.kind===name)return;
    fadeEl.classList.add('fading');
    setTimeout(()=>{
      stopPhotosynthesis();if(microState.close)microState.close(true);activeKind=name;rig.model.visible=false;rig=rigs[name];rig.model.visible=true;
      inspectedFruit=null;scrollMode='move';syncScrollMode();closeDetail();
      seedOpen=false;podOpen=false;seedOpenValue=podOpenValue=0;seedSpring.value=seedSpring.velocity=podSpring.value=podSpring.velocity=0;
      ['seedOpenButton','podOpenButton'].forEach(id=>{$(id).classList.remove('active');$(id).setAttribute('aria-pressed','false');});
      rig.update(growth,0,0);rig.model.updateMatrixWorld(true);lastGrowth=growth;lastSeed=lastPod=0;
      if(!available(focusMode)){focusMode='whole';}followFocus=true;fitCamera=true;
      applySpeciesUI();renderer.shadowMap.needsUpdate=true;particleWeights.fill(0);
      fadeEl.classList.remove('fading');
      toast(name==='bean'?'Bean plant · Phaseolus vulgaris':'Tomato plant · Solanum lycopersicum');
    },230);
  }
  document.querySelectorAll('[data-plant]').forEach(b=>b.addEventListener('click',()=>switchPlant(b.dataset.plant)));

  function animate(time){
    if(disposed)return;
    frameId=requestAnimationFrame(animate);
    const dt=Math.min((time-lastTime)/1000,.06);lastTime=time;
    if(document.hidden)return;
    if(playing&&playback){
      playback.time+=dt*Number($('speedSelect').value);
      if(playback.time>=0){
        const duration=playback.to===2?6.4:playback.to===3?5.8:playback.to===6?6:5.2;
        const portion=clamp(playback.time/duration);targetGrowth=mix(playback.from,playback.to,smoother(portion));
        if(portion>=1){if(playback.to>=7){targetGrowth=7;stopPlayback();toast(rig.kind==='tomato'?'The tomatoes are ripe · slice one to find the seeds of the next generation.':'The cycle is complete · open a pod to find the next generation.');}else playback={from:playback.to,to:playback.to+1,time:-1.8};}
      }
    }
    if(reducedMotion){growth=targetGrowth;growthTransition=null;}
    else if(growthTransition){
      growthTransition.time+=dt;const fraction=clamp(growthTransition.time/growthTransition.duration);
      growth=mix(growthTransition.from,growthTransition.to,smoother(fraction));
      if(fraction>=1){growth=growthTransition.to;growthTransition=null;}
    }else{growth=mix(growth,targetGrowth,1-Math.exp(-dt*8));if(Math.abs(growth-targetGrowth)<.00008)growth=targetGrowth;}
    if(seedOpen&&!rig.canOpenSeed(growth)){seedOpen=false;$('seedOpenButton').classList.remove('active');$('seedOpenButton').setAttribute('aria-pressed','false');updateAnatomyButtons();}
    if(podOpen&&!rig.canOpenFruit(growth)){podOpen=false;$('podOpenButton').classList.remove('active');$('podOpenButton').setAttribute('aria-pressed','false');updateAnatomyButtons();}
    if(reducedMotion){seedSpring.value=seedOpen?1:0;seedSpring.velocity=0;podSpring.value=podOpen?1:0;podSpring.velocity=0;}
    seedOpenValue=reducedMotion?seedSpring.value:settle(seedSpring,seedOpen?1:0,8.5,dt);
    podOpenValue=reducedMotion?podSpring.value:settle(podSpring,podOpen?1:0,7.5,dt);
    updateWhatIf(dt);updateMore(dt);
    if(Math.abs(lastGrowth-growth)>.00004||lastSeed!==seedOpenValue||lastPod!==podOpenValue){
      rig.update(growth,seedOpenValue,podOpenValue);lastGrowth=growth;lastSeed=seedOpenValue;lastPod=podOpenValue;
      renderer.shadowMap.needsUpdate=true;
      if(!available(focusMode)){focusMode='whole';followFocus=true;fitCamera=true;}
      syncFocusButtons();
      $('seedOpenButton').hidden=!rig.canOpenSeed(growth);$('podOpenButton').hidden=!rig.canOpenFruit(growth);
      if(detailPart&&anatomy[detailPart])$('detailFocus').disabled=!available(anatomy[detailPart].focus);
    }
    animateRig(rig,dt);applyWhatIfLeaves(dt);updateCompare();
    rig.model.updateMatrixWorld(true);
    moveCamera(dt);
    G.sunDirView.value.copy(sun.position).sub(sun.target.position).normalize().transformDirection(camera.matrixWorldInverse);
    updateGrowthParticles(dt);updateWater(dt);updatePhotosynthesis(dt);updateFxTags();adaptQuality(dt);
    const index=Math.round(targetGrowth);updateStageText(index);
    if(lastUiStage!==index){updatePlayButton();lastUiStage=index;}
    if(document.activeElement!==$('growthSlider'))$('growthSlider').value=String(Math.round(targetGrowth*100));
    $('growthSlider').style.setProperty('--progress',`${targetGrowth/7*100}%`);
    $('growthSlider').setAttribute('aria-valuetext',tr('Stage {n} of 8: {name}',{n:index+1,name:stages[index].name}));
    if(!microState.open){updateLabels();updateRuler();updateTropTags();renderFrame();}
  }
  refreshLocalizedScene=()=>{
    updatePanelToggle();syncFocusButtons();updatePlayButton();updateAnatomyButtons();labelText();updateLightButton();renderEquation();tagText();
    if(detailPart&&anatomy[detailPart]){$('detailTitle').textContent=anatomy[detailPart].title;$('detailText').textContent=anatomy[detailPart].text;}
    if(lastToast)$('toast').textContent=tr(lastToast.message,lastToast.values);
    $('fullscreenButton').setAttribute('aria-label',tr(document.fullscreenElement?'Exit full screen':'Enter full screen'));
    canvas.title='';
  };
  refreshLocalizedScene();
  // Start once, after construction. The file makes no network requests.
  resize();rig.update(0,0,0);rigs.tomato.update(0,0,0);rig.model.updateMatrixWorld(true);
  const initialView=focusView('whole');cameraState.target.copy(initialView.center);cameraState.wantedTarget.copy(initialView.center);cameraState.radius=cameraState.wantedRadius=initialView.distance;
  moveCamera(0);syncFocusButtons();applySpeciesUI();ready=true;renderer.shadowMap.needsUpdate=true;
  $('seedOpenButton').hidden=!rig.canOpenSeed(0);$('podOpenButton').hidden=true;
  frameId=requestAnimationFrame(animate);
  document.addEventListener('visibilitychange',()=>{lastTime=performance.now();});
  window.addEventListener('pagehide',()=>cancelAnimationFrame(frameId));
  window.addEventListener('pageshow',e=>{if(e.persisted&&!disposed){lastTime=performance.now();frameId=requestAnimationFrame(animate);}});
