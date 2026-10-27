import React, { useState } from 'react';

/**
 * BrandLogo - Cinematic brand identity for AfterFrame
 * Features the film-frame AF monogram with film sprocket perforations,
 * warm cinema gold (#F5C518) and ivory (#F7EFE5),
 * and the "Beyond the Credits" tagline.
 * 
 * Variants:
 * - 'full': Monogram + "After" (ivory) + "Frame" (gold) + tagline
 * - 'compact': Monogram + "AfterFrame" (no tagline)
 * - 'monogram': AF film frame monogram only (for mobile/tight spaces)
 */
export default function BrandLogo({
  variant = 'full',
  showTagline = true,
  size = 'md',
  useImage = true,
  className = ''
}) {
  const [imageError, setImageError] = useState(false);

  // Height configurations (+18% visual scale while keeping header compact)
  const heights = {
    sm: variant === 'monogram' ? 32 : 36,
    md: variant === 'monogram' ? 40 : 49,
    lg: variant === 'monogram' ? 52 : 60
  };
  const h = heights[size] || heights.md;

  // Accessible label
  const accessibleLabel = variant === 'monogram'
    ? 'AfterFrame'
    : 'AfterFrame — Beyond the Credits';

  // If user requests full image logo and it hasn't errored
  if (useImage && !imageError && variant === 'full') {
    return (
      <div
        className={`brand-logo-container ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          lineHeight: 1,
          transition: 'transform 0.2s ease'
        }}
        aria-label={accessibleLabel}
      >
        <img
          src="/afterframe-logo.png"
          alt="AfterFrame — Beyond the Credits"
          style={{
            height: `${h}px`,
            maxHeight: '49px',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
            filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.45))'
          }}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // SVG Film Frame AF Monogram
  const renderMonogramSvg = (monoH) => {
    const monoW = Math.round(monoH * 1.15);
    return (
      <svg
        width={monoW}
        height={monoH}
        viewBox="0 0 115 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        {/* Film Strip Left Border with Sprocket Holes */}
        <rect x="2" y="5" width="22" height="90" rx="4" fill="#F5C518" />
        <rect x="6" y="12" width="14" height="9" rx="2" fill="#0E0E10" />
        <rect x="6" y="27" width="14" height="9" rx="2" fill="#0E0E10" />
        <rect x="6" y="42" width="14" height="9" rx="2" fill="#0E0E10" />
        <rect x="6" y="57" width="14" height="9" rx="2" fill="#0E0E10" />
        <rect x="6" y="72" width="14" height="9" rx="2" fill="#0E0E10" />

        {/* Top & Right Film Frame Outer Bar */}
        <path
          d="M20 12 H102 C106 12 108 14 108 18 V26 C108 28 106 30 102 30 H32 V12"
          fill="#F5C518"
        />

        {/* 'A' Stem & Crossbar (Ivory / Pale Gold) */}
        <path
          d="M38 90 L58 26 H68 L88 90 H76 L72 74 H54 L50 90 H38 Z"
          fill="#F7EFE5"
        />
        {/* 'A' Inner Counter */}
        <polygon points="63,42 56,66 70,66" fill="#0E0E10" />

        {/* 'F' Overlap & Bars (Warm Cinema Gold) */}
        <path
          d="M68 34 H106 V44 H80 V54 H98 V64 H80 V90 H68 Z"
          fill="#F5C518"
        />

        {/* Cinematic Dynamic Horizon Arc */}
        <path
          d="M40 76 Q65 62 102 68"
          stroke="#F5C518"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  };

  if (variant === 'monogram') {
    return (
      <div
        className={`brand-logo-monogram ${className}`}
        style={{ display: 'inline-flex', alignItems: 'center' }}
        aria-label={accessibleLabel}
      >
        {renderMonogramSvg(h)}
      </div>
    );
  }

  // Full or Compact Vector Fallback
  return (
    <div
      className={`brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        textDecoration: 'none',
        userSelect: 'none'
      }}
      aria-label={accessibleLabel}
    >
      {renderMonogramSvg(h)}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          fontFamily: "var(--font-display, 'Outfit', 'Inter', sans-serif)",
          fontWeight: 900,
          fontSize: `${Math.round(h * 0.58)}px`,
          letterSpacing: '-0.03em',
          lineHeight: 1
        }}>
          <span style={{ color: '#F7EFE5' }}>After</span>
          <span style={{ color: '#F5C518' }}>Frame</span>
        </div>
        {(variant === 'full' && showTagline) && (
          <span style={{
            fontSize: `${Math.max(10, Math.round(h * 0.22))}px`,
            color: '#D4AF37',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginTop: '0.2rem',
            lineHeight: 1,
            opacity: 0.95
          }}>
            Beyond the Credits
          </span>
        )}
      </div>
    </div>
  );
}
