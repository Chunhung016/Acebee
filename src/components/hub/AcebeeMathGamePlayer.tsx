import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Gamepad2,
  AlertCircle,
  X,
} from 'lucide-react';
import { BUNDLED_ACEBEE_MATH_HTML } from './acebeeMathFallback';

interface AcebeeMathGamePlayerProps {
  onBack: () => void;
  userRole?: string;
  studentClassName?: string;
}

const GITHUB_RAW_HTML_URL =
  'https://raw.githubusercontent.com/Chunhung016/acebeemath/main/index.html';
const GITHUB_RAW_BASE_URL =
  'https://raw.githubusercontent.com/Chunhung016/acebeemath/main/';

export const AcebeeMathGamePlayer: React.FC<AcebeeMathGamePlayerProps> = ({
  onBack,
  studentClassName,
}) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gameSource, setGameSource] = useState<{
    type: 'src' | 'srcDoc';
    value: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while game is open to avoid background page shifting
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Allow pressing ESC to return to Hub
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  // Robust multi-tier game loader:
  // 1. Fetch latest directly from GitHub Raw (bypasses any Vercel SPA rewrite)
  // 2. Check local /acebeemath/index.html (ensuring it's not rewritten to the React app)
  // 3. Instant bundled fallback (ensures game ALWAYS opens smoothly)
  const initGameSource = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    // Tier 1: Try GitHub raw directly
    try {
      const gitRes = await fetch(GITHUB_RAW_HTML_URL, { cache: 'no-cache' });
      if (gitRes.ok) {
        let html = await gitRes.text();
        if (html.includes('startButton') && html.includes('ACEBEE')) {
          const baseTag = `<base href="${GITHUB_RAW_BASE_URL}">`;
          if (html.includes('<head>')) {
            html = html.replace('<head>', `<head>\n  ${baseTag}`);
          } else {
            html = `${baseTag}\n${html}`;
          }
          setGameSource({ type: 'srcDoc', value: html });
          return;
        }
      }
    } catch {
      // GitHub network fetch failed, proceed to local or fallback
    }

    // Tier 2: Check local static /acebeemath/index.html
    try {
      const localRes = await fetch('/acebeemath/index.html', { cache: 'no-cache' });
      if (localRes.ok) {
        const text = await localRes.text();
        // Crucial: Must be genuinely the game, NOT the main React SPA rewritten by Vercel
        if (text.includes('startButton') && !text.includes('id="root"')) {
          setGameSource({ type: 'src', value: '/acebeemath/index.html' });
          return;
        }
      }
    } catch {
      // Local check failed, proceed to bundled fallback
    }

    // Tier 3: Guaranteed bundled fallback
    if (BUNDLED_ACEBEE_MATH_HTML) {
      setGameSource({ type: 'srcDoc', value: BUNDLED_ACEBEE_MATH_HTML });
      return;
    }

    setLoadError('游戏资源初始化失败，请点击重试');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initGameSource();
  }, [initGameSource, reloadKey]);

  const handleReload = () => {
    setIsLoading(true);
    setGameSource(null);
    setReloadKey((prev) => prev + 1);
  };

  // Render directly into document.body using React Portal for true popout overlay
  return createPortal(
    <div
      ref={containerRef}
      id="acebee-math-game-overlay"
      className="fixed inset-0 z-[99999] w-screen h-screen flex flex-col bg-slate-950 overflow-hidden select-none"
    >
      {/* Top Navigation Bar with Back Button */}
      <header className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          {/* Main Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
            title="返回 Acebee Hub (或按键盘 ESC 键)"
          >
            <ChevronLeft className="w-4 h-4 stroke-[3]" />
            <span>返回 Acebee Hub</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white hidden sm:inline">
              Acebee 数学冒险
            </span>
            {studentClassName && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 hidden md:inline border border-slate-700">
                {studentClassName}
              </span>
            )}
          </div>
        </div>

        {/* Right Controls: Reload & Exit */}
        <div className="flex items-center gap-2">
          {/* Reload Game */}
          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 cursor-pointer"
            title="重新加载游戏"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">重载</span>
          </button>

          {/* Close / Exit Button */}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-red-950/60 hover:bg-red-900/80 text-red-200 hover:text-white text-xs font-medium transition-colors border border-red-800/60 cursor-pointer"
            title="退出游戏 (ESC)"
          >
            <X className="w-3.5 h-3.5" />
            <span>退出</span>
          </button>
        </div>
      </header>

      {/* Embedded Game Iframe (Auto-loads HTML with GitHub Raw base for assets) */}
      <div className="relative flex-1 w-full h-full bg-[#e9f0cd] overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#e9f0cd] text-[#5b452e] space-y-3">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-bold animate-pulse flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>正在启动 Acebee 数学冒险...</span>
            </div>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-bold text-red-400">游戏加载异常</h3>
              <p className="text-xs text-slate-400 mt-1">{loadError}</p>
            </div>
            <button
              type="button"
              onClick={handleReload}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重试加载</span>
            </button>
          </div>
        )}

        {gameSource && (
          <iframe
            key={reloadKey}
            src={gameSource.type === 'src' ? gameSource.value : undefined}
            srcDoc={gameSource.type === 'srcDoc' ? gameSource.value : undefined}
            title="Acebee 数学冒险"
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setIsLoading(false)}
          />
        )}
      </div>
    </div>,
    document.body
  );
};
