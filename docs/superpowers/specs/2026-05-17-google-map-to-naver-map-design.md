# Design Document: Google Maps to Naver Map Converter

## Overview
A web application that converts Google Maps location links into Naver Map search links and deep links. This tool solves the accuracy issues of Google Maps in South Korea by allowing users to quickly jump to the localized Naver Map app.

## Goals
- Resolve Google Maps short URLs.
- Extract location names in both the user's language (e.g., Chinese) and the local language (Korean).
- Provide a verification UI for the user.
- Automatically trigger mobile app redirects (Deep Links) or provide web links.

## Architecture
- **Framework:** Next.js (App Router, TypeScript).
- **Deployment:** Vercel (recommended for Serverless Functions).

## Technical Details

### 1. API Logic (`/api/convert`)
- **Input:** `url` (string)
- **Workflow:**
    1. **Resolve Redirects:** Use `fetch` to follow redirects from `maps.app.goo.gl` to get the full `google.com/maps` URL.
    2. **Fetch Metadata (Local):** Fetch the page with `Accept-Language: zh-TW` (or auto-detect) to get the common name.
    3. **Fetch Metadata (Korean):** Fetch the page with `hl=ko` parameter to extract the official Korean name from `<meta property="og:title">` or similar tags.
    4. **Extract Coordinates (Optional):** Regex extract `@lat,lng` from the URL to improve Naver search accuracy.
- **Output:**
    ```json
    {
      "name": "Shake Shack 西面店",
      "koreanName": "쉐이크쑑 서面店",
      "lat": "35.1537",
      "lng": "129.0591",
      "naverWebUrl": "...",
      "naverAppUrl": "..."
    }
    ```

### 2. Deep Link Construction
- **Web:** `https://map.naver.com/v5/search/{koreanName}`
- **iOS:** `nmap://search?query={koreanName}&appname=com.joe.gmap2nmap`
- **Android:** `intent://search?query={koreanName}&appname=com.joe.gmap2nmap#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end`

### 3. User Interface
- **Input Section:** A prominent input field for the Google Maps link.
- **Loading State:** Spinner while the server resolves the names.
- **Result Card:**
    - Display original name and Korean name.
    - Large "Open in Naver Map" button (triggers the appropriate link based on User Agent).
    - "Copy Korean Name" utility button.

## Success Criteria
- Successfully resolves `maps.app.goo.gl` links.
- Correctly identifies the Korean name for locations in Korea.
- Seamlessly opens the Naver Map app on iOS and Android devices.
