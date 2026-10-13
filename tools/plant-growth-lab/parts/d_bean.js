
  // ══════════════════════════════════════════════════════════════════════════
  //  COMMON BEAN — Phaseolus vulgaris (epigeal germination, trifoliate leaves, pods)
  // ══════════════════════════════════════════════════════════════════════════
  function buildBean(){
    const rig=createRig('bean',{
      jX:0,jZ:.2,jY:[-.84,-.84,-.8,-.74,-.7,-.68,-.67,-.66],
      hypLength:g=>g<2?track([[.8,.26],[2,1.2]],g):track([[2,1.2],[3,1.4],[4,1.46],[5,1.5],[6,1.52],[7,1.53]],g),
      hook:[.85,1.32,2.02,2.74],hookR:.16,wander:.018,
      rootLen:[.03,.62,1.15,1.55,1.85,2.05,2.15,2.2],
      hypR:g=>mix(.034,.056,smooth(.8,3.4,g))+.016*smooth(4,6,g),
      lateral:[1.25,3.4,.05],lateralLen:1,lateralR:.022,
      scaleCm:11,days:[0,3,6,10,18,32,45,60]
    });
    const B=rig.body;
    buildRoots(rig,{laterals:14,secondary:3});
    rig.hyp=new Tube(M.stemB,56,16,B,'hypocotyl',true);
    rig.stem=new Tube(M.stemB,60,16,B,'stem',true);
    rig.node=ball(B,M.stemB,[.06,.05,.06],[0,0,0],'stem');rig.node.material=cloneEnhanced(M.stemB);rig.node.material.vertexColors=false;rig.node.material.color.setRGB(.32,.52,.16);

    // Seed: two coat shells and two thick cotyledons hinged at the cotyledonary node A.
    const A=V(0,-.06,.2),aLocal=V(0,1,.3).normalize(),hingeAxis=V(0,-aLocal.z,aLocal.y).normalize();
    rig.seedA=A;rig.seedAxis=aLocal;
    const seed=new T.Group();B.add(seed);rig.seed=seed;
    rig.cotHinges=[];rig.coats=[];
    for(const side of [-1,1]){
      const hinge=new T.Group();hinge.position.copy(A);seed.add(hinge);
      const cm=cloneEnhanced(M.cotB);
      const cot=mesh(seedHalfGeometry(side,.232,.395,.262,.05,true),cm,hinge,'cotyledon');cot.position.copy(A).negate();
      rig.cotHinges.push({hinge,side,mesh:cot,mat:cm,base:cm.color.clone()});
      const coat=new T.Group();seed.add(coat);
      mesh(seedHalfGeometry(side,.25,.42,.28,.05,false),M.coatB,coat,'seed');
      rig.coats.push({group:coat,side});
    }
    const hilum=ball(rig.coats[1].group,M.hilum,[.034,.075,.012],[.004,-.02,.232],'seed');
    rig.hingeAxis=hingeAxis;
    setAnchor(rig,'seed',V());

    // Leaves: a plumule pair that becomes the first (unifoliate) leaves, then seven trifoliate leaves.
    const heartGeo=bladeGeometry({rows:46,cols:22,width:t=>.56*Math.pow(Math.sin(Math.PI*Math.pow(t,.6)),.62)*(1-.3*smooth(.72,1,t))+.07*(1-smooth(0,.15,t))});
    const leafletGeo=bladeGeometry({rows:46,cols:22,width:t=>.5*Math.pow(Math.sin(Math.PI*Math.pow(t,.78)),.78)*(1-.3*smooth(.7,1,t))});
    rig.firstLeaves=[0,1].map(i=>({angle:i*Math.PI+.25,petiole:new Tube(M.stemB,16,8,B,'stem',true),blade:bladeEntry(rig,heartGeo,M.leafB,'leaf')}));
    rig.trifoliates=[];
    for(let k=0;k<7;k++){
      rig.trifoliates.push({d:.7+k*.34,onset:3.05+k*.33,angle:k*Math.PI+.62*k+1.1,size:1+.04*Math.min(k,4)-.05*Math.max(0,k-4),
        petiole:new Tube(M.stemB,22,8,B,'stem',true),rachis:new Tube(M.stemB,10,8,B,'stem',true),
        pulvinus:ball(B,M.knuckle,[.03,.03,.03],[0,0,0],'stem'),
        leaflets:[0,1,2].map(()=>bladeEntry(rig,leafletGeo,M.leafB,'trifoliate'))});
    }

    // Papilionaceous flowers: standard, two wings and a keel merged into one petal mesh per flower.
    const petalStd=bladeGeometry({rows:24,cols:14,thick:.003,top:[1,1,1],bottom:[1,1,1],width:t=>.62*Math.pow(Math.sin(Math.PI*Math.pow(t,.55)),.5),surface:(t,u)=>.12*Math.sin(Math.PI*t)*(.3+u*u)-.2*t*t});
    const petalWing=bladeGeometry({rows:18,cols:12,thick:.003,top:[1,1,1],bottom:[1,1,1],width:t=>.42*Math.pow(Math.sin(Math.PI*Math.pow(t,.65)),.6),surface:(t,u)=>.08*Math.sin(Math.PI*t)*u*u});
    const flowerGeo=mergeCopies(petalStd,[{matrix:basisMatrix(V(0,.01,-.02),V(0,.93,-.36),V(0,.36,.93),[.3,.3,.3]),color:[1,1,1]}]);
    const wingGeo=mergeCopies(petalWing,[
      {matrix:basisMatrix(V(-.03,0,.01),V(-.35,.3,.88),V(-1,.2,0),[.17,.22,.22]),color:[.95,.9,1.05]},
      {matrix:basisMatrix(V(.03,0,.01),V(.35,.3,.88),V(1,.2,0),[.17,.22,.22]),color:[.95,.9,1.05]},
      {matrix:basisMatrix(V(-.008,-.02,.01),V(0,-.05,1),V(-1,0,0),[.1,.19,.19]),color:[1.08,1.1,1.1]},
      {matrix:basisMatrix(V(.008,-.02,.01),V(0,-.05,1),V(1,0,0),[.1,.19,.19]),color:[1.08,1.1,1.1]}]);
    // Pods: two halves of a curved, beaked legume with seed bumps, and the beans inside.
    function podHalf(side){
      const p=[],uv=[],idx=[],rows=72,cols=18;
      for(let i=0;i<=rows;i++){const t=i/rows,env=Math.pow(Math.sin(Math.PI*Math.min(1,t*1.04)),.5)*(1-.55*smooth(.9,1,t)),bump=1+.1*Math.cos(t*TAU*5.2);
        for(let j=0;j<=cols;j++){const a=j/cols*Math.PI;
          p.push(.16*Math.sin(t*Math.PI*.95)+Math.cos(a)*.105*env*bump,-t,.07*Math.sin(t*Math.PI*1.3)+side*Math.sin(a)*.068*env*bump);uv.push(j/cols,t*3);}}
      const st=cols+1;for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*st+j,b=a+st;if(side>0)idx.push(a,b,a+1,b,b+1,a+1);else idx.push(a,a+1,b,b,a+1,b+1);}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
    }
    const podFront=podHalf(1),podBack=podHalf(-1),beanGeo=new T.SphereGeometry(1,24,16);
    rig.sites=[];
    for(let i=0;i<6;i++){
      const holder=new T.Group();B.add(holder);
      const flower=new T.Group();holder.add(flower);
      const calyx=ball(flower,M.calyxB,[.05,.055,.05],[0,-.01,-.03],'flower');
      const pm=cloneEnhanced(M.petalB),petals=mesh(flowerGeo,pm,flower,'flower'),wings=mesh(wingGeo,pm,flower,'flower');
      const pod=new T.Group();holder.add(pod);
      const back=mesh(podBack,M.podInner,pod,'fruit'),front=mesh(podFront,M.pod,pod,'fruit'),beans=[];
      for(let j=0;j<5;j++){const t=.15+j*.165,b=mesh(beanGeo,M.newBean,pod,'newseed');b.position.set(.16*Math.sin(t*Math.PI*.95),-t,.07*Math.sin(t*Math.PI*1.3));beans.push(b);}
      const cap=ball(pod,M.knuckle,[.05,.035,.05],[0,0,0],'fruit');
      const site={d:1.62+i*.27,angle:[.7,3.1,5.5,1.6,3.9,6.1][i],onset:5.05+i*.1,stalk:new Tube(M.stemB,16,7,B,'stem',true),holder,flower,petals,wings,pm,pod,front,back,beans,rest:new T.Quaternion()};
      rig.sites.push(site);rig.flowers.push({group:flower});
      if(i<5)rig.fruits.push({group:pod,body:front,site});
    }

    const stemGreen=[.21,.43,.085],hypPale=[1.18,.98,.8],hypGreen=[.26,.47,.11];
    const hypColor=(t,p,o)=>soilColor(p.y,hypPale,hypGreen,t,o);
    const stemColor=(t,p,o)=>{o[0]=stemGreen[0]*(1+.25*t);o[1]=stemGreen[1]*(1+.2*t);o[2]=stemGreen[2]*(1+.4*t);};
    const tmp=V(),tmp2=V();
    rig.stemPoint=(d,out=V())=>{const L=rig.stemLen;if(L<=.001)return out.copy(rig.params.C);return rig.stem.pointAt(clamp(d/L),out);};

    rig.update=(g,seedOpen,podOpen)=>{
      const P=rig.params;
      const pts=updateAxis(rig,g);
      updateRoots(rig,g);
      const hr=rig.cfg.hypR(g);
      rig.hyp.grow(pts,hr,1,hr*.96,{tip:0,color:hypColor});
      setAnchor(rig,'hypocotyl',rig.hyp.pointAt(g<2.4?.62:.5,tmp));
      // seed follows the hook; imbibition swells it
      const swell=1+.1*smooth(0,1.1,g),shrivel=smooth(3.8,4.85,g);
      frameAlong(rig.seed,P.C,P.Tan,aLocal,A,swell);
      rig.seed.visible=g<4.86;
      const open=smooth(2.42,3.05,g),shed=smooth(2.16,2.7,g);
      rig.cotHinges.forEach(h=>{
        h.hinge.quaternion.setFromAxisAngle(hingeAxis,-h.side*open*1.2);
        h.hinge.position.set(h.side*seedOpen*.24,0,0).add(A);
        const s=1-.5*shrivel;h.hinge.scale.set(s,s*(1-.12*shrivel),s);
        const gr=smooth(2.2,3.0,g);h.mat.color.setRGB(mix(mix(1,.66,gr),.8,shrivel),mix(mix(1,.9,gr),.62,shrivel),mix(mix(1,.4,gr),.28,shrivel)).multiply(h.base);
      });
      rig.coats.forEach(c=>{
        c.group.position.set(c.side*(seedOpen*.55+shed*.3),-shed*.55,-shed*.1);
        c.group.rotation.set(0,0,c.side*shed*.9);c.group.scale.setScalar(Math.max(.001,1-shed));c.group.visible=shed<.995;
      });
      setAnchor(rig,'seed',tmp.copy(P.C).addScaledVector(P.Tan,.2*swell));
      rig.seed.updateMatrix();setAnchor(rig,'cotyledon',tmp.set(.22,.05,.08).applyMatrix4(rig.seed.matrix));
      setAnchor(rig,'embryo',P.C);
      // epicotyl and stem grow from the node
      const L=track([[2.4,0],[3.3,.44],[4,1.3],[5,2.55],[6,2.95],[7,3.05]],g);rig.stemLen=L;
      const sp=rig.stemPts||(rig.stemPts=Array.from({length:26},()=>V()));
      for(let k=0;k<26;k++){const f=k/25,s=L*f;
        sp[k].copy(P.Craw).add(tmp.set(-Math.sin(P.theta),Math.cos(P.theta),0).multiplyScalar(Math.min(s,.07)));
        if(s>.07)sp[k].add(tmp.set(.07*Math.sin(f*3.4)*Math.min(1,L/2),s-.07,.05*Math.sin(f*4.1)*Math.min(1,L/2)));
        warpPoint(sp[k]);
      }
      sp[0].copy(P.C);
      const sr=hr*.92*(1-.38*plantEnv.stretch);
      rig.stem.grow(sp,sr,L>.01?1:0,.016,{tip:.03,color:stemColor});
      rig.node.position.copy(P.C);rig.node.scale.setScalar(hr*1.25);rig.node.visible=g>2.3;
      P.top=L>.01?rig.stem.pointAt(1,tmp2).y:P.C.y;P.height=Math.max(P.top+(g>3?.35:0),P.C.y+.3);
      setAnchor(rig,'stem',rig.stemPoint(Math.min(L*.4,1.2),tmp));
      // first leaves: plumule inside the seed → unifoliate pair at the first node
      const u=smooth(2.5,3.35,g),d1=Math.min(.42,Math.max(0,L-.03)),n1=rig.stemPoint(d1,V());
      rig.firstLeaves.forEach((f,i)=>{
        const a=f.angle,pet=.16*u,tipP=n1.clone().add(tmp.set(Math.cos(a)*pet,pet*.35,Math.sin(a)*pet));
        f.petiole.grow([n1,n1.clone().lerp(tipP,.5).add(tmp2.set(0,.02*u,0)),tipP],.013*u+.002,u>.01?1:0,.009,{color:stemColor});
        const len=g<2.4?.07*(1+g*.05):mix(.08,.82*(1-.08*smooth(4.5,6,g)),smooth(2.45,3.35,g));
        const dir=u<.01?P.Tan.clone():tmp.set(Math.cos(a),.3+(1-u)*2.6,Math.sin(a));
        setUnfold(f.blade,u);f.blade.group.visible=true;
        orientBlade(f.blade,u<.01?P.C:tipP,dir,len,.95,0);
        if(i===0)setAnchor(rig,'leaf',tipP.clone().addScaledVector(dir.normalize(),len*.55));
      });
      // trifoliate leaves
      rig.trifoliates.forEach((tf,k)=>{
        const a=smooth(tf.onset,tf.onset+.7,g),d=Math.min(tf.d,Math.max(0,L-.05)),node=rig.stemPoint(d,V()),ang=tf.angle;
        const pl=(.52+.04*k)*a*tf.size,out=tmp.set(Math.cos(ang),0,Math.sin(ang));
        const end=node.clone().addScaledVector(out,pl*.62).add(tmp2.set(0,pl*.72,0));
        tf.petiole.grow([node,node.clone().addScaledVector(out,pl*.18).add(tmp2.set(0,pl*.35,0)),end],.016*a+.002,a>.004?1:0,.01,{color:stemColor});
        const rDir=V(Math.cos(ang),.25,Math.sin(ang)).normalize(),rEnd=end.clone().addScaledVector(rDir,.15*a*tf.size);
        tf.rachis.grow([end,rEnd],.009*a+.001,a>.004?1:0,.007,{color:stemColor});
        tf.pulvinus.position.copy(end);tf.pulvinus.scale.setScalar(.024*a+.001);tf.pulvinus.visible=a>.01;
        const side=V(-Math.sin(ang),0,Math.cos(ang));
        tf.leaflets.forEach((lf,j)=>{
          const la=smooth(tf.onset+(j?0.08:0),tf.onset+.8+(j?0.06:0),g);setUnfold(lf,la);
          const size=(j===0?.98:.84)*tf.size*Math.pow(la,.75);
          let dir;
          if(j===0)dir=V(Math.cos(ang),.2+(1-la)*2.2,Math.sin(ang));
          else dir=side.clone().multiplyScalar(j===1?1:-1).addScaledVector(out,.35).add(tmp2.set(0,-.1+(1-la)*2.2,0));
          orientBlade(lf,j===0?rEnd:end,dir,size,.96,j===0?0:(j===1?.25:-.25));
          if(k===2&&j===0)setAnchor(rig,'trifoliate',rEnd.clone().addScaledVector(dir.normalize(),size*.5));
        });
      });
      // flowers and pods
      rig.sites.forEach((s,i)=>{
        const dev=smooth(s.onset,s.onset+.7,g),fruit=i<5?smooth(6.05+i*.1,6.8+i*.03,g):0;
        const node=rig.stemPoint(Math.min(s.d,Math.max(0,L-.1)),V()),out=V(Math.cos(s.angle),0,Math.sin(s.angle)),len=(.36+.02*i)*dev;
        const tipP=node.clone().addScaledVector(out,len).add(tmp.set(0,.12*dev,0));
        s.stalk.grow([node,node.clone().lerp(tipP,.55).add(tmp2.set(0,.09*dev,0)),tipP],.011*dev+.002,dev>.005?1:0,.008,{color:stemColor});
        s.holder.position.copy(tipP);s.holder.quaternion.setFromRotationMatrix(_M.makeBasis(V(out.z,0,-out.x),UP,out));
        const fl=dev*(1-fruit*.95);s.flower.scale.setScalar(Math.max(.001,fl));s.flower.visible=dev>.005&&fruit<.97;
        const openP=smooth(.25,1,dev);s.petals.morphTargetInfluences[0]=(1-openP)*.9;s.wings.morphTargetInfluences[0]=(1-openP)*.7;
        s.pm.color.setRGB(1,mix(1,.82,fruit),mix(1,.7,fruit));
        s.pod.visible=fruit>.004;const girth=Math.pow(fruit,1.25),podL=1.38;
        s.pod.scale.set(girth*podL,Math.max(.001,Math.pow(fruit,.7))*podL,girth*podL);
        s.pod.rotation.set(.12+Math.sin(i)*.12,0,i%2?-.16:.12);s.rest.copy(s.pod.quaternion);
        s.front.position.set(podOpen*.2,0,podOpen*.12);s.front.rotation.z=-podOpen*.3;s.back.position.z=-podOpen*.08;
        s.beans.forEach((b,j)=>{const f=smooth(.1+j*.04,.95,fruit);b.visible=podOpen>.02;b.scale.set(.066*f,.08*f,.047*f);});
        if(i===(g>6.55?5:0))setAnchor(rig,'flower',tipP.clone().add(tmp.set(0,.05,0)));
        if(i===0){
          s.holder.updateMatrix();s.pod.updateMatrix();
          setAnchor(rig,'fruit',tmp.set(.1,-.5,.06).applyMatrix4(s.pod.matrix).applyMatrix4(s.holder.matrix));
          setAnchor(rig,'newseed',tmp.set(.12,-.55,.08).applyMatrix4(s.pod.matrix).applyMatrix4(s.holder.matrix));
        }
      });
      rig.params.seedX=P.breakX;
    };
    rig.available=(part,g)=>part==='whole'||(part==='seed'&&g<4.8)||(part==='root'&&g>.12)||(part==='leaf'&&g>2.72)||(part==='flower'&&g>5.3)||(part==='fruit'&&g>6.3);
    rig.seedSpan=g=>g<2.45?[1.7,1.75]:[2.05,2.25];
    rig.flowerAngle=g=>-rig.sites[g>6.55?5:0].angle+Math.PI/2;
    rig.canOpenSeed=g=>g<1.9;rig.canOpenFruit=g=>g>=6.34;
    rig.fruitCloseStrings=['Open pods','Close pods','Open pods · inspect the new seeds','Exploded pod view · each bean inside is a seed'];
    rig.labelSpecs=[
      {key:'seed',text:'Seed coat',dx:-90,dy:-22,visible:g=>g<2.5},
      {key:'cotyledon',text:'Cotyledons',dx:94,dy:3,visible:g=>(seedOpenValue>.16||g>2.3)&&g<4.6},
      {key:'embryo',text:'Embryo',dx:35,dy:-64,visible:g=>seedOpenValue>.25&&g<1.9},
      {key:'radicle',text:'Radicle',class:'root',dx:85,dy:25,visible:g=>g>.16&&g<2.38},
      {key:'root',text:'Primary root',class:'root',dx:90,dy:12,visible:g=>g>=2.38},
      {key:'lateral',text:'Lateral roots',class:'root',dx:-96,dy:22,visible:g=>g>2.35},
      {key:'hypocotyl',text:'Hypocotyl',dx:-91,dy:-20,visible:g=>g>1.05&&g<3.75},
      {key:'stem',text:'Stem',dx:77,dy:15,visible:g=>g>3.72},
      {key:'leaf',text:'True leaf',class:'leaf',dx:76,dy:-22,visible:g=>g>2.8&&g<3.8},
      {key:'trifoliate',text:'Trifoliate leaf',class:'leaf',dx:-110,dy:-20,visible:g=>g>3.8},
      {key:'flower',text:'Flower',class:'flower',dx:82,dy:-23,visible:g=>g>5.35},
      {key:'fruit',text:'Bean pod',class:'fruit',dx:88,dy:10,visible:g=>g>6.34},
      {key:'newseed',text:'New seeds',class:'fruit',dx:-86,dy:25,visible:g=>g>6.4&&podOpenValue>.3}
    ];
    return rig;
  }
