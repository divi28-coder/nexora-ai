import { z } from 'zod';
export const resumeInput = z.object({ text: z.string().min(20).max(30000) });
export const jobMatchInput = z.object({ resumeText: z.string().min(20).max(30000).optional(), jobText: z.string().min(20).max(20000) });
export const questionInput = z.object({
  role: z.string().min(2).max(80),
  category: z.enum(['HR', 'Behavioral', 'Technical', 'Project']),
  count: z.number().int().min(1).max(10).default(5),
  resumeText: z.string().max(30000).optional(),
  jobText: z.string().max(20000).optional()
});
export const assistantInput = z.object({ message: z.string().min(1).max(4000), simpleEnglish: z.boolean().optional() });
export const answerInput = z.object({ question: z.string().min(1).max(1000), answer: z.string().min(1).max(8000), category: z.string().max(40).optional(), sessionId: z.string().max(40).optional() });

export const resumeAnalysisOutput = z.object({
  isEstimate: z.literal(true),
  health: z.number().min(0).max(100),
  findings: z.array(z.object({
    identified: z.string(), whyItMatters: z.string(), suggestion: z.string(),
    evidence: z.string(), needsUserConfirmation: z.boolean()
  }))
});
export type ResumeAnalysis = z.infer<typeof resumeAnalysisOutput>;
