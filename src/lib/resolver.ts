export async function resolveGoogleUrl(url: string) {
  try {
    // 1. Follow redirects
    const response = await fetch(url, { 
      method: 'GET', 
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    const finalUrl = response.url;
    const html = await response.text();
    
    console.log('Final URL after redirect:', finalUrl);

    // Extraction patterns
    let lat: string | null = null;
    let lng: string | null = null;
    let title = "位置已解析";

    // Pattern 1: URL path @lat,lng
    const pathMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (pathMatch) {
      lat = pathMatch[1];
      lng = pathMatch[2];
    }

    // Pattern 2: URL params !3d!4d
    if (!lat) {
      const dataMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (dataMatch) {
        lat = dataMatch[1];
        lng = dataMatch[2];
      }
    }

    // Pattern 3: Meta og:image center parameter
    if (!lat) {
      const ogImageMatch = html.match(/https:\/\/maps\.google\.com\/maps\/api\/staticmap\?center=([^&]+)/);
      if (ogImageMatch) {
        const decoded = decodeURIComponent(ogImageMatch[1]);
        const parts = decoded.split(',');
        if (parts.length === 2) {
          lat = parts[0];
          lng = parts[1];
        }
      }
    }

    // Pattern 4: Script data JSON-like structure
    if (!lat) {
      const jsonMatch = html.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
      if (jsonMatch) {
        lat = jsonMatch[1];
        lng = jsonMatch[2];
      }
    }

    // Attempt to grab title from HTML
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      title = titleMatch[1].replace(' - Google 地圖', '').replace(' - Google Maps', '').trim();
    }

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
