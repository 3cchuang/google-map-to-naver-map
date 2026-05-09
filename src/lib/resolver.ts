export async function resolveGoogleUrl(url: string) {
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const finalUrl = response.url;
  
  // Extract coords from URL like ...@37.5665,126.9780...
  const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  
  return {
    url: finalUrl,
    lat: coordMatch ? coordMatch[1] : null,
    lng: coordMatch ? coordMatch[2] : null,
    title: "Resolved Location"
  };
}
