

async function testLatency() {
  console.log('Testing Discovery...');
  const startDesc = performance.now();
  const discoveryRes = await fetch('http://localhost:8888/.netlify/functions/discovery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'Chocolate Cake' })
  });
  const urls = await discoveryRes.json();
  console.log(`Discovery took: ${((performance.now() - startDesc) / 1000).toFixed(2)}s`);
  console.log(`Found ${urls.length} URLs.`);

  console.log('Testing Extraction...');
  const startExt = performance.now();
  
  const results = [];

  
  for (let i = 0; i < urls.length; i += 2) {
    if (results.length >= 2) break;
    
    const chunk = urls.slice(i, i + 2);
    console.log(`Processing Chunk of ${chunk.length} URLs concurrently...`);
    const promises = chunk.map(async (u) => {
      try {
        const reqStart = performance.now();
        const res = await fetch('http://localhost:8888/.netlify/functions/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: u.url })
        });
        await res.text();
        console.log(`Extracted from ${u.url} in ${((performance.now() - reqStart)/1000).toFixed(2)}s. Status: ${res.status}`);
        return res.status === 200 ? true : null;
      } catch (err) {
        console.error(`Failed ${u.url}:`, err);
        return null;
      }
    });

    const chunkResults = await Promise.all(promises);
    chunkResults.forEach(r => {
      if (r && results.length < 2) {
        results.push(r);
      }
    });
  }

  console.log(`Total Extraction Phase took: ${((performance.now() - startExt) / 1000).toFixed(2)}s`);
  console.log(`Successfully extracted ${results.length} recipes.`);
}

testLatency();
