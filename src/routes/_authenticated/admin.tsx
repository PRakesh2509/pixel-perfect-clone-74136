import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

type Job = {
  id: string;
  role: string;
  company: string;
  location: string | null;
  salary: string | null;
  skills: string[];
  description: string;
};

function AdminPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [form, setForm] = useState({
    role: "",
    company: "",
    location: "",
    salary: "",
    skills: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return navigate({ to: "/auth" });
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      const admin = !!data;
      setIsAdmin(admin);
      setChecking(false);
      if (admin) {
        loadJobs();
        supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) => setUserCount(count ?? 0));
      }
    })();
  }, [navigate]);

  async function loadJobs() {
    const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    setJobs((data as Job[]) ?? []);
  }

  async function addJob(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("jobs").insert({
      role: form.role,
      company: form.company,
      location: form.location || null,
      salary: form.salary || null,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      description: form.description,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Job added");
    setForm({ role: "", company: "", location: "", salary: "", skills: "", description: "" });
    loadJobs();
  }

  async function removeJob(id: string) {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Job removed");
    loadJobs();
  }

  if (checking) {
    return <AppShell><div className="text-muted-foreground">Loading…</div></AppShell>;
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="size-5" /> Admin only</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Your account doesn't have admin access. Ask an administrator to grant you the <code>admin</code> role in the <code>user_roles</code> table.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-semibold">Admin</h1>
          <p className="text-muted-foreground">Manage jobs and monitor the platform.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Total jobs</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{jobs.length}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Registered users</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{userCount ?? "—"}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Your role</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">Admin</CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Add a job</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addJob} className="grid gap-4 md:grid-cols-2">
              <div><Label>Role</Label><Input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
              <div><Label>Company</Label><Input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Salary</Label><Input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Skills (comma separated)</Label><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Description</Label><Textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="md:col-span-2"><Button disabled={saving} type="submit">{saving ? "Saving…" : "Add job"}</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>All jobs</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {jobs.map((j) => (
              <div key={j.id} className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div>
                  <div className="font-medium">{j.role} · <span className="text-muted-foreground">{j.company}</span></div>
                  <div className="text-xs text-muted-foreground">{j.location} {j.salary && `· ${j.salary}`}</div>
                  <div className="mt-1 text-sm">{j.description}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {j.skills.map((s) => <span key={s} className="rounded bg-secondary px-2 py-0.5 text-xs">{s}</span>)}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeJob(j.id)}><Trash2 className="size-4" /></Button>
              </div>
            ))}
            {jobs.length === 0 && <div className="text-sm text-muted-foreground">No jobs yet.</div>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
