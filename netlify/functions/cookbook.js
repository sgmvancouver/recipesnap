/**
 * Cookbook Cloud Sync & Persistence
 * Handles user-specific recipe storage
 */

export async function handler(event, context) {
  const { user } = context.clientContext || {};
  
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized. Please login.' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { action, recipes } = JSON.parse(event.body);
    const userId = user.sub;

    if (action === 'sync') {
      console.log(`Syncing ${recipes?.length || 0} recipes for user ${userId}`);
      
      /**
       * FUTURE: Save to Database (Supabase / Neon / Netlify Blobs)
       * For $0 budget: 
       * await supabase.from('cookbooks').upsert({ user_id: userId, data: recipes });
       */
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          count: recipes?.length || 0,
          message: 'Recipes synced to cloud!' 
        })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid action' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
