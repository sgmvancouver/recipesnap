import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const MODELS_TO_TRY = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.0-pro'];

const DISCOVERY_PROMPT = `You are a world-class recipe scout. Find 6 of the HIGHEST rated, absolute classic, and most reliable recipe URLs for the following dish.
Return ONLY a valid JSON array of objects, with no markdown code blocks, no explanation.

Each object MUST have:
- title: The name of the dish as per that specific site.
- url: The full live URL to the recipe page.
- source: The name of the website (e.g. "AllRecipes", "FoodNetwork", "Serious Eats", "Bon Appetit").

Rules:
- URLs must be DIRECT and likely to be currently active. 
- Prioritize high-quality domains like: allrecipes.com, foodnetwork.com, seriouseats.com, bonappetit.com, nytimes.com/cooking, kingarthurbaking.com.
- Do NOT return search results pages, only individual recipe pages.
- Ensure the URLs look well-formed.

Dish to find: 
`;

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { query } = JSON.parse(event.body);

    if (!query) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing query parameter' }) };
    }

    if (!API_KEY) {
      console.error('Discovery: GEMINI_API_KEY is not set in environment variables');
      return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
    }

    console.log(`Discovering recipes for: ${query}...`);
    
    let results = null;
    let lastError = null;
    
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`Discovery trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0,
            responseMimeType: 'application/json',
          }
        });

        const result = await model.generateContent(DISCOVERY_PROMPT + query);
        const responseText = result.response.text();

        try {
          results = JSON.parse(responseText);
        } catch {
          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            results = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Discovery failed: Could not parse search results.');
          }
        }
        
        console.log(`Discovery success with model: ${modelName}`);
        break;
      } catch (err) {
        console.warn(`Discovery model ${modelName} failed: ${err.message}`);
        lastError = err;
        if (!err.message.includes('404') && !err.message.includes('no longer available') && !err.message.includes('not found')) {
          throw err;
        }
      }
    }
    
    if (!results) {
      throw lastError || new Error('Discovery failed: no models available.');
    }

    // Basic validation and limit to 6
    const validResults = results
      .filter(r => r.title && r.url && r.url.startsWith('http'))
      .slice(0, 6);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResults),
    };
  } catch (error) {
    console.error('Discovery error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Unknown discovery error' })
    };
  }
}
