"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MotionPageShell from "@/components/ui/motion-page-shell";
import { bearerAuthHeader, getGatewayBaseUrl } from "@/lib/api";

type BookingRow = {
  id: string;
  userId?: string;
  showId?: string;
  seats?: string[];
  status?: string;
  ticketCode?: string;
  paymentId?: string;
  createdAt?: string;
};

/**
 * Lists bookings for the logged-in user via GET /booking/me + Bearer JWT
 * (token from localStorage — same as login/register).
 */
export default function MyBookingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
    setToken(localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    if (!userId || !token) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const base = getGatewayBaseUrl();
        const res = await fetch(`${base}/booking/me`, {
          headers: { Authorization: bearerAuthHeader(token) },
          cache: "no-store",
        });
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error(
            (data as { message?: string })?.message ||
              `Failed to load bookings (${res.status})`
          );
        }
        const list = Array.isArray(data) ? data : [];
        setRows(list);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, token]);

  const emptyMessage = useMemo(() => {
    if (!userId) return "Sign in to see your tickets.";
    if (!token) return "Sign in again — your session token is missing.";
    if (!loading && rows.length === 0)
      return "No bookings for this account yet.";
    return null;
  }, [userId, token, loading, rows.length]);

  return (
    <MotionPageShell>
      <div className="text-white">
        <div className="text-white/70 text-sm uppercase tracking-[0.22em]">
          Motion Pictures
        </div>
        <h1 className="mt-2 text-3xl font-semibold">My tickets</h1>
        <p className="mt-2 text-sm text-white/60">
          Bookings linked to your user id (
          <span className="font-mono text-white/80">{userId || "—"}</span>).
        </p>

        {!userId && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/80">{emptyMessage}</p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-xl bg-fuchsia-500 px-5 py-2.5 text-sm hover:bg-fuchsia-400"
            >
              Login
            </Link>
          </div>
        )}

        {userId && !token && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/80">{emptyMessage}</p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-xl bg-fuchsia-500 px-5 py-2.5 text-sm hover:bg-fuchsia-400"
            >
              Login
            </Link>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {userId && token && loading && (
          <p className="mt-8 text-white/60">Loading…</p>
        )}

        {userId && token && !loading && emptyMessage && !error && (
          <p className="mt-8 text-white/70">{emptyMessage}</p>
        )}

        {userId && token && !loading && rows.length > 0 && (
          <ul className="mt-8 space-y-4">
            {rows.map((b) => (
              <li
                key={b.id}
                className="rounded-2xl border border-white/10 bg-black/30 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase text-white/50">
                      Booking
                    </div>
                    <div className="font-mono text-sm text-fuchsia-200">
                      {b.id}
                    </div>
                  </div>
                  <div
                    className={`rounded-lg px-2 py-1 text-xs uppercase ${
                      b.status === "CONFIRMED"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {b.status || "—"}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-white/50">Show</span>{" "}
                    <span className="text-white/90">{b.showId}</span>
                  </div>
                  <div>
                    <span className="text-white/50">Seats</span>{" "}
                    <span className="text-white/90">
                      {(b.seats || []).join(", ") || "—"}
                    </span>
                  </div>
                  {b.ticketCode ? (
                    <div className="sm:col-span-2">
                      <span className="text-white/50">Ticket code</span>{" "}
                      <span className="font-mono text-cyan-200">
                        {b.ticketCode}
                      </span>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10">
          <Link href="/" className="text-sm text-white/60 hover:text-white">
            ← Back to booking
          </Link>
        </div>
      </div>
    </MotionPageShell>
  );
}
