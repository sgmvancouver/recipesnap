import { useState, useEffect } from 'react';

export default function CookMode({ recipe, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Prevent scroll on body when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const toggleStep = (idx) => {
    const next = new Set(completedSteps);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setCompletedSteps(next);
  };

  const progress = Math.round((completedSteps.size / recipe.steps.length) * 100);

  return (
    <div className="cook-mode-overlay" role="dialog" aria-modal="true" aria-label="Cook Mode">
      <header className="cook-mode-header">
        <div className="container flex-between">
          <button className="btn-icon" onClick={onClose} aria-label="Exit Cook Mode">✕</button>
          <div className="cook-mode-title">{recipe.title}</div>
          <div className="cook-mode-progress-text">{progress}% Done</div>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="cook-mode-content container">
        <section className="cook-mode-step-section">
          <div className="step-card">
            <div className="step-number">Step {currentStep + 1} of {recipe.steps.length}</div>
            <p className="step-text">{recipe.steps[currentStep]}</p>
            <div className="step-actions">
              <button 
                className={`btn btn-large ${completedSteps.has(currentStep) ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => toggleStep(currentStep)}
              >
                {completedSteps.has(currentStep) ? '✓ Completed' : 'Mark as Done'}
              </button>
            </div>
          </div>
        </section>

        <section className="cook-mode-ingredients-brief">
          <h3>Ingredients</h3>
          <ul className="mini-ingredients-list">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>{ing.original || (ing.quantity ? `${ing.quantity} ${ing.unit || ''} ${ing.name}` : ing.name)}</li>
            ))}
          </ul>
        </section>

        <nav className="cook-mode-nav">
          <button 
            className="btn-icon-large" 
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(prev => prev - 1)}
          >
            ← Previous
          </button>
          <div className="step-indicator">
            {recipe.steps.map((_, i) => (
              <span key={i} className={`dot ${i === currentStep ? 'active' : ''} ${completedSteps.has(i) ? 'done' : ''}`} />
            ))}
          </div>
          <button 
            className="btn-icon-large" 
            disabled={currentStep === recipe.steps.length - 1}
            onClick={() => setCurrentStep(prev => prev + 1)}
          >
            Next →
          </button>
        </nav>
      </div>
    </div>
  );
}
