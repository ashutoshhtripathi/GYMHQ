import React from 'react';

export default function GymHqLogo({
  size = 'md',
  iconOnly = false,
  showTagline = false,
  className = '',
  style = {},
}) {
  const sizeMap = {
    xs: { icon: 22, text: '14px', badge: '9px' },
    sm: { icon: 30, text: '16px', badge: '10px' },
    md: { icon: 38, text: '20px', badge: '11px' },
    lg: { icon: 52, text: '28px', badge: '12px' },
    xl: { icon: 68, text: '36px', badge: '14px' },
  };

  const dim = typeof size === 'number' 
    ? { icon: size, text: `${Math.round(size * 0.52)}px`, badge: `${Math.round(size * 0.28)}px` }
    : (sizeMap[size] || sizeMap.md);

  const iconSvg = (
    <svg
      width={dim.icon}
      height={dim.icon}
      viewBox="0 0 100 100"
      style={{ flexShrink: 0, overflow: 'visible', filter: 'drop-shadow(0 0 10px rgba(0, 230, 118, 0.35))' }}
      aria-label="GYMHQ Logo"
    >
      <defs>
        <linearGradient id="gymhq-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#181d2c" />
          <stop offset="100%" stopColor="#0a0d14" />
        </linearGradient>

        <linearGradient id="gymhq-neon-border" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00e676" />
          <stop offset="50%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#00e676" />
        </linearGradient>

        <linearGradient id="gymhq-bolt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#76ffb0" />
          <stop offset="35%" stopColor="#00e676" />
          <stop offset="100%" stopColor="#00b0ff" />
        </linearGradient>

        <linearGradient id="gymhq-plate" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#252a3b" />
          <stop offset="50%" stopColor="#3d4661" />
          <stop offset="100%" stopColor="#252a3b" />
        </linearGradient>

        <filter id="gymhq-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Hexagonal Shield Emblem Base */}
      <polygon
        points="50,4 92,25 92,75 50,96 8,75 8,25"
        fill="url(#gymhq-bg)"
        stroke="url(#gymhq-neon-border)"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Subtle Inner Contour */}
      <polygon
        points="50,11 86,29 86,71 50,89 14,71 14,29"
        fill="none"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Barbell Left Weights */}
      <rect x="22" y="34" width="6" height="32" rx="2" fill="url(#gymhq-plate)" stroke="#00e676" strokeWidth="0.8" opacity="0.9" />
      <rect x="29" y="39" width="4" height="22" rx="1.5" fill="url(#gymhq-plate)" opacity="0.75" />

      {/* Barbell Right Weights */}
      <rect x="72" y="34" width="6" height="32" rx="2" fill="url(#gymhq-plate)" stroke="#00b0ff" strokeWidth="0.8" opacity="0.9" />
      <rect x="67" y="39" width="4" height="22" rx="1.5" fill="url(#gymhq-plate)" opacity="0.75" />

      {/* Central Connecting Bar */}
      <rect x="33" y="47.5" width="34" height="5" rx="2.5" fill="#e0e0e0" opacity="0.45" />

      {/* High-Energy Neon Lightning Bolt Core */}
      <path
        d="M55 17 L35 48 L48 48 L42 83 L66 45 L52 45 Z"
        fill="url(#gymhq-bolt)"
        stroke="#ffffff"
        strokeWidth="0.8"
        strokeLinejoin="round"
        filter="url(#gymhq-glow)"
      />

      {/* Central Diamond Power Node */}
      <circle cx="50" cy="48" r="2.8" fill="#ffffff" />
    </svg>
  );

  if (iconOnly) {
    return (
      <div
        className={`gymhq-logo-icon ${className}`}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}
      >
        {iconSvg}
      </div>
    );
  }

  return (
    <div
      className={`gymhq-logo-full ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        textDecoration: 'none',
        ...style,
      }}
    >
      {iconSvg}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontSize: dim.text,
            fontWeight: '900',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <span>GYM</span>
          <span
            style={{
              background: 'linear-gradient(135deg, #00e676 0%, #00f0ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 20px rgba(0, 230, 118, 0.4)',
            }}
          >
            HQ
          </span>
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#00e676',
              boxShadow: '0 0 8px #00e676',
              marginLeft: '2px',
              display: 'inline-block',
            }}
          />
        </div>

        {showTagline && (
          <div
            style={{
              fontSize: dim.badge,
              fontWeight: '700',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: '4px',
            }}
          >
            Gym Operations OS
          </div>
        )}
      </div>
    </div>
  );
}
