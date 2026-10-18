"use client";
import { useState } from "react";
const SAMPLE="Sample resume (fictional). Developed a student management system using Python and MySQL. Skills: Python, SQL. Education: B.E. Computer Science.";
export default function Demo(){const[r,setR]=useState<any>(null);const[err,setErr]=useState("");
async function run(){setErr("");const res=await fetch("/api/resume/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:SAMPLE})});const j=await res.json();res.ok?setR(j):setErr(j.error)}
return <main className="mx-auto max-w-3xl p-8"><h1 className="text-3xl font-bold">Resume demo</h1>
<p className="mt-2" style={{color:"var(--muted)"}}>Sample data only. Mode: deterministic demo analysis.</p>
<pre className="panel mt-4 whitespace-pre-wrap text-sm">{SAMPLE}</pre>
<button onClick={run} className="mt-4 rounded-xl bg-violet px-5 py-2 font-semibold">Analyze sample resume</button>
{err&&<p role="alert" className="mt-3 text-danger">{err}</p>}
{r&&<section className="panel mt-4"><p>Estimated health: <b>{r.overall}/100</b> ({r.mode} mode, not an ATS score)</p>
<ul className="mt-3 space-y-3">{r.findings.map((f:any,i:number)=><li key={i}><b>{f.identified}</b><br/>Why: {f.why}<br/>Try: {f.suggestion}<br/><small>Evidence: {f.evidence}{f.needsUserConfirmation&&" · needs your confirmation"}</small></li>)}</ul></section>}</main>}
