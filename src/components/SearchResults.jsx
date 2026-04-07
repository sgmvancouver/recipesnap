export default function SearchResults({ query, results, onRecipeClick, onSave, onBack }) {
  return (
    <div className="search-results-view">
      <div className="container">
        <header className="results-header">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            ← Back to Search
          </button>
          <div className="results-title-group">
            <h2 className="results-title">Found for "{query}"</h2>
            <p className="results-subtitle">Found {results.length} top-rated recipes from the web.</p>
          </div>
        </header>

        <div className="results-grid">
          {results.map((recipe, index) => (
            <article 
              key={index} 
              className="result-card clickable" 
              onClick={() => onRecipeClick(recipe)}
            >
              <div className="result-image">
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt={recipe.title} />
                ) : (
                  <div className="image-placeholder">{recipe.emoji || '🍴'}</div>
                )}
                <div className="result-source-tag">{recipe.source || 'Classic Recipe'}</div>
              </div>
              <div className="result-content">
                <h3 className="result-name">{recipe.title}</h3>
                <p className="result-desc">{recipe.description || 'A high-quality, extracted recipe ready to cook.'}</p>
                <div className="result-meta">
                  <span>⏱️ {recipe.prepTime || '--'} prep</span>
                  <span>🍳 {recipe.cookTime || '--'} cook</span>
                </div>
                <div className="result-actions">
                  <button 
                    className="btn btn-primary btn-sm btn-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSave(recipe);
                    }}
                  >
                    ⭐ Save to Cookbook
                  </button>
                </div>
              </div>
            </article>
          ))}
          
          {results.length === 0 && (
            <div className="results-empty">
              <span className="empty-icon">📂</span>
              <h3>No recipes found for "{query}"</h3>
              <p>Try searching for classic dishes like "Roast Chicken" or "Chocolate Cake".</p>
              <button className="btn btn-primary" onClick={onBack}>Try Another Search</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
