import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  Gamepad2,
  Github,
  ExternalLink,
  Info,
} from 'lucide-react';

interface AcebeeMathGamePlayerProps {
  onBack: () => void;
  userRole?: string;
  studentClassName?: string;
}

export const AcebeeMathGamePlayer: React.FC<AcebeeMathGamePlayerProps> = ({
  onBack,
  userRole = 'teacher',
  studentClassName,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

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
      className={`flex flex-col bg-slate-900 transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 ${
        isFullscreen
          ? 'fixed inset-2 sm:inset-4 z-50 h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)]'
          : 'w-full h-[780px] lg:h-[820px]'
      }`}
    >
      {/* Game Control Top Bar */}
      <header className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-colors border border-slate-700"
            title="返回 Acebee Hub"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>返回 Acebee Hub</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white tracking-tight">Acebee 数学冒险</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  同页即玩 (In-Page Game)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                儿童互动算术游戏 • 加减乘除动手操作与看图列式
                {studentClassName && ` • ${studentClassName}`}
              </p>
            </div>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2">
          {/* GitHub repo reference link */}
          <a
            href="https://github.com/Chunhung016/acebeemath"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors border border-slate-700"
            title="查看开源代码仓库 (GitHub)"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Chunhung016/acebeemath</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Refresh / Restart game */}
          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors border border-slate-700"
            title="重新加载游戏"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">重载</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-xs"
            title={isFullscreen ? '退出全屏视图' : '全屏展开视图'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">恢复窗口</span>
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

      {/* Embedded Iframe Game Container */}
      <div className="relative flex-1 w-full h-full bg-[#e9f0cd] overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#e9f0cd] text-[#5b452e] space-y-3">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-bold animate-pulse flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>正在加载 ACEBEE 数学冒险...</span>
            </div>
            <p className="text-xs text-amber-800/80">无需外部网络，本地极速启动</p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src="/acebeemath/index.html"
          title="Acebee 数学冒险"
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Footer hint */}
      <footer className="px-4 py-2 bg-slate-950 text-slate-400 text-[11px] flex items-center justify-between border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>游戏正在当前页面运行，进度将自动保存至本地。</span>
        </div>
        <div className="text-[10px] text-slate-500 hidden sm:block">
          ACEBEE Academy Math Adventure Platform
        </div>
      </footer>
    </div>
  );
};
