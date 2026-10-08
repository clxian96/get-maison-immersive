'use client';
import React,{useMemo,useRef} from 'react';
import * as THREE from 'three';
import {useFrame,useThree} from '@react-three/fiber';

const clamp=(n:number)=>THREE.MathUtils.clamp(n,0,1);
const smooth=(a:number,b:number,t:number)=>{const k=clamp((t-a)/(b-a));return k*k*(3-2*k)};
const bronze='#af8e62',stone='#c2ad91';
// V4.2 — Scroll-scrubbed theatre curtain. Both panels meet cleanly in the middle.
// Each vertex moves toward its OWN outside edge. The folds compress at the wings,
// never pile up along the centre seam. All geometry follows scroll progress exactly.
function CurtainPanel({side,progress,panelWidth,height,halfScreen}:{side:-1|1,progress:React.MutableRefObject<number>,panelWidth:number,height:number,halfScreen:number}){
 const mesh=useRef<THREE.Mesh>(null);
 const {geometry,closed}=useMemo(()=>{
  const g=new THREE.PlaneGeometry(panelWidth,height,72,36);
  const attr=g.attributes.position;
  const base=new Float32Array(attr.count*3);
  for(let i=0;i<attr.count;i++){
   const x=attr.getX(i),y=attr.getY(i);
   // u=0 on inner seam, u=1 on the outside edge, for both panels.
   const u=side===-1 ? (panelWidth/2-x)/panelWidth : (x+panelWidth/2)/panelWidth;
   const fold=.13*Math.cos(u*Math.PI*17)+.045*Math.cos(u*Math.PI*33+.65);
   base[i*3]=x;
   base[i*3+1]=y;
   base[i*3+2]=fold*(.9+.1*Math.cos(y/height*Math.PI));
   attr.setZ(i,base[i*3+2]);
  }
  g.computeVertexNormals();return {geometry:g,closed:base};
 },[panelWidth,height,side]);
 useFrame(()=>{
  const m=mesh.current;if(!m)return;
  const opening=smooth(.018,.128,progress.current);
  const attr=geometry.attributes.position;
  // The inner edge moves from the seam to outside the viewport.
  // As fabric is drawn outward, its horizontal span contracts, gathering at the wings.
  const gap=opening*(halfScreen+1.25);
  const compression=1-.78*opening;
  for(let i=0;i<attr.count;i++){
   const originalX=closed[i*3],y=closed[i*3+1];
   const u=side===-1?(panelWidth/2-originalX)/panelWidth:(originalX+panelWidth/2)/panelWidth;
   const distance=gap+u*panelWidth*compression;
   const outerGather=opening*Math.pow(u,1.8);
   const pleat=.13*Math.cos(u*Math.PI*17)+(.045+.16*outerGather)*Math.cos(u*Math.PI*33+.65);
   attr.setXYZ(i,side*distance-side*panelWidth/2,y,pleat);
  }
  attr.needsUpdate=true;
  geometry.computeVertexNormals();
 });
 return <mesh ref={mesh} geometry={geometry} position={[side*panelWidth/2,0,1]} frustumCulled={false}>
  <meshStandardMaterial color="#571725" roughness={.99} metalness={0} side={THREE.DoubleSide}/>
 </mesh>;
}
function CurtainIntro({progress}:{progress:React.MutableRefObject<number>}){
 const {size}=useThree();
 // Cover both the widest and tallest aspect ratios with no edge leakage.
 const aspect=Math.max(.3,size.width/Math.max(1,size.height));
 const visibleH=2*12*Math.tan(THREE.MathUtils.degToRad(57/2));
 const halfScreen=visibleH*aspect/2;
 const panelWidth=halfScreen+2.0;
 const height=Math.max(17,visibleH+7);
 return <group>
  <CurtainPanel side={-1} progress={progress} panelWidth={panelWidth} height={height} halfScreen={halfScreen}/>
  <CurtainPanel side={1} progress={progress} panelWidth={panelWidth} height={height} halfScreen={halfScreen}/>
  <spotLight position={[-3,7,7]} angle={1.05} penumbra={1} intensity={90} distance={32} color="#cb9772"/>
 </group>;
}
// V4.7 — Privacy: The Library of Silence.
// Replaces the underwater scene with a heritage-inspired private library.
// The hero antique book becomes the gateway into Access.
function BookSpines({count=18,depth=1.2}:{count?:number,depth?:number}){
 const items=useMemo(()=>Array.from({length:count},(_,i)=>({
  x:-2.7 + i*(5.4/(count-1)),
  h:1.05 + ((i*17)%7)*0.16,
  y:-1.9 + (1.05 + ((i*17)%7)*0.16)/2,
  z:(i%3)*0.04,
  c:['#5b3528','#3c4c38','#6d5a43','#73432f','#8a7656'][i%5]
 })),[count]);
 return <group>{items.map((b,i)=><mesh key={i} position={[b.x,b.y,b.z]}>
  <boxGeometry args={[0.24,b.h,depth]}/><meshStandardMaterial color={b.c} roughness={.88}/>
 </mesh>)}</group>
}
function ShelfColumn({side,z,scale=1}:{side:-1|1,z:number,scale?:number}){
 const x=side*5.8;
 return <group position={[x,0,z]} scale={scale}>
  <mesh position={[0,-.2,0]}><boxGeometry args={[6.2,.28,1.55]}/><meshStandardMaterial color="#62462f" roughness={.9}/></mesh>
  <mesh position={[0,4.7,0]}><boxGeometry args={[6.2,.28,1.55]}/><meshStandardMaterial color="#62462f" roughness={.9}/></mesh>
  {[-3.15,3.15].map((sx,i)=><mesh key={i} position={[sx,2.2,0]}><boxGeometry args={[.26,5.1,1.55]}/><meshStandardMaterial color="#3b271c" roughness={.88}/></mesh>)}
  <mesh position={[0,2.15,.68]}><boxGeometry args={[6.05,3.95,.12]}/><meshStandardMaterial color="#322218" roughness={.96}/></mesh>
  <group position={[0,.03,.05]}><BookSpines count={18} depth={1.08}/></group>
  <group position={[0,2.14,.05]}><BookSpines count={18} depth={1.08}/></group>
  <pointLight position={[0,2.6,1.4]} color="#e8bf7b" intensity={8} distance={8}/>
 </group>
}
function ReadingDust(){
 const geometry=useMemo(()=>{
  const n=320,g=new THREE.BufferGeometry(),positions=new Float32Array(n*3);
  for(let i=0;i<n;i++){
   positions[i*3]=(Math.random()-.5)*16;
   positions[i*3+1]=(Math.random()-.2)*8;
   positions[i*3+2]=-14-Math.random()*28;
  }
  g.setAttribute('position',new THREE.BufferAttribute(positions,3));
  return g;
 },[]);
 return <points geometry={geometry}><pointsMaterial color="#d9c29e" transparent opacity={.16} size={.05} sizeAttenuation depthWrite={false}/></points>
}
function HeroBook({progress}:{progress:React.MutableRefObject<number>}){
 const left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null),pages=useRef<THREE.Group>(null);
 useFrame(()=>{
  const t=smooth(.255,.36,progress.current);
  if(left.current) left.current.rotation.y=t*1.08;
  if(right.current) right.current.rotation.y=-t*1.08;
  if(pages.current) pages.current.rotation.z=Math.sin(t*Math.PI)*.05;
 });
 return <group position={[0,-1.15,-38.6]}>
  <mesh position={[0,-2.78,0]} rotation={[-Math.PI/2,0,0]}><cylinderGeometry args={[2.55,2.85,.72,36]}/><meshStandardMaterial color="#38261c" roughness={.92}/></mesh>
  <group position={[0,-.05,0]} ref={pages}>
   <group ref={left} position={[-.02,0,0]}>
    <mesh position={[-1.72,0,0]}><boxGeometry args={[3.45,.2,5.45]}/><meshStandardMaterial color="#6f462f" roughness={.82}/></mesh>
    <mesh position={[-1.72,.13,0]}><boxGeometry args={[3.2,.11,5.1]}/><meshStandardMaterial color="#d8ccb4" roughness={.96}/></mesh>
   </group>
   <group ref={right} position={[.02,0,0]}>
    <mesh position={[1.72,0,0]}><boxGeometry args={[3.45,.2,5.45]}/><meshStandardMaterial color="#6f462f" roughness={.82}/></mesh>
    <mesh position={[1.72,.13,0]}><boxGeometry args={[3.2,.11,5.1]}/><meshStandardMaterial color="#e3d7c1" roughness={.96}/></mesh>
   </group>
  </group>
  <mesh position={[0,.22,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.95,.28,12,90]}/><meshStandardMaterial color="#d9c7a2" roughness={.86}/></mesh>
  <pointLight position={[0,2.8,1.4]} intensity={14} color="#e9c996" distance={10}/>
 </group>;
}
function LibrarySilence({progress}:{progress:React.MutableRefObject<number>}){
 const lamps=useRef<THREE.Group>(null);
 useFrame(({clock})=>{
  if(lamps.current){lamps.current.position.y=Math.sin(clock.elapsedTime*.22)*.08;}
 });
 return <group>
  <ReadingDust/>
  {[-16.5,-22.5,-28.8].map((z,i)=><React.Fragment key={i}><ShelfColumn side={-1} z={z} scale={1-i*.05}/><ShelfColumn side={1} z={z} scale={1-i*.05}/></React.Fragment>)}
  <mesh position={[0,-4.05,-24]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[16,36]}/><meshStandardMaterial color="#3d281d" roughness={.94}/></mesh>
  <group ref={lamps}>
   {[-18.2,-25.8,-33.3].map((z,i)=><group key={i} position={[0,4.2,z]}>
    <mesh><sphereGeometry args={[.22,10,8]}/><meshStandardMaterial color="#ac855b" metalness={.4} roughness={.4}/></mesh>
    <mesh position={[0,-.95,0]}><cylinderGeometry args={[.05,.05,1.8,8]}/><meshStandardMaterial color="#977451" metalness={.35} roughness={.46}/></mesh>
    <pointLight position={[0,-1.5,.5]} intensity={14} color="#f4d5a1" distance={14}/>
   </group>)}
  </group>
  <HeroBook progress={progress}/>
  <hemisphereLight color="#e7c89d" groundColor="#24150d" intensity={.64}/>
  <spotLight position={[0,7.2,-33]} angle={.72} penumbra={1} intensity={108} distance={45} color="#f6dcb1"/>
  <pointLight position={[-5,2,-20]} intensity={10} color="#9d7856" distance={16}/>
  <pointLight position={[5,2,-20]} intensity={10} color="#9d7856" distance={16}/>
 </group>;
}

