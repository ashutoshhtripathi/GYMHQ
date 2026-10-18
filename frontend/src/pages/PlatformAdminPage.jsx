import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function PlatformAdminPage() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Selected user for inspection modal
  const [selectedUser, setSelectedUser] = useState(null);
  // Selected user for subscription/pricing modal
  const [subModalUser, setSubModalUser] = useState(null);
  const [subFormData, setSubFormData] = useState({
    subscription_fee: 999,
    subscription_plan: 'Standard Monthly',
    extend_days: 30,
    admin_notes: '',
  });

  const [updatingId, setUpdatingId] = useState(null);
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, usersData] = await Promise.all([
        api.getPlatformOverview(),
        api.getPlatformUsers({
          search: search.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
      ]);
      setOverview(overviewData);
      setUsers(usersData);
    } catch (err) {
      toast.error('Failed to load platform data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleToggleAccess = async (targetUser) => {
    const newStatus = !targetUser.is_active;
    const actionLabel = newStatus ? 'activate' : 'deactivate / suspend';

    if (targetUser.username === 'admin' || targetUser.username === 'owner') {
      toast.warning('Cannot suspend the master platform administrator.');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${actionLabel} access for '${targetUser.gym_name || targetUser.username}'?`)) {
      return;
    }

    setUpdatingId(targetUser.id);
    try {
      await api.updateUserStatus(targetUser.id, newStatus);
      toast.success(
        newStatus
          ? `Access granted to '${targetUser.gym_name || targetUser.username}'.`
          : `Access suspended for '${targetUser.gym_name || targetUser.username}'. User is locked out.`
      );
      loadData();
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser((prev) => (prev ? { ...prev, is_active: newStatus } : null));
      }
    } catch (err) {
      toast.error('Failed to update access: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenSubscriptionModal = (targetUser) => {
    setSubModalUser(targetUser);
    setSubFormData({
      subscription_fee: targetUser.subscription_fee || 999,
      subscription_plan: targetUser.subscription_plan || 'Standard Monthly',
      extend_days: 30,
      admin_notes: targetUser.admin_notes || '',
    });
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!subModalUser) return;

    try {
      await api.updateGymSubscription(subModalUser.id, {
        subscription_fee: parseFloat(subFormData.subscription_fee),
        subscription_plan: subFormData.subscription_plan,
        extend_days: parseInt(subFormData.extend_days) || 0,
        admin_notes: subFormData.admin_notes,
      });

      toast.success(
        `Subscription updated for '${subModalUser.gym_name}'. Extended by ${subFormData.extend_days} days at ₹${subFormData.subscription_fee}/mo.`
      );
      setSubModalUser(null);
      loadData();
    } catch (err) {
      toast.error('Failed to update subscription: ' + err.message);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.username === 'admin' || targetUser.username === 'owner') {
      toast.warning('Cannot delete the root administrator account.');
      return;
    }

    if (!window.confirm(`PERMANENT ACTION: Delete gym '${targetUser.gym_name}' and account '${targetUser.username}'? All associated athletes and records will be deleted.`)) {
      return;
    }

    try {
      await api.deletePlatformUser(targetUser.id);
      toast.success(`Gym account '${targetUser.username}' deleted.`);
      loadData();
      setSelectedUser(null);
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const handleCopyReminder = (targetUser) => {
    const amount = Number(targetUser.subscription_fee || 999).toLocaleString('en-IN');
    const days = targetUser.days_remaining;
    const dueDate = targetUser.subscription_end || 'End of Month';
    
    let text = '';
    if (targetUser.is_overdue) {
      text = `Hi ${targetUser.full_name || targetUser.gym_name}, your GYMHQ software license subscription of ₹${amount} was due on ${dueDate} and is currently overdue. Please clear the pending fee to reactivate your gym management portal. Thank you! — GYMHQ Master Team`;
    } else {
      text = `Hi ${targetUser.full_name || targetUser.gym_name}, this is a reminder from GYMHQ. Your monthly gym management software subscription of ₹${amount} expires in ${days} days (Due: ${dueDate}). Please renew on time to avoid interruption. Thank you! — GYMHQ Master Team`;
    }

    navigator.clipboard.writeText(text);
    toast.success('WhatsApp/SMS payment reminder message copied to clipboard!');
  };

  const counts = {
    all: users.length,
    active: users.filter((u) => u.is_active && !u.is_overdue).length,
    expiring_soon: users.filter((u) => u.is_active && u.days_remaining >= 0 && u.days_remaining <= 7).length,
    overdue: users.filter((u) => u.is_overdue).length,
    suspended: users.filter((u) => !u.is_active).length,
  };

  return (
    <div className="page-container">
      {/* Platform Owner Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(56, 189, 248, 0.08) 50%, rgba(0, 230, 153, 0.05) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>👑</span>
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em', color: '#c084fc', textTransform: 'uppercase', background: 'rgba(168, 85, 247, 0.2)', padding: '3px 8px', borderRadius: '4px' }}>
              Master Command Center
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              • Logged in as <strong>{currentUser?.email || currentUser?.username}</strong>
            </span>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '8px 0 4px 0' }}>
            GYMHQ Platform SaaS & Revenue Control
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, maxWidth: '640px' }}>
            Manage all commercial fitness clubs on your platform. Set monthly recurring fees, monitor payment renewal deadlines, and 1-click activate or suspend gym operations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>↻</span> Refresh Live Roster
          </button>
        </div>
      </div>

      {/* 4 Major SaaS Business Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        {/* Card 1: Monthly Recurring Revenue */}
        <div className="stat-card" style={{ borderTop: '3px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-card-label" style={{ color: '#c084fc' }}>Platform Monthly Revenue (MRR)</div>
              <div className="stat-card-value" style={{ color: 'var(--text-primary)', fontSize: '26px', marginTop: '4px' }}>
                ₹{Number(overview?.monthly_recurring_revenue || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Recurring fees from {overview?.active_gyms ?? 0} active clubs
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontSize: '20px' }}>
              💰
            </div>
          </div>
        </div>

        {/* Card 2: Total Client Gyms */}
        <div className="stat-card" style={{ borderTop: '3px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-card-label">Total Registered Gyms</div>
              <div className="stat-card-value" style={{ color: 'var(--accent)', fontSize: '26px', marginTop: '4px' }}>
                {overview?.total_gyms ?? 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {overview?.active_gyms ?? 0} Active • {overview?.suspended_gyms ?? 0} Suspended
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '20px' }}>
              🏋️
            </div>
          </div>
        </div>

        {/* Card 3: Subscriptions Due Soon */}
        <div className="stat-card" style={{ borderTop: '3px solid #fbbf24' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-card-label" style={{ color: '#fbbf24' }}>Expiring Soon (≤ 7 Days)</div>
              <div className="stat-card-value" style={{ color: '#fbbf24', fontSize: '26px', marginTop: '4px' }}>
                {overview?.expiring_gyms_count ?? 0} Gyms
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                SaaS license payment due soon
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', fontSize: '20px' }}>
              ⏰
            </div>
          </div>
        </div>

        {/* Card 4: Overdue Collections */}
        <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-card-label" style={{ color: 'var(--danger)' }}>Pending & Overdue Fees</div>
              <div className="stat-card-value" style={{ color: 'var(--danger)', fontSize: '26px', marginTop: '4px' }}>
                ₹{Number(overview?.pending_subscription_revenue || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {overview?.overdue_gyms_count ?? 0} Gyms currently overdue
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', fontSize: '20px' }}>
              ⚠️
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All Gyms (${counts.all})` },
              { id: 'active', label: `Active (${counts.active})` },
              { id: 'expiring_soon', label: `Expiring Soon (${counts.expiring_soon})` },
              { id: 'overdue', label: `Overdue (${counts.overdue})` },
              { id: 'suspended', label: `Suspended (${counts.suspended})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: statusFilter === tab.id ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                  background: statusFilter === tab.id ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                  color: statusFilter === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: statusFilter === tab.id ? '700' : '500',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', minWidth: '280px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search gym, owner, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '7px 12px', fontSize: '13px' }}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
            {search && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => { setSearch(''); loadData(); }}
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Gym Subscriptions & Access Control Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Registered Gym Owners & SaaS Subscriptions
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Showing {users.length} fitness center accounts
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Gym & Owner Profile</th>
                <th>SaaS Pricing</th>
                <th>Subscription Status & Time Left</th>
                <th>Athletes & Stats</th>
                <th>Access State</th>
                <th style={{ textAlign: 'right' }}>Owner Controls</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                    Loading gym roster and subscription metrics...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                    No gyms found matching filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const feeFormatted = Number(u.subscription_fee || 999).toLocaleString('en-IN');
                  const days = u.days_remaining;
                  const isOver = u.is_overdue;

                  return (
                    <tr key={u.id}>
                      {/* Gym & Owner Profile */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              flexShrink: 0,
                            }}
                          >
                            🏋️
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>
                              {u.gym_name || 'Unnamed Gym'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              👤 {u.full_name || u.username} • 📞 {u.gym_phone || 'No phone'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                              Joined: {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SaaS Pricing */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            ₹{feeFormatted}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>/mo</span>
                        </div>
                        <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'inline-block', marginTop: '4px' }}>
                          {u.subscription_plan || 'Standard Monthly'}
                        </span>
                      </td>

                      {/* Subscription Status & Time Left */}
                      <td>
                        {/* Countdown Badge */}
                        <div style={{ marginBottom: '4px' }}>
                          {!u.is_active ? (
                            <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                              ⛔ Access Suspended
                            </span>
                          ) : isOver ? (
                            <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                              ⚠️ Overdue by {Math.abs(days)} days!
                            </span>
                          ) : days <= 7 ? (
                            <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid #fbbf24' }}>
                              ⏰ Only {days} days left!
                            </span>
                          ) : (
                            <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', background: 'rgba(0, 230, 153, 0.15)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                              ✅ {days} days remaining
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Expires: <strong>{u.subscription_end || 'End of Month'}</strong>
                        </div>
                      </td>

                      {/* Athletes & Stats */}
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {u.members_count} Athletes
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Collections: ₹{Number(u.total_collections || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Access State */}
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span className="pulse-dot" style={{ width: '5px', height: '5px', background: u.is_active ? 'var(--accent)' : 'var(--danger)' }}></span>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Owner Controls */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {/* Extend / Renew Button */}
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenSubscriptionModal(u)}
                            title="Set Monthly Fee & Extend Subscription"
                            style={{ fontSize: '11px', padding: '5px 9px' }}
                          >
                            ⚡ Extend / Fee
                          </button>

                          {/* Suspend / Activate Toggle */}
                          <button
                            type="button"
                            className={`btn btn-sm ${u.is_active ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => handleToggleAccess(u)}
                            disabled={updatingId === u.id}
                            style={{
                              fontSize: '11px',
                              padding: '5px 9px',
                              color: u.is_active ? 'var(--danger)' : 'var(--text-primary)',
                              borderColor: u.is_active ? 'rgba(239, 68, 68, 0.3)' : undefined,
                            }}
                          >
                            {u.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>

                          {/* WhatsApp Payment Reminder */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCopyReminder(u)}
                            title="Copy payment reminder message for WhatsApp/SMS"
                            style={{ fontSize: '11px', padding: '5px 8px' }}
                          >
                            💬 Reminder
                          </button>

                          {/* Inspect Modal */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedUser(u)}
                            title="Inspect Gym Details"
                            style={{ fontSize: '11px', padding: '5px 8px' }}
                          >
                            🔍
                          </button>

                          {/* Delete Gym */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDeleteUser(u)}
                            title="Permanently Delete Gym"
                            style={{ fontSize: '11px', padding: '5px 8px', color: 'var(--danger)' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBSCRIPTION & MONTHLY FEE MANAGEMENT MODAL */}
      <Modal
        isOpen={!!subModalUser}
        onClose={() => setSubModalUser(null)}
        title={`⚡ Manage Subscription & Fee: ${subModalUser?.gym_name || ''}`}
        maxWidth="480px"
      >
        {subModalUser && (
          <form onSubmit={handleSaveSubscription}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '12px 14px', borderRadius: '10px', marginBottom: '18px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gym Owner:</span>
                <strong>{subModalUser.full_name || subModalUser.username}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Current Expiry Date:</span>
                <strong>{subModalUser.subscription_end || 'Not Set'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Time Left:</span>
                <strong style={{ color: subModalUser.is_overdue ? 'var(--danger)' : 'var(--accent)' }}>
                  {subModalUser.is_overdue ? `${Math.abs(subModalUser.days_remaining)} days overdue` : `${subModalUser.days_remaining} days remaining`}
                </strong>
              </div>
            </div>

            {/* Set Monthly Fee */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Monthly SaaS Fee to Charge This Gym (₹ INR) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  ₹
                </span>
                <input
                  type="number"
                  className="form-input"
                  value={subFormData.subscription_fee}
                  onChange={(e) => setSubFormData({ ...subFormData, subscription_fee: e.target.value })}
                  required
                  min="0"
                  step="50"
                  style={{ paddingLeft: '28px', fontSize: '15px', fontWeight: '700' }}
                />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Preset standard rates: ₹999/mo • ₹1,499/mo • ₹1,999/mo • ₹2,499/mo
              </div>
            </div>

            {/* Quick Extension Buttons */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Extend Subscription Validity & Reactivate</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
                {[
                  { days: 30, label: '+1 Month' },
                  { days: 90, label: '+3 Months' },
                  { days: 180, label: '+6 Months' },
                  { days: 365, label: '+1 Year' },
                ].map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setSubFormData({ ...subFormData, extend_days: opt.days })}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: subFormData.extend_days === opt.days ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                      background: subFormData.extend_days === opt.days ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                      color: subFormData.extend_days === opt.days ? 'var(--accent)' : 'var(--text-primary)',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Extending automatically reactivates the gym account and restores full login access.
              </div>
            </div>

            {/* Subscription Tier */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Plan Tier Label</label>
              <select
                className="form-input"
                value={subFormData.subscription_plan}
                onChange={(e) => setSubFormData({ ...subFormData, subscription_plan: e.target.value })}
              >
                <option value="Standard Monthly">Standard Monthly (₹999/mo)</option>
                <option value="Growth Pro">Growth Pro (₹1,499/mo)</option>
                <option value="Enterprise Elite">Enterprise Elite (₹2,499/mo)</option>
                <option value="Annual Pre-Paid">Annual Pre-Paid</option>
                <option value="Custom Negotiated">Custom Negotiated</option>
              </select>
            </div>

            {/* Admin Notes */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Payment & Internal Notes</label>
              <textarea
                className="form-input"
                rows="2"
                placeholder="Enter notes (payment mode, reference ID, remarks)..."
                value={subFormData.admin_notes}
                onChange={(e) => setSubFormData({ ...subFormData, admin_notes: e.target.value })}
              />
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSubModalUser(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Confirm Payment & Save →
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* INSPECT GYM AUDIT MODAL */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`🔍 Gym Audit Dossier: ${selectedUser?.gym_name || ''}`}
        maxWidth="500px"
      >
        {selectedUser && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Administrator</div>
                <div style={{ fontWeight: '700', fontSize: '14px', marginTop: '2px' }}>{selectedUser.username}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedUser.email || 'No email registered'}</div>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Monthly Software Fee</div>
                <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--accent)', marginTop: '2px' }}>
                  ₹{Number(selectedUser.subscription_fee || 999).toLocaleString('en-IN')} / mo
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{selectedUser.subscription_plan}</div>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Validity & Due Date</div>
                <div style={{ fontWeight: '700', fontSize: '13px', marginTop: '2px' }}>{selectedUser.subscription_end || 'Not set'}</div>
                <div style={{ fontSize: '12px', color: selectedUser.is_overdue ? 'var(--danger)' : 'var(--accent)', fontWeight: '600' }}>
                  {selectedUser.is_overdue ? `Overdue by ${Math.abs(selectedUser.days_remaining)} days` : `${selectedUser.days_remaining} days left`}
                </div>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Athletes Enrolled</div>
                <div style={{ fontWeight: '700', fontSize: '14px', marginTop: '2px' }}>{selectedUser.members_count} Athletes</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Total Fees: ₹{Number(selectedUser.total_collections || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
              <div><strong>Phone:</strong> {selectedUser.gym_phone || 'N/A'}</div>
              <div style={{ marginTop: '4px' }}><strong>Gym UPI ID:</strong> {selectedUser.upi_id || 'N/A'}</div>
              <div style={{ marginTop: '4px' }}><strong>Gym Address:</strong> {selectedUser.gym_address || 'N/A'}</div>
              <div style={{ marginTop: '4px' }}><strong>Last Login:</strong> {selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleString('en-IN') : 'Never'}</div>
              {selectedUser.admin_notes && (
                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <strong>Owner Notes:</strong> {selectedUser.admin_notes}
                </div>
              )}
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  handleOpenSubscriptionModal(target);
                }}
              >
                ⚡ Extend / Edit Fee
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
