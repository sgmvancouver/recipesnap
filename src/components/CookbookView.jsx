import { useState } from 'react';
import { deleteRecipe, getCategories, saveToShoppingList, syncWithCloud } from '../services/storageService';

export default function CookbookView({ recipes, onRecipeClick, onRecipesChange, onUpgrade, onGoToList, user }) {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    const res = await syncWithCloud(user);
    setIsSyncing(false);
    if (res.success) {
      alert(`Synced ${res.count} recipes to your cloud account! ☁️`);
    } else {
      alert(`Sync failed: ${res.message}`);
    }
  };
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const categories = ['All', ...getCategories()];

  const filtered = recipes.filter(recipe => {
    const matchesCategory = activeCategory === 'All' || recipe.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      recipe.title?.toLowerCase().includes(q) ||
      recipe.ingredients?.some(i => {
        const text = typeof i === 'string' ? i : (i.name + ' ' + (i.original || ''));
        return text.toLowerCase().includes(q);
      }) ||
      recipe.category?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Remove this recipe from your cookbook?')) {
      deleteRecipe(id);
      onRecipesChange();
    }
  };

  const toggleSelect = (e, id) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAddToShoppingList = () => {
    const selectedRecipes = recipes.filter(r => selectedIds.has(r.id));
    const allIngredients = selectedRecipes.flatMap(r => r.ingredients);
    saveToShoppingList(allIngredients);
    
    setIsSelectMode(false);
    setSelectedIds(new Set());
    onGoToList();
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-10)', paddingBottom: 'var(--space-16)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <h1 className="section-title" style={{ marginBottom: 0 }}>
          My Cookbook
        </h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {user && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={handleSync} 
              disabled={isSyncing}
              style={{ background: isSyncing ? 'var(--color-surface-2)' : '' }}
            >
              {isSyncing ? '⌛ Syncing...' : '☁️ Cloud Sync'}
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setIsSelectMode(!isSelectMode)}>
            {isSelectMode ? 'Cancel Selection' : '🛒 Create List'}
          </button>
          {!isSelectMode && (
            <button className="btn btn-primary btn-sm" onClick={onUpgrade} id="upgrade-btn">
              ⭐ Go Pro
            </button>
          )}
        </div>
      </div>

      {isSelectMode && selectedIds.size > 0 && (
        <div className="selection-bar">
          <span>{selectedIds.size} recipes selected</span>
          <button className="btn btn-primary btn-sm" onClick={handleAddToShoppingList}>
            ✨ Add {selectedIds.size} Recipes to List
          </button>
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📖</div>
          <h2 className="empty-state-title">Your cookbook is empty</h2>
          <p className="empty-state-text">
            Search for a recipe and click "Save Recipe" to add it here
          </p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="search"
              placeholder="Search recipes or ingredients…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="url-input"
              style={{ maxWidth: '300px', padding: 'var(--space-3) var(--space-4)' }}
              aria-label="Search saved recipes"
              id="cookbook-search"
            />
            {categories.map(cat => (
              <button
                key={cat}
                className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p className="empty-state-text">No recipes match your search</p>
            </div>
          ) : (
            <div className="cookbook-grid">
              {filtered.map(recipe => (
                <article
                  key={recipe.id}
                  className={`recipe-card ${selectedIds.has(recipe.id) ? 'selected' : ''}`}
                  onClick={(e) => isSelectMode ? toggleSelect(e, recipe.id) : onRecipeClick(recipe)}
                  tabIndex={0}
                  role="button"
                >
                  {isSelectMode && (
                    <div className="select-checkbox" aria-hidden="true">
                      {selectedIds.has(recipe.id) ? '✓' : ''}
                    </div>
                  )}
                  <div className="recipe-card-emoji" aria-hidden="true">{recipe.emoji || '🍴'}</div>
                  <h2 className="recipe-card-title">{recipe.title}</h2>
                  <div className="recipe-card-meta">
                    <span>{recipe.ingredients?.length} ingredients</span>
                    <span>·</span>
                    <span>{recipe.steps?.length} steps</span>
                  </div>
                  {recipe.category && recipe.category !== 'Uncategorized' && (
                    <span className="recipe-card-category">{recipe.category}</span>
                  )}
                  <div className="recipe-card-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={e => handleDelete(e, recipe.id)}
                      style={{ color: 'var(--color-red)', fontSize: '12px' }}
                    >
                      🗑️ Remove
                    </button>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: 'auto', alignSelf: 'center' }}>
                      {new Date(recipe.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
