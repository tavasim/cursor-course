"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Gift, Menu, X } from "lucide-react"
import { useState } from "react"
import { signIn, signOut, useSession } from "next-auth/react"

export function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const handleGoogleAuth = () => signIn("google", { callbackUrl: "/" })
  const handleSignOut = () => signOut({ callbackUrl: "/" })

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-accent" />
          <span className="text-lg font-semibold text-foreground">Dandi</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/dashboards" className="text-sm font-medium text-foreground transition-colors hover:text-accent">
            dashboards
          </Link>
          <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            How it works
          </Link>
          <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </Link>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {status === "loading" ? (
            <span className="text-xs text-muted-foreground">Checking session...</span>
          ) : session?.user ? (
            <>
              <div className="flex items-center gap-2">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full border border-border object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <span className="max-w-[180px] truncate text-sm text-foreground">
                  {session.user.name ?? session.user.email ?? "Signed in"}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleGoogleAuth}>
                Log in
              </Button>
              <Button size="sm" onClick={handleGoogleAuth}>
                Sign Up
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-4 px-4 py-6">
            <Link href="/dashboards" className="text-sm font-medium text-foreground hover:text-accent">
              dashboards
            </Link>
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">
              How it works
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <div className="flex flex-col gap-2 pt-4">
              {status === "loading" ? (
                <div className="text-center text-xs text-muted-foreground">
                  Checking session...
                </div>
              ) : session?.user ? (
                <>
                  <div className="flex items-center justify-center gap-2 pb-2">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full border border-border object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : null}
                    <span className="max-w-[200px] truncate text-sm text-foreground">
                      {session.user.name ?? session.user.email ?? "Signed in"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleSignOut()
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleGoogleAuth()
                    }}
                  >
                    Log in
                  </Button>
                  <Button
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleGoogleAuth()
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
