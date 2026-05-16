# Google Maps to Naver Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web app that converts Google Maps links to Naver Map search/deep links with name verification.

**Architecture:** Next.js App Router with a server-side API for URL resolution and lightweight scraping.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide React (icons).

---

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: Scaffold Next.js project**
Run: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --no-git` (since .git already exists)

- [ ] **Step 2: Install dependencies**
Run: `npm install lucide-react`

- [ ] **Step 3: Verify initial build**
Run: `npm run build`

- [ ] **Step 4: Commit**
```bash
git add .
git commit -m "chore: initialize Next.js project"
```

---

### Task 2: Implement Google Maps Resolver Library

**Files:**
- Create: `lib/google-maps.ts`
- Test: `tests/lib/google-maps.test.ts`

- [ ] **Step 1: Write failing test for URL resolution**
```typescript
// tests/lib/google-maps.test.ts
import { resolveGoogleMapsUrl } from '@/lib/google-maps';

describe('resolveGoogleMapsUrl', () => {
  it('should resolve short URLs and extract names', async () => {
    const url = 'https://maps.app.goo.gl/jhzmcZJWfPkv5JGn6';
    const result = await resolveGoogleMapsUrl(url);
    expect(result.name).toContain('Shake Shack');
    expect(result.koreanName).toBe('쉐이크쑑 서면점');
  });
});
```

- [ ] **Step 2: Implement resolver logic**
```typescript
// lib/google-maps.ts
export async function resolveGoogleMapsUrl(url: string) {
  // 1. Follow redirects
  const response = await fetch(url, { redirect: 'follow' });
  const finalUrl = response.url;
  
  // 2. Fetch Chinese name
  const resZh = await fetch(finalUrl, { headers: { 'Accept-Language': 'zh-TW' } });
  const htmlZh = await resZh.text();
  const name = htmlZh.match(/<meta property="og:title" content="([^"]+)">/)?.[1] || '';

  // 3. Fetch Korean name
  const resKo = await fetch(finalUrl + '&hl=ko', { headers: { 'Accept-Language': 'ko-KR' } });
  const htmlKo = await resKo.text();
  const koreanName = htmlKo.match(/<meta property="og:title" content="([^"]+)">/)?.[1] || '';

  return { name: name.replace(' · Google 地圖', ''), koreanName: koreanName.replace(' · Google 지도', '') };
}
```

- [ ] **Step 3: Run tests and commit**
Run: `npm test` (setup jest/vitest first if needed, or run a small script to verify)
```bash
git add lib/google-maps.ts
git commit -m "feat: implement google maps resolver"
```

---

### Task 3: Implement Naver Map Link Generator

**Files:**
- Create: `lib/naver-map.ts`

- [ ] **Step 1: Implement link generator**
```typescript
// lib/naver-map.ts
export function getNaverLinks(query: string) {
  const encoded = encodeURIComponent(query);
  return {
    web: `https://map.naver.com/v5/search/${encoded}`,
    ios: `nmap://search?query=${encoded}&appname=com.joe.gmap2nmap`,
    android: `intent://search?query=${encoded}&appname=com.joe.gmap2nmap#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;end`
  };
}
```

- [ ] **Step 2: Commit**
```bash
git add lib/naver-map.ts
git commit -m "feat: implement naver map link generator"
```

---

### Task 4: Create API Route

**Files:**
- Create: `app/api/convert/route.ts`

- [ ] **Step 1: Implement API handler**
```typescript
// app/api/convert/route.ts
import { resolveGoogleMapsUrl } from '@/lib/google-maps';
import { getNaverLinks } from '@/lib/naver-map';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { url } = await req.json();
  const data = await resolveGoogleMapsUrl(url);
  const links = getNaverLinks(data.koreanName);
  return NextResponse.json({ ...data, ...links });
}
```

- [ ] **Step 2: Commit**
```bash
git add app/api/convert/route.ts
git commit -m "feat: add convert API route"
```

---

### Task 5: Build UI - Main Page

**Files:**
- Modify: `app/page.tsx`
- Create: `components/ConvertForm.tsx`

- [ ] **Step 1: Create ConvertForm component**
Implement the input, loading state, and result display with "Open in Naver Map" button. Use `navigator.userAgent` to decide which link to trigger.

- [ ] **Step 2: Update main page**
Clean up `app/page.tsx` and include `ConvertForm`.

- [ ] **Step 3: Verify and commit**
Run: `npm run dev` and test with the example URL.
```bash
git add app/page.tsx components/ConvertForm.tsx
git commit -m "feat: build user interface"
```
