"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CarouselItem = {
  id: string;
  quarter: string;
  period: string;
  imageSrc: string;
};

export type MovieCarouselProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "onSelect"
> & {
  reports: CarouselItem[];
  title: string;
  subtitle?: string;
  activeId?: string;
  onSelect?: (item: CarouselItem) => void;
};

export function MovieCarousel({
  reports,
  title,
  subtitle,
  activeId,
  onSelect,
  className,
  ...props
}: MovieCarouselProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <section className={cn("w-full", className)} {...props}>
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-white/60">{subtitle}</p>
        ) : null}
      </div>
      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
      >
        {reports.map((item) => {
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item)}
              className={cn(
                "group relative shrink-0 snap-start overflow-hidden rounded-2xl border text-left transition",
                "min-w-[200px] max-w-[240px] sm:min-w-[220px]",
                active
                  ? "border-fuchsia-400/70 ring-2 ring-fuchsia-400/40"
                  : "border-white/10 hover:border-white/25"
              )}
            >
              <div
                className="aspect-[2/3] w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.02]"
                style={{
                  backgroundImage: item.imageSrc
                    ? `url(${item.imageSrc})`
                    : undefined,
                  backgroundColor: "hsl(280 20% 15%)",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">
                  {item.period}
                </div>
                <div className="mt-1 line-clamp-2 text-sm font-medium text-white">
                  {item.quarter}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
