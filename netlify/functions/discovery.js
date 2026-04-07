import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const MODELS_TO_TRY = ['gemini-2.0-flash', 'gemini-1.5-flash'];

const DISCOVERY_PROMPT = `Find 3 highly-rated, classic RECIPE URLs for the dish requested: [QUERY].
STRICT RULES:
1. Use Google Search to find existing, live URLs.
2. Every result MUST be a specific recipe matching the query dish exactly. 
3. EXCLUDE unrelated recipes (e.g. dont include a coffee recipe if the query is roast chicken).
4. Return ONLY a valid JSON array of objects: [{"title": "Classic Recipe Name", "url": "https://...", "source": "Site Name"}]
5. Do NOT hallucinate URLs. Do NOT include sites that just mention the dish.
Dish to find: `;

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
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.2, // increased slightly to give it room to execute search
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

    // Validation: Ensure result title or URL actually mentions the core keywords from the query
    const queryKeywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const validResults = results
      .filter(r => r.title && r.url && r.url.startsWith('http'))
      .filter(r => {
        const fullText = (r.title + ' ' + r.url).toLowerCase();
        // If we have keywords, at least one must match (basic check)
        return queryKeywords.length === 0 || queryKeywords.some(kw => fullText.includes(kw));
      })
      .slice(0, 4);

    if (validResults.length === 0) {
      console.warn(`No valid discovery results for: ${query}. Returning empty array.`);
    }

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
