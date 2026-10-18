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
  const [selectedUser, setSelectedUser] = useState(null);
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
    const actionLabel = newStatus ? 'activate' : 'suspend';

    if (targetUser.username === 'admin' && !newStatus) {
      toast.warning('Cannot suspend the root platform administrator.');
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

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.username === 'admin') {
      toast.warning('Cannot delete the root administrator account.');
      return;
    }

    if (!window.confirm(`PERMANENT ACTION: Delete account '${targetUser.username}' (${targetUser.gym_name})?`)) {
      return;
    }

    try {
      await api.deletePlatformUser(targetUser.id);
      toast.success(`Account '${targetUser.username}' deleted.`);
      loadData();
      setSelectedUser(null);
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>👑</span>
            <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
              Platform Super Admin & Access Control
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Inspect, manage, and control platform access for every gym owner and fitness club registered on GYMHQ.
          </p>
        </div>

        <div className="page-header-actions" style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadData}
            disabled={loading}
          >
            ↻ Refresh Users
          </button>
        </div>
      </div>

      {/* Platform Overview KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-card-label">Total Registered Gyms</div>
              <div className="stat-card-value" style={{ color: 'var(--text-primary)' }}>
                {overview?.total_gyms ?? 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                All gym accounts on system
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              🏢
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-card-label">Active Operating Gyms</div>
              <div className="stat-card-value" style={{ color: '#00e676' }}>
                {overview?.active_gyms ?? 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Full system access permitted
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'rgba(0, 230, 118, 0.15)', color: '#00e676' }}>
              ✓
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-card-label">Suspended / Barred</div>
              <div className="stat-card-value" style={{ color: overview?.suspended_gyms > 0 ? 'var(--error)' : 'var(--text-tertiary)' }}>
                {overview?.suspended_gyms ?? 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Access locked by you
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'rgba(255, 82, 82, 0.15)', color: 'var(--error)' }}>
              🚫
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="stat-card-label">Total Platform Revenue</div>
              <div className="stat-card-value" style={{ color: '#00f0ff' }}>
                ₹{Number(overview?.total_platform_collections || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {overview?.total_platform_athletes ?? 0} total enrolled athletes
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff' }}>
              💰
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by gym name, owner name, username, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
            {search && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setSearch(''); setTimeout(loadData, 50); }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Status:</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            >
              <option value="all">All Accounts ({overview?.total_gyms ?? 0})</option>
              <option value="active">Active Only ({overview?.active_gyms ?? 0})</option>
              <option value="suspended">Suspended Only ({overview?.suspended_gyms ?? 0})</option>
            </select>
          </div>
        </form>
      </div>

      {/* Users & Access Management Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="card-title">Registered Gym Accounts & Access</h3>
            <p className="card-subtitle">Showing {users.length} registered accounts</p>
          </div>
          <span className="badge badge-paid" style={{ fontSize: '11px' }}>
            Live Access Control
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading platform accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0' }}>
            <div style={{ fontSize: '32px', opacity: 0.5 }}>🔍</div>
            <div className="empty-state-title">No gym accounts match your search</div>
            <div className="empty-state-text">Try resetting filters or search terms.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Gym & Owner Profile</th>
                  <th>Contact & Auth</th>
                  <th>Role</th>
                  <th>Access Status</th>
                  <th>Operating Stats</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'right' }}>Access Control</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isCurrentAdmin = u.username === 'admin' || u.role === 'super_admin';
                  return (
                    <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.65 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: u.is_active ? 'var(--accent-light)' : 'rgba(255, 82, 82, 0.15)',
                            color: u.is_active ? 'var(--accent)' : 'var(--error)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '14px',
                            border: `1px solid ${u.is_active ? 'rgba(0, 230, 118, 0.4)' : 'rgba(255, 82, 82, 0.4)'}`,
                            flexShrink: 0
                          }}>
                            {(u.gym_name || u.username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>
                              {u.gym_name || 'My Gym'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              Owner: {u.full_name || u.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                          @{u.username}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {u.email || (u.gym_phone ? `📞 ${u.gym_phone}` : 'No email')}
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${isCurrentAdmin ? 'badge-method-upi' : 'badge-frozen'}`} style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                          {isCurrentAdmin ? '👑 Super Admin' : 'Gym Owner'}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${u.is_active ? 'badge-paid' : 'badge-expired'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '8px' }}>●</span>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          👥 {u.members_count} Athletes
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--accent)' }}>
                          ₹{Number(u.total_collections).toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Initial'}
                        </div>
                        {u.last_login_at && (
                          <div style={{ fontSize: '10px', color: 'var(--accent)' }}>
                            Active: {new Date(u.last_login_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedUser(u)}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Inspect complete gym details"
                          >
                            Details
                          </button>

                          {!isCurrentAdmin && (
                            <button
                              type="button"
                              className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-primary'}`}
                              onClick={() => handleToggleAccess(u)}
                              disabled={updatingId === u.id}
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                              title={u.is_active ? 'Suspend this gym from using website' : 'Restore website access'}
                            >
                              {updatingId === u.id
                                ? 'Updating...'
                                : u.is_active
                                ? '🚫 Suspend'
                                : '✓ Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User / Gym Inspection Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser ? `🏢 ${selectedUser.gym_name || selectedUser.username} — Account Details` : 'Account Details'}
        maxWidth="540px"
      >
        {selectedUser && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {selectedUser.gym_name || 'My Gym'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Username: @{selectedUser.username} • User ID: #{selectedUser.id}
                </div>
              </div>
              <span className={`badge ${selectedUser.is_active ? 'badge-paid' : 'badge-expired'}`}>
                {selectedUser.is_active ? '✓ Access Active' : '🚫 Suspended'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px', fontSize: '13px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Owner Full Name
                </label>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedUser.full_name || 'Not provided'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Email Address
                </label>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedUser.email || 'None'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Front Desk Phone
                </label>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedUser.gym_phone || 'None'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>
                  UPI ID (Fees)
                </label>
                <div style={{ fontWeight: '600', color: 'var(--accent)', marginTop: '2px' }}>
                  {selectedUser.upi_id || 'Not set'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '13px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>
                Location / Gym Address
              </label>
              <div style={{ fontWeight: '500', color: 'var(--text-primary)', marginTop: '2px' }}>
                {selectedUser.gym_address || 'No physical address configured.'}
              </div>
            </div>

            <div className="form-actions" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
              {selectedUser.username !== 'admin' ? (
                <button
                  type="button"
                  className={`btn ${selectedUser.is_active ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => handleToggleAccess(selectedUser)}
                >
                  {selectedUser.is_active ? '🚫 Suspend Website Access' : '✓ Re-Activate Access'}
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '700' }}>
                  👑 Platform Super Admin Account
                </span>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
