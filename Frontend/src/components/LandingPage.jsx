import { NavLink } from 'react-router-dom';

export default function LandingPage() {
  return (
    <main className="landing-main">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-bg" aria-hidden />
        <div className="landing-hero-inner">
          <p className="landing-eyebrow">Cinema tickets, reimagined</p>
          <h1 id="landing-title" className="landing-title">
            Book your next night at the movies
          </h1>
          <p className="landing-lead">
            Pick a show, choose your seats, and pay securely — all in one place. Built for speed,
            clarity, and a smooth checkout experience.
          </p>
          <div className="landing-hero-actions">
            <NavLink to="/movies" className="btn-landing btn-landing-primary">
              Browse movies
            </NavLink>
            <NavLink to="/register" className="btn-landing btn-landing-secondary">
              Create an account
            </NavLink>
          </div>
          <ul className="landing-trust" aria-label="Highlights">
            <li>
              <span className="landing-trust-icon" aria-hidden>
                ✓
              </span>
              Real-time seat map
            </li>
            <li>
              <span className="landing-trust-icon" aria-hidden>
                ✓
              </span>
              Stripe checkout
            </li>
            <li>
              <span className="landing-trust-icon" aria-hidden>
                ✓
              </span>
              Instant confirmation
            </li>
          </ul>
        </div>
      </section>

      <section className="landing-features" aria-labelledby="features-title">
        <div className="landing-section-head">
          <h2 id="features-title">How it works</h2>
          <p>Three steps from browsing to your seat.</p>
        </div>
        <div className="landing-feature-grid">
          <article className="landing-card">
            <div className="landing-card-icon" aria-hidden>
              🎬
            </div>
            <h3>Choose a film &amp; time</h3>
            <p>
              Explore what&apos;s playing and pick a schedule that fits you. Posters and details
              keep choices clear.
            </p>
          </article>
          <article className="landing-card">
            <div className="landing-card-icon" aria-hidden>
              🎫
            </div>
            <h3>Select your seats</h3>
            <p>
              See what&apos;s already taken and lock in your spots with an interactive seat map
              before you pay.
            </p>
          </article>
          <article className="landing-card">
            <div className="landing-card-icon" aria-hidden>
              🔒
            </div>
            <h3>Pay securely</h3>
            <p>
              Complete checkout with trusted payment processing. Your booking updates as soon as
              payment succeeds.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-bottom-cta" aria-labelledby="cta-title">
        <div className="landing-bottom-inner">
          <h2 id="cta-title">Ready for the opening credits?</h2>
          <p>Jump into showtimes or sign in to see your bookings.</p>
          <div className="landing-hero-actions">
            <NavLink to="/schedules" className="btn-landing btn-landing-primary">
              View schedules
            </NavLink>
            <NavLink to="/login" className="btn-landing btn-landing-ghost">
              Sign in
            </NavLink>
          </div>
        </div>
      </section>
    </main>
  );
}
