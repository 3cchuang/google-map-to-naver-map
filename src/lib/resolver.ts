export async function resolveGoogleUrl(url: string) {
  try {
    const response = await fetch(url, { 
      method: 'GET', 
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    const finalUrl = response.url;
    const html = await response.text();
    
    let lat: string | null = null;
    let lng: string | null = null;
    let title = "";

    // 1. Try to find title first
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      title = titleMatch[1]
        .replace(' - Google 地圖', '')
        .replace(' - Google Maps', '')
        .replace('Google Maps', '')
        .trim();
    }

    // 2. Comprehensive Coordinate Search
    // Pattern A: [null,null,lat,lng]
    const jsonRegex = /\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/g;
    let match;
    while ((match = jsonRegex.exec(html)) !== null) {
      const pLat = parseFloat(match[1]);
      const pLng = parseFloat(match[2]);
      if (pLat > 33 && pLat < 39 && pLng > 124 && pLng < 132) {
        lat = match[1];
        lng = match[2];
        break;
      }
    }

    // Pattern B: generic [lat,lng] within Korea box
    if (!lat) {
      const genericRegex = /\[(-?\d+\.\d+),(-?\d+\.\d+)\]/g;
      while ((match = genericRegex.exec(html)) !== null) {
        const pLat = parseFloat(match[1]);
        const pLng = parseFloat(match[2]);
        if (pLat > 33 && pLat < 39 && pLng > 124 && pLng < 132) {
          lat = match[1];
          lng = match[2];
          break;
        }
      }
    }

    // Pattern C: URL patterns
    if (!lat) {
      const pathMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (pathMatch) {
        lat = pathMatch[1];
        lng = pathMatch[2];
      }
    }

    return {
      url: finalUrl,
      lat,
      lng,
      title: title || "未知地點"
    };
  } catch (error) {
    console.error('Resolver error:', error);
    throw error;
  }
}