function BookAperture({progress}:{progress:React.MutableRefObject<number>}){
 const group=useRef<THREE.Group>(null);
 useFrame(({clock})=>{
  if(!group.current)return;
  const e=smooth(.29,.365,progress.current);
  group.current.rotation.z=Math.sin(clock.elapsedTime*.18)*.012 + e*.06;
  group.current.scale.setScalar(.92+e*.22);
 });
 return <group position={[0,.2,-39.2]} ref={group}>
  <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[2.05,.22,12,80]}/><meshStandardMaterial color="#e0d4be" roughness={.92}/></mesh>
  {Array.from({length:10},(_,i)=>{
   const a=i*Math.PI*2/10; return <mesh key={i} position={[Math.cos(a)*2.1,Math.sin(a)*2.1,-.18]} rotation={[0,0,a+Math.PI/2]}>
    <planeGeometry args={[.52,2.4,1,8]}/><meshStandardMaterial color={i%2?'#d7ccb7':'#c8b79a'} side={THREE.DoubleSide} transparent opacity={.7} depthWrite={false}/>
   </mesh>
  })}
  <pointLight position={[0,2.2,1.5]} intensity={10} color="#f1d2a3" distance={10}/>
 </group>;
}

function Arch({z,x=0,scale=1}:{z:number,x?:number,scale?:number}){const shape=useMemo(()=>{let s=new THREE.Shape();s.moveTo(-3.3,-4);s.lineTo(-3.3,1);s.absarc(0,1,3.3,Math.PI,0,true);s.lineTo(3.3,-4);s.lineTo(2.35,-4);s.lineTo(2.35,1);s.absarc(0,1,2.35,0,Math.PI,false);s.lineTo(-2.35,-4);s.closePath();return s},[]);return <group position={[x,0,z]} scale={scale}><mesh><extrudeGeometry args={[shape,{depth:1,bevelEnabled:true,bevelSize:.09,bevelThickness:.09,bevelSegments:2,curveSegments:24}]}/><meshStandardMaterial color={stone} roughness={.94}/></mesh><mesh position={[0,1,.98]}><torusGeometry args={[2.81,.042,8,90,Math.PI]}/><meshStandardMaterial color={bronze} metalness={.7} roughness={.4}/></mesh><mesh position={[0,-3.95,.8]}><boxGeometry args={[7.2,.16,1.9]}/><meshStandardMaterial color="#79583a" roughness={.56} metalness={.3}/></mesh></group>}
function Access({progress}:{progress:React.MutableRefObject<number>}){
 const doorL=useRef<THREE.Group>(null),doorR=useRef<THREE.Group>(null);
 const sun=useRef<THREE.DirectionalLight>(null);
 useFrame(()=>{
  const t=smooth(.43,.53,progress.current);
  if(doorL.current)doorL.current.rotation.y=-t*1.25;
  if(doorR.current)doorR.current.rotation.y=t*1.25;
  if(sun.current)sun.current.intensity=1.5+1.3*smooth(.37,.445,progress.current);
 });
 return <group>
  <mesh position={[0,0,-79]}><planeGeometry args={[90,40]}/><meshBasicMaterial color="#d9c4a5" side={THREE.DoubleSide}/></mesh>
  <directionalLight ref={sun} position={[7,11,-55]} color="#fff0d2" intensity={2.1}/>
  <hemisphereLight color="#ffe5bc" groundColor="#775d41" intensity={1.0}/>
  <Arch z={-52}/><Arch z={-60} x={1} scale={.92}/><Arch z={-68} x={-.7} scale={.8}/>
  <group position={[0,0,-51]}>
   <group ref={doorL} position={[-2.15,0,.45]}><mesh position={[1.05,-.6,0]}><boxGeometry args={[2.1,7.3,.16]}/><meshStandardMaterial color="#775534" metalness={.3} roughness={.68}/></mesh></group>
   <group ref={doorR} position={[2.15,0,.45]}><mesh position={[-1.05,-.6,0]}><boxGeometry args={[2.1,7.3,.16]}/><meshStandardMaterial color="#775534" metalness={.3} roughness={.68}/></mesh></group>
  </group>
  <mesh position={[0,-4,-59]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[27,34]}/><meshStandardMaterial color="#b9a184" roughness={.87}/></mesh>
  <pointLight position={[3,3,-62]} color="#f8deb5" intensity={135} distance={36}/>
  <pointLight position={[-7,3,-67]} color="#edcd9b" intensity={65} distance={30}/>
 </group>;
}
function Limb({from,to,r=.14,color='#d7c3ad'}:{from:[number,number,number],to:[number,number,number],r?:number,color?:string}){const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),mid=a.clone().add(b).multiplyScalar(.5),len=a.distanceTo(b),rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());return <mesh position={mid.toArray()} quaternion={rotation}><cylinderGeometry args={[r*.8,r,len,10]}/><meshStandardMaterial color={color} roughness={.7}/></mesh>}
function Dancer({progress}:{progress:React.MutableRefObject<number>}){const figure=useRef<THREE.Group>(null),arms=useRef<THREE.Group>(null);useFrame(()=>{const t=smooth(.62,.755,progress.current);if(figure.current){figure.current.rotation.y=t*Math.PI*1.8;figure.current.position.y=.1+Math.sin(t*Math.PI)*.26}if(arms.current){arms.current.rotation.z=Math.sin(t*Math.PI)*.3;}});return <group ref={figure} position={[0,0,-85]}><mesh position={[0,1.1,0]}><sphereGeometry args={[.43,18,14]}/><meshStandardMaterial color="#cfbba7" roughness={.77}/></mesh><mesh position={[0,-.05,0]}><cylinderGeometry args={[.35,.23,1.85,20]}/><meshStandardMaterial color="#e2d6c5" roughness={.88}/></mesh><mesh position={[0,-1.05,0]}><cylinderGeometry args={[.9,.25,.67,32]}/><meshStandardMaterial color="#d7c8b3" roughness={.92} side={THREE.DoubleSide}/></mesh><group ref={arms}><Limb from={[-.28,.55,0]} to={[-.8,1.05,0]} r={.13}/><Limb from={[-.8,1.05,0]} to={[-1,1.7,0]} r={.10}/><Limb from={[.28,.55,0]} to={[.8,1.05,0]} r={.13}/><Limb from={[.8,1.05,0]} to={[1,1.7,0]} r={.10}/></group><Limb from={[-.22,-1.22,0]} to={[-.38,-2.45,.12]} r={.18}/><Limb from={[-.38,-2.45,.12]} to={[-.38,-3.35,.25]} r={.12}/><Limb from={[.22,-1.22,0]} to={[.4,-2.3,-.2]} r={.18}/><Limb from={[.4,-2.3,-.2]} to={[1.4,-2.3,-.15]} r={.11}/></group>}
function Ballet({progress}:{progress:React.MutableRefObject<number>}){return <group><Dancer progress={progress}/><mesh position={[0,-3.5,-85]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[12,64]}/><meshStandardMaterial color="#4c3d32" roughness={.79}/></mesh><mesh position={[0,-3.48,-85]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[4.7,4.75,100]}/><meshStandardMaterial color="#8b704d" roughness={.6}/></mesh><spotLight position={[-1,10,-81]} angle={.29} penumbra={.85} intensity={230} color="#ffe3bf" distance={27}/><pointLight position={[4,1,-83]} intensity={12} color="#8a583e" distance={19}/></group>}
function Optics({progress}:{progress:React.MutableRefObject<number>}){
 const rings=useRef<THREE.Group>(null);
 useFrame(()=>{
  const t=smooth(.78,.95,progress.current);
  if(rings.current){rings.current.rotation.y=(t-.5)*.3;rings.current.rotation.z=t*.15;}
 });
 return <group>
  {/* Antique-ivory environment, not a bright retail-white backdrop. */}
  <mesh position={[0,.3,-135]}><planeGeometry args={[100,75]}/><meshBasicMaterial color="#d8c6a9" side={THREE.DoubleSide}/></mesh>
  <mesh position={[0,-5,-122]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[75,46]}/><meshStandardMaterial color="#ac9d7e" roughness={.96}/></mesh>
  <hemisphereLight color="#fff0d7" groundColor="#8b8065" intensity={1.3}/>
  <directionalLight position={[5,9,-108]} color="#f8e8ca" intensity={2.3}/>
  <group ref={rings}>
   {[0,1,2,3,4].map(i=><group key={i} position={[Math.sin(i*1.7)*.65,.3,-110-i*3.4]}>
    <mesh><torusGeometry args={[3.5-i*.27,.16,12,96]}/><meshStandardMaterial color="#927043" metalness={.58} roughness={.46}/></mesh>
    <mesh><torusGeometry args={[3.18-i*.27,.035,8,96]}/><meshStandardMaterial color="#e5d4b6" metalness={.45} roughness={.4}/></mesh>
    <mesh position={[0,-3.5,0]}><cylinderGeometry args={[.14,.2,2.8,12]}/><meshStandardMaterial color="#967750" roughness={.43} metalness={.5}/></mesh>
   </group>)}
  </group>
  <mesh position={[0,.3,-127]}><sphereGeometry args={[1.1,28,20]}/><meshPhysicalMaterial color="#d9cfb4" transmission={.38} roughness={.2} thickness={1} metalness={.04}/></mesh>
  <pointLight position={[2,5,-118]} color="#f2dfb9" intensity={88} distance={30}/>
 </group>;
}

