import { NextResponse } from 'next/server';
import { resolveGoogleUrl } from '@/lib/resolver';

export async function POST(request: Request) {
  const { url } = await request.json();
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  
  try {
    const data = await resolveGoogleUrl(url);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve URL' }, { status: 500 });
  }
}
