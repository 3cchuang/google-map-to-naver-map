"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{lat: string | null, lng: string | null, title: string, error?: string} | null>(null);
  const [debugMsg, setDebugMsg] = useState("");

  const handleConvert = async () => {
    if (!url) return;
    setLoading(true);
    setResult(null);
    setDebugMsg("解析中...");
    
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      
      const data = await res.json();
      setResult(data);
      setDebugMsg(data.lat ? "座標解析成功！" : "已抓取地點名稱（搜尋模式）");
    } catch (err: any) {
      setDebugMsg("系統繁忙，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const openNaver = (mode: 'direct' | 'search') => {
    if (!result) return;
    
    let naverUrl = "";
    if (mode === 'direct' && result.lat) {
      naverUrl = `nmap://place?lat=${result.lat}&lng=${result.lng}&name=${encodeURIComponent(result.title)}&appname=gmap2naver`;
    } else {
      naverUrl = `nmap://search?query=${encodeURIComponent(result.title)}&appname=gmap2naver`;
    }
    
    window.location.href = naverUrl;
    
    // Fallback to web
    setTimeout(() => {
      if (mode === 'direct' && result.lat) {
        window.open(`https://map.naver.com/v5/search/${encodeURIComponent(result.title)}?c=${result.lng},${result.lat},15,0,0,0,dh`, "_blank");
      } else {
        window.open(`https://map.naver.com/v5/search/${encodeURIComponent(result.title)}`, "_blank");
      }
    }, 1500);
  };

  return (
    <main>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🇰🇷</div>
      <h1>Google &rarr; Naver Map</h1>
      <p className="subtitle">即使沒有精確座標，也能一鍵搜尋</p>

      <div className="input-group">
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="貼上分享連結..."
        />
      </div>

      <button className="convert-btn" onClick={handleConvert} disabled={loading}>
        {loading ? "處理中..." : "開始轉換"}
      </button>

      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "1rem" }}>
        狀態: {debugMsg}
      </p>

      {result && (
        <div className="result-card">
          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>目的地</span>
            <div style={{ fontSize: "1.2rem", fontWeight: "700", marginTop: "4px" }}>{result.title}</div>
          </div>
          
          {result.lat ? (
            <button className="naver-btn" onClick={() => openNaver('direct')}>
              在 Naver Map 開啟 (精確定位)
            </button>
          ) : (
            <button className="naver-btn" style={{ background: "#007aff" }} onClick={() => openNaver('search')}>
              在 Naver Map 搜尋此店名
            </button>
          )}
          
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "1rem" }}>
            {result.lat ? "已成功對接座標，將直接定位" : "由於 Google 隱藏了座標，我們將為您在 Naver 中自動搜尋店名"}
          </p>
        </div>
      )}
    </main>
  );
}
