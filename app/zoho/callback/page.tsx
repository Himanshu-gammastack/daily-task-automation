"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PleaseWait from "@/components/zohoCallback/PleaseWait";

function ZohoCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const hasCalledApi = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const location = searchParams.get("location") || "in"; // e.g. 'in', 'us', 'eu'
    const authError = searchParams.get("error");

    if (authError) {
      setError(`Zoho authorization failed: ${authError}`);
      return;
    }

    if (!code) {
      setError("Authorization code is missing from the callback URL.");
      return;
    }

    // Prevent double execution in React Strict Mode
    if (hasCalledApi.current) return;
    hasCalledApi.current = true;

    async function exchangeCodeForTokens() {
      try {
        const res = await fetch("/api/auth/zoho", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, location }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to connect Zoho account");
        }

        // Redirect to dashboard once tokens are saved
        router.replace("/?zoho=connected");
      } catch (err: any) {
        setError(err.message || "Something went wrong while connecting Zoho.");
      }
    }

    exchangeCodeForTokens();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <p className="text-base font-semibold text-red-600">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <PleaseWait
      fullScreen
      message="Please wait..."
      subtext="Connecting your Zoho account and saving permissions."
    />
  );
}

// Suspense boundary is required in Next.js App Router when using useSearchParams()
export default function ZohoCallbackPage() {
  return (
    <Suspense
      fallback={
        <PleaseWait
          fullScreen
          message="Please wait..."
          subtext="Loading authorization details..."
        />
      }
    >
      <ZohoCallbackHandler />
    </Suspense>
  );
}
