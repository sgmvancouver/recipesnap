import { useState } from 'react';
import ScalingControls from './ScalingControls';
import { scaleQuantity, updateRecipe } from '../services/storageService';

export default function RecipeView({ recipe, onSave, isSaved, onNewRecipe, onCookMode }) {
  const [multiplier, setMultiplier] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [activeStep, setActiveStep] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(recipe);

  const handleScale = (factor) => {
    if (factor === null) setMultiplier(1);
    else setMultiplier(multiplier * factor);
  };

  const toggleIngredient = (idx) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const currentServings = recipe.servings ? Math.round(recipe.servings * multiplier) : null;

  const handleCopy = async () => {
    const text = [
      recipe.title,
      '',
      'INGREDIENTS',
      ...recipe.ingredients.map(ing => {
        const qty = scaleQuantity(ing.quantity, multiplier);
        return qty ? `${qty} ${ing.unit || ''} ${ing.name}` : ing.original;
      }),
      '',
      'INSTRUCTIONS',
      ...recipe.steps.map((s, i) => `${i + 1}. ${s}`),
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (isSaved) {
      updateRecipe(recipe.id, editedRecipe);
    }
    setIsEditing(false);
  };

  const domain = (() => {
    try { return new URL(recipe.sourceUrl).hostname.replace('www.', ''); }
    catch { return recipe.sourceUrl; }
  })();

  return (
    <div className="recipe-result container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      {/* Toolbar */}
      <div className="action-toolbar">
        <div className="toolbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => onNewRecipe()} id="new-recipe-btn">
            ← New
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : '✏️ Edit'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onCookMode(recipe)}>
            👨‍🍳 Cook Mode
          </button>
        </div>
        <div className="toolbar-save-group">
          {isSaved ? (
            <span style={{ fontSize: '13px', color: 'var(--color-green)', fontWeight: 600 }}>
              ✓ Saved to Cookbook
            </span>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onSave} id="save-recipe-btn">
              💾 Save Recipe
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="recipe-editor editor-card">
          <h2 className="section-heading">Edit Recipe</h2>
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              value={editedRecipe.title} 
              onChange={e => setEditedRecipe({...editedRecipe, title: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={editedRecipe.description} 
              onChange={e => setEditedRecipe({...editedRecipe, description: e.target.value})}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
        </div>
      ) : (
        <>
          {/* Hero Image */}
          {recipe.imageUrl && (
            <div className="recipe-hero-image">
              <img src={recipe.imageUrl} alt={recipe.title} loading="lazy" />
            </div>
          )}

          {/* Recipe Header */}
          <div className="recipe-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div>
                <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="recipe-source">
                  🔗 {domain}
                </a>
                <h1 className="recipe-title">{recipe.title}</h1>
              </div>
              <ScalingControls servings={currentServings} onScale={handleScale} />
            </div>
            
            {recipe.description && (
              <p style={{ fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
                {recipe.description}
              </p>
            )}
            
            <div className="recipe-meta">
              {recipe.prepTime && (
                <span className="recipe-meta-tag">⏱️ Prep: {recipe.prepTime}</span>
              )}
              {recipe.cookTime && (
                <span className="recipe-meta-tag">🔥 Cook: {recipe.cookTime}</span>
              )}
              {recipe.tags?.map(tag => (
                <span key={tag} className="recipe-meta-tag tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <section className="recipe-section" aria-label="Ingredients">
            <h2 className="section-heading">Ingredients</h2>
            <div className="ingredients-grid">
              {recipe.ingredients.map((ing, idx) => {
                const qty = scaleQuantity(ing.quantity, multiplier);
                // Build display text — fall back to original if name is missing
                let displayText;
                if (!ing.name) {
                  displayText = ing.original || 'Unknown ingredient';
                } else if (qty !== null) {
                  const parts = [qty, ing.unit, ing.name].filter(Boolean).join(' ').trim();
                  displayText = parts;
                } else {
                  displayText = ing.original || ing.name;
                }

                return (
                  <button
                    key={idx}
                    className={`ingredient-item ${checkedIngredients.has(idx) ? 'checked' : ''}`}
                    onClick={() => toggleIngredient(idx)}
                  >
                    <span className="ingredient-check">
                      {checkedIngredients.has(idx) ? '✓' : ''}
                    </span>
                    {displayText}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Steps */}
          <section className="recipe-section" aria-label="Instructions">
            <h2 className="section-heading">Instructions</h2>
            <div className="steps-list">
              {recipe.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`step-item ${activeStep === idx ? 'active-step' : ''}`}
                  onClick={() => setActiveStep(activeStep === idx ? null : idx)}
                >
                  <span className="step-number">{idx + 1}</span>
                  <p className="step-text">{step}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
