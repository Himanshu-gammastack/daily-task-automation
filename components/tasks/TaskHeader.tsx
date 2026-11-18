
"use client";

import { Moon, Sun } from "lucide-react";

interface Props {
  dark: boolean;
  loading: boolean;
  today: string;
  inTime: string;
  outTime?: string;
  hasStarted: boolean;
  onInTimeChange: (value: string) => void;
  onStartDay: () => void;
  onEndDay: () => void;
  onToggleTheme: () => void;
}

export default function TaskHeader({
  dark,
  loading,
  today,
  inTime,
  outTime,
  hasStarted,
  onInTimeChange,
  onStartDay,
  onEndDay,
  onToggleTheme,
}: Props) {
  const theme = dark
    ? "bg-neutral-950 text-white border-neutral-800"
    : "bg-white text-neutral-900 border-neutral-200";

  const muted = dark ? "text-neutral-400" : "text-neutral-500";

  return (
    <header
      className={`grid grid-cols-1 md:grid-cols-3 items-center gap-4 border-b pb-5 ${
        dark ? "border-neutral-800" : "border-neutral-200"
      }`}
    >
      {/* Left: Title and date */}
      <div>
        <h1 className="text-xl font-semibold">
          Daily Task Tracker
        </h1>

        <p className={`text-sm mt-1 ${muted}`}>
          {today}
        </p>
      </div>

      {/* Center: End Day */}
      <div className="flex justify-start md:justify-center">
        {hasStarted && !outTime && (
          <button
            onClick={onEndDay}
            disabled={loading}
            className={`border rounded-md px-5 py-2 text-sm font-medium ${theme} disabled:opacity-50`}
          >
            {loading ? "Processing..." : "End Day"}
          </button>
        )}
      </div>

      {/* Right: In-Time and Theme */}
      <div className="flex items-center justify-start md:justify-end gap-3">
        {!hasStarted ? (
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={inTime}
              onChange={(e) => onInTimeChange(e.target.value)}
              className={`w-28 border rounded-md px-3 py-2 text-sm ${theme}`}
            />

            <button
              onClick={onStartDay}
              disabled={loading || !inTime}
              className={`border rounded-md px-4 py-2 text-sm ${theme} disabled:opacity-50`}
            >
              {loading ? "Saving..." : "Set In-Time"}
            </button>
          </div>
        ) : (
          <span className={`text-sm ${muted}`}>
            In: {inTime}
            {outTime && ` | Out: ${outTime}`}
          </span>
        )}

        <button
          onClick={onToggleTheme}
          className={`border rounded-md p-2 ${theme}`}
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
