export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url 파라미터 필요' });

  let title = '';
  let imageUrl = '';
  let source = '';

  try {
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });

    if (pageRes.ok) {
      const html = await pageRes.text();

      // og:image
      const imgMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/) ||
                        html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:image"/);
      if (imgMatch) imageUrl = decodeEntities(imgMatch[1]);

      // og:title
      const titleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/) ||
                          html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:title"/);
      if (titleMatch) title = decodeEntities(titleMatch[1]);

      // og:site_name (언론사)
      const siteMatch = html.match(/<meta\s+(?:property|name)="og:site_name"\s+content="([^"]*)"/) ||
                         html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:site_name"/);
      if (siteMatch) source = decodeEntities(siteMatch[1]);

      // fallback: <title>
      if (!title) {
        const tMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (tMatch) title = decodeEntities(tMatch[1].trim());
      }
    }
  } catch (e) {
    // fetch failed
  }

  return res.status(200).json({ title, imageUrl, source });
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}
