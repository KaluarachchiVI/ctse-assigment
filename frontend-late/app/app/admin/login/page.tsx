"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MotionPageShell from "@/components/ui/motion-page-shell";
import { ADMIN_PASSWORD, ADMIN_USERNAME } from "@/lib/adminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem("adminAuth", "1");
      router.push("/admin");
      return;
    }
    setError("Invalid admin credentials.");
  };

  return (
    <MotionPageShell>
      <div className="mx-auto max-w-sm text-white">
        <h1 className="text-2xl font-semibold">Admin login</h1>
        <p className="mt-2 text-sm text-white/60">
          Use the same credentials as{" "}
          <code className="text-fuchsia-200/90">BOOKING_ADMIN_*</code> /
          <code className="text-fuchsia-200/90"> NEXT_PUBLIC_ADMIN_*</code>.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-white/70">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-fuchsia-500 py-2.5 font-medium hover:bg-fuchsia-400"
          >
            Enter dashboard
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-white/60 hover:text-white">
            ← Home
          </Link>
        </div>
      </div>
    </MotionPageShell>
  );
}
