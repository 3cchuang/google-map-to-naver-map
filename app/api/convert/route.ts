import { resolveGoogleMapsUrl } from '@/lib/google-maps';
import { getNaverLinks } from '@/lib/naver-map';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const data = await resolveGoogleMapsUrl(url);
    
    if (!data.koreanName) {
      return NextResponse.json(
        { error: 'Could not resolve location name' },
        { status: 404 }
      );
    }

    const links = getNaverLinks(data.koreanName);
    
    return NextResponse.json({ 
      ...data, 
      googleUrl: url,
      links 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
