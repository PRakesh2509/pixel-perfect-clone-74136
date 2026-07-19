import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getDashboardData, updateProfile } from "@/lib/placeai.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileText, Briefcase, Mic, Map, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PlaceAI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const getData = useServerFn(getDashboardData);
  const updateFn = useServerFn(updateProfile);
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getData(),
  });

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [exp, setExp] = useState("");
  useEffect(() => {
    if (data?.profile) {
      setName(data.profile.full_name ?? "");
      setRole(data.profile.target_role ?? "");
      setExp(data.profile.experience ?? "");
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => updateFn({ data: { full_name: name, target_role: role, experience: exp } }),
    onSuccess: () => { toast.success("Profile saved"); refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const atsScore = (data?.resume?.analysis as any)?.atsScore as number | undefined;

  const quicklinks = [
    { to: "/resume", label: "Analyze resume", icon: FileText, desc: "Get an ATS score and improvements." },
    { to: "/jobs", label: "Match jobs", icon: Briefcase, desc: "Score your fit vs real roles." },
    { to: "/interview", label: "Practice interview", icon: Mic, desc: "5 questions, AI-evaluated." },
    { to: "/roadmap", label: "Build roadmap", icon: Map, desc: "Your 90-day upskilling plan." },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Welcome{data?.profile?.full_name ? `, ${data.profile.full_name.split(" ")[0]}` : ""}.</h1>
        <p className="mt-1 text-muted-foreground">Your placement copilot at a glance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Resume ATS score</CardDescription></CardHeader>
          <CardContent>
            <div className="font-display text-4xl font-semibold">{atsScore ?? "—"}<span className="text-lg text-muted-foreground">/100</span></div>
            <Progress value={atsScore ?? 0} className="mt-3" />
            <Button asChild variant="link" className="mt-2 h-auto p-0"><Link to="/resume">Improve <ArrowRight className="ml-1 size-3.5" /></Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Interview practice</CardDescription></CardHeader>
          <CardContent>
            <div className="font-display text-4xl font-semibold">{data?.interviewCount ?? 0}</div>
            <p className="text-sm text-muted-foreground">answers evaluated</p>
            <Button asChild variant="link" className="mt-2 h-auto p-0"><Link to="/interview">Practice more <ArrowRight className="ml-1 size-3.5" /></Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Skills detected</CardDescription></CardHeader>
          <CardContent>
            <div className="font-display text-4xl font-semibold">{data?.profile?.skills?.length ?? 0}</div>
            <p className="text-sm text-muted-foreground">from your resume</p>
            <Button asChild variant="link" className="mt-2 h-auto p-0"><Link to="/roadmap">See roadmap <ArrowRight className="ml-1 size-3.5" /></Link></Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quicklinks.map(({ to, label, icon: Icon, desc }) => (
          <Card key={to} className="transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
            <CardContent className="p-5">
              <span className="mb-3 grid size-9 place-items-center rounded-md bg-accent text-accent-foreground"><Icon className="size-4" /></span>
              <div className="font-semibold">{label}</div>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              <Button asChild variant="link" className="mt-2 h-auto p-0"><Link to={to}>Open</Link></Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>Used to personalize every AI recommendation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label>Target role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Frontend Engineer" />
          </div>
          <div className="space-y-2">
            <Label>Experience</Label>
            <Input value={exp} onChange={(e) => setExp(e.target.value)} placeholder="e.g. Fresher, 2 internships" />
          </div>
          <div className="sm:col-span-3">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
