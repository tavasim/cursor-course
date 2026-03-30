import { Button } from "@/components/ui/button"
import { ArrowRight, Star, GitPullRequest, Tag, Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-32 pb-20 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          <span>Understand any GitHub repo in seconds</span>
        </div>

        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Get deep insights
          <br />
          <span className="text-accent">on open source repos</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Dandi analyzes GitHub repositories and delivers instant summaries, star trends, 
          cool facts, important PRs, and version updates. Stop scrolling—start understanding.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="gap-2">
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg">
            View Demo
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-card">
              <Star className="h-6 w-6 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">Star Analytics</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-card">
              <GitPullRequest className="h-6 w-6 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">PR Insights</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-card">
              <Tag className="h-6 w-6 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">Version Tracking</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-card">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">Cool Facts</span>
          </div>
        </div>
      </div>
    </section>
  )
}
