import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  Gamepad2,
  AlertCircle,
} from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gameSource, setGameSource] = useState<{
    type: 'src' | 'srcDoc';
    value: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

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

  // Load the game: check local static files first, fallback to GitHub Raw if 404 (e.g., on Vercel)
  const initGameSource = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      // 1. Test if local /acebeemath/index.html is reachable
      const localRes = await fetch('/acebeemath/index.html', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (localRes.ok) {
        // Local static file exists and is accessible
        setGameSource({ type: 'src', value: '/acebeemath/index.html' });
        return;
      }
    } catch {
      // Local fetch check failed, will fallback to GitHub Raw
    }

    // 2. Fallback: fetch HTML from GitHub raw and inject <base href="...">
    try {
      const gitRes = await fetch(GITHUB_RAW_HTML_URL, { cache: 'no-cache' });
      if (!gitRes.ok) {
        throw new Error(`无法从 GitHub 仓库加载游戏 (HTTP ${gitRes.status})`);
      }
      let html = await gitRes.text();

      // Inject <base> tag so all relative images (images/...) load directly from GitHub raw
      const baseTag = `<base href="${GITHUB_RAW_BASE_URL}">`;
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>\n  ${baseTag}`);
      } else {
        html = `${baseTag}\n${html}`;
      }

      setGameSource({ type: 'srcDoc', value: html });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '游戏加载失败，请检查网络连接';
      setLoadError(msg);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initGameSource();
  }, [initGameSource, reloadKey]);

  const handleReload = () => {
    setGameSource(null);
    setReloadKey((prev) => prev + 1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-900 transition-all duration-200 overflow-hidden shadow-2xl ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen'
          : 'w-full h-[780px] lg:h-[820px] rounded-2xl border border-slate-700'
      }`}
    >
      {/* Top Header Bar with prominent Back button */}
      <header className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-3">
          {/* Main Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors shadow-sm active:scale-95"
            title="返回 Acebee Hub (或按 ESC 键)"
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
              <span className="text-xs text-slate-400 hidden md:inline">
                ({studentClassName})
              </span>
            )}
          </div>
        </div>

        {/* Right Controls: Reload & Fullscreen Toggle */}
        <div className="flex items-center gap-2">
          {/* Reload Game */}
          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
            title="重新加载游戏"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">重载</span>
          </button>

          {/* Toggle Fullscreen / Window */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
            title={isFullscreen ? '退出全屏' : '全屏模式'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">退出全屏</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">全屏模式</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Embedded Game Iframe (Auto-fallback to GitHub raw if local static is 404 on Vercel) */}
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
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
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
    </div>
  );
};
