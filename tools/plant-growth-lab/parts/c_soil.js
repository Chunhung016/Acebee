  // A continuous, irregular earth cutaway: aggregates and pores, not stacked bands.
  const soilCut=new T.Group(),soilXray=new T.Group(),soilBase=new T.Group();
  scene.add(soilCut,soilXray,soilBase);soilXray.visible=false;
  const soilRadius=2.16;
  let earthSeed=731927;
  const earthRandom=()=>{earthSeed=(Math.imul(1664525,earthSeed)+1013904223)>>>0;return earthSeed/4294967296;};
    const earthTop=(x,z)=>-.025+.115*(noise3(x*3.8,9,z*3.8)-.5)+.025*Math.sin(x*5+z*3);
  const earthBottom=(x,z)=>-3.105+.028*noise3(x*5,4,z*5);
  const earthFront=(x,y)=>-.17-.048*noise3(x*7.2,y*7.2,2)+.014*Math.sin(x*17+y*9);
  const earthRadius=(a,t)=>soilRadius-.07*t+.065*Math.sin(a*5+.7)+.04*Math.sin(a*11-1.2)+.075*(noise3(Math.cos(a)*4,t*9,Math.sin(a)*4)-.5);
  function earthSide(a,t){
    const r=earthRadius(a,t),x=Math.cos(a)*r,z=Math.sin(a)*r;
    const y=mix(earthTop(x,z),earthBottom(x,z),t);
    return V(x,y,z+earthFront(x,y));
  }
  function earthFace(u,t){
    const x=mix(-earthRadius(Math.PI,t),earthRadius(TAU,t),u);
    const y=mix(earthTop(x,0),earthBottom(x,0),t);
    return V(x,y,earthFront(x,y));
  }
  function earthCap(a,r,bottom=false){
    const radius=earthRadius(a,bottom?1:0)*r,x=Math.cos(a)*radius,z=Math.sin(a)*radius;
    const y=bottom?earthBottom(x,z):earthTop(x,z);
    return V(x,y,z+earthFront(x,y));
  }
  const soilTex=soilTextures();soilTex.map.repeat.set(1,1);
  const earthMaterial=enhance(new T.MeshStandardMaterial({color:0xffffff,map:soilTex.map,normalMap:soilTex.normal,normalScale:new T.Vector2(1.1,1.1),roughness:.97,metalness:0,vertexColors:true,envMapIntensity:.55}));
  function earthSurface(cols,rows,sample,reverse,top=false){
    const pos=[],uv=[],colors=[],indices=[],color=new T.Color();
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const p=sample(i/cols,j/rows),n=noise3(p.x*2.8,p.y*3.1,p.z*2.8);
      pos.push(p.x,p.y,p.z);
      if(top)uv.push(p.x*1.25,p.z*1.25);else uv.push(i/cols*5,p.y*1.25);
      // Mottling is spatial, with only a faint gradual change in depth.
      color.setHSL(.071+n*.018,.27+n*.10,.118+n*.066+clamp(-p.y/3.1)*.009);
      colors.push(color.r,color.g,color.b);
    }
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      const a=j*(cols+1)+i,b=a+cols+1;
      if(reverse)indices.push(a,b,a+1,a+1,b,b+1);else indices.push(a,a+1,b,a+1,b+1,b);
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    return mesh(geometry,earthMaterial,soilCut);
  }
  earthSurface(76,56,(u,t)=>earthSide(Math.PI+u*Math.PI,t),false);
  earthSurface(76,56,earthFace,true);
  earthSurface(76,30,(u,r)=>earthCap(Math.PI+u*Math.PI,r),false,true);
  earthSurface(76,20,(u,r)=>earthCap(Math.PI+u*Math.PI,r,true),true,true);

  // Irregular aggregates are instanced so close-up detail stays inexpensive.
  const crumbGeometry=new T.IcosahedronGeometry(1,1);
  const crumbPositions=crumbGeometry.attributes.position;
  for(let i=0;i<crumbPositions.count;i++){
    const x=crumbPositions.getX(i),y=crumbPositions.getY(i),z=crumbPositions.getZ(i);
    const r=.87+.22*noise3(x*4+12,y*4+6,z*4+3);crumbPositions.setXYZ(i,x*r,y*r,z*r);
  }
  crumbGeometry.computeVertexNormals();
  const crumbMaterial=enhance(new T.MeshStandardMaterial({color:0xffffff,map:soilTex.map,normalMap:soilTex.normal,normalScale:new T.Vector2(.8,.8),roughness:.95,metalness:0,envMapIntensity:.55}));
  const crumbDummy=new T.Object3D(),crumbShade=new T.Color();
  function addEarthCrumbs(count,parent,place){
    const crumbs=new T.InstancedMesh(crumbGeometry,crumbMaterial,count);
    for(let i=0;i<count;i++){
      const entry=place(i),s=entry.size;
      crumbDummy.position.copy(entry.position);
      crumbDummy.rotation.set(earthRandom()*TAU,earthRandom()*TAU,earthRandom()*TAU);
      crumbDummy.scale.set(s*(.7+earthRandom()*.5),s*(.55+earthRandom()*.55),s*(.65+earthRandom()*.55));
      crumbDummy.updateMatrix();crumbs.setMatrixAt(i,crumbDummy.matrix);
      const mineral=earthRandom()<.045;
      crumbShade.setHSL(.065+earthRandom()*.035,mineral?.13:.25+earthRandom()*.13,(mineral?.28:.11)+earthRandom()*.10);
      crumbs.setColorAt(i,crumbShade);
    }
    crumbs.instanceMatrix.needsUpdate=true;crumbs.instanceColor.needsUpdate=true;
    crumbs.castShadow=true;crumbs.receiveShadow=true;parent.add(crumbs);
  }
  addEarthCrumbs(1050,soilCut,()=>{
    const a=Math.PI+earthRandom()*Math.PI,r=Math.sqrt(earthRandom()),position=earthCap(a,r);
    const size=.012+Math.pow(earthRandom(),2.6)*.090;position.y+=size*.27;
    return {position,size};
  });
  addEarthCrumbs(1120,soilCut,()=>{
    const position=earthFace(earthRandom(),earthRandom());
    const size=.012+Math.pow(earthRandom(),2.8)*.062;
    position.z+=size*.16;
    // Keep the teaching cut open in front of the seed and roots.
    position.z=Math.min(position.z,-.148-size);
    return {position,size};
  });
  addEarthCrumbs(560,soilCut,()=>{
    const a=Math.PI+earthRandom()*Math.PI,position=earthSide(a,earthRandom());
    const size=.018+Math.pow(earthRandom(),2.4)*.070;
    position.x+=Math.cos(a)*size*.25;position.z+=Math.sin(a)*size*.25;
    return {position,size};
  });
  // A broken, granular lip replaces the clean circular top edge.
  addEarthCrumbs(150,soilCut,()=>{
    const position=earthFace(earthRandom(),0),size=.021+earthRandom()*.052;
    position.z-=size*.65;position.y+=size*.25;return {position,size};
  });
  // Short dark organic fragments lie in the surface; no decorative layer lines.
  const litterVertices=[];
  for(let i=0;i<100;i++){
    const p=earthCap(Math.PI+earthRandom()*Math.PI,Math.sqrt(earthRandom())*.96);
    const a=earthRandom()*TAU,length=.022+earthRandom()*.075;
    litterVertices.push(p.x,p.y+.018,p.z,p.x+Math.cos(a)*length,p.y+.021,p.z+Math.sin(a)*length);
  }
  soilCut.add(new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(litterVertices,3)),new T.LineBasicMaterial({color:0x32281d,transparent:true,opacity:.65})));
  // Fallen crumbs replace the old circular display stand.
  addEarthCrumbs(170,soilBase,()=>{
    const onFront=earthRandom()<.62,size=.009+Math.pow(earthRandom(),2.4)*.061;
    let x,z;
    if(onFront){x=(earthRandom()*2-1)*2.22;z=-.17+Math.pow(earthRandom(),2)*.27;}
    else{const a=Math.PI+earthRandom()*Math.PI,r=earthRadius(a,1)+earthRandom()*.16;x=Math.cos(a)*r;z=Math.sin(a)*r-.17;}
    return {position:V(x,-3.16+size*.55,z),size};
  });

  // Small dark recesses interrupt the exposed face and top, in two draw calls.
  const poreCanvas=document.createElement('canvas');poreCanvas.width=poreCanvas.height=64;
  const poreContext=poreCanvas.getContext('2d'),poreGradient=poreContext.createRadialGradient(32,32,1,32,32,31);
  poreGradient.addColorStop(0,'rgba(28,20,13,.65)');poreGradient.addColorStop(.48,'rgba(37,27,17,.35)');poreGradient.addColorStop(1,'rgba(37,27,17,0)');
  poreContext.fillStyle=poreGradient;poreContext.fillRect(0,0,64,64);
  const poreTexture=new T.CanvasTexture(poreCanvas);poreTexture.colorSpace=T.SRGBColorSpace;
  const poreMaterial=new T.MeshBasicMaterial({map:poreTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const poreGeometry=new T.PlaneGeometry(1,1),poreDummy=new T.Object3D();
  for(const top of [false,true]){
    const count=top?130:210,pores=new T.InstancedMesh(poreGeometry,poreMaterial,count);
    for(let i=0;i<count;i++){
      const p=top?earthCap(Math.PI+earthRandom()*Math.PI,Math.sqrt(earthRandom())*.98):earthFace(.015+earthRandom()*.97,.02+earthRandom()*.96);
      const radius=.020+Math.pow(earthRandom(),2)*.065;poreDummy.position.copy(p);
      if(top){poreDummy.position.y+=.003;poreDummy.rotation.set(-Math.PI/2,0,earthRandom()*TAU);}
      else{poreDummy.position.z+=.002;poreDummy.rotation.set(0,0,earthRandom()*TAU);}
      poreDummy.scale.set(radius,radius*(.4+earthRandom()*.55),1);poreDummy.updateMatrix();pores.setMatrixAt(i,poreDummy.matrix);
    }
    pores.instanceMatrix.needsUpdate=true;soilCut.add(pores);
  }

  // X-ray remains a full translucent volume, without artificial strata.
  const xrayGeometry=new T.CylinderGeometry(soilRadius,soilRadius-.07,3.08,72,32);
  const xrayPositions=xrayGeometry.attributes.position;
  for(let i=0;i<xrayPositions.count;i++){
    let x=xrayPositions.getX(i),y=xrayPositions.getY(i),z=xrayPositions.getZ(i);
    const scale=1+.017*Math.sin(Math.atan2(z,x)*5)+.012*(noise3(x*4,y*4,z*4)-.5);
    xrayPositions.setXYZ(i,x*scale,y,z*scale);
  }
  xrayGeometry.computeVertexNormals();
  const xraySoil=mesh(xrayGeometry,new T.MeshStandardMaterial({color:0x796247,transparent:true,opacity:.075,depthWrite:false,side:T.DoubleSide,roughness:1}),soilXray);
  xraySoil.position.set(0,-1.54,-.17);xraySoil.castShadow=false;xraySoil.receiveShadow=false;xraySoil.renderOrder=-2;
  const floor=mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({color:0x5a4f3e,opacity:.2}),scene);
  floor.rotation.x=-Math.PI/2;floor.position.y=-3.17;floor.castShadow=false;

