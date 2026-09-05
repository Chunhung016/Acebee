import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, ImageOff, Maximize2, ExternalLink, ZoomIn, RefreshCw } from 'lucide-react';
import { getAlternativeImageUrls } from '../utils/imageUtils';

interface AnnouncementImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  variant?: 'card' | 'pinned' | 'modal' | 'thumbnail';
  onEnlarge?: () => void;
  showZoomButton?: boolean;
}

export const AnnouncementImage: React.FC<AnnouncementImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  variant = 'card',
  onEnlarge,
  showZoomButton = true,
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  // Sync state whenever the src prop updates
  useEffect(() => {
    setCurrentSrc(src);
    setIsLoading(true);
    setHasError(false);
    setFallbackIndex(0);
  }, [src]);

  if (!src || !src.trim()) return null;

  const handleImageError = () => {
    const fallbacks = getAlternativeImageUrls(src);
    if (fallbackIndex < fallbacks.length) {
      setCurrentSrc(fallbacks[fallbackIndex]);
      setFallbackIndex((prev) => prev + 1);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100/90 border border-slate-200 text-slate-400 p-4 text-center select-none ${
          variant === 'modal' ? 'h-56 rounded-xl' : variant === 'thumbnail' ? 'w-16 h-16 rounded-lg' : 'h-48 sm:h-52 rounded-t-xl'
        } ${containerClassName}`}
      >
        <ImageOff className="w-5 h-5 text-slate-400 mb-1" />
        <span className="text-[11px] font-medium text-slate-600">Announcement Image</span>
        <div className="flex items-center gap-2 mt-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHasError(false);
              setIsLoading(true);
              setCurrentSrc(src + (src.includes('?') ? '&' : '?') + `t=${Date.now()}`);
            }}
            className="text-[10px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs"
          >
            <RefreshCw className="w-2.5 h-2.5" /> Retry
          </button>
          {variant === 'modal' && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-semibold"
            >
              Open Link <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Thumbnail variant for Admin list
  if (variant === 'thumbnail') {
    return (
      <div className={`relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group ${containerClassName}`}>
        {isLoading && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}
        <img
          src={currentSrc}
          alt={alt}
          onLoad={() => setIsLoading(false)}
          onError={handleImageError}
          className={`w-full h-full object-cover transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        {onEnlarge && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEnlarge();
            }}
            className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
            title="Enlarge image"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Modal variant: full, uncropped presentation with zoom action
  if (variant === 'modal') {
    return (
      <div className={`relative w-full rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200/80 group ${containerClassName}`}>
        {/* Loading shimmer */}
        {isLoading && (
          <div className="w-full h-64 bg-slate-200 animate-pulse flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-slate-300 animate-pulse" />
          </div>
        )}

        {/* Ambient blurred backdrop for aesthetic framing */}
        <div className="relative w-full flex items-center justify-center overflow-hidden min-h-[220px] max-h-[560px] bg-slate-950/5">
          <img
            src={currentSrc}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 scale-125 select-none pointer-events-none"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />

          <img
            src={currentSrc}
            alt={alt}
            onLoad={() => setIsLoading(false)}
            onError={handleImageError}
            className={`relative z-10 w-full max-h-[560px] object-contain transition-all duration-300 ${
              isLoading ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
            } ${className}`}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Action bar on hover / mobile */}
        {showZoomButton && !isLoading && (
          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
            {onEnlarge && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnlarge();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-950 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 backdrop-blur-xs transition-all hover:scale-105"
                title="View image in full screen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full Size</span>
              </button>
            )}
            <a
              href={currentSrc}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-950 text-white text-xs shadow-md backdrop-blur-xs transition-all"
              title="Open image in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    );
  }

  // Card & Pinned variants: Smart-fit container that NEVER cuts off poster graphics or titles
  const heightClass = variant === 'pinned' ? 'h-56 sm:h-64' : 'h-48 sm:h-52';

  return (
    <div
      className={`relative ${heightClass} w-full overflow-hidden bg-slate-900/5 flex items-center justify-center select-none ${containerClassName}`}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-slate-300" />
        </div>
      )}

      {/* Ambient background blur duplicate so mixed aspect-ratio graphics seamlessly blend */}
      <img
        src={currentSrc}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-25 scale-120 pointer-events-none select-none"
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />

      {/* Primary crisp uncropped graphic */}
      <img
        src={currentSrc}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={handleImageError}
        className={`relative z-10 w-full h-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-103 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
};
