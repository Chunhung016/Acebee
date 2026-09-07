import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  Gamepad2,
  Github,
  ExternalLink,
} from 'lucide-react';

interface AcebeeMathGamePlayerProps {
  onBack: () => void;
  userRole?: string;
  studentClassName?: string;
}

export const AcebeeMathGamePlayer: React.FC<AcebeeMathGamePlayerProps> = ({
  onBack,
  studentClassName,
}) => {
  // Starts directly in full-screen in system as requested by user
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
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

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
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

        {/* Right Controls: GitHub link, Reload, Fullscreen Toggle */}
        <div className="flex items-center gap-2">
          {/* GitHub Source Reference */}
          <a
            href="https://github.com/Chunhung016/acebeemath"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-700"
            title="访问 GitHub 源码仓库: Chunhung016/acebeemath"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden md:inline">GitHub: Chunhung016/acebeemath</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

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
            title={isFullscreen ? '退出全屏' : '进入全屏'}
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

      {/* Embedded Game Iframe (Directly runs code from GitHub repo) */}
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

        <iframe
          key={iframeKey}
          src="/acebeemath/index.html"
          title="Acebee 数学冒险 (Chunhung016/acebeemath)"
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};
