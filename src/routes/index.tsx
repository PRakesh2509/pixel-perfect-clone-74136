import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Briefcase, Mic, Map, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlaceAI — AI Copilot for Job Placements" },
      { name: "description", content: "Land your dream role. AI-powered resume analysis, job matching, interview prep, and a personalized 90-day upskilling roadmap." },
      { property: "og:title", content: "PlaceAI — AI Copilot for Job Placements" },
      { property: "og:description", content: "AI-powered resume analysis, job matching, and interview prep for students and early-career candidates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: FileText, title: "Resume Analyzer", desc: "Instant ATS score, targeted improvements, and skill detection." },
  { icon: Briefcase, title: "Job Matcher", desc: "See fit % against real roles, plus salary negotiation tactics." },
  { icon: Mic, title: "Interview Prep", desc: "Personalized questions, practice, and AI feedback on every answer." },
  { icon: Map, title: "90-Day Roadmap", desc: "A concrete week-by-week plan to close skill gaps and get hired." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Nav */}
      <header className="mx-auto flex h-16 max-w-6xl items-center px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <img src="/logo.png" alt="PlaceAI" className="h-8 w-auto" />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
          <Button asChild><Link to="/auth">Get started</Link></Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-16 text-center sm:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <span className="size-1.5 rounded-full bg-brand" /> Trusted by placement-hungry students
        </div>
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Land the job.
          <br />
          <span className="text-brand-gradient">Not just a callback.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          PlaceAI is your AI-powered placement copilot — analyzing your resume, matching you with real roles,
          coaching you through interviews, and building the exact skills recruiters want.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-6 text-base">
            <Link to="/auth">Start free <ArrowRight className="ml-1 size-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
            <a href="#features">See features</a>
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          {["No credit card", "ATS-friendly analysis", "Personalized in seconds"].map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-brand" /> {s}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Everything you need. Nothing you don't.</h2>
          <p className="mt-3 text-muted-foreground">Four focused tools that compound into real offers.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
              <CardContent className="p-6">
                <span className="mb-4 grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-2xl border bg-card p-8 shadow-[var(--shadow-card)] sm:p-12">
          <h2 className="font-display text-3xl font-semibold">Three steps to job-ready</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { n: "01", t: "Drop your resume", d: "AI grades ATS-fit and flags exactly what to fix." },
              { n: "02", t: "Match & practice", d: "Get fit % on real jobs, then practice with tailored interviews." },
              { n: "03", t: "Close the gaps", d: "Follow a 90-day roadmap with resources and mini-projects." },
            ].map((s) => (
              <li key={s.n}>
                <div className="font-display text-3xl text-brand">{s.n}</div>
                <div className="mt-2 font-semibold">{s.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Button asChild size="lg"><Link to="/auth">Create your free account</Link></Button>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} PlaceAI</div>
          <div>Built with Lovable AI</div>
        </div>
      </footer>
    </div>
  );
}
