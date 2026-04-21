"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MotionPageShell from "@/components/ui/motion-page-shell";
import { basicAuthHeader } from "@/lib/adminAuth";
import { getGatewayBaseUrl } from "@/lib/moviesApi";
import type { ApiMovie } from "@/lib/moviesApi";
import {
  getImageUrl,
  getTmdbMovieBundle,
  searchTmdbMovies,
} from "@/lib/tmdbClient";

export default function AdminMoviesPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<ApiMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<
    { id: number; title: string; poster_path?: string; release_date?: string }[]
  >([]);
  const [searching, setSearching] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "",
    language: "",
    director: "",
    duration: "",
    releaseDate: "",
    rating: "",
    posterUrl: "",
    backdropUrl: "",
    tmdbId: "",
    status: "NOW_SHOWING",
  });

  const base = getGatewayBaseUrl();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${base}/movies`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to load movies");
      setMovies(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
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

  const handleTmdbSearch = async () => {
    if (!tmdbQuery.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const r = await searchTmdbMovies(tmdbQuery);
      setTmdbResults(r.slice(0, 8));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "TMDB search failed");
      setTmdbResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectTmdb = async (id: number) => {
    setSaving(true);
    setError(null);
    try {
      const { details, credits, images } = await getTmdbMovieBundle(id);
      const director =
        (credits.crew as { job?: string; name?: string }[]).find(
          (c) => c.job === "Director"
        )?.name || "";
      const backdropUrl =
        getImageUrl(details.backdrop_path, "original") || "";
      const posterUrl = getImageUrl(details.poster_path, "w500") || "";
      setForm({
        title: details.title || "",
        description: details.overview || "",
        genre: (details.genres || [])
          .map((g: { name: string }) => g.name)
          .join(", "),
        language: (details.original_language || "").toUpperCase(),
        director,
        duration: String(details.runtime ?? ""),
        releaseDate: details.release_date || "",
        rating: details.vote_average != null
          ? Number(details.vote_average).toFixed(1)
          : "",
        posterUrl,
        backdropUrl,
        tmdbId: String(details.id),
        status: "NOW_SHOWING",
      });
      setTmdbResults([]);
      setTmdbQuery("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "TMDB detail failed");
    } finally {
      setSaving(false);
    }
  };

  const createMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        genre: form.genre || undefined,
        language: form.language || undefined,
        director: form.director || undefined,
        duration: parseInt(form.duration, 10) || 0,
        releaseDate: form.releaseDate || undefined,
        rating: parseFloat(form.rating) || 0,
        posterUrl: form.posterUrl || undefined,
        backdropUrl: form.backdropUrl || undefined,
        tmdbId: form.tmdbId || undefined,
        status: form.status,
      };
      const res = await fetch(`${base}/movies`, {
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
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this movie?")) return;
    setError(null);
    try {
      const res = await fetch(`${base}/movies/${encodeURIComponent(id)}`, {
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
            <h1 className="text-3xl font-semibold mt-2">Movies</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="h-11 inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm hover:bg-white/10"
            >
              Bookings
            </Link>
            <Link
              href="/admin/schedules"
              className="h-11 inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm hover:bg-white/10"
            >
              Schedules
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 p-4 text-fuchsia-200">
            {error}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-medium">TMDB import</h2>
          <p className="text-sm text-white/60 mt-1">
            Set <code className="text-cyan-200">NEXT_PUBLIC_TMDB_API_KEY</code>{" "}
            in <code className="text-cyan-200">.env.local</code>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              className="flex-1 min-w-[200px] rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
              placeholder="Search movie title..."
              value={tmdbQuery}
              onChange={(e) => setTmdbQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTmdbSearch()}
            />
            <button
              type="button"
              disabled={searching}
              className="rounded-xl border border-fuchsia-400/40 bg-fuchsia-400/15 px-4 py-2 text-sm hover:bg-fuchsia-400/25 disabled:opacity-50"
              onClick={handleTmdbSearch}
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
          {tmdbResults.length > 0 && (
            <ul className="mt-4 space-y-2 max-h-56 overflow-y-auto">
              {tmdbResults.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="w-full text-left rounded-xl border border-white/10 bg-black/20 px-3 py-2 hover:bg-white/10 flex gap-3 items-center"
                    onClick={() => selectTmdb(m.id)}
                  >
                    {m.poster_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getImageUrl(m.poster_path, "w92") || ""}
                        alt=""
                        className="w-10 h-14 object-cover rounded"
                      />
                    ) : null}
                    <span>{m.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          onSubmit={createMovie}
          className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <h2 className="text-lg font-medium">Create / update draft</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-white/70">Title *</span>
              <input
                required
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">TMDB ID</span>
              <input
                readOnly
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white/70"
                value={form.tmdbId}
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Status</span>
              <select
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="NOW_SHOWING">Now Showing</option>
                <option value="COMING_SOON">Coming Soon</option>
                <option value="ENDED">Ended</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-white/70">Duration (min)</span>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
                value={form.duration}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duration: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-white/70">Description</span>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-white/70">Poster URL</span>
              <input
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
                value={form.posterUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, posterUrl: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-white/70">Backdrop URL</span>
              <input
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
                value={form.backdropUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, backdropUrl: e.target.value }))
                }
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 px-6 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create movie"}
          </button>
        </form>

        <div className="mt-10 border border-white/10 rounded-2xl overflow-hidden bg-white/5">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-medium">Catalog</h2>
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
          ) : movies.length === 0 ? (
            <div className="p-6 text-white/70">No movies yet.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {movies.map((m) => (
                  <tr key={m.id} className="border-t border-white/5">
                    <td className="p-3">{m.title}</td>
                    <td className="p-3 text-white/80">{m.status}</td>
                    <td className="p-3">
                      {m.id ? (
                        <button
                          type="button"
                          className="text-rose-300 hover:text-rose-200"
                          onClick={() => remove(m.id!)}
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
