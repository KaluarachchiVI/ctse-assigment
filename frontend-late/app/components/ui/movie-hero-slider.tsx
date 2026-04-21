"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiMovie } from "@/lib/moviesApi";

type Props = {
  movies: ApiMovie[];
  className?: string;
  intervalMs?: number;
  onSelectMovie?: (movie: ApiMovie) => void;
};

export function MovieHeroSlider({
  movies,
  className,
  intervalMs = 7000,
  onSelectMovie,
}: Props) {
  const valid = React.useMemo(
    () =>
      movies.filter((m) => {
        const img = m.backdropUrl || m.posterUrl;
        return img && m.title;
      }),
    [movies]
  );

  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (valid.length === 0) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % valid.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [valid.length, intervalMs]);

  React.useEffect(() => {
    if (index >= valid.length) setIndex(0);
  }, [index, valid.length]);

  if (valid.length === 0) return null;

  const current = valid[index];
  const bg = current.backdropUrl || current.posterUrl || "";

  const go = (dir: -1 | 1) => {
    setIndex((i) => {
      const n = valid.length;
      return (i + dir + n) % n;
    });
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-white/10 min-h-[220px] sm:min-h-[320px]",
        className
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url(${bg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

      <div className="relative z-10 flex flex-col justify-end p-6 sm:p-10 min-h-[220px] sm:min-h-[320px]">
        <div className="max-w-3xl">
          <div className="text-white/70 text-xs uppercase tracking-[0.22em] mb-2">
            Featured
          </div>
          <h2 className="text-2xl sm:text-4xl font-semibold text-white drop-shadow-lg">
            {current.title}
          </h2>
          {current.description ? (
            <p className="mt-2 text-sm sm:text-base text-white/80 line-clamp-3">
              {current.description}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {current.genre ? (
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">
                {current.genre}
              </span>
            ) : null}
            {current.status ? (
              <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-100">
                {current.status}
              </span>
            ) : null}
            {onSelectMovie ? (
              <button
                type="button"
                className="rounded-full border border-white/25 bg-white/15 hover:bg-white/25 px-4 py-1.5 text-sm text-white transition"
                onClick={() => onSelectMovie(current)}
              >
                Select for booking
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {valid.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-8 bg-fuchsia-400" : "w-2 bg-white/30"
                )}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/40 text-white hover:bg-black/60"
              onClick={() => go(-1)}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/40 text-white hover:bg-black/60"
              onClick={() => go(1)}
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
