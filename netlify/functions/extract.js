import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Model preference order — first available will be used
const MODELS_TO_TRY = ['gemini-2.0-flash', 'gemini-1.5-flash'];

const EXTRACTION_PROMPT = `You are an expert recipe parser. Extract the recipe from the following webpage HTML or text.
Return ONLY a valid JSON object with this exact structure, no markdown, no explanation:
{
  "title": "Recipe Title",
  "description": "One sentence about the dish",
  "imageUrl": "URL to the primary hero image of the dish",
  "servings": 4,
  "prepTime": "15 mins",
  "cookTime": "30 mins",
  "ingredients": [
    { "quantity": 1, "unit": "cup", "name": "all-purpose flour", "original": "1 cup all-purpose flour" },
    { "quantity": 2, "unit": null, "name": "large eggs", "original": "2 large eggs" }
  ],
  "steps": [
    "Preheat oven to 350°F.",
    "Mix flour and eggs together until smooth."
  ],
  "tags": ["dinner", "vegetarian"]
}

Rules:
- imageUrl: Find the primary hero image (og:image, schema.org/Recipe image, etc).
- servings: Return as a NUMBER. If a range like "4-6", use the first number (4).
- ingredients: EVERY item must have a non-null "name" field. 
  - quantity: number (e.g. 1.5) or null. 
  - unit: text (cup, tsp, lb, etc) or null. NEVER put "null" as a string.
  - name: ALWAYS populate this with the ingredient name (e.g. "egg", "flour", "butter"). NEVER return null for name.
  - original: the full original string exactly as written.
- steps: CRITICAL — look for JSON-LD script data (schema.org/Recipe recipeInstructions), numbered steps in the text, or any "directions", "method", or "instructions" section. Extract ALL steps as an array of strings. If you find JSON-LD data with instructions, use those steps.
- If a field genuinely cannot be found, use null (except "name" in ingredients — always fill it in).
- tags: choose 1-3 from: breakfast, lunch, dinner, dessert, snack, vegetarian, vegan, gluten-free, quick, baking.
- Never include ads, author bios, or SEO filler.

HTML/text to parse:
`;

function cleanHTML(html) {
  // First extract JSON-LD structured data (preserves recipe schema with steps/ingredients)
  const jsonLdMatches = [];
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    jsonLdMatches.push(match[1]);
  }
  
  // Now clean the HTML (removes ALL scripts including JSON-LD from HTML)
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  cleaned = cleaned.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  cleaned = cleaned.replace(/<(nav|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Prepend the JSON-LD data as context for the AI
  const jsonLdSection = jsonLdMatches.length > 0 
    ? `\n\n=== RECIPE STRUCTURED DATA (JSON-LD) ===\n${jsonLdMatches.join('\n')}\n=== END STRUCTURED DATA ===\n\n` 
    : '';
  
  return (jsonLdSection + cleaned).slice(0, 60000);
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { url } = JSON.parse(event.body);

    if (!url) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing URL parameter' }) };
    }

    if (!API_KEY) {
       return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
    }

    console.log(`Fetching HTML for ${url}...`);
    
    let rawHTML = null;
    const urlsToTry = [
      `https://r.jina.ai/${url}`,
      url,
      `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    ];

    console.log(`Fetching HTML concurrently for ${url}...`);

    const fetchPromises = urlsToTry.map(async (targetUrl) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      try {
        const fetchResponse = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
          },
          signal: controller.signal
        });

        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}`);
        }

        let html = '';
        if (targetUrl.includes('allorigins')) {
          const data = await fetchResponse.json();
          if (data.contents) html = data.contents;
        } else {
          html = await fetchResponse.text();
        }

        if (html && html.length > 500) {
          return html;
        }
        throw new Error('Content too small');
      } finally {
        clearTimeout(timeoutId);
      }
    });

    try {
      rawHTML = await Promise.any(fetchPromises);
    } catch (e) {
      console.warn(`All fetch attempts failed for: ${url}`);
    }

    if (!rawHTML || rawHTML.length < 500) {
      throw new Error(`Failed to fetch adequate page content for: ${url}`);
    }
    const contentToParse = cleanHTML(rawHTML);

    console.log(`Extracting with Gemini...`);
    
    let recipe = null;
    let lastError = null;
    
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          }
        });

        const result = await model.generateContent(EXTRACTION_PROMPT + contentToParse);
        const responseText = result.response.text();

        try {
          recipe = JSON.parse(responseText);
        } catch {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            recipe = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not parse JSON from model response.');
          }
        }
        
        console.log(`Success with model: ${modelName}`);
        break; // Got a result, stop trying
      } catch (err) {
        console.warn(`Model ${modelName} failed: ${err.message}`);
        lastError = err;
        // Only continue if it's an availability error
        if (!err.message.includes('404') && !err.message.includes('no longer available') && !err.message.includes('not found')) {
          throw err; // Re-throw non-availability errors immediately
        }
      }
    }
    
    if (!recipe) {
      throw lastError || new Error('All models failed to extract the recipe.');
    }

    if (!recipe.title) {
      throw new Error('Could not extract a recipe title from this page. The page may require JavaScript to load, or may not contain a recipe.');
    }
    // Ensure arrays exist even if empty
    recipe.ingredients = recipe.ingredients || [];
    recipe.steps = recipe.steps || [];
    if (!recipe.ingredients.length && !recipe.steps.length) {
      throw new Error('This page does not appear to contain a recipe. Try a direct link to a recipe page.');
    }

    recipe.sourceUrl = url;
    recipe.extractedAt = new Date().toISOString();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipe),
    };
  } catch (error) {
    console.error('Extraction error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Unknown extraction error' })
    };
  }
}
