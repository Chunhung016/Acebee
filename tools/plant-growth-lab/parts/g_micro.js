
  // ══════════════════════════════════════════════════════════════════════════
  //  Microscope: live 3D cross-sections of a leaf, the stem and a root
  // ══════════════════════════════════════════════════════════════════════════
  const zhAdd=o=>{for(const k in o)if(!(k in chineseText))chineseText[k]=o[k];};
  zhAdd({
    'Microscope':'显微镜','Microscope (Z)':'显微镜（Z）','Microscope · tap a leaf, the stem or a root to zoom in':'显微镜 · 点击叶片、茎或根即可放大观察',
    'Try tapping a leaf, the stem or a root':'请点击叶片、茎或根','Close microscope':'关闭显微镜','Show labels':'显示标注',
    'Leaf cross-section':'叶片横切面','Stem cross-section':'茎横切面','Root hair zone':'根毛区','Stem':'茎','Leaf':'叶','Root':'根',
    'Drag to turn · scroll to zoom':'拖动旋转 · 滚动缩放',
    'Cuticle':'角质层','Upper epidermis':'上表皮','Palisade mesophyll':'栅栏组织','Chloroplasts':'叶绿体','Spongy mesophyll':'海绵组织','Air space':'细胞间隙',
    'Vein · xylem + phloem':'叶脉 · 木质部 + 韧皮部','Lower epidermis':'下表皮','Stoma · guard cells':'气孔 · 保卫细胞',
    'Epidermis':'表皮','Hairs (trichomes)':'表皮毛','Cortex':'皮层','Vascular bundle':'维管束','Xylem · water ↑':'木质部 · 水分 ↑','Phloem · sugar ↓':'韧皮部 · 糖分 ↓','Pith':'髓',
    'Root hairs':'根毛','Soil grain + water film':'土粒与水膜','Endodermis':'内皮层','Xylem':'木质部','Phloem':'韧皮部','Root cap':'根冠',
    'Water':'水分','Sugar':'糖分',
    'Light enters from the top. Palisade cells packed with chloroplasts make sugar. CO₂ enters and O₂ leaves through stomata on the underside, while the vein brings water and carries sugar away.':
      '光从上方射入。栅栏细胞里挤满叶绿体，在这里制造糖分。二氧化碳经叶背的气孔进入，氧气由气孔离开；叶脉运来水分，并把糖分运走。',
    'Vascular bundles form a ring. Xylem tubes, strengthened by spiral walls, carry water up from the roots; phloem tubes carry sugar from the leaves to wherever it is needed.':
      '维管束排列成一圈。木质部导管的管壁有螺纹加厚，把水分从根部向上运输；韧皮部筛管把糖分从叶片运往需要的地方。',
    'Root hairs reach between soil grains and absorb the thin film of water around them. The water crosses the cortex and endodermis into the xylem, then rises toward the stem.':
      '根毛伸入土粒之间，吸收土粒表面薄薄的水膜。水分穿过皮层和内皮层进入木质部，再向上输送到茎。'
  });
  const micro={kind:'leaf',plant:null,renderer:null,scene:null,camera:null,specimens:{},current:null,raf:0,time:0,last:0,
    theta:.5,phi:1.05,radius:8,wTheta:.5,wPhi:1.05,wRadius:8,dragging:false,idle:0,labels:true,size:400,failed:false};
  const microEl=$('microscope'),lensEl=$('microLens'),microCanvas=$('microCanvas'),microLabelsEl=$('microLabels');
  const MAG={leaf:'×400',stem:'×100',root:'×200'};
  const TITLES={leaf:'Leaf cross-section',stem:'Stem cross-section',root:'Root hair zone'};
  const DESCR={
    leaf:'Light enters from the top. Palisade cells packed with chloroplasts make sugar. CO₂ enters and O₂ leaves through stomata on the underside, while the vein brings water and carries sugar away.',
    stem:'Vascular bundles form a ring. Xylem tubes, strengthened by spiral walls, carry water up from the roots; phloem tubes carry sugar from the leaves to wherever it is needed.',
    root:'Root hairs reach between soil grains and absorb the thin film of water around them. The water crosses the cortex and endodermis into the xylem, then rises toward the stem.'};
  const VIEW={leaf:{theta:.36,phi:1.2,radius:10.8},stem:{theta:.78,phi:.9,radius:10.2},root:{theta:.78,phi:1.3,radius:10.8}};

  // ── Materials and geometry helpers ──
  function membrane(color,{base=.24,rim=.62,rimCol=0xffffff,rough=.32}={}){
    const m=new T.MeshStandardMaterial({color,roughness:rough,metalness:0,transparent:true,depthWrite:false});
    const u={uBaseA:{value:base},uRimA:{value:rim},uRimCol:{value:new T.Color(rimCol)}};
    m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,u);
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uBaseA,uRimA;uniform vec3 uRimCol;')
        .replace('#include <dithering_fragment>','#include <dithering_fragment>\n{float fr=pow(1.-abs(dot(normalize(vNormal),normalize(vViewPosition))),2.2);gl_FragColor.rgb+=uRimCol*fr*.32;gl_FragColor.a=clamp(uBaseA+fr*uRimA,0.,1.);}');};
    m.customProgramCacheKey=()=>'membrane';m.userData.u=u;return m;
  }
  const solid=(color,o={})=>new T.MeshStandardMaterial({color,roughness:.45,metalness:0,...o});
  function cellGeometry(e=.45,ws=18,hs=12){
    const g=new T.SphereGeometry(1,ws,hs),p=g.attributes.position,f=v=>Math.sign(v)*Math.pow(Math.abs(v),e);
    for(let i=0;i<p.count;i++)p.setXYZ(i,f(p.getX(i)),f(p.getY(i)),f(p.getZ(i)));
    g.computeVertexNormals();return g;
  }
  const _M4=new T.Matrix4(),_Q=new T.Quaternion(),_S=V(),_E=new T.Euler();
  function instanced(geo,mat,list,parent){
    if(!list.length)return null;
    const m=new T.InstancedMesh(geo,mat,list.length);
    list.forEach((it,i)=>{_M4.compose(it.p,it.q||_Q.identity(),_S.copy(it.s));m.setMatrixAt(i,_M4);if(it.c)m.setColorAt(i,it.c);});
    m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;
    m.frustumCulled=false;parent.add(m);return m;
  }
  const yRot=a=>new T.Quaternion().setFromAxisAngle(V(0,1,0),-a);
  const col=(hex,j=.05)=>{const c=new T.Color(hex);c.offsetHSL((Math.random()-.5)*j*.4,(Math.random()-.5)*j,(Math.random()-.5)*j);return c;};
  const inCut=a=>{a=((a%TAU)+TAU)%TAU;return a>0&&a<Math.PI/2;};
  const RND=()=>Math.random();
  // Shared particle sprites for the lens: glowing dots (water), gas puffs (CO₂/O₂) and hexagons (sugar).
  const MP_N=700;
  function makeParticles(parent){
    const pos=new Float32Array(MP_N*3),colr=new Float32Array(MP_N*3),alpha=new Float32Array(MP_N),size=new Float32Array(MP_N),shape=new Float32Array(MP_N),rot=new Float32Array(MP_N);
    const g=new T.BufferGeometry();
    [['position',pos,3],['aColor',colr,3],['aAlpha',alpha,1],['aSize',size,1],['aShape',shape,1],['aRot',rot,1]].forEach(([n,a,s])=>g.setAttribute(n,new T.BufferAttribute(a,s).setUsage(T.DynamicDrawUsage)));
    const u={uScale:{value:400},uPixelRatio:{value:1}};
    const pts=new T.Points(g,new T.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,depthTest:true,
      blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor,blendSrcAlpha:T.OneFactor,blendDstAlpha:T.OneMinusSrcAlphaFactor,
      vertexShader:`attribute vec3 aColor;attribute float aAlpha,aSize,aShape,aRot;uniform float uScale,uPixelRatio;varying vec3 vC;varying float vA,vS,vR;
        void main(){vC=aColor;vA=aAlpha;vS=aShape;vR=aRot;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
          gl_PointSize=clamp(aSize*uScale/max(.1,-mv.z),1.5,80.)*uPixelRatio;if(aAlpha<.01)gl_PointSize=0.;}`,
      fragmentShader:`varying vec3 vC;varying float vA,vS,vR;
        float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
        float fbm(vec2 p){return vn(p)*.55+vn(p*2.1+3.7)*.3+vn(p*4.3+1.3)*.15;}
        void main(){vec2 q=gl_PointCoord*2.-1.;float cs=cos(vR),sn=sin(vR);q=mat2(cs,-sn,sn,cs)*q;float r=length(q);vec4 c;
          if(vS<.5){float rr=r*r;if(rr>1.)discard;float core=exp(-rr*9.),halo=exp(-rr*2.6)*.5;float a=clamp(core+halo,0.,1.);c=vec4(vC*(1.+core*1.3)*a,a);}
          else if(vS<1.5){vec2 p=q*1.7+vec2(vR*3.1,vR*1.7);float n=fbm(p)*.62+fbm(p*2.3+vec2(vR))*.38;float body=smoothstep(1.,.15,r+(.5-n)*.55);
            float a=clamp(body*(.3+.7*n)*.9,0.,.85);vec3 cc=mix(vC*.62,min(vC*1.12+.02,vec3(1.)),smoothstep(.3,.85,n));c=vec4(cc*a,a);}
          else{float ang=atan(q.y,q.x);float hex=cos(.5236)/cos(mod(ang+.5236,1.0472)-.5236);float d=r/(.62*hex);
            float fill=smoothstep(1.,.9,d),line=exp(-pow((d-.82)*9.,2.)),glow=exp(-r*r*3.)*.5;vec3 cc=vC*(.8+line*.9);float a=clamp(fill*.92+glow*(1.-fill),0.,1.);c=vec4(cc*a,a);}
          if(c.a<.01)discard;gl_FragColor=c*vA;}`}));
    pts.frustumCulled=false;pts.renderOrder=20;parent.add(pts);
    return {pts,g,u,pos,colr,alpha,size,shape,rot,
      st:{kind:new Uint8Array(MP_N),path:new Array(MP_N),d:new Float32Array(MP_N),speed:new Float32Array(MP_N),t:new Float32Array(MP_N),life:new Float32Array(MP_N),a:Array.from({length:MP_N},()=>V()),b:Array.from({length:MP_N},()=>V())},debt:{}};
  }
  const P_STYLE={water:{c:[.3,.72,1],size:.07,shape:0},sugar:{c:[1,.66,.16],size:.1,shape:2},co2:{c:[.66,.7,.76],size:.3,shape:1},o2:{c:[.18,.82,1],size:.3,shape:1}};
  function spawnParticle(P,kind,paths){
    if(!paths||!paths.length)return;
    const S=P.st;let i=-1;for(let k=0;k<MP_N;k++)if(!S.kind[k]){i=k;break;}if(i<0)return;
    const st=P_STYLE[kind];S.kind[i]={water:1,sugar:2,co2:3,o2:4}[kind];S.path[i]=paths[Math.floor(RND()*paths.length)];S.d[i]=0;S.t[i]=0;
    S.speed[i]=(kind==='co2'||kind==='o2'?.32:kind==='sugar'?.34:.5)*(.8+RND()*.4);
    P.colr.set(st.c,i*3);P.size[i]=st.size*(kind==='water'?(.8+RND()*.4):1);P.shape[i]=st.shape;P.rot[i]=RND()*TAU;P.alpha[i]=0;
  }
  const _pp=V();
  function updateParticles(P,dt,rates,paths){
    for(const k in rates){P.debt[k]=(P.debt[k]||0)+dt*rates[k];while(P.debt[k]>=1){P.debt[k]-=1;spawnParticle(P,k,paths[k]);}}
    const S=P.st;
    for(let i=0;i<MP_N;i++){
      if(!S.kind[i]){P.alpha[i]=0;continue;}
      const path=S.path[i];S.d[i]+=dt*S.speed[i];S.t[i]+=dt;
      const u=S.d[i]/path.len;
      sampleAt(path,S.d[i],_pp);
      const gas=S.kind[i]>=3;
      if(gas){_pp.x+=Math.sin(S.t[i]*1.9+i)*.035;_pp.y+=Math.sin(S.t[i]*1.4+i*.7)*.03;P.rot[i]+=dt*.4;
        P.size[i]=(S.kind[i]===3?.26:.24)*(.7+.5*Math.sin(Math.PI*clamp(u)));}
      else P.rot[i]+=dt*.5;
      P.pos[i*3]=_pp.x;P.pos[i*3+1]=_pp.y;P.pos[i*3+2]=_pp.z;
      P.alpha[i]=smooth(0,.08,u)*(1-smooth(.9,1,u))*(gas?.85:1);
      if(u>=1){S.kind[i]=0;P.alpha[i]=0;}
    }
    ['position','aColor','aAlpha','aSize','aShape','aRot'].forEach(n=>P.g.attributes[n].needsUpdate=true);
  }
  function beamsFor(parent,count,spread,top){
    const mat=new T.ShaderMaterial({uniforms:{uT:{value:0}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
      vertexShader:`varying vec2 vUv;varying vec3 vN,vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalMatrix*normal;vV=-mv.xyz;gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`uniform float uT;varying vec2 vUv;varying vec3 vN,vV;void main(){float e=pow(abs(dot(normalize(vN),normalize(vV))),2.);float al=smoothstep(0.,.25,vUv.y)*(1.-smoothstep(.55,1.,vUv.y));
        float sh=.75+.25*sin(uT*1.3+vUv.x*6.28+vUv.y*7.);gl_FragColor=vec4(vec3(1.,.93,.66)*e*al*sh*.2,1.);}`});
    const geo=new T.CylinderGeometry(1,1,1,24,1,true);geo.translate(0,.5,0);
    const grp=new T.Group();parent.add(grp);
    for(let i=0;i<count;i++){const m=new T.Mesh(geo,mat);m.position.set((i/(count-1)-.5)*spread,top,(RND()-.5)*.8);m.rotation.set(-.25,0,.32);m.scale.set(.22+RND()*.1,5,.22+RND()*.1);grp.add(m);}
    return mat;
  }
  function lineTo(pts){return makePoly(pts.map(p=>p.clone()));}

  // ── Leaf: cuticle, epidermis, palisade and spongy mesophyll, vein, stomata ──
  function buildLeaf(plant){
    const g=new T.Group(),W=4.2,D=2.0,labels=[],paths={water:[],sugar:[],co2:[],o2:[]};
    const tomato=plant==='tomato';
    const wall=membrane(0xe3efcc,{base:.2,rim:.6,rimCol:0xf4ffe6});
    const pal=membrane(0x9fd47c,{base:.2,rim:.55,rimCol:0xd8ffc0});
    const spo=membrane(0xcbe6ae,{base:.16,rim:.58,rimCol:0xe8ffd2});
    const cuticle=new T.MeshPhysicalMaterial({color:0xf0f7d8,roughness:.08,clearcoat:1,transparent:true,opacity:.28,depthWrite:false});
    const chloroMat=solid(0x2a8a26,{emissive:new T.Color(0x0d4a0a),emissiveIntensity:.5,roughness:.45});
    const nucleusMat=solid(0x8a6bb3,{roughness:.35,emissive:new T.Color(0x1e1030)});
    const cellG=cellGeometry(.42),roundG=cellGeometry(.8),chloroG=new T.SphereGeometry(1,10,8);
    [.86,-.86].forEach(y=>{const m=new T.Mesh(new T.BoxGeometry(W+.04,.035,D+.04),cuticle);m.position.y=y;m.renderOrder=3;g.add(m);});
    // upper epidermis
    const ue=[],nx=12,nz=6,dx=W/nx,dz=D/nz;
    for(let i=0;i<nx;i++)for(let k=0;k<nz;k++)ue.push({p:V(-W/2+dx*(i+.5)+(RND()-.5)*.02,.74,-D/2+dz*(k+.5)),s:V(dx*.47,.085,dz*.46),c:col(0xe6f0d2)});
    instanced(cellG,wall,ue,g);
    // palisade columns with chloroplasts streaming around the cell wall (cyclosis)
    const pl=[],chl=[],px=16,pz=7,pdx=W/px,pdz=D/pz;
    for(let i=0;i<px;i++)for(let k=0;k<pz;k++){
      const c=V(-W/2+pdx*(i+.5)+(RND()-.5)*.02,.34,-D/2+pdz*(k+.5)+(k%2?.03:-.03));
      pl.push({p:c,s:V(.1,.1,.1),q:new T.Quaternion().setFromEuler(_E.set((RND()-.5)*.08,0,(RND()-.5)*.08)),c:col(0xc2e2a2)});
      for(let n=0;n<11;n++)chl.push({c,a:RND()*TAU,y:(RND()-.5)*.44,r:.078,sp:(.35+RND()*.4)*(RND()<.5?-1:1),s:.021+RND()*.005});
    }
    const capG=new T.CapsuleGeometry(1,3.6,4,14);
    instanced(capG,pal,pl,g);
    // vein
    const vc=V(0,-.24,0),veinR=.32;
    const inVein=(x,y)=>Math.hypot(x-vc.x,y-vc.y)<veinR+.13;
    // stomata on the lower side
    const stomata=[[-1.4,-.35],[.95,.5],[1.55,-.45],[-.75,.55]].map(([x,z])=>V(x,-.76,z));
    const nearStoma=(x,y,z)=>y<-.25&&stomata.some(s=>Math.hypot(x-s.x,z-s.z)<.27);
    // spongy mesophyll (loosely packed, big air spaces)
    const sp=[];
    for(let tries=0;tries<4000&&sp.length<170;tries++){
      const r=.09+RND()*.055,x=(RND()*2-1)*(W/2-.08),y=-.6+RND()*.55,z=(RND()*2-1)*(D/2-.08);
      if(inVein(x,y)||nearStoma(x,y,z))continue;
      if(sp.some(o=>o.p.distanceTo(_pp.set(x,y,z))<(o.r+r)*1.08))continue;
      sp.push({p:V(x,y,z),r,s:V(r*1.15,r*.85,r),q:new T.Quaternion().setFromEuler(_E.set(RND()*3,RND()*3,RND()*3)),c:col(0xcfe8b4)});
    }
    instanced(roundG,spo,sp,g);
    sp.forEach(o=>{for(let n=0;n<5;n++){const d=V(RND()-.5,RND()-.5,RND()-.5).normalize();chl.push({c:o.p,dir:d,r:o.r*.8,a:RND()*TAU,sp:(.2+RND()*.3),s:.02});}});
    // lower epidermis with stomata
    const le=[];
    for(let i=0;i<nx;i++)for(let k=0;k<nz;k++){const p=V(-W/2+dx*(i+.5),-.74,-D/2+dz*(k+.5));if(stomata.some(s=>Math.hypot(p.x-s.x,p.z-s.z)<.2))continue;le.push({p,s:V(dx*.47,.08,dz*.46),c:col(0xe2ecce)});}
    instanced(cellG,wall,le,g);
    const guardMat=membrane(0x6fbf52,{base:.55,rim:.4,rimCol:0xd8ffc0});
    const halfG=new T.TorusGeometry(.1,.048,10,20,Math.PI);halfG.rotateX(Math.PI/2);
    const guards=[];
    stomata.forEach(s=>{for(const side of [1,-1]){const m=new T.Mesh(halfG,guardMat);m.position.copy(s);m.rotation.y=side>0?0:Math.PI;m.scale.set(1.35,1,1);m.renderOrder=2;g.add(m);guards.push({m,side,base:s.clone()});
      for(let n=0;n<3;n++){const c=new T.Mesh(chloroG,chloroMat);c.scale.setScalar(.022);c.position.copy(s).add(V((n-1)*.08,0,side*.1));g.add(c);guards.push({m:c,side,base:c.position.clone()});}}});
    // vascular bundle: sheath, xylem vessels with spiral thickening, phloem sieve tubes
    const sheath=[];
    for(let a=0;a<12;a++)for(let z=0;z<8;z++){const an=a/12*TAU;sheath.push({p:V(vc.x+Math.cos(an)*veinR,vc.y+Math.sin(an)*veinR,-D/2+(z+.5)*D/8),s:V(.075,.075,.12),c:col(0xdcebb4)});}
    instanced(roundG,membrane(0xd9ebb0,{base:.2,rim:.6}),sheath,g);
    const tubeG=new T.CylinderGeometry(1,1,D,18,1,true);tubeG.rotateX(Math.PI/2);
    const xyMat=membrane(0x9cc9df,{base:.14,rim:.7,rimCol:0xd8f1ff}),phMat=membrane(0xe8d3a0,{base:.2,rim:.6,rimCol:0xfff0cc});
    const ringMat=solid(0xd6e3c8,{roughness:.4}),ringG=new T.TorusGeometry(1,.1,6,18);
    const xy=[[-.12,.1,.062],[0,.14,.055],[.12,.1,.06],[-.06,.02,.045],[.07,.03,.048]],ph=[[-.13,-.12,.03],[-.04,-.16,.032],[.06,-.15,.03],[.14,-.1,.028]];
    const tubes=[],rings=[],phl=[];
    xy.forEach(([x,y,r])=>{const p=V(vc.x+x,vc.y+y,0);tubes.push({p,s:V(r,r,1)});for(let z=-D/2+.04;z<D/2;z+=.065)rings.push({p:V(p.x,p.y,z),s:V(r*.96,r*.96,r*.96)});paths.water.push(makePoly([V(p.x,p.y,-D/2-.05),V(p.x,p.y,D/2+.05)]));});
    ph.forEach(([x,y,r])=>{const p=V(vc.x+x,vc.y+y,0);phl.push({p,s:V(r,r,1)});for(let z=-D/2+.1;z<D/2;z+=.22)rings.push({p:V(p.x,p.y,z),s:V(r*.95,r*.95,r*.6)});});
    instanced(tubeG,xyMat,tubes,g);instanced(tubeG,phMat,phl,g);instanced(ringG,ringMat,rings,g);
    // tomato leaves are hairy
    if(tomato){const hairMat=membrane(0xf2f6e6,{base:.4,rim:.5}),hg=new T.CylinderGeometry(.006,.02,1,6);hg.translate(0,.5,0);
      for(let n=0;n<26;n++){const top=RND()<.4,m=new T.Mesh(hg,hairMat);m.position.set((RND()*2-1)*1.9,top?.87:-.87,(RND()*2-1)*.9);m.scale.set(1,.25+RND()*.3,1);if(!top)m.rotation.x=Math.PI;m.rotation.z+=(RND()-.5)*.5;g.add(m);
        if(RND()<.5){const b=new T.Mesh(new T.SphereGeometry(.028,10,8),solid(0xe9d68a,{emissive:new T.Color(0x3a2a00)}));b.position.copy(m.position).add(V(0,(top?1:-1)*m.scale.y,0));g.add(b);}}}
    // chloroplast instances (animated)
    const chlMesh=new T.InstancedMesh(chloroG,chloroMat,chl.length);chlMesh.frustumCulled=false;g.add(chlMesh);
    const nuc=[];pl.forEach((c,i)=>{if(i%2)nuc.push({p:c.p.clone().add(V(.04,.12,.03)),s:V(.035,.035,.035)});});
    instanced(new T.SphereGeometry(1,12,10),nucleusMat,nuc,g);
    // flow paths
    pl.forEach((c,i)=>{if(i%3)return;const cell=c.p;
      const vt=V(vc.x+(RND()-.5)*.2,vc.y+.14,(RND()-.5)*1.6);
      paths.water.push(makePoly([V(vt.x,vt.y,vt.z),V(mix(vt.x,cell.x,.5),-.05,mix(vt.z,cell.z,.5)),cell.clone().add(V(0,-.1,0))]));
      const pt=V(vc.x+(RND()-.5)*.25,vc.y-.14,(RND()-.5)*1.6);
      paths.sugar.push(makePoly([cell.clone(),V(mix(cell.x,pt.x,.5),-.1,mix(cell.z,pt.z,.5)),pt,V(pt.x,pt.y,-D/2-.1)]));});
    stomata.forEach(s=>{const near=pl.filter(c=>Math.hypot(c.p.x-s.x,c.p.z-s.z)<1.1);for(let n=0;n<10&&near.length;n++){const cell=near[Math.floor(RND()*near.length)].p;
      const below=V(s.x+(RND()-.5)*.7,-1.55,s.z+(RND()-.5)*.5),pore=s.clone(),cav=V(s.x,-.45,s.z),mid=V(mix(s.x,cell.x,.6),-.2,mix(s.z,cell.z,.6)),end=cell.clone().add(V(0,-.12,0));
      paths.co2.push(makePoly([below,pore,cav,mid,end]));paths.o2.push(makePoly([end.clone(),mid.clone(),cav.clone(),pore.clone(),V(s.x+(RND()-.5)*.8,-1.6,s.z+(RND()-.5)*.6)]));}});
    const beamMat=beamsFor(g,4,3.4,.88);
    labels.push({text:'Cuticle',p:V(-1.75,.88,1),side:-1},{text:'Upper epidermis',p:V(-1.55,.74,.95),side:-1},{text:'Palisade mesophyll',p:V(-1.28,.4,.98),side:-1},
      {text:'Chloroplasts',p:pl[pl.length-2].p.clone().add(V(0,.1,.08)),side:1},{text:'Spongy mesophyll',p:V(-1.6,-.35,.95),side:-1},{text:'Air space',p:V(1.35,-.3,.95),side:1},
      {text:'Vein · xylem + phloem',p:V(vc.x,vc.y,D/2),side:1},{text:'Stoma · guard cells',p:stomata[1].clone(),side:1},{text:'Lower epidermis',p:V(1.7,-.76,.95),side:1});
    const _c=V();
    return {group:g,labels,paths,rates:{water:10,sugar:7,co2:9,o2:8},update(dt,t){
      let i=0;
      for(const c of chl){c.a+=c.sp*dt;
        if(c.dir){_c.copy(c.dir).applyAxisAngle(V(0,1,0),c.a).multiplyScalar(c.r).add(c.c);}
        else _c.set(c.c.x+Math.cos(c.a)*c.r,c.c.y+c.y+Math.sin(t*.7+c.a)*.01,c.c.z+Math.sin(c.a)*c.r);
        _M4.compose(_c,_Q.setFromEuler(_E.set(0,-c.a,.3)),_S.set(c.s,c.s*.62,c.s));chlMesh.setMatrixAt(i++,_M4);}
      chlMesh.instanceMatrix.needsUpdate=true;
      chloroMat.emissiveIntensity=.55+.35*(.5+.5*Math.sin(t*1.7));
      const open=.5+.5*Math.sin(t*.55);
      guards.forEach(o=>{o.m.position.copy(o.base);o.m.position.z+=o.side*(.006+.03*open);});
      beamMat.uniforms.uT.value=t;
    }};
  }

  // ── Stem: epidermis with hairs, cortex, ring of vascular bundles, pith (a wedge is cut away) ──
  function buildStem(plant){
    const g=new T.Group(),R=1.5,H=2.4,labels=[],paths={water:[],sugar:[]},tomato=plant==='tomato';
    const cellG=cellGeometry(.45),roundG=cellGeometry(.75);
    const epiMat=membrane(0xd8eabf,{base:.26,rim:.6}),corMat=membrane(0xb9dc98,{base:.2,rim:.58,rimCol:0xeaffd5}),pithMat=membrane(0xf1efd9,{base:.14,rim:.62});
    const cuticle=new T.MeshPhysicalMaterial({color:0xeef7d8,roughness:.1,clearcoat:1,transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide});
    const shell=new T.Mesh(new T.CylinderGeometry(R+.03,R+.03,H,64,1,true,Math.PI/2,Math.PI*1.5),cuticle);shell.renderOrder=3;g.add(shell);
    const ring=(r,spacing,ystep,half,mat,geo,colour,skip)=>{
      const list=[],n=Math.max(6,Math.round(TAU*r/spacing));
      for(let yy=-H/2+ystep/2;yy<H/2;yy+=ystep)for(let k=0;k<n;k++){const a=(k+(Math.round(yy/ystep)%2)*.5)/n*TAU;if(inCut(a)||(skip&&skip(a)))continue;
        list.push({p:V(Math.cos(a)*r,yy,Math.sin(a)*r),q:yRot(a),s:V(half[0],half[1],(TAU*r/n)*.46),c:col(colour)});}
      return instanced(geo,mat,list,g);
    };
    ring(1.44,.13,.2,[.045,.095],epiMat,cellG,0xdbecc2);
    [1.32,1.19,1.07].forEach((r,i)=>ring(r,.15,.24,[.058,.115],corMat,roundG,i===0?0xa9d486:0xbfe0a0));
    const bundleA=[];for(let k=0;k<8;k++){const a=k*Math.PI/4+Math.PI/8;if(!inCut(a))bundleA.push(a);}
    const nearBundle=a=>bundleA.some(b=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))<.24);
    [.93,.8,.67].forEach(r=>ring(r,.14,.26,[.055,.12],corMat,roundG,0xcde7b2,nearBundle));
    [.5,.36,.22].forEach(r=>ring(r,.17,.3,[.075,.14],pithMat,roundG,0xf3f0dc));
    instanced(roundG,pithMat,[0,1,2,3,4,5,6,7].map(i=>({p:V(0,-H/2+.15+i*.3,0),s:V(.08,.14,.08),c:col(0xf3f0dc)})),g);
    // vascular bundles as long tubes running the length of the stem
    const tubeG=new T.CylinderGeometry(1,1,H,16,1,true);
    const xyMat=membrane(0x9cc9df,{base:.12,rim:.72,rimCol:0xd8f1ff}),phMat=membrane(0xe9d19a,{base:.22,rim:.6,rimCol:0xfff0cc}),fibMat=membrane(0xe7dcc0,{base:.4,rim:.5}),camMat=membrane(0xd5ecb8,{base:.3,rim:.5});
    const ringMat=solid(0xd8e6cc,{roughness:.4}),ringG=new T.TorusGeometry(1,.1,6,18);ringG.rotateX(Math.PI/2);
    const X=[],PH=[],F=[],C=[],RG=[];
    bundleA.forEach(a=>{
      const at=(r,off)=>{const aa=a+off/r;return V(Math.cos(aa)*r,0,Math.sin(aa)*r);};
      [[.6,0,.062],[.66,-.1,.05],[.66,.1,.05],[.72,-.03,.042],[.72,.05,.04]].forEach(([r,o,rad])=>{const p=at(r,o);X.push({p,s:V(rad,1,rad)});for(let y=-H/2+.03;y<H/2;y+=.055)RG.push({p:V(p.x,y,p.z),s:V(rad*.95,rad*.95,rad*.95)});paths.water.push(makePoly([V(p.x,-H/2-.1,p.z),V(p.x,H/2+.15,p.z)]));});
      for(let j=0;j<7;j++){const p=at(.8,(j-3)*.035);C.push({p,s:V(.016,1,.016)});}
      [[.87,-.08],[.87,0],[.87,.08],[.92,-.045],[.92,.045],[.9,.12],[.9,-.12]].forEach(([r,o])=>{const p=at(r,o),rad=.026+RND()*.008;PH.push({p,s:V(rad,1,rad)});for(let y=-H/2+.1;y<H/2;y+=.2)RG.push({p:V(p.x,y,p.z),s:V(rad*.95,rad*.6,rad*.95)});paths.sugar.push(makePoly([V(p.x,H/2+.1,p.z),V(p.x,-H/2-.1,p.z)]));});
      for(let j=0;j<7;j++){const p=at(.99,(j-3)*.04);F.push({p,s:V(.02,1,.02)});}
    });
    instanced(tubeG,xyMat,X,g);instanced(tubeG,phMat,PH,g);instanced(tubeG,fibMat,F,g);instanced(tubeG,camMat,C,g);instanced(ringG,ringMat,RG,g);
    // hairs
    const hairMat=membrane(0xf3f7e8,{base:.42,rim:.5}),tipMat=solid(0xe8c96a,{emissive:new T.Color(0x3a2800),roughness:.3});
    const hg=new T.CylinderGeometry(.008,.026,1,7);hg.translate(0,.5,0);const tipG=new T.SphereGeometry(.035,12,10);
    let firstHair=null;
    for(let n=0;n<(tomato?40:18);n++){
      let a;do{a=RND()*TAU;}while(inCut(a));
      const y=-H/2+.1+RND()*(H-.2),m=new T.Mesh(hg,hairMat),dir=V(Math.cos(a),.25+RND()*.3,Math.sin(a)).normalize();
      m.position.set(Math.cos(a)*(R+.02),y,Math.sin(a)*(R+.02));m.quaternion.setFromUnitVectors(V(0,1,0),dir);const L=tomato?.35+RND()*.4:.2+RND()*.22;m.scale.set(1,L,1);g.add(m);
      if(tomato&&RND()<.55){const b=new T.Mesh(tipG,tipMat);b.position.copy(m.position).addScaledVector(dir,L);g.add(b);}
      if(!firstHair&&Math.cos(a)<-.2&&Math.sin(a)>.2)firstHair=m.position.clone().addScaledVector(dir,L*.6);
    }
    const bA=bundleA.find(a=>Math.sin(a)<0&&Math.cos(a)>0)??bundleA[0];
    labels.push({text:'Epidermis',p:V(Math.cos(-.5)*R,.55,Math.sin(-.5)*R),side:1},{text:'Hairs (trichomes)',p:firstHair||V(-1.2,.7,1.2),side:-1},
      {text:'Cortex',p:V(1.2,H/2,-.12),side:1},{text:'Vascular bundle',p:V(Math.cos(bA)*.8,H/2,Math.sin(bA)*.8),side:1},
      {text:'Xylem · water ↑',p:V(Math.cos(bundleA[bundleA.length-1])*.62,H/2,Math.sin(bundleA[bundleA.length-1])*.62),side:-1},
      {text:'Phloem · sugar ↓',p:V(Math.cos(bundleA[bundleA.length-2])*.88,H/2,Math.sin(bundleA[bundleA.length-2])*.88),side:-1},{text:'Pith',p:V(0,H/2,0),side:-1,dy:-46});
    return {group:g,labels,paths,rates:{water:18,sugar:11},update(){}};
  }

  // ── Root hair zone: root hairs among soil grains, cortex, endodermis, star-shaped xylem, root cap ──
  function buildRoot(plant){
    const g=new T.Group(),R=.6,top=1.5,bot=-1.0,labels=[],paths={water:[]};
    const cellG=cellGeometry(.45),roundG=cellGeometry(.75);
    const epiMat=membrane(0xf1ead3,{base:.26,rim:.6,rimCol:0xfffbea}),corMat=membrane(0xeee3c6,{base:.18,rim:.58,rimCol:0xfff8e8}),endMat=membrane(0xe0bf7f,{base:.34,rim:.5});
    const ring=(r,spacing,ystep,half,mat,geo,colour,y0=bot,y1=top)=>{
      const list=[],n=Math.max(6,Math.round(TAU*r/spacing));
      for(let yy=y0+ystep/2;yy<y1;yy+=ystep)for(let k=0;k<n;k++){const a=(k+(Math.round(yy/ystep)%2)*.5)/n*TAU;if(inCut(a))continue;
        list.push({p:V(Math.cos(a)*r,yy,Math.sin(a)*r),q:yRot(a),s:V(half[0],half[1],(TAU*r/n)*.46),c:col(colour)});}
      return instanced(geo,mat,list,g);
    };
    ring(.56,.12,.19,[.04,.09],epiMat,cellG,0xf3ecd6);
    [.47,.38,.3].forEach(r=>ring(r,.1,.15,[.045,.072],corMat,roundG,0xefe4c8));
    ring(.22,.075,.12,[.022,.058],endMat,cellG,0xdcb573);
    // stele: xylem star with phloem between the arms
    const tubeG=new T.CylinderGeometry(1,1,top-bot,14,1,true);tubeG.translate(0,(top+bot)/2,0);
    const xyMat=membrane(0x9cc9df,{base:.14,rim:.72,rimCol:0xd8f1ff}),phMat=membrane(0xe9d19a,{base:.24,rim:.6});
    const ringMat=solid(0xd8e6cc),ringG=new T.TorusGeometry(1,.1,6,16);ringG.rotateX(Math.PI/2);
    const X=[{p:V(0,0,0),s:V(.05,1,.05)}],PH=[],RG=[],arms=[];
    for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;arms.push(a);
      [[.07,.04],[.115,.032],[.155,.024]].forEach(([r,rad])=>{const p=V(Math.cos(a)*r,0,Math.sin(a)*r);X.push({p,s:V(rad,1,rad)});});
      const b=a+Math.PI/4;[[.13,-.03],[.13,.03]].forEach(([r,o])=>{const aa=b+o/r;PH.push({p:V(Math.cos(aa)*r,0,Math.sin(aa)*r),s:V(.02,1,.02)});});}
    X.forEach(x=>{for(let y=bot+.03;y<top;y+=.06)RG.push({p:V(x.p.x,y,x.p.z),s:V(x.s.x*.95,x.s.x*.95,x.s.x*.95)});});
    instanced(tubeG,xyMat,X,g);instanced(tubeG,phMat,PH,g);instanced(ringG,ringMat,RG,g);
    // root cap
    const cap=[];
    for(let yy=bot-.03;yy>-1.62;yy-=.1){const rr=R*Math.sqrt(Math.max(.02,(yy+1.66)/.66))*.95,n=Math.max(5,Math.round(TAU*rr/.12));
      for(let k=0;k<n;k++){const a=k/n*TAU+yy*3;if(inCut(a)&&rr>.2)continue;const loose=rr>.3&&RND()<.2?.05:0;
        cap.push({p:V(Math.cos(a)*(rr+loose),yy-loose,Math.sin(a)*(rr+loose)),s:V(.06,.05,.06),q:new T.Quaternion().setFromEuler(_E.set(RND(),RND(),RND())),c:col(0xe7d3a1)});}}
    instanced(roundG,membrane(0xe7d3a1,{base:.3,rim:.55}),cap,g);
    // soil grains with water films
    const grainMat=new T.MeshStandardMaterial({color:0x7a6650,roughness:.92,flatShading:true}),filmMat=membrane(0x66b8ff,{base:.08,rim:.55,rimCol:0x9fd6ff});
    const grains=[];
    for(let tries=0;tries<400&&grains.length<20;tries++){
      const a=RND()*TAU;if(inCut(a)&&RND()<.85)continue;
      const r=1.3+RND()*1.3,y=-1.3+RND()*2.9,s=.15+RND()*.17,p=V(Math.cos(a)*r,y,Math.sin(a)*r);
      if(grains.some(o=>o.p.distanceTo(p)<o.s+s+.12))continue;
      const geo=new T.IcosahedronGeometry(1,1),pp=geo.attributes.position;
      for(let i=0;i<pp.count;i++){_pp.fromBufferAttribute(pp,i).multiplyScalar(.8+RND()*.35);pp.setXYZ(i,_pp.x,_pp.y,_pp.z);}geo.computeVertexNormals();
      const m=new T.Mesh(geo,grainMat);m.position.copy(p);m.scale.setScalar(s);m.rotation.set(RND()*3,RND()*3,RND()*3);g.add(m);
      const f=new T.Mesh(new T.SphereGeometry(1,24,16),filmMat);f.position.copy(p);f.scale.setScalar(s*1.22);f.renderOrder=4;g.add(f);
      grains.push({p,s});
    }
    // root hairs grow from epidermal cells toward nearby grains
    const hairMat=membrane(0xf6f0dd,{base:.36,rim:.55,rimCol:0xffffff});
    let hairLabel=null;
    for(let n=0;n<52;n++){
      let a;do{a=RND()*TAU;}while(inCut(a)&&RND()<.8);
      const y=-.45+RND()*1.8,base=V(Math.cos(a)*(R-.01),y,Math.sin(a)*(R-.01)),out=V(Math.cos(a),0,Math.sin(a));
      let target=null,best=9;grains.forEach(gr=>{const d=gr.p.distanceTo(base);const dir=gr.p.clone().sub(base).normalize();if(dir.dot(out)>.35&&d<best&&d<2.4){best=d;target=gr;}});
      const L=.8+RND()*.9;let tip;
      if(target){const dir=base.clone().sub(target.p).normalize();tip=target.p.clone().addScaledVector(dir,target.s*1.15);}
      else tip=base.clone().addScaledVector(out,L).add(V(0,(RND()-.5)*.5,0));
      const mid=base.clone().lerp(tip,.5).add(V((RND()-.5)*.2,(RND()-.5)*.25,(RND()-.5)*.2));
      const curve=new T.CatmullRomCurve3([base,base.clone().addScaledVector(out,.12),mid,tip]);
      const m=new T.Mesh(new T.TubeGeometry(curve,24,.022,7,false),hairMat);m.renderOrder=2;g.add(m);
      const tipBall=new T.Mesh(new T.SphereGeometry(.024,10,8),hairMat);tipBall.position.copy(tip);g.add(tipBall);
      const pts=curve.getPoints(10).reverse();
      const arm=arms.reduce((b,x)=>Math.abs(Math.atan2(Math.sin(x-a),Math.cos(x-a)))<Math.abs(Math.atan2(Math.sin(b-a),Math.cos(b-a)))?x:b,arms[0]);
      const film=tip.clone().add(V((RND()-.5)*.15,(RND()-.5)*.15,(RND()-.5)*.15));
      paths.water.push(makePoly([film,...pts,V(Math.cos(a)*.4,y,Math.sin(a)*.4),V(Math.cos(a)*.22,y,Math.sin(a)*.22),V(Math.cos(arm)*.12,y+.05,Math.sin(arm)*.12),V(Math.cos(arm)*.12,top+.1,Math.sin(arm)*.12)]));
      if(!hairLabel&&Math.cos(a)<-.3&&Math.sin(a)>.3)hairLabel=mid.clone();
    }
    const vis=grains.find(gr=>Math.sin(Math.atan2(gr.p.z,gr.p.x))>0)||grains[0];
    labels.push({text:'Root hairs',p:hairLabel||V(-1,.6,1),side:-1},{text:'Soil grain + water film',p:vis?vis.p.clone():V(1.5,0,1),side:1},
      {text:'Epidermis',p:V(Math.cos(-.4)*R,1.1,Math.sin(-.4)*R),side:1},{text:'Cortex',p:V(.38,top,-.03),side:1},{text:'Endodermis',p:V(.22,top,-.02),side:1},
      {text:'Xylem',p:V(Math.cos(arms[0])*.12,top,Math.sin(arms[0])*.12),side:-1},{text:'Phloem',p:V(Math.cos(arms[1]+Math.PI/4)*.13,top,Math.sin(arms[1]+Math.PI/4)*.13),side:-1},{text:'Root cap',p:V(.1,-1.55,.3),side:1});
    return {group:g,labels,paths,rates:{water:26},update(){}};
  }

  // ── Renderer, scene and lens ──
  function initMicro(){
    if(micro.renderer||micro.failed)return !!micro.renderer;
    try{micro.renderer=new T.WebGLRenderer({canvas:microCanvas,antialias:true,alpha:false,powerPreference:'high-performance'});}
    catch(e){micro.failed=true;return false;}
    const r=micro.renderer;r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.12;
    const sc=micro.scene=new T.Scene();
    const cv=document.createElement('canvas');cv.width=cv.height=256;const cx=cv.getContext('2d');
    const gr=cx.createRadialGradient(128,110,10,128,128,190);gr.addColorStop(0,'#2a4a3e');gr.addColorStop(.55,'#15271f');gr.addColorStop(1,'#0a1410');
    cx.fillStyle=gr;cx.fillRect(0,0,256,256);const bg=new T.CanvasTexture(cv);bg.colorSpace=T.SRGBColorSpace;sc.background=bg;
    sc.fog=new T.Fog(0x13241d,10,19);
    // environment for glassy cell walls
    const envScene=new T.Scene(),envGeo=new T.SphereGeometry(10,32,16);
    envScene.add(new T.Mesh(envGeo,new T.ShaderMaterial({side:T.BackSide,vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec3 p;void main(){float y=normalize(p).y;vec3 c=mix(vec3(.08,.14,.11),vec3(1.1,1.12,1.),smoothstep(-.2,.9,y));c+=vec3(2.5,2.4,2.1)*smoothstep(.93,.99,dot(normalize(p),normalize(vec3(-.4,.8,.3))));gl_FragColor=vec4(c,1.);}'})));
    const pm=new T.PMREMGenerator(r);sc.environment=pm.fromScene(envScene,.02).texture;pm.dispose();
    sc.add(new T.HemisphereLight(0xe8fff0,0x1c2a22,.7));
    const key=new T.DirectionalLight(0xfff3dc,2.2);key.position.set(-3,6,4);sc.add(key);
    const rim=new T.DirectionalLight(0x9fe8ff,1.3);rim.position.set(4,2,-5);sc.add(rim);
    const fillL=new T.PointLight(0xbfffd6,6,12,2);fillL.position.set(2,-2,4);sc.add(fillL);
    micro.camera=new T.PerspectiveCamera(30,1,.05,40);
    microCanvas.addEventListener('webglcontextlost',e=>{e.preventDefault();closeMicroscope();micro.failed=true;});
    return true;
  }
  function specimen(kind){
    const key=kind+':'+rig.kind;
    if(!micro.specimens[key]){
      const s=(kind==='leaf'?buildLeaf:kind==='stem'?buildStem:buildRoot)(rig.kind);
      s.particles=makeParticles(s.group);s.group.visible=false;micro.scene.add(s.group);micro.specimens[key]=s;
    }
    return micro.specimens[key];
  }
  const tagEls=[];
  function renderMicroLabels(){
    microLabelsEl.innerHTML='';tagEls.length=0;
    if(!micro.current)return;
    for(const l of micro.current.labels){
      const dot=document.createElement('span');dot.className='micro-dot';
      const line=document.createElement('span');line.className='micro-line';
      const tag=document.createElement('span');tag.className='micro-tag';tag.textContent=tr(l.text);
      microLabelsEl.append(line,dot,tag);tagEls.push({l,dot,line,tag});
    }
  }
  const _lp=V();
  function placeMicroLabels(){
    microLabelsEl.hidden=!micro.labels;if(!micro.labels)return;
    const s=micro.size,placed=[];
    for(const e of tagEls){
      _lp.copy(e.l.p).applyMatrix4(micro.current.group.matrixWorld).project(micro.camera);
      const x=(_lp.x*.5+.5)*s,y=(-_lp.y*.5+.5)*s,rr=Math.hypot(x-s/2,y-s/2);
      const vis=_lp.z<1&&rr<s*.44;
      e.dot.hidden=e.line.hidden=e.tag.hidden=!vis;if(!vis)continue;
      const w=e.tag.offsetWidth||90,h=e.tag.offsetHeight||20;
      let tx=x+e.l.side*(34+w/2),ty=y-18+(e.l.dy||0);
      tx=clamp(tx,w/2+s*.08,s-w/2-s*.08);
      for(let k=0;k<10;k++){const hit=placed.find(p=>Math.abs(p.x-tx)<(p.w+w)/2+4&&Math.abs(p.y-ty)<h+3);if(!hit)break;ty=hit.y+(ty<=hit.y?-(h+4):(h+4));}
      placed.push({x:tx,y:ty,w});
      e.dot.style.left=`${x}px`;e.dot.style.top=`${y}px`;
      e.tag.style.left=`${tx}px`;e.tag.style.top=`${ty}px`;
      const ex=tx-Math.sign(tx-x)*w/2,dist=Math.hypot(ex-x,ty-y);
      e.line.style.left=`${x}px`;e.line.style.top=`${y}px`;e.line.style.width=`${dist}px`;e.line.style.transform=`rotate(${Math.atan2(ty-y,ex-x)}rad)`;
    }
  }
  function layoutMicro(){
    const avail=Math.max(160,sceneBottom-sceneTop-24),s=Math.round(Math.min(width*.68,avail,720));
    micro.size=s;const cx=width/2,cy=sceneTop+(sceneBottom-sceneTop)/2+4;
    Object.assign(lensEl.style,{width:`${s}px`,height:`${s}px`,left:`${cx-s/2}px`,top:`${cy-s/2}px`});
    const head=$('microHead'),tabs=$('microTabs'),close=$('microClose'),cap=$('microCaption');
    head.style.left=`${cx}px`;head.style.top=`${cy-s/2+s*.07}px`;
    tabs.style.left=`${cx}px`;tabs.style.top=`${cy+s/2-s*.075}px`;
    close.style.left=`${cx+s*.39}px`;close.style.top=`${cy-s*.39}px`;
    const room=width-(cx+s/2)-28;
    if(room>=210){cap.hidden=false;cap.classList.remove('below');cap.style.left=`${cx+s/2+22}px`;cap.style.top=`${cy}px`;cap.style.width=`${Math.min(280,room-8)}px`;}
    else cap.hidden=true;
    if(micro.renderer){const pr=Math.min(window.devicePixelRatio||1,2);micro.renderer.setPixelRatio(pr);micro.renderer.setSize(s,s,false);micro.camera.aspect=1;micro.camera.updateProjectionMatrix();}
  }
  function setSpecimen(kind,resetView=true){
    micro.kind=kind;
    Object.values(micro.specimens).forEach(s=>s.group.visible=false);
    micro.current=specimen(kind);micro.current.group.visible=true;
    if(resetView){const v=VIEW[kind];micro.theta=micro.wTheta=v.theta;micro.phi=micro.wPhi=v.phi;micro.radius=micro.wRadius=v.radius*(micro.size<420?1.12:1);}
    document.querySelectorAll('[data-micro]').forEach(b=>{const on=b.dataset.micro===kind;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    updateMicroText();renderMicroLabels();
  }
  function updateMicroText(){
    $('microTitle').textContent=tr(TITLES[micro.kind]);$('microMag').textContent=MAG[micro.kind];
    $('microDesc').textContent=tr(DESCR[micro.kind]);$('microHint').textContent=tr('Drag to turn · scroll to zoom');
    const legend=micro.kind==='leaf'?['water','sugar','co2','o2']:micro.kind==='stem'?['water','sugar']:['water'];
    $('microLegend').innerHTML=legend.map(k=>`<span class="lg lg-${k}"><i></i>${k==='co2'?'CO₂':k==='o2'?'O₂':tr(k==='water'?'Water':'Sugar')}</span>`).join('');
    $('microClose').title=tr('Close microscope');$('microClose').setAttribute('aria-label',tr('Close microscope'));
    $('microLabelsToggle').title=tr('Show labels');
    document.querySelectorAll('[data-micro]').forEach(b=>b.querySelector('span').textContent=tr(b.dataset.micro[0].toUpperCase()+b.dataset.micro.slice(1)));
    tagEls.forEach(e=>e.tag.textContent=tr(e.l.text));
  }
  function microFrame(now){
    if(!microState.open)return;
    micro.raf=requestAnimationFrame(microFrame);
    const dt=Math.min(.05,(now-micro.last)/1000||.016);micro.last=now;
    if(!reducedMotion)micro.time+=dt;
    const s=micro.current,t=micro.time;
    if(!micro.dragging){micro.idle+=dt;if(!reducedMotion&&micro.idle>2.5){const v=VIEW[micro.kind];micro.wTheta=mix(micro.wTheta,v.theta+.28*Math.sin(t*.16),dt*.4);}}
    const a=reducedMotion?1:1-Math.exp(-dt*7);
    micro.theta=mix(micro.theta,micro.wTheta,a);micro.phi=mix(micro.phi,micro.wPhi,a);micro.radius=mix(micro.radius,micro.wRadius,a);
    const c=micro.camera,sp=Math.sin(micro.phi);
    c.position.set(micro.radius*sp*Math.sin(micro.theta),micro.radius*Math.cos(micro.phi)+.1,micro.radius*sp*Math.cos(micro.theta));c.lookAt(0,.05,0);
    if(!reducedMotion)s.update(dt,t);
    const P=s.particles;P.u.uScale.value=micro.size/(2*Math.tan(c.fov*Math.PI/360));P.u.uPixelRatio.value=micro.renderer.getPixelRatio();
    P.pts.visible=!reducedMotion;
    if(!reducedMotion)updateParticles(P,dt,s.rates,s.paths);
    micro.renderer.render(micro.scene,c);
    placeMicroLabels();
  }
  function openMicroscope(kind,x,y){
    if(!initMicro()){toast('Microscope view is not available in this browser.');return;}
    stopMicroPick();
    microState.open=true;microEl.hidden=false;
    layoutMicro();
    lensEl.style.transformOrigin=x!=null?`${x-parseFloat(lensEl.style.left)}px ${y-parseFloat(lensEl.style.top)}px`:'50% 50%';
    setSpecimen(kind);
    $('lab').classList.add('micro-open');
    requestAnimationFrame(()=>microEl.classList.add('open'));
    micro.last=performance.now();cancelAnimationFrame(micro.raf);micro.raf=requestAnimationFrame(microFrame);
    $('microButton').classList.add('active');$('microButton').setAttribute('aria-pressed','true');
    setTimeout(()=>{if(microState.open)$('microClose').focus({preventScroll:true});},350);
  }
  function closeMicroscope(immediate=false){
    stopMicroPick();
    if(!microState.open)return;
    microState.open=false;cancelAnimationFrame(micro.raf);
    microEl.classList.remove('open');$('lab').classList.remove('micro-open');
    $('microButton').classList.remove('active');$('microButton').setAttribute('aria-pressed','false');
    const hide=()=>{if(!microState.open)microEl.hidden=true;};
    if(immediate||reducedMotion)hide();else setTimeout(hide,420);
    canvas.focus({preventScroll:true});
  }
  microState.close=closeMicroscope;
  function stopMicroPick(){microState.picking=false;canvas.classList.remove('micro-pick');if(!microState.open){$('microButton').classList.remove('active');$('microButton').setAttribute('aria-pressed','false');}}
  const PART_TO_SPECIMEN={leaf:'leaf',trifoliate:'leaf',cotyledon:'leaf',stem:'stem',hypocotyl:'stem',root:'root',radicle:'root',lateral:'root'};
  microState.onPick=(hit,e)=>{
    const kind=hit&&PART_TO_SPECIMEN[hit.part];
    if(!kind){toast('Try tapping a leaf, the stem or a root');return;}
    openMicroscope(kind,e.clientX-viewport.getBoundingClientRect().left,e.clientY-viewport.getBoundingClientRect().top);
  };
  function toggleMicroPick(){
    if(microState.open){closeMicroscope();return;}
    if(microState.picking){stopMicroPick();return;}
    microState.picking=true;canvas.classList.add('micro-pick');
    $('microButton').classList.add('active');$('microButton').setAttribute('aria-pressed','true');
    toast('Microscope · tap a leaf, the stem or a root to zoom in',{},3600);
  }
  $('microButton').addEventListener('click',toggleMicroPick);
  $('microClose').addEventListener('click',()=>closeMicroscope());
  microEl.querySelector('.micro-backdrop').addEventListener('click',()=>closeMicroscope());
  document.querySelectorAll('[data-micro]').forEach(b=>b.addEventListener('click',()=>setSpecimen(b.dataset.micro)));
  $('microLabelsToggle').addEventListener('click',()=>{micro.labels=!micro.labels;$('microLabelsToggle').classList.toggle('active',micro.labels);$('microLabelsToggle').setAttribute('aria-pressed',String(micro.labels));});
  // lens navigation
  const mp=new Map();let mpDist=0;
  microCanvas.addEventListener('pointerdown',e=>{mp.set(e.pointerId,{x:e.clientX,y:e.clientY});microCanvas.setPointerCapture(e.pointerId);micro.dragging=true;micro.idle=0;if(mp.size===2){const p=[...mp.values()];mpDist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}});
  microCanvas.addEventListener('pointermove',e=>{const prev=mp.get(e.pointerId);if(!prev)return;
    if(mp.size>=2){mp.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...mp.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(mpDist>0)micro.wRadius=clamp(micro.wRadius*mpDist/d,4.2,13);mpDist=d;return;}
    micro.wTheta-=(e.clientX-prev.x)*.007;micro.wPhi=clamp(micro.wPhi-(e.clientY-prev.y)*.006,.25,2.6);mp.set(e.pointerId,{x:e.clientX,y:e.clientY});});
  const endMp=e=>{mp.delete(e.pointerId);if(!mp.size){micro.dragging=false;micro.idle=0;}};
  microCanvas.addEventListener('pointerup',endMp);microCanvas.addEventListener('pointercancel',endMp);
  microCanvas.addEventListener('wheel',e=>{e.preventDefault();micro.wRadius=clamp(micro.wRadius*Math.exp(clamp(e.deltaY,-120,120)*.0015),4.2,13);micro.idle=0;},{passive:false});
  microCanvas.addEventListener('dblclick',()=>setSpecimen(micro.kind));
  document.addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA')return;
    if(microState.open){
      const k=e.key.toLowerCase(),order=['leaf','stem','root'];
      if(k==='escape'||k==='z'){e.preventDefault();e.stopPropagation();closeMicroscope();return;}
      if(k==='arrowright'||k==='arrowleft'){e.preventDefault();e.stopPropagation();setSpecimen(order[(order.indexOf(micro.kind)+(k==='arrowright'?1:2))%3]);return;}
      if(k==='l'){e.preventDefault();e.stopPropagation();$('microLabelsToggle').click();return;}
      if(k!=='tab'&&!e.altKey&&!e.ctrlKey&&!e.metaKey)e.stopPropagation();
      return;
    }
    if(e.key.toLowerCase()==='z'&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!document.querySelector('dialog[open]')){e.preventDefault();toggleMicroPick();}
    else if(e.key==='Escape'&&microState.picking)stopMicroPick();
  },true);
  window.addEventListener('resize',()=>{if(microState.open)layoutMicro();});
  new ResizeObserver(()=>{if(microState.open)layoutMicro();}).observe(viewport);
  const prevRefresh=refreshLocalizedScene;
  refreshLocalizedScene=()=>{prevRefresh();$('microButton').title=tr('Microscope (Z)');$('microButton').setAttribute('aria-label',tr('Microscope'));if(microState.open)updateMicroText();};
  $('microButton').title=tr('Microscope (Z)');
