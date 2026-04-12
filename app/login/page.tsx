"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/playground");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
      <p className="mt-3 max-w-md text-center text-sm text-muted-foreground">
        Use your Google account to open the API playground and dashboards.
      </p>
      <Button
        className="mt-8"
        size="lg"
        onClick={() => signIn("google", { callbackUrl: "/playground" })}
      >
        Continue with Google
      </Button>
      <Link
        href="/"
        className="mt-8 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Back to home
      </Link>
    </main>
  );
}
