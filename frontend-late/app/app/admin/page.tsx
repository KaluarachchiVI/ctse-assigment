"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MotionPageShell from "@/components/ui/motion-page-shell";
import { basicAuthHeader } from "@/lib/adminAuth";
import { getGatewayBaseUrl } from "@/lib/api";

type Booking = {
  id: string;
  userId: string;
  showId: string;
  seats: string[];
  status: string;
  paymentId?: string;
  createdAt?: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getGatewayBaseUrl()}/booking`, {
        headers: { Authorization: basicAuthHeader() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setBookings(data || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = localStorage.getItem("adminAuth");
    if (!auth) router.push("/admin/login");
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(
        `${getGatewayBaseUrl()}/booking/${encodeURIComponent(
          id
        )}/status?status=${encodeURIComponent(status)}`,
        {
          method: "PUT",
          headers: { Authorization: basicAuthHeader() },
        }
      );
      if (!res.ok) throw new Error("Failed to update status");
      await fetchBookings();
    } catch (e: any) {
      setError(e?.message || "Failed to update status");
    }
  };

  return (
    <MotionPageShell>
      <div className="text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-white/70 text-sm uppercase tracking-[0.22em]">
              Motion Pictures
            </div>
            <h1 className="text-3xl font-semibold mt-2">Admin Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href="/admin/movies"
              className="h-11 inline-flex items-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 transition"
            >
              Movies
            </Link>
            <Link
              href="/admin/schedules"
              className="h-11 inline-flex items-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 transition"
            >
              Schedules
            </Link>
            <button
              className="h-11 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 transition"
              onClick={() => fetchBookings()}
            >
              Refresh
            </button>
            <button
              className="h-11 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 hover:bg-fuchsia-400/20 px-5 transition"
              onClick={() => {
                localStorage.removeItem("adminAuth");
                router.push("/admin/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 p-4 text-fuchsia-200">
            {error}
          </div>
        )}

        <div className="mt-8 border border-white/10 rounded-2xl overflow-hidden bg-white/5">
          {loading ? (
            <div className="p-6 text-white/70">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="p-6 text-white/70">
              No bookings found.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Show</th>
                  <th className="p-4">Seats</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-white/5">
                    <td className="p-4 font-medium">{b.id?.slice(0, 8)}</td>
                    <td className="p-4">{b.userId}</td>
                    <td className="p-4">{b.showId}</td>
                    <td className="p-4">{(b.seats || []).join(", ")}</td>
                    <td className="p-4 text-white/80">{b.status}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="px-3 py-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-400/20 transition"
                          onClick={() => updateStatus(b.id, "CONFIRMED")}
                        >
                          Confirm
                        </button>
                        <button
                          className="px-3 py-1 rounded-lg border border-rose-400/30 bg-rose-400/10 hover:bg-rose-400/20 transition"
                          onClick={() => updateStatus(b.id, "CANCELLED")}
                        >
                          Cancel
                        </button>
                      </div>
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

