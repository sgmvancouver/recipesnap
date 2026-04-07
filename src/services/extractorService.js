/**
 * Main extraction function
 * Calls our robust Netlify serverless function
 * @param {string} url - Recipe page URL
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Object} Parsed recipe JSON
 */
export async function extractRecipe(url, onProgress = () => {}) {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error('Please enter a valid URL (e.g. https://www.allrecipes.com/recipe/...)');
  }

  onProgress('fetching & extracting'); // Handled by backend now

  // In development Vite will need a proxy or we can use the netlify-cli
  // Assuming netlify dev is running or we proxy API locally
  let endpoint = '/.netlify/functions/extract';
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error: HTTP ${response.status}`);
    }

    onProgress('done');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Could not retrieve page content or extraction failed.');
  }
}

/**
 * Search for recipes by query
 * @param {string} query - Dish name (e.g. "Roast Chicken")
 * @returns {Promise<Array>} List of URL matches
 */
export async function searchRecipes(query) {
  const endpoint = '/.netlify/functions/discovery';
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to search for recipes.');
    }

    return data;
  } catch (err) {
    throw new Error(err.message || 'Recipe discovery failed.');
  }
}

export async function extractMultiple(urls, onProgress = () => {}) {
  const results = [];
  const targets = urls.slice(0, 4);

  if (targets.length === 0) return [];

  return new Promise((resolve) => {
    let completedCount = 0;
    let hasResolved = false;

    targets.forEach(async (url) => {
      try {
        const recipe = await extractRecipe(url);
        if (recipe && !hasResolved) {
          results.push(recipe);
        }
      } catch (err) {
        console.warn(`Extraction failed for ${url}:`, err.message);
      } finally {
        completedCount++;
        // As soon as we hit 2 successful recipes, resolve immediately
        if (!hasResolved && (results.length >= 2 || completedCount === targets.length)) {
          hasResolved = true;
          onProgress(100);
          resolve(results.slice(0, 2));
        }
      }
    });
  });
}
