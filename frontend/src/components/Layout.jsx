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

  const { user, updateGym } = useAuth();
  const toast = useToast();

  const [gymForm, setGymForm] = useState({
    gym_name: user?.gym_name || localStorage.getItem('gymhq_gym_name') || 'IronCore Gym',
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

  const currentGymName = user?.gym_name || gymForm.gym_name || localStorage.getItem('gymhq_gym_name') || 'My Gym';

  useEffect(() => {
    document.title = `${currentGymName} — GYMHQ Gym Management`;
  }, [currentGymName]);

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
      />
      
      <main className="app-content">
        {/* Desktop Top Navigation Bar */}
        <div className="top-nav-bar">
          <div className="top-nav-left">
            {/* Personalized Gym Branding Header */}
            <button
              type="button"
              className="gym-branding-header"
              onClick={() => setGymModalOpen(true)}
              title="Click to customize gym profile"
              style={{
                borderColor: user?.role === 'super_admin' ? 'rgba(168, 85, 247, 0.4)' : undefined,
              }}
            >
              <GymHqLogo iconOnly size={28} />
              <div className="gym-brand-info">
                <div className="gym-brand-name">
                  {user?.role === 'super_admin' ? 'GYMHQ Master HQ' : currentGymName}
                  <span style={{ fontSize: '11px', color: 'var(--accent)', marginLeft: '2px' }}>✏️</span>
                </div>
                <div className="gym-brand-role-tag" style={{ color: user?.role === 'super_admin' ? '#c084fc' : undefined }}>
                  <span className="pulse-dot" style={{ width: '5px', height: '5px', background: user?.role === 'super_admin' ? '#c084fc' : undefined }}></span>
                  {user?.role === 'super_admin' ? '👑 Master Super Admin' : 'Admin Mode • Live'}
                </div>
              </div>
            </button>

            {user?.role === 'super_admin' ? (
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
            {user?.role === 'super_admin' && (
              <>
                <Link
                  to="/"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', borderColor: '#c084fc' }}
                  title="Platform Owner SaaS & Revenue Control"
                >
                  <span>👑</span>
                  SaaS Revenue & Gyms
                </Link>

                <Link
                  to="/gym-overview"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Switch to Client Gym Overview"
                >
                  <span>🏋️</span>
                  Gym Overview
                </Link>
              </>
            )}

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
                placeholder="e.g. IronCore Fitness Club"
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
                placeholder="e.g. 14 MG Road, Indiranagar, Bengaluru"
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
                  placeholder="+91 98765 43210"
                  value={gymForm.gym_phone}
                  onChange={(e) => setGymForm({ ...gymForm, gym_phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">UPI ID (For Member Fees)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="gymname@okhdfcbank"
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
      </main>
    </div>
  );
}
