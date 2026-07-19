import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateInterviewQuestions, evaluateAnswer, getDashboardData, type Evaluation } from "@/lib/placeai.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({ meta: [{ title: "Interview Prep — PlaceAI" }] }),
  component: InterviewPage,
});

type Q = { id: number; question: string; type: string; difficulty: string };

function InterviewPage() {
  const genFn = useServerFn(generateInterviewQuestions);
  const evalFn = useServerFn(evaluateAnswer);
  const getData = useServerFn(getDashboardData);
  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: () => getData() });

  const [role, setRole] = useState("");
  useEffect(() => { if (dash?.profile?.target_role) setRole(dash.profile.target_role); }, [dash]);

  const [questions, setQuestions] = useState<Q[]>([]);
  const [active, setActive] = useState<Q | null>(null);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const gen = useMutation({
    mutationFn: async () => genFn({ data: { targetRole: role } }),
    onSuccess: (qs) => { setQuestions(qs as Q[]); setActive(null); setEvaluation(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const evalM = useMutation({
    mutationFn: async () => evalFn({ data: { question: active!.question, answer, targetRole: role, questionType: active!.type } }),
    onSuccess: (r) => setEvaluation(r),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Interview Prep</h1>
        <p className="mt-1 text-muted-foreground">AI-personalized questions, honest feedback on every answer.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label>Target role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Data Analyst" />
          </div>
          <Button onClick={() => gen.mutate()} disabled={gen.isPending || role.length < 2}>
            <Sparkles className="size-4" /> {gen.isPending ? "Generating…" : "Generate 5 questions"}
          </Button>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {questions.map((q) => (
              <button
                key={q.id}
                onClick={() => { setActive(q); setAnswer(""); setEvaluation(null); }}
                className={`w-full rounded-lg border p-4 text-left transition-all hover:border-brand ${
                  active?.id === q.id ? "border-brand bg-accent/40" : "bg-card"
                }`}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge variant="secondary">{q.type}</Badge>
                  <Badge variant="outline">{q.difficulty}</Badge>
                </div>
                <div className="text-sm font-medium">{q.question}</div>
              </button>
            ))}
          </div>

          <Card className="lg:sticky lg:top-24 lg:self-start">
            <CardHeader>
              <CardTitle>{active ? "Your answer" : "Pick a question"}</CardTitle>
              <CardDescription>{active ? active.question : "Select one from the left."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {active && (
                <>
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer as you would speak it…"
                    className="min-h-[200px]"
                  />
                  <Button onClick={() => evalM.mutate()} disabled={evalM.isPending || answer.length < 10}>
                    {evalM.isPending ? "Evaluating…" : "Evaluate answer"}
                  </Button>
                </>
              )}
              {evaluation && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <div className="font-display text-4xl font-semibold">{evaluation.score}</div>
                      <div className="text-sm text-muted-foreground">/100</div>
                    </div>
                    <Progress value={evaluation.score} className="mt-2" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Strengths</div>
                      <ul className="space-y-1 text-sm">{evaluation.strengths.map((s) => <li key={s}>• {s}</li>)}</ul>
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Improvements</div>
                      <ul className="space-y-1 text-sm">{evaluation.improvements.map((s) => <li key={s}>• {s}</li>)}</ul>
                    </div>
                  </div>
                  <div className="rounded-md border bg-accent/40 p-3">
                    <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Model answer</div>
                    <p className="text-sm">{evaluation.betterAnswer}</p>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Key takeaway: </span>
                    <span className="text-muted-foreground">{evaluation.keyTakeaway}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
