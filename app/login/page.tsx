"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";

export default function page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen flex items-center justify-center p-5 ${
      dark ? "bg-neutral-950 text-white" : "bg-white text-neutral-900"
    }`}>

      <div className="w-full max-w-sm">

        <div className="flex justify-between items-center mb-10">
          <h1 className="text-xl font-semibold">Daily Task Tracker</h1>

          <button
            onClick={() => setDark(!dark)}
            className="border rounded-md p-2"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <h2 className="text-2xl font-semibold mb-2">Welcome back</h2>
        <p className="text-sm text-neutral-500 mb-8">
          Login to manage your daily tasks.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="block text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className={`w-full border rounded-md px-3 py-3 outline-none focus:ring-1 focus:ring-neutral-400 ${
                dark ? "bg-neutral-900 border-neutral-700" : "bg-white"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className={`w-full border rounded-md px-3 py-3 outline-none focus:ring-1 focus:ring-neutral-400 ${
                dark ? "bg-neutral-900 border-neutral-700" : "bg-white"
              }`}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-md py-3 font-medium disabled:opacity-50 ${dark? "bg-white text-black" : "bg-black text-white "}`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

      </div>
    </main>
  );
}
