"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showNotification } from "@/app/components/Notification";

const API_KEY_STORAGE = "api_key";

export default function ProtectedPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [valid, setValid] = useState(null);

  useEffect(() => {
    const key =
      typeof window !== "undefined" ? sessionStorage.getItem(API_KEY_STORAGE) : null;

    if (!key) {
      router.replace("/playground");
      return;
    }

    let cancelled = false;

    async function validate() {
      try {
        const res = await fetch("/api/validate-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });

        if (cancelled) return;

        const data = await res.json();

        if (data.valid) {
          setValid(true);
          setMounted(true);
          showNotification("Valid API key, /protected can be accessed", "success");
        } else {
          setValid(false);
          setMounted(true);
          showNotification("Invalid API key", "error");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Error validating API key:", err);
        setValid(false);
        setMounted(true);
        showNotification("Invalid API key", "error");
      }
    }

    validate();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleUseDifferentKey = (e) => {
    e.preventDefault();
    sessionStorage.removeItem(API_KEY_STORAGE);
    router.replace("/playground");
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100/80 flex items-center justify-center">
        <p className="text-gray-500">Validating API key...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100/80 flex items-start pt-8">
      <div className="max-w-xl w-full px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Protected Page</h1>
        <p className="text-base text-gray-900">
          This is a protected page that can only be accessed with a valid API key.
        </p>
        <Link
          href="/playground"
          onClick={handleUseDifferentKey}
          className="mt-6 inline-block text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Use a different API key
        </Link>
      </div>
    </div>
  );
}
