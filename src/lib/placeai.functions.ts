import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getGatewayModel } from "./ai-gateway.server";

// ---------- Resume analysis ----------
const ResumeAnalysisSchema = z.object({
  atsScore: z.number(),
  summary: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  skillsFound: z.array(z.string()),
  skillsMissing: z.array(z.string()),
});
export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { content: string; targetRole?: string }) =>
    z.object({ content: z.string().min(30), targetRole: z.string().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const model = getGatewayModel(true);
    const prompt = `You are an expert resume reviewer and ATS system.
Analyze the following resume${data.targetRole ? ` for a "${data.targetRole}" role` : ""}.

Return:
- atsScore (0-100): how well the resume passes automated screening
- summary: 2 concise sentences
- strengths: 3-5 key strengths (short phrases)
- improvements: 3-5 specific improvements (short phrases)
- skillsFound: all technical/professional skills detected
- skillsMissing: 3-6 important skills to add for the target role

Resume:
"""
${data.content}
"""`;
    let analysis: ResumeAnalysis;
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: ResumeAnalysisSchema }),
        prompt,
      });
      analysis = output;
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) {
        try { analysis = ResumeAnalysisSchema.parse(JSON.parse((e as any).text ?? "{}")); }
        catch { throw new Error("AI response could not be parsed. Please try again."); }
      } else throw e;
    }

    // Save/upsert resume
    const { data: existing } = await context.supabase
      .from("resumes").select("id").eq("user_id", context.userId)
      .order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (existing) {
      await context.supabase.from("resumes").update({
        content: data.content, analysis: analysis as any, updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await context.supabase.from("resumes").insert({
        user_id: context.userId, content: data.content, analysis: analysis as any,
      });
    }

    // Sync detected skills into profile
    await context.supabase.from("profiles").update({
      skills: analysis.skillsFound,
      ...(data.targetRole ? { target_role: data.targetRole } : {}),
    }).eq("id", context.userId);

    return analysis;
  });

// ---------- Job match ----------
const JobMatchSchema = z.object({
  fitPercentage: z.number(),
  whyGoodFit: z.string(),
  skillGaps: z.array(z.string()),
  strengths: z.array(z.string()),
  salaryNegotiation: z.string(),
  readinessMonths: z.number(),
});
export type JobMatch = z.infer<typeof JobMatchSchema>;

export const matchJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { jobId: string }) => z.object({ jobId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<JobMatch> => {
    const [{ data: job }, { data: profile }, { data: resume }] = await Promise.all([
      context.supabase.from("jobs").select("*").eq("id", data.jobId).single(),
      context.supabase.from("profiles").select("*").eq("id", context.userId).single(),
      context.supabase.from("resumes").select("content").eq("user_id", context.userId)
        .order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (!job) throw new Error("Job not found");

    const prompt = `You are a career advisor. Score the fit between the candidate and the job.

Candidate skills: ${(profile?.skills ?? []).join(", ") || "unknown"}
Target role: ${profile?.target_role ?? "unspecified"}
Experience: ${profile?.experience ?? "entry-level"}
Resume excerpt: ${(resume?.content ?? "").slice(0, 1500)}

Job:
- Company: ${job.company}
- Role: ${job.role}
- Required skills: ${job.skills.join(", ")}
- Description: ${job.description}

Return:
- fitPercentage 0-100
- whyGoodFit (2 sentences)
- skillGaps (2-4 short items)
- strengths (2-4 short items)
- salaryNegotiation (1-2 sentence tactical tip)
- readinessMonths: months of prep needed to be a strong candidate (0-12)`;

    const model = getGatewayModel(true);
    try {
      const { output } = await generateText({
        model, output: Output.object({ schema: JobMatchSchema }), prompt,
      });
      return output;
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) {
        try { return JobMatchSchema.parse(JSON.parse((e as any).text ?? "{}")); }
        catch { throw new Error("AI response could not be parsed."); }
      }
      throw e;
    }
  });

// ---------- Interview questions ----------
const InterviewQuestionsSchema = z.object({
  questions: z.array(z.object({
    id: z.number(),
    question: z.string(),
    type: z.string(),
    difficulty: z.string(),
  })),
});

export const generateInterviewQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetRole: string }) =>
    z.object({ targetRole: z.string().min(2) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles").select("skills, experience").eq("id", context.userId).single();
    const prompt = `Generate 5 realistic interview questions for a "${data.targetRole}" role.
Candidate skills: ${(profile?.skills ?? []).join(", ") || "unspecified"}
Experience: ${profile?.experience ?? "entry-level"}
Mix behavioral and technical. Difficulty: easy | medium | hard. Type: behavioral | technical.
IDs must be 1..5.`;
    const model = getGatewayModel(true);
    const { output } = await generateText({
      model, output: Output.object({ schema: InterviewQuestionsSchema }), prompt,
    });
    return output.questions.slice(0, 5);
  });

