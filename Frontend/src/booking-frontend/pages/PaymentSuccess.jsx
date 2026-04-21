import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createPayment } from '../services/paymentApi';
import './PaymentPage.css';

const STORAGE_KEY = 'stripePaymentReturn';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('working');
  const [message, setMessage] = useState('');
  const [ticketCode, setTicketCode] = useState(null);

  useEffect(() => {
    const sessionId =
      searchParams.get('session_id') || searchParams.get('stripeCheckoutSessionId');
    const bookingIdParam = searchParams.get('bookingId');

    let raw;
    try {
      raw = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }

    if (!sessionId) {
      setStatus('error');
      setMessage('Missing Stripe session. Return to movies and try again.');
      return;
    }

    let ctx = null;
    if (raw) {
      try {
        ctx = JSON.parse(raw);
      } catch {
        ctx = null;
      }
    }

    const bookingId = ctx?.bookingId || bookingIdParam;
    const amount = ctx?.amount ?? parseFloat(searchParams.get('amount') || '0');

    if (!bookingId || !amount || amount < 1) {
      setStatus('error');
      setMessage(
        'Could not restore booking context after payment. Check your email or profile for the booking.'
      );
      return;
    }

    (async () => {
      try {
        const data = await createPayment({
          bookingId,
          stripeCheckoutSessionId: sessionId,
          amount,
          paymentMethod: 'CARD',
          userId: ctx?.userId || undefined,
          ticketEmail: ctx?.ticketEmail,
          guestName: ctx?.guestName || undefined,
        });

        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }

        if (data.status === 'SUCCESS') {
          setStatus('ok');
          setMessage('Payment confirmed. Your booking is updated.');
          if (data.ticketCode) setTicketCode(data.ticketCode);
        } else {
          setStatus('error');
          setMessage(data.message || `Payment status: ${data.status}`);
        }
      } catch (err) {
        setStatus('error');
        setMessage(
          err?.response?.data?.message ||
            err?.message ||
            'Could not confirm payment with the server.'
        );
      }
    })();
  }, [searchParams]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  return (
    <div className="payment-page">
      <h1>Payment</h1>
      {status === 'working' && <p>Confirming your payment…</p>}
      {status === 'ok' && (
        <>
          <p className="payment-demo-note">{message}</p>
          {ticketCode && (
            <p className="payment-meta">
              Ticket code: <span className="mono">{ticketCode}</span>
            </p>
          )}
          {token ? (
            <button type="button" className="btn btn-primary" onClick={() => navigate('/profile')}>
              Go to profile
            </button>
          ) : (
            <Link to="/movies" className="btn btn-primary">
              Browse movies
            </Link>
          )}
        </>
      )}
      {status === 'error' && (
        <>
          <div className="error-message">{message}</div>
          <Link to="/movies" className="btn btn-primary">
            Back to movies
          </Link>
        </>
      )}
    </div>
  );
}