// V4.6 spatial gateways: geometry is physically present in the same 3D space.
// All transformations are pure functions of scroll progress and reverse with the wheel.
function SilkAperture({progress}:{progress:React.MutableRefObject<number>}){
 const group=useRef<THREE.Group>(null);
 const ribbons=useMemo(()=>Array.from({length:16},(_,i)=>({angle:i*Math.PI*2/16,phase:i*.63})),[]);
 useFrame(({clock})=>{
  if(!group.current)return;
  const e=smooth(.285,.365,progress.current);
  group.current.rotation.z=e*.16+Math.sin(clock.elapsedTime*.14)*.014;
  group.current.scale.setScalar(.87+e*.2);
 });
 return <group position={[0,0,-39.2]} ref={group}>
  <mesh><torusGeometry args={[3.65,.35,14,96]}/><meshStandardMaterial color="#5b979a" transparent opacity={.66} roughness={.95} side={THREE.DoubleSide}/></mesh>
  {ribbons.map((r,i)=><mesh key={i} position={[Math.cos(r.angle)*3.7,Math.sin(r.angle)*3.7,-.25]} rotation={[0,0,r.angle+Math.PI/2]}>
   <planeGeometry args={[1.0,3.1,2,8]}/><meshStandardMaterial color={i%2?'#769ea4':'#416e80'} side={THREE.DoubleSide} transparent opacity={.33} depthWrite={false}/>
  </mesh>)}
  <pointLight position={[0,3,2]} intensity={12} color="#6896a1" distance={12}/>
 </group>;
}
function BronzeKeyhole({progress}:{progress:React.MutableRefObject<number>}){
 const left=useRef<THREE.Group>(null),right=useRef<THREE.Group>(null);
 useFrame(()=>{
  const t=smooth(.495,.565,progress.current);
  if(left.current)left.current.rotation.y=-t*.94;
  if(right.current)right.current.rotation.y=t*.94;
 });
 return <group position={[0,0,-73]}>
  <mesh><torusGeometry args={[3.45,.41,14,96]}/><meshStandardMaterial color="#775535" metalness={.58} roughness={.46}/></mesh>
  <mesh><torusGeometry args={[3.08,.055,8,96]}/><meshStandardMaterial color="#d0a878" metalness={.68} roughness={.33}/></mesh>
  <group ref={left} position={[-3.25,0,0]}><mesh position={[1.65,0,0]}><boxGeometry args={[3.3,7.0,.32]}/><meshStandardMaterial color="#654a32" metalness={.35} roughness={.67}/></mesh></group>
  <group ref={right} position={[3.25,0,0]}><mesh position={[-1.65,0,0]}><boxGeometry args={[3.3,7.0,.32]}/><meshStandardMaterial color="#654a32" metalness={.35} roughness={.67}/></mesh></group>
  <pointLight position={[0,0,-2]} intensity={36} color="#e9bf8d" distance={17}/>
 </group>;
}
function BalletLensTransition({progress}:{progress:React.MutableRefObject<number>}){
 const ring=useRef<THREE.Group>(null);
 useFrame(()=>{
  if(!ring.current)return;
  const t=smooth(.695,.77,progress.current);
  ring.current.rotation.z=-t*Math.PI*.45;
  ring.current.rotation.y=t*.18;
  ring.current.scale.setScalar(.84+t*.28);
 });
 return <group position={[0,0,-98]} ref={ring}>
  <mesh><torusGeometry args={[3.6,.16,14,108]}/><meshStandardMaterial color="#c7aa82" roughness={.49} metalness={.35}/></mesh>
  <mesh><torusGeometry args={[3.27,.035,8,108]}/><meshStandardMaterial color="#ead8b8" roughness={.48} metalness={.25}/></mesh>
  {Array.from({length:16},(_,i)=><mesh key={i} rotation={[0,0,i*Math.PI/8]} position={[Math.cos(i*Math.PI/8)*3.5,Math.sin(i*Math.PI/8)*3.5,0]}>
   <boxGeometry args={[.1,.32,.09]}/><meshStandardMaterial color="#9e784c" metalness={.4} roughness={.5}/></mesh>)}
 </group>;
}

