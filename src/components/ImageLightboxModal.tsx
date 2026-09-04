import React, { useEffect } from 'react';
import { X, ExternalLink, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageLightboxModalProps {
  src: string | null;
  alt: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({ src, alt, onClose }) => {
  const [scale, setScale] = React.useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Toolbar */}
      <div
        className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-[70%]">
          <p className="text-xs sm:text-sm font-semibold truncate text-slate-200">{alt || 'Announcement Graphic'}</p>
          <span className="text-[10px] text-slate-400 font-mono">High Resolution Preview</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-white/10 rounded-lg p-1 border border-white/20 backdrop-blur-xs">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs px-2 font-mono text-slate-300">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale((s) => Math.min(3, s + 0.25))}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {scale !== 1 && (
              <button
                onClick={() => setScale(1)}
                className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors ml-1 border-l border-white/10"
                title="Reset zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
            title="Open original link"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/15 hover:bg-red-600/80 text-white transition-colors border border-white/20"
            title="Close viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="relative max-w-full max-h-[85vh] flex items-center justify-center p-2 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          style={{ transform: `scale(${scale})`, transition: 'transform 0.15s ease-out' }}
          className="max-w-[90vw] max-h-[82vh] object-contain rounded-lg shadow-2xl"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
