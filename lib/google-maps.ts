/**
 * Resolves a Google Maps URL (including short URLs) to extract the location name
 * in Chinese (Traditional) and Korean.
 *
 * Strategy: URL path is the most reliable source when this runs from a Korean
 * region (Vercel icn1) — Google's redirect server localizes the path text by
 * the requester's IP, so a request from Seoul yields a Korean place name in
 * the URL path. We trust the URL path first; HTML scrape is a fallback.
 */

const HANGUL = /[가-힯]/;
const CJK = /[一-鿿]/;

type Metadata = { title: string };

async function getMetadata(targetUrl: string, lang: string): Promise<Metadata> {
  const host = lang === 'ko' ? 'www.google.co.kr' : 'www.google.com';
  let cleanUrl = targetUrl.replace('www.google.com', host);
  cleanUrl = cleanUrl
    .replace(/([?&])hl=[^&]*/g, '')
    .replace(/([?&])gl=[^&]*/g, '')
    .replace(/\?&/, '?')
    .replace(/&&/, '&');

  const separator = cleanUrl.includes('?') ? '&' : '?';
  const finalTargetUrl = `${cleanUrl}${separator}hl=${lang}&gl=${lang === 'ko' ? 'kr' : 'tw'}`;

  try {
    const res = await fetch(finalTargetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': lang === 'ko' ? 'ko-KR,ko;q=0.9' : 'zh-TW,zh;q=0.9',
      },
    });
    const html = await res.text();

    let title = '';
    const stateMatch = html.match(/window\.APP_INITIALIZATION_STATE=\[\[\[.*?\]\]\]/);
    if (stateMatch) {
      const stateStr = stateMatch[0];
      const candidates = stateStr.match(/"([^"]+)"/g)?.map((s) => s.slice(1, -1)) || [];

      if (lang === 'ko') {
        title =
          candidates.find(
            (s) => HANGUL.test(s) && !s.includes('Google') && s.length < 50 && !s.includes('http')
          ) || '';
      } else {
        const primaryMatch = stateStr.match(/\["0x[^"]+","([^"]+)"/);
        title = primaryMatch ? primaryMatch[1] : '';
      }
    }

    if (!title || title.includes('Google') || title.includes(")]}'")) {
      const ogMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
      title = ogMatch ? ogMatch[1] : title;
    }
    if (!title || title.includes('Google') || title.includes(")]}'")) {
      const titleTagMatch = html.match(/<title>([^<]+)<\/title>/);
      title = titleTagMatch ? titleTagMatch[1] : title;
    }

    title = title
      .replace(/^\)\]\}'\\n/, '')
      .replace(/\\"/g, '"')
      .replace(/ · Google (地圖|지도|Maps)/, '')
      .replace(/ - Google Maps/, '')
      .trim();

    return { title };
  } catch {
    return { title: '' };
  }
}

function stripPrefixes(s: string): string {
  return s
    .replace(/^南韓\s*/, '')
    .replace(/^South Korea\s*/, '')
    .replace(/^대한민국\s*/, '')
    .split(' · ')[0]
    .trim();
}

export async function resolveGoogleMapsUrl(url: string) {
  // 1. Resolve short URL. When this code runs from icn1 (Seoul), Google's
  //    redirect server embeds the Korean place name in the Location header path.
  const initialRes = await fetch(url, { redirect: 'manual' });
  const location = initialRes.headers.get('location');
  const finalUrl = location || url;

  // 2. Decode the place name out of the URL path (the gold-standard signal).
  let nameFromUrl = '';
  try {
    const urlObj = new URL(finalUrl);
    const pathParts = urlObj.pathname.split('/');
    const placeIndex = pathParts.indexOf('place');
    if (placeIndex !== -1 && pathParts[placeIndex + 1]) {
      nameFromUrl = decodeURIComponent(pathParts[placeIndex + 1]).replace(/\+/g, ' ');
    } else if (urlObj.searchParams.get('q')) {
      nameFromUrl = urlObj.searchParams.get('q') || '';
    }
  } catch {}

  const urlHasKorean = HANGUL.test(nameFromUrl);

  // 3. Also fetch the localized HTML pages for the secondary name.
  const [zhData, koData] = await Promise.all([
    getMetadata(finalUrl, 'zh-TW'),
    getMetadata(finalUrl, 'ko'),
  ]);

  const isPlaceholderTitle = (t: string) =>
    !t ||
    t.includes(")]}'") ||
    t === 'Google 地圖' ||
    t === 'Google 지도' ||
    t === 'Google Maps';

  // === Korean name ===
  // Strict: only accept a string that actually contains Hangul. Never fall
  // back to a Chinese string — a wrong-language value would silently produce
  // a bad Naver search result.
  let koreanName = '';
  if (urlHasKorean) {
    koreanName = nameFromUrl;
  } else if (HANGUL.test(koData.title) && !isPlaceholderTitle(koData.title)) {
    koreanName = koData.title;
  }

  // === Display (Chinese-leaning) name ===
  // Prefer the zh-TW HTML title; fall back to the URL path so we always have
  // something to show even when scraping fails.
  let name = '';
  if (!isPlaceholderTitle(zhData.title)) {
    name = zhData.title;
  } else if (nameFromUrl) {
    name = nameFromUrl;
  }

  // Final cleanup
  name = stripPrefixes(name);
  koreanName = stripPrefixes(koreanName);

  // If the Korean candidate came from a mixed-content URL path (e.g. address
  // with comma-separated parts), pick just the Hangul portion.
  if (koreanName.includes(',')) {
    const parts = koreanName.split(',');
    const krPart = parts.find((p) => HANGUL.test(p));
    if (krPart) koreanName = krPart.trim();
  }

  return { name, koreanName };
}
