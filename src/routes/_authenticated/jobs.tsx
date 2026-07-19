import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { matchJob } from "@/lib/placeai.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, IndianRupee, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/jobs")({
  head: () => ({ meta: [{ title: "Job Matcher — PlaceAI" }] }),
  component: JobsPage,
});

type Job = {
  id: string; company: string; role: string; location: string | null;
  salary: string | null; skills: string[]; description: string;
};

function JobsPage() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").order("company");
      if (error) throw error;
      return data as Job[];
    },
  });
  const matchFn = useServerFn(matchJob);
  const [open, setOpen] = useState<Job | null>(null);

  const mutation = useMutation({
    mutationFn: async (jobId: string) => matchFn({ data: { jobId } }),
    onError: (e: Error) => toast.error(e.message),
  });

  function onMatch(job: Job) {
    setOpen(job);
    mutation.reset();
    mutation.mutate(job.id);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Job Matcher</h1>
        <p className="mt-1 text-muted-foreground">AI scores your fit against real roles.</p>
      </div>

      {isLoading && <div className="text-muted-foreground">Loading jobs…</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {jobs?.map((job) => (
          <Card key={job.id} className="transition-all hover:shadow-[var(--shadow-card)]">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{job.role}</CardTitle>
                  <CardDescription className="mt-0.5 font-medium text-foreground">{job.company}</CardDescription>
                </div>
                <Button size="sm" onClick={() => onMatch(job)}>
                  <Sparkles className="size-4" /> Match
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{job.description}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {job.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{job.location}</span>}
                {job.salary && <span className="inline-flex items-center gap-1"><IndianRupee className="size-3.5" />{job.salary}</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{open?.role}</DialogTitle>
            <DialogDescription>{open?.company}</DialogDescription>
          </DialogHeader>
          {mutation.isPending && <div className="py-12 text-center text-muted-foreground">Analyzing your fit…</div>}
          {mutation.data && (
            <div className="space-y-5">
              <div>
                <div className="flex items-baseline gap-2">
                  <div className="font-display text-4xl font-semibold">{mutation.data.fitPercentage}%</div>
                  <div className="text-sm text-muted-foreground">fit</div>
                </div>
                <Progress value={mutation.data.fitPercentage} className="mt-2" />
              </div>
              <p className="text-sm">{mutation.data.whyGoodFit}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 text-xs font-medium uppercase text-muted-foreground">Strengths</div>
                  <ul className="space-y-1 text-sm">{mutation.data.strengths.map((s) => <li key={s}>• {s}</li>)}</ul>
                </div>
                <div>
                  <div className="mb-1.5 text-xs font-medium uppercase text-muted-foreground">Skill gaps</div>
                  <ul className="space-y-1 text-sm">{mutation.data.skillGaps.map((s) => <li key={s}>• {s}</li>)}</ul>
                </div>
              </div>
              <div className="rounded-md border bg-accent/40 p-3 text-sm">
                <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">Salary negotiation</div>
                {mutation.data.salaryNegotiation}
              </div>
              <div className="text-sm text-muted-foreground">
                Est. readiness: <span className="font-medium text-foreground">{mutation.data.readinessMonths} months</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
