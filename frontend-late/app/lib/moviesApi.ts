/**
 * Movie API via api-gateway (same origin story as CORS).
 * Default: http://localhost:8087 → routes to movie-service /movies
 */

import { getGatewayBaseUrl } from "./api";

export type ApiMovie = {
  id?: string;
  title?: string;
  description?: string;
  genre?: string;
  language?: string;
  director?: string;
  cast?: string[];
  duration?: number;
  releaseDate?: string;
  rating?: number;
  posterUrl?: string;
  backdropUrl?: string;
  castDetails?: Record<string, string>[];
  additionalImages?: string[];
  tmdbId?: string;
  status?: string;
};

export { getGatewayBaseUrl };

export async function fetchMovies(): Promise<ApiMovie[]> {
  const base = getGatewayBaseUrl();
  const res = await fetch(`${base}/movies`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Movies request failed: ${res.status}`);
  const data = (await res.json()) as ApiMovie[];
  return Array.isArray(data) ? data : [];
}

export async function fetchMoviesByStatus(
  status: string
): Promise<ApiMovie[]> {
  const base = getGatewayBaseUrl();
  const enc = encodeURIComponent(status);
  const res = await fetch(`${base}/movies/status/${enc}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Movies by status failed: ${res.status}`);
  const data = (await res.json()) as ApiMovie[];
  return Array.isArray(data) ? data : [];
}
