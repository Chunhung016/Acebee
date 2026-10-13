
  // ══════════════════════════════════════════════════════════════════════════
  //  Renderer, cinematic post-processing, lighting moods and procedural textures
  // ══════════════════════════════════════════════════════════════════════════
  const T=window.THREE,canvas=$('scene'),viewport=$('viewport');
  let renderer;
  try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}
  catch(e){failScene();return;}
  const isWebGL2=renderer.capabilities.isWebGL2;
  const maxAniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const deviceRatio=Math.min(window.devicePixelRatio||1,1.5);
  let qualityScale=1;
  renderer.setPixelRatio(deviceRatio);
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFShadowMap;
  renderer.shadowMap.autoUpdate=false;
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(38,1,.025,120);

  const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
  const smoother=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10);};
  function settle(state,target,omega,dt){
    const offset=state.value-target,decay=Math.exp(-omega*dt),travel=(state.velocity+omega*offset)*dt;
    state.value=target+(offset+travel)*decay;state.velocity=(state.velocity-omega*travel)*decay;
    if(Math.abs(state.value-target)<.0001&&Math.abs(state.velocity)<.001){state.value=target;state.velocity=0;}
    return state.value;
  }
  const keys=(values,g)=>{const i=Math.max(0,Math.min(values.length-2,Math.floor(g)));return mix(values[i],values[i+1],smooth(0,1,g-i));};
  const TAU=Math.PI*2;
  let randomState=24817;
  const rand=()=>{randomState=(Math.imul(1664525,randomState)+1013904223)>>>0;return randomState/4294967296;};
  function hash3(x,y,z){let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(z|0,2147483647);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
  function noise3(x,y,z){
    const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);
    const fade=t=>t*t*(3-2*t),fx=fade(x-ix),fy=fade(y-iy),fz=fade(z-iz);
    const layer=dz=>mix(mix(hash3(ix,iy,iz+dz),hash3(ix+1,iy,iz+dz),fx),mix(hash3(ix,iy+1,iz+dz),hash3(ix+1,iy+1,iz+dz),fx),fy);
    return mix(layer(0),layer(1),fz);
  }
  // Periodic value noise and fBm: textures tile without seams.
  function pnoise(x,y,p,seed){
    const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
    const w=v=>((v%p)+p)%p;
    const a=hash3(w(ix),w(iy),seed),b=hash3(w(ix+1),w(iy),seed),c=hash3(w(ix),w(iy+1),seed),d=hash3(w(ix+1),w(iy+1),seed);
    return mix(mix(a,b,sx),mix(c,d,sx),sy);
  }
  function pfbm(x,y,p,oct,seed){let v=0,amp=.5,tot=0;for(let o=0;o<oct;o++){v+=pnoise(x,y,p,seed+o*17)*amp;tot+=amp;x*=2;y*=2;p*=2;amp*=.5;}return v/tot;}
  // Periodic Worley: returns [F1,F2] distances in cell units.
  function worley(x,y,n,seed,out){
    const ix=Math.floor(x),iy=Math.floor(y);let f1=9,f2=9;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const cx=ix+i,cy=iy+j,wx=((cx%n)+n)%n,wy=((cy%n)+n)%n;
      const px=cx+hash3(wx,wy,seed),py=cy+hash3(wx,wy,seed+9),d=Math.hypot(px-x,py-y);
      if(d<f1){f2=f1;f1=d;}else if(d<f2)f2=d;
    }
    out[0]=f1;out[1]=f2;return out;
  }
  const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  function canvasTexture(c,{srgb=true,repeat=false}={}){
    const t=new T.CanvasTexture(c);if(srgb)t.colorSpace=T.SRGBColorSpace;
    t.anisotropy=maxAniso;if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;return t;
  }
  // Tangent-space normal map from a height field (0..1).
  function normalMapFrom(hf,w,h,strength,wrap=true){
    const c=makeCanvas(w,h),ctx=c.getContext('2d'),img=ctx.createImageData(w,h),d=img.data;
    const at=(x,y)=>{if(wrap){x=(x+w)%w;y=(y+h)%h;}else{x=clamp(x,0,w-1);y=clamp(y,0,h-1);}return hf[y*w+x];};
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const gx=(at(x+1,y)-at(x-1,y))*strength,gy=(at(x,y+1)-at(x,y-1))*strength;
      const nx=-gx,ny=gy,nz=1,l=Math.hypot(nx,ny,nz),i=(y*w+x)*4;
      d[i]=(nx/l*.5+.5)*255;d[i+1]=(ny/l*.5+.5)*255;d[i+2]=(nz/l*.5+.5)*255;d[i+3]=255;
    }
    ctx.putImageData(img,0,0);return canvasTexture(c,{srgb:false,repeat:wrap});
  }
  function imageFrom(w,h,fn,{srgb=true,repeat=false}={}){
    const c=makeCanvas(w,h),ctx=c.getContext('2d'),img=ctx.createImageData(w,h),d=img.data,col=[0,0,0];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){fn(x,y,col);const i=(y*w+x)*4;d[i]=clamp(col[0],0,255);d[i+1]=clamp(col[1],0,255);d[i+2]=clamp(col[2],0,255);d[i+3]=255;}
    ctx.putImageData(img,0,0);return canvasTexture(c,{srgb,repeat});
  }

  // ── Lighting rig ────────────────────────────────────────────────────────────
  const G={sunDirView:{value:V(0,1,0)},sunColor:{value:new T.Color(1,1,1)},time:{value:0}};
  const hemi=new T.HemisphereLight(0xf4f8ff,0x8c9a74,.5);scene.add(hemi);
  const sun=new T.DirectionalLight(0xfff2dc,3.3);
  sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);
  Object.assign(sun.shadow.camera,{left:-4.6,right:4.6,top:5.6,bottom:-4.2,near:.5,far:26});
  sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;sun.shadow.radius=3.2;
  sun.target.position.set(0,.4,0);scene.add(sun,sun.target);
  const rim=new T.DirectionalLight(0xdfeaff,1.5);rim.position.set(5,4.5,-5);scene.add(rim);
  const fill=new T.DirectionalLight(0xfff5e8,.32);fill.position.set(1,-.5,8);scene.add(fill);
  const moods={
    day:{name:'Daylight',sun:0xfff1da,sunI:3.3,sunPos:[-4.2,8.6,6],hemiSky:0xf2f7ff,hemiGround:0x8d9a74,hemiI:.5,rim:0xdfeaff,rimI:1.45,rimPos:[5,4.5,-5],fillI:.32,exposure:1.04,envI:.95,
      env:{top:[.55,.68,.92],horizon:[1.05,1.03,.96],ground:[.32,.30,.23],sun:[18,16.5,13.5]},
      bg:['#f8faef','#edf1e5','#dde5d3','#d6dfcb'],grade:{tint:[1,1,.985],sat:1.07,contrast:1.06,lift:.004,vignette:.16,bloom:.34,thresh:1.05}},
    golden:{name:'Golden hour',sun:0xffa65a,sunI:3.9,sunPos:[-7.5,2.9,3.4],hemiSky:0xffd9ae,hemiGround:0x6b5641,hemiI:.36,rim:0xffb86b,rimI:2.7,rimPos:[6,2.6,-5.5],fillI:.2,exposure:1.0,envI:.85,
      env:{top:[.52,.50,.62],horizon:[1.25,.92,.62],ground:[.30,.22,.15],sun:[26,15,6]},
      bg:['#fbf2df','#f1e5ce','#e3d3b7','#d9c7a8'],grade:{tint:[1.05,.985,.9],sat:1.12,contrast:1.1,lift:.01,vignette:.24,bloom:.55,thresh:.9}},
    studio:{name:'Soft studio',sun:0xffffff,sunI:2.5,sunPos:[-3,9.5,5.5],hemiSky:0xffffff,hemiGround:0x9aa39a,hemiI:.85,rim:0xe8f0ff,rimI:1.2,rimPos:[4,5,-6],fillI:.5,exposure:1.06,envI:1.15,
      env:{top:[.9,.92,.95],horizon:[.95,.96,.96],ground:[.45,.46,.44],sun:[9,9,9],boxes:true},
      bg:['#f5f7f4','#eceeea','#dfe3dd','#d7dcd5'],grade:{tint:[1,1,1.01],sat:1.02,contrast:1.04,lift:0,vignette:.12,bloom:.26,thresh:1.2}}
  };
  const moodOrder=['day','golden','studio'];
  let moodKey='day',mood=moods.day;
  const hexToLinear=h=>new T.Color(h);
  const bgColors=[0,1,2,3].map(()=>new T.Color());

  // Image-based lighting: a procedural sky rendered into a PMREM environment.
  const pmrem=new T.PMREMGenerator(renderer);
  const envScene=new T.Scene();
  const skyUniforms={top:{value:new T.Vector3()},horizon:{value:new T.Vector3()},ground:{value:new T.Vector3()},sunDir:{value:V()},sunCol:{value:new T.Vector3()}};
  const skyMesh=new T.Mesh(new T.SphereGeometry(20,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:skyUniforms,
    vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 vDir;uniform vec3 top,horizon,ground,sunDir,sunCol;
      void main(){vec3 d=normalize(vDir);float y=d.y;
        vec3 c=y>0.?mix(horizon,top,pow(y,.55)):mix(horizon,ground,pow(-y,.4));
        float s=max(0.,dot(d,sunDir));c+=sunCol*(pow(s,220.)*.9+pow(s,18.)*.035);
        gl_FragColor=vec4(c,1.);}`}));
  envScene.add(skyMesh);
  const softboxes=new T.Group();envScene.add(softboxes);
  for(const [x,y,z,w,h,k] of [[-6,7,5,6,4,5.5],[7,3,-3,2.5,7,3.2],[0,-6,6,9,2,.9]]){
    const b=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(k,k,k*.98),side:T.DoubleSide}));
    b.position.set(x,y,z);b.lookAt(0,0,0);softboxes.add(b);
  }
  let envTarget=null;
  function buildEnvironment(){
    const e=mood.env;
    skyUniforms.top.value.set(...e.top);skyUniforms.horizon.value.set(...e.horizon);skyUniforms.ground.value.set(...e.ground);
    skyUniforms.sunDir.value.set(...mood.sunPos).normalize();skyUniforms.sunCol.value.set(...e.sun);
    softboxes.visible=!!e.boxes;
    const next=pmrem.fromScene(envScene,.015);
    if(envTarget)envTarget.dispose();envTarget=next;scene.environment=next.texture;
  }
  function applyMood(key){
    moodKey=key;mood=moods[key];
    sun.color.set(mood.sun);sun.intensity=mood.sunI;sun.position.set(...mood.sunPos);
    hemi.color.set(mood.hemiSky);hemi.groundColor.set(mood.hemiGround);hemi.intensity=mood.hemiI;
    rim.color.set(mood.rim);rim.intensity=mood.rimI;rim.position.set(...mood.rimPos);fill.intensity=mood.fillI;
    renderer.toneMappingExposure=mood.exposure;
    G.sunColor.value.copy(sun.color).multiplyScalar(sun.intensity/3.3);
    mood.bg.forEach((h,i)=>bgColors[i].set(h).convertLinearToSRGB());
    viewport.style.background=`radial-gradient(ellipse at 49% 33%,${mood.bg[0]} 0%,${mood.bg[1]} 38%,${mood.bg[2]} 82%,${mood.bg[3]} 100%)`;
    for(const m of envMaterials)m.envMapIntensity=(m.userData.envBase??1)*mood.envI;
    buildEnvironment();
    renderer.shadowMap.needsUpdate=true;
  }
  const envMaterials=new Set();

  // Direct rendering (the post-processing pipeline was removed for speed).
  const post={enabled:false,failed:true};
  function renderFrame(){renderer.setRenderTarget(null);renderer.render(scene,camera);}

  // ── Material helpers ───────────────────────────────────────────────────────
  // Thin tissue glows when lit from behind: a cheap translucency term added to the physical shader.
  function enhance(material,opts={}){
    const o={trans:0,tint:[.9,1,.5],...opts};
    material.userData.enh=o;
    envMaterials.add(material);material.userData.envBase=material.envMapIntensity??1;
    const chained=o.chain;
    if(!(o.trans>0||o.leaf)){if(chained)material.onBeforeCompile=chained;return material;}
    const trans={value:o.trans},tint={value:new T.Vector3(...o.tint)};
    // leaves: each blade gets a slightly different green, and the underside is paler and more matte
    const vary={value:new T.Vector3(1+(Math.random()-.5)*.08,1+(Math.random()-.5)*.06,1+(Math.random()-.5)*.1)};
    material.userData.transU=trans;material.userData.tintU=tint;
    material.onBeforeCompile=shader=>{
      shader.uniforms.uSunDirV=G.sunDirView;shader.uniforms.uSunCol=G.sunColor;shader.uniforms.uTrans=trans;shader.uniforms.uTransTint=tint;shader.uniforms.uVary=vary;
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uSunDirV;uniform vec3 uSunCol;uniform float uTrans;uniform vec3 uTransTint;uniform vec3 uVary;');
      if(o.leaf)shader.fragmentShader=shader.fragmentShader
        .replace('#include <color_fragment>',`#include <color_fragment>
          diffuseColor.rgb*=uVary;
          #ifdef DOUBLE_SIDED
          if(!gl_FrontFacing)diffuseColor.rgb=diffuseColor.rgb*vec3(1.12,1.17,1.03)+vec3(.02,.032,.012);
          #endif`)
        .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
          #ifdef DOUBLE_SIDED
          if(!gl_FrontFacing)roughnessFactor=min(1.,roughnessFactor+.22);
          #endif`);
      if(o.trans>0)shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
            {vec3 Vd=normalize(vViewPosition);float back=max(0.,-dot(normal,uSunDirV));float fwd=pow(max(0.,-dot(Vd,uSunDirV)),3.)*.7+.3;
             reflectedLight.directDiffuse+=diffuseColor.rgb*uTransTint*uSunCol*back*fwd*uTrans;}`);
      if(chained)chained(shader);
    };
    material.customProgramCacheKey=()=>'enh'+(o.trans>0?'t':'')+(o.leaf?'l':'')+(chained?chained.toString():'');
    return material;
  }
  function cloneEnhanced(material){const m=material.clone();return enhance(m,material.userData.enh||{});}
  const phys=(opts)=>new T.MeshPhysicalMaterial({roughness:.6,metalness:0,...opts});
  const pickables=[];
  function tag(m,part){m.userData.part=part;pickables.push(m);return m;}
  function mesh(geometry,material,parent,part=null){const m=new T.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;if(part)tag(m,part);parent.add(m);return m;}
  const ballGeometry=new T.SphereGeometry(1,32,20);
  function ball(parent,material,scale,position,part){const b=mesh(ballGeometry,material,parent,part);b.scale.set(...scale);b.position.set(...position);return b;}

  // ── Procedural textures ────────────────────────────────────────────────────
  const texSize=(navigator.hardwareConcurrency||4)<=4?512:1024;
  const tmp2=[0,0];
  // Leaf surface: midrib, curved secondary veins, a reticulate tertiary network and soft mottling.
  function leafTextures(kind){
    const S=texSize,c=makeCanvas(S,S),ctx=c.getContext('2d');
    ctx.fillStyle='#000';ctx.fillRect(0,0,S,S);ctx.lineCap='round';
    const pinnate=kind!=='petalBean'&&kind!=='petalTomato';
    const veinPairs=kind==='tomato'?7:kind==='cot'?3:kind==='bean'?8:9;
    const stroke=(w,a,fn)=>{ctx.strokeStyle=`rgba(255,255,255,${a})`;ctx.lineWidth=w*S/1024;ctx.beginPath();fn();ctx.stroke();};
    const X=u=>u*S,Y=v=>(1-v)*S;
    if(pinnate){
      // midrib
      for(const [w,a] of [[14,.35],[8,.7],[4,1]])stroke(w,a,()=>{ctx.moveTo(X(.5),Y(0));ctx.bezierCurveTo(X(.5),Y(.4),X(.502),Y(.75),X(.5),Y(.995));});
      for(let k=0;k<veinPairs;k++){
        const v0=.05+k*(.86/veinPairs),len=.25+.05*Math.sin(k);
        for(const side of [-1,1]){
          const jitter=(hash3(k,side+3,11)-.5)*.02;
          for(const [w,a] of [[9,.25],[4.5,.65],[2.2,.95]])stroke(w*(1-k/veinPairs*.45),a,()=>{
            ctx.moveTo(X(.5),Y(v0+jitter));
            ctx.bezierCurveTo(X(.5+side*.17),Y(v0+.07+jitter),X(.5+side*.34),Y(v0+len*.62),X(.5+side*.45),Y(v0+len));
          });
          // marginal loop joining the next vein
          stroke(1.6,.55,()=>{ctx.moveTo(X(.5+side*.45),Y(v0+len));ctx.quadraticCurveTo(X(.5+side*.47),Y(v0+len+.05),X(.5+side*.43),Y(v0+len+.09));});
        }
      }
    }else{
      for(let k=0;k<17;k++){const a=(k/16-.5)*1.5;for(const [w,al] of [[6,.3],[2.4,.8]])stroke(w,al,()=>{ctx.moveTo(X(.5),Y(.02));ctx.quadraticCurveTo(X(.5+Math.sin(a)*.2),Y(.45),X(.5+Math.sin(a)*.46),Y(.97));});}
    }
    const veinData=ctx.getImageData(0,0,S,S).data;
    const hf=new Float32Array(S*S),col=new Uint8ClampedArray(S*S*4);
    const pal={
      bean:{base:[52,96,33],light:[122,158,70],edge:[40,78,28],mott:.10},
      tomato:{base:[46,88,36],light:[112,150,78],edge:[36,70,30],mott:.12},
      cot:{base:[82,128,48],light:[150,180,96],edge:[66,108,40],mott:.08},
      petalBean:{base:[236,214,242],light:[250,244,252],edge:[178,120,204],mott:.05},
      petalTomato:{base:[250,206,30],light:[255,236,120],edge:[232,168,12],mott:.05}
    }[kind];
    const cells=kind==='tomato'?34:kind==='cot'?20:28;
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){
      const i=y*S+x,u=x/S,v=1-y/S;
      const vein=veinData[i*4]/255;
      worley(u*cells,v*cells,cells,31+kind.length,tmp2);
      const net=pinnate?1-smooth(0,.09,tmp2[1]-tmp2[0]):0;
      const puff=pinnate?smooth(0,.35,tmp2[0]):0;
      const n=pfbm(u*6,v*6,6,4,7),fine=pfbm(u*48,v*48,48,2,3);
      const edge=pinnate?smooth(.30,.5,Math.abs(u-.5)):smooth(.25,.5,Math.hypot(u-.5,(v-.5)*.8));
      let h=.55+puff*.1+fine*.05-vein*.28-net*.07;
      hf[i]=h;
      const lit=clamp(vein*.9+net*.28);
      const m=1+(n-.5)*2*pal.mott+(fine-.5)*.06;
      const baseMix=pinnate?edge*.55:edge*(kind==='petalBean'?.9:.6)+(kind==='petalTomato'?(1-v)*.35:0);
      for(let k=0;k<3;k++){
        let v0=mix(pal.base[k],pal.edge[k],baseMix)*m;
        v0=mix(v0,pal.light[k],lit*(kind==='petalBean'?.2:.62));
        if(kind==='petalBean')v0=mix(v0,[168,98,196][k],vein*.42);
        col[i*4+k]=v0;
      }
      col[i*4+3]=255;
    }
    const cc=makeCanvas(S,S),cctx=cc.getContext('2d'),img=cctx.createImageData(S,S);img.data.set(col);cctx.putImageData(img,0,0);
    return {map:canvasTexture(cc),normal:normalMapFrom(hf,S,S,kind.startsWith('petal')?3:6,false)};
  }
  // Stems: fine longitudinal ridges; tomato adds trichome bases.
  function stemTextures(kind){
    const W=256,H=512,hf=new Float32Array(W*H);
    const map=imageFrom(W,H,(x,y,c)=>{
      const u=x/W,v=y/H,ridge=Math.sin(u*TAU*14+pfbm(u*4,v*8,4,3,5)*5)*.5+.5,n=pfbm(u*8,v*16,8,4,9);
      let dots=0;if(kind==='tomato'){worley(u*22,v*44,22,5,tmp2);dots=1-smooth(.05,.16,tmp2[0]);}
      hf[y*W+x]=ridge*.5+n*.3+dots*.4;
      const k=.9+n*.2-ridge*.08+dots*.12;c[0]=210*k;c[1]=228*k;c[2]=190*k;
    },{repeat:true});
    return {map,normal:normalMapFrom(hf,W,H,4)};
  }
  function rootTextures(){
    const W=256,H=512,hf=new Float32Array(W*H);
    const map=imageFrom(W,H,(x,y,c)=>{
      const u=x/W,v=y/H,n=pfbm(u*6,v*24,6,4,21),w=Math.sin(v*TAU*40+n*9)*.5+.5;
      hf[y*W+x]=n*.6+w*.25;const k=.92+n*.14-w*.05;c[0]=246*k;c[1]=236*k;c[2]=206*k;
    },{repeat:true});
    return {map,normal:normalMapFrom(hf,W,H,3)};
  }
  // Seed coats: glossy kidney-bean red with faint marbling; tomato seeds are fuzzy tan.
  function seedTextures(kind){
    const W=512,H=512,hf=new Float32Array(W*H);
    const map=imageFrom(W,H,(x,y,c)=>{
      const u=x/W,v=y/H,n=pfbm(u*5,v*5,5,5,41),s=pfbm(u*30,v*30,30,2,43);
      if(kind==='bean'){
        const marble=Math.sin((u*3+v*2+n*4)*TAU*.8)*.5+.5;hf[y*W+x]=n*.3+s*.1;
        const k=.86+marble*.12+s*.08;c[0]=150*k;c[1]=62*k;c[2]=46*k;
      }else{
        const fib=Math.sin((u+n*.2)*TAU*60)*.5+.5;hf[y*W+x]=fib*.5+n*.3;
        const k=.9+fib*.12+n*.1;c[0]=214*k;c[1]=190*k;c[2]=138*k;
      }
    },{repeat:true});
    return {map,normal:normalMapFrom(hf,W,H,kind==='bean'?1.2:4)};
  }
  function podTextures(){
    const W=256,H=512,hf=new Float32Array(W*H);
    const map=imageFrom(W,H,(x,y,c)=>{
      const u=x/W,v=y/H,n=pfbm(u*6,v*12,6,4,61),f=pfbm(u*40,v*80,40,2,62),str=Math.sin((u*TAU*18)+n*3)*.5+.5;
      hf[y*W+x]=str*.35+f*.3+n*.3;const k=.9+n*.16+f*.06-str*.04;c[0]=120*k;c[1]=168*k;c[2]=70*k;
    },{repeat:true});
    return {map,normal:normalMapFrom(hf,W,H,3)};
  }
  // Tomato skin: near-white base tinted by the ripening shader; faint stem-end star and speckles.
  function fruitTextures(){
    const W=512,H=512,hf=new Float32Array(W*H);
    const map=imageFrom(W,H,(x,y,c)=>{
      const u=x/W,v=y/H,n=pfbm(u*8,v*8,8,4,71),s=pfbm(u*60,v*60,60,2,72);
      const star=(1-smooth(0,.28,v))*(Math.cos(u*TAU*5)*.5+.5)*.5;
      let sp=0;worley(u*40,v*40,40,73,tmp2);sp=1-smooth(.02,.07,tmp2[0]);
      hf[y*W+x]=n*.4+s*.2-sp*.3;const k=.93+n*.08+star*.08-sp*.06+s*.03;c[0]=c[1]=c[2]=255*k;
    },{repeat:true});
    return {map,normal:normalMapFrom(hf,W,H,.9)};
  }
  // Equatorial cross-section of a tomato: R = flesh, G = locular jelly, B = seeds.
  function sectionTexture(){
    const S=512;
    return imageFrom(S,S,(x,y,c)=>{
      const px=x/S*2-1,py=y/S*2-1,r=Math.hypot(px,py),a=Math.atan2(py,px);
      const lobes=5,rim=.98+.05*Math.cos(a*lobes);
      if(r>rim){c[0]=c[1]=c[2]=0;return;}
      const rr=r/rim,sector=((a/TAU*lobes)%1+1)%1,septum=Math.abs(sector-.5)*2;
      const locule=rr>.26&&rr<.76&&septum<.78-(rr-.26)*.25;
      const n=pfbm((px+1)*6,(py+1)*6,12,3,81);
      let flesh=locule?0:1,gel=locule?1:0,seed=0;
      if(locule){
        const sd=Math.hypot((rr-.52)*3.2,Math.sin((sector-.5)*Math.PI*5)*.55);
        seed=(1-smooth(.12,.2,sd))*(Math.abs(sector-.5)<.36?1:0);gel=1-seed;
      }
      const shade=.78+.22*rr*(flesh?1:0)+n*.12,skin=smooth(.955,.99,rr);
      c[0]=255*flesh*clamp(shade-skin*.2);c[1]=255*gel*(.75+n*.25);c[2]=255*seed;
    },{srgb:false});
  }
  // Soil: aggregates, pores and grit, with a matching normal map.
  function soilTextures(){
    const S=texSize,hf=new Float32Array(S*S);
    const map=imageFrom(S,S,(x,y,c)=>{
      const u=x/S,v=y/S;worley(u*18,v*18,18,902,tmp2);
      const agg=smooth(.0,.55,tmp2[1]-tmp2[0]),n=pfbm(u*8,v*8,8,5,77),grit=hash3(x,y,34);
      worley(u*70,v*70,70,903,tmp2);const pores=1-smooth(.02,.16,tmp2[0]);
      const height=agg*.45+n*.35+grit*.12-pores*.35;hf[y*S+x]=height;
      const b=clamp(150+height*95-pores*80+(grit-.5)*18,40,245);c[0]=b;c[1]=b;c[2]=b*.98;
    },{repeat:true});
    return {map,normal:normalMapFrom(hf,S,S,5)};
  }
