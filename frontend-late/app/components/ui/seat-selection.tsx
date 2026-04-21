"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SeatInfo = {
  id: string;
  /** Omitted for aisle spacers */
  number?: number;
  /** Visual gap / aisle */
  isSpacer?: boolean;
};

export type SeatRowInfo = {
  rowId: string;
  seats: SeatInfo[];
};

export type SeatCategoryInfo = {
  categoryName: string;
  price: number;
  rows: SeatRowInfo[];
};

export type SeatSelectionProps = {
  layout: SeatCategoryInfo[];
  selectedSeats: string[];
  occupiedSeats: string[];
  onSeatSelect: (seatId: string) => void;
  className?: string;
};

function normalizeId(id: string) {
  return id.toUpperCase().trim();
}

export function SeatSelection({
  layout,
  selectedSeats,
  occupiedSeats,
  onSeatSelect,
  className,
}: SeatSelectionProps) {
  const selected = React.useMemo(
    () => new Set(selectedSeats.map(normalizeId)),
    [selectedSeats]
  );
  const occupied = React.useMemo(
    () => new Set(occupiedSeats.map(normalizeId)),
    [occupiedSeats]
  );

  return (
    <div className={cn("flex flex-col gap-10", className)}>
      {layout.map((cat) => (
        <div key={cat.categoryName}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
              {cat.categoryName}
            </div>
            <div className="text-sm text-fuchsia-300/90">
              From LKR {cat.price.toFixed(2)}
            </div>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-6">
            <div
              className="pointer-events-none absolute left-1/2 top-3 h-8 w-[min(92%,520px)] -translate-x-1/2 rounded-lg opacity-40"
              style={{
                boxShadow: "0 0 40px 2px hsl(var(--foreground) / 0.12)",
              }}
            />
            <div className="mb-6 text-center text-xs uppercase tracking-[0.35em] text-white/50">
              Screen
            </div>

            <div className="flex flex-col gap-3">
              {cat.rows.map((row) => (
                <div
                  key={row.rowId}
                  className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
                >
                  <span className="mr-1 w-6 text-center text-xs font-medium text-white/50 sm:w-8">
                    {row.rowId}
                  </span>
                  {row.seats.map((seat) => {
                    if (seat.isSpacer) {
                      return (
                        <div
                          key={seat.id}
                          className="w-4 shrink-0 sm:w-6"
                          aria-hidden
                        />
                      );
                    }
                    const id = normalizeId(seat.id);
                    const isSel = selected.has(id);
                    const isOcc = occupied.has(id);
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={isOcc}
                        onClick={() => onSeatSelect(id)}
                        className={cn(
                          "flex h-8 min-w-[2rem] items-center justify-center rounded-md border text-xs font-medium transition sm:h-9 sm:min-w-[2.25rem]",
                          isOcc &&
                            "cursor-not-allowed border-white/10 bg-white/5 text-white/25",
                          !isOcc &&
                            !isSel &&
                            "border-white/20 bg-white/5 text-white/80 hover:border-fuchsia-400/50 hover:bg-fuchsia-500/10",
                          !isOcc &&
                            isSel &&
                            "border-fuchsia-400 bg-fuchsia-500/30 text-white shadow-[0_0_12px_rgba(217,70,239,0.35)]"
                        )}
                      >
                        {seat.number ?? ""}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
