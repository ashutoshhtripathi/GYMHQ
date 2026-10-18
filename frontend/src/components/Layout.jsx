import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Modal from './Modal';
import GymHqLogo from './GymHqLogo';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickCheckInOpen, setQuickCheckInOpen] = useState(false);
  const [gymModalOpen, setGymModalOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user, updateGym, logout } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const toast = useToast();

  const [gymForm, setGymForm] = useState({
    gym_name: user?.gym_name || sessionStorage.getItem('gymhq_gym_name') || 'IronCore Gym',
    gym_address: user?.gym_address || '',
    gym_phone: user?.gym_phone || '',
    upi_id: user?.upi_id || '',
  });

  useEffect(() => {
    if (user?.gym_name) {
      setGymForm((prev) => ({
        ...prev,
        gym_name: user.gym_name,
        gym_address: user.gym_address || '',
        gym_phone: user.gym_phone || '',
        upi_id: user.upi_id || '',
      }));
    }
  }, [user]);

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const loadActiveMembers = async () => {
    try {
      const res = await api.getMembers({ status: 'active', page_size: 100 });
      setMembers(res.members || res.items || []);
    } catch {
      // Ignored
    }
  };

  const handleOpenQuickCheckIn = () => {
    loadActiveMembers();
    setSelectedMemberId('');
    setQuickCheckInOpen(true);
  };

  const handleQuickCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.warning('Please select an athlete to check in.');
      return;
    }

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.markAttendance({
        member_id: parseInt(selectedMemberId),
        attendance_date: today,
      });
      const athlete = members.find((m) => m.id === parseInt(selectedMemberId));
      toast.success(`Check-in recorded for ${athlete ? athlete.name : 'athlete'}!`);
      setQuickCheckInOpen(false);
    } catch (err) {
      toast.error(err.message || 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGymProfileSubmit = async (e) => {
    e.preventDefault();
    if (!gymForm.gym_name.trim()) {
      toast.warning('Gym Name cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      await updateGym(gymForm);
      toast.success('Gym profile updated successfully!');
      setGymModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update gym profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentGymName = user?.gym_name || gymForm.gym_name || sessionStorage.getItem('gymhq_gym_name') || 'My Gym';

  useEffect(() => {
    if (isSuperAdmin) {
      document.title = 'GYMHQ Platform — Master SaaS & Revenue Control';
    } else {
      document.title = `${currentGymName} — GYMHQ Gym Management`;
    }
  }, [isSuperAdmin, currentGymName]);

  return (
    <div className="app-layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onOpenGymModal={() => setGymModalOpen(true)} 
      />
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        gymName={currentGymName} 
        onOpenGymModal={() => setGymModalOpen(true)} 
        isSuperAdmin={isSuperAdmin}
      />
      
      <main className="app-content">
        {/* Desktop Top Navigation Bar */}
        <div className="top-nav-bar">
          <div className="top-nav-left">
            {/* Personalized Gym Branding Header */}
            {isSuperAdmin ? (
              <div
                className="gym-branding-header"
                style={{
                  borderColor: 'rgba(168, 85, 247, 0.4)',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(22, 27, 34, 0.8) 100%)',
                  cursor: 'default',
                }}
                title="GYMHQ Platform SaaS Headquarters"
              >
                <GymHqLogo iconOnly size={28} />
                <div className="gym-brand-info">
                  <div className="gym-brand-name" style={{ color: '#f3e8ff' }}>
                    GYMHQ Master HQ
                  </div>
                  <div className="gym-brand-role-tag" style={{ color: '#c084fc' }}>
                    <span className="pulse-dot" style={{ width: '5px', height: '5px', background: '#c084fc' }}></span>
                    👑 Master Platform Owner
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="gym-branding-header"
                onClick={() => setGymModalOpen(true)}
                title="Click to customize gym profile"
              >
                <GymHqLogo iconOnly size={28} />
                <div className="gym-brand-info">
                  <div className="gym-brand-name">
                    {currentGymName}
                    <span style={{ fontSize: '11px', color: 'var(--accent)', marginLeft: '2px' }}>✏️</span>
                  </div>
                  <div className="gym-brand-role-tag">
                    <span className="pulse-dot" style={{ width: '5px', height: '5px' }}></span>
                    Admin Mode • Live
                  </div>
                </div>
              </button>
            )}

            {isSuperAdmin ? (
              <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '11px', fontWeight: '700' }}>
                🏢 Multi-Tenant Controller
              </span>
            ) : user?.days_remaining !== undefined && user.days_remaining <= 7 ? (
              <span className="badge" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid #fbbf24', fontSize: '11px', fontWeight: '700' }}>
                ⏰ {user.days_remaining}d Left
              </span>
            ) : (
              <span className="status-indicator">
                <span className="pulse-dot"></span>
                Online
              </span>
            )}

            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              📅 {formattedDate}
            </span>
          </div>

          <div className="top-nav-right">
            {isSuperAdmin ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="status-indicator" style={{ color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.35)' }}>
                  <span className="pulse-dot" style={{ background: '#c084fc' }}></span>
                  SaaS Revenue Engine Live
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={logout}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Sign out of Master Platform"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleOpenQuickCheckIn}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Fast Check-In
                </button>

                <Link
                  to="/guide"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>📖</span>
                  Owner's Guide
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Regular Gym Owner Subscription Alert Banner (if expiring soon) */}
        {user?.role !== 'super_admin' && user?.days_remaining !== undefined && user.days_remaining <= 7 && (
          <div style={{
            background: 'rgba(251, 191, 36, 0.12)',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            color: '#fbbf24',
            padding: '10px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>⏰</span>
              <span>
                <strong>Subscription Notice:</strong> Your GYMHQ software license expires in <strong>{user.days_remaining} days</strong> ({user.subscription_end || 'soon'}). Please contact your platform administrator to renew.
              </span>
            </div>
            <span style={{ fontSize: '11px', background: 'rgba(251, 191, 36, 0.2)', padding: '3px 8px', borderRadius: '4px', fontWeight: '700' }}>
              Renewal Due
            </span>
          </div>
        )}

        <Outlet />

        {/* Fast Check-In & Gym Settings Modals strictly for Gym Owners */}
        {!isSuperAdmin && (
          <>
            {/* Global Fast Check-In Modal accessible from anywhere */}
            <Modal
              isOpen={quickCheckInOpen}
              onClose={() => setQuickCheckInOpen(false)}
              title="⚡ Fast Front-Desk Check-In"
            >
              <form onSubmit={handleQuickCheckInSubmit}>
                <div className="form-group">
                  <label className="form-label">Select Active Athlete / Member *</label>
                  {members.length === 0 ? (
                    <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      No active members enrolled yet. <Link to="/members" style={{ color: 'var(--accent)', fontWeight: '600' }} onClick={() => setQuickCheckInOpen(false)}>Enroll an athlete first →</Link>
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      required
                      autoFocus
                    >
                      <option value="">-- Choose athlete --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.phone}) {m.plan ? `• ${m.plan}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Check-in will be marked for today (<strong>{new Date().toISOString().split('T')[0]}</strong>).
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setQuickCheckInOpen(false)}
                  >
                    Cancel
                  </button>
                  {members.length > 0 && (
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? 'Checking in...' : '✓ Confirm Check-In'}
                    </button>
                  )}
                </div>
              </form>
            </Modal>

            {/* Gym Settings & Profile Modal */}
            <Modal
              isOpen={gymModalOpen}
              onClose={() => setGymModalOpen(false)}
              title="🏢 Gym Profile & Operating Settings"
              maxWidth="500px"
            >
              <form onSubmit={handleGymProfileSubmit}>
                <div className="form-group">
                  <label className="form-label">Gym / Fitness Club Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter gym or fitness club name"
                    value={gymForm.gym_name}
                    onChange={(e) => setGymForm({ ...gymForm, gym_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Location / Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter gym address / city"
                    value={gymForm.gym_address}
                    onChange={(e) => setGymForm({ ...gymForm, gym_address: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Front Desk Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Enter front desk phone"
                      value={gymForm.gym_phone}
                      onChange={(e) => setGymForm({ ...gymForm, gym_phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">UPI ID (For Member Fees)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter UPI ID (e.g. yourgym@upi)"
                      value={gymForm.upi_id}
                      onChange={(e) => setGymForm({ ...gymForm, upi_id: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                  ℹ️ Your gym name is displayed on athlete invoices, reports, top bar, and reminder messages.
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setGymModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save Gym Profile'}
                  </button>
                </div>
              </form>
            </Modal>
          </>
        )}
      </main>
    </div>
  );
}
