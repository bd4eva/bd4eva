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

const QUERY_CURRENT = `query CurrentlyReading {
  me {
    user_books(where: { status_id: { _eq: 2 } }) {
      user_book_reads {
        progress_pages
      }
      book {
        title
        pages
        image { url }
        contributions { author { name } }
      }
    }
  }
}`;

const TOKEN = process.env.HARDCOVER_API_TOKEN;

function gql(query) {
  return fetch('https://api.hardcover.app/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query }),
  });
}

export default async function handler(req, res) {
  try {
    const [finishedRes, currentRes] = await Promise.all([gql(QUERY), gql(QUERY_CURRENT)]);

    const data = await finishedRes.json();
    const currentData = await currentRes.json();

    const currentlyReading =
      currentData.data?.me?.[0]?.user_books ?? [];

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json({ ...data, currentlyReading });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
