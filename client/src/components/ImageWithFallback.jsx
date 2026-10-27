import React, { useState } from 'react';
import { Film } from 'lucide-react';

/**
 * ImageWithFallback - High-polish image component for AfterFrame posters & backdrops
 * Gracefully handles 404s, missing images, and bad TMDB paths with an elegant
 * cinematic charcoal placeholder card with film reel iconography and title.
 */
export default function ImageWithFallback({
  src,
  alt = 'Media Artwork',
  type = 'poster', // 'poster' (2:3) or 'backdrop' (16:9)
  aspectRatio,
  className = '',
  style = {},
  title = '',
  onClick,
  loading = 'lazy'
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const defaultAspectRatio = type === 'backdrop' ? '16 / 9' : '2 / 3';
  const ratio = aspectRatio || defaultAspectRatio;

  const isValidSrc = Boolean(src && typeof src === 'string' && src.trim() && !hasError);

  if (!isValidSrc) {
    return (
      <div
        className={`image-fallback-container ${className}`}
        onClick={onClick}
        style={{
          width: '100%',
          aspectRatio: ratio,
          background: 'linear-gradient(145deg, #18181c, #101014)',
          border: '1px solid rgba(245, 197, 24, 0.12)',
          borderRadius: style.borderRadius || 'var(--radius-sm, 6px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          ...style
        }}
      >
        {/* Subtle background film watermark */}
        <div style={{
          position: 'absolute',
          opacity: 0.08,
          pointerEvents: 'none'
        }}>
          <Film size={type === 'backdrop' ? 72 : 56} color="#F5C518" />
        </div>

        <Film size={type === 'backdrop' ? 28 : 24} color="#F5C518" style={{ marginBottom: '0.5rem', opacity: 0.85 }} />
        
        {title && (
          <span style={{
            fontSize: type === 'backdrop' ? '0.85rem' : '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary, #b8b8c0)',
            lineHeight: 1.3,
            maxWidth: '90%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {title}
          </span>
        )}
        <span style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted, #70707a)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginTop: '0.35rem'
        }}>
          AfterFrame Artwork
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: ratio,
        overflow: 'hidden',
        background: '#141418',
        borderRadius: style.borderRadius || 'var(--radius-sm, 6px)',
        ...style
      }}
      onClick={onClick}
      className={className}
    >
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: isLoaded ? 1 : 0.4,
          transition: 'opacity 250ms ease-in-out, transform 300ms ease'
        }}
      />
    </div>
  );
}
