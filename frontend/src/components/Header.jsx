import React from 'react';
import GymHqLogo from './GymHqLogo';

export default function Header({ onMenuClick, gymName, onOpenGymModal, isSuperAdmin }) {
  const displayName = isSuperAdmin ? 'GYMHQ Master HQ' : (gymName || 'GYMHQ');

  return (
    <header className="mobile-header">
      <button 
        className="mobile-menu-btn" 
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {isSuperAdmin ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: 'calc(100vw - 80px)',
          }}
        >
          <GymHqLogo iconOnly size={26} />
          <span
            style={{
              fontWeight: '800',
              letterSpacing: '-0.02em',
              fontSize: '15px',
              color: '#f3e8ff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            GYMHQ Master HQ
          </span>
          <span
            style={{
              fontSize: '9px',
              background: 'rgba(168, 85, 247, 0.2)',
              color: '#c084fc',
              padding: '2px 5px',
              borderRadius: '4px',
              fontWeight: '700',
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}
          >
            PLATFORM
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenGymModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            maxWidth: 'calc(100vw - 120px)',
            textAlign: 'left',
          }}
          title="Click to customize gym name"
        >
          <GymHqLogo iconOnly size={26} />
          <span
            style={{
              fontWeight: '800',
              letterSpacing: '-0.02em',
              fontSize: '15px',
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </span>
          <span
            style={{
              fontSize: '9px',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              padding: '2px 5px',
              borderRadius: '4px',
              fontWeight: '700',
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}
          >
            ADMIN
          </span>
        </button>
      )}

      {!isSuperAdmin && (
        <button
          type="button"
          onClick={onOpenGymModal}
          aria-label="Gym settings"
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ⚙️
        </button>
      )}
    </header>
  );
}
