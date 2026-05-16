/**
 * Resolves a Google Maps URL (including short URLs) to extract the location name
 * in both Chinese (Traditional) and Korean.
 */
export async function resolveGoogleMapsUrl(url: string) {
  // 1. Resolve short URL without User-Agent to trigger 302/301
  const initialRes = await fetch(url, { redirect: 'manual' });
  const location = initialRes.headers.get('location');
  const finalUrl = location || url;

  // 2. Extract name from URL path (very reliable for place name + address)
  let nameFromUrl = '';
  try {
    const urlObj = new URL(finalUrl);
    const pathParts = urlObj.pathname.split('/');
    const placeIndex = pathParts.indexOf('place');
    if (placeIndex !== -1 && pathParts[placeIndex + 1]) {
      nameFromUrl = decodeURIComponent(pathParts[placeIndex + 1]).replace(/\+/g, ' ');
    }
  } catch (e) {}

  async function getMetadata(targetUrl: string, lang: string) {
    const separator = targetUrl.includes('?') ? '&' : '?';
    const res = await fetch(`${targetUrl}${separator}hl=${lang}`, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': lang 
      }
    });
    const html = await res.text();
    
    // Extract from og:title
    const ogMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
    const title = ogMatch ? ogMatch[1].replace(/ · Google (地圖|지도|Maps)/, '').replace(/ - Google Maps/, '').trim() : '';

    return { title, html };
  }

  const [zhData, koData] = await Promise.all([
    getMetadata(finalUrl, 'zh-TW'),
    getMetadata(finalUrl, 'ko')
  ]);

  // Logic to determine the best name:
  // If og:title is generic "Google Maps", fallback to nameFromUrl
  let name = zhData.title;
  if (!name || name === 'Google 地圖' || name === 'Google Maps') {
    name = nameFromUrl || name;
  }

  let koreanName = koData.title;
  if (!koreanName || koreanName === 'Google 지도' || koreanName === 'Google Maps') {
    // If we can't get a clean Korean title, use the nameFromUrl which often contains Korean address parts
    koreanName = nameFromUrl || name;
  }

  // Final cleanup: remove address parts if it's too long and we have a better title
  // But for now, returning the most descriptive string is safer for Naver search.
  
  return { 
    name: name.split(' · ')[0], // Sometimes Google adds extra info after ' · '
    koreanName: koreanName.split(' · ')[0]
  };
}
