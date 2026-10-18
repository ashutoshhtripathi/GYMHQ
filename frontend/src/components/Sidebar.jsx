import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GymHqLogo from './GymHqLogo';

export default function Sidebar({ isOpen, onClose, onOpenGymModal }) {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const gymName = user?.gym_name || localStorage.getItem('gymhq_gym_name') || 'My Gym';
  const daysLeft = user?.days_remaining ?? 30;

  // Gym Operations navigation (Exclusive to client gym owners)
  const gymNav = [
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
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1 2-2h2"></path>
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
        {/* Brand Bar */}
        <div 
          className="sidebar-brand" 
          style={{
            cursor: isSuperAdmin ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: isSuperAdmin ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(22, 27, 34, 0.8) 100%)' : undefined,
            borderBottom: isSuperAdmin ? '1px solid rgba(168, 85, 247, 0.3)' : undefined,
          }}
          onClick={isSuperAdmin ? undefined : onOpenGymModal}
          title={isSuperAdmin ? "GYMHQ Master Platform Headquarters" : "Click to customize gym profile"}
        >
          <GymHqLogo iconOnly size={36} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="sidebar-brand-text" style={{ fontSize: '15px', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isSuperAdmin ? 'GYMHQ Master HQ' : gymName}
            </div>
            <div style={{ fontSize: '10px', color: isSuperAdmin ? '#c084fc' : 'var(--accent)', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '2px' }}>
              {isSuperAdmin ? '👑 Master Platform Owner' : `Active License (${daysLeft}d left)`}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* ============================================================ */}
          {/* CASE A: PLATFORM SUPER ADMIN (WEBSITE OWNERS - REVENUE & CONTROLS ONLY) */}
          {/* ============================================================ */}
          {isSuperAdmin ? (
            <>
              <div className="sidebar-section">
                <span className="sidebar-section-label" style={{ color: '#c084fc' }}>
                  🏢 Platform Business & Revenue
                </span>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                  style={{
                    background: 'rgba(168, 85, 247, 0.14)',
                    borderColor: 'rgba(168, 85, 247, 0.35)',
                    color: '#e9d5ff',
                    fontWeight: '700',
                  }}
                >
                  <span className="sidebar-link-icon" style={{ color: '#c084fc' }}>
                    👑
                  </span>
                  <span>SaaS Revenue & Gyms</span>
                </NavLink>
              </div>

              {/* Informational Card for Platform Owners */}
              <div className="sidebar-section" style={{ marginTop: '20px' }}>
                <span className="sidebar-section-label" style={{ color: 'var(--text-tertiary)' }}>
                  Platform Scope
                </span>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(168, 85, 247, 0.08)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{ fontWeight: '700', color: '#c084fc', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🛡️</span> SaaS Controller
                  </div>
                  You are the platform administrator. Gym operations (athletes, floor attendance, gym dues) are strictly segregated for client gym owners.
                </div>
              </div>
            </>
          ) : (
            /* ============================================================ */
            /* CASE B: NORMAL GYM OWNERS (THEIR GYM OPERATIONS ONLY) */
            /* ============================================================ */
            <>
              <div className="sidebar-section">
                <span className="sidebar-section-label">Operations</span>
                {gymNav.map((item) => (
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
            </>
          )}
        </nav>

        {/* Footer User Info */}
        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border-color)', background: 'rgba(0, 0, 0, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: isSuperAdmin ? 'rgba(168, 85, 247, 0.25)' : 'var(--accent-light)',
                color: isSuperAdmin ? '#c084fc' : 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '15px',
                border: isSuperAdmin ? '1px solid #c084fc' : '1px solid var(--accent)',
                flexShrink: 0,
              }}
            >
              {isSuperAdmin ? '👑' : (user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.username.charAt(0).toUpperCase())}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name || user?.username}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || (isSuperAdmin ? 'Master Platform Super-Admin' : 'Gym Administrator')}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary w-full btn-sm"
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
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
