const QUERY = `query MyBooks {
  me {
    user_books(where: { status_id: { _eq: 3 } }) {
      rating
      user_book_reads { finished_at }
      book {
        title
        contributions { author { name } }
        image { url }
        pages
      }
    }
  }
}`;

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJIYXJkY292ZXIiLCJ2ZXJzaW9uIjoiOCIsImp0aSI6ImVjZjc5ODQ2LTIyOTMtNDk4NC04MzU5LTZlMzQ4YmIyOWUwNCIsImFwcGxpY2F0aW9uSWQiOjIsInN1YiI6Ijg3ODQ5IiwiYXVkIjoiMSIsImlkIjoiODc4NDkiLCJsb2dnZWRJbiI6dHJ1ZSwiaWF0IjoxNzc1MDAwOTczLCJleHAiOjE4MDY1MzY5NzMsImh0dHBzOi8vaGFzdXJhLmlvL2p3dC9jbGFpbXMiOnsieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJ1c2VyIl0sIngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6InVzZXIiLCJ4LWhhc3VyYS1yb2xlIjoidXNlciIsIlgtaGFzdXJhLXVzZXItaWQiOiI4Nzg0OSJ9LCJ1c2VyIjp7ImlkIjo4Nzg0OX19.vWt5gxa0ZA9RKQQRn7wUXwy1UlInl2aCZRtRwHoy5BU';

export default async function handler(req, res) {
  try {
    const upstream = await fetch('https://api.hardcover.app/v1/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ query: QUERY }),
    });

    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
