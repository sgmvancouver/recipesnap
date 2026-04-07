import { useState } from 'react';

const STEPS = [
  { key: 'fetching',   label: 'Fetching page…' },
  { key: 'parsing',    label: 'Stripping the bloat…' },
  { key: 'extracting', label: 'AI extracting recipe…' },
  { key: 'done',       label: 'Done!' },
];

export default function ExtractorCard({ onExtract, onSearch, isLoading, progress, error }) {
  const [inputValue, setInputValue] = useState('');

  const isUrl = (string) => {
    try {
      new URL(string);
      return string.includes('.');
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) return;

    if (isUrl(val)) {
      onExtract(val);
    } else {
      onSearch(val);
    }
  };

  const currentStepIdx = STEPS.findIndex(s => s.key === progress);

  return (
    <section aria-label="Recipe extractor">
      <div className="hero">
        <div className="hero-badge">AI-Powered · Discovery Ready</div>
        <h1 className="hero-title">
          Bloat Free <span className="highlight">Recipes.</span>
        </h1>
        <p className="hero-subtitle">
          Paste any recipe URL <strong>or just type a dish name</strong> like "Tacos" or "Lasagna". 
          We'll find and extract the best options for you.
        </p>

        <div className="extractor-card">
          <form onSubmit={handleSubmit} id="extractor-form">
            <label className="input-label" htmlFor="recipe-input">
              {isUrl(inputValue) ? 'Recipe URL' : 'Search for a dish'}
            </label>
            <div className="url-input-group">
              <div className="input-prefix-icon" aria-hidden="true">
                {isUrl(inputValue) ? '🔗' : '🔍'}
              </div>
              <input
                id="recipe-input"
                type="text"
                className="url-input"
                placeholder="Paste a URL or type 'Best Roast Chicken'..."
                style={{ paddingLeft: '40px' }}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={isLoading}
                aria-describedby={error ? 'extract-error' : undefined}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || !inputValue.trim()}
                id="extract-btn"
              >
                {isLoading ? 'Thinking…' : (isUrl(inputValue) ? '✨ Extract' : '🔍 Find Recipes')}
              </button>
            </div>
          </form>

          {isLoading && (
            <div className="loading-state" role="status" aria-live="polite">
              <div className="spinner" aria-hidden="true" />
              <div className="loading-steps">
                {STEPS.slice(0, -1).map((step, idx) => (
                  <div
                    key={step.key}
                    className={`loading-step ${
                      idx < currentStepIdx ? 'done' :
                      idx === currentStepIdx ? 'active' : 'pending'
                    }`}
                  >
                    <span className="step-icon" aria-hidden="true">
                      {idx < currentStepIdx ? '✓' : idx === currentStepIdx ? '◌' : '○'}
                    </span>
                    {step.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="error-message" id="extract-error" role="alert">
              <span className="error-icon" aria-hidden="true">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <p style={{ marginTop: 'var(--space-5)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Powered by Gemini AI · Automatically scrubs ads, popups, and filler stories
        </p>
      </div>
    </section>
  );
}
