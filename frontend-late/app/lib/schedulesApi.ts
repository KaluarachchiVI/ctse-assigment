import { getGatewayBaseUrl } from "@/lib/moviesApi";

export type ApiSchedule = {
  id?: string;
  movieId?: string;
  hallId?: string;
  date?: string;
  time?: string;
  price?: number;
  availableSeats?: number;
  status?: string;
};

export async function fetchSchedules(): Promise<ApiSchedule[]> {
  const base = getGatewayBaseUrl();
  const res = await fetch(`${base}/schedules`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Schedules failed: ${res.status}`);
  const data = (await res.json()) as ApiSchedule[];
  return Array.isArray(data) ? data : [];
}
