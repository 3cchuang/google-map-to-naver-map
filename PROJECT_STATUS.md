# Google Maps to Naver Map 專案狀態報告

## 📌 目前進度 (Current Status)
已完成基礎架構開發，包含：
- **Next.js 16 (App Router)** 專案初始化。
- **後端 API (`/api/convert`)**：處理網址解析與地點名稱抓取。
- **前端 UI**：實作了簡潔的轉換介面，使用者點擊「Open in Naver Map」按鈕後，依偵測到的平台外開對應連結（並非自動跳轉）。
- **平台偵測**：可自動辨識 iOS/Android 並產生對應 deep link（`nmap://` / `intent://`）以喚起 Naver Map App，電腦端則開啟網頁版（`map.naver.com`）。
- **UI 配色策略**：目前以 `text-zinc-900` + `bg-white` 強制鎖定亮色配色，迴避了系統 Dark Mode 下字體看不見的問題；尚未實作真正的 Dark Mode 適配（無 `dark:` variant）。

## ⚠️ 遇到的問題 (Technical Challenges)

### 1. Google Maps 的語言鎖定 (Language Localization)
儘管我們在後端請求中加入了以下手段，Google 依然強勢傳回中文名稱：
- 強制設定 `Accept-Language: ko-KR` Header。
- 在網址加入 `hl=ko` 與 `gl=kr` 參數。
- 使用 `google.co.kr` 網域進行請求。
- **原因分析**：Google 會根據發出請求的伺服器 IP (Vercel/Google Cloud 等) 來決定顯示語言。由於伺服器不在韓國，Google 往往會忽略參數，優先根據 IP 或原始分享連結的語系傳回中文資料。

### 2. 爬蟲抓取限制 (Bot Detection)
- Google Maps 的許多地點資訊是透過 JavaScript 動態渲染的。
- 伺服器端的 `fetch` 只能抓取到初始 HTML。雖然我們嘗試解析內部的 `APP_INITIALIZATION_STATE` JSON 資料，但當中的地點名稱欄位常會被 Google 的伺服器端邏輯強制轉為中文。
- 即使網址路徑中包含韓文編碼（如 `삼정타워`），有時 Google 的重新導向機制會將其標準化為英文或中文，導致資訊丟失。

## 🎯 想要達成的目標 (Future Goals)

### 1. 穩定取得 100% 正確的韓文店名
- **方案 A (Google Places API)**：考慮引入官方 API（如 Place Details），這是最穩定的作法，但可能產生費用且需申請 API Key。
- **方案 B (Naver Search Fallback)**：當 Google 傳回中文時，直接拿該中文名稱去 Naver Map 的搜尋 API 進行「反向查詢」，抓回 Naver 定義的韓文店名。

### 2. 強化地點驗證 UI
- 除了店名，目標能顯示地點的縮圖或地址片段，增加使用者確認的信心。
- 提供「手動輸入搜尋」功能，作為轉換失敗時的備案。

### 3. 跨平台深度連結優化
- 確保所有類型的 Naver Map 連結（搜尋連結、導航連結、地點連結）都能精確觸發 App 內的對應頁面。

---
*更新日期：2026-05-18*
