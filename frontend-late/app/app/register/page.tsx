"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MotionPageShell from "@/components/ui/motion-page-shell";
import { getGatewayBaseUrl } from "@/lib/moviesApi";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const base = getGatewayBaseUrl();
      const res = await fetch(`${base}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Registration failed");
      }
      if (data.token) localStorage.setItem("token", data.token);
      if (data.userId) localStorage.setItem("userId", data.userId);
      if (data.email) localStorage.setItem("email", data.email);
      if (data.name) localStorage.setItem("name", data.name);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionPageShell>
      <div className="mx-auto max-w-md text-white">
        <div className="text-white/70 text-sm uppercase tracking-[0.22em]">
          Motion Pictures
        </div>
        <h1 className="mt-2 text-3xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm text-white/60">
          Already have an account?{" "}
          <Link href="/login" className="text-fuchsia-300 hover:underline">
            Login
          </Link>
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-white/70">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
            />
            <p className="mt-1 text-xs text-white/45">At least 6 characters</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-fuchsia-500 py-2.5 font-medium hover:bg-fuchsia-400 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Sign up"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-white/60 hover:text-white">
            ← Back to booking
          </Link>
        </div>
      </div>
    </MotionPageShell>
  );
}
