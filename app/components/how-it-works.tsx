export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Paste a GitHub URL",
      description: "Simply paste any public GitHub repository URL into Dandi. That's all we need to get started."
    },
    {
      number: "02",
      title: "We analyze everything",
      description: "Our engine scans commits, PRs, releases, contributors, and code patterns to extract meaningful insights."
    },
    {
      number: "03",
      title: "Get actionable insights",
      description: "Receive a comprehensive report with summaries, trends, and important updates in seconds."
    }
  ]

  return (
    <section id="how-it-works" className="border-y border-border bg-card/50 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Three simple steps to unlock the full potential of any open source project
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute top-8 left-full hidden h-0.5 w-full bg-border md:block" style={{ width: "calc(100% - 2rem)" }} />
              )}
              <div className="relative rounded-lg border border-border bg-background p-6">
                <span className="text-4xl font-bold text-accent">{step.number}</span>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
