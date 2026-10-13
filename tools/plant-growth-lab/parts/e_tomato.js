
  // ══════════════════════════════════════════════════════════════════════════
  //  TOMATO — Solanum lycopersicum (hooked germination, compound leaves, trusses, berries)
  // ══════════════════════════════════════════════════════════════════════════
  // Two states per copy: open (base) and closed (morph target 0), so buds open in one draw call.
  function mergeStates(src,copies){
    const n=src.attributes.position.count,idx=src.index.array,fold=src.morphAttributes.position?src.morphAttributes.position[0]:src.attributes.position;
    const P=[],N=[],U=[],C=[],MP=[],MN=[],I=[],v=V(),nm=new T.Matrix3(),nm2=new T.Matrix3();
    const foldN=src.morphAttributes.normal?src.morphAttributes.normal[0]:src.attributes.normal;
    copies.forEach((cp,ci)=>{
      nm.getNormalMatrix(cp.open);nm2.getNormalMatrix(cp.closed);
      for(let i=0;i<n;i++){
        v.fromBufferAttribute(src.attributes.position,i).applyMatrix4(cp.open);P.push(v.x,v.y,v.z);
        v.fromBufferAttribute(src.attributes.normal,i).applyMatrix3(nm).normalize();N.push(v.x,v.y,v.z);
        v.fromBufferAttribute(fold,i).applyMatrix4(cp.closed);MP.push(v.x,v.y,v.z);
        v.fromBufferAttribute(foldN,i).applyMatrix3(nm2).normalize();MN.push(v.x,v.y,v.z);
        U.push(src.attributes.uv.getX(i),src.attributes.uv.getY(i));
        const c=src.attributes.color,t=cp.color||[1,1,1];C.push((c?c.getX(i):1)*t[0],(c?c.getY(i):1)*t[1],(c?c.getZ(i):1)*t[2]);
      }
      for(let i=0;i<idx.length;i++)I.push(idx[i]+ci*n);
    });
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(U,2));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setIndex(I);
    g.morphAttributes.position=[new T.Float32BufferAttribute(MP,3)];g.morphAttributes.normal=[new T.Float32BufferAttribute(MN,3)];g.morphTargetsRelative=false;
    g.computeBoundingSphere();return g;
  }
  // Ribbed, slightly oblate tomato with a stem-end dimple; unit radius. phi 0 = stem end.
  function fruitPoint(theta,phi,out){
    const s=Math.sin(phi),lobe=1+.062*Math.cos(theta*5+.3)*Math.pow(s,1.3)*(.55+.45*Math.cos(phi));
    return out.set(lobe*s*Math.cos(theta),.86*Math.cos(phi)-.1*Math.exp(-Math.pow(phi/.32,2))+.028*Math.exp(-Math.pow((Math.PI-phi)/.22,2)),lobe*s*Math.sin(theta));
  }
  function fruitGeometry(phi0,phi1,rows,cols){
    const p=[],uv=[],idx=[],v=V();
    for(let i=0;i<=rows;i++){const phi=mix(phi0,phi1,i/rows);for(let j=0;j<=cols;j++){fruitPoint(j/cols*TAU,phi,v);p.push(v.x,v.y,v.z);uv.push(j/cols,1-phi/Math.PI);}}
    const st=cols+1;for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*st+j,b=a+st;idx.push(a,b,a+1,b,b+1,a+1);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
    const n=g.attributes.normal;
    for(let i=0;i<=rows;i++){const a=i*st,b=a+cols;const x=(n.getX(a)+n.getX(b))/2,y=(n.getY(a)+n.getY(b))/2,z=(n.getZ(a)+n.getZ(b))/2,l=Math.hypot(x,y,z)||1;n.setXYZ(a,x/l,y/l,z/l);n.setXYZ(b,x/l,y/l,z/l);}
    if(phi0===0)for(let j=0;j<=cols;j++)n.setXYZ(j,0,1,0);
    if(phi1===Math.PI)for(let j=0;j<=cols;j++)n.setXYZ(rows*st+j,0,-1,0);
    return g;
  }
  function capGeometry(face,cols){
    const p=[0,0,0],uv=[.5,.5],idx=[],v=V();
    for(let j=0;j<=cols;j++){fruitPoint(j/cols*TAU,Math.PI/2,v);p.push(v.x,0,v.z);uv.push(v.x*.5+.5,v.z*.5+.5);}
    for(let j=1;j<=cols;j++){const ax=p[j*3],az=p[j*3+2],bx=p[j*3+3],bz=p[j*3+5],ny=az*bx-ax*bz;if(ny*face>0)idx.push(0,j,j+1);else idx.push(0,j+1,j);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
  }

  function buildTomato(){
    const rig=createRig('tomato',{
      jX:0,jZ:.2,jY:[-.46,-.46,-.44,-.4,-.38,-.37,-.36,-.36],
      hypLength:g=>g<2?track([[.8,.05],[2,.64]],g):track([[2,.64],[3,.78],[4,.86],[5,.95],[6,.98],[7,1]],g),
      hook:[.85,1.3,2.05,2.72],hookR:.085,wander:.008,
      rootLen:[.02,.5,1,1.5,1.95,2.3,2.5,2.6],
      hypR:g=>mix(.02,.034,smooth(1,3.4,g))+.032*smooth(3.8,6,g),
      lateral:[1.15,3.6,.045],lateralLen:.92,lateralR:.016,
      scaleCm:25,days:[0,5,8,14,25,45,62,80]
    });
    rig.model.visible=false;
    const B=rig.body;
    buildRoots(rig,{laterals:18,secondary:3});
    rig.hyp=new Tube(M.stemT,56,14,B,'hypocotyl',true);
    rig.stem=new Tube(M.stemT,64,16,B,'stem',true);

    // Cotyledons fold inside the seed; the coat rides on their tips until it is shed.
    const cotGeo=bladeGeometry({rows:36,cols:14,thick:.006,width:t=>.13*Math.pow(Math.sin(Math.PI*t),.7)*(1+.3*t)*(1-.35*smooth(.85,1,t)),surface:(t,u)=>.05*Math.sin(Math.PI*t)+.05*u*u*Math.sin(Math.PI*t)-.05*t*t});
    const cot=new T.Group();B.add(cot);rig.cot=cot;
    rig.cots=[-1,1].map(side=>{
      const hinge=new T.Group();cot.add(hinge);
      const e={group:new T.Group(),blade:null,mat:cloneEnhanced(M.cotT),rest:new T.Quaternion(),phase:rand()*TAU,unfold:0,flex:.6,wind:{value:0,velocity:0},pitch:{value:0,velocity:0}};
      hinge.add(e.group);e.blade=mesh(cotGeo,e.mat,e.group,'cotyledon');
      e.group.quaternion.setFromRotationMatrix(_M.makeBasis(V(0,0,side),V(0,1,0),V(-side,0,0)));e.group.position.x=side*.004;
      rig.leaves.push(e);return {hinge,side,e};
    });
    const coat=new T.Group();cot.add(coat);rig.coat=coat;
    const coatInner=new T.Group();coat.add(coatInner);coatInner.rotation.y=Math.PI/2;
    rig.coatHalves=[-1,1].map(side=>{const h=new T.Group();coatInner.add(h);mesh(seedHalfGeometry(side,.034,.13,.105,.008,false),M.coatT,h,'seed');return {h,side};});
    {const hp=[];for(let i=0;i<110;i++){const a=i/110*TAU,y=.13*Math.cos(a),z=.105*Math.sin(a),e=.02+hash3(i,3,9)*.018;hp.push((hash3(i,1,9)-.5)*.02,y*1.01,z*1.01,(hash3(i,2,9)-.5)*.03,y+Math.cos(a)*e,z+Math.sin(a)*e);}
      const hg=new T.BufferGeometry();hg.setAttribute('position',new T.Float32BufferAttribute(hp,3));coatInner.add(new T.LineSegments(hg,new T.LineBasicMaterial({color:0xe9dcb8,transparent:true,opacity:.75})));}

    // Leaves: two first true leaves, then seven large pinnately compound leaves.
    const serr=(t,side)=>1+.05*(1-Math.abs(((t*19+(side>0?0:.5))%1)*2-1))*smooth(.05,.2,t)*(1-smooth(.9,1,t));
    const leafletGeo=bladeGeometry({rows:62,cols:18,thick:.0045,width:(t,side)=>{
        const base=.37*Math.pow(Math.sin(Math.PI*Math.pow(t,.85)),.82)*(1-.2*t);
        const lob=1+.17*Math.max(0,Math.sin(t*Math.PI*4.2+(side>0?0:1.1)))*smooth(.08,.3,t)*(1-smooth(.72,.95,t));
        return base*lob*serr(t,side);},
      surface:(t,u)=>{const s=Math.sin(Math.PI*t);return .08*s+.06*u*u*s-.11*t*t+.014*Math.sin(t*36+u*4)*u*u*s;}});
    const tinyGeo=bladeGeometry({rows:20,cols:10,thick:.004,width:(t,side)=>.34*Math.pow(Math.sin(Math.PI*Math.pow(t,.85)),.8)*serr(t,side)});
    const layoutFull=[[1,0,.56],[.8,1,.48],[.8,-1,.48],[.56,1,.43],[.56,-1,.43],[.32,1,.34],[.32,-1,.34],[.68,1,.12,1],[.68,-1,.12,1],[.44,1,.13,1],[.44,-1,.13,1],[.2,1,.1,1],[.2,-1,.1,1]];
    const layoutFirst=[[1,0,.4],[.62,1,.3],[.62,-1,.3],[.35,1,.1,1],[.35,-1,.1,1]];
    rig.compound=[];
    const addLeaf=(d,onset,angle,len,layout,first)=>{
      rig.compound.push({d,onset,angle,len,first,rachis:new Tube(M.stemT,26,8,B,'stem',true),
        leaflets:layout.map(([f,side,size,tiny])=>({f,side,size,tiny:!!tiny,roll:(rand()-.5)*.4,e:bladeEntry(rig,tiny?tinyGeo:leafletGeo,M.leafT,first?'leaf':'trifoliate')}))});
    };
    addLeaf(.14,2.95,.9,.5,layoutFirst,true);addLeaf(.3,3.2,.9+2.4,.55,layoutFirst,true);
    for(let k=0;k<7;k++)addLeaf(.55+k*.43,3.5+k*.36,.9+(k+2)*2.4,(1.02+.06*Math.min(k,3)-.06*Math.max(0,k-4)),layoutFull,false);

    // Trusses: peduncle → pedicels with abscission knuckles → nodding yellow flowers → ribbed berries.
    const petalGeo=bladeGeometry({rows:22,cols:10,thick:.003,top:[1,1,1],bottom:[1,1,1],width:t=>.24*Math.pow(Math.sin(Math.PI*Math.pow(t,.9)),.7),surface:(t,u)=>.05*Math.sin(Math.PI*t)*u*u-.08*t*t});
    const sepalGeo=bladeGeometry({rows:18,cols:8,thick:.004,width:t=>.17*Math.pow(Math.sin(Math.PI*Math.pow(t,.7)),.8),surface:(t,u)=>.04*Math.sin(Math.PI*t)+.03*u*u-.1*t*t*t});
    const petalCopies=[],sepalCopies=[];
    for(let i=0;i<6;i++){const a=i/6*TAU,ca=Math.cos(a),sa=Math.sin(a),out=V(ca,0,sa);
      petalCopies.push({open:basisMatrix(V(ca*.02,-.01,sa*.02),V(ca,.5,sa),V(0,-1,0),[.85,.19,.19]),closed:basisMatrix(V(ca*.012,-.01,sa*.012),V(ca*.16,-1,sa*.16),out,[.6,.12,.12])});
      const b=a+Math.PI/6;const cb=Math.cos(b),sb=Math.sin(b);
      sepalCopies.push({open:basisMatrix(V(cb*.012,-.005,sb*.012),V(cb,-.2,sb),V(0,-1,0),[.8,.15,.15]),closed:basisMatrix(V(cb*.01,-.005,sb*.01),V(cb*.22,-1,sb*.22),V(cb,0,sb),[.7,.12,.12])});}
    const petalsGeo=mergeStates(petalGeo,petalCopies),calyxGeo=mergeStates(sepalGeo,sepalCopies);
    const coneGeo=new T.CylinderGeometry(.011,.034,.12,14,1);coneGeo.translate(0,-.07,0);
    const fruitGeo=fruitGeometry(0,Math.PI,44,64),topGeo=fruitGeometry(0,Math.PI/2,22,64),botGeo=fruitGeometry(Math.PI/2,Math.PI,22,64);
    const capDown=capGeometry(-1,64),capUp=capGeometry(1,64);
    rig.trusses=[];
    const trussAngles=[2.2,4.6,.9,3.4];
    [1.42,1.95,2.48,2.98].forEach((d,ti)=>{
      const truss={d,angle:trussAngles[ti],onset:[5,5.3,5.6,6.1][ti],peduncle:new Tube(M.stemT,24,8,B,'stem',true),items:[]};
      for(let i=0;i<4;i++){
        const group=new T.Group();B.add(group);
        const flower=new T.Group();group.add(flower);
        const calyx=mesh(calyxGeo,M.sepal,flower,'flower');
        const pm=cloneEnhanced(M.petalT),petals=mesh(petalsGeo,pm,flower,'flower'),cone=mesh(coneGeo,M.cone,flower,'flower');
        const fm=fruitMaterial(),sm=sectionMaterial();
        const fruitHolder=new T.Group();group.add(fruitHolder);
        const fruit=mesh(fruitGeo,fm,fruitHolder,'fruit');
        const top=mesh(topGeo,fm,fruitHolder,'fruit'),bottom=new T.Group();fruitHolder.add(bottom);
        const bot=mesh(botGeo,fm,bottom,'fruit'),capT=mesh(capDown,sm,top,'newseed'),capB=mesh(capUp,sm,bottom,'newseed');
        const R=[.21,.2,.19,.17][i]*[1,1,.96,.9][ti];
        const item={f:[.32,.54,.76,1][i],side:i%2?-1:1,R,group,flower,calyx,petals,pm,cone,fruitHolder,fruit,top,bottom,bot,capT,capB,fm,sm,
          pedicel:new Tube(M.stemT,14,7,B,'stem',true),knuckle:ball(B,M.knuckle,[.02,.02,.02],[0,0,0],'stem'),sets:ti<3||i<2,rest:new T.Quaternion()};
        truss.items.push(item);rig.flowers.push({group:flower});
        if(item.sets)rig.fruits.push({group:fruitHolder,body:fruit,item});
      }
      rig.trusses.push(truss);
    });

    // Stem trichomes: short hairs scattered over the whole stem.
    const hairN=520,hairSeeds=Array.from({length:hairN},(_,i)=>[hash3(i,1,77),hash3(i,2,77),.018+hash3(i,3,77)*.022]);
    const hairPos=new Float32Array(hairN*6),hairGeo=new T.BufferGeometry();
    hairGeo.setAttribute('position',new T.BufferAttribute(hairPos,3).setUsage(T.DynamicDrawUsage));
    const hairs=new T.LineSegments(hairGeo,new T.LineBasicMaterial({color:0xcfe3a8,transparent:true,opacity:.55}));hairs.frustumCulled=false;B.add(hairs);

    const green=[.2,.4,.09],purple=[.46,.2,.3],pale=[.84,.76,.7];
    const hypColor=(t,p,o)=>{const k=smooth(-.06,.1,p.y);o[0]=mix(pale[0],mix(purple[0],green[0],t*.6),k);o[1]=mix(pale[1],mix(purple[1],green[1],t*.6),k);o[2]=mix(pale[2],mix(purple[2],green[2],t*.6),k);};
    const stemColor=(t,p,o)=>{o[0]=green[0]*(1+.3*t);o[1]=green[1]*(1+.22*t);o[2]=green[2]*(1+.5*t);};
    const tmp=V(),tmp2=V(),tmp3=V(),lat=V(),tg=V();
    rig.stemPoint=(d,out=V())=>{const L=rig.stemLen;if(L<=.001)return out.copy(rig.params.C);return rig.stem.pointAt(clamp(d/L),out);};
    const cotA=V(0,1,0),origin=V();

    rig.update=(g,seedOpen,podOpen)=>{
      const P=rig.params;
      const pts=updateAxis(rig,g);
      updateRoots(rig,g);
      const hr=rig.cfg.hypR(g);
      rig.hyp.grow(pts,hr,1,hr*.95,{tip:0,color:hypColor});
      setAnchor(rig,'hypocotyl',rig.hyp.pointAt(g<2.4?.66:.5,tmp));
      // cotyledons + coat hang from the hook
      frameAlong(rig.cot,P.C,P.Tan,cotA,origin,1);
      const Lc=track([[0,.1],[2.2,.15],[2.8,.32],[3.4,.52],[5,.62]],g),open=smooth(2.62,3.25,g),shed=smooth(2.62,3.02,g);
      rig.cots.forEach(c=>{
        c.hinge.quaternion.setFromAxisAngle(V(0,0,1),-c.side*open*1.32);c.hinge.position.x=c.side*seedOpen*.03;
        c.e.group.scale.set(Lc,Lc,Lc);setUnfold(c.e,open);c.e.group.visible=true;
        c.e.rest.copy(c.e.group.quaternion);
        c.e.mat.color.setRGB(mix(1.25,.95,smooth(2.2,3,g))*mix(1,1.15,smooth(5.6,7,g)),mix(1.2,1,smooth(2.2,3,g)),mix(.7,1,smooth(2.2,3,g))*mix(1,.6,smooth(5.6,7,g)));
      });
      rig.coat.position.set(0,Lc*.45+shed*.35,shed*.12);rig.coat.rotation.set(shed*1.2,0,shed*.8);
      rig.coat.scale.setScalar(Math.max(.001,1-shed));rig.coat.visible=shed<.995;
      rig.coatHalves.forEach(h=>h.h.position.x=h.side*seedOpen*.09);
      rig.cot.updateMatrix();
      setAnchor(rig,'seed',tmp.set(0,Lc*.45,0).applyMatrix4(rig.cot.matrix));
      setAnchor(rig,'cotyledon',tmp.set(Lc*.5*Math.sin(open*1.3),Lc*.55,0).applyMatrix4(rig.cot.matrix));
      setAnchor(rig,'embryo',P.C);
      // stem
      const L=track([[2.7,0],[3.5,.32],[4,.8],[5,2.25],[6,3.3],[7,3.62]],g);rig.stemLen=L;
      const sp=rig.stemPts||(rig.stemPts=Array.from({length:26},()=>V()));
      for(let k=0;k<26;k++){const f=k/25,s=L*f;sp[k].copy(P.Craw).add(tmp.set(-Math.sin(P.theta),Math.cos(P.theta),0).multiplyScalar(Math.min(s,.05)));
        if(s>.05)sp[k].add(tmp.set(.09*Math.sin(f*3.1+.4)*Math.min(1,L/2),s-.05,.06*Math.sin(f*4.4)*Math.min(1,L/2)));warpPoint(sp[k]);}
      sp[0].copy(P.C);
      rig.stem.grow(sp,hr*.95*(1-.38*plantEnv.stretch),L>.01?1:0,.02,{tip:.03,color:stemColor});
      P.top=L>.01?rig.stem.pointAt(1,tmp2).y:P.C.y;P.height=Math.max(P.top+(g>3.2?.4:0),P.C.y+.3);
      setAnchor(rig,'stem',rig.stemPoint(Math.min(L*.35,1.1),tmp));
      let hk=0;const stemOn=L>.05;
      for(let i=0;i<hairN;i++){
        const [ft,fa,len]=hairSeeds[i];
        if(!stemOn){hairPos.fill(0,hk,hk+6);hk+=6;continue;}
        const t=ft*.97,p=rig.stem.pointAt(t,tmp),r=mix(hr*.95,.02,t),a=fa*TAU;
        hairPos[hk++]=p.x+Math.cos(a)*r;hairPos[hk++]=p.y;hairPos[hk++]=p.z+Math.sin(a)*r;
        hairPos[hk++]=p.x+Math.cos(a)*(r+len);hairPos[hk++]=p.y+len*.35;hairPos[hk++]=p.z+Math.sin(a)*(r+len);
      }
      hairGeo.attributes.position.needsUpdate=true;hairGeo.computeBoundingSphere();hairs.visible=stemOn;
      // compound leaves
      rig.compound.forEach((cl,k)=>{
        const a=smooth(cl.onset,cl.onset+.8,g),d=Math.min(cl.d,Math.max(0,L-.04)),node=rig.stemPoint(d,V());
        const out=tmp.set(Math.cos(cl.angle),0,Math.sin(cl.angle)),len=cl.len*(.25+.75*a)*(a>.002?1:0);
        const young=1-a,rp=[node,
          node.clone().addScaledVector(out,len*.22*(.3+.7*a)).add(tmp2.set(0,len*(.3+.4*young),0)),
          node.clone().addScaledVector(out,len*.6*(.3+.7*a)).add(tmp2.set(0,len*(.34+.5*young),0)),
          node.clone().addScaledVector(out,len*(.3+.7*a)).add(tmp2.set(0,len*(.08+.7*young),0))];
        cl.rachis.grow(rp,(cl.first?.011:.016)*Math.max(a,.15),a>.002?1:0,.006,{color:stemColor});
        cl.leaflets.forEach((lf,j)=>{
          const la=smooth(cl.onset+(1-lf.f)*.12,cl.onset+.85+(1-lf.f)*.1,g);setUnfold(lf.e,la);
          if(a<=.002){lf.e.group.visible=false;return;}
          const base=cl.rachis.pointAt(lf.f,tmp3);cl.rachis.curve.getTangent(Math.min(.999,lf.f),tg);tg.normalize();
          lat.crossVectors(tg,UP);if(lat.lengthSq()<1e-6)lat.set(1,0,0);lat.normalize().multiplyScalar(lf.side);
          let dir;
          if(lf.side===0)dir=tg.clone();
          else dir=lat.clone().multiplyScalar(.9).addScaledVector(tg,.5).add(tmp2.set(0,-.12,0));
          dir.lerp(V(tg.x*.3,1,tg.z*.3),young*.7);
          const size=lf.size*Math.pow(la,.7)*(cl.first?1:1.05);
          orientBlade(lf.e,base,dir,size,lf.tiny?.8:.92,lf.roll);
          if(k===0&&j===0)setAnchor(rig,'leaf',base.clone().addScaledVector(dir.normalize(),size*.5));
          if(k===4&&j===0)setAnchor(rig,'trifoliate',base.clone().addScaledVector(dir.normalize(),size*.45));
        });
      });
      // trusses, flowers and fruit
      rig.trusses.forEach((tr,ti)=>{
        const dev=smooth(tr.onset,tr.onset+.6,g),d=Math.min(tr.d,Math.max(0,L-.08)),node=rig.stemPoint(d,V());
        const out=V(Math.cos(tr.angle),0,Math.sin(tr.angle)),side=V(-out.z,0,out.x),l=.82*dev;
        const pp=[node,node.clone().addScaledVector(out,l*.25).add(tmp.set(0,l*.08,0)),node.clone().addScaledVector(out,l*.55).add(tmp.set(0,-l*.12,0)),node.clone().addScaledVector(out,l*.72).add(tmp.set(0,-l*.45,0))];
        tr.peduncle.grow(pp,.017*dev+.002,dev>.004?1:0,.011,{color:stemColor});
        tr.items.forEach((it,i)=>{
          const fd=smooth(tr.onset+i*.1,tr.onset+.62+i*.1,g);
          const fruitDev=it.sets?smooth(tr.onset+.55+i*.08,tr.onset+1.2+i*.08,g):0,ripe=it.sets?smooth(tr.onset+1.15+i*.06,tr.onset+1.85+i*.06,g):0;
          const base=tr.peduncle.pointAt(it.f,V()),R=it.R*(.25+.75*Math.pow(fruitDev,.8));
          const reach=.14+it.R*.95*fruitDev;
          const knee=base.clone().addScaledVector(side,it.side*reach*.55*fd).addScaledVector(out,.05*fd).add(tmp.set(0,.04*fd,0));
          const end=base.clone().addScaledVector(side,it.side*reach*fd).addScaledVector(out,.08*fd).add(tmp.set(0,-.05*fd-.03*fruitDev,0));
          it.pedicel.grow([base,knee,end],.009*fd+.001,fd>.004?1:0,.007,{color:stemColor});
          it.knuckle.position.copy(knee);it.knuckle.scale.setScalar(.013*fd+.001);it.knuckle.visible=fd>.02;
          // nodding flower turns to hang straight down as the fruit gains weight
          const hang=V().copy(side).multiplyScalar(it.side*.45).addScaledVector(out,.3).add(tmp.set(0,-1,0)).normalize().lerp(tmp2.set(0,-1,0),smooth(0,.4,fruitDev)).normalize();
          const Y=hang.clone().negate(),Z=V(0,0,1).addScaledVector(Y,-Y.z).normalize(),X=V().crossVectors(Y,Z);
          it.group.position.copy(end);it.group.quaternion.setFromRotationMatrix(_M.makeBasis(X,Y,Z));it.rest.copy(it.group.quaternion);
          const fs=Math.max(.001,fd);it.flower.scale.setScalar(fs*1.15);it.flower.visible=fd>.004;
          const openF=smooth(.35,1,fd),wither=smooth(.05,.55,fruitDev);
          it.petals.morphTargetInfluences[0]=clamp((1-openF)+wither*.7);it.petals.scale.setScalar(Math.max(.001,1-wither*.85));it.petals.visible=wither<.98;
          it.pm.color.setRGB(mix(1,.72,wither),mix(1,.55,wither),mix(1,.35,wither));
          it.cone.scale.setScalar(Math.max(.001,1-wither));it.cone.visible=wither<.98;
          it.calyx.morphTargetInfluences[0]=clamp(1-smooth(.2,.8,fd));
          it.calyx.scale.setScalar(1+fruitDev*R*2.2);
          // fruit hangs from the calyx
          it.fruitHolder.position.set(0,-R*.76,0);it.fruitHolder.scale.setScalar(R);
          it.fruitHolder.visible=fruitDev>.004;it.fm.userData.ripe.value=ripe;it.sm.userData.ripe.value=ripe;
          const sliced=podOpen>.01&&fruitDev>.5;
          it.fruit.visible=!sliced;it.top.visible=sliced;it.bottom.visible=sliced;
          it.bottom.position.set(0,-.95*podOpen,.4*podOpen);it.bottom.rotation.set(1.05*podOpen,0,0);
          if(ti===0&&i===0){
            it.group.updateMatrix();it.fruitHolder.updateMatrix();it.bottom.updateMatrix();
            setAnchor(rig,'fruit',tmp.set(.35,-.2,.5).applyMatrix4(it.fruitHolder.matrix).applyMatrix4(it.group.matrix));
            setAnchor(rig,'newseed',tmp.set(.2,.05,.2).applyMatrix4(it.bottom.matrix).applyMatrix4(it.fruitHolder.matrix).applyMatrix4(it.group.matrix));
          }
          if(ti===(g>6.6?3:0)&&i===0){it.group.updateMatrix();setAnchor(rig,'flower',tmp.set(0,-.05,0).applyMatrix4(it.group.matrix));}
        });
      });
      P.seedX=P.breakX;
    };
    rig.available=(part,g)=>part==='whole'||(part==='seed'&&g<4.8)||(part==='root'&&g>.12)||(part==='leaf'&&g>3)||(part==='flower'&&g>5.2)||(part==='fruit'&&g>5.85);
    rig.seedSpan=g=>g<2.5?[.95,1]:[1.5,1.7];
    rig.flowerAngle=g=>-rig.trusses[g>6.6?3:0].angle+Math.PI/2;
    rig.canOpenSeed=g=>g<1.9;rig.canOpenFruit=g=>g>=5.95;
    rig.fruitCloseStrings=['Slice fruit','Join fruit','Slice fruit · inspect the seeds inside','Sliced fruit view · jelly-filled locules hold the seeds'];
    rig.labelSpecs=[
      {key:'seed',text:'Seed coat',dx:-90,dy:-22,visible:g=>g<2.9},
      {key:'cotyledon',text:'Cotyledons',dx:94,dy:3,visible:g=>g>2.6&&g<4.6},
      {key:'embryo',text:'Embryo',dx:35,dy:-64,visible:g=>seedOpenValue>.25&&g<1.9},
      {key:'radicle',text:'Radicle',class:'root',dx:85,dy:25,visible:g=>g>.16&&g<2.3},
      {key:'root',text:'Primary root',class:'root',dx:90,dy:12,visible:g=>g>=2.3},
      {key:'lateral',text:'Lateral roots',class:'root',dx:-96,dy:22,visible:g=>g>2.3},
      {key:'hypocotyl',text:'Hypocotyl',dx:-91,dy:-20,visible:g=>g>1.05&&g<3.7},
      {key:'stem',text:'Hairy stem',dx:77,dy:15,visible:g=>g>3.7},
      {key:'leaf',text:'True leaf',class:'leaf',dx:76,dy:-22,visible:g=>g>3.05&&g<4.2},
      {key:'trifoliate',text:'Compound leaf',class:'leaf',dx:-110,dy:-20,visible:g=>g>4.2},
      {key:'flower',text:'Flower',class:'flower',dx:82,dy:-23,visible:g=>g>5.3},
      {key:'fruit',text:'Tomato',class:'fruit',dx:88,dy:10,visible:g=>g>5.9},
      {key:'newseed',text:'Seeds inside',class:'fruit',dx:-86,dy:25,visible:g=>g>6&&podOpenValue>.3}
    ];
    return rig;
  }
