import { useState, useEffect } from 'react';
import { getMealPlan, saveMealPlan } from '../services/storageService';

export default function MealPlannerView({ recipes, onRecipeClick }) {
  const [mealPlan, setMealPlan] = useState({});
  const [isAssigning, setIsAssigning] = useState(null); // day name
  const [searchQuery, setSearchQuery] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    setMealPlan(getMealPlan());
  }, []);

  const handleAssign = (day, recipeId) => {
    const updated = { ...mealPlan, [day]: recipeId };
    setMealPlan(updated);
    saveMealPlan(updated);
    setIsAssigning(null);
  };

  const handleClear = (day) => {
    const updated = { ...mealPlan };
    delete updated[day];
    setMealPlan(updated);
    saveMealPlan(updated);
  };

  const filteredRecipes = recipes.filter(r => 
    !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container" style={{ paddingTop: 'var(--space-10)', paddingBottom: 'var(--space-16)' }}>
      <h1 className="section-title">Weekly Meal Planner</h1>
      
      <div className="planner-grid">
        {days.map(day => {
          const recipeId = mealPlan[day];
          const recipe = recipes.find(r => r.id === recipeId);
          
          return (
            <div key={day} className="planner-day-card">
              <h3 className="planner-day-name">{day}</h3>
              {recipe ? (
                <div className="planner-recipe-assigned" onClick={() => onRecipeClick(recipe)}>
                  <span className="planner-recipe-emoji">{recipe.emoji || '🍴'}</span>
                  <div className="planner-recipe-info">
                    <p className="planner-recipe-title">{recipe.title}</p>
                    <button 
                      className="btn btn-ghost btn-xs" 
                      onClick={(e) => { e.stopPropagation(); handleClear(day); }}
                      style={{ color: 'var(--color-red)', padding: 0 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-secondary btn-block btn-sm" onClick={() => setIsAssigning(day)}>
                  + Assign Recipe
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isAssigning && (
        <div className="modal-overlay" onClick={() => setIsAssigning(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 className="modal-title">Assign to {isAssigning}</h2>
            <input 
              type="search" 
              className="url-input" 
              placeholder="Search your cookbook..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ marginBottom: 'var(--space-4)' }}
              autoFocus
            />
            <div className="modal-scroll-area" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {recipes.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)' }}>
                  Your cookbook is empty! Save some recipes first.
                </p>
              ) : filteredRecipes.map(recipe => (
                <div 
                  key={recipe.id} 
                  className="assign-list-item"
                  onClick={() => handleAssign(isAssigning, recipe.id)}
                >
                  <span>{recipe.emoji || '🍴'}</span>
                  <span>{recipe.title}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-4)' }} onClick={() => setIsAssigning(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
