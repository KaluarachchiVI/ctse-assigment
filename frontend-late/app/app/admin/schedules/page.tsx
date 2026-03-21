"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MotionPageShell from "@/components/ui/motion-page-shell";
import { basicAuthHeader } from "@/lib/adminAuth";
import { getGatewayBaseUrl } from "@/lib/moviesApi";
import type { ApiSchedule } from "@/lib/schedulesApi";
import { fetchSchedules } from "@/lib/schedulesApi";

export default function AdminSchedulesPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ApiSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    movieId: "",
    hallId: "hall-1",
    date: "",
    time: "18:00",
    price: "10",
    availableSeats: "120",
    status: "ACTIVE",
  });

  const base = getGatewayBaseUrl();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSchedules();
      setSchedules(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = localStorage.getItem("adminAuth");
    if (!auth) router.push("/admin/login");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const timeStr =
        form.time.length === 5 ? `${form.time}:00` : form.time;
      const payload = {
        movieId: form.movieId,
        hallId: form.hallId,
        date: form.date,
        time: timeStr,
        price: parseFloat(form.price) || 0,
        availableSeats: parseInt(form.availableSeats, 10) || 0,
        status: form.status,
      };
      const res = await fetch(`${base}/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: basicAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Create failed (${res.status})`);
      }
      setForm((f) => ({
        ...f,
        movieId: "",
      }));
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      const res = await fetch(`${base}/schedules/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: basicAuthHeader() },
      });
      if (!res.ok) throw new Error("Delete failed");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <MotionPageShell>
      <div className="text-white max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-white/70 text-sm uppercase tracking-[0.22em]">
              Admin
            </div>
            <h1 className="text-3xl font-semibold mt-2">Schedules</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="h-11 inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm hover:bg-white/10"
            >
              Bookings
            </Link>
            <Link
              href="/admin/movies"
              className="h-11 inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm hover:bg-white/10"
            >
              Movies
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 p-4 text-fuchsia-200">
            {error}
          </div>
        )}

        <form
          onSubmit={createSchedule}
          className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <h2 className="text-lg font-medium">New showtime</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm sm:col-span-2">
              <span className="text-white/70">Movie ID *</span>
              <input
                required
                placeholder="Mongo movie id from Movies admin"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
                value={form.movieId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, movieId: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Hall</span>
              <input
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
                value={form.hallId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hallId: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Date *</span>
              <input
                required
                type="date"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Time</span>
              <input
                type="time"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
                value={form.time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, time: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Price</span>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Available seats</span>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
                value={form.availableSeats}
                onChange={(e) =>
                  setForm((f) => ({ ...f, availableSeats: e.target.value }))
                }
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 px-6 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create schedule"}
          </button>
        </form>

        <div className="mt-10 border border-white/10 rounded-2xl overflow-hidden bg-white/5">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-medium">All schedules</h2>
            <button
              type="button"
              className="text-sm text-white/70 hover:text-white"
              onClick={() => load()}
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="p-6 text-white/70">Loading…</div>
          ) : schedules.length === 0 ? (
            <div className="p-6 text-white/70">No schedules yet.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="p-3">Movie</th>
                  <th className="p-3">Hall</th>
                  <th className="p-3">When</th>
                  <th className="p-3">Price</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-t border-white/5">
                    <td className="p-3 font-mono text-xs">{s.movieId}</td>
                    <td className="p-3">{s.hallId}</td>
                    <td className="p-3">
                      {s.date} {s.time}
                    </td>
                    <td className="p-3">{s.price}</td>
                    <td className="p-3">
                      {s.id ? (
                        <button
                          type="button"
                          className="text-rose-300 hover:text-rose-200"
                          onClick={() => remove(s.id!)}
                        >
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MotionPageShell>
  );
}
