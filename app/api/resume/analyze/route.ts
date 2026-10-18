import { NextResponse } from "next/server";
import { AnalyzeInput } from "@/lib/validation/resume";
import { analyzeResume } from "@/lib/ai/provider";
export async function POST(req:Request){
 const p=AnalyzeInput.safeParse(await req.json().catch(()=>null));
 if(!p.success)return NextResponse.json({error:"Provide resume text (50-20000 chars)."},{status:400});
 try{return NextResponse.json(await analyzeResume(p.data.text));}
 catch{return NextResponse.json({error:"Analysis unavailable."},{status:503});}}
