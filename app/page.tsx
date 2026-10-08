"use client";

import dynamic from 'next/dynamic';
const Experience = dynamic(()=>import('../components/Experience'),{ssr:false,loading:()=> <main className="static-loader"><div className="brand">GET MAISON <span>ÉTERNELLE</span></div><div className="loader-line" /></main>});
export default function Home(){return <Experience/>}
