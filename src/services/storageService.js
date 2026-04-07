const STORAGE_KEY = 'recipesnap_cookbook';
const LIST_KEY = 'recipesnap_shopping_list';
const MAX_FREE_SAVES = 3;

/**
 * Get all saved recipes
 */
export function getSavedRecipes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save a recipe to the cookbook
 */
export function saveRecipe(recipe, category = 'Uncategorized') {
  const saved = getSavedRecipes();
  
  const alreadySaved = saved.find(r => r.sourceUrl === recipe.sourceUrl);
  if (alreadySaved) {
    return { success: false, message: 'Recipe already in your cookbook.' };
  }

  const isPremium = getIsPremium();
  if (!isPremium && saved.length >= MAX_FREE_SAVES) {
    return { success: false, requiresPremium: true };
  }

  const newRecipe = {
    ...recipe,
    id: `recipe_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    category,
    savedAt: new Date().toISOString(),
    emoji: getRecipeEmoji(recipe.tags),
  };

  saved.push(newRecipe);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return { success: true, recipe: newRecipe };
}

/**
 * Delete a recipe
 */
export function deleteRecipe(id) {
  const saved = getSavedRecipes().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

/**
 * Update recipe data (used for edits and category changes)
 */
export function updateRecipe(id, updates) {
  const saved = getSavedRecipes().map(r =>
    r.id === id ? { ...r, ...updates } : r
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return saved.find(r => r.id === id);
}

/**
 * Shopping List Functions
 */
export function getShoppingList() {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToShoppingList(items) {
  // Merge new items with existing list
  const current = getShoppingList();
  const newList = [...current];

  items.forEach(newItem => {
    // Basic merge: if name and unit match, sum quantities
    const existingIdx = newList.findIndex(i => 
      i.name.toLowerCase() === newItem.name.toLowerCase() && 
      i.unit === newItem.unit &&
      !i.checked
    );

    if (existingIdx >= 0 && newItem.quantity !== null && newList[existingIdx].quantity !== null) {
      newList[existingIdx].quantity += newItem.quantity;
      newList[existingIdx].original = `${newList[existingIdx].quantity} ${newList[existingIdx].unit ? newList[existingIdx].unit + ' ' : ''}${newList[existingIdx].name}`;
    } else {
      newList.push({ ...newItem, id: Date.now() + Math.random(), checked: false });
    }
  });

  localStorage.setItem(LIST_KEY, JSON.stringify(newList));
  return newList;
}

export function toggleListItem(id) {
  const list = getShoppingList().map(item => 
    item.id === id ? { ...item, checked: !item.checked } : item
  );
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
  return list;
}

export function clearShoppingList() {
  localStorage.setItem(LIST_KEY, JSON.stringify([]));
}

/**
 * Scaling Helper
 */
export function scaleQuantity(qty, multiplier) {
  if (qty === null || isNaN(qty)) return null;
  const result = qty * multiplier;
  // Round to 2 decimal places or keep as clean fraction if possible
  return Math.round(result * 100) / 100;
}

/**
 * Premium status helpers
 */
export function getIsPremium() {
  return localStorage.getItem('recipesnap_premium') === 'true';
}

export function setIsPremium(value) {
  localStorage.setItem('recipesnap_premium', String(value));
}

export function getSaveCount() {
  return getSavedRecipes().length;
}

export function getMaxFreeSaves() {
  return MAX_FREE_SAVES;
}

/**
 * Get all unique categories
 */
export function getCategories() {
  const recipes = getSavedRecipes();
  const categories = new Set(recipes.map(r => r.category || 'Uncategorized'));
  return Array.from(categories).sort();
}

function getRecipeEmoji(tags = []) {
  const tagMap = {
    breakfast: '🍳',
    lunch: '🥗',
    dinner: '🍽️',
    dessert: '🍰',
    snack: '🥨',
    baking: '🥐',
    vegetarian: '🥦',
    vegan: '🌱',
    'gluten-free': '✨',
    quick: '⚡',
  };
  for (const tag of tags || []) {
    if (tagMap[tag]) return tagMap[tag];
  }
  return '🍴';
}
