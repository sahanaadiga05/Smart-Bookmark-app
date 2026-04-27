import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'Valid urls array required' }, { status: 400 });
    }

    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          // Use a realistic User-Agent to prevent basic bot blocking
          const res = await fetch(url, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });

          // If HEAD fails (some servers block it), fallback to GET
          if (res.status === 405 || res.status === 403) {
            const getRes = await fetch(url, { 
                method: 'GET',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                },
                signal: AbortSignal.timeout(5000)
            });
            return { url, is_broken: !getRes.ok, status: getRes.status };
          }

          return { url, is_broken: !res.ok, status: res.status };
        } catch (error) {
          // Network errors, DNS issues, or timeouts mean it's broken
          return { url, is_broken: true, status: error.name === 'TimeoutError' ? 408 : 500 };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Ping links error:', error);
    return NextResponse.json({ error: 'Failed to process links' }, { status: 500 });
  }
}
