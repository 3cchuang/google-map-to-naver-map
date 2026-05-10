export async function resolveGoogleUrl(url: string) {
  try {
    const response = await fetch(url, { 
      method: 'GET', 
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    const finalUrl = response.url;
    const html = await response.text();
    
    let lat: string | null = null;
    let lng: string | null = null;
    let title = "位置已解析";

    // 1. Try URL patterns first (Fastest)
    const pathMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (pathMatch) {
      lat = pathMatch[1];
      lng = pathMatch[2];
    }

    // 2. Deep scan the HTML content for the canonical [null,null,lat,lng] pattern
    if (!lat) {
      // Look for the coordinates which are often inside a large JSON array in Google Maps HTML
      // Example: [null,null,35.1582236,129.1604561]
      const jsonRegex = /\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/g;
      let match;
      while ((match = jsonRegex.exec(html)) !== null) {
        // We take the first valid coordinates that look like they're in Korea (Lat 33-39, Lng 124-132)
        const possibleLat = parseFloat(match[1]);
        const possibleLng = parseFloat(match[2]);
        if (possibleLat > 30 && possibleLat < 45 && possibleLng > 120 && possibleLng < 135) {
          lat = match[1];
          lng = match[2];
          break;
        }
      }
    }

    // 3. Fallback to generic [lat,lng] if nothing else found
    if (!lat) {
      const genericRegex = /\[(-?\d+\.\d+),(-?\d+\.\d+)\]/g;
      let match;
      while ((match = genericRegex.exec(html)) !== null) {
        const possibleLat = parseFloat(match[1]);
        const possibleLng = parseFloat(match[2]);
        if (possibleLat > 33 && possibleLat < 39 && possibleLng > 124 && possibleLng < 132) {
          lat = match[1];
          lng = match[2];
          break;
        }
      }
    }

    // Attempt to grab title from HTML
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      title = titleMatch[1].replace(' - Google 地圖', '').replace(' - Google Maps', '').trim();
    }

    console.log(`Resolved: ${title} (${lat}, ${lng})`);

    return {
      url: finalUrl,
      lat,
      lng,
      title: title || "位置已解析"
    };
  } catch (error) {
    console.error('Resolver internal error:', error);
    throw error;
  }
}
