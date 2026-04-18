const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJIYXJkY292ZXIiLCJ2ZXJzaW9uIjoiOCIsImp0aSI6ImVjZjc5ODQ2LTIyOTMtNDk4NC04MzU5LTZlMzQ4YmIyOWUwNCIsImFwcGxpY2F0aW9uSWQiOjIsInN1YiI6Ijg3ODQ5IiwiYXVkIjoiMSIsImlkIjoiODc4NDkiLCJsb2dnZWRJbiI6dHJ1ZSwiaWF0IjoxNzc1MDAwOTczLCJleHAiOjE4MDY1MzY5NzMsImh0dHBzOi8vaGFzdXJhLmlvL2p3dC9jbGFpbXMiOnsieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJ1c2VyIl0sIngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6InVzZXIiLCJ4LWhhc3VyYS1yb2xlIjoidXNlciIsIlgtaGFzdXJhLXVzZXItaWQiOiI4Nzg0OSJ9LCJ1c2VyIjp7ImlkIjo4Nzg0OX19.vWt5gxa0ZA9RKQQRn7wUXwy1UlInl2aCZRtRwHoy5BU';

const SEARCH_QUERY = `query SearchBooks($query: String!) {
  search(query: $query, query_type: "Book", per_page: 10) {
    results
  }
}`;

async function gql(query, variables) {
  const res = await fetch('https://api.hardcover.app/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

export default async function handler(req, res) {
  const q = (req.query && req.query.q) || '';
  if (!q.trim()) {
    res.status(400).json({ error: 'Missing q parameter' });
    return;
  }

  try {
    const json = await gql(SEARCH_QUERY, { query: q });
    const hits = json?.data?.search?.results?.hits || [];

    const books = hits.map(h => {
      const doc = h.document || {};
      const contributions = doc.contributions || [];
      const author = contributions[0]?.author || contributions[0]?.author_name || '';
      const image = doc.image?.url || (doc.images && doc.images[0]?.url) || null;
      return {
        hardcover_id: doc.id || doc.slug || null,
        title: doc.title || '',
        author: typeof author === 'string' ? author : (author.name || ''),
        cover_url: image,
        pages: doc.pages || null,
        release_year: doc.release_year || null,
      };
    });

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).json({ books });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
