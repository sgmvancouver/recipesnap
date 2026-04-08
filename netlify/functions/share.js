import { getStore } from "@netlify/blobs";

export async function handler(event, context) {
  const store = getStore("shared-recipes");

  // GET Mode: Retrieve recipe
  if (event.httpMethod === 'GET') {
    const { id } = event.queryStringParameters;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing ID' })
      };
    }

    try {
      const recipe = await store.get(id, { type: "json" });
      if (!recipe) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Recipe not found' })
        };
      }

      return {
        statusCode: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" 
        },
        body: JSON.stringify(recipe)
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  // POST Mode: Share recipe
  if (event.httpMethod === 'POST') {
    try {
      const recipe = JSON.parse(event.body);
      // Generate a simple short ID
      const id = Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4);
      
      await store.setJSON(id, recipe);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          url: `${event.headers.origin || 'https://recipesnap.netlify.app'}/share/${id}` 
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  return { 
    statusCode: 405, 
    body: JSON.stringify({ error: 'Method Not Allowed' }) 
  };
}
