"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MotionPageShell from "@/components/ui/motion-page-shell";
import { getGatewayBaseUrl } from "@/lib/api";

const STORAGE_KEY = "mockPaymentPayload";

export type MockPaymentPayload = {
  bookingId: string;
  userId: string | null;
  ticketEmail: string;
  guestName: string;
  amount: number;
};

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function formatCardDisplay(value: string): string {
  const d = digitsOnly(value).slice(0, 16);
  return d.replace(/(.{4})/g, "$1 ").trim();
}

function isValidExpiry(mmYy: string): boolean {
  const m = mmYy.trim();
  if (!/^\d{2}\/\d{2}$/.test(m)) return false;
  const [mm, yy] = m.split("/").map(Number);
  if (mm < 1 || mm > 12) return false;
  const year = 2000 + yy;
  const now = new Date();
  const lastDay = new Date(year, mm, 0);
  return lastDay >= new Date(now.getFullYear(), now.getMonth(), 1);
}

function passesLuhn(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export default function MockPaymentPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [payload, setPayload] = useState<MockPaymentPayload | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setPayload(null);
        setReady(true);
        return;
      }
      const p = JSON.parse(raw) as MockPaymentPayload;
      if (!p?.bookingId || !p?.ticketEmail) {
        setPayload(null);
        setReady(true);
        return;
      }
      setPayload(p);
    } catch {
      setPayload(null);
    }
    setReady(true);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!payload) return;

    const num = digitsOnly(cardNumber);
    if (num.length < 13 || num.length > 19) {
      setError("Enter a valid card number length (demo: 13–19 digits).");
      return;
    }
    if (!passesLuhn(num)) {
      setError("Card number failed check digit (try 4242 4242 4242 4242 for demo).");
      return;
    }
    if (!cardName.trim()) {
      setError("Enter the name on card.");
      return;
    }
    if (!isValidExpiry(expiry)) {
      setError("Enter expiry as MM/YY with a valid month.");
      return;
    }
    const cv = digitsOnly(cvv);
    if (cv.length < 3 || cv.length > 4) {
      setError("Enter CVV (3 or 4 digits).");
      return;
    }

    setLoading(true);
    try {
      const basic = btoa("payment-user:payment-pass");
      const body: Record<string, unknown> = {
        bookingId: payload.bookingId,
        userId: payload.userId,
        ticketEmail: payload.ticketEmail,
        guestName: payload.guestName,
        amount: payload.amount,
        paymentMethod: "CARD",
      };
      if (!payload.userId) {
        body.userId = null;
      }

      const res = await fetch(`${getGatewayBaseUrl()}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basic}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { message?: string })?.message || "Payment failed"
        );
      }

      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.setItem(
        "mockPaymentResult",
        JSON.stringify({
          status: data.status,
          ticketCode: data.ticketCode,
          paymentId: data.paymentId,
          bookingId: payload.bookingId,
        })
      );
      router.push("/?payment=mock_success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <MotionPageShell>
        <div className="text-white p-6">Loading…</div>
      </MotionPageShell>
    );
  }

  if (!payload) {
    return (
      <MotionPageShell>
        <div className="text-white max-w-lg mx-auto p-6">
          <h1 className="text-2xl font-semibold">Payment</h1>
          <p className="mt-4 text-white/70">
            No booking context found. Reserve seats from the home page first.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 px-5 py-2.5 text-sm"
          >
            Back to booking
          </Link>
        </div>
      </MotionPageShell>
    );
  }

  return (
    <MotionPageShell>
      <div className="text-white max-w-md mx-auto px-4 py-8">
        <Link href="/" className="text-sm text-white/60 hover:text-white">
          ← Back to seats
        </Link>
        <h1 className="text-3xl font-semibold mt-4">Demo payment</h1>
        <p className="mt-2 text-amber-200/90 text-sm border border-amber-400/30 rounded-xl p-3 bg-amber-500/10">
          <strong>Demo only.</strong> Do not enter real card numbers. This form is
          for screenshots and mock gateway testing only — card data is not sent to
          the server (only booking + amount are posted to the payment API).
        </p>
        <p className="mt-2 text-white/60 text-sm">
          Booking{" "}
          <span className="font-mono text-fuchsia-200">{payload.bookingId}</span>
          {" · "}
          USD {payload.amount.toFixed(2)}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm text-white/70">Name on card</label>
            <input
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white"
              placeholder="Jane Doe"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70">Card number</label>
            <input
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardDisplay(e.target.value))}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white font-mono"
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70">Expiry (MM/YY)</label>
              <input
                value={expiry}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "");
                  if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2, 4);
                  setExpiry(v.slice(0, 5));
                }}
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white font-mono"
                placeholder="12/28"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70">CVV</label>
              <input
                value={cvv}
                onChange={(e) => setCvv(digitsOnly(e.target.value).slice(0, 4))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white font-mono"
                placeholder="123"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/70">Billing ZIP (optional)</label>
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white"
              placeholder="optional"
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 p-3 text-fuchsia-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 transition disabled:opacity-60"
          >
            {loading ? "Processing…" : "Pay now (demo)"}
          </button>
        </form>
      </div>
    </MotionPageShell>
  );
}
