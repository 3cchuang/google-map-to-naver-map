import { NextResponse } from 'next/server';
import { resolveGoogleUrl } from '@/lib/resolver';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: '請提供網址' }, { status: 400 });
    }

    const data = await resolveGoogleUrl(url);

    if (!data.query && !data.address && !data.lat) {
      return NextResponse.json({
        ...data,
        error: '無法從此連結解析地址，請改用「分享 > 複製連結」並再試一次。',
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤: ' + (error?.message || '未知錯誤') },
      { status: 500 }
    );
  }
}
