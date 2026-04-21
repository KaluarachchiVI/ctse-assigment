import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import SeatSelection from '../components/SeatSelection';
import { buildDefaultSeatLayout } from '../utils/buildDefaultSeatLayout';
import { bookingApi } from '../services/bookingApi';
import { createPayment } from '../services/paymentApi';
import { getGatewayBaseUrl } from '../../lib/gateway';
import './CreateBooking.css';

/** Demo card page at /payment — opt-in (requires PAYMENT_GATEWAY_PROVIDER=mock on the server). */
const USE_MOCK_PAYMENT = import.meta.env.VITE_USE_MOCK_PAYMENT_PAGE === 'true';

const STRIPE_RETURN_KEY = 'stripePaymentReturn';

export default function CreateBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scheduleId = searchParams.get('scheduleId') || '';
  const movieId = searchParams.get('movieId') || '';

  const [schedule, setSchedule] = useState(null);
  const [movieTitle, setMovieTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const [ticketEmail, setTicketEmail] = useState('');
  const [guestName, setGuestName] = useState('');

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    const em = localStorage.getItem('email');
    const nm = localStorage.getItem('name');
    if (em) setTicketEmail(em);
    if (nm) setGuestName(nm);
  }, []);

  useEffect(() => {
    if (!scheduleId) {
      setLoading(false);
      setError('Missing schedule. Open this page from a movie’s “Book Now” link.');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const base = getGatewayBaseUrl();
        const schRes = await api.get(`/schedules/${encodeURIComponent(scheduleId)}`);
        if (cancelled) return;
        setSchedule(schRes.data);
        if (movieId) {
          try {
            const mRes = await api.get(`/movies/${encodeURIComponent(movieId)}`);
            if (!cancelled) setMovieTitle(mRes.data?.title || '');
          } catch {
            /* optional */
          }
        }
      } catch {
        if (!cancelled) setError('Could not load this show. It may have been removed.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scheduleId, movieId]);

  useEffect(() => {
    if (!scheduleId) return;
    let cancelled = false;
    (async () => {
      try {
        const seats = await bookingApi.getConfirmedSeats(scheduleId);
        if (!cancelled) {
          setOccupiedSeats((seats || []).map((s) => String(s).toUpperCase().trim()));
        }
      } catch {
        if (!cancelled) setOccupiedSeats([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scheduleId]);

  const seatLayout = useMemo(
    () => buildDefaultSeatLayout(schedule?.price ?? 12),
    [schedule?.price]
  );

  const toggleSeat = useCallback((seatId) => {
    const n = seatId.toUpperCase().trim();
    setSelectedSeats((prev) => {
      const set = new Set(prev.map((s) => s.toUpperCase().trim()));
      if (set.has(n)) return prev.filter((s) => s.toUpperCase().trim() !== n);
      return [...prev, n];
    });
  }, []);

  const totalAmount = useMemo(() => {
    if (!schedule || selectedSeats.length === 0) return 0;
    return Math.max(1, Number(schedule.price) * selectedSeats.length);
  }, [schedule, selectedSeats.length]);

  const validate = () => {
    if (!scheduleId) return 'Invalid schedule.';
    if (selectedSeats.length === 0) return 'Select at least one seat.';
    if (userId) {
      if (!ticketEmail.trim()) return 'Your account email is missing. Log in again.';
    } else {
      if (!ticketEmail.trim()) return 'Ticket email is required.';
      if (!guestName.trim()) return 'Guest name is required for guest checkout.';
    }
    return null;
  };

  const handleConfirmBooking = async () => {
    setError('');
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        userId: userId || null,
        showId: scheduleId,
        seats: selectedSeats,
        paymentId: 'PENDING',
        status: 'PENDING',
        ticketEmail: ticketEmail.trim(),
        guestName: userId ? guestName.trim() || undefined : guestName.trim(),
      };
      const booking = await bookingApi.createBookingV2(payload);
      const bookingId = booking?.id;
      if (!bookingId) throw new Error('Booking created but id missing.');

      if (USE_MOCK_PAYMENT) {
        sessionStorage.setItem(
          'mockPaymentPayload',
          JSON.stringify({
            bookingId,
            userId: userId || null,
            ticketEmail: ticketEmail.trim(),
            guestName: (guestName || '').trim(),
            amount: totalAmount,
          })
        );
        navigate('/payment');
        return;
      }

      const origin = window.location.origin;
      const successUrl = `${origin}/payment/success?bookingId=${encodeURIComponent(bookingId)}&amount=${totalAmount}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/bookings/new?scheduleId=${encodeURIComponent(scheduleId)}&movieId=${encodeURIComponent(movieId || '')}`;

      sessionStorage.setItem(
        STRIPE_RETURN_KEY,
        JSON.stringify({
          bookingId,
          userId: userId || null,
          ticketEmail: ticketEmail.trim(),
          guestName: (guestName || '').trim(),
          amount: totalAmount,
        })
      );

      const pay = await createPayment({
        bookingId,
        userId: userId || undefined,
        ticketEmail: ticketEmail.trim(),
        guestName: (guestName || '').trim() || undefined,
        amount: totalAmount,
        paymentMethod: 'CARD',
        successUrl,
        cancelUrl,
      });

      if (pay?.checkoutUrl) {
        window.location.href = pay.checkoutUrl;
        return;
      }

      throw new Error('Payment service did not return a Stripe checkout URL. Is PAYMENT_GATEWAY_PROVIDER=stripe and STRIPE_API_KEY set?');
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Booking or payment failed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!scheduleId) {
    return (
      <div className="create-booking-container">
        <p className="error-message">{error || 'No schedule selected.'}</p>
        <Link to="/movies" className="btn btn-primary">
          Browse movies
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="create-booking-container">
        <p>Loading show…</p>
      </div>
    );
  }

  if (error && !schedule) {
    return (
      <div className="create-booking-container">
        <p className="error-message">{error}</p>
        <Link to="/movies" className="btn btn-primary">
          Back to movies
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in create-booking-container booking-seat-flow">
      <div className="page-header">
        <h1 className="page-title">Select seats</h1>
        <p className="page-description">
          {movieTitle && <span>{movieTitle} · </span>}
          {schedule &&
            `${schedule.hallId} · ${String(schedule.date)} · ${String(schedule.time)}`}
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!userId && (
        <div className="card guest-fields">
          <h3>Guest checkout</h3>
          <div className="form-group">
            <label className="form-label">Email (for ticket)</label>
            <input
              className="form-input"
              type="email"
              value={ticketEmail}
              onChange={(e) => setTicketEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input
              className="form-input"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      {userId && (
        <div className="card guest-fields subtle">
          <p>
            Logged in as <strong>{ticketEmail || '—'}</strong>. Ticket will use your profile
            name and email.
          </p>
        </div>
      )}

      <SeatSelection
        layout={seatLayout}
        selectedSeats={selectedSeats}
        occupiedSeats={occupiedSeats}
        onSeatSelect={toggleSeat}
      />

      <div className="booking-summary card">
        <div>
          Seats: {selectedSeats.length ? selectedSeats.join(', ') : '—'}
        </div>
        <div>Total: ${totalAmount.toFixed(2)}</div>
        <button
          type="button"
          className="btn btn-primary btn-submit"
          disabled={submitting || !schedule}
          onClick={handleConfirmBooking}
        >
          {submitting ? 'Processing…' : USE_MOCK_PAYMENT ? 'Continue to payment' : 'Pay & confirm'}
        </button>
        {USE_MOCK_PAYMENT && (
          <p className="text-muted small">
            Demo card page uses the mock payment gateway (server PAYMENT_GATEWAY_PROVIDER=mock).
          </p>
        )}
      </div>
    </div>
  );
}
