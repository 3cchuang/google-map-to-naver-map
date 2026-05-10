export async function resolveGoogleUrl(url: string) {
  try {
    const response = await fetch(url, { 
      method: 'GET', 
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const finalUrl = response.url;
    console.log('Final Redirect URL:', finalUrl);

    // 1. Try URL patterns first
    const patternA = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const patternB = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    const patternC = finalUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    const patternD = finalUrl.match(/center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/);

    let lat = patternA?.[1] || patternB?.[1] || patternC?.[1] || patternD?.[1];
    let lng = patternA?.[2] || patternB?.[2] || patternC?.[2] || patternD?.[2];

    // 2. If not found in URL, search in HTML content
    if (!lat || !lng) {
      const html = await response.text();
      
      // Look for meta image URL which often contains center=lat,lng
      const metaImageMatch = html.match(/meta content="https:\/\/maps\.google\.com\/maps\/api\/staticmap\?center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/);
      if (metaImageMatch) {
        lat = metaImageMatch[1];
        lng = metaImageMatch[2];
      } else {
        // Search for [lat, lng] arrays in the script/JSON data
        // Google often stores it like [null,null,null,[[null,null,35.158,129.160],...]]
        const jsonCoordMatch = html.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
        if (jsonCoordMatch) {
          lat = jsonCoordMatch[1];
          lng = jsonCoordMatch[2];
        }
      }
    }

    if (!lat || !lng) {
      return { url: finalUrl, lat: null, lng: null, title: "無法解析座標" };
    }

    return {
      url: finalUrl,
      lat,
      lng,
      title: "位置已解析"
    };
  } catch (error) {
    console.error('Resolve Error:', error);
    throw error;
  }
}
