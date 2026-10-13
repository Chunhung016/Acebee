
  // ══════════════════════════════════════════════════════════════════════════
  //  "What if?" experiments: no water · no light · light from one side
  //  with a small physics layer: turgor springs for wilting, rigid-body falling leaves
  // ══════════════════════════════════════════════════════════════════════════
  zhAdd({
    'What if · no water':'如果 · 没有水','What if · no light':'如果 · 没有光','What if · light from one side':'如果 · 光从一侧照来',
    'No water · cells lose water and go limp, so the leaves wilt and droop. Stomata close to save water, growth stops, and the oldest leaves dry up and fall.':
      '缺水 · 细胞失水变软，叶片萎蔫下垂。气孔关闭以减少失水，植物停止生长，最老的叶片枯黄脱落。',
    'No light · the plant is shut inside a dark box, so it cannot photosynthesise. It stretches tall and thin searching for light, turns pale, and drops its oldest leaves (etiolation).':
      '没有光 · 植物被关在黑暗的箱子里，无法进行光合作用。它长得又高又细去寻找光，颜色变得苍白，并掉落最老的叶片（黄化现象）。',
    'Light from one side · cells on the shaded side grow longer, so the shoot bends toward the lamp (phototropism).':'光从一侧照来 · 背光一侧的细胞长得更长，所以茎向台灯弯曲（向光性）。',
    'Light is back · the box is lifted, new leaves turn green and the stem stops stretching':'光线恢复 · 移开箱子，新叶重新变绿，茎不再徒长',
    'Lamp removed · the shoot slowly straightens up':'移走台灯 · 茎慢慢恢复直立',
    'Grow the plant to the seedling stage first':'请先让植物长到幼苗阶段',
    'No light, no photosynthesis · switch the light back on to see it':'没有光就没有光合作用 · 请先恢复光照','What if?':'假如…？',
    'What if · the pot is tipped over':'如果 · 花盆倒下了','What if · water on one side only':'如果 · 只有一侧有水','Compare with a normal plant':'与正常植株对比',
    'Pot tipped over · gravity now pulls sideways. The shoot curves up, away from gravity, and the root curves down toward it (gravitropism).':'花盆倒下 · 重力现在从侧面拉动植物。茎背离重力向上弯曲，根顺着重力向下弯曲（向重力性）。',
    'Water on one side · a buried clay pot (olla) wets only the left side. Roots grow toward the moist soil and branch more there (hydrotropism).':'只有一侧有水 · 埋在土里的陶罐只湿润左侧土壤。根向湿润的土壤生长，并在那里长出更多侧根（向水性）。',
    'Pot set upright again · the shoot and root slowly straighten':'花盆重新立起 · 茎和根慢慢恢复直立',
    'Soil watered evenly again':'土壤重新均匀浇水',
    'Grow roots first · choose the germination stage or later':'请先长出根 · 请选择萌发阶段或之后',
    'Ghost outline = the same plant grown normally':'虚影 = 正常生长的同一植株',
    'Compare shows a ghost of the normal plant during a What if? experiment':'开始“假如”实验后，将显示正常植株的虚影以作对比',
    'Normal plant':'正常植株','Experiment':'实验植株','Gravity':'重力','Moist soil':'湿润土壤','Dry soil':'干燥土壤'
  });
  const whatIf={active:null,v:{drought:0,dark:0,lamp:0,gravity:0,hydro:0},wasOn:false,leafDirty:false,shedTimer:0,shed:0};
  const WHATIF_TEXT={drought:'No water · cells lose water and go limp, so the leaves wilt and droop. Stomata close to save water, growth stops, and the oldest leaves dry up and fall.',
    dark:'No light · the plant is shut inside a dark box, so it cannot photosynthesise. It stretches tall and thin searching for light, turns pale, and drops its oldest leaves (etiolation).',
    lamp:'Light from one side · cells on the shaded side grow longer, so the shoot bends toward the lamp (phototropism).',
    gravity:'Pot tipped over · gravity now pulls sideways. The shoot curves up, away from gravity, and the root curves down toward it (gravitropism).',
    hydro:'Water on one side · a buried clay pot (olla) wets only the left side. Roots grow toward the moist soil and branch more there (hydrotropism).'};
  const WHATIF_OFF={dark:'Light is back · the box is lifted, new leaves turn green and the stem stops stretching',lamp:'Lamp removed · the shoot slowly straightens up',gravity:'Pot set upright again · the shoot and root slowly straighten',hydro:'Soil watered evenly again'};
  const WHATIF_SPEED={dark:4.5,gravity:7,hydro:6},WHATIF_SPEED_OFF={drought:4.5,gravity:4.5,hydro:4};
  const WHATIF_BTN={drought:'noWaterButton',dark:'noLightButton',lamp:'sideLightButton',gravity:'gravityButton',hydro:'hydroButton'};
  const veil=document.createElement('div');veil.className='env-veil';viewport.insertBefore(veil,canvas);

  // ── Physics helpers ───────────────────────────────────────────────────────
  // Damped spring (semi-implicit Euler, sub-stepped): used for turgor, stem slump and the phototropic bend.
  function spring(s,target,k,zeta,dt){
    const n=Math.max(1,Math.ceil(dt/.008)),h=dt/n,c=2*zeta*Math.sqrt(k);
    for(let i=0;i<n;i++){s.v+=(k*(target-s.x)-c*s.v)*h;s.x+=s.v*h;}
    return s.x;
  }
  const SOIL_R=2.08,FLOOR_Y=-3.165;
  const soilTopAt=(x,z)=>-.025+.115*(noise3(x*3.8,9,z*3.8)-.5)+.025*Math.sin(x*5+z*3);
  function groundAt(x,z){
    if(soilMode!=='hidden'&&z<-.17&&x*x+(z+.17)*(z+.17)<SOIL_R*SOIL_R)return soilTopAt(x,z+.17)+.004;
    return FLOOR_Y+.004;
  }
  // Rigid-body leaves: gravity, quadratic air drag on a thin plate (normal ≫ tangential), aerodynamic
  // pitching torque (flutter), angular damping, ground contact with restitution, Coulomb friction and sleep.
  const fallen=[];
  const _fv=V(),_fn=V(),_fvn=V(),_fvt=V(),_ft=V(),_fw=new T.Quaternion(),_fp=V(),_fq=new T.Quaternion(),_fs=V(),_fup=V(0,1,0);
  function detachLeaf(lf,tint){
    const blade=lf.blade,geo=blade.geometry;
    if(!geo.boundingBox)geo.computeBoundingBox();
    const bb=geo.boundingBox,size=bb.getSize(V()),center=bb.getCenter(V());
    blade.updateWorldMatrix(true,false);
    blade.matrixWorld.decompose(_fp,_fq,_fs);
    const mat=cloneEnhanced(lf.mat);mat.color.copy(lf.mat.color).multiply(tint);mat.emissive.setRGB(0,0,0);
    const mesh=new T.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;
    if(blade.morphTargetInfluences){mesh.morphTargetInfluences=blade.morphTargetInfluences.slice();mesh.morphTargetDictionary=blade.morphTargetDictionary;}
    mesh.scale.copy(_fs);mesh.position.copy(center).multiply(_fs).negate();
    const body=new T.Group();body.add(mesh);scene.add(body);
    body.position.copy(center).applyMatrix4(blade.matrixWorld);body.quaternion.copy(_fq);
    const ax=size.x<=size.y&&size.x<=size.z?0:size.y<=size.z?1:2;
    const nLocal=V(ax===0?1:0,ax===1?1:0,ax===2?1:0);
    const s=(_fs.x+_fs.y+_fs.z)/3,ext=[size.x*_fs.x,size.y*_fs.y,size.z*_fs.z];
    const half=V(...ext).multiplyScalar(.5);
    // probe points for contact: blade corners in local space
    const [ia,ib]=[0,1,2].filter(i=>i!==ax),hv=[half.x,half.y,half.z],probes=[];
    for(const sa of [-1,-.3,.3,1])for(const sb of [-1,1]){const p=V();p.setComponent(ia,sa*hv[ia]*.9);p.setComponent(ib,sb*hv[ib]*.9);probes.push(p);}
    fallen.push({body,mesh,mat,nLocal,probes,v:V((Math.random()-.5)*.1,-.05,(Math.random()-.5)*.1),w:V((Math.random()-.5)*1.2,(Math.random()-.5)*1.2,(Math.random()-.5)*1.2),
      area:Math.max(.02,ext.filter((_,i)=>i!==ax).reduce((a,b)=>a*b,1)),sleeping:false,rest:0,fade:1,removing:false,seed:Math.random()*100,t:0,kind:rig.kind});
    lf.fallen=true;lf.regrow=0;
  }
  function stepFallen(dt){
    for(let i=fallen.length-1;i>=0;i--){
      const f=fallen[i];
      if(f.kind!==rig.kind){f.body.visible=false;}else f.body.visible=true;
      if(f.removing){f.fade=Math.max(0,f.fade-dt/1.6);f.body.scale.setScalar(Math.max(.001,f.fade));f.mat.opacity=f.fade;f.mat.transparent=true;
        if(f.fade<=0){scene.remove(f.body);f.mat.dispose();fallen.splice(i,1);}continue;}
      if(f.sleeping||reducedMotion){if(reducedMotion&&!f.sleeping){f.body.position.y=groundAt(f.body.position.x,f.body.position.z)+.01;f.sleeping=true;}continue;}
      f.t+=dt;
      const n=Math.max(1,Math.ceil(dt/.006)),h=dt/n,G=5.5,Kn=9/Math.sqrt(f.area),Kt=.35,Kpitch=5.2,Kalign=2.4,dampW=2.2;
      for(let k=0;k<n;k++){
        const B=f.body;
        _fn.copy(f.nLocal).applyQuaternion(B.quaternion);
        const vn=f.v.dot(_fn);_fvn.copy(_fn).multiplyScalar(vn);_fvt.copy(f.v).sub(_fvn);
        const vt=_fvt.length();
        // forces (unit mass)
        f.v.y-=G*h;
        f.v.addScaledVector(_fn,-Kn*vn*Math.abs(vn)*h);
        f.v.addScaledVector(_fvt,-Kt*vt*h);
        // gentle air turbulence
        f.v.x+=Math.sin(f.t*1.7+f.seed)*.22*h;f.v.z+=Math.cos(f.t*1.3+f.seed*1.7)*.22*h;
        // torques: flutter (centre of pressure ahead of centre of mass) + restoring toward a level plate
        if(vt>1e-4){_ft.crossVectors(_fn,_fvt).multiplyScalar(-Kpitch*vn/Math.max(.2,vt)*Math.min(1,vt)*h);f.w.add(_ft);}
        const nUp=_fn.y>=0?1:-1;_ft.crossVectors(_fn.clone().multiplyScalar(nUp),_fup).multiplyScalar(Kalign*Math.min(1,f.v.length()*2)*h);f.w.add(_ft);
        f.w.y+=Math.sin(f.t*2.1+f.seed)*.6*h;
        f.w.multiplyScalar(Math.exp(-dampW*h));
        // integrate
        B.position.addScaledVector(f.v,h);
        const wl=f.w.length();if(wl>1e-6){_fw.setFromAxisAngle(_ft.copy(f.w).divideScalar(wl),wl*h);B.quaternion.premultiply(_fw).normalize();}
        // contact
        let pen=0,cx=0,cz=0;
        for(const p of f.probes){_fv.copy(p).applyQuaternion(B.quaternion).add(B.position);const g=groundAt(_fv.x,_fv.z);const d=g-_fv.y;if(d>pen){pen=d;cx=_fv.x;cz=_fv.z;}}
        const gc=groundAt(B.position.x,B.position.z);if(gc-B.position.y+.004>pen)pen=gc-B.position.y+.004;
        if(pen>0){
          B.position.y+=pen;
          if(f.v.y<0)f.v.y*=-.12;
          f.v.x*=Math.exp(-9*h);f.v.z*=Math.exp(-9*h);f.w.multiplyScalar(Math.exp(-7*h));
          // settle flat onto the ground
          _fn.copy(f.nLocal).applyQuaternion(B.quaternion);const up=_fn.y>=0?_fup:V(0,-1,0);
          _fq.setFromUnitVectors(_fn,up);_fw.identity().slerp(_fq,Math.min(1,5*h));B.quaternion.premultiply(_fw).normalize();
          f.rest+=h;
          if(f.rest>.6&&f.v.lengthSq()<.004&&f.w.lengthSq()<.01){f.sleeping=true;break;}
        }else f.rest=0;
      }
    }
  }
  function clearFallen(){fallen.forEach(f=>f.removing=true);}

  // ── The lamp: lp_head aims at the plant; its lp_beam starts at the lp_bulb ──
  const lamp=new T.Group();lamp.visible=false;scene.add(lamp);
  const lp_lampMetal=new T.MeshStandardMaterial({color:0x39413c,roughness:.35,metalness:.7});
  const lp_pole=new T.Mesh(new T.CylinderGeometry(.03,.03,1,12),lp_lampMetal);lamp.add(lp_pole);
  const lp_baseDisc=new T.Mesh(new T.CylinderGeometry(.28,.32,.06,28),lp_lampMetal);lamp.add(lp_baseDisc);
  const lp_arm=new T.Mesh(new T.CylinderGeometry(.025,.025,1,10),lp_lampMetal);lamp.add(lp_arm);
  const lp_head=new T.Group();lamp.add(lp_head);
  const lp_shadeGeo=new T.CylinderGeometry(.1,.32,.4,40,1,true);lp_shadeGeo.rotateX(-Math.PI/2);
  const lp_shade=new T.Mesh(lp_shadeGeo,new T.MeshStandardMaterial({color:0x2f5a40,roughness:.4,metalness:.3,side:T.DoubleSide}));lp_shade.position.z=.02;lp_head.add(lp_shade);
  const lp_capGeo=new T.SphereGeometry(.1,20,10,0,TAU,0,Math.PI/2);lp_capGeo.rotateX(-Math.PI/2);
  const lp_cap=new T.Mesh(lp_capGeo,lp_shade.material);lp_cap.position.z=-.18;lp_head.add(lp_cap);
  const lp_bulb=new T.Mesh(new T.SphereGeometry(.11,20,14),new T.MeshBasicMaterial({color:0xfff4d6,toneMapped:false}));lp_bulb.position.z=.08;lp_head.add(lp_bulb);
  const lp_beamGeo=new T.CylinderGeometry(.27,1.35,1,48,1,true);lp_beamGeo.translate(0,-.5,0);lp_beamGeo.rotateX(-Math.PI/2);
  const lp_beam=new T.Mesh(lp_beamGeo,new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
    blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.OneFactor,blendDst:T.OneFactor,blendSrcAlpha:T.OneFactor,blendDstAlpha:T.OneMinusSrcAlphaFactor,uniforms:{uI:{value:0}},
    vertexShader:'varying vec2 vUv;varying vec3 vN,vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalMatrix*normal;vV=-mv.xyz;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float uI;varying vec2 vUv;varying vec3 vN,vV;void main(){float e=pow(abs(dot(normalize(vN),normalize(vV))),1.6);float along=mix(.18,1.,pow(vUv.y,1.4))*smoothstep(0.,.18,vUv.y);float a=uI*e*along*.2;gl_FragColor=vec4(vec3(1.,.9,.62)*a,a*.7);}'}));
  lp_beam.position.z=.1;lp_head.add(lp_beam);
  const lp_spot=new T.SpotLight(0xffe2b4,0,0,.62,.55,1.4);lp_head.add(lp_spot);
  const lp_spotTarget=new T.Object3D();scene.add(lp_spotTarget);lp_spot.target=lp_spotTarget;
  const lampPos=V(),aimPt=V();
  function placeLamp(){
    const P=rig.params,top=Math.max(.9,P.top),z=rig.cfg.jZ+.1;
    const y=clamp(top*.72+.45,1.1,3.6),x=2.55;
    lampPos.set(x,y,z);aimPt.set(.2,Math.max(.35,top*.5),rig.cfg.jZ);
    lp_pole.position.set(x+.32,(y+FLOOR_Y)/2,z);lp_pole.scale.y=y-FLOOR_Y;lp_baseDisc.position.set(x+.32,FLOOR_Y+.03,z);
    lp_arm.position.set(x+.16,y+.02,z);lp_arm.rotation.z=Math.PI/2;lp_arm.scale.y=.32;
    lp_head.position.copy(lampPos);lp_head.lookAt(aimPt);lp_head.scale.setScalar(1.2);
    const dist=lampPos.distanceTo(aimPt);lp_beam.scale.set(1,1,Math.max(.5,(dist+.6)/1.2));
    lp_spotTarget.position.copy(aimPt);
  }
  // ── The dark box: interior faces only (BackSide), so it never hides the plant from the camera ──
  const boxTex=(()=>{const c=makeCanvas(256,256),x=c.getContext('2d');x.fillStyle='#4a3a28';x.fillRect(0,0,256,256);
    for(let i=0;i<900;i++){x.fillStyle=`rgba(${30+Math.random()*60},${22+Math.random()*40},${12+Math.random()*25},${.15+Math.random()*.25})`;x.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*3,6+Math.random()*30);}
    for(let i=0;i<14;i++){x.fillStyle='rgba(20,14,8,.25)';x.fillRect(0,i*18+Math.random()*6,256,2);}
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);return t;})();
  const boxMat=new T.MeshStandardMaterial({map:boxTex,color:0x8a7862,roughness:.95,side:T.BackSide,transparent:true,opacity:0,depthWrite:false});
  const darkBox=new T.Mesh(new T.BoxGeometry(1,1,1),[boxMat,boxMat,boxMat,new T.MeshBasicMaterial({visible:false}),boxMat,boxMat]);
  darkBox.visible=false;darkBox.receiveShadow=false;scene.add(darkBox);
  const boxLight=new T.PointLight(0x9fb6c8,0,6,1.6);scene.add(boxLight);
  function placeBox(){
    const top=Math.max(1.6,rig.params.top+.9);
    darkBox.scale.set(3.6,top+.05,3.2);darkBox.position.set(0,top/2-.03,rig.cfg.jZ-.35);
    boxLight.position.set(-.8,top*.8,rig.cfg.jZ+1.1);
  }

  function setWhatIfButtons(){for(const k in WHATIF_BTN){const b=$(WHATIF_BTN[k]);const on=whatIf.active===k;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));}}
  function shootReady(kind=whatIf.active){return kind==='hydro'?rig.params.rootLength>.55:(rig.stemLen>.08||growth>2.65);}
  function toggleWhatIf(kind){
    if(whatIf.active===kind){
      whatIf.active=null;setWhatIfButtons();clearFallen();resetDying();
      if(kind==='drought')startWatering();
      else toast(WHATIF_OFF[kind],{},3600);
      return;
    }
    if(!shootReady(kind)){toast(kind==='hydro'?'Grow roots first · choose the germination stage or later':'Grow the plant to the seedling stage first');return;}
    if(microState.open)closeMicroscope(true);
    stopPhotosynthesis();clearFallen();
    if(kind==='drought'){water.armed=true;water.t=99;water.moisture=0;water.front=0;}
    whatIf.active=kind;whatIf.shedTimer=0;whatIf.shed=0;setWhatIfButtons();
    toast(WHATIF_TEXT[kind],{},5600);
    if(!reducedMotion){if(kind==='lamp'||kind==='gravity'||kind==='hydro')aimCamera(.02);}
    if(kind==='hydro')focusOn('root');else{focusMode='whole';followFocus=true;fitCamera=true;syncFocusButtons();}
  }
  for(const k in WHATIF_BTN)$(WHATIF_BTN[k]).addEventListener('click',()=>toggleWhatIf(k));

  // Leaf state: always restored to the rig's own values before each rig update, so effects never compound.
  const _qp=new T.Quaternion(),_qw=new T.Quaternion(),_qa=new T.Quaternion(),_dv=V(),_wax=V(),DOWN=V(0,-1,0);
  const leafTint=new T.Color(),stemTint=new T.Color(),dryTint=new T.Color(1.9,.92,.32),paleTint=new T.Color(2.3,1.55,.5);
  function restoreLeafBase(r){for(const e of r.leaves)if(e.baseCol){e.mat.color.copy(e.baseCol);e.group.scale.copy(e.baseScale);}}
  function captureLeafBase(r){for(const e of r.leaves){e.baseCol=(e.baseCol||new T.Color()).copy(e.mat.color);e.baseScale=(e.baseScale||V()).copy(e.group.scale);}}
  for(const r of Object.values(rigs)){const orig=r.update;r.update=(...a)=>{restoreLeafBase(r);orig(...a);captureLeafBase(r);};captureLeafBase(r);}
  const turgor={x:0,v:0},slump={x:0,v:0},bend={x:0,v:0},stretch={x:0,v:0},tipS={x:0,v:0},gbend={x:0,v:0},hyd={x:0,v:0};
  function updateWhatIf(dt){
    const v=whatIf.v;let changed=false;
    for(const k in v){
      const target=whatIf.active===k?1:0;if(v[k]===target)continue;
      const speed=reducedMotion?99:(target?1/(WHATIF_SPEED[k]||3.5):1/(WHATIF_SPEED_OFF[k]||3.5));
      v[k]=target>v[k]?Math.min(1,v[k]+dt*speed):Math.max(0,v[k]-dt*speed);changed=true;
    }
    if(whatIf.active&&!shootReady()){whatIf.active=null;setWhatIfButtons();clearFallen();}
    // springs: turgor pressure holds leaves up; when water is gone the spring softens and gravity wins.
    const dry=v.drought;
    const oldDroop=turgor.x,oldSlump=slump.x,oldBend=bend.x,oldStretch=stretch.x,oldTip=tipS.x,oldG=gbend.x,oldH=hyd.x;
    if(reducedMotion){turgor.x=smooth(0,1,dry);slump.x=turgor.x;bend.x=smooth(0,1,v.lamp);stretch.x=smooth(0,1,v.dark);tipS.x=Math.min(1,v.gravity/.12);gbend.x=smooth(.15,1,v.gravity);hyd.x=smooth(0,1,v.hydro);turgor.v=slump.v=bend.v=stretch.v=tipS.v=gbend.v=hyd.v=0;}
    else{
      spring(turgor,smooth(0,1,dry),dry>turgor.x?5:26,dry>turgor.x?.55:.32,dt);
      spring(slump,smooth(.15,1,dry),dry>slump.x?3.2:14,dry>slump.x?.7:.4,dt);
      spring(bend,smooth(0,1,v.lamp),2.2,.9,dt);
      spring(stretch,smooth(0,1,v.dark),2.6,1,dt);
      spring(tipS,Math.min(1,v.gravity/.12),16,.42,dt);spring(gbend,smooth(.15,1,v.gravity),2.4,1,dt);spring(hyd,smooth(0,1,v.hydro),2.4,1,dt);
    }
    const moving=Math.abs(turgor.x-oldDroop)+Math.abs(slump.x-oldSlump)+Math.abs(bend.x-oldBend)+Math.abs(stretch.x-oldStretch)+Math.abs(tipS.x-oldTip)+Math.abs(gbend.x-oldG)+Math.abs(hyd.x-oldH)>1e-5;
    const on=Object.values(v).some(x=>x>0)||Math.abs(turgor.x)+Math.abs(slump.x)+Math.abs(bend.x)+Math.abs(stretch.x)+Math.abs(tipS.x)+Math.abs(gbend.x)+Math.abs(hyd.x)>.002||fallen.length>0;
    stepFallen(dt);
    if(!on&&!whatIf.wasOn)return;
    whatIf.wasOn=on;
    const lightD=smooth(0,.45,v.dark),lightL=smooth(0,.45,v.lamp);
    if(changed||moving){
      plantEnv.droop=Math.max(0,slump.x);plantEnv.stretch=Math.max(0,stretch.x);plantEnv.bend=Math.max(0,bend.x)*1.4;
      plantEnv.gravity=Math.max(0,gbend.x);plantEnv.rootGrav=Math.max(0,gbend.x);plantEnv.hydro=Math.max(0,hyd.x);
      setPotTip(tipS.x);wetU.uSide.value=smooth(0,.35,v.hydro);
      lastGrowth=-1;
      wetU.uDry.value=smooth(0,.6,v.drought);
      const e=Math.max(0,stretch.x);stemTint.setRGB(1+.3*e,1+.22*e,1-.3*e);M.stemB.color.copy(stemTint);M.stemT.color.copy(stemTint);
      const envK=(1-.9*lightD)*(1-.5*lightL);
      for(const m of envMaterials)m.envMapIntensity=(m.userData.envBase??1)*mood.envI*envK;
      veil.style.opacity=String(Math.min(1,lightD*.96+lightL*.6));
      renderer.shadowMap.needsUpdate=true;
    }
    // Light sources. In the dark box only a faint "viewing" light remains so students can still see the plant.
    hemi.intensity=mood.hemiI*(1-.82*lightD)*(1-.55*lightL);
    rim.intensity=mood.rimI*(1-.9*lightD)*(1-.6*lightL);fill.intensity=mood.fillI*(1-.9*lightD)*(1-.5*lightL);
    renderer.toneMappingExposure=mood.exposure*(1-.1*lightD);
    darkBox.visible=v.dark>.01;
    if(darkBox.visible){placeBox();boxMat.opacity=smooth(0,.5,v.dark);boxLight.intensity=1.4*lightD;}else boxLight.intensity=0;
    lamp.visible=v.lamp>.01;
    if(lamp.visible){
      placeLamp();lamp.scale.setScalar(1);lp_spot.intensity=38*lightL;lp_beam.material.uniforms.uI.value=lightL;
      // the shadow-casting light moves to the lamp so shadows fall away from it
      _dv.subVectors(lampPos,aimPt).normalize();
      sun.position.set(...mood.sunPos).lerp(_dv.multiplyScalar(9).add(aimPt),smooth(0,.6,v.lamp));
      sun.target.position.set(0,.4,0).lerp(aimPt,smooth(0,.6,v.lamp));
      sun.color.set(mood.sun).lerp(new T.Color(0xffd9a6),lightL);
      sun.intensity=mood.sunI*(1-.9*lightD)*mix(1,.55,lightL);
      if(changed)renderer.shadowMap.needsUpdate=true;
    }else{lp_spot.intensity=0;sun.intensity=mood.sunI*(1-.94*lightD);}
    // leaf shedding: oldest (lowest) leaves turn yellow-brown, then detach and fall
    updateTropismProps(dt);
    if((whatIf.active==='drought'||whatIf.active==='dark')&&v[whatIf.active]>=1&&!reducedMotion){
      whatIf.shedTimer+=dt;
      const maxShed=rig.kind==='tomato'?4:3;
      if(whatIf.shedTimer>(whatIf.shed===0?2.6:2.2)&&whatIf.shed<maxShed){
        whatIf.shedTimer=0;
        const cand=rig.leaves.filter(e=>e.group.visible&&e.unfold>.6&&!e.fallen&&!e.dying).map(e=>({e,y:e.group.getWorldPosition(_dv).y})).sort((a,b)=>a.y-b.y);
        if(cand.length>2){cand[0].e.dying=0.0001;whatIf.shed++;}
      }
    }
    if(!on){
      plantEnv.droop=plantEnv.stretch=plantEnv.bend=plantEnv.gravity=plantEnv.rootGrav=plantEnv.hydro=0;turgor.x=slump.x=bend.x=stretch.x=turgor.v=slump.v=bend.v=stretch.v=0;
      tipS.x=gbend.x=hyd.x=tipS.v=gbend.v=hyd.v=0;setPotTip(0);wetU.uSide.value=0;
      wetU.uDry.value=0;veil.style.opacity='0';M.stemB.color.setRGB(1,1,1);M.stemT.color.setRGB(1,1,1);
      sun.target.position.set(0,.4,0);applyMood(moodKey);lastGrowth=-1;
    }
  }
  function applyWhatIfLeaves(dt=.016){
    const v=whatIf.v;
    const anyLeafFx=v.drought>0||v.dark>0||turgor.x>.001||rig.leaves.some(e=>e.fallen||e.dying||e.regrow!=null);
    if(!anyLeafFx){if(!whatIf.leafDirty)return;whatIf.leafDirty=false;}else whatIf.leafDirty=true;
    const d=Math.max(0,turgor.x),e=Math.max(0,stretch.x),dd=smooth(0,1,v.drought);
    leafTint.setRGB(1+.14*dd+.9*e,1-.16*dd+.45*e,1-.6*dd-.5*e);
    const shrink=1-.42*e;
    for(const lf of rig.leaves){
      if(!lf.group.visible||!lf.baseCol)continue;
      lf.mat.color.copy(lf.baseCol).multiply(leafTint);
      if(!photo.glowOn)lf.mat.emissive.setRGB(.07*e,.065*e,.018*e);
      let sc=shrink;
      if(lf.dying)lf.mat.color.lerp(_leafTarget(lf),lf.dying);
      if(lf.fallen){
        if(!whatIf.active){lf.fallen=false;lf.regrow=0;}
        else sc=0;
      }
      if(lf.regrow!=null&&!lf.fallen){lf.regrow=Math.min(1,lf.regrow+dt/2.4);sc*=smoother(lf.regrow);if(lf.regrow>=1)lf.regrow=null;}
      lf.group.scale.copy(lf.baseScale).multiplyScalar(Math.max(.0001,sc));
      if(d>.001&&lf.group.parent&&!lf.fallen){
        lf.group.parent.getWorldQuaternion(_qp);_qw.copy(_qp).multiply(lf.group.quaternion);
        _dv.set(0,1,0).applyQuaternion(_qw);const ang=_dv.angleTo(DOWN);
        _wax.crossVectors(_dv,DOWN);
        if(ang>.08&&_wax.lengthSq()>1e-6){_wax.normalize();
          _qa.setFromAxisAngle(_wax,d*Math.min(ang*.85,1.45)*(.4+.6*lf.unfold));
          _qw.premultiply(_qa);lf.group.quaternion.copy(_qp.invert().multiply(_qw));}
      }
      // yellowing → detach (after the droop so the falling leaf starts exactly where it hung)
      if(lf.dying){lf.dying=Math.min(1,lf.dying+dt/1.3);if(lf.dying>=1){lf.dying=0;detachLeaf(lf,new T.Color(1,1,1));lf.group.scale.setScalar(.0001);}}
    }
  }
  const _leafTarget=lf=>(whatIf.active==='dark'?paleTint:dryTint);
  // leaves that were mid-yellowing when an experiment stops simply recover
  function resetDying(){for(const r of Object.values(rigs))for(const e of r.leaves){e.dying=0;}}
  const _toggle=toggleWhatIf;
  function refreshWhatIfText(){
    $('noWaterButton').title=tr('What if · no water');$('noLightButton').title=tr('What if · no light');$('sideLightButton').title=tr('What if · light from one side');
    $('gravityButton').title=tr('What if · the pot is tipped over');$('hydroButton').title=tr('What if · water on one side only');$('compareButton').title=tr('Compare with a normal plant');if($('twineButton')){$('twineButton').title=tr('What if · give it a support stick');$('cuttingButton').title=tr('Grow a new plant from a cutting');}$('compareButton').setAttribute('aria-label',$('compareButton').title);
    for(const k in tropTags)tropTags[k].textContent=tr(tropTags[k].dataset.text);
    for(const k in WHATIF_BTN)$(WHATIF_BTN[k]).setAttribute('aria-label',$(WHATIF_BTN[k]).title);
  }

  // ── Tropisms: a pot that tips over (gravitropism) and a one-sided water source (hydrotropism) ──
  const potGroup=new T.Group();scene.add(potGroup);
  [soilCut,soilXray,soilBase,...Object.values(rigs).map(r=>r.model)].forEach(o=>potGroup.add(o));
  const PIV=V(0,-1.56,0),ZAX=V(0,0,1),_pv=V();
  function setPotTip(a){
    const ang=-Math.PI/2*a;potGroup.rotation.z=ang;
    _pv.copy(PIV).negate().applyAxisAngle(ZAX,ang).add(PIV);_pv.y+=.56*Math.sin(clamp(a,0,1)*Math.PI/2);
    potGroup.position.copy(_pv);potGroup.updateMatrixWorld(true);
  }
  // gravity arrow
  const gArrow=new T.Group();gArrow.visible=false;scene.add(gArrow);
  const gMat=new T.MeshStandardMaterial({color:0xe07a1f,roughness:.45,emissive:new T.Color(0x5a2400),emissiveIntensity:.5});
  const gShaft=new T.Mesh(new T.CylinderGeometry(.045,.045,1.5,14),gMat);gShaft.position.y=.2;gArrow.add(gShaft);
  const gHead=new T.Mesh(new T.ConeGeometry(.14,.34,20),gMat);gHead.rotation.x=Math.PI;gHead.position.y=-.72;gArrow.add(gHead);
  gArrow.position.set(-2.55,-.3,.2);
  // the olla: a buried, unglazed clay pot that slowly releases water through its walls
  const olla=new T.Group();olla.visible=false;potGroup.add(olla);
  const clay=new T.MeshStandardMaterial({color:0xb4643c,roughness:.92,metalness:0});
  const ollaBody=new T.Mesh(new T.SphereGeometry(.42,32,22),clay);ollaBody.scale.set(1,1.12,1);olla.add(ollaBody);
  const ollaNeck=new T.Mesh(new T.CylinderGeometry(.13,.17,1.2,24,1,true),new T.MeshStandardMaterial({color:0xa9583a,roughness:.9,side:T.DoubleSide}));ollaNeck.position.y=.72;olla.add(ollaNeck);
  const ollaRim=new T.Mesh(new T.TorusGeometry(.14,.03,10,28),clay);ollaRim.rotation.x=Math.PI/2;ollaRim.position.y=1.32;olla.add(ollaRim);
  const ollaWater=new T.Mesh(new T.CircleGeometry(.12,24),new T.MeshStandardMaterial({color:0x3f8fd8,roughness:.08,metalness:.1,emissive:new T.Color(0x0a2a4a)}));ollaWater.rotation.x=-Math.PI/2;ollaWater.position.y=1.26;olla.add(ollaWater);
  olla.position.set(-1.45,-1.25,-.55);
  // seeping water drops on the cut face
  const SEEP_N=90,seepPos=new Float32Array(SEEP_N*3),seepA=new Float32Array(SEEP_N),seepS=Array.from({length:SEEP_N},()=>({t:Math.random()*4,a:Math.random()*TAU,sp:.25+Math.random()*.25}));
  const seepGeo=new T.BufferGeometry();seepGeo.setAttribute('position',new T.BufferAttribute(seepPos,3).setUsage(T.DynamicDrawUsage));seepGeo.setAttribute('aAlpha',new T.BufferAttribute(seepA,1).setUsage(T.DynamicDrawUsage));
  const seepPts=new T.Points(seepGeo,new T.ShaderMaterial({uniforms:{uScale:{value:500},uPR:{value:1}},transparent:true,depthWrite:false,depthTest:false,
    vertexShader:'attribute float aAlpha;uniform float uScale,uPR;varying float vA;void main(){vA=aAlpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(.06*uScale/max(.1,-mv.z),1.5,14.)*uPR;if(vA<.01)gl_PointSize=0.;}',
    fragmentShader:'varying float vA;void main(){vec2 q=gl_PointCoord*2.-1.;float r=dot(q,q);if(r>1.)discard;float a=(exp(-r*6.)+exp(-r*2.)*.35)*vA;gl_FragColor=vec4(vec3(.3,.66,1.)*(1.+exp(-r*8.))*a,a);}'}));
  seepPts.frustumCulled=false;seepPts.visible=false;seepPts.renderOrder=6;scene.add(seepPts);
  // on-screen tags
  const tropTags={};
  for(const [k,text,cls] of [['gravity','Gravity','g'],['wet','Moist soil','w'],['dry','Dry soil','d'],['normal','Normal plant','n'],['exp','Experiment','e']]){
    const e=document.createElement('span');e.className='trop-tag trop-'+cls;e.dataset.text=text;e.textContent=tr(text);e.hidden=true;$('fxLayer').appendChild(e);tropTags[k]=e;}
  const _tv=V();
  function placeTag(el,world,show){
    if(!show){el.hidden=true;return;}
    _tv.copy(world).project(camera);
    if(_tv.z>1||Math.abs(_tv.x)>1.05||Math.abs(_tv.y)>1.05){el.hidden=true;return;}
    el.hidden=false;el.style.left=`${(_tv.x*.5+.5)*width}px`;el.style.top=`${(-_tv.y*.5+.5)*height}px`;
  }
  function updateTropismProps(dt){
    const v=whatIf.v;
    gArrow.visible=v.gravity>.05;if(gArrow.visible){gArrow.scale.setScalar(smooth(.05,.3,v.gravity));gArrow.position.y=-.3+Math.sin(ambientTime*2.2)*.05;}
    olla.visible=v.hydro>.01;if(olla.visible)olla.scale.setScalar(Math.max(.001,smooth(0,.25,v.hydro)));
    seepPts.visible=v.hydro>.05&&!reducedMotion;
    if(seepPts.visible){
      const c=olla.getWorldPosition(_tv),cx=c.x,cy=c.y;
      for(let i=0;i<SEEP_N;i++){const s=seepS[i];s.t+=dt*s.sp;if(s.t>4){s.t=0;s.a=Math.random()*TAU;}
        const r=.45+s.t*.32,down=s.t*.08;seepPos[i*3]=cx+Math.cos(s.a)*r;seepPos[i*3+1]=cy+Math.sin(s.a)*r*.8-down;seepPos[i*3+2]=-.1;
        seepA[i]=smooth(0,.4,s.t)*(1-smooth(2.6,4,s.t))*smooth(.05,.4,v.hydro)*(seepPos[i*3+1]<-.05?1:0);}
      seepGeo.attributes.position.needsUpdate=seepGeo.attributes.aAlpha.needsUpdate=true;
      seepPts.material.uniforms.uScale.value=height/(2*Math.tan(camera.fov*Math.PI/360));seepPts.material.uniforms.uPR.value=renderer.getPixelRatio();
    }
  }
  function updateTropTags(){
    const v=whatIf.v,micro=microState.open;
    placeTag(tropTags.gravity,_tv.set(-2.55,.75,.2),!micro&&v.gravity>.3);
    placeTag(tropTags.wet,_tv.set(-1.45,-2.2,-.1),!micro&&v.hydro>.3);
    placeTag(tropTags.dry,_tv.set(1.35,-1.7,-.1),!micro&&v.hydro>.3);
    // ghost comparison tags
    const g=compare.on&&compare.ghost&&compare.ghost.model.visible;
    const useRoot=whatIf.active==='hydro'||whatIf.active==='gravity'&&false;
    const tip=(r,out)=>{if(useRoot){r.root.pointAt(1,out);return r.root.localToWorld(out);}if(r.stem.visible&&r.stemLen>.05){r.stem.pointAt(1,out);return r.stem.localToWorld(out);}return r.model.localToWorld(out.copy(r.params.C));};
    placeTag(tropTags.normal,g?tip(compare.ghost,V()):_tv,!micro&&g);
    placeTag(tropTags.exp,g?tip(rig,V()):_tv,!micro&&g);
  }
  // camera framing while the pot lies on its side
  function whatIfView(part){
    if(part!=='whole'||tipS.x<.5)return null;
    const L=Math.max(.6,rig.stemLen+.4),xMax=1.6+L*.7,yMax=Math.max(1.2,-.3+L*.85);
    const center=V((-1.7+xMax)/2,(-3.25+yMax)/2,0);
    return {center,distance:fitDistance(yMax+3.25+.9,xMax+1.7+1)};
  }
  // ── Before / after: a translucent ghost of the same plant grown normally ──
  const compare={on:false,ghosts:{},ghost:null,lastKey:''};
  const ghostMat=new T.MeshStandardMaterial({color:0xf4fbff,emissive:new T.Color(0x9fcfff),emissiveIntensity:.8,roughness:1,transparent:true,depthWrite:false,side:T.DoubleSide});
  ghostMat.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n{float fr=pow(1.-abs(dot(normalize(vNormal),normalize(vViewPosition))),1.8);gl_FragColor.a=clamp(.12+fr*.75,0.,1.);}');};
  ghostMat.customProgramCacheKey=()=>'ghost';
  const hiddenMat=new T.MeshBasicMaterial({visible:false});
  function ghostFor(kind){
    if(!compare.ghosts[kind]){
      const before=pickables.length;
      const g=kind==='bean'?buildBean():buildTomato();
      pickables.splice(before);
      g.model.traverse(o=>{if(o.isMesh&&!o.isPoints){o.material=ghostMat;o.castShadow=o.receiveShadow=false;o.renderOrder=7;}else if(o.isPoints||o.isLine)o.material=hiddenMat;});
      potGroup.add(g.model);g.model.visible=false;compare.ghosts[kind]=g;
    }
    return compare.ghosts[kind];
  }
  function updateCompare(){
    const v=whatIf.v,expOn=v.drought>.3||v.dark>.3||v.lamp>.3||v.gravity>.3||v.hydro>.3||v.twine>.3;
    for(const k in compare.ghosts)compare.ghosts[k].model.visible=false;
    if(!compare.on||!expOn||microState.open){compare.ghost=null;return;}
    const g=ghostFor(rig.kind);compare.ghost=g;g.model.visible=true;
    const key=rig.kind+':'+growth.toFixed(4);
    if(key!==compare.lastKey){
      const saved={...plantEnv};for(const k in plantEnv)plantEnv[k]=0;
      g.update(growth,0,0);Object.assign(plantEnv,saved);compare.lastKey=key;
    }
  }
  $('compareButton').addEventListener('click',()=>{
    compare.on=!compare.on;$('compareButton').classList.toggle('active',compare.on);$('compareButton').setAttribute('aria-pressed',String(compare.on));
    compare.lastKey='';
    if(compare.on)toast(whatIf.active?'Ghost outline = the same plant grown normally':'Compare shows a ghost of the normal plant during a What if? experiment',{},3400);
  });

  const prevRefresh2=refreshLocalizedScene;
  refreshLocalizedScene=()=>{prevRefresh2();refreshWhatIfText();};
  refreshWhatIfText();
