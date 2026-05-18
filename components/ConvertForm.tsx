'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface ConversionResult {
  name: string;
  googleUrl: string;
  koreanName: string;
  links: {
    web: string;
    ios: string;
    android: string;
  };
}

export default function ConvertForm() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');

  useEffect(() => {
    // Platform detection
    const userAgent = (navigator.userAgent || navigator.vendor || (window as (Window & { opera?: string }))['opera'] || '').toString();
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as (Window & { MSStream?: any }))['MSStream'];
    const isAndroid = /android/i.test(userAgent);

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('web');
    }
  }, []);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResult(data as ConversionResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getNaverUrl = () => {
    if (!result) return '';
    return result.links[platform] || result.links.web;
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 text-zinc-900">
      <form onSubmit={handleConvert} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Google Maps URL..."
            className="block w-full pl-10 pr-3 py-3 border border-zinc-200 rounded-xl bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-sm"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Converting...
            </>
          ) : (
            'Convert'
          )}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-100">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-6 bg-white border border-zinc-100 rounded-2xl shadow-lg space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <MapPin size={24} />
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-0.5">中文地點</p>
                <h2 className="text-lg font-bold text-zinc-900">{result.name}</h2>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-0.5">韓文地點</p>
                <h2 className="text-lg font-bold text-zinc-700">{result.koreanName}</h2>
              </div>
              <div className="pt-1">
                <p className="text-[10px] text-zinc-400 truncate max-w-[250px]">
                  {result.googleUrl}
                </p>
              </div>
            </div>
          </div>
          
          <a
            href={getNaverUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full p-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all group"
          >
            <span className="font-semibold">Open in Naver Map</span>
            <ExternalLink size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
          
          <p className="text-[10px] text-center text-zinc-400">
            Detected platform: <span className="capitalize">{platform}</span>
          </p>
        </div>
      )}
    </div>
  );
}
