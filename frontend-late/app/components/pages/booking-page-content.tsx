"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { decodeJwtSub } from "@/lib/jwt";
import { NOW_SHOWING_MOVIES } from "@/lib/scopeCinemas";
import {
  fetchMovies,
  fetchMoviesByStatus,
  type ApiMovie,
} from "@/lib/moviesApi";
import { MovieCarousel, type CarouselItem } from "@/components/ui/carousel";
import { MovieHeroSlider } from "@/components/ui/movie-hero-slider";
import {
  SeatSelection,
  type SeatCategoryInfo,
  type SeatInfo,
  type SeatRowInfo,
} from "@/components/ui/seat-selection";
import MotionPageShell from "../ui/motion-page-shell";
import { getGatewayBaseUrl } from "@/lib/api";

/** When `true`, after creating a booking the app goes to `/payment` (demo mock card UI) instead of Stripe Checkout. */
const USE_MOCK_PAYMENT_PAGE =
  process.env.NEXT_PUBLIC_USE_MOCK_PAYMENT_PAGE === "true";

/** Stripe Checkout amount in USD major units (must be ≥ $0.50). Matches server STRIPE_CHECKOUT_CURRENCY=usd. */
const CHECKOUT_AMOUNT_USD = 1;

export default function BookingPageContent({
  showNavbar = false,
}: {
  showNavbar?: boolean;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");

  const [showId, setShowId] = useState(NOW_SHOWING_MOVIES[0]?.slug || "movie");
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [paymentId, setPaymentId] = useState("PENDING");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketEmail, setTicketEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showCheckoutInfoModal, setShowCheckoutInfoModal] = useState(false);

  /** Loaded from movie-service via api-gateway; empty => fallback to static NOW_SHOWING_MOVIES */
  const [remoteMovies, setRemoteMovies] = useState<ApiMovie[]>([]);

  const isLoggedIn = Boolean(userId?.trim());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let list = await fetchMoviesByStatus("NOW_SHOWING");
        if (!list.length) list = await fetchMovies();
        if (cancelled || !list.length) return;
        setRemoteMovies(list);
        const firstId = list[0]?.id;
        if (firstId) setShowId(firstId);
      } catch {
        /* keep static catalogue + current showId */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
    const storedUid = localStorage.getItem("userId") || "";
    if (storedUid) {
      setUserId(storedUid);
      const em = localStorage.getItem("email");
      const nm = localStorage.getItem("name");
      if (em) setTicketEmail(em);
      if (nm) setGuestName(nm);
      return;
    }
    if (t) {
      const decoded = decodeJwtSub(t);
      if (decoded) {
        localStorage.setItem("userId", decoded);
        setUserId(decoded);
        const em = localStorage.getItem("email");
        const nm = localStorage.getItem("name");
        if (em) setTicketEmail(em);
        if (nm) setGuestName(nm);
      }
    }
  }, []);

  /** Keep ticket fields in sync if userId appears later (e.g. token decode). */
  useEffect(() => {
    if (!isLoggedIn || typeof window === "undefined") return;
    const em = localStorage.getItem("email");
    const nm = localStorage.getItem("name");
    if (em) setTicketEmail(em);
    if (nm) setGuestName(nm);
  }, [isLoggedIn]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentState = params.get("payment");
    const stripeCheckoutSessionId = params.get("stripeCheckoutSessionId") || "";
    const bookingId = params.get("bookingId") || "";

    const run = async () => {
      if (!paymentState) return;

      if (paymentState === "mock_success") {
        try {
          const raw = sessionStorage.getItem("mockPaymentResult");
          if (raw) {
            const r = JSON.parse(raw) as { ticketCode?: string };
            setInfo(
              "Demo payment completed. Your ticket is being issued and emailed."
            );
            if (r.ticketCode) {
              setTicketCode(r.ticketCode);
            }
            sessionStorage.removeItem("mockPaymentResult");
          } else {
            setInfo("Demo payment completed.");
          }
        } catch {
          setInfo("Demo payment completed.");
        }
        const u = new URL(window.location.href);
        u.searchParams.delete("payment");
        window.history.replaceState({}, "", u.pathname + u.search);
        return;
      }

      if (paymentState === "success_immediate" || paymentState === "cancelled") {
        // Prevent duplicate finalization on refresh/back.
        const processedKey = `stripe-finalized:${stripeCheckoutSessionId}`;
        if (!stripeCheckoutSessionId) {
          setInfo(
            paymentState === "success_immediate"
              ? "Payment completed (redirect received)."
              : "Payment was cancelled."
          );
          return;
        }
        if (stripeCheckoutSessionId && localStorage.getItem(processedKey) === "true") {
          setInfo(
            paymentState === "success_immediate"
              ? "Payment completed."
              : "Payment was cancelled."
          );
          return;
        }

        const storedRaw = localStorage.getItem("paymentFinalizePayload");
        const storedPayload = storedRaw ? JSON.parse(storedRaw) : {};

        // The backend `POST /payments` finalize call still requires bookingId/amount/paymentMethod.
        const payload = {
          ...storedPayload,
          bookingId: bookingId || storedPayload.bookingId,
          stripeCheckoutSessionId,
        };

        if (!payload.bookingId) {
          setError("Missing bookingId for payment finalization.");
          return;
        }

        setInfo(paymentState === "success_immediate" ? "Confirming payment..." : "Finalizing cancelled payment...");

        try {
          const basic = btoa("payment-user:payment-pass");
          const finalizeRes = await fetch(`${getGatewayBaseUrl()}/payments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${basic}`,
            },
            body: JSON.stringify(payload),
          });

          const finalized = await finalizeRes.json().catch(() => ({}));
          if (!finalizeRes.ok) {
            throw new Error(finalized?.message || "Payment finalization failed");
          }

          localStorage.setItem(processedKey, "true");
          localStorage.removeItem("paymentFinalizePayload");

          if (finalized?.status === "SUCCESS") {
            setInfo("Payment completed. Your ticket is being issued and emailed.");
            if (finalized?.ticketCode) {
              setTicketCode(finalized.ticketCode);
            }
          } else {
            setInfo("Payment was cancelled. Your booking has been marked as FAILED.");
          }
        } catch (err: any) {
          setError(err?.message || "Failed to finalize payment.");
        }
      } else if (paymentState === "success") {
        // Backwards compatibility if some older redirect still uses this value.
        setInfo("Payment completed. Your ticket is being issued and emailed.");
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (!showId) return;

    const run = async () => {
      try {
        const res = await fetch(
          `${getGatewayBaseUrl()}/booking/show/${encodeURIComponent(
            showId
          )}/confirmed-seats`
        );
        const data = (await res.json()) as string[];
        setOccupiedSeats(
          (data || []).map((s) => String(s).toUpperCase().trim())
        );
      } catch {
        setOccupiedSeats([]);
      }
    };

    run();
  }, [showId]);

  const seatLayout: SeatCategoryInfo[] = useMemo(() => {
    const makeSeat = (rowId: string, col: number): SeatInfo => ({
      id: `${rowId}${col}`,
      number: col,
    });

    const makeRow = (rowId: string): SeatRowInfo => {
      const left = Array.from({ length: 6 }, (_, i) => makeSeat(rowId, i + 1));
      const spacer: SeatInfo = { id: `${rowId}-aisle`, isSpacer: true };
      const right = Array.from(
        { length: 6 },
        (_, i) => makeSeat(rowId, i + 7)
      );
      return {
        rowId,
        seats: [...left, spacer, ...right],
      };
    };

    const CLASSIC: SeatCategoryInfo = {
      categoryName: "CLASSIC",
      price: 135.58,
      rows: ["A", "B"].map(makeRow),
    };

    const CLASSIC_PLUS: SeatCategoryInfo = {
      categoryName: "CLASSIC PLUS",
      price: 169.48,
      rows: ["C", "D", "E", "F", "G"].map(makeRow),
    };

    const PRIME: SeatCategoryInfo = {
      categoryName: "PRIME",
      price: 186.44,
      rows: ["H", "I", "J"].map(makeRow),
    };

    return [CLASSIC, CLASSIC_PLUS, PRIME];
  }, []);

  const toggleSeat = (seatId: string) => {
    const normalized = seatId.toUpperCase().trim();
    setSelectedSeats((prev) => {
      const set = new Set(prev.map((s) => s.toUpperCase().trim()));
      if (set.has(normalized)) {
        return prev.filter((s) => s.toUpperCase().trim() !== normalized);
      }
      return [...prev, normalized];
    });
  };

  const reports: CarouselItem[] = useMemo(() => {
    if (remoteMovies.length > 0) {
      return remoteMovies.map((m) => ({
        id: m.id || "",
        quarter: m.title || "Untitled",
        period: m.status || "Now Showing",
        imageSrc: m.posterUrl || "",
      }));
    }
    return NOW_SHOWING_MOVIES.map((m) => ({
      id: m.slug,
      quarter: m.title,
      period: "In Theaters Now",
      imageSrc: m.posterUrl,
    }));
  }, [remoteMovies]);

  /** Resolve email/name from state + localStorage for logged-in users. */
  const resolveTicketFields = () => {
    const uid = userId?.trim() || "";
    if (uid) {
      const em = (
        localStorage.getItem("email") ||
        ticketEmail ||
        ""
      ).trim();
      const nm = (
        localStorage.getItem("name") ||
        guestName ||
        ""
      ).trim();
      return { ticketEmail: em, guestName: nm, userId: uid };
    }
    return {
      ticketEmail: ticketEmail.trim(),
      guestName: guestName.trim(),
      userId: "",
    };
  };

  const validateReservation = (): string | null => {
    if (selectedSeats.length === 0) {
      return "Pick at least one seat from the theatre grid.";
    }
    const { ticketEmail: em, guestName: gn, userId: uid } =
      resolveTicketFields();
    if (uid) {
      if (!em) {
        return "Your account email is missing. Please log out and log in again.";
      }
    } else {
      if (!em) {
        return "Ticket email is required (we send you the ticket).";
      }
      if (!gn) {
        return "Guest name is required for guest checkout.";
      }
    }
    return null;
  };

  const handleClickReserveSeats = () => {
    setError(null);
    setTicketCode(null);
    setInfo(null);
    const msg = validateReservation();
    if (msg) {
      setError(msg);
      return;
    }
    setShowCheckoutInfoModal(true);
  };

  const runBookingAndPayment = async () => {
    setError(null);
    setTicketCode(null);
    setInfo(null);
    setLoading(true);
    try {
      const msg = validateReservation();
      if (msg) {
        setError(msg);
        return;
      }

      const { ticketEmail: resolvedEmail, guestName: resolvedGuest, userId: uid } =
        resolveTicketFields();

      const payload = {
        userId: uid || null,
        showId,
        seats: selectedSeats,
        paymentId,
        status: "PENDING",
        ticketEmail: resolvedEmail,
        guestName: resolvedGuest.length > 0 ? resolvedGuest : undefined,
      };

      const res = await fetch(`${getGatewayBaseUrl()}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to create booking");
      }

      const booking = await res.json();
      const bookingId = booking?.id;
      if (!bookingId) throw new Error("Booking created but bookingId missing.");

      const amount = CHECKOUT_AMOUNT_USD;

      if (USE_MOCK_PAYMENT_PAGE) {
        sessionStorage.setItem(
          "mockPaymentPayload",
          JSON.stringify({
            bookingId,
            userId: uid || null,
            ticketEmail: resolvedEmail,
            guestName: resolvedGuest,
            amount,
          })
        );
        router.push("/payment");
        return;
      }

      const basic = btoa("payment-user:payment-pass");
      const origin = window.location.origin;

      const successUrl = `${origin}/?payment=success_immediate&bookingId=${encodeURIComponent(
        bookingId
      )}&stripeCheckoutSessionId={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/?payment=cancelled&bookingId=${encodeURIComponent(
        bookingId
      )}&stripeCheckoutSessionId={CHECKOUT_SESSION_ID}`;

      localStorage.setItem(
        "paymentFinalizePayload",
        JSON.stringify({
          bookingId,
          userId: uid || null,
          ticketEmail: resolvedEmail,
          guestName: resolvedGuest,
          amount,
          paymentMethod: "CARD",
        })
      );

      const payRes = await fetch(`${getGatewayBaseUrl()}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basic}`,
        },
        body: JSON.stringify({
          bookingId,
          userId: uid || null,
          ticketEmail: resolvedEmail,
          guestName: resolvedGuest,
          amount,
          paymentMethod: "CARD",
          successUrl,
          cancelUrl,
        }),
      });

      const payment = await payRes.json().catch(() => ({}));
      if (!payRes.ok) {
        throw new Error(payment?.message || "Payment failed");
      }

      if (payment?.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
        return;
      }
      if (payment?.status === "SUCCESS") {
        setInfo("Payment completed. Your ticket is being issued and emailed.");
        if (payment?.ticketCode) {
          setTicketCode(payment.ticketCode);
        }
        return;
      }

      throw new Error("Payment completed but no checkout redirect URL was returned.");
    } catch (err: any) {
      setError(err?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckoutModal = async () => {
    setShowCheckoutInfoModal(false);
    await runBookingAndPayment();
  };

  return (
    <MotionPageShell>
      <div className="text-white">
        {showNavbar && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-md">
            <Link
              href="/"
              className="text-white/90 text-sm uppercase tracking-[0.22em]"
            >
              Motion Pictures
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="h-10 inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm hover:bg-white/10 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="h-10 inline-flex items-center justify-center rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 px-4 text-sm transition"
              >
                Sign Up
              </Link>
              <Link
                href="/bookings"
                className="hidden sm:inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm hover:bg-white/10 transition"
              >
                My Tickets
              </Link>
            </div>
          </div>
        )}

        {!showNavbar && (
          <div className="text-white/70 text-sm uppercase tracking-[0.22em]">
            Motion Pictures
          </div>
        )}
        <h1 className="text-3xl font-semibold mt-2">Book Tickets</h1>

        {remoteMovies.length > 0 ? (
          <div className="mt-6">
            <MovieHeroSlider
              movies={remoteMovies}
              onSelectMovie={(m) => {
                if (m.id) {
                  setShowId(m.id);
                  setSelectedSeats([]);
                  setTicketCode(null);
                }
              }}
            />
          </div>
        ) : null}

        <div className="mt-6">
          <MovieCarousel
            reports={reports}
            title="Now Showing"
            subtitle="In Theaters Now"
            activeId={showId}
            onSelect={(item) => {
              setShowId(item.id);
              setSelectedSeats([]);
              setTicketCode(null);
            }}
          />
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 p-4 text-fuchsia-200">
            {error}
          </div>
        )}

        {info && (
          <div className="mt-6 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-cyan-100">
            {info}
          </div>
        )}

        {ticketCode && (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
            <div className="text-white/90 font-semibold text-lg">Ticket issued</div>
            <div className="text-white/70 text-sm mt-2">Your ticket code:</div>
            <div className="mt-2 text-fuchsia-200 font-mono text-xl">{ticketCode}</div>
            <div className="text-white/60 text-xs mt-2">
              We also email your ticket (mock SMTP). For theatre entry, use the
              code/QR.
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleClickReserveSeats();
          }}
          className="mt-8 space-y-4"
        >
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-white/70">Selected show</div>
            <div className="mt-1 text-white/90 font-medium">{showId}</div>
          </div>

          <div>
            <label className="block text-sm text-white/70">Seat selection</label>
            <div className="mt-2">
              <SeatSelection
                layout={seatLayout}
                selectedSeats={selectedSeats}
                occupiedSeats={occupiedSeats}
                onSeatSelect={toggleSeat}
                className="p-0 bg-transparent gap-8 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70">Payment ID</label>
            <input
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white"
              placeholder="e.g. PENDING"
              required
            />
          </div>

          {!isLoggedIn ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div>
                <label className="block text-sm text-white/70">
                  Ticket email (required)
                </label>
                <input
                  value={ticketEmail}
                  onChange={(e) => setTicketEmail(e.target.value)}
                  type="email"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-white"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70">
                  Guest name (required)
                </label>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  type="text"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-white"
                  placeholder="Name for the ticket"
                  required
                  autoComplete="name"
                />
              </div>
              <div className="text-xs text-white/60">
                Guest checkout: no signup needed.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
              <div className="text-sm text-white/70">Your account</div>
              <div className="text-white/90 text-sm">
                Ticket will be sent to{" "}
                <span className="font-medium text-fuchsia-200">
                  {ticketEmail || "—"}
                </span>
                {guestName.trim() ? (
                  <span className="block mt-1 text-white/80">
                    Name: <span className="font-medium">{guestName}</span>
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-white/60">
                Using your login — no need to re-enter email or guest details.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 transition disabled:opacity-60"
          >
            {loading
              ? "Creating..."
              : USE_MOCK_PAYMENT_PAGE
                ? "Continue to payment (demo)"
                : "Reserve Seats"}
          </button>
        </form>

        {showCheckoutInfoModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-info-title"
          >
            <div className="max-w-md w-full rounded-2xl border border-white/15 bg-zinc-900 p-6 shadow-xl">
              <h2
                id="checkout-info-title"
                className="text-lg font-semibold text-white"
              >
                Secure payment
              </h2>
              <p className="mt-3 text-sm text-white/80 leading-relaxed">
                {USE_MOCK_PAYMENT_PAGE ? (
                  <>
                    You will continue to the demo payment page to complete your
                    booking.
                  </>
                ) : (
                  <>
                    Next, you will be redirected to{" "}
                    <strong className="text-white">Stripe Checkout</strong> — a
                    secure page where you enter your{" "}
                    <strong className="text-white">credit or debit card</strong>.
                    We never store your card on our servers; Stripe handles
                    payment details safely.
                  </>
                )}
              </p>
              <p className="mt-4 text-sm text-fuchsia-200/90">
                Total:{" "}
                <span className="font-mono font-semibold">
                  ${CHECKOUT_AMOUNT_USD.toFixed(2)} USD
                </span>
              </p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="h-10 rounded-xl border border-white/20 px-4 text-sm text-white/90 hover:bg-white/10 transition"
                  onClick={() => setShowCheckoutInfoModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-10 rounded-xl bg-fuchsia-500 px-4 text-sm font-medium text-white hover:bg-fuchsia-400 transition disabled:opacity-60"
                  onClick={handleConfirmCheckoutModal}
                  disabled={loading}
                >
                  {loading ? "Working…" : "Continue to payment"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 text-sm text-white/60">
          Selected seats are sent to booking-service and seats already confirmed
          for this show are disabled.
        </div>
      </div>
    </MotionPageShell>
  );
}

