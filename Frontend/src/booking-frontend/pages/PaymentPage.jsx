import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { processPayment } from '../services/paymentApi';
import './PaymentPage.css';

const STORAGE_KEY = 'mockPaymentPayload';

function digitsOnly(s) {
  return s.replace(/\D/g, '');
}

function formatCardDisplay(value) {
  const d = digitsOnly(value).slice(0, 16);
  return d.replace(/(.{4})/g, '$1 ').trim();
}

function isValidExpiry(mmYy) {
  const m = mmYy.trim();
  if (!/^\d{2}\/\d{2}$/.test(m)) return false;
  const [mm, yy] = m.split('/').map(Number);
  if (mm < 1 || mm > 12) return false;
  const year = 2000 + yy;
  const now = new Date();
  const lastDay = new Date(year, mm, 0);
  return lastDay >= new Date(now.getFullYear(), now.getMonth(), 1);
}

function passesLuhn(digits) {
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

export default function PaymentPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [payload, setPayload] = useState(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setPayload(null);
        setReady(true);
        return;
      }
      const p = JSON.parse(raw);
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!payload) return;

    const num = digitsOnly(cardNumber);
    if (num.length < 13 || num.length > 19) {
      setError('Enter a valid card number length (demo: 13–19 digits).');
      return;
    }
    if (!passesLuhn(num)) {
      setError('Card number failed check digit (try 4242 4242 4242 4242 for demo).');
      return;
    }
    if (!cardName.trim()) {
      setError('Enter the name on card.');
      return;
    }
    if (!isValidExpiry(expiry)) {
      setError('Enter expiry as MM/YY with a valid month.');
      return;
    }
    const cv = digitsOnly(cvv);
    if (cv.length < 3 || cv.length > 4) {
      setError('Enter CVV (3 or 4 digits).');
      return;
    }

    setLoading(true);
    try {
      const body = {
        bookingId: payload.bookingId,
        userId: payload.userId || undefined,
        ticketEmail: payload.ticketEmail,
        guestName: payload.guestName || undefined,
        amount: payload.amount,
        paymentMethod: 'CARD',
      };
      const data = await processPayment(body);
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.setItem(
        'mockPaymentResult',
        JSON.stringify({
          status: data.status,
          ticketCode: data.ticketCode,
          paymentId: data.paymentId,
          bookingId: payload.bookingId,
        })
      );
      navigate('/profile?payment=success');
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return <div className="payment-page">Loading…</div>;
  }

  if (!payload) {
    return (
      <div className="payment-page">
        <h1>Payment</h1>
        <p>No booking context. Reserve seats from a movie first.</p>
        <Link to="/movies" className="btn btn-primary">
          Browse movies
        </Link>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <Link to="/movies" className="payment-back">
        ← Back to movies
      </Link>
      <h1>Demo payment</h1>
      <p className="payment-demo-note">
        <strong>Demo only.</strong> Card fields are validated locally; the server receives booking id
        and amount via the payment API (mock gateway).
      </p>
      <p className="payment-meta">
        Booking <span className="mono">{payload.bookingId}</span> · USD {Number(payload.amount).toFixed(2)}
      </p>

      <form onSubmit={onSubmit} className="payment-form">
        <div className="form-group">
          <label>Name on card</label>
          <input
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="form-group">
          <label>Card number</label>
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardDisplay(e.target.value))}
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
          />
        </div>
        <div className="form-group grid-2">
          <div>
            <label>Expiry</label>
            <input
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
            />
          </div>
          <div>
            <label>CVV</label>
            <input
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              inputMode="numeric"
            />
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Processing…' : 'Pay now'}
        </button>
      </form>
    </div>
  );
}
