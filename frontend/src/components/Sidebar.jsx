import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GymHqLogo from './GymHqLogo';

export default function Sidebar({ isOpen, onClose, onOpenGymModal }) {
  const { user, logout } = useAuth();
  const gymName = user?.gym_name || localStorage.getItem('gymhq_gym_name') || 'My Gym';

  const operationalNav = [
    {
      to: '/',
      label: 'Gym Overview',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
    },
    {
      to: '/members',
      label: 'Athletes & Members',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
    {
      to: '/attendance',
      label: 'Floor Attendance',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          <path d="m9 14 2 2 4-4"></path>
        </svg>
      ),
    },
  ];

  const financialNav = [
    {
      to: '/payments',
      label: 'Payments & Receipts',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
      ),
    },
    {
      to: '/reports',
      label: 'Dues & Reports',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      ),
    },
  ];

  const helpNav = [
    {
      to: '/guide',
      label: "Owner's Guide",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      ),
    },
  ];

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} 
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div 
          className="sidebar-brand" 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
          onClick={onOpenGymModal}
          title="Click to customize gym profile"
        >
          <GymHqLogo iconOnly size={36} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="sidebar-brand-text" style={{ fontSize: '15px', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {gymName}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '2px' }}>
              Admin Console ⚙️
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <span className="sidebar-section-label">Operations</span>
            {operationalNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="sidebar-section" style={{ marginTop: '16px' }}>
            <span className="sidebar-section-label">Financials & Billing</span>
            {financialNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="sidebar-section" style={{ marginTop: '16px' }}>
            <span className="sidebar-section-label">Support & Setup</span>
            {helpNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="sidebar-section" style={{ marginTop: '16px' }}>
            <span className="sidebar-section-label" style={{ color: 'var(--accent)' }}>
              Platform Owner
            </span>
            <NavLink
              to="/access-control"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-link-icon" style={{ color: 'var(--accent)' }}>
                👑
              </span>
              <span>Access Control</span>
            </NavLink>
          </div>
        </nav>

        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border-color)', background: 'rgba(0, 0, 0, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--accent)',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '15px',
                border: '1px solid var(--accent)',
                flexShrink: 0
              }}>
                {(user?.full_name || user?.username || 'O').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }} className="truncate">
                {user?.full_name || gymName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600' }} className="truncate">
                Admin • {gymName}
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="btn btn-secondary w-full" 
            style={{ padding: '7px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
