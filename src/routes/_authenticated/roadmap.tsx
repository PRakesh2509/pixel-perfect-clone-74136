import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateRoadmap, getDashboardData, type Roadmap } from "@/lib/placeai.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Rocket, Target, Trophy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({ meta: [{ title: "90-Day Roadmap — PlaceAI" }] }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const getData = useServerFn(getDashboardData);
  const genFn = useServerFn(generateRoadmap);
  const { data: dash } = useQuery({ queryKey: ["dashboard"], queryFn: () => getData() });
  const [role, setRole] = useState("");
  useEffect(() => { if (dash?.profile?.target_role) setRole(dash.profile.target_role); }, [dash]);

  const mutation = useMutation({
    mutationFn: async () => genFn({ data: { targetRole: role } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const plan: Roadmap | null = (mutation.data as Roadmap) ?? (dash?.roadmap?.plan as Roadmap) ?? null;

  const milestoneIcons = [Rocket, Target, Trophy];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">90-Day Roadmap</h1>
        <p className="mt-1 text-muted-foreground">A concrete, week-by-week plan to close your gaps.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label>Target role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. ML Engineer" />
          </div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || role.length < 2}>
            <Sparkles className="size-4" /> {mutation.isPending ? "Planning…" : plan ? "Regenerate plan" : "Generate plan"}
          </Button>
        </CardContent>
      </Card>

      {plan && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Path to {plan.targetRole}</CardTitle>
              <CardDescription>Estimated readiness: {plan.readinessMonths} month{plan.readinessMonths === 1 ? "" : "s"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {plan.milestones.map((m, i) => {
                  const Icon = milestoneIcons[i] ?? Target;
                  return (
                    <div key={m.period} className="rounded-lg border p-4">
                      <span className="mb-3 grid size-9 place-items-center rounded-md bg-brand text-brand-foreground">
                        <Icon className="size-4" />
                      </span>
                      <div className="text-xs font-medium uppercase text-muted-foreground">{m.period}</div>
                      <div className="mt-1 font-semibold">{m.focus}</div>
                      <p className="mt-1.5 text-sm text-muted-foreground">{m.outcome}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {plan.skillsToLearn.map((s) => (
              <Card key={s.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{s.name}</CardTitle>
                    <Badge variant={s.priority === "high" ? "default" : "secondary"}>{s.priority}</Badge>
                  </div>
                  <CardDescription>~{s.weeks} week{s.weeks === 1 ? "" : "s"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Resources</div>
                    <ul className="space-y-1 text-sm">{s.resources.map((r) => <li key={r}>• {r}</li>)}</ul>
                  </div>
                  <div className="rounded-md border bg-accent/40 p-3">
                    <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Mini-project</div>
                    <p className="text-sm">{s.project}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
