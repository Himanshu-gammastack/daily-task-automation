// components/PleaseWait.tsx
import React from "react";

interface PleaseWaitProps {
  message?: string;
  subtext?: string;
  fullScreen?: boolean;
}

export default function PleaseWait({
  message = "Please wait...",
  subtext = "Connecting to your Zoho account",
  fullScreen = false,
}: PleaseWaitProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 p-6 text-center ${
        fullScreen
          ? "fixed inset-0 z-50 bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80"
          : "w-full rounded-xl border border-zinc-200 bg-white py-12 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      {/* Animated Spinner */}
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

      {/* Primary Text */}
      <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {message}
      </p>

      {/* Optional Subtext */}
      {subtext && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtext}</p>
      )}
    </div>
  );
}
