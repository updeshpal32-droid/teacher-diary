import React from 'react';

interface KvsLogoProps {
  logoUrl?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isDark?: boolean;
}

export const KvsLogo: React.FC<KvsLogoProps> = ({
  logoUrl,
  className = '',
  size = 'md',
  isDark = false
}) => {
  // If custom logo image is uploaded, render the custom image
  if (logoUrl) {
    const sizeClasses = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16'
    }[size];

    return (
      <div className={`relative flex items-center justify-center shrink-0 overflow-hidden rounded-xl bg-white/10 p-0.5 border border-white/20 shadow-sm ${sizeClasses} ${className}`}>
        <img
          src={logoUrl}
          alt="School Logo"
          className="w-full h-full object-contain rounded-lg"
        />
      </div>
    );
  }

  // Official Vector KVS Sun & Open Book Emblem
  const sizeMap = {
    xs: { iconSize: 'w-6 h-6' },
    sm: { iconSize: 'w-8 h-8' },
    md: { iconSize: 'w-10 h-10' },
    lg: { iconSize: 'w-12 h-12' },
    xl: { iconSize: 'w-16 h-16' }
  }[size];

  return (
    <div className={`relative flex items-center justify-center shrink-0 select-none ${sizeMap.iconSize} ${className}`}>
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="kvsSunRays" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <linearGradient id="kvsSunCore" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          <linearGradient id="kvsBookPages" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          <linearGradient id="kvsBaseRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
        </defs>

        {/* Outer Circular Glow / Shield */}
        <circle cx="60" cy="60" r="56" fill={isDark ? '#0F172A' : '#FFFFFF'} fillOpacity={isDark ? '0.6' : '0.95'} stroke="url(#kvsSunRays)" strokeWidth="2.5" />

        {/* 13 Radiant Rising Sun Rays (KVS Signature Emblem) */}
        <g stroke="url(#kvsSunRays)" strokeWidth="3" strokeLinecap="round">
          {/* Top Center Ray */}
          <line x1="60" y1="14" x2="60" y2="34" strokeWidth="4" />
          {/* Left Rays */}
          <line x1="44" y1="18" x2="50" y2="36" />
          <line x1="30" y1="26" x2="42" y2="40" />
          <line x1="20" y1="38" x2="36" y2="47" />
          <line x1="14" y1="52" x2="33" y2="54" />
          <line x1="14" y1="66" x2="32" y2="61" />
          {/* Right Rays */}
          <line x1="76" y1="18" x2="70" y2="36" />
          <line x1="90" y1="26" x2="78" y2="40" />
          <line x1="100" y1="38" x2="84" y2="47" />
          <line x1="106" y1="52" x2="87" y2="54" />
          <line x1="106" y1="66" x2="88" y2="61" />
        </g>

        {/* Sun Semicircle Core */}
        <path
          d="M 32 60 A 28 28 0 0 1 88 60 Z"
          fill="url(#kvsSunCore)"
          stroke="#D97706"
          strokeWidth="1.5"
        />

        {/* Open Book of Knowledge (Spanning the horizon) */}
        {/* Left Page */}
        <path
          d="M 60 76 C 50 68 34 68 22 72 L 22 88 C 34 84 50 84 60 92 Z"
          fill="url(#kvsBookPages)"
          stroke="#475569"
          strokeWidth="1.5"
        />
        {/* Right Page */}
        <path
          d="M 60 76 C 70 68 86 68 98 72 L 98 88 C 86 84 70 84 60 92 Z"
          fill="url(#kvsBookPages)"
          stroke="#475569"
          strokeWidth="1.5"
        />

        {/* Center Spine */}
        <line x1="60" y1="76" x2="60" y2="92" stroke="#334155" strokeWidth="2" />

        {/* Bottom Banner Ribbon with KVS Sanskrit Motto */}
        <path
          d="M 20 95 C 40 92 80 92 100 95 L 96 104 C 80 101 40 101 24 104 Z"
          fill="url(#kvsBaseRibbon)"
        />
        <text
          x="60"
          y="100.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="4.5"
          fontWeight="bold"
          fontFamily="serif"
          letterSpacing="0.4"
        >
          केन्द्रीय विद्यालय संगठन
        </text>
      </svg>
    </div>
  );
};
