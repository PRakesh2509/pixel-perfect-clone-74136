import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzeResume, getDashboardData } from "@/lib/placeai.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";
import { extractTextFromFile } from "@/lib/parse-file";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({ meta: [{ title: "Resume Analyzer — PlaceAI" }] }),
  component: ResumePage,
});

function ResumePage() {
  const analyzeFn = useServerFn(analyzeResume);
  const getData = useServerFn(getDashboardData);
  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: () => getData() });
  const [content, setContent] = useState("");
  const [role, setRole] = useState("");
  useEffect(() => {
    if (dash?.profile?.target_role) setRole(dash.profile.target_role);
  }, [dash]);

  const mutation = useMutation({
    mutationFn: async () => analyzeFn({ data: { content, targetRole: role || undefined } }),
    onSuccess: () => toast.success("Resume analyzed"),
    onError: (e: Error) => toast.error(e.message),
  });

  const analysis = mutation.data ?? (dash?.resume?.analysis as any);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Resume Analyzer</h1>
        <p className="mt-1 text-muted-foreground">Paste your resume. Get an ATS score, gaps, and next steps.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your resume</CardTitle>
            <CardDescription>Upload a file (.pdf, .docx, .txt) or paste plain text.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target role (optional)</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Backend Engineer" />
            </div>
            <FileUploadRow onText={setContent} />
            <div className="space-y-2">
              <Label>Resume content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your resume text here, or upload a file above…"
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || content.length < 30}>
              <Sparkles className="size-4" /> {mutation.isPending ? "Analyzing…" : "Analyze with AI"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-24 lg:self-start">
          <CardHeader>
            <CardTitle>AI analysis</CardTitle>
            <CardDescription>{analysis ? "Personalized for your target role." : "Results appear here."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!analysis && <div className="grid h-64 place-items-center text-sm text-muted-foreground">No analysis yet.</div>}
            {analysis && (
              <>
                <div>
                  <div className="flex items-baseline gap-2">
                    <div className="font-display text-5xl font-semibold">{analysis.atsScore}</div>
                    <div className="text-sm text-muted-foreground">/100 ATS score</div>
                  </div>
                  <Progress value={analysis.atsScore} className="mt-3" />
                  <p className="mt-3 text-sm text-muted-foreground">{analysis.summary}</p>
                </div>

                <Section title="Strengths" icon={<CheckCircle2 className="size-4 text-brand" />}>
                  <ul className="space-y-1.5 text-sm">
                    {analysis.strengths.map((s: string) => <li key={s}>• {s}</li>)}
                  </ul>
                </Section>

                <Section title="Improvements" icon={<AlertCircle className="size-4 text-warning" />}>
                  <ul className="space-y-1.5 text-sm">
                    {analysis.improvements.map((s: string) => <li key={s}>• {s}</li>)}
                  </ul>
                </Section>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-2 text-sm font-medium">Skills found</div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.skillsFound.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-medium">Skills to add</div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.skillsMissing.map((s: string) => <Badge key={s} className="bg-brand text-brand-foreground">{s}</Badge>)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">{icon}{title}</div>
      {children}
    </div>
  );
}
