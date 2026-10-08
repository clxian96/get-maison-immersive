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
function SeaSilk({progress}:{progress:React.MutableRefObject<number>}){
 const geo=useMemo(()=>new THREE.PlaneGeometry(6.5,11,45,90),[]);const mesh=useRef<THREE.Mesh>(null);
 useFrame((s)=>{if(!mesh.current)return;const p=geo.attributes.position,elapsed=s.clock.elapsedTime,t=progress.current;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,Math.sin(y*.8+elapsed*.55+x*.3)*.65+Math.cos(x*1.3+elapsed*.3)*.27);p.setX(i,x+Math.sin(y*.32+elapsed*.2)*.48);}p.needsUpdate=true;geo.computeVertexNormals();mesh.current.rotation.y=.25+smooth(.2,.36,t)*.45;});
 return <mesh ref={mesh} geometry={geo} position={[1,-.1,-25]} rotation={[.2,.3,-.2]}><meshPhysicalMaterial color="#8aaca7" side={THREE.DoubleSide} transparent opacity={.48} roughness={.48} metalness={.05} depthWrite={false}/></mesh>
}
function SeaDust(){const geo=useMemo(()=>{const n=320,g=new THREE.BufferGeometry(),a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=Math.sin(i*8.12)*14;a[i*3+1]=Math.cos(i*3.72)*9;a[i*3+2]=-13-(i%67)*.55;}g.setAttribute('position',new THREE.BufferAttribute(a,3));return g},[]);return <points geometry={geo}><pointsMaterial color="#8daead" transparent opacity={.24} size={.045} sizeAttenuation depthWrite={false}/></points>}
function Ocean({progress}:{progress:React.MutableRefObject<number>}){return <group><SeaDust/><SeaSilk progress={progress}/><mesh position={[0,12,-26]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[95,85]}/><meshStandardMaterial color="#123d45" roughness={.35} transparent opacity={.36}/></mesh><spotLight position={[4,11,-24]} angle={.47} penumbra={1} intensity={120} distance={34} color="#6496a7"/><pointLight position={[-5,1,-28]} intensity={22} color="#477d89" distance={26}/></group>}
function Arch({z,x=0,scale=1}:{z:number,x?:number,scale?:number}){const shape=useMemo(()=>{let s=new THREE.Shape();s.moveTo(-3.3,-4);s.lineTo(-3.3,1);s.absarc(0,1,3.3,Math.PI,0,true);s.lineTo(3.3,-4);s.lineTo(2.35,-4);s.lineTo(2.35,1);s.absarc(0,1,2.35,0,Math.PI,false);s.lineTo(-2.35,-4);s.closePath();return s},[]);return <group position={[x,0,z]} scale={scale}><mesh><extrudeGeometry args={[shape,{depth:1,bevelEnabled:true,bevelSize:.09,bevelThickness:.09,bevelSegments:2,curveSegments:24}]}/><meshStandardMaterial color={stone} roughness={.94}/></mesh><mesh position={[0,1,.98]}><torusGeometry args={[2.81,.042,8,90,Math.PI]}/><meshStandardMaterial color={bronze} metalness={.7} roughness={.4}/></mesh><mesh position={[0,-3.95,.8]}><boxGeometry args={[7.2,.16,1.9]}/><meshStandardMaterial color="#79583a" roughness={.56} metalness={.3}/></mesh></group>}
function Access({progress}:{progress:React.MutableRefObject<number>}){const doorL=useRef<THREE.Group>(null),doorR=useRef<THREE.Group>(null);useFrame(()=>{const t=smooth(.43,.53,progress.current);if(doorL.current)doorL.current.rotation.y=-t*1.25;if(doorR.current)doorR.current.rotation.y=t*1.25});return <group><Arch z={-52}/><Arch z={-60} x={1} scale={.92}/><Arch z={-68} x={-.7} scale={.8}/><group position={[0,0,-51]}><group ref={doorL} position={[-2.15,0,.45]}><mesh position={[1.05,-.6,0]}><boxGeometry args={[2.1,7.3,.16]}/><meshStandardMaterial color="#593e2c" metalness={.25} roughness={.68}/></mesh></group><group ref={doorR} position={[2.15,0,.45]}><mesh position={[-1.05,-.6,0]}><boxGeometry args={[2.1,7.3,.16]}/><meshStandardMaterial color="#593e2c" metalness={.25} roughness={.68}/></mesh></group></group><mesh position={[0,-4,-59]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[27,34]}/><meshStandardMaterial color="#34261e" roughness={.93}/></mesh><pointLight position={[3,3,-62]} color="#ebb879" intensity={90} distance={29}/></group>}
function Limb({from,to,r=.14,color='#d7c3ad'}:{from:[number,number,number],to:[number,number,number],r?:number,color?:string}){const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),mid=a.clone().add(b).multiplyScalar(.5),len=a.distanceTo(b),rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());return <mesh position={mid.toArray()} quaternion={rotation}><cylinderGeometry args={[r*.8,r,len,10]}/><meshStandardMaterial color={color} roughness={.7}/></mesh>}
function Dancer({progress}:{progress:React.MutableRefObject<number>}){const figure=useRef<THREE.Group>(null),arms=useRef<THREE.Group>(null);useFrame(()=>{const t=smooth(.62,.755,progress.current);if(figure.current){figure.current.rotation.y=t*Math.PI*1.8;figure.current.position.y=.1+Math.sin(t*Math.PI)*.26}if(arms.current){arms.current.rotation.z=Math.sin(t*Math.PI)*.3;}});return <group ref={figure} position={[0,0,-85]}><mesh position={[0,1.1,0]}><sphereGeometry args={[.43,18,14]}/><meshStandardMaterial color="#cfbba7" roughness={.77}/></mesh><mesh position={[0,-.05,0]}><cylinderGeometry args={[.35,.23,1.85,20]}/><meshStandardMaterial color="#e2d6c5" roughness={.88}/></mesh><mesh position={[0,-1.05,0]}><cylinderGeometry args={[.9,.25,.67,32]}/><meshStandardMaterial color="#d7c8b3" roughness={.92} side={THREE.DoubleSide}/></mesh><group ref={arms}><Limb from={[-.28,.55,0]} to={[-.8,1.05,0]} r={.13}/><Limb from={[-.8,1.05,0]} to={[-1,1.7,0]} r={.10}/><Limb from={[.28,.55,0]} to={[.8,1.05,0]} r={.13}/><Limb from={[.8,1.05,0]} to={[1,1.7,0]} r={.10}/></group><Limb from={[-.22,-1.22,0]} to={[-.38,-2.45,.12]} r={.18}/><Limb from={[-.38,-2.45,.12]} to={[-.38,-3.35,.25]} r={.12}/><Limb from={[.22,-1.22,0]} to={[.4,-2.3,-.2]} r={.18}/><Limb from={[.4,-2.3,-.2]} to={[1.4,-2.3,-.15]} r={.11}/></group>}
function Ballet({progress}:{progress:React.MutableRefObject<number>}){return <group><Dancer progress={progress}/><mesh position={[0,-3.5,-85]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[12,64]}/><meshStandardMaterial color="#36271f" roughness={.74}/></mesh><mesh position={[0,-3.48,-85]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[4.7,4.75,100]}/><meshStandardMaterial color="#8b704d" roughness={.6}/></mesh><spotLight position={[-1,10,-81]} angle={.29} penumbra={.85} intensity={195} color="#ffdab0" distance={27}/><pointLight position={[4,1,-83]} intensity={12} color="#8a583e" distance={19}/></group>}
function Optics({progress}:{progress:React.MutableRefObject<number>}){const rings=useRef<THREE.Group>(null);useFrame(()=>{const t=smooth(.78,.95,progress.current);if(rings.current){rings.current.rotation.y=(t-.5)*.3;rings.current.rotation.z=t*.15}});return <group><group ref={rings}>{[0,1,2,3,4].map((i)=><group key={i} position={[Math.sin(i*1.7)*.65,.3,-110-i*3.4]}><mesh><torusGeometry args={[3.5-i*.27,.16,12,96]}/><meshStandardMaterial color={bronze} metalness={.7} roughness={.32}/></mesh><mesh><torusGeometry args={[3.18-i*.27,.035,8,96]}/><meshStandardMaterial color="#e4cc9d" metalness={.52} roughness={.4}/></mesh><mesh position={[0,-3.5,0]}><cylinderGeometry args={[.14,.2,2.8,12]}/><meshStandardMaterial color={bronze} roughness={.39} metalness={.5}/></mesh></group>)}</group><mesh position={[0,.3,-127]}><sphereGeometry args={[1.1,28,20]}/><meshPhysicalMaterial color="#9cae91" transmission={.5} roughness={.13} thickness={1} metalness={.04}/></mesh><pointLight position={[2,5,-118]} color="#a5b18b" intensity={62} distance={28}/></group>}
const palette=[new THREE.Color('#260e18'),new THREE.Color('#071b29'),new THREE.Color('#312217'),new THREE.Color('#251b17'),new THREE.Color('#0b2620'),new THREE.Color('#280e1a')];
function Atmosphere({progress}:{progress:React.MutableRefObject<number>}){const {scene}=useThree();const background=useMemo(()=>new THREE.Color(),[]);const fog=useMemo(()=>new THREE.Fog('#260e18',16,60),[]);useFrame(()=>{const t=progress.current;const keys=[0,.15,.37,.57,.76,.96];let i=0;while(i<keys.length-2&&t>keys[i+1])i++;const f=smooth(keys[i],keys[i+1],t);background.copy(palette[i]).lerp(palette[i+1],f);scene.background=background;fog.color.copy(background);scene.fog=fog});return null}
export default function Worlds({progress}:{progress:React.MutableRefObject<number>}){return <><Atmosphere progress={progress}/><ambientLight color="#caa68a" intensity={.7}/><directionalLight position={[-8,9,6]} intensity={1.1} color="#debd9d"/><CurtainIntro progress={progress}/><Ocean progress={progress}/><Access progress={progress}/><Ballet progress={progress}/><Optics progress={progress}/></>}
