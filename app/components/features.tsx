import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Star, Lightbulb, GitPullRequest, Tag, Zap } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Repository Summary",
    description: "Get a comprehensive overview of any repository including purpose, tech stack, and key metrics at a glance."
  },
  {
    icon: Star,
    title: "Star Analytics",
    description: "Track star growth over time, identify trends, and understand what drives a repository's popularity."
  },
  {
    icon: Lightbulb,
    title: "Cool Facts",
    description: "Discover interesting insights like top contributors, busiest commit times, and hidden gems in the codebase."
  },
  {
    icon: GitPullRequest,
    title: "Important PRs",
    description: "Stay updated on the most impactful pull requests including breaking changes and major features."
  },
  {
    icon: Tag,
    title: "Version Updates",
    description: "Never miss a release. Get notified about new versions with changelogs and migration guides."
  },
  {
    icon: Zap,
    title: "Instant Analysis",
    description: "Paste any GitHub URL and get insights in seconds. No setup required, just fast, actionable intelligence."
  }
]

export function Features() {
  return (
    <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to understand any repo
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Powerful insights delivered instantly. No more digging through thousands of files and commits.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-card border-border transition-colors hover:border-accent/50">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
