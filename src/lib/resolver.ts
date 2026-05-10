export async function resolveGoogleUrl(url: string) {
  try {
    // 1. Fetch to follow redirects
    const response = await fetch(url, { 
      method: 'GET', 
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      }
    });
    
    const finalUrl = response.url;
    console.log('Resolved URL:', finalUrl);

    // 2. Try multiple patterns to extract coordinates
    // Pattern A: @37.5665,126.9780
    const patternA = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    
    // Pattern B: !3d37.5665!4d126.9780 (common in mobile share links)
    const patternB = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);

    // Pattern C: q=37.5665,126.9780
    const patternC = finalUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);

    const lat = patternA?.[1] || patternB?.[1] || patternC?.[1] || null;
    const lng = patternA?.[2] || patternB?.[2] || patternC?.[2] || null;

    if (!lat || !lng) {
      // If still not found, try to search for the pattern in the HTML content
      const html = await response.text();
      const htmlPattern = html.match(/\[(-?\d+\.\d+),(-?\d+\.\d+)\]/); // Sometimes in JSON inside HTML
      if (htmlPattern) {
        return { url: finalUrl, lat: htmlPattern[1], lng: htmlPattern[2], title: "Resolved from HTML" };
      }
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
