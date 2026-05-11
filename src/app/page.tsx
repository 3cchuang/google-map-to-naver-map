"use client";
import { useState } from "react";

type ResolveResult = {
  query: string | null;
  title: string;
  lat: string | null;
  lng: string | null;
  error?: string;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResolveResult | null>(null);
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
      const data: ResolveResult = await res.json();
      setResult(data);

      if (data.error) setDebugMsg(data.error);
      else if (data.query) setDebugMsg("地址解析成功");
      else if (data.lat) setDebugMsg("僅取得座標，將以座標開啟");
      else setDebugMsg("無法解析");
    } catch {
      setDebugMsg("系統繁忙，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const openNaver = () => {
    if (!result) return;

    const query = result.query || result.title;
    let scheme = "";
    let web = "";

    if (query) {
      scheme = `nmap://search?query=${encodeURIComponent(query)}&appname=gmap2naver`;
      web = `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
    } else if (result.lat && result.lng) {
      scheme = `nmap://map?lat=${result.lat}&lng=${result.lng}&zoom=17&appname=gmap2naver`;
      web = `https://map.naver.com/p/?c=15.00,0,0,0,dh&lng=${result.lng}&lat=${result.lat}`;
    } else {
      return;
    }

    window.location.href = scheme;
    setTimeout(() => window.open(web, "_blank"), 1500);
  };

  const copyAddress = async () => {
    if (!result?.query) return;
    try {
      await navigator.clipboard.writeText(result.query);
      setDebugMsg("地址已複製");
    } catch {
      setDebugMsg("複製失敗，請手動選取");
    }
  };

  return (
    <main>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🇰🇷</div>
      <h1>Google &rarr; Naver Map</h1>
      <p className="subtitle">用地址直接在 Naver Map 搜尋</p>

      <div className="input-group">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="貼上 Google Maps 分享連結..."
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
          <div style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>
              地點
            </span>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: 4 }}>{result.title}</div>
          </div>

          {result.query && (
            <div style={{ marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>
                搜尋字串
              </span>
              <div style={{ fontSize: "0.95rem", marginTop: 4, wordBreak: "break-word" }}>{result.query}</div>
            </div>
          )}

          {(result.query || result.lat) && (
            <button className="naver-btn" onClick={openNaver}>
              在 Naver Map 開啟
            </button>
          )}

          {result.query && (
            <button
              className="naver-btn"
              style={{ background: "#888", marginTop: "0.5rem" }}
              onClick={copyAddress}
            >
              複製地址
            </button>
          )}

          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "1rem" }}>
            {result.query
              ? "將以地址在 Naver Map 搜尋（命中率較座標高）"
              : result.lat
              ? "未取得地址，將以座標開啟地圖"
              : "解析失敗"}
          </p>
        </div>
      )}
    </main>
  );
}
