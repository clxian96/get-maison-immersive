'use client';
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import Worlds from './Worlds';

type Chapter={id:string,eyebrow:string,title:string,subtitle:string};
const chapters:Chapter[]=[
{id:'intro',eyebrow:'GET MAISON ÉTERNELLE',title:'A World Within A World.',subtitle:'Privacy. Access. Confidence. Recognition.\nA place to belong.'},
{id:'more',eyebrow:'THE WORLD OF GET MAISON',title:'More Than A Place',subtitle:'A private world where people, ideas and extraordinary moments come together.'},
{id:'privacy',eyebrow:'01 / 04',title:'Privacy',subtitle:'The freedom to be entirely yourself.'},
{id:'access',eyebrow:'02 / 04',title:'Access',subtitle:'To experiences others don’t see.'},
{id:'confidence',eyebrow:'03 / 04',title:'Confidence',subtitle:'A quiet certainty that needs no audience.'},
{id:'recognition',eyebrow:'04 / 04',title:'Recognition',subtitle:'The ability to see what others overlook.'},
{id:'converge',eyebrow:'THE WORLD OF GET MAISON',title:'All four converge here.',subtitle:''},
{id:'end',eyebrow:'GET MAISON ÉTERNELLE',title:'A World Within A World.',subtitle:'For Those Who Already Belong.'}
];
const boundaries=[0,.13,.19,.37,.57,.765,.91,.965,1];
// Distinct camera choreography per world; all poses are pure functions of scroll progress.
// Coordinates are aligned with the procedural stage positions in Worlds.tsx.
type CameraKey={p:number;pos:[number,number,number];look:[number,number,number];fov:number};
const waypoints:CameraKey[]=[
 {p:0,pos:[0,0,13],look:[0,0,0],fov:57},
 {p:.055,pos:[0,0,9.2],look:[0,0,0],fov:53},
 {p:.11,pos:[0,0,2.1],look:[0,0,-18],fov:61},
 {p:.15,pos:[0,1.8,-12],look:[0,-.8,-25],fov:62},
 // PRIVACY — enter the Library of Silence, drift between shelves, approach the hero book, pass through its opening
 {p:.21,pos:[-1.8,1.25,-18],look:[0,.45,-25],fov:55},
 {p:.255,pos:[1.9,.65,-24.5],look:[0,.25,-31.5],fov:47},
 {p:.305,pos:[4.4,1.1,-31.2],look:[.2,.45,-36.6],fov:56},
 {p:.34,pos:[0,.7,-35.2],look:[0,.15,-40.0],fov:60},
 {p:.37,pos:[0,.25,-41.7],look:[0,0,-52],fov:57},
 // ACCESS — pull away, track sideways, dive through bronze keyhole
 {p:.405,pos:[-.5,.2,-45],look:[0,0,-52],fov:61},
 {p:.445,pos:[-3.8,1.1,-48],look:[0,0,-60],fov:56},
 {p:.49,pos:[1.5,.25,-58],look:[0,.1,-69],fov:51},
 {p:.535,pos:[0,0,-69.4],look:[0,0,-75],fov:48},
 {p:.57,pos:[0,0,-78],look:[0,0,-85],fov:60},
 // CONFIDENCE — pull back from silhouette, arc around her, through dance circle
 {p:.605,pos:[0,1,-78.5],look:[0,-.2,-85],fov:49},
 {p:.65,pos:[4.7,.8,-82],look:[0,-.4,-85],fov:50},
 {p:.7,pos:[-4.1,1.3,-82.6],look:[0,-.1,-85],fov:44},
 {p:.745,pos:[0,.3,-89],look:[0,0,-99],fov:55},
 {p:.765,pos:[0,0,-99],look:[0,0,-111],fov:57},
 // RECOGNITION — macro optical traversal then grand reverse reveal
 {p:.815,pos:[-1,.5,-107],look:[0,.2,-117],fov:49},
 {p:.85,pos:[0,.3,-117.1],look:[0,.3,-125],fov:39},
 {p:.89,pos:[.15,.3,-123.6],look:[0,.3,-127.5],fov:43},
 {p:.94,pos:[0,.1,-115],look:[0,.2,-126],fov:62},
 {p:1,pos:[0,0,-109],look:[0,.3,-127],fov:60}
];
const clamp01=(x:number)=>THREE.MathUtils.clamp(x,0,1);
// Non-stopping cubic Hermite motion: scroll positions match exactly, but the camera
// retains its velocity through intermediate waypoints instead of braking to zero.
function getPose(t:number){
 const v=THREE.MathUtils.clamp(t,0,1);
 let i=0;while(i<waypoints.length-2&&v>waypoints[i+1].p)i++;
 const a=waypoints[i],b=waypoints[i+1];
 const left=waypoints[Math.max(0,i-1)],right=waypoints[Math.min(waypoints.length-1,i+2)];
 const span=b.p-a.p;const u=clamp01((v-a.p)/span);
 const hermite=(a0:number,b0:number,prev:number,next:number)=>{
  const m0=(b0-prev)/(b.p-left.p||1)*span;
  const m1=(next-a0)/(right.p-a.p||1)*span;
  const u2=u*u,u3=u2*u;
  return (2*u3-3*u2+1)*a0+(u3-2*u2+u)*m0+(-2*u3+3*u2)*b0+(u3-u2)*m1;
 };
 const vector=(field:'pos'|'look')=>new THREE.Vector3(...([0,1,2].map(k=>hermite(a[field][k],b[field][k],left[field][k],right[field][k])) as [number,number,number]));
 return {pos:vector('pos'),look:vector('look'),fov:hermite(a.fov,b.fov,left.fov,right.fov)};
}
function CameraDirector({progress,mouse}:{progress:React.MutableRefObject<number>,mouse:React.MutableRefObject<{x:number,y:number}>}){
 const {camera}=useThree();const look=useRef(new THREE.Vector3(0,0,-20));
 useFrame((_,delta)=>{
  const pose=getPose(progress.current);
  const damping=1-Math.exp(-Math.min(delta,.06)*10.5);
  const pointerScale=.045;
  pose.pos.x+=mouse.current.x*pointerScale;
  pose.pos.y+=mouse.current.y*pointerScale*.5;
  camera.position.lerp(pose.pos,damping);
  look.current.lerp(pose.look,damping);
  camera.lookAt(look.current);
  if(camera instanceof THREE.PerspectiveCamera){
   const nextFov=THREE.MathUtils.lerp(camera.fov,pose.fov,damping);
   if(Math.abs(camera.fov-nextFov)>.001){camera.fov=nextFov;camera.updateProjectionMatrix();}
  }
 });return null;
}
function Scene({progress,mouse}:{progress:React.MutableRefObject<number>,mouse:React.MutableRefObject<{x:number,y:number}>}){return <Canvas camera={{position:[0,0,12],fov:56,near:.1,far:180}} dpr={[1,1.5]} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}} style={{position:'fixed',inset:0}}><Worlds progress={progress}/><CameraDirector progress={progress} mouse={mouse}/></Canvas>}
function opacity(t:number,start:number,end:number){const ramp=.022;return Math.max(0,Math.min(1,(t-start)/ramp,(end-t)/ramp));}
export default function Experience(){const progress=useRef(0),mouse=useRef({x:0,y:0});const [display,setDisplay]=useState({progress:0,chapter:0});const [ready,setReady]=useState(false);const [reduced,setReduced]=useState(false);const [gl,setGl]=useState(true);const last=useRef(0);
useEffect(()=>{setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);const sync=()=>{const extent=Math.max(1,document.documentElement.scrollHeight-innerHeight);const p=Math.min(1,Math.max(0,scrollY/extent));progress.current=p;const chapter=Math.min(chapters.length-1,boundaries.findIndex((v,i)=>i<boundaries.length-1&&p>=v&&p<boundaries[i+1])<0?chapters.length-1:boundaries.findIndex((v,i)=>i<boundaries.length-1&&p>=v&&p<boundaries[i+1]));const now=performance.now();if(now-last.current>16||chapter!==display.chapter){last.current=now;setDisplay({progress:p,chapter})}};const move=(e:PointerEvent)=>{mouse.current={x:(e.clientX/innerWidth-.5)*2,y:(e.clientY/innerHeight-.5)*2}};sync();window.addEventListener('scroll',sync,{passive:true});window.addEventListener('resize',sync);window.addEventListener('pointermove',move,{passive:true});const timer=window.setTimeout(()=>setReady(true),600);return()=>{window.removeEventListener('scroll',sync);window.removeEventListener('resize',sync);window.removeEventListener('pointermove',move);clearTimeout(timer)}},[]);
const active=display.chapter;return <><div className="scroll-track" aria-hidden="true"/><main className="visual-layer"><div className="vignette"/>{!reduced&&gl?<React.Suspense fallback={<div className="fallback-visual"/>}><Scene progress={progress} mouse={mouse}/></React.Suspense>:<div className="fallback-visual"/>}<div className="grain"/><header className="site-header"><div className="brand">GET MAISON <span>ÉTERNELLE</span></div><div className="header-note">A WORLD WITHIN A WORLD</div></header><div className="chapter-layer" aria-hidden="true">{chapters.map((chapter,i)=>{const start=boundaries[i],end=boundaries[i+1];const fade=Math.min(.025,(end-start)*.22);const visibility=Math.max(0,Math.min(1,i===0?1:(display.progress-start)/fade,i===chapters.length-1?1:(end-display.progress)/fade));const intro=i===0;const introP=clamp01(display.progress/.13);const textScale=intro?1+1.05*(introP*introP*(3-2*introP)):1;const mainFade=intro?1-(clamp01((introP-.54)/.37)**2*(3-2*clamp01((introP-.54)/.37))):1;const supportingFade=intro?1-clamp01((introP-.3)/.37):1;return <div key={chapter.id} className={`chapter-copy${intro?' intro-copy':''}`} style={{opacity:visibility*mainFade,transform:`translate(-50%,calc(-50% + ${(1-visibility)*10}px)) scale(${textScale})`}}><div className="chapter-eyebrow" style={intro?{opacity:supportingFade}:undefined}>{chapter.eyebrow}</div><h1>{chapter.title}</h1>{chapter.subtitle&&<p style={intro?{opacity:supportingFade}:undefined}>{chapter.subtitle}</p>}</div>})}</div><div className="bottom-left">{active===0?'SCROLL TO ENTER':active===7?'FOR THOSE WHO ALREADY BELONG.':'A WORLD WITHIN A WORLD.'}</div><div className="bottom-right">{String(active+1).padStart(2,'0')} <span>/ 08</span></div><div className="progress-track"><div className="progress-fill" style={{transform:`scaleY(${display.progress})`}}/></div><div className="scroll-mark" aria-hidden="true"/><div className="sr-only"><h2>The World of Get Maison</h2><p>Different People. A Shared World.</p>{chapters.map(c=><section key={c.id}><h3>{c.title}</h3><p>{c.subtitle}</p></section>)}<section><h3>From the Maison — Stories</h3><p>A vintage worth waiting for. On a single bottle, the year it was made, and the long road it took to arrive at the Maison.</p><p>The making of a quiet chair. Where the piece began, who shaped it, and why it found its place in the Lounge.</p><p>The art of arriving. On the small rituals that open every evening at the Maison, long before the first guest walks in.</p></section></div></main>{!ready&&<div className="preloader"><div className="brand">GET MAISON <span>ÉTERNELLE</span></div><div className="loading-rule"/></div>}</>}
