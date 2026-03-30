/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Upload, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  ShieldAlert, 
  BarChart3, 
  RefreshCcw,
  Maximize2,
  Terminal as TerminalIcon,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini AI
const getApiKey = () => {
  try {
    return process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch {
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  }
};

const genAI = new GoogleGenAI({ apiKey: getApiKey() });

interface AnalysisResult {
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  summary: string;
  keyLevels: { support: string[]; resistance: string[] };
  indicators: { name: string; signal: string }[];
  recommendation: string;
  signal: string;
  entryPoint: string | number;
  stopLoss: string | number;
  takeProfit: string | number;
  strategy: string;
}

export default function App() {
  const [image, setImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem('narakasura_image');
    } catch (e) {
      return null;
    }
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(() => {
    try {
      const saved = localStorage.getItem('narakasura_result');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (image) {
      localStorage.setItem('narakasura_image', image);
    } else {
      localStorage.removeItem('narakasura_image');
    }
  }, [image]);

  useEffect(() => {
    if (result) {
      localStorage.setItem('narakasura_result', JSON.stringify(result));
    } else {
      localStorage.removeItem('narakasura_result');
    }
  }, [result]);

  const formatPrice = (val: any) => {
    if (val === undefined || val === null || val === '') return 'N/A';
    const strVal = String(val);
    // Remove everything except numbers and dots
    const cleaned = strVal.replace(/[^0-9.]/g, '');
    return cleaned || strVal;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setImage(imageData);
        setResult(null);
        setError(null);
        analyzeChart(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeChart = async (imageData?: string) => {
    const currentImage = imageData || image;
    if (!currentImage) return;

    setIsAnalyzing(true);
    setError(null);

    const apiKey = getApiKey();
    if (!apiKey) {
      setError("API KEY TIDAK DITEMUKAN: Pastikan GEMINI_API_KEY telah dikonfigurasi di environment atau rahasia GitHub.");
      setIsAnalyzing(false);
      return;
    }

    try {
      const model = "gemini-3-flash-preview";
      const base64Data = currentImage.split(',')[1];
      
      const prompt = `
        Analisa tangkapan layar chart market ini dengan fokus utama pada ICT (Inner Circle Trader) dan Price Action.
        Berikan analisa teknikal mendalam dalam format JSON.
        Gunakan Bahasa Indonesia untuk semua teks penjelasan.
        
        Sertakan dalam analisa:
        - trend: 'bullish', 'bearish', atau 'neutral'
        - confidence: angka antara 0 dan 100
        - summary: ringkasan analisa berdasarkan Market Structure (BOS/MSS), Liquidity (BSL/SSL), dan Price Action.
        - keyLevels: objek dengan array 'support' (termasuk Order Blocks/Demand) dan 'resistance' (termasuk Order Blocks/Supply).
        - indicators: array objek dengan 'name' dan 'signal' (identifikasi Fair Value Gaps (FVG), Liquidity Voids, atau pola candlestick signifikan).
        - recommendation: rekomendasi trading (beli, jual, atau tunggu) berdasarkan zona Premium/Discount.
        - signal: sinyal spesifik (STRONG BUY, BUY, NEUTRAL, SELL, STRONG SELL).
        - entryPoint: level harga entry (HANYA ANGKA, jangan sertakan teks penjelasan).
        - stopLoss: level harga stop loss (HANYA ANGKA, jangan sertakan teks penjelasan).
        - takeProfit: level harga take profit (HANYA ANGKA, jangan sertakan teks penjelasan).
        - strategy: jelaskan bagaimana ICT dan Price Action digunakan dalam analisa ini (misal: Silver Bullet, Power of 3, atau Judas Swing).
        
        Kembalikan HANYA JSON.
      `;

      const response = await genAI.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/png", data: base64Data } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (text) {
        const parsedResult = JSON.parse(text) as AnalysisResult;
        setResult(parsedResult);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("KEGAGALAN SISTEM: ANALISA AI TERPUTUS. PERIKSA KONEKSI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setImage(imageData);
        setResult(null);
        setError(null);
        analyzeChart(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-narakasura-black text-white font-mono selection:bg-narakasura-red selection:text-white overflow-x-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,0,0.05),transparent_70%)]" />
        <div className="scanline" />
      </div>

      {/* Header */}
      <header className="border-b border-narakasura-red/30 bg-narakasura-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <img 
                src="https://i.postimg.cc/gJW39vnn/20260327-085307.png" 
                alt="Narakasura Icon" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="font-display text-2xl tracking-tighter uppercase italic">
              Narakasura <span className="text-narakasura-red">Analyzer</span>
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[10px] uppercase tracking-widest text-narakasura-red/60">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-narakasura-red animate-pulse" />
              Status Sistem: Optimal
            </div>
            <div>ID Terminal: VX-9902</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload & Preview */}
          <div className="lg:col-span-7 space-y-6">
            <div 
              className={`relative border-2 border-dashed transition-all duration-300 group ${
                image ? 'border-narakasura-red/50' : 'border-narakasura-gray hover:border-narakasura-red/40'
              } bg-narakasura-gray/30 rounded-lg overflow-hidden flex flex-col items-center justify-center min-h-[400px] cursor-pointer`}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={() => !image && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*" 
              />

              <AnimatePresence mode="wait">
                {!image ? (
                  <motion.div 
                    key="upload-prompt"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center p-8"
                  >
                    <div className="w-16 h-16 bg-narakasura-red/10 border border-narakasura-red/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-narakasura-red" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">Inisialisasi Feed Data</h3>
                    <p className="text-narakasura-red/60 text-sm max-w-xs mx-auto">
                      Tarik dan lepas tangkapan layar chart Anda atau klik untuk menelusuri penyimpanan lokal.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="image-preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full relative"
                  >
                    <img 
                      src={image} 
                      alt="Pratinjau Chart" 
                      className="w-full h-full object-contain max-h-[600px]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-narakasura-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-6">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setImage(null);
                          setResult(null);
                          setError(null);
                          localStorage.removeItem('narakasura_image');
                          localStorage.removeItem('narakasura_result');
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="bg-narakasura-red hover:bg-red-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
                      >
                        <RefreshCcw className="w-3 h-3" /> Reset Feed
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isAnalyzing && (
              <div className="w-full bg-narakasura-gray/50 border border-narakasura-red/30 p-8 text-center space-y-6 overflow-hidden relative">
                <div className="h-20 flex items-center justify-center relative">
                  <svg viewBox="0 0 200 40" className="w-full h-full stroke-narakasura-red fill-none stroke-2">
                    <motion.path
                      d="M 0 20 L 40 20 L 45 10 L 50 30 L 55 20 L 90 20 L 95 5 L 100 35 L 105 20 L 140 20 L 145 10 L 150 30 L 155 20 L 200 20"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ 
                        pathLength: [0, 1],
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-narakasura-black/20 via-transparent to-narakasura-black/20" />
                </div>
                <div className="space-y-2">
                  <p className="text-narakasura-red font-bold animate-pulse uppercase tracking-[0.3em] text-xs">
                    Mendeteksi Likuiditas & Struktur Pasar...
                  </p>
                  <div className="flex justify-center gap-4 text-[10px] text-narakasura-red/40 font-mono">
                    <span>BPM: 142</span>
                    <span>SYS: 120</span>
                    <span>DIA: 80</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Analysis Results */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-narakasura-gray/20 border border-narakasura-gray p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-narakasura-red">
                <TerminalIcon className="w-4 h-4" />
                Output Analisa
              </div>
              <div className="text-[10px] text-white/30">V.1.0.4-STABLE</div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-narakasura-red/10 border-l-4 border-narakasura-red p-4 flex gap-3 items-start"
                >
                  <AlertCircle className="w-5 h-5 text-narakasura-red shrink-0" />
                  <div>
                    <h4 className="text-narakasura-red font-bold text-sm uppercase">Error Kritis</h4>
                    <p className="text-xs text-narakasura-red/80 mt-1">{error}</p>
                  </div>
                </motion.div>
              )}

              {result ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Summary Card */}
                  <div className="bg-narakasura-gray/40 border border-narakasura-red/20 p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${
                        result.trend === 'bullish' ? 'border-green-500 text-green-500' : 
                        result.trend === 'bearish' ? 'border-narakasura-red text-narakasura-red' : 
                        'border-yellow-500 text-yellow-500'
                      }`}>
                        Tren: {result.trend}
                      </div>
                      <div className="text-xs text-white/50">Keyakinan: {result.confidence}%</div>
                    </div>

                    <h2 className="text-2xl font-display uppercase italic mb-3 leading-tight">
                      Sentimen <span className="text-narakasura-red">Pasar</span>
                    </h2>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-[10px] font-bold uppercase tracking-widest bg-narakasura-red/20 text-narakasura-red px-2 py-0.5 border border-narakasura-red/30">
                        Strategi: {result.strategy || 'Multi-Indicator'}
                      </div>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed border-l-2 border-narakasura-red/30 pl-4 italic">
                      "{result.summary}"
                    </p>
                  </div>

                  {/* Recommendation & Signal */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-narakasura-red p-4 flex flex-col justify-between min-h-[120px]">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">Sinyal Utama</div>
                      <div className="text-3xl font-display uppercase italic text-white">{result.signal}</div>
                    </div>
                    <div className="bg-narakasura-gray/60 border border-narakasura-gray p-4 flex flex-col justify-between">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-narakasura-red/70">Tingkat Risiko</div>
                      <div className="flex items-center gap-2">
                        {result.confidence > 70 ? (
                          <ShieldAlert className="w-6 h-6 text-green-500" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-yellow-500" />
                        )}
                        <span className="text-xl font-bold">{result.confidence > 70 ? 'RENDAH' : 'MODERAT'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Entry Point Section */}
                  <div className="bg-narakasura-gray/40 border-l-4 border-blue-500 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500/70 mb-1">Titik Entry Terbaik</div>
                    <div className="text-2xl font-mono font-bold text-white">{formatPrice(result.entryPoint)}</div>
                  </div>

                  {/* SL / TP Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-narakasura-gray/40 border-l-4 border-narakasura-red p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-narakasura-red/70 mb-1">Stop Loss (SL)</div>
                      <div className="text-xl font-mono font-bold text-white">{formatPrice(result.stopLoss)}</div>
                    </div>
                    <div className="bg-narakasura-gray/40 border-l-4 border-green-500 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-green-500/70 mb-1">Take Profit (TP)</div>
                      <div className="text-xl font-mono font-bold text-white">{formatPrice(result.takeProfit)}</div>
                    </div>
                  </div>

                  <div className="bg-narakasura-gray/40 border border-narakasura-gray p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Protokol Aksi</div>
                    <div className="text-xl font-bold text-narakasura-red uppercase tracking-tight">{result.recommendation}</div>
                  </div>

                  {/* Key Levels */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-green-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Resistansi
                      </div>
                      <div className="space-y-1">
                        {Array.isArray(result.keyLevels?.resistance) && result.keyLevels.resistance.map((level, i) => (
                          <div key={i} className="bg-narakasura-gray/30 border border-narakasura-gray p-2 text-xs font-mono">
                            {level}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-narakasura-red flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Support
                      </div>
                      <div className="space-y-1">
                        {Array.isArray(result.keyLevels?.support) && result.keyLevels.support.map((level, i) => (
                          <div key={i} className="bg-narakasura-gray/30 border border-narakasura-gray p-2 text-xs font-mono">
                            {level}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Indicators */}
                  <div className="bg-narakasura-gray/20 border border-narakasura-gray p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3">Sinyal Indikator</div>
                    <div className="space-y-2">
                      {Array.isArray(result.indicators) && result.indicators.map((ind, i) => (
                        <div key={i} className="flex items-center justify-between text-xs border-b border-narakasura-gray/50 pb-2">
                          <span className="text-white/70">{ind.name}</span>
                          <span className={`font-bold ${
                            ind.signal?.toLowerCase().includes('buy') || ind.signal?.toLowerCase().includes('bull') || ind.signal?.toLowerCase().includes('beli') ? 'text-green-500' :
                            ind.signal?.toLowerCase().includes('sell') || ind.signal?.toLowerCase().includes('bear') || ind.signal?.toLowerCase().includes('jual') ? 'text-narakasura-red' :
                            'text-yellow-500'
                          }`}>
                            {ind.signal}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </motion.div>
              ) : !isAnalyzing && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20 grayscale">
                  <TerminalIcon className="w-12 h-12 mb-4" />
                  <p className="text-xs uppercase tracking-widest">Menunggu Input Data...</p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-narakasura-gray mt-12">
        <div className="grid md:grid-cols-2 gap-8 text-[10px] text-white/30 uppercase tracking-[0.2em]">
          <div>
            <h5 className="text-narakasura-red/50 mb-2">Sanggahan</h5>
            <p>Trading melibatkan risiko yang signifikan. Analisa AI ini hanya untuk tujuan informasi dan bukan merupakan saran finansial.</p>
          </div>
          <div className="flex flex-col items-end">
            <h5 className="text-narakasura-red/50 mb-2">Waktu Sistem</h5>
            <p>{new Date().toISOString()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
