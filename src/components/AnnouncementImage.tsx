import React, { useState } from 'react';
import { Image as ImageIcon, ImageOff, Maximize2, ExternalLink, ZoomIn } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!src) return null;

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 border border-slate-200 text-slate-400 p-4 text-center select-none ${
          variant === 'modal' ? 'h-52 rounded-xl' : variant === 'thumbnail' ? 'w-16 h-16 rounded-lg' : 'h-48 rounded-t-xl'
        } ${containerClassName}`}
      >
        <ImageOff className="w-6 h-6 text-slate-400 mb-1" />
        <span className="text-[11px] font-medium text-slate-500">Image Preview Unavailable</span>
        {variant === 'modal' && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
          >
            Try opening original link <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }

  // Thumbnail variant for Admin list
  if (variant === 'thumbnail') {
    return (
      <div className={`relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group ${containerClassName}`}>
        {isLoading && <div className="absolute inset-0 bg-slate-200 animate-pulse" />}
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
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
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 scale-125 select-none pointer-events-none"
            referrerPolicy="no-referrer"
          />

          <img
            src={src}
            alt={alt}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
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
              href={src}
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
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-25 scale-120 pointer-events-none select-none"
        referrerPolicy="no-referrer"
      />

      {/* Primary crisp uncropped graphic */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`relative z-10 w-full h-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-103 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
};