// ---------- Evaluate answer ----------
const EvalSchema = z.object({
  score: z.number(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  betterAnswer: z.string(),
  keyTakeaway: z.string(),
});
export type Evaluation = z.infer<typeof EvalSchema>;

export const evaluateAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { question: string; answer: string; targetRole: string; questionType?: string }) =>
    z.object({
      question: z.string().min(3), answer: z.string().min(3),
      targetRole: z.string().min(2), questionType: z.string().optional(),
    }).parse(d))
  .handler(async ({ data, context }): Promise<Evaluation> => {
    const prompt = `Evaluate this interview answer for a "${data.targetRole}" role.

Question: ${data.question}

Candidate's answer:
"""
${data.answer}
"""

Return:
- score 0-100
- strengths (2-3 short items)
- improvements (2-3 short items)
- betterAnswer: 3-5 sentence improved answer
- keyTakeaway: single-sentence tip`;
    const model = getGatewayModel(true);
    const { output } = await generateText({
      model, output: Output.object({ schema: EvalSchema }), prompt,
    });
    await context.supabase.from("interview_sessions").insert({
      user_id: context.userId, target_role: data.targetRole,
      question: data.question, question_type: data.questionType ?? null,
      answer: data.answer, evaluation: output as any,
    });
    return output;
  });

// ---------- Roadmap ----------
const RoadmapSchema = z.object({
  targetRole: z.string(),
  readinessMonths: z.number(),
  skillsToLearn: z.array(z.object({
    name: z.string(),
    priority: z.string(),
    weeks: z.number(),
    resources: z.array(z.string()),
    project: z.string(),
  })),
  milestones: z.array(z.object({
    period: z.string(),
    focus: z.string(),
    outcome: z.string(),
  })),
});
export type Roadmap = z.infer<typeof RoadmapSchema>;

export const generateRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetRole: string }) =>
    z.object({ targetRole: z.string().min(2) }).parse(d))
  .handler(async ({ data, context }): Promise<Roadmap> => {
    const { data: profile } = await context.supabase
      .from("profiles").select("skills, experience").eq("id", context.userId).single();
    const prompt = `Create a personalized 90-day upskilling roadmap for a candidate targeting "${data.targetRole}".

Current skills: ${(profile?.skills ?? []).join(", ") || "unspecified"}
Experience: ${profile?.experience ?? "entry-level"}

Return:
- targetRole (echo the role)
- readinessMonths: honest estimate to be job-ready (1-6)
- skillsToLearn: 4-6 items, each with { name, priority: high|medium|low, weeks (1-8), resources (2-3 course/book names or URLs), project: one mini-project idea }
- milestones: exactly 3 items for periods "Days 1-30", "Days 31-60", "Days 61-90" with focus + measurable outcome.`;
    const model = getGatewayModel(true);
    const { output } = await generateText({
      model, output: Output.object({ schema: RoadmapSchema }), prompt,
    });
    await context.supabase.from("roadmaps").insert({
      user_id: context.userId, target_role: data.targetRole, plan: output as any,
    });
    return output;
  });

// ---------- Dashboard summary ----------
export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: resume }, { count: interviewCount }, { data: roadmap }] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).single(),
      context.supabase.from("resumes").select("analysis, updated_at").eq("user_id", context.userId)
        .order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      context.supabase.from("interview_sessions").select("*", { count: "exact", head: true })
        .eq("user_id", context.userId),
      context.supabase.from("roadmaps").select("plan, created_at").eq("user_id", context.userId)
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    return { profile, resume, interviewCount: interviewCount ?? 0, roadmap };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { full_name?: string; target_role?: string; experience?: string }) =>
    z.object({
      full_name: z.string().optional(),
      target_role: z.string().optional(),
      experience: z.string().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("profiles")
      .update(data).eq("id", context.userId).select().single();
    if (error) throw error;
    return row;
  });
