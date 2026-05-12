"use client";
import { useState } from "react";

type ResolveResult = {
  query: string | null;     // 韓文地標名 (優先)
  address: string | null;   // 完整地址
  title: string;            // Google 標題
  error?: string;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [status, setStatus] = useState("");

  const handleConvert = async () => {
    if (!url) return;
    setLoading(true);
    setResult(null);
    setStatus("正在從 Google 提取店名...");

    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data: ResolveResult = await res.json();
      setResult(data);

      if (data.error) setStatus(data.error);
      else if (data.query) setStatus("找到韓文店名！");
      else setStatus("已提取地點資訊");
    } catch {
      setStatus("連線逾時，請檢查網路或重新點擊");
    } finally {
      setLoading(false);
    }
  };

  const openNaverSearch = (text: string) => {
    const encoded = encodeURIComponent(text);
    const nmapUrl = `nmap://search?query=${encoded}&appname=gmap2naver`;
    const webUrl = `https://map.naver.com/p/search/${encoded}`;

    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = `intent://search?query=${encoded}#Intent;scheme=nmap;package=com.nhn.android.nmap;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
    } else {
      window.location.href = nmapUrl;
      setTimeout(() => {
        if (document.hasFocus()) window.location.href = webUrl;
      }, 1500);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("已複製到剪貼簿，可直接在 Naver Map 貼上搜尋");
    } catch {
      alert("複製失敗，請手動選取文字");
    }
  };

  return (
    <main>
      <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🇰🇷</div>
      <h1>地標一鍵搜尋</h1>
      <p className="subtitle">解決 Google 地圖在韓國導航不準的問題</p>

      <div className="input-group">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="貼上 Google Maps 分享連結"
        />
      </div>

      <button className="convert-btn" onClick={handleConvert} disabled={loading}>
        {loading ? "尋找店名中..." : "開始轉換"}
      </button>

      <p style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--primary)", marginTop: "1rem" }}>
        {status}
      </p>

      {result && (
        <div className="result-card">
          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "bold" }}>推薦搜尋詞 (韓文)</span>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "8px", color: "var(--primary)", wordBreak: "break-word" }}>
              {result.query || result.title}
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button className="naver-btn" style={{ flex: 2 }} onClick={() => openNaverSearch(result.query || result.title)}>
                在 Naver 開啟
              </button>
              <button className="convert-btn" style={{ flex: 1, padding: "10px", background: "#666" }} onClick={() => copyToClipboard(result.query || result.title)}>
                複製
              </button>
            </div>
          </div>

          {result.address && (
            <div style={{ marginTop: "1.5rem", borderTop: "1px solid #eee", paddingTop: "1rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "bold" }}>如果搜不到店名，請試地址：</span>
              <div style={{ fontSize: "0.9rem", margin: "8px 0", color: "#555" }}>{result.address}</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="naver-btn" style={{ background: "#007aff", flex: 2, padding: "12px" }} onClick={() => openNaverSearch(result.address!)}>
                  按地址搜尋
                </button>
                <button className="convert-btn" style={{ flex: 1, padding: "10px", background: "#888" }} onClick={() => copyToClipboard(result.address!)}>
                  複製
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "2rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
        提示：Naver Map 對韓文關鍵字的搜尋最準確
      </div>
    </main>
  );
}
