import { useState } from 'react';

const FEATURES = [
  { icon: '📚', text: 'Save unlimited recipes to your personal cookbook' },
  { icon: '🏷️', text: 'Organize into custom categories (Weeknight Dinners, Baking, etc.)' },
  { icon: '🔍', text: 'Search and filter by ingredients or category' },
  { icon: '☁️', text: 'Priority support and early access to new features' },
];

export default function PremiumModal({ onClose, onSubscribe, freeUsed, freeMax }) {
  const [selected, setSelected] = useState('annual');

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-title"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close premium modal"
          id="modal-close-btn"
        >
          ×
        </button>

        <div className="modal-icon">🍴</div>
        <h2 className="modal-title" id="premium-title">
          Upgrade to RecipeSnap Pro
        </h2>
        <p className="modal-subtitle">
          You've saved {freeUsed}/{freeMax} free recipes. Unlock unlimited saves,
          custom categories, and more for less than a coffee a month.
        </p>

        <ul className="modal-features" aria-label="Premium features">
          {FEATURES.map((f, i) => (
            <li key={i} className="modal-feature">
              <span className="modal-feature-icon" aria-hidden="true">{f.icon}</span>
              {f.text}
            </li>
          ))}
        </ul>

        <div className="pricing-options" role="radiogroup" aria-label="Pricing options">
          <button
            className={`price-option ${selected === 'annual' ? 'selected' : ''}`}
            onClick={() => setSelected('annual')}
            role="radio"
            aria-checked={selected === 'annual'}
            id="annual-plan-btn"
          >
            <div className="price-option-label">Annual</div>
            <div className="price-option-amount">$14.99</div>
            <div className="price-option-period">per year</div>
            <div className="price-option-badge">Save 37%</div>
          </button>
          <button
            className={`price-option ${selected === 'monthly' ? 'selected' : ''}`}
            onClick={() => setSelected('monthly')}
            role="radio"
            aria-checked={selected === 'monthly'}
            id="monthly-plan-btn"
          >
            <div className="price-option-label">Monthly</div>
            <div className="price-option-amount">$1.99</div>
            <div className="price-option-period">per month</div>
          </button>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-5)' }}
          onClick={() => {
            // Priority: Real Stripe links in Production/Env
            const stripeUrl = selected === 'annual' 
              ? import.meta.env.VITE_STRIPE_PAYMENT_LINK_ANNUAL 
              : import.meta.env.VITE_STRIPE_PAYMENT_LINK_MONTHLY;
              
            if (stripeUrl) {
              window.location.href = stripeUrl;
            } else {
              alert("Stripe link not found! Check your .env.local file or Netlify environment variables.");
              onSubscribe(selected); // fallback temporarily
            }
          }}
          id="subscribe-btn"
        >
          Get RecipeSnap Pro →
        </button>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Cancel anytime · Secure payment · Instant access
        </p>
      </div>
    </div>
  );
}
