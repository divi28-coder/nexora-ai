
import { z } from "zod";
export const ResumeAnalysisSchema=z.object({overall:z.number().min(0).max(100),isEstimate:z.literal(true),mode:z.enum(["demo","live"]),
findings:z.array(z.object({identified:z.string(),why:z.string(),suggestion:z.string(),evidence:z.string(),needsUserConfirmation:z.boolean()}))});
export type ResumeAnalysis=z.infer<typeof ResumeAnalysisSchema>;
export const AnalyzeInput=z.object({text:z.string().min(50).max(20000)});
