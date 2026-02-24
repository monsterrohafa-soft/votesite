export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoId } = req.query;
  if (!videoId) {
    return res.status(400).json({ error: 'videoId 파라미터 필요' });
  }

  let title = '';
  let description = '';

  // 1) Fetch title from YouTube oEmbed
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`;
    const oembedRes = await fetch(oembedUrl);
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      title = data.title || '';
    }
  } catch (e) {
    // oEmbed failed, title stays empty
  }

  // 2) Fetch description from noembed.com
  try {
    const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    const noembedRes = await fetch(noembedUrl);
    if (noembedRes.ok) {
      const data = await noembedRes.json();
      if (data.description) {
        description = data.description;
      }
    }
  } catch (e) {
    // noembed failed, try YouTube page meta tags
  }

  // 3) Fallback: extract description from YouTube page meta tags
  if (!description) {
    try {
      const pageUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
      const pageRes = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; bot)',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        },
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        // Try og:description meta tag
        const ogMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/);
        if (ogMatch && ogMatch[1]) {
          description = ogMatch[1]
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
        }
        // Fallback: try name="description" meta tag
        if (!description) {
          const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
          if (descMatch && descMatch[1]) {
            description = descMatch[1]
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
          }
        }
        // Also use title from page if oEmbed failed
        if (!title) {
          const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1]
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
          }
        }
      }
    } catch (e) {
      // Page fetch failed, description stays empty
    }
  }

  return res.status(200).json({ title, description });
}
