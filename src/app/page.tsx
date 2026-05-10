"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{lat: string, lng: string, title: string, error?: string} | null>(null);
  const [debugMsg, setDebugMsg] = useState("");

  const handleConvert = async () => {
    if (!url) {
      alert("請先貼上網址");
      return;
    }
    setLoading(true);
    setResult(null);
    setDebugMsg("正在發送請求...");
    
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      
      setDebugMsg(`伺服器回應狀態: ${res.status}`);
      
      const data = await res.json();
      console.log("API Response:", data);
      setResult(data);
      
      if (data.error) {
        setDebugMsg(`解析失敗: ${data.error}`);
      } else if (data.lat) {
        setDebugMsg("解析成功！");
      } else {
        setDebugMsg("解析完成但無座標資料");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setDebugMsg(`連線出錯: ${err.message}`);
      alert("轉換出錯，請確認網路連線或稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const openNaver = () => {
    if (!result || !result.lat) return;
    const naverUrl = `nmap://place?lat=${result.lat}&lng=${result.lng}&name=${encodeURIComponent(result.title)}&appname=gmap2naver`;
    
    // 試著開啟 App
    window.location.href = naverUrl;
    
    // 備案：開啟網頁版
    setTimeout(() => {
      window.open(`https://map.naver.com/v5/search/${encodeURIComponent(result.title)}?c=${result.lng},${result.lat},15,0,0,0,dh`, "_blank");
    }, 1200);
  };

  return (
    <main>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🇰🇷</div>
      <h1>Google &rarr; Naver Map</h1>
      <p className="subtitle">貼上 Google 地圖分享連結</p>

      <div className="input-group">
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="貼上連結 (例如: https://maps.app.goo.gl/...)"
        />
      </div>

      <button 
        className="convert-btn" 
        onClick={handleConvert} 
        disabled={loading}
      >
        {loading ? "轉換中..." : "開始轉換"}
      </button>

      {/* Debug 狀態欄：這能讓我們知道發生什麼事 */}
      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "1rem" }}>
        狀態: {debugMsg}
      </p>

      {result && result.lat && (
        <div className="result-card">
          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>成功解析位置</span>
            <div style={{ fontSize: "1.1rem", fontWeight: "600", marginTop: "4px" }}>{result.title}</div>
            <div style={{ fontSize: "0.7rem", color: "#888" }}>座標: {result.lat}, {result.lng}</div>
          </div>
          <button className="naver-btn" onClick={openNaver}>
            在 Naver Map 中開啟
          </button>
        </div>
      )}

      {result && result.error && (
        <div style={{ color: "red", marginTop: "1rem", fontSize: "0.9rem" }}>
          ❌ {result.error}
        </div>
      )}

      <div style={{ marginTop: "3rem", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
        專為韓國旅遊設計 • 座標精確對接
      </div>
    </main>
  );
}
