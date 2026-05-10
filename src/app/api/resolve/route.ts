import { NextResponse } from 'next/server';
import { resolveGoogleUrl } from '@/lib/resolver';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({ error: '請提供網址' }, { status: 400 });
    }
    
    console.log('API Request URL:', url);
    const data = await resolveGoogleUrl(url);
    
    // 如果解析出來沒有座標，回傳 200 但帶有錯誤訊息，讓前端能顯示
    if (!data.lat || !data.lng) {
      return NextResponse.json({ 
        ...data,
        error: '無法從此連結提取座標，請嘗試長按地圖上的地點重新分享。' 
      });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ 
      error: '伺服器錯誤: ' + (error.message || '未知錯誤'),
      details: error.toString()
    }, { status: 500 });
  }
}
