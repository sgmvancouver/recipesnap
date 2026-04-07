import { useState } from 'react';
import { saveRecipe, getCategories } from '../services/storageService';

export default function SaveModal({ recipe, onClose, onSaved, onUpgrade }) {
  const [category, setCategory] = useState('');
  const existingCategories = getCategories();

  const handleSave = () => {
    const result = saveRecipe(recipe, category.trim() || 'Uncategorized');
    if (result.requiresPremium) {
      onUpgrade();
      return;
    }
    if (result.success) {
      onSaved();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-title"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card" style={{ maxWidth: '380px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close save dialog">×</button>
        <div className="modal-icon">💾</div>
        <h2 className="modal-title" id="save-title" style={{ fontSize: '22px' }}>
          Save to Cookbook
        </h2>
        <p className="modal-subtitle" style={{ fontSize: '14px' }}>
          Add an optional category to keep things organised.
        </p>

        <div className="category-input-wrap">
          <label htmlFor="category-input" className="input-label">Category (optional)</label>
          <input
            id="category-input"
            type="text"
            className="category-input"
            placeholder="e.g. Weeknight Dinners, Baking…"
            value={category}
            onChange={e => setCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            maxLength={40}
            autoFocus
            list="category-suggestions"
          />
          <datalist id="category-suggestions">
            {existingCategories.map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleSave}
            id="confirm-save-btn"
          >
            Save Recipe
          </button>
          <button className="btn btn-secondary" onClick={onClose} id="cancel-save-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
