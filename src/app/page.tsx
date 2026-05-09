"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{lat: string, lng: string, title: string} | null>(null);

  const handleConvert = async () => {
    setLoading(true);
    const res = await fetch("/api/resolve", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  const openNaver = () => {
    if (!result) return;
    const naverUrl = `nmap://place?lat=${result.lat}&lng=${result.lng}&name=${encodeURIComponent(result.title)}&appname=gmap2naver`;
    window.location.href = naverUrl;
    
    // Fallback
    setTimeout(() => {
      window.open(`https://map.naver.com/v5/search/${encodeURIComponent(result.title)}?c=${result.lng},${result.lat},15,0,0,0,dh`, "_blank");
    }, 500);
  };

  return (
    <main style={{ maxWidth: "400px", width: "100%" }}>
      <h1>Google &rarr; Naver Map</h1>
      <input 
        type="text" 
        value={url} 
        onChange={(e) => setUrl(e.target.value)} 
        placeholder="Paste Google Maps link here"
        style={{ width: "100%", padding: "10px", marginBottom: "10px", color: "black" }}
      />
      <button onClick={handleConvert} disabled={loading} style={{ width: "100%", padding: "10px" }}>
        {loading ? "Resolving..." : "Convert"}
      </button>

      {result && result.lat && (
        <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px" }}>
          <p>Location Found!</p>
          <button onClick={openNaver} style={{ width: "100%", padding: "15px", background: "#03C75A", color: "white", border: "none" }}>
            Open in Naver Map App
          </button>
        </div>
      )}
    </main>
  );
}
