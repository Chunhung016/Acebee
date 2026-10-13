
  // ══════════════════════════════════════════════════════════════════════════
  //  Climbing (thigmotropism) and growing a new plant from a cutting
  // ══════════════════════════════════════════════════════════════════════════
  zhAdd({
    'What if · give it a support stick':'如果 · 给它一根支架','Grow a new plant from a cutting':'用扦插培育新植株',
    'Support stick · as the bean shoot grows it touches the stick; cells on the outer side grow faster, so the stem winds around it and climbs (thigmotropism). Keep growing the plant to watch it climb.':'支架 · 菜豆的茎在生长中碰到支架，外侧细胞长得更快，于是茎缠绕着支架向上攀爬（向触性）。继续让植物生长，观察它攀爬。',
    'Support stick · tomato stems do not twine, so gardeners tie them to the stake as they grow. Touching and brushing also makes tomato stems thicker and stronger.':'支架 · 番茄的茎不会缠绕，所以园丁在它生长时把它绑在支架上。经常触碰和摩擦也会让番茄的茎更粗更结实。',
    'Support stick removed · the shoot unwinds':'移走支架 · 茎松开了',
    'Cutting removed':'移走扦插枝条','Day {n}':'第 {n} 天','Parent plant':'母株','Clone':'克隆植株',
    'Grow the plant until it has several leaves first':'请先让植物长出几片叶子',
    'Step 1 · Choose a healthy side shoot growing between the stem and a leaf':'第 1 步 · 选一根长在茎和叶之间的健康侧芽',
    'Step 2 · Snip it off just below a node, where a leaf joins the stem':'第 2 步 · 在节（叶与茎相连处）的下方剪下',
    'Step 3 · Remove the lowest leaves so they will not rot in the water':'第 3 步 · 摘掉最下面的叶子，以免在水中腐烂',
    'Step 4 · Stand the cut end in a jar of water':'第 4 步 · 把剪口一端插进水里',
    'Step 5 · After a few days, new roots grow from the stem (adventitious roots)':'第 5 步 · 几天后，茎上长出新根（不定根）',
    'Step 6 · Plant the rooted cutting in soil. The new plant is a clone of its parent (asexual reproduction).':'第 6 步 · 把生根的枝条种进土里。新植株是母株的克隆（无性生殖）。'
  });
  whatIf.v.twine=0;whatIf.v.cutting=0;
  WHATIF_BTN.twine='twineButton';WHATIF_BTN.cutting='cuttingButton';
  WHATIF_SPEED.twine=3.5;WHATIF_SPEED_OFF.twine=3;WHATIF_SPEED.cutting=1;WHATIF_SPEED_OFF.cutting=1;
  WHATIF_OFF.twine='Support stick removed · the shoot unwinds';WHATIF_OFF.cutting='Cutting removed';
  WHATIF_TEXT.cutting='Step 1 · Choose a healthy side shoot growing between the stem and a leaf';
  const TWINE_BEAN='Support stick · as the bean shoot grows it touches the stick; cells on the outer side grow faster, so the stem winds around it and climbs (thigmotropism). Keep growing the plant to watch it climb.';
  const TWINE_TOMATO='Support stick · tomato stems do not twine, so gardeners tie them to the stake as they grow. Touching and brushing also makes tomato stems thicker and stronger.';
  // readiness: the stick can go in at any stage (even the seed); a cutting needs a leafy plant
  {const base=shootReady;shootReady=(kind=whatIf.active)=>kind==='twine'?true:kind==='cutting'?cutSource()!==null:base(kind);}
  $('twineButton').addEventListener('click',()=>{WHATIF_TEXT.twine=rig.kind==='bean'?TWINE_BEAN:TWINE_TOMATO;toggleWhatIf('twine');});
  $('cuttingButton').addEventListener('click',()=>{
    if(whatIf.active!=='cutting'&&!cutSource()){toast('Grow the plant until it has several leaves first');return;}
    toggleWhatIf('cutting');});

  // ── Support stick ─────────────────────────────────────────────────────────
  const twBambooTex=(()=>{const c=makeCanvas(64,512),x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,64,0);g.addColorStop(0,'#9c8250');g.addColorStop(.45,'#d6bf82');g.addColorStop(1,'#8d7444');x.fillStyle=g;x.fillRect(0,0,64,512);
    for(let i=0;i<60;i++){x.fillStyle=`rgba(90,70,35,${.08+Math.random()*.12})`;x.fillRect(Math.random()*64,0,1,512);}
    for(const y of [120,300,470]){x.fillStyle='rgba(95,72,36,.75)';x.fillRect(0,y,64,5);x.fillStyle='rgba(240,225,170,.5)';x.fillRect(0,y+5,64,2);}
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapT=T.RepeatWrapping;t.repeat.set(1,2);return t;})();
  const twStake=new T.Mesh(new T.CylinderGeometry(.036,.042,5,18),new T.MeshStandardMaterial({map:twBambooTex,roughness:.6}));
  twStake.castShadow=true;twStake.visible=false;
  const twTieMat=new T.MeshStandardMaterial({color:0x4f8a3a,roughness:.7});
  const twTies=[.85,1.55,2.25,2.95].map(h=>{const m=new T.Mesh(new T.TorusGeometry(.09,.016,8,24),twTieMat);m.rotation.x=Math.PI/2;m.userData.h=h;m.visible=false;return m;});
  const TW_X=.42;let twKind=null,twWasOn=false;
  function updateTwine(dt){
    const tw=whatIf.v.twine;
    if(tw<=0){
      if(twWasOn){twStake.visible=false;twTies.forEach(t=>t.visible=false);plantEnv.twine=0;plantEnv.nutA=0;lastGrowth=-1;twWasOn=false;}
      return;
    }
    twWasOn=true;
    if(twKind!==rig.kind||twStake.parent!==rig.model){rig.model.add(twStake);twTies.forEach(t=>rig.model.add(t));twKind=rig.kind;}
    const P=rig.params,sz=rig.cfg.jZ,bean=rig.kind==='bean';
    twStake.visible=true;twStake.position.set(TW_X,1.2+(1-smooth(0,.35,tw))*4.4,sz);
    const top=P.Craw?P.Craw.y+rig.stemLen:P.C.y;
    const prev=plantEnv.twine+plantEnv.twineFront*.01;
    plantEnv.sx=TW_X;plantEnv.sz=sz;plantEnv.twineMode=bean?0:1;plantEnv.twPhase=Math.PI;
    plantEnv.twine=smooth(.3,.75,tw);
    // everything that has grown so far is wrapped; only the youngest tip is free and circles (circumnutation)
    plantEnv.twineFront=Math.max(.3,top-(bean?.32:.12));
    const nut=bean&&!reducedMotion&&rig.stemLen>.25?.075*smooth(.5,1,tw):0;
    if(nut>0)plantEnv.nutPh+=dt*1.15;
    plantEnv.nutA=nut;
    twTies.forEach(t=>{const show=!bean&&t.userData.h<top-.15;t.visible=show&&tw>.5;if(show){t.scale.setScalar(Math.max(.001,smooth(.5,.8,tw)));t.position.set(TW_X-.05,t.userData.h,sz);}});
    if(nut>0||Math.abs(prev-(plantEnv.twine+plantEnv.twineFront*.01))>1e-5)lastGrowth=-1;
  }

  // ── Cutting: a side shoot → snip → prepare → water → roots → soil ─────────
  function cutSource(){
    if(rig.kind==='bean'){for(let k=1;k<rig.trifoliates.length;k++){const tf=rig.trifoliates[k];if(tf.leaflets[0].group.visible&&tf.leaflets[0].unfold>.85&&rig.trifoliates.filter(t=>t.leaflets[0].group.visible).length>=3)return {d:tf.d,angle:tf.angle,leaf:tf.leaflets[0]};}}
    else{for(let k=2;k<rig.compound.length;k++){const cl=rig.compound[k];const e=cl.leaflets[0].e;if(e.group.visible&&e.unfold>.85)return {d:cl.d,angle:cl.angle,leaf:e};}}
    return null;
  }
  const CUT_SC=.78,JAR_S=.95,JAR_R=.36,JAR_H=1.15,WATER_H=.46/JAR_S,POT_H=.78,POT_SOIL=.7;
  const ctBase=V(2.85,FLOOR_Y,.85),ctPrep=V(3.05,.2,1.35);
  // jar of water
  const ctJar=new T.Group();ctJar.visible=false;scene.add(ctJar);ctJar.position.copy(ctBase);
  const ctGlass=new T.Mesh(new T.CylinderGeometry(JAR_R,JAR_R*.96,JAR_H,48,1,true),membrane(0xe6f6ff,{base:.05,rim:.5,rimCol:0xffffff,rough:.08}));ctGlass.position.y=JAR_H/2;ctGlass.renderOrder=8;ctJar.add(ctGlass);
  const ctGlassBase=new T.Mesh(new T.CylinderGeometry(JAR_R*.96,JAR_R*.96,.05,48),membrane(0xdff2ff,{base:.25,rim:.4}));ctGlassBase.position.y=.025;ctJar.add(ctGlassBase);
  const ctLip=new T.Mesh(new T.TorusGeometry(JAR_R,.014,8,48),membrane(0xffffff,{base:.35,rim:.5}));ctLip.rotation.x=Math.PI/2;ctLip.position.y=JAR_H;ctJar.add(ctLip);
  const ctWater=new T.Mesh(new T.CylinderGeometry(JAR_R*.95,JAR_R*.93,WATER_H,40,1,false),membrane(0x7cc4f0,{base:.14,rim:.3,rimCol:0xcfeaff}));ctWater.position.y=WATER_H/2+.04;ctWater.renderOrder=7;ctJar.add(ctWater);
  // new pot for the rooted cutting
  const ctPot=new T.Group();ctPot.visible=false;scene.add(ctPot);ctPot.position.copy(ctBase);
  const terracotta=new T.MeshStandardMaterial({color:0xb5673f,roughness:.88,side:T.DoubleSide});
  const potBody=new T.Mesh(new T.CylinderGeometry(.44,.32,POT_H,40,1,true),terracotta);potBody.position.y=POT_H/2;potBody.castShadow=true;ctPot.add(potBody);
  const potRim=new T.Mesh(new T.CylinderGeometry(.47,.45,.09,40,1,true),terracotta);potRim.position.y=POT_H-.03;ctPot.add(potRim);
  const potBase=new T.Mesh(new T.CircleGeometry(.32,32),terracotta);potBase.rotation.x=-Math.PI/2;potBase.position.y=.01;ctPot.add(potBase);
  const potSoil=new T.Mesh(new T.CircleGeometry(.42,40),new T.MeshStandardMaterial({color:0x4a3524,roughness:1}));potSoil.rotation.x=-Math.PI/2;potSoil.position.y=POT_SOIL;ctPot.add(potSoil);
  // highlight ring, snip flash and the stub left on the parent
  const ctRing=new T.Mesh(new T.TorusGeometry(.2,.016,8,48),new T.MeshBasicMaterial({color:0xffd84a,transparent:true,depthWrite:false,depthTest:false,toneMapped:false}));ctRing.visible=false;ctRing.renderOrder=12;scene.add(ctRing);
  const ctFlash=new T.Mesh(new T.SphereGeometry(.12,16,12),new T.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false,toneMapped:false}));ctFlash.visible=false;scene.add(ctFlash);
  const ctStub=new T.Group();ctStub.visible=false;
  {const s=new T.Mesh(new T.CylinderGeometry(.022,.024,.07,12),new T.MeshStandardMaterial({color:0x5f8a3e,roughness:.6}));s.position.y=.035;ctStub.add(s);
   const c=new T.Mesh(new T.CircleGeometry(.022,12),new T.MeshStandardMaterial({color:0xd9d2a8,roughness:.8}));c.rotation.x=-Math.PI/2;c.position.y=.071;ctStub.add(c);}
  const ct={t:0,active:false,fade:0,group:null,clusters:[],roots:[],callus:null,bud:null,src:null,step:-1,dropped:false,cut:false,
    attachPos:V(),attachQ:new T.Quaternion(),kind:null};
  const ctTags={day:null,parent:null,clone:null};
  for(const [k,cls] of [['day','d'],['parent','n'],['clone','e']]){const e=document.createElement('span');e.className='trop-tag trop-'+cls;e.hidden=true;$('fxLayer').appendChild(e);ctTags[k]=e;}
  function buildCutting(src){
    if(ct.group)scene.remove(ct.group);
    const g=new T.Group();scene.add(g);ct.group=g;ct.kind=rig.kind;
    const bean=rig.kind==='bean',stemMat=bean?M.stemB:M.stemT,green=bean?[.28,.48,.15]:[.24,.44,.11];
    const col=(t,p,o)=>{o[0]=green[0]*(1+.3*t);o[1]=green[1]*(1+.2*t);o[2]=green[2];};
    const stem=new Tube(stemMat,24,10,g,null,true);
    stem.grow([V(0,0,0),V(.015,.4,.01),V(-.01,.85,-.01),V(.01,1.25,0)],.034,1,.026,{tip:.02,color:col});
    const leafMesh=src.leaf.blade,ws=leafMesh.getWorldScale(V()),sc=(ws.x+ws.y+ws.z)/3*(bean?.62:.9);
    const mkLeaflet=(parent,yaw,s)=>{const mat=cloneEnhanced(src.leaf.mat);mat.color.copy(src.leaf.baseCol||src.leaf.mat.color);
      const h=new T.Group();h.rotation.y=yaw;parent.add(h);const m=new T.Mesh(leafMesh.geometry,mat);m.rotation.x=1.2;m.scale.setScalar(s);m.userData.s0=s;m.castShadow=true;h.add(m);return m;};
    // three leaf nodes: the lowest will be stripped before the cutting goes into water
    ct.clusters=[[.22,.3],[.66,2.6],[1.02,4.7]].map(([y,yaw],i)=>{
      const c=new T.Group();c.position.set(0,y,0);c.rotation.y=yaw;g.add(c);
      const pet=new T.Mesh(new T.CylinderGeometry(.012,.016,.2,8),stemMat.clone());pet.material.vertexColors=false;pet.material.color.setRGB(...green);
      pet.position.set(0,.05,.09);pet.rotation.x=1.05;c.add(pet);
      const end=new T.Group();end.position.set(0,.1,.18);c.add(end);
      const leaflets=(bean?[-.75,0,.75]:[-.6,0,.6]).map(a=>mkLeaflet(end,a,sc*(i===0?.85:1)*(a===0?1:.85)));
      return {group:c,leaflets};
    });
    const budH=new T.Group();budH.position.set(0,1.24,0);g.add(budH);
    ct.bud=mkLeaflet(budH,0,sc*.7);ct.bud.rotation.x=.35;
    ct.callus=new T.Mesh(new T.SphereGeometry(.045,16,10),new T.MeshStandardMaterial({color:0xece4c2,roughness:.7}));ct.callus.scale.set(1,.55,1);g.add(ct.callus);
    ct.roots=[];
    for(let i=0;i<9;i++){
      const a=i*2.39+.3,ys=i<5?.02+i*.012:.2+(i-5)*.02,r=new Tube(M.rootB,24,7,g,null,true),out=V(Math.cos(a),0,Math.sin(a)),len=.28+((i*37)%10)/40;
      const floor=-.05;
      const pts=[out.clone().multiplyScalar(.03).setY(ys),out.clone().multiplyScalar(.1).setY(ys-.05),out.clone().multiplyScalar(.14+len*.35).setY(Math.max(floor,ys-.12-len*.35)),
        out.clone().multiplyScalar(Math.min(.4,.18+len*.6)).setY(Math.max(floor,ys-.2-len*.6)),out.clone().applyAxisAngle(V(0,1,0),.5).multiplyScalar(Math.min(.42,.2+len*.75)).setY(floor)];
      ct.roots.push({tube:r,pts,delay:(i%5)*.05+(i>=5?.12:0)});
    }
    g.scale.setScalar(CUT_SC);
  }
  const STEPS=[[0,'Step 1 · Choose a healthy side shoot growing between the stem and a leaf'],[2.6,'Step 2 · Snip it off just below a node, where a leaf joins the stem'],
    [4.4,'Step 3 · Remove the lowest leaves so they will not rot in the water'],[7.2,'Step 4 · Stand the cut end in a jar of water'],
    [9.8,'Step 5 · After a few days, new roots grow from the stem (adventitious roots)'],[20.5,'Step 6 · Plant the rooted cutting in soil. The new plant is a clone of its parent (asexual reproduction).']];
  const CT_END=25;
  const _ca=V(),_cb=V(),_cc=V(),ctInJar=V(),ctInPot=V(),ctLift=V(),ctTmp=V(),_cq=new T.Quaternion(),_cq2=new T.Quaternion(),_cdir=V(),UPV=V(0,1,0);
  function arc(a,b,u,lift,out){const m=_cc.copy(a).lerp(b,.5);m.y=Math.max(a.y,b.y)+lift;const p=_ca.copy(a).lerp(m,u),q=_cb.copy(m).lerp(b,u);return out.copy(p.lerp(q,u));}
  function attachPose(){
    const src=ct.src;const node=rig.stemPoint(Math.min(src.d,Math.max(0,rig.stemLen-.1)),V());rig.body.localToWorld(node);
    const out=V(Math.cos(src.angle),0,Math.sin(src.angle));const q=rig.body.getWorldQuaternion(new T.Quaternion());out.applyQuaternion(q);
    _cdir.copy(out).multiplyScalar(.55).add(UPV).normalize();
    ct.attachPos.copy(node).addScaledVector(out,.035);ct.attachQ.setFromUnitVectors(UPV,_cdir);
  }
  function updateCutting(dt){
    const want=whatIf.active==='cutting';
    if(want&&!ct.active){
      ct.src=cutSource();if(!ct.src){whatIf.active=null;setWhatIfButtons();return;}
      ct.active=true;ct.t=reducedMotion?CT_END:0;ct.step=0;ct.dropped=false;ct.cut=false;buildCutting(ct.src);attachPose();
      rig.body.add(ctStub);ctStub.visible=false;
    }
    if(!want&&ct.active)ct.active=false;
    ct.fade=want?Math.min(1,ct.fade+dt*2.5):Math.max(0,ct.fade-dt*1.6);
    const show=ct.fade>0&&ct.group;
    if(!show){
      ctJar.visible=ctPot.visible=ctRing.visible=ctFlash.visible=false;ctStub.visible=false;for(const k in ctTags)ctTags[k].hidden=true;
      if(ct.group&&!want){scene.remove(ct.group);ct.group=null;}
      return;
    }
    if(want)ct.t=Math.min(CT_END,ct.t+dt);
    const t=ct.t,f=smoother(ct.fade),g=ct.group;
    // narration
    if(want){let s=-1;STEPS.forEach((st,i)=>{if(t>=st[0])s=i;});if(s!==ct.step&&s>0){ct.step=s;toast(STEPS[s][1],{},s===5?5200:3600);}else if(s===0)ct.step=0;}
    // 1 · the side shoot grows in the leaf axil and is highlighted
    if(t<3.1){attachPose();g.position.copy(ct.attachPos);g.quaternion.copy(ct.attachQ);g.scale.setScalar(CUT_SC*Math.max(.001,smooth(0,1.2,t))*f);}
    ctRing.visible=t<3&&!reducedMotion;
    if(ctRing.visible){ctRing.position.copy(ct.attachPos);ctRing.quaternion.copy(ct.attachQ).multiply(_cq.setFromAxisAngle(V(1,0,0),Math.PI/2));
      const pulse=.5+.5*Math.sin(t*6);ctRing.scale.setScalar(1+pulse*.25);ctRing.material.opacity=smooth(.6,1.2,t)*(1-smooth(2.6,3,t))*(.5+.5*pulse);}
    // 2 · snip
    if(t>=3&&!ct.cut){ct.cut=true;ctStub.visible=true;
      const local=rig.body.worldToLocal(ct.attachPos.clone());ctStub.position.copy(local);ctStub.quaternion.copy(rig.body.getWorldQuaternion(_cq2).invert().multiply(_cq.copy(ct.attachQ)));}
    ctStub.visible=ct.cut&&f>.01;ctStub.scale.setScalar(Math.max(.001,f));
    ctFlash.visible=t>2.9&&t<3.4&&!reducedMotion;
    if(ctFlash.visible){ctFlash.position.copy(ct.attachPos);const k=smooth(2.9,3.4,t);ctFlash.scale.setScalar(.3+k*1.4);ctFlash.material.opacity=(1-k)*.9;}
    // 3 · move to the bench and strip the lowest leaves (they fall under gravity)
    const up=_cq2.identity();
    if(t>=3.1&&t<7.2){const u=smoother(smooth(3.1,4.4,t));arc(ct.attachPos,ctPrep,u,.5,g.position);g.quaternion.copy(ct.attachQ).slerp(up,u);g.scale.setScalar(CUT_SC*f);}
    if(t>=5.3&&!ct.dropped){ct.dropped=true;const c0=ct.clusters[0];g.updateMatrixWorld(true);
      if(!reducedMotion)c0.leaflets.forEach(m=>{detachLeaf({blade:m,mat:m.material},new T.Color(1,1,1));});
      c0.group.visible=false;}
    // 4 · into the jar
    const inJar=ctInJar.copy(ctBase).add(ctTmp.set(0,.07,0));
    if(t>=7.2&&t<20.5){const u=smoother(smooth(7.2,9,t));arc(ctPrep,inJar,u,.35,g.position);g.quaternion.identity();g.scale.setScalar(CUT_SC*f);}
    // 5 · days pass: callus, then roots from the submerged node and cut end, then a new leaf
    const day=t<9.8?0:t<20.5?smooth(9.8,20.5,t)*14:14+smooth(20.5,CT_END,t)*7;
    ct.callus.scale.set(1,.55,1).multiplyScalar(Math.max(.001,smooth(1,3.5,day)));
    ct.roots.forEach(r=>{const a=smooth(3.5+r.delay*20,14,day);r.tube.grow(r.pts,.016,a,.006,{tip:.01,color:(tt,pp,o)=>{o[0]=.96;o[1]=.95;o[2]=.88;}});});
    ct.bud.scale.setScalar(Math.max(.001,smooth(8,20,day)*ct.bud.userData.s0));
    // 6 · transplant into soil
    const potT=smooth(20.5,21.6,t);
    ctJar.visible=t>6.4&&t<22.6;ctJar.scale.setScalar(Math.max(.001,smooth(6.4,7.2,t)*(1-smooth(21.6,22.6,t))*f)*JAR_S);
    ctPot.visible=t>20.6;ctPot.scale.setScalar(Math.max(.001,smooth(20.6,21.4,t)*f));
    if(t>=20.5){const inPot=ctInPot.copy(ctBase).add(ctTmp.set(0,POT_SOIL-.32,0));const lifted=ctLift.copy(inJar).add(ctTmp.set(0,1.3,0));
      const u=smoother(smooth(21.4,23.4,t));if(t<21.4)g.position.copy(inJar).lerp(lifted,smoother(smooth(20.5,21.4,t)));else arc(lifted,inPot,u,.1,g.position);
      g.quaternion.identity();g.scale.setScalar(CUT_SC*f*(1+.12*smooth(23,CT_END,t)));}
    // tags
    const micro=microState.open;
    placeTag(ctTags.day,_cc.copy(ctBase).add(V(.62,.95,0)),!micro&&t>9.8);ctTags.day.textContent=tr('Day {n}',{n:Math.round(day)});
    const tipP=rig.stem.visible?rig.stem.localToWorld(rig.stem.pointAt(1,V())):rig.model.localToWorld(rig.params.C.clone());
    placeTag(ctTags.parent,tipP,!micro&&t>22.5);ctTags.parent.textContent=tr('Parent plant');
    placeTag(ctTags.clone,g.localToWorld(V(0,1.45,0)),!micro&&t>22.5);ctTags.clone.textContent=tr('Clone');
  }
  function updateMore(dt){updateTwine(dt);updateCutting(dt);}
  // keep the jar and the new pot in view
  {const base=whatIfView;whatIfView=part=>{
    if(part==='whole'&&whatIf.active==='cutting'&&ct.group&&ct.t<23.6){
      // the camera follows the hands-on steps, then pulls back to show parent and clone together
      const t=ct.t;let c,span;
      if(t<4.3){c=ct.attachPos.clone();span=1.9;}
      else if(t<7.3){c=ctPrep.clone().add(V(0,.45,0));span=2.1;}
      else if(t<20.6){c=ctBase.clone().add(V(0,.62,0));span=1.9;}
      else{c=ctBase.clone().add(V(0,.95,0));span=2.6;}
      return {center:c,distance:fitDistance(span,span*1.25)};
    }
    if(part==='whole'&&(whatIf.active==='cutting'||ct.fade>.05)&&tipS.x<.5){
      const top=Math.max(.5,rig.params.height+.4);return {center:V(.85,(top-3.2)/2,.35),distance:fitDistance(top+3.2+1.1,7.8)};}
    return base(part);};}
