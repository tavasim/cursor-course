import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const plans: {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  popular: boolean
  comingSoon?: boolean
}[] = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for exploring open source projects",
    features: [
      "5 repo analyses per month",
      "Basic repository summary",
      "Star count & history",
      "Latest 3 releases",
      "Community support"
    ],
    cta: "Get Started",
    popular: true
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "For developers who want deeper insights",
    features: [
      "Unlimited repo analyses",
      "Advanced AI summaries",
      "Full PR insights & tracking",
      "Cool facts & hidden gems",
      "Version update notifications",
      "Export reports as PDF",
      "Priority support"
    ],
    cta: "Subscribe",
    popular: false,
    comingSoon: true
  },
  {
    name: "Enterprise",
    price: "$39",
    period: "/month",
    description: "For teams monitoring multiple repos",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared watchlists",
      "Team dashboard",
      "Slack & Discord integration",
      "Custom alerts",
      "Dedicated support"
    ],
    cta: "Contact Sales",
    popular: false,
    comingSoon: true
  }
]

export function Pricing() {
  return (
    <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className="relative bg-card border-border"
            >
              {plan.comingSoon && (
                <div className="absolute top-4 right-4 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  Coming Soon
                </div>
              )}
              <CardHeader className="pt-8">
                <CardTitle className="text-xl text-foreground">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-5 w-5 shrink-0 text-accent" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-8 w-full ${plan.popular ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                  variant={plan.popular ? "default" : "secondary"}
                  disabled={plan.comingSoon}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
