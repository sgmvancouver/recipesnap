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
  let attempted = 0;
  
  // Try them in batches of 3 to balance speed and avoid hitting API rate limits.
  for (let i = 0; i < urls.length; i += 3) {
    if (results.length >= 4) break;
    
    const chunk = urls.slice(i, i + 3);
    const promises = chunk.map(async (url) => {
      try {
        const recipe = await extractRecipe(url);
        return recipe;
      } catch (err) {
        console.warn(`Extraction failed for ${url}:`, err.message);
        return null;
      }
    });

    const chunkResults = await Promise.all(promises);
    chunkResults.forEach(r => {
      if (r && results.length < 4) {
        results.push(r);
      }
    });

    attempted += chunk.length;
    const percentage = results.length >= 4 ? 100 : Math.min(95, Math.round((attempted / urls.length) * 100));
    onProgress(percentage);
  }
  
  onProgress(100);
  return results;
}
