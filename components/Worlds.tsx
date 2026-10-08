'use client';
import React,{useMemo,useRef} from 'react';
import * as THREE from 'three';
import {useFrame,useThree} from '@react-three/fiber';

const clamp=(n:number)=>THREE.MathUtils.clamp(n,0,1);
const smooth=(a:number,b:number,t:number)=>{const k=clamp((t-a)/(b-a));return k*k*(3-2*k)};
const bronze='#ab8656',stone='#95826b';
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
// V4.5 — Privacy: layered submerged silk and underwater atmosphere.
// Geometry is deformed from immutable rest positions, preventing cumulative distortion.
function SeaSilk({progress,variant=0}:{progress:React.MutableRefObject<number>,variant?:number}){
 const geometry=useMemo(()=>new THREE.PlaneGeometry(6.9,11.5,36,66),[]);
 const original=useMemo(()=>new Float32Array((geometry.attributes.position.array as Float32Array)),[geometry]);
 const mesh=useRef<THREE.Mesh>(null);
 const params=[
  {position:[1.2,-.65,-25] as [number,number,number],scale:1,rotation:[.12,.25,-.22] as [number,number,number],color:'#8eb7ad',opacity:.43},
  {position:[-6.1,.4,-29] as [number,number,number],scale:.85,rotation:[-.08,-.5,.18] as [number,number,number],color:'#477c87',opacity:.25},
  {position:[7.0,-1.7,-35] as [number,number,number],scale:1.3,rotation:[.05,.85,.12] as [number,number,number],color:'#9bb6a6',opacity:.19}
 ][variant];
 useFrame(({clock})=>{
  if(!mesh.current)return;
  const attribute=geometry.attributes.position;
  const t=progress.current;
  // Environmental breathing is extremely slow; principal movement is scroll-scrubbed.
  const breath=Math.sin(clock.elapsedTime*.24+variant*1.7)*.10;
  const journey=smooth(.19,.37,t);
  for(let i=0;i<attribute.count;i++){
   const x=original[3*i],y=original[3*i+1];
   const ripple=Math.sin(y*.73+x*.29+variant*1.2+journey*2.1+breath);
   const drift=Math.sin(y*.26+variant+journey*.9);
   attribute.setXYZ(i,x+drift*.43,y, ripple*.56+Math.cos(x*1.1+y*.12+variant)*.22);
  }
  attribute.needsUpdate=true;
  geometry.computeVertexNormals();
  mesh.current.rotation.y=params.rotation[1]+journey*(variant===0?.35:-.18);
  mesh.current.rotation.z=params.rotation[2]+Math.sin(journey*Math.PI)*.07;
 });
 return <mesh ref={mesh} geometry={geometry} position={params.position} scale={params.scale} rotation={params.rotation} frustumCulled={false}>
  <meshPhysicalMaterial color={params.color} side={THREE.DoubleSide} transparent opacity={params.opacity} roughness={.82} metalness={0} depthWrite={false} transmission={0} />
 </mesh>
}
function SeaDust(){
 const geometry=useMemo(()=>{
  const n=440,g=new THREE.BufferGeometry(),positions=new Float32Array(n*3),sizes=new Float32Array(n);
  for(let i=0;i<n;i++){
   const a=i*2.3999632297;
   const r=2+Math.sqrt(i/n)*16;
   positions[i*3]=Math.cos(a)*r;
   positions[i*3+1]=Math.sin(a)*r*.55;
   positions[i*3+2]=-14-(i%83)*.36;
   sizes[i]=.025+(i%4)*.007;
  }
  g.setAttribute('position',new THREE.BufferAttribute(positions,3));
  return g;
 },[]);
 return <points geometry={geometry}><pointsMaterial color="#92b5b5" transparent opacity={.19} size={.048} sizeAttenuation depthWrite={false}/></points>;
}
function OceanRays({progress}:{progress:React.MutableRefObject<number>}){
 const beams=useRef<THREE.Group>(null);
 const cone=useMemo(()=>new THREE.CylinderGeometry(.12,4.0,23,28,1,true),[]);
 useFrame(({clock})=>{
  if(!beams.current)return;
  const t=smooth(.14,.37,progress.current);
  beams.current.rotation.z=Math.sin(clock.elapsedTime*.11)*.035 + .08*t;
  beams.current.position.x=-2*t;
 });
 return <group ref={beams} position={[0,3,-26]}>
  {[-9,-3.8,3.3,9].map((x,i)=><mesh key={i} geometry={cone} position={[x,0,-i*2.7]} rotation={[.12,0,(i-1.5)*.11]}>
   <meshBasicMaterial color={i%2===0?'#73a7aa':'#97b8ba'} transparent opacity={.045} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending}/>
  </mesh>)}
 </group>
}
function Ocean({progress}:{progress:React.MutableRefObject<number>}){
 const surface=useRef<THREE.Mesh>(null);
 useFrame(({clock})=>{
  if(surface.current){surface.current.rotation.z=Math.sin(clock.elapsedTime*.12)*.018;}
 });
 return <group>
  <SeaDust/>
  <OceanRays progress={progress}/>
  <SeaSilk progress={progress} variant={0}/>
  <SeaSilk progress={progress} variant={1}/>
  <SeaSilk progress={progress} variant={2}/>
  <mesh ref={surface} position={[0,12,-30]} rotation={[-Math.PI/2,0,0]}>
   <planeGeometry args={[95,85,10,10]}/>
   <meshStandardMaterial color="#23505a" roughness={.72} transparent opacity={.29} depthWrite={false}/>
  </mesh>
  <hemisphereLight color="#86b3bb" groundColor="#061621" intensity={.7}/>
  <spotLight position={[1,13,-22]} angle={.58} penumbra={1} intensity={95} distance={55} color="#7babb9"/>
  <pointLight position={[-5,5,-27]} intensity={19} color="#477c89" distance={30}/>
  <pointLight position={[8,-4,-32]} intensity={12} color="#3d6978" distance={29}/>
 </group>;
}
function Arch({z,x=0,scale=1}:{z:number,x?:number,scale?:number}){const shape=useMemo(()=>{let s=new THREE.Shape();s.moveTo(-3.3,-4);s.lineTo(-3.3,1);s.absarc(0,1,3.3,Math.PI,0,true);s.lineTo(3.3,-4);s.lineTo(2.35,-4);s.lineTo(2.35,1);s.absarc(0,1,2.35,0,Math.PI,false);s.lineTo(-2.35,-4);s.closePath();return s},[]);return <group position={[x,0,z]} scale={scale}><mesh><extrudeGeometry args={[shape,{depth:1,bevelEnabled:true,bevelSize:.09,bevelThickness:.09,bevelSegments:2,curveSegments:24}]}/><meshStandardMaterial color={stone} roughness={.94}/></mesh><mesh position={[0,1,.98]}><torusGeometry args={[2.81,.042,8,90,Math.PI]}/><meshStandardMaterial color={bronze} metalness={.7} roughness={.4}/></mesh><mesh position={[0,-3.95,.8]}><boxGeometry args={[7.2,.16,1.9]}/><meshStandardMaterial color="#79583a" roughness={.56} metalness={.3}/></mesh></group>}
function Access({progress}:{progress:React.MutableRefObject<number>}){const doorL=useRef<THREE.Group>(null),doorR=useRef<THREE.Group>(null);useFrame(()=>{const t=smooth(.43,.53,progress.current);if(doorL.current)doorL.current.rotation.y=-t*1.25;if(doorR.current)doorR.current.rotation.y=t*1.25});return <group><Arch z={-52}/><Arch z={-60} x={1} scale={.92}/><Arch z={-68} x={-.7} scale={.8}/><group position={[0,0,-51]}><group ref={doorL} position={[-2.15,0,.45]}><mesh position={[1.05,-.6,0]}><boxGeometry args={[2.1,7.3,.16]}/><meshStandardMaterial color="#593e2c" metalness={.25} roughness={.68}/></mesh></group><group ref={doorR} position={[2.15,0,.45]}><mesh position={[-1.05,-.6,0]}><boxGeometry args={[2.1,7.3,.16]}/><meshStandardMaterial color="#593e2c" metalness={.25} roughness={.68}/></mesh></group></group><mesh position={[0,-4,-59]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[27,34]}/><meshStandardMaterial color="#34261e" roughness={.93}/></mesh><pointLight position={[3,3,-62]} color="#ebb879" intensity={90} distance={29}/></group>}
function Limb({from,to,r=.14,color='#d7c3ad'}:{from:[number,number,number],to:[number,number,number],r?:number,color?:string}){const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),mid=a.clone().add(b).multiplyScalar(.5),len=a.distanceTo(b),rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());return <mesh position={mid.toArray()} quaternion={rotation}><cylinderGeometry args={[r*.8,r,len,10]}/><meshStandardMaterial color={color} roughness={.7}/></mesh>}
function Dancer({progress}:{progress:React.MutableRefObject<number>}){const figure=useRef<THREE.Group>(null),arms=useRef<THREE.Group>(null);useFrame(()=>{const t=smooth(.62,.755,progress.current);if(figure.current){figure.current.rotation.y=t*Math.PI*1.8;figure.current.position.y=.1+Math.sin(t*Math.PI)*.26}if(arms.current){arms.current.rotation.z=Math.sin(t*Math.PI)*.3;}});return <group ref={figure} position={[0,0,-85]}><mesh position={[0,1.1,0]}><sphereGeometry args={[.43,18,14]}/><meshStandardMaterial color="#cfbba7" roughness={.77}/></mesh><mesh position={[0,-.05,0]}><cylinderGeometry args={[.35,.23,1.85,20]}/><meshStandardMaterial color="#e2d6c5" roughness={.88}/></mesh><mesh position={[0,-1.05,0]}><cylinderGeometry args={[.9,.25,.67,32]}/><meshStandardMaterial color="#d7c8b3" roughness={.92} side={THREE.DoubleSide}/></mesh><group ref={arms}><Limb from={[-.28,.55,0]} to={[-.8,1.05,0]} r={.13}/><Limb from={[-.8,1.05,0]} to={[-1,1.7,0]} r={.10}/><Limb from={[.28,.55,0]} to={[.8,1.05,0]} r={.13}/><Limb from={[.8,1.05,0]} to={[1,1.7,0]} r={.10}/></group><Limb from={[-.22,-1.22,0]} to={[-.38,-2.45,.12]} r={.18}/><Limb from={[-.38,-2.45,.12]} to={[-.38,-3.35,.25]} r={.12}/><Limb from={[.22,-1.22,0]} to={[.4,-2.3,-.2]} r={.18}/><Limb from={[.4,-2.3,-.2]} to={[1.4,-2.3,-.15]} r={.11}/></group>}
function Ballet({progress}:{progress:React.MutableRefObject<number>}){return <group><Dancer progress={progress}/><mesh position={[0,-3.5,-85]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[12,64]}/><meshStandardMaterial color="#36271f" roughness={.74}/></mesh><mesh position={[0,-3.48,-85]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[4.7,4.75,100]}/><meshStandardMaterial color="#8b704d" roughness={.6}/></mesh><spotLight position={[-1,10,-81]} angle={.29} penumbra={.85} intensity={195} color="#ffdab0" distance={27}/><pointLight position={[4,1,-83]} intensity={12} color="#8a583e" distance={19}/></group>}
function Optics({progress}:{progress:React.MutableRefObject<number>}){const rings=useRef<THREE.Group>(null);useFrame(()=>{const t=smooth(.78,.95,progress.current);if(rings.current){rings.current.rotation.y=(t-.5)*.3;rings.current.rotation.z=t*.15}});return <group><group ref={rings}>{[0,1,2,3,4].map((i)=><group key={i} position={[Math.sin(i*1.7)*.65,.3,-110-i*3.4]}><mesh><torusGeometry args={[3.5-i*.27,.16,12,96]}/><meshStandardMaterial color={bronze} metalness={.7} roughness={.32}/></mesh><mesh><torusGeometry args={[3.18-i*.27,.035,8,96]}/><meshStandardMaterial color="#e4cc9d" metalness={.52} roughness={.4}/></mesh><mesh position={[0,-3.5,0]}><cylinderGeometry args={[.14,.2,2.8,12]}/><meshStandardMaterial color={bronze} roughness={.39} metalness={.5}/></mesh></group>)}</group><mesh position={[0,.3,-127]}><sphereGeometry args={[1.1,28,20]}/><meshPhysicalMaterial color="#9cae91" transmission={.5} roughness={.13} thickness={1} metalness={.04}/></mesh><pointLight position={[2,5,-118]} color="#a5b18b" intensity={62} distance={28}/></group>}

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

