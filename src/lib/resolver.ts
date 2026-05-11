const KOREA_LAT_MIN = 33;
const KOREA_LAT_MAX = 39;
const KOREA_LNG_MIN = 124;
const KOREA_LNG_MAX = 132;

const COUNTRY_PREFIXES = [
  '대한민국',
  '한국',
  '남한',
  'South Korea',
  'Korea, Republic of',
  'Republic of Korea',
  '南韓',
  '韓國',
  '韩国',
];

function forceKoreanLocale(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set('hl', 'ko');
    u.searchParams.set('gl', 'KR');
    return u.toString();
  } catch {
    return url;
  }
}

function extractCanonicalQuery(finalUrl: string): string | null {
  const match = finalUrl.match(/\/maps\/place\/([^/]+)/);
  if (!match) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(match[1]);
  } catch {
    return null;
  }

  let query = decoded.replace(/\+/g, ' ').trim();

  // If the path slot is just coordinates like "37.5,127.0", treat as no query
  if (/^-?\d+\.\d+,-?\d+\.\d+$/.test(query)) return null;

  for (const prefix of COUNTRY_PREFIXES) {
    const re = new RegExp(`^${prefix}[\\s,]+`, 'i');
    if (re.test(query)) {
      query = query.replace(re, '');
      break;
    }
  }

  // Strip trailing pure-CJK tokens (Google locale-fallback branch suffix like "西面店")
  // when the rest of the query already has Hangul or Latin content.
  if (/[가-힯a-zA-Z]/.test(query)) {
    query = query.replace(/\s+[一-鿿]+$/g, '').trim();
  }

  return query || null;
}

function extractCoordinates(html: string, finalUrl: string): { lat: string; lng: string } | null {
  // Pattern A: [null,null,lat,lng]
  const tagged = /\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/g;
  let m;
  while ((m = tagged.exec(html)) !== null) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (lat > KOREA_LAT_MIN && lat < KOREA_LAT_MAX && lng > KOREA_LNG_MIN && lng < KOREA_LNG_MAX) {
      return { lat: m[1], lng: m[2] };
    }
  }

  // Pattern B: URL "@lat,lng"
  const at = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) {
    const lat = parseFloat(at[1]);
    const lng = parseFloat(at[2]);
    if (lat > KOREA_LAT_MIN && lat < KOREA_LAT_MAX && lng > KOREA_LNG_MIN && lng < KOREA_LNG_MAX) {
      return { lat: at[1], lng: at[2] };
    }
  }

  // Pattern C: data=...!3d<lat>!4d<lng> (Google's protobuf-ish path)
  const data = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (data) {
    const lat = parseFloat(data[1]);
    const lng = parseFloat(data[2]);
    if (lat > KOREA_LAT_MIN && lat < KOREA_LAT_MAX && lng > KOREA_LNG_MIN && lng < KOREA_LNG_MAX) {
      return { lat: data[1], lng: data[2] };
    }
  }

  return null;
}

const GENERIC_TITLES = /^(Google\s*(Maps|지도|地圖|地图))$/i;

function extractTitle(html: string): string {
  const m = html.match(/<title>([^<]+)<\/title>/);
  if (!m) return '';
  const cleaned = m[1].replace(/\s*-\s*Google\s*(지도|Maps|地圖|地图)\s*$/i, '').trim();
  if (GENERIC_TITLES.test(cleaned)) return '';
  return cleaned;
}

export async function resolveGoogleUrl(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
  });

  let finalUrl = response.url;
  let html = await response.text();

  // Only retry with forced Korean locale if HTML has no Korean text at all
  // (otherwise we risk replacing a real place page with the localized homepage).
  if (!/[가-힯]/.test(html)) {
    const koreanUrl = forceKoreanLocale(finalUrl);
    if (koreanUrl !== finalUrl) {
      try {
        const r2 = await fetch(koreanUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ko-KR,ko;q=0.9',
          },
        });
        if (r2.ok) {
          const html2 = await r2.text();
          if (/[가-힯]/.test(html2)) {
            finalUrl = r2.url;
            html = html2;
          }
        }
      } catch {
        // keep original response
      }
    }
  }

  const query = extractCanonicalQuery(finalUrl);
  const coords = extractCoordinates(html, finalUrl);
  const title = extractTitle(html);

  return {
    url: finalUrl,
    query,
    title: title || query || '未知地點',
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  };
}
