import { gql } from './_hardcover.js';

const SEARCH_QUERY = `query SearchBooks($query: String!) {
  search(query: $query, query_type: "Book", per_page: 10) {
    results
  }
}`;

export default async function handler(req, res) {
  if (!process.env.HARDCOVER_TOKEN) {
    res.status(500).json({ error: 'HARDCOVER_TOKEN env var is not set' });
    return;
  }

  const q = (req.query && req.query.q) || '';
  if (!q.trim()) {
    res.status(400).json({ error: 'Missing q parameter' });
    return;
  }

  try {
    const json = await (await gql(SEARCH_QUERY, { query: q })).json();
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
