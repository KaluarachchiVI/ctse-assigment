"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MotionPageShell from "@/components/ui/motion-page-shell";
import { getGatewayBaseUrl } from "@/lib/moviesApi";

type UserProfile = {
  id?: string;
  email?: string;
  name?: string;
  userName?: string;
  fullName?: string;
};

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [remote, setRemote] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localEmail, setLocalEmail] = useState<string | null>(null);
  const [localName, setLocalName] = useState<string | null>(null);

  useEffect(() => {
    const uid = localStorage.getItem("userId");
    setUserId(uid);
    const email = localStorage.getItem("email");
    const name = localStorage.getItem("name");
    setLocalEmail(email);
    setLocalName(name);
    if (!uid) {
      setRemote({ email: email || undefined, name: name || undefined });
      return;
    }
    (async () => {
      try {
        const base = getGatewayBaseUrl();
        const res = await fetch(`${base}/users/${encodeURIComponent(uid)}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) setRemote(data);
        else setRemote({ email: email || undefined, name: name || undefined });
      } catch {
        setError("Could not load profile from server.");
        setRemote({
          id: uid,
          email: localStorage.getItem("email") || undefined,
          name: localStorage.getItem("name") || undefined,
        });
      }
    })();
  }, []);

  return (
    <MotionPageShell>
      <div className="mx-auto max-w-lg text-white">
        <div className="text-white/70 text-sm uppercase tracking-[0.22em]">
          Motion Pictures
        </div>
        <h1 className="mt-2 text-3xl font-semibold">Profile</h1>

        {error && (
          <p className="mt-4 text-sm text-amber-200/90">{error}</p>
        )}

        <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">
              User ID
            </div>
            <div className="mt-1 font-mono text-sm text-white/90">
              {userId || "—"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">
              Email
            </div>
            <div className="mt-1 text-white/90">
              {remote?.email || localEmail || "—"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50">
              Name
            </div>
            <div className="mt-1 text-white/90">
              {remote?.name || remote?.fullName || localName || "—"}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm hover:bg-white/10"
          >
            Book tickets
          </Link>
          <Link
            href="/bookings"
            className="rounded-xl bg-fuchsia-500 px-5 py-2.5 text-sm hover:bg-fuchsia-400"
          >
            My tickets
          </Link>
        </div>
      </div>
    </MotionPageShell>
  );
}
