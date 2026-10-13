
  // ══════════════════════════════════════════════════════════════════════════
  //  Shared plant geometry: continuous organic tubes, leaf blades, merged organs
  // ══════════════════════════════════════════════════════════════════════════
  const _q=new T.Quaternion(),_ax=V(),_nr=V(),_bn=V(),_rf=V(),_rad=V(),_nv=V(),_tc=[1,1,1];
  // Rotation-minimising swept tubes with rounded growing tips and optional vertex colour gradients.
  class Tube extends T.Mesh{
    constructor(material,segments,sides,parent,part=null,colored=false){
      const geo=new T.BufferGeometry(),count=(segments+1)*(sides+1),uv=new Float32Array(count*2),idx=[];
      geo.setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3).setUsage(T.DynamicDrawUsage));
      geo.setAttribute('normal',new T.BufferAttribute(new Float32Array(count*3),3).setUsage(T.DynamicDrawUsage));
      for(let i=0;i<=segments;i++)for(let j=0;j<=sides;j++){
        const v=i*(sides+1)+j;uv[v*2]=j/sides;uv[v*2+1]=i/segments*3;
        if(i<segments&&j<sides){const b=v+sides+1;idx.push(v,b,v+1,b,b+1,v+1);}
      }
      geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.setIndex(idx);
      if(colored)geo.setAttribute('color',new T.BufferAttribute(new Float32Array(count*3).fill(1),3).setUsage(T.DynamicDrawUsage));
      super(geo,material);
      this.segments=segments;this.sides=sides;this.colored=colored;
      this.samples=Array.from({length:segments+1},()=>V());this.tangents=Array.from({length:segments+1},()=>V());
      this.lengths=new Float32Array(segments+1);this.total=0;
      this.curve=new T.CatmullRomCurve3([V(),V(0,1,0)],false,'centripetal');
      this.ringSin=new Float32Array(sides+1);this.ringCos=new Float32Array(sides+1);
      for(let j=0;j<=sides;j++){this.ringSin[j]=Math.sin(j/sides*TAU);this.ringCos[j]=Math.cos(j/sides*TAU);}
      this.grownAmount=0;this.radius=0;this.frustumCulled=false;this.castShadow=true;this.receiveShadow=true;
      parent.add(this);if(part)tag(this,part);
    }
    grow(points,r0,amount=1,r1=r0*.35,opt={}){
      this.grownAmount=amount;this.radius=r0;
      this.visible=amount>.002&&r0>.0001&&points.length>1;if(!this.visible)return;
      const curve=this.curve;curve.points=points;
      const S=this.samples,Tg=this.tangents,L=this.lengths,n=this.segments;
      for(let i=0;i<=n;i++)curve.getPoint(i/n*amount,S[i]);
      L[0]=0;for(let i=1;i<=n;i++)L[i]=L[i-1]+S[i].distanceTo(S[i-1]);
      const total=Math.max(L[n],1e-5);this.total=total;
      for(let i=0;i<=n;i++){
        Tg[i].subVectors(S[Math.min(i+1,n)],S[Math.max(i-1,0)]);
        if(Tg[i].lengthSq()<1e-14){if(i)Tg[i].copy(Tg[i-1]);else Tg[i].set(0,1,0);}
        Tg[i].normalize();
      }
      if(Math.abs(Tg[0].z)<.92)_rf.set(0,0,1);else _rf.set(1,0,0);
      _nr.crossVectors(Tg[0],_rf).normalize();
      const pos=this.geometry.attributes.position.array,nor=this.geometry.attributes.normal.array;
      const col=this.colored?this.geometry.attributes.color.array:null;
      const tipLen=Math.min(opt.tip??Math.max(r1*1.6,.004),total*.5),baseLen=opt.base?Math.min(opt.base,total*.4):0,sides=this.sides;
      let k=0,c=0;
      for(let i=0;i<=n;i++){
        if(i>0){_ax.crossVectors(Tg[i-1],Tg[i]);const s=_ax.length();if(s>1e-7){_q.setFromAxisAngle(_ax.multiplyScalar(1/s),Math.atan2(s,Tg[i-1].dot(Tg[i])));_nr.applyQuaternion(_q);}}
        _bn.crossVectors(Tg[i],_nr).normalize();_nr.crossVectors(_bn,Tg[i]).normalize();
        const t=L[i]/total,dEnd=total-L[i];
        let r=opt.radius?opt.radius(t,L[i]):mix(r0,r1,t),along=0,f=1;
        if(tipLen>0&&dEnd<tipLen){const q=1-dEnd/tipLen;f=Math.sqrt(Math.max(0,1-q*q));along=q;}
        if(baseLen>0&&L[i]<baseLen){const q=1-L[i]/baseLen;const fb=Math.sqrt(Math.max(0,1-q*q));f=Math.min(f,fb);along=-q;}
        r*=f;
        if(col){if(opt.color)opt.color(t,S[i],_tc);else{_tc[0]=_tc[1]=_tc[2]=1;}}
        const p=S[i],tg=Tg[i];
        for(let j=0;j<=sides;j++){
          _rad.copy(_nr).multiplyScalar(this.ringCos[j]).addScaledVector(_bn,this.ringSin[j]);
          pos[k]=p.x+_rad.x*r;pos[k+1]=p.y+_rad.y*r;pos[k+2]=p.z+_rad.z*r;
          _nv.copy(_rad).multiplyScalar(f).addScaledVector(tg,along).normalize();
          nor[k]=_nv.x;nor[k+1]=_nv.y;nor[k+2]=_nv.z;k+=3;
          if(col){col[c]=_tc[0];col[c+1]=_tc[1];col[c+2]=_tc[2];c+=3;}
        }
      }
      this.geometry.attributes.position.needsUpdate=true;this.geometry.attributes.normal.needsUpdate=true;
      if(col)this.geometry.attributes.color.needsUpdate=true;
      this.geometry.boundingSphere=null;
    }
    pointAt(t,target){return this.curve.getPoint(clamp(t)*this.grownAmount,target);}
  }

  // Closed thin leaf blades with real thickness, UVs for vein textures and two morph targets:
  // [0] folded bud (unfolds as the leaf matures), [1] tip bend (driven by wind).
  function bladeGeometry(o){
    const rows=o.rows||40,cols=o.cols||18,stride=cols+1,layer=(rows+1)*stride;
    const pos=[],uv=[],colr=[],idx=[],fold=[],bend=[];
    const top=o.top||[1,1,1],bottom=o.bottom||[1.12,1.15,1.02];
    for(let l=0;l<2;l++)for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
      const t=i/rows,u=j/cols*2-1,side=u<0?-1:1,w=o.width(t,side);
      const s=Math.sin(Math.PI*t),e=Math.abs(u);
      const z=(o.surface?o.surface(t,u,w):(.09*s+.07*u*u*s-.1*t*t))-.012*Math.exp(-u*u*160)*s;
      const th=(o.thick||.004)*(.35+.65*s)*(1-.6*u*u);
      const x=w*u,y=t,zz=z+(l===0?th:-th);
      pos.push(x,y,zz);uv.push(u*.5+.5,t);
      const cc=l===0?top:bottom;colr.push(cc[0],cc[1],cc[2]);
      // folded bud: halves close up along the midrib and the blade shortens and rolls
      const fx=x*.12,fy=y*.6+.02,fz=zz+e*w*.95+.28*s*y*y;
      fold.push(fx,fy,fz);
      bend.push(x+.012*y*y*Math.sin(y*5),y,zz+.07*y*y+.02*x*y);
    }
    for(let l=0;l<2;l++)for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
      const a=l*layer+i*stride+j,b=a+stride;
      if(l===0)idx.push(a,a+1,b,a+1,b+1,b);else idx.push(a,b,a+1,a+1,b,b+1);
    }
    for(let i=0;i<rows;i++)for(const j of [0,cols]){
      const a=i*stride+j,b=a+stride;
      if(j===0)idx.push(a,b,a+layer,b,b+layer,a+layer);else idx.push(a,a+layer,b,b,a+layer,b+layer);
    }
    for(const i of [0,rows])for(let j=0;j<cols;j++){const a=i*stride+j;idx.push(a,a+layer,a+1,a+1,a+layer,a+layer+1);}
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setAttribute('color',new T.Float32BufferAttribute(colr,3));g.setIndex(idx);g.computeVertexNormals();
    const gf=new T.BufferGeometry(),gb=new T.BufferGeometry();
    gf.setAttribute('position',new T.Float32BufferAttribute(fold,3));gf.setIndex(idx);gf.computeVertexNormals();
    gb.setAttribute('position',new T.Float32BufferAttribute(bend,3));gb.setIndex(idx);gb.computeVertexNormals();
    g.morphAttributes.position=[gf.attributes.position,gb.attributes.position];
    g.morphAttributes.normal=[gf.attributes.normal,gb.attributes.normal];
    g.morphTargetsRelative=false;g.computeBoundingSphere();
    return g;
  }
  // Many transformed copies of one geometry (with its morph targets) merged into a single draw call.
  function mergeCopies(src,copies){
    const n=src.attributes.position.count,idx=src.index.array,out={position:[],normal:[],uv:[],color:[]},morphP=[],morphN=[],index=[];
    const mp=src.morphAttributes.position||[],mn=src.morphAttributes.normal||[];
    mp.forEach(()=>{morphP.push([]);morphN.push([]);});
    const v=V(),nm=new T.Matrix3();
    copies.forEach((cp,ci)=>{
      nm.getNormalMatrix(cp.matrix);
      const put=(attr,arr,isNormal)=>{for(let i=0;i<n;i++){v.fromBufferAttribute(attr,i);if(isNormal)v.applyMatrix3(nm).normalize();else v.applyMatrix4(cp.matrix);arr.push(v.x,v.y,v.z);}};
      put(src.attributes.position,out.position,false);put(src.attributes.normal,out.normal,true);
      for(let i=0;i<n;i++){out.uv.push(src.attributes.uv.getX(i),src.attributes.uv.getY(i));
        const c=src.attributes.color,t=cp.color||[1,1,1];out.color.push((c?c.getX(i):1)*t[0],(c?c.getY(i):1)*t[1],(c?c.getZ(i):1)*t[2]);}
      mp.forEach((a,k)=>{put(a,morphP[k],false);put(mn[k],morphN[k],true);});
      for(let i=0;i<idx.length;i++)index.push(idx[i]+ci*n);
    });
    const g=new T.BufferGeometry();
    for(const [k,a] of Object.entries(out))g.setAttribute(k,new T.Float32BufferAttribute(a,k==='uv'?2:3));
    g.setIndex(index);
    if(mp.length){g.morphAttributes.position=morphP.map(a=>new T.Float32BufferAttribute(a,3));g.morphAttributes.normal=morphN.map(a=>new T.Float32BufferAttribute(a,3));g.morphTargetsRelative=false;}
    g.computeBoundingSphere();return g;
  }
  const basisMatrix=(pos,y,z,scale=[1,1,1])=>{
    const Y=y.clone().normalize(),Z=z.clone().addScaledVector(Y,-z.dot(Y)).normalize(),X=V().crossVectors(Y,Z);
    return new T.Matrix4().makeBasis(X,Y,Z).scale(V(...scale)).setPosition(pos);
  };
  // Half of a kidney-shaped seed: a dome on one side of the split plane, optionally closed by a flat face.
  function seedHalfGeometry(side,rx,ry,rz,bend,closed){
    const pos=[],uv=[],idx=[],rows=18,cols=48;
    const P=(x,y,z)=>{const k=1-Math.min(1,(y/ry)**2);return [x,y,z-bend*k];};
    for(let i=0;i<=rows;i++){const a=i/rows*Math.PI/2;for(let j=0;j<=cols;j++){const p=j/cols*TAU;
      pos.push(...P(side*rx*Math.cos(a),ry*Math.sin(a)*Math.cos(p),rz*Math.sin(a)*Math.sin(p)));uv.push(j/cols,i/rows*.5);}}
    const st=cols+1;
    for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*st+j,b=a+st;if(side>0)idx.push(a,a+1,b,b,a+1,b+1);else idx.push(a,b,a+1,b,b+1,a+1);}
    if(closed){
      const c=pos.length/3;pos.push(...P(0,0,0));uv.push(.5,.75);const base=rows*st;
      for(let j=0;j<cols;j++){if(side>0)idx.push(c,base+j+1,base+j);else idx.push(c,base+j,base+j+1);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setIndex(idx);g.computeVertexNormals();return g;
  }

  // Shared orientation: object local `aLocal` follows tangent `Tan`, local x stays in the bending plane,
  // and the local point `attach` is pinned to C. This keeps seeds and cotyledons fixed to the hook.
  const _m1=new T.Matrix4(),_m2=new T.Matrix4(),_xw=V(),_zw=V(),_xl=V(1,0,0),_zl=V(),_va=V();
  function frameAlong(object,C,Tan,aLocal,attach,scale){
    _xw.set(Tan.y,-Tan.x,0);if(_xw.lengthSq()<1e-8)_xw.set(1,0,0);_xw.normalize();
    _zw.crossVectors(_xw,Tan).normalize();_zl.crossVectors(_xl,aLocal).normalize();
    _m1.makeBasis(_xw,Tan,_zw);_m2.makeBasis(_xl,aLocal,_zl).transpose();_m1.multiply(_m2);
    object.quaternion.setFromRotationMatrix(_m1);object.scale.setScalar(scale);
    _va.copy(attach).multiplyScalar(scale).applyQuaternion(object.quaternion);object.position.copy(C).sub(_va);
  }
  const _X=V(),_Y=V(),_Z=V(),_M=new T.Matrix4(),UP=V(0,1,0);
  function orientBlade(entry,base,dir,length,width=1,roll=0,pref=UP){
    _Y.copy(dir).normalize();_Z.copy(pref).addScaledVector(_Y,-pref.dot(_Y));
    if(_Z.lengthSq()<1e-6){_Z.set(0,0,1).addScaledVector(_Y,-_Y.z);}
    _Z.normalize();if(roll)_Z.applyAxisAngle(_Y,roll);_X.crossVectors(_Y,_Z);
    _M.makeBasis(_X,_Y,_Z);entry.group.quaternion.setFromRotationMatrix(_M);entry.rest.copy(entry.group.quaternion);
    entry.group.position.copy(base);entry.group.scale.set(Math.max(1e-4,length*width),Math.max(1e-4,length),Math.max(1e-4,length));
  }
  // Smooth piecewise tracks: [[g, value], ...]
  function track(pairs,g){
    if(g<=pairs[0][0])return pairs[0][1];
    for(let i=1;i<pairs.length;i++)if(g<=pairs[i][0]){const [g0,v0]=pairs[i-1],[g1,v1]=pairs[i];return mix(v0,v1,smooth(g0,g1,g));}
    return pairs[pairs.length-1][1];
  }

  // ── Materials per species ──────────────────────────────────────────────────
  const texLeafBean=leafTextures('bean'),texLeafTomato=leafTextures('tomato'),texCot=leafTextures('cot');
  const texPetalBean=leafTextures('petalBean'),texPetalTomato=leafTextures('petalTomato');
  const texStemBean=stemTextures('bean'),texStemTomato=stemTextures('tomato'),texRoot=rootTextures();
  const texSeedBean=seedTextures('bean'),texSeedTomato=seedTextures('tomato'),texPod=podTextures(),texFruit=fruitTextures(),texSection=sectionTexture();
  texStemBean.map.repeat.set(1,2);texStemTomato.map.repeat.set(1,2);texRoot.map.repeat.set(1,3);
  const nsc=(a)=>new T.Vector2(a,a);
  const leafMaterial=(tex,o={})=>enhance(phys({map:tex.map,normalMap:tex.normal,normalScale:nsc(o.ns??.85),roughness:o.rough??.56,vertexColors:true,side:T.DoubleSide,
    sheen:o.sheen??.2,sheenColor:new T.Color(o.sheenColor??0xdff2c0),sheenRoughness:.55,clearcoat:o.coat??0,clearcoatRoughness:.35,envMapIntensity:.85}),{trans:o.trans??.62,tint:o.tint??[.95,1.08,.42],leaf:o.leaf??true});
  const M={
    rootB:enhance(phys({map:texRoot.map,normalMap:texRoot.normal,normalScale:nsc(.6),roughness:.55,vertexColors:true,sheen:.35,sheenColor:new T.Color(0xfff8e6),envMapIntensity:.7}),{trans:.4,tint:[1,.95,.78]}),
    rootCap:enhance(phys({color:0xf4e6b8,roughness:.45,sheen:.4,envMapIntensity:.7}),{trans:.5,tint:[1,.95,.75]}),
    stemB:enhance(phys({map:texStemBean.map,normalMap:texStemBean.normal,normalScale:nsc(.55),roughness:.46,vertexColors:true,sheen:.25,sheenColor:new T.Color(0xe8f7cf),clearcoat:.15,clearcoatRoughness:.4}),{trans:.22,tint:[.9,1.05,.45]}),
    stemT:enhance(phys({map:texStemTomato.map,normalMap:texStemTomato.normal,normalScale:nsc(.7),roughness:.58,vertexColors:true,sheen:.45,sheenColor:new T.Color(0xc4d6a8),sheenRoughness:.55}),{trans:.16,tint:[.9,1.05,.45]}),
    leafB:leafMaterial(texLeafBean,{sheen:.15,coat:.12}),
    leafT:leafMaterial(texLeafTomato,{sheen:.75,sheenColor:0xd9eec2,rough:.62,ns:1}),
    cotT:leafMaterial(texCot,{sheen:.1,coat:.2,trans:.55}),
    coatB:enhance(phys({map:texSeedBean.map,normalMap:texSeedBean.normal,normalScale:nsc(.4),roughness:.32,clearcoat:.9,clearcoatRoughness:.14,side:T.DoubleSide})),
    coatT:enhance(phys({map:texSeedTomato.map,normalMap:texSeedTomato.normal,normalScale:nsc(.9),roughness:.72,sheen:1,sheenColor:new T.Color(0xf6ead0),sheenRoughness:.3,side:T.DoubleSide})),
    cotB:enhance(phys({color:0xcbb87e,roughness:.5,sheen:.12,sheenColor:new T.Color(0xd9d3a8),clearcoat:.18,clearcoatRoughness:.35}),{trans:.16,tint:[.9,1,.5]}),
    hilum:enhance(phys({color:0xf2ead2,roughness:.5})),
    petalB:enhance(phys({map:texPetalBean.map,normalMap:texPetalBean.normal,normalScale:nsc(.5),vertexColors:true,side:T.DoubleSide,roughness:.42,sheen:.5,sheenColor:new T.Color(0xffffff)}),{trans:1,tint:[1,.85,1]}),
    petalT:enhance(phys({map:texPetalTomato.map,normalMap:texPetalTomato.normal,normalScale:nsc(.5),vertexColors:true,side:T.DoubleSide,roughness:.44,sheen:.4,sheenColor:new T.Color(0xfff5c8)}),{trans:1,tint:[1,.9,.35]}),
    sepal:leafMaterial(texLeafTomato,{sheen:.8,rough:.6,trans:.35,leaf:false}),
    calyxB:enhance(phys({color:0x6f9b45,roughness:.5,sheen:.35,sheenColor:new T.Color(0xcfe6a8),normalMap:texLeafBean.normal,normalScale:nsc(.4)}),{trans:.25,tint:[.9,1,.5]}),
    cone:enhance(phys({color:0xe9b40c,roughness:.5,sheen:.3}),{trans:.4,tint:[1,.8,.2]}),
    pod:enhance(phys({map:texPod.map,normalMap:texPod.normal,normalScale:nsc(.6),roughness:.48,sheen:.6,sheenColor:new T.Color(0xe9f6cf),clearcoat:.2,clearcoatRoughness:.35,side:T.DoubleSide}),{trans:.3,tint:[.9,1.05,.4]}),
    podInner:enhance(phys({color:0xdbe8b0,roughness:.72,side:T.DoubleSide,sheen:.6,sheenColor:new T.Color(0xffffff)})),
    newBean:enhance(phys({color:0xdce8ab,roughness:.35,clearcoat:.5,clearcoatRoughness:.2}),{trans:.2}),
    knuckle:enhance(phys({color:0x6c9a36,roughness:.55,sheen:.8,sheenColor:new T.Color(0xe2f0cc)}))
  };
  const youngLeaf=new T.Color(1.22,1.28,.78),matureLeaf=new T.Color(1,1,1);

  // Tomato skin ripens from the blossom end; flesh colours in the slice follow the same ripeness.
  function fruitMaterial(){
    const ripe={value:0};
    const m=enhance(phys({map:texFruit.map,normalMap:texFruit.normal,normalScale:nsc(.35),roughness:.3,clearcoat:1,clearcoatRoughness:.07,envMapIntensity:1.1}),{trans:.22,tint:[1,.45,.25],
      chain:shader=>{
        shader.uniforms.uRipe=ripe;
        shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vObj;').replace('#include <begin_vertex>','#include <begin_vertex>\nvObj=position;');
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vObj;uniform float uRipe;')
          .replace('#include <color_fragment>',`#include <color_fragment>
            {float h=clamp(vObj.y*.58+.5,0.,1.);float front=uRipe*1.45-h*.45;
             vec3 green=vec3(.19,.42,.07),breaker=vec3(.72,.46,.06),red=vec3(.62,.035,.012);
             vec3 c=mix(green,breaker,smoothstep(.08,.5,front));c=mix(c,red,smoothstep(.45,.95,front));
             c=mix(c,green*.9,smoothstep(.6,.95,h)*(1.-smoothstep(.75,1.,uRipe))*.6);
             diffuseColor.rgb*=c;}`);
      }});
    m.userData.ripe=ripe;return m;
  }
  function sectionMaterial(){
    const ripe={value:0};
    const m=enhance(phys({map:texSection,roughness:.35,clearcoat:.8,clearcoatRoughness:.1,envMapIntensity:1}),{trans:.25,tint:[1,.5,.3],chain:shader=>{
      shader.uniforms.uRipe=ripe;
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float uRipe;')
        .replace('#include <map_fragment>',`vec4 sec=texture2D(map,vMapUv);
          vec3 flesh=mix(vec3(.36,.58,.16),vec3(.78,.07,.03),smoothstep(.25,.85,uRipe));
          vec3 gel=mix(vec3(.55,.68,.25),vec3(.93,.28,.08),smoothstep(.3,.95,uRipe));
          vec3 seed=vec3(.86,.8,.52);
          diffuseColor.rgb=flesh*(.55+.45*sec.r)*step(.001,sec.r)+gel*sec.g+seed*sec.b;`);
    }});
    m.userData.ripe=ripe;return m;
  }

  // ── Rig scaffolding shared by both species ─────────────────────────────────
  function createRig(kind,cfg){
    const model=new T.Group();model.position.z=.2;scene.add(model);
    const pivot=new T.Group(),body=new T.Group();model.add(pivot);pivot.add(body);pivot.position.z=cfg.jZ;body.position.z=-cfg.jZ;
    const rig={kind,cfg,model,pivot,body,anchors:{},leaves:[],flowers:[],fruits:[],branches:[],labels:[],
      params:{J:V(),C:V(),Tan:V(0,1,0),theta:0,height:0,rootLength:0,collarY:0,breakX:0,top:0,seedX:0},axisPts:Array.from({length:18},()=>V())};
    for(const name of ['seed','cotyledon','embryo','radicle','root','lateral','hypocotyl','stem','leaf','trifoliate','flower','fruit','newseed']){const a=new T.Object3D();body.add(a);rig.anchors[name]=a;}
    return rig;
  }
  function setAnchor(rig,name,p){rig.anchors[name].position.copy(p);}
  // The embryonic axis: a straight hypocotyl that ends in a hook of radius r; the node C sits at its end.
  // "What if?" experiments reshape the shoot above the soil: stretching (no light), bending (side light), slumping (no water).
  const plantEnv={bend:0,stretch:0,droop:0,gravity:0,rootGrav:0,hydro:0,twine:0,twineFront:0,twineMode:0,sx:.3,sz:.2,twPhase:0,nutA:0,nutPh:0};
  function warpPoint(p){
    if(p.y<=0)return p;
    const y0=p.y;
    if(plantEnv.stretch>0)p.y=y0*(1+.55*plantEnv.stretch*smooth(0,.6,y0));
    if(plantEnv.bend>0)p.x+=plantEnv.bend*.15*Math.pow(p.y,1.7);
    if(plantEnv.gravity>0)p.x-=plantEnv.gravity*.32*Math.pow(p.y,1.8);
    if(plantEnv.twine>0&&p.y>.3){
      const F=plantEnv.twineFront,w=plantEnv.twine*smooth(.3,.8,p.y)*(1-smooth(F-.45,F,p.y));
      if(w>0){const sx=plantEnv.sx,sz=plantEnv.sz,r=.078;let tx,tz;
        if(plantEnv.twineMode===0){const a=plantEnv.twPhase+(p.y-.3)*TAU*.72;tx=sx+r*Math.cos(a);tz=sz+r*Math.sin(a);}
        else{const dx=p.x-sx,dz=p.z-sz,l=Math.hypot(dx,dz)||1;tx=sx+dx/l*r;tz=sz+dz/l*r;}
        p.x+=(tx-p.x)*w;p.z+=(tz-p.z)*w;}
      if(plantEnv.nutA>0){const k=smooth(F-.5,F+1.2,p.y);p.x+=plantEnv.nutA*k*Math.cos(plantEnv.nutPh);p.z+=plantEnv.nutA*k*Math.sin(plantEnv.nutPh);}
    }
    if(plantEnv.droop>0){const k=Math.pow(Math.max(0,p.y-.8)/2.4,2.2);p.x-=plantEnv.droop*.5*k;p.y-=plantEnv.droop*.36*k;}
    return p;
  }
  const warpActive=()=>plantEnv.bend>0||plantEnv.stretch>0||plantEnv.droop>0||plantEnv.gravity>0||plantEnv.twine>0;
  function updateAxis(rig,g){
    const c=rig.cfg,P=rig.params;
    P.J.set(c.jX,keys(c.jY,g),c.jZ);
    const L=c.hypLength(g),r=c.hookR;
    let th=Math.PI*smooth(c.hook[0],c.hook[1],g)*(1-smooth(c.hook[2],c.hook[3],g));
    th=Math.min(th,Math.max(0,(L-.015)/r));
    const Ls=L-r*th,pts=rig.axisPts,N=pts.length-1;
    for(let k=0;k<=N;k++){
      const s=L*k/N;
      if(s<=Ls){const q=Math.sin(Math.PI*s/Math.max(Ls,.001));pts[k].set(P.J.x+c.wander*q*q*smooth(0,.5,Ls),P.J.y+s,P.J.z);}
      else{const ph=(s-Ls)/r;pts[k].set(P.J.x-r+r*Math.cos(ph),P.J.y+Ls+r*Math.sin(ph),P.J.z);}
    }
    P.Craw=P.Craw||V();P.Craw.copy(pts[N]);P.Tan.set(-Math.sin(th),Math.cos(th),0);P.theta=th;
    if(warpActive()){for(const p of pts)warpPoint(p);P.Tan.subVectors(pts[N],pts[N-1]).normalize();}
    P.C.copy(pts[N]);
    P.breakX=P.J.x-(th>Math.PI/2?r:r*(1-Math.cos(th)));P.collarY=P.J.y;P.hypLength=L;
    return pts;
  }
  const soilColor=(y,cU,cA,t,out)=>{const k=smooth(-.06,.08,y);out[0]=mix(cU[0],cA[0],k);out[1]=mix(cU[1],cA[1],k);out[2]=mix(cU[2],cA[2],k);return out;};

  // Primary root, lateral roots, secondary roots and root hairs, all starting at the junction J.
  function buildRoots(rig,{laterals=14,secondary=3}={}){
    rig.root=new Tube(M.rootB,72,14,rig.model,'root',true);
    rig.rootCap=ball(rig.model,M.rootCap,[.03,.05,.03],[0,0,0],'radicle');
    for(let i=0;i<laterals;i++){
      const e={fraction:.1+i*(.78/laterals),angle:i*2.399+.25+(rig.kind==='tomato'?.4:0),mesh:new Tube(M.rootB,30,8,rig.model,'lateral',true),secondary:[]};
      for(let j=0;j<secondary;j++)e.secondary.push(new Tube(M.rootB,16,6,rig.model,'lateral',true));
      rig.branches.push(e);
    }
    rig.hairPos=new Float32Array((laterals+4)*12*6);
    const hg=new T.BufferGeometry();hg.setAttribute('position',new T.BufferAttribute(rig.hairPos,3).setUsage(T.DynamicDrawUsage));
    rig.hairs=new T.LineSegments(hg,new T.LineBasicMaterial({color:0xf1e6c6,transparent:true,opacity:.7}));rig.hairs.frustumCulled=false;rig.model.add(rig.hairs);
  }
  const rootAged=[.86,.78,.6],rootYoung=[1.02,.99,.9];
  function updateRoots(rig,g){
    const c=rig.cfg,P=rig.params,J=P.J,Lr=keys(c.rootLen,g),r0=c.hypR(g);
    P.rootLength=Lr;
    const pts=rig.rootPts||(rig.rootPts=Array.from({length:10},()=>V()));
    for(let i=0;i<10;i++){const f=i/9;const w=smooth(0,.3,f);pts[i].set(J.x-.1*Math.sin(f*4.3)*w*smooth(0,1,g)*Math.min(1,Lr),J.y-f*Lr,J.z+.06*Math.sin(f*6.5)*w*Math.min(1,Lr));
      if(plantEnv.rootGrav>0||plantEnv.hydro>0){const dp=f*Lr;pts[i].x+=plantEnv.rootGrav*.34*Math.pow(dp,1.6)-plantEnv.hydro*.4*Math.pow(dp,1.5);}}
    const color=(t,p,o)=>{const a=smooth(.1,.9,t);o[0]=mix(rootAged[0],rootYoung[0],a);o[1]=mix(rootAged[1],rootYoung[1],a);o[2]=mix(rootAged[2],rootYoung[2],a);};
    rig.root.grow(pts,r0,1,r0*.42,{tip:r0*.9,color});
    const tip=rig.root.pointAt(1,V()),tan=V().subVectors(tip,rig.root.pointAt(.97,V())).normalize();
    rig.rootCap.position.copy(tip);rig.rootCap.scale.set(r0*.55,r0*.95,r0*.55);rig.rootCap.quaternion.setFromUnitVectors(UP,tan);rig.rootCap.visible=Lr>.05;
    setAnchor(rig,'radicle',tip);setAnchor(rig,'root',rig.root.pointAt(.45,V()));
    let hi=0;const H=rig.hairPos,hairAt=(p,a,len,drop)=>{H[hi++]=p.x;H[hi++]=p.y;H[hi++]=p.z;H[hi++]=p.x+Math.cos(a)*len;H[hi++]=p.y-drop;H[hi++]=p.z+Math.sin(a)*len;};
    const young=smooth(.35,1.2,g);
    for(let j=0;j<24;j++){const f=.56+j*.013,p=rig.root.pointAt(f,V());hairAt(p,j*2.4,(.05+.02*Math.sin(j))*young*(Lr>.2?1:0),.015);}
    rig.branches.forEach((b,i)=>{
      const m=smooth(c.lateral[0]+i*c.lateral[2],c.lateral[1]+i*c.lateral[2],g);
      const start=rig.root.pointAt(b.fraction,V()),len=(c.lateralLen*(.8+.3*Math.sin(i*2.4)))*(1-b.fraction*.45)*Math.min(1,Lr/1.6)*(1+plantEnv.hydro*.6*-Math.cos(b.angle));
      const d=V(Math.cos(b.angle),-.3-Math.sin(i)*.12,Math.sin(b.angle)*.62);
      const bp=[start.clone(),start.clone().addScaledVector(d,len*.3),start.clone().addScaledVector(d,len*.7).add(V(0,-len*.09,.03)),start.clone().addScaledVector(d,len).add(V(0,-len*.22,0))];
      const rb=c.lateralR*(.3+.7*m);
      b.mesh.grow(bp,rb,m,rb*.35,{color});
      if(i===2&&b.mesh.visible)setAnchor(rig,'lateral',b.mesh.pointAt(.6,V()));
      b.secondary.forEach((tube,j)=>{
        const f=.34+j*.22,sm=smooth(c.lateral[0]+.45+i*c.lateral[2]+j*.06,c.lateral[1]+.8+i*c.lateral[2],g)*smooth(f+.02,f+.16,m);
        const p=b.mesh.visible?b.mesh.pointAt(f,V()):start,ang=b.angle+(j%2?-.8:.8),l=len*.26;
        tube.grow([p,V(p.x+Math.cos(ang)*l*.6,p.y-l*.5,p.z+Math.sin(ang)*l*.4),V(p.x+Math.cos(ang)*l,p.y-l*1.25,p.z+Math.sin(ang)*l*.65)],c.lateralR*.42*(.2+.8*sm),sm,.004,{color});
      });
      for(let j=0;j<8;j++){const f=.55+j*.05,p=b.mesh.visible?b.mesh.pointAt(f,V()):start;const hg=smooth(f+.02,f+.12,m)*smooth(1.6,2.6,g);hairAt(p,j*2.4+i,(.03+.01*Math.sin(j))*hg,.012*hg);}
    });
    while(hi<H.length)H[hi++]=0;
    rig.hairs.geometry.attributes.position.needsUpdate=true;rig.hairs.geometry.computeBoundingSphere();
    rig.hairs.material.opacity=.7*smooth(.5,1.4,g);rig.hairs.visible=g>.4;
  }

  // A petiole / rachis / peduncle helper that returns its end point.
  function bladeEntry(rig,geo,mat,part,parent=rig.body){
    const group=new T.Group();parent.add(group);
    const m=cloneEnhanced(mat),blade=mesh(geo,m,group,part);
    const e={group,blade,mat:m,rest:new T.Quaternion(),phase:rand()*TAU,unfold:0,flex:1,wind:{value:0,velocity:0},pitch:{value:0,velocity:0}};
    rig.leaves.push(e);return e;
  }
  function setUnfold(e,a){
    e.unfold=a;e.blade.morphTargetInfluences[0]=Math.pow(1-a,1.1)*.97;
    e.mat.color.copy(youngLeaf).lerp(matureLeaf,smooth(0,1,a));
    if(e.mat.userData.transU)e.mat.userData.transU.value=e.mat.userData.enh.trans*(.55+.45*a);
    e.group.visible=a>.004;
  }