// V4.8: restrained but distinct brightness rhythm across the four worlds.
// Transitions are driven by one scroll value, preserving reverse-scroll behaviour.
const lightStops=[
 {p:0,color:'#260e18',fog:60},
 {p:.15,color:'#2e2019',fog:78},
 {p:.30,color:'#4a3528',fog:88},
 {p:.39,color:'#a89375',fog:95},
 {p:.48,color:'#ccb699',fog:110},
 {p:.56,color:'#8c745e',fog:100},
 {p:.65,color:'#28211e',fog:70},
 {p:.76,color:'#776d57',fog:90},
 {p:.82,color:'#c6b59a',fog:105},
 {p:.9,color:'#b5a88f',fog:105},
 {p:1,color:'#280e1a',fog:60},
 ];
function Atmosphere({progress}:{progress:React.MutableRefObject<number>}){
 const {scene}=useThree();
 const background=useMemo(()=>new THREE.Color(),[]);
 const fog=useMemo(()=>new THREE.Fog('#260e18',16,60),[]);
 const colors=useMemo(()=>lightStops.map(s=>new THREE.Color(s.color)),[]);
 useFrame(()=>{
  const t=progress.current;
  let i=0;while(i<lightStops.length-2&&t>lightStops[i+1].p)i++;
  const f=smooth(lightStops[i].p,lightStops[i+1].p,t);
  background.copy(colors[i]).lerp(colors[i+1],f);
  scene.background=background;
  fog.color.copy(background);
  fog.far=THREE.MathUtils.lerp(lightStops[i].fog,lightStops[i+1].fog,f);
  scene.fog=fog;
 });
 return null;
}
export default function Worlds({progress}:{progress:React.MutableRefObject<number>}){return <><Atmosphere progress={progress}/><ambientLight color="#caa68a" intensity={.7}/><directionalLight position={[-8,9,6]} intensity={1.1} color="#debd9d"/><CurtainIntro progress={progress}/><LibrarySilence progress={progress}/><BookAperture progress={progress}/><Access progress={progress}/><BronzeKeyhole progress={progress}/><Ballet progress={progress}/><BalletLensTransition progress={progress}/><Optics progress={progress}/></>}
