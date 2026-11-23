
"use client";

import { Moon, Sun, LogOut } from "lucide-react";

interface Props {
  dark: boolean;
  loading: boolean;
  today: string;
  inTime: string;
  outTime?: string;
  hasStarted: boolean;
  userData: boolean;
  onInTimeChange: (value: string) => void;
  onStartDay: () => void;
  onEndDay: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export default function TodoHeader({
  dark,
  loading,
  today,
  inTime,
  outTime,
  hasStarted,
  userData,
  onInTimeChange,
  onStartDay,
  onEndDay,
  onToggleTheme,
  onLogout,
}: Props) {
  const theme = dark
    ? "bg-neutral-950 text-white border-neutral-800"
    : "bg-white text-neutral-900 border-neutral-200";
  
    const params = new URLSearchParams({
    client_id: process.env.ZOHO_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.ZOHO_REDIRECT_URI!,
    scope: process.env.ZOHO_ACCOUNT_SCOPE!,
    access_type: "offline",
    prompt: "consent",
  });

  const muted = dark ? "text-neutral-400" : "text-neutral-500";
  const url = `https://accounts.zoho.in/oauth/v2/auth?${params}`;

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

      {/* Center: End Day and Zoho */}
      <div className="flex justify-start md:justify-center">
        {!userData ? (
          <a
            href= {url}
            className={`border rounded-md px-5 py-2 text-sm font-medium ${theme}`}
          >
            Connect with Zoho
          </a>
        ) : (
          hasStarted &&
          !outTime && (
            <button
              onClick={onEndDay}
              disabled={loading}
              className={`border rounded-md px-5 py-2 text-sm font-medium ${theme} disabled:opacity-50`}
            >
              {loading ? "Processing..." : "End Day"}
            </button>
          )
        )}
      </div>

      {/* Right: In-Time, Theme and Logout */}
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
          title="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={onLogout}
          disabled={loading}
          className={`border rounded-md p-2 ${theme} disabled:opacity-50`}
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
