import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    let html;
    let fallbackToMicrolink = false;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: AbortSignal.timeout(4000) // 4 second timeout
      });

      if (!response.ok) {
        fallbackToMicrolink = true;
      } else {
        html = await response.text();
      }
    } catch (e) {
      fallbackToMicrolink = true;
    }

    let title = '';
    let favicon = '';
    let description = '';

    if (!fallbackToMicrolink && html) {
      const $ = cheerio.load(html);

      title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
      title = title.trim();
      
      favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || $('link[rel="apple-touch-icon"]').attr('href');
      if (favicon && !favicon.startsWith('http')) {
        try {
          const baseUrl = new URL(url);
          favicon = new URL(favicon, baseUrl.origin).toString();
        } catch (e) {
          favicon = '';
        }
      }
      
      if (!favicon) {
         try {
           const domain = new URL(url).hostname;
           favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
         } catch (e) { favicon = ''; }
      }

      description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
      
      if (!description) {
        $('p').each((i, el) => {
          const text = $(el).text().trim();
          if (text.length > 40) {
            description = text;
            return false;
          }
        });
      }
    }

    // If initial fetch failed, OR if it succeeded but the site hid its description behind React/Cloudflare
    if (fallbackToMicrolink || (!description && !title)) {
      try {
        const microRes = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
        if (microRes.ok) {
          const microData = await microRes.json();
          if (microData.status === 'success') {
            title = microData.data.title || title;
            description = microData.data.description || description;
            favicon = microData.data.logo?.url || favicon;
          }
        }
      } catch (err) {
         console.error('Microlink fallback error:', err);
      }
    }

    if (description && description.length > 150) {
      description = description.substring(0, 147) + '...';
    }

    return NextResponse.json({
      title: title || url,
      favicon,
      description
    });
  } catch (error) {
    console.error('Metadata overall error:', error);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}
