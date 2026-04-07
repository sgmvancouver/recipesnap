import { useState, useCallback, useEffect } from 'react';
import './index.css';

import Header from './components/Header';
import ExtractorCard from './components/ExtractorCard';
import RecipeView from './components/RecipeView';
import CookbookView from './components/CookbookView';
import PremiumModal from './components/PremiumModal';
import SaveModal from './components/SaveModal';
import Toast from './components/Toast';
import CookMode from './components/CookMode';
import ShoppingListView from './components/ShoppingListView';
import MobileNav from './components/MobileNav';
import SearchResults from './components/SearchResults';

import { extractRecipe, searchRecipes, extractMultiple } from './services/extractorService';
import { getSavedRecipes, saveRecipe, getSaveCount, getMaxFreeSaves, setIsPremium } from './services/storageService';

export default function App() {
  // Navigation
  const [view, setView] = useState('home'); 

  // Discovery State
  const [searchQuery, setSearchQuery] = useState('');
  const [discoveredRecipes, setDiscoveredRecipes] = useState([]);

  // Mobile Detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    
    // Check for Stripe success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      import('./services/storageService').then(({ setIsPremium }) => {
        setIsPremium(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        showToast('Welcome to RecipeSnap Pro! ⭐', 'success');
      });
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Recipe extraction state
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [currentRecipe, setCurrentRecipe] = useState(null);

  // Cookbook state
  const [savedRecipes, setSavedRecipes] = useState(() => getSavedRecipes());
  const [isSaved, setIsSaved] = useState(false);

  // Pro Features state
  const [activeCookRecipe, setActiveCookRecipe] = useState(null);

  // Modal state
  const [showPremium, setShowPremium] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const refreshCookbook = useCallback(() => {
    setSavedRecipes(getSavedRecipes());
  }, []);

  // Extract a single recipe from a URL
  const handleExtract = async (url) => {
    setIsLoading(true);
    setError(null);
    setProgress('fetching');
    setCurrentRecipe(null);
    setIsSaved(false);

    try {
      const recipe = await extractRecipe(url, (step) => setProgress(step));
      setCurrentRecipe(recipe);
      setView('recipe');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  // Search Flow: Discover 4 URLs and extract them
  const handleSearch = async (query) => {
    setIsLoading(true);
    setSearchQuery(query);
    setError(null);
    setProgress('Searching the web...');
    setDiscoveredRecipes([]);

    try {
      // Step 1: Find 4 popular URLs
      const URLs = await searchRecipes(query);
      if (!URLs || !URLs.length) throw new Error('No recipes found. Try a different dish!');

      // Step 2: Extract them all
      setProgress('Extracting matching recipes...');
      const recipes = await extractMultiple(URLs.map(r => r.url));
      
      // Merge in the source info if available
      const enriched = recipes.map((recipe) => ({
        ...recipe,
        source: URLs.find(u => u.url === recipe.sourceUrl)?.source || 'Classic Recipe'
      }));

      if (!enriched.length) throw new Error('We found some links but couldn\'t extract them. Try another dish!');

      setDiscoveredRecipes(enriched);
      setView('search-results');
    } catch (err) {
      setError(err.message || 'Discovery failed. Please try a different search.');
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  // Trigger the save flow
  const handleSaveClick = () => {
    const count = getSaveCount();
    const max = getMaxFreeSaves();
    if (count >= max) {
      setShowPremium(true);
    } else {
      setShowSaveModal(true);
    }
  };

  // After save modal confirmed
  const handleSaved = () => {
    setShowSaveModal(false);
    setIsSaved(true);
    refreshCookbook();
    showToast('Recipe saved to your cookbook! 🎉');
  };

  const handleUpgradeClick = () => setShowPremium(true);

  // Simulate subscribe (Stripe integration would go here)
  const handleSubscribe = (plan) => {
    setIsPremium(true);
    setShowPremium(false);
    showToast(`Welcome to RecipeSnap Pro! (${plan} plan) ⭐`);
  };

  // Navigate to cookbook and click recipe card
  const handleCookbookRecipeClick = (recipe) => {
    setCurrentRecipe(recipe);
    setIsSaved(true);
    setView('recipe');
  };

  const navigate = (dest) => {
    setView(dest);
  };

  return (
    <div className={`app-shell ${isMobile ? 'is-mobile' : ''}`}>
      <Header
        view={view}
        onNavigate={navigate}
        savedCount={savedRecipes.length}
        onUpgrade={handleUpgradeClick}
      />

      <main>
        {view === 'home' && (
          <div className="container">
            <ExtractorCard
              onExtract={handleExtract}
              onSearch={handleSearch}
              isLoading={isLoading}
              progress={progress}
              error={error}
            />
          </div>
        )}

        {view === 'recipe' && currentRecipe && (
          <RecipeView
            recipe={currentRecipe}
            onSave={handleSaveClick}
            isSaved={isSaved}
            onNewRecipe={() => navigate('home')}
            onCookMode={setActiveCookRecipe}
          />
        )}

        {view === 'search-results' && (
          <SearchResults
            query={searchQuery}
            results={discoveredRecipes}
            onBack={() => setView('home')}
            onRecipeClick={(recipe) => {
              setCurrentRecipe(recipe);
              setIsSaved(false);
              setView('recipe');
            }}
            onSave={(recipe) => {
              const res = saveRecipe(recipe);
              if (res.requiresPremium) {
                setShowPremium(true);
              } else {
                refreshCookbook();
                showToast(`"${recipe.title}" saved!`);
              }
            }}
          />
        )}

        {view === 'cookbook' && (
          <CookbookView
            recipes={savedRecipes}
            onRecipeClick={handleCookbookRecipeClick}
            onRecipesChange={refreshCookbook}
            onUpgrade={handleUpgradeClick}
            onGoToList={() => setView('shopping-list')}
          />
        )}

        {view === 'shopping-list' && (
          <ShoppingListView onBack={() => setView('cookbook')} />
        )}
      </main>

      {isMobile ? (
        <MobileNav 
          view={view} 
          onNavigate={navigate} 
          hasPro={getSaveCount() > 5} 
        />
      ) : (
        <footer className="app-footer">
          <div className="container">
            <p>RecipeSnap — Bloat Free Recipes</p>
            <nav className="footer-links" aria-label="Footer links">
              <a href="#" className="footer-link" onClick={() => navigate('home')}>Extract/Search</a>
              <a href="#" className="footer-link" onClick={() => navigate('cookbook')}>Cookbook</a>
              <a href="#" className="footer-link" onClick={() => navigate('shopping-list')}>List</a>
              <a href="#" className="footer-link" onClick={handleUpgradeClick}>⭐ Go Pro</a>
            </nav>
          </div>
        </footer>
      )}

      {/* Modals & Overlays */}
      {activeCookRecipe && (
        <CookMode 
          recipe={activeCookRecipe} 
          onClose={() => setActiveCookRecipe(null)} 
        />
      )}

      {showSaveModal && currentRecipe && (
        <SaveModal
          recipe={currentRecipe}
          onClose={() => setShowSaveModal(false)}
          onSaved={handleSaved}
          onUpgrade={() => { setShowSaveModal(false); setShowPremium(true); }}
        />
      )}

      {showPremium && (
        <PremiumModal
          onClose={() => setShowPremium(false)}
          onSubscribe={handleSubscribe}
          freeUsed={getSaveCount()}
          freeMax={getMaxFreeSaves()}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
