/**
 * TMDB helpers for admin movie import (browser key via NEXT_PUBLIC_TMDB_API_KEY).
 */

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

export function getTmdbApiKey(): string {
  return process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
}

export function getImageUrl(path: string | null, size = "original"): string | null {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

export async function searchTmdbMovies(query: string) {
  const key = getTmdbApiKey();
  if (!key) throw new Error("Set NEXT_PUBLIC_TMDB_API_KEY");
  const u = new URL(`${TMDB_BASE}/search/movie`);
  u.searchParams.set("api_key", key);
  u.searchParams.set("query", query);
  u.searchParams.set("language", "en-US");
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error("TMDB search failed");
  const data = await res.json();
  return data.results as Array<{
    id: number;
    title: string;
    poster_path?: string;
    release_date?: string;
  }>;
}

export async function getTmdbMovieBundle(tmdbId: number) {
  const key = getTmdbApiKey();
  if (!key) throw new Error("Set NEXT_PUBLIC_TMDB_API_KEY");
  const [details, credits, images] = await Promise.all([
    fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${key}`).then((r) => r.json()),
    fetch(`${TMDB_BASE}/movie/${tmdbId}/credits?api_key=${key}`).then((r) =>
      r.json()
    ),
    fetch(`${TMDB_BASE}/movie/${tmdbId}/images?api_key=${key}`).then((r) =>
      r.json()
    ),
  ]);
  return { details, credits, images };
}