const palette=[new THREE.Color('#260e18'),new THREE.Color('#071b29'),new THREE.Color('#312217'),new THREE.Color('#251b17'),new THREE.Color('#0b2620'),new THREE.Color('#280e1a')];
function Atmosphere({progress}:{progress:React.MutableRefObject<number>}){const {scene}=useThree();const background=useMemo(()=>new THREE.Color(),[]);const fog=useMemo(()=>new THREE.Fog('#260e18',16,60),[]);useFrame(()=>{const t=progress.current;const keys=[0,.15,.37,.57,.76,.96];let i=0;while(i<keys.length-2&&t>keys[i+1])i++;const f=smooth(keys[i],keys[i+1],t);background.copy(palette[i]).lerp(palette[i+1],f);scene.background=background;fog.color.copy(background);scene.fog=fog});return null}
export default function Worlds({progress}:{progress:React.MutableRefObject<number>}){return <><Atmosphere progress={progress}/><ambientLight color="#caa68a" intensity={.7}/><directionalLight position={[-8,9,6]} intensity={1.1} color="#debd9d"/><CurtainIntro progress={progress}/><Ocean progress={progress}/><SilkAperture progress={progress}/><Access progress={progress}/><BronzeKeyhole progress={progress}/><Ballet progress={progress}/><BalletLensTransition progress={progress}/><Optics progress={progress}/></>}
