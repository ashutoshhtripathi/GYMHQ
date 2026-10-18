import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberHistory, setMemberHistory] = useState({ attendances: [], payments: [] });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    plan: 'Monthly',
    status: 'active',
    joining_date: new Date().toISOString().split('T')[0],
    membership_start: new Date().toISOString().split('T')[0],
    membership_end: '',
    monthly_fee: '1500.00',
  });

  const [renewData, setRenewData] = useState({
    plan: 'Monthly',
    membership_start: new Date().toISOString().split('T')[0],
    membership_end: '',
    monthly_fee: '1500.00',
  });

  const [searchParams] = useSearchParams();
  const toast = useToast();

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await api.getMembers({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        page,
        page_size: pageSize,
      });
      const list = res.members || res.items || [];
      setMembers(list);
      setTotal(res.total || 0);

      // Check for ?renew=<id> query param
      const renewId = searchParams.get('renew');
      if (renewId) {
        const target = list.find((m) => m.id === Number(renewId));
        if (target) {
          handleOpenRenew(target);
        }
      }
    } catch (err) {
      toast.error('Failed to load members: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadMembers();
  };

  // Helper to calculate end date from plan
  const calculateEndDate = (startDateStr, planName) => {
    if (!startDateStr) return '';
    const d = new Date(startDateStr);
    if (planName === 'Monthly') d.setMonth(d.getMonth() + 1);
    else if (planName === 'Quarterly') d.setMonth(d.getMonth() + 3);
    else if (planName === 'Semi-Annual') d.setMonth(d.getMonth() + 6);
    else if (planName === 'Annual') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };

  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const end = calculateEndDate(today, 'Monthly');
    setFormData({
      name: '',
      phone: '',
      plan: 'Monthly',
      status: 'active',
      joining_date: today,
      membership_start: today,
      membership_end: end,
      monthly_fee: '1500.00',
    });
    setShowAddModal(true);
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.warning('Name and Phone are required.');
      return;
    }

    try {
      await api.createMember({
        ...formData,
        monthly_fee: formData.monthly_fee ? parseFloat(formData.monthly_fee) : null,
      });
      toast.success(`Member ${formData.name} added successfully!`);
      setShowAddModal(false);
      loadMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to add member.');
    }
  };

  const handleOpenEdit = (m) => {
    setSelectedMember(m);
    setFormData({
      name: m.name || '',
      phone: m.phone || '',
      plan: m.plan || 'Monthly',
      status: m.status || 'active',
      joining_date: m.joining_date || '',
      membership_start: m.membership_start || '',
      membership_end: m.membership_end || '',
      monthly_fee: m.monthly_fee ? String(m.monthly_fee) : '',
    });
    setShowEditModal(true);
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      await api.updateMember(selectedMember.id, {
        ...formData,
        monthly_fee: formData.monthly_fee ? parseFloat(formData.monthly_fee) : null,
      });
      toast.success('Member updated successfully!');
      setShowEditModal(false);
      loadMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to update member.');
    }
  };

  const handleOpenRenew = (m) => {
    setSelectedMember(m);
    const today = new Date().toISOString().split('T')[0];
    // If current membership_end is in future, start from membership_end, else start today
    let startDate = today;
    if (m.membership_end && new Date(m.membership_end) > new Date()) {
      startDate = m.membership_end;
    }
    const plan = m.plan || 'Monthly';
    setRenewData({
      plan,
      membership_start: startDate,
      membership_end: calculateEndDate(startDate, plan),
      monthly_fee: m.monthly_fee ? String(m.monthly_fee) : '1500.00',
    });
    setShowRenewModal(true);
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      await api.renewMember(selectedMember.id, {
        ...renewData,
        monthly_fee: renewData.monthly_fee ? parseFloat(renewData.monthly_fee) : null,
        status: 'active',
      });
      toast.success(`Membership renewed for ${selectedMember.name}!`);
      setShowRenewModal(false);
      loadMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to renew membership.');
    }
  };

  const handleToggleStatus = async (m) => {
    try {
      if (m.status === 'active') {
        await api.deactivateMember(m.id);
        toast.info(`${m.name} has been deactivated.`);
      } else {
        await api.activateMember(m.id);
        toast.success(`${m.name} is now active.`);
      }
      loadMembers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOpenDetail = async (m) => {
    setSelectedMember(m);
    setShowDetailModal(true);
    try {
      const [attendances, payments] = await Promise.all([
        api.getMemberAttendance(m.id).catch(() => []),
        api.getMemberPayments(m.id).catch(() => []),
      ]);
      setMemberHistory({
        attendances: attendances || [],
        payments: payments || [],
      });
    } catch (err) {
      toast.error('Failed to load member records: ' + err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Athletes & Members
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Manage memberships, profiles, fee schedules, and renewals.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            + Add New Member
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          {search && (
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => { setSearch(''); setPage(1); loadMembers(); }}
            >
              Clear
            </button>
          )}
        </form>

        <div className="filter-chips">
          {[
            { id: '', label: 'All Athletes' },
            { id: 'active', label: 'Active' },
            { id: 'expired', label: 'Expired' },
            { id: 'pending', label: 'Pending' },
            { id: 'inactive', label: 'Inactive' },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={`filter-chip ${statusFilter === chip.id ? 'active' : ''}`}
              onClick={() => { setStatusFilter(chip.id); setPage(1); }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton skeleton-row" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No Members Found</div>
            <div className="empty-state-text">
              {search || statusFilter ? 'Try adjusting your search criteria.' : 'Enrolling members allows you to track check-ins and payments.'}
            </div>
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              Enroll First Member
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Phone</th>
                  <th>Plan</th>
                  <th>Monthly Fee</th>
                  <th>Membership Window</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div 
                        style={{ fontWeight: '600', cursor: 'pointer', color: 'var(--text-primary)' }}
                        onClick={() => handleOpenDetail(m)}
                        title="Click to view full athlete profile"
                      >
                        {m.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Joined: {m.joining_date || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-sm">{m.phone}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>{m.plan || 'Standard'}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        ₹{m.monthly_fee ? Number(m.monthly_fee).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {m.membership_start || '—'} <span style={{ color: 'var(--text-tertiary)' }}>→</span> {m.membership_end || '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${m.status === 'active' ? 'active' : m.status === 'expired' ? 'expired' : m.status === 'pending' ? 'frozen' : 'inactive'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleOpenDetail(m)}
                          title="View Records"
                        >
                          View
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenRenew(m)}
                          title="Renew Membership"
                        >
                          Renew
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleOpenEdit(m)}
                          title="Edit Details"
                        >
                          Edit
                        </button>
                        <button 
                          className={`btn btn-sm ${m.status === 'active' ? 'btn-danger' : 'btn-secondary'}`}
                          onClick={() => handleToggleStatus(m)}
                          title={m.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          style={{ padding: '4px 8px' }}
                        >
                          {m.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="pagination">
            <button
              className="pagination-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {page} of {Math.ceil(total / pageSize)} ({total} total members)
            </span>
            <button
              className="pagination-btn"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* 1. Add Member Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Enroll New Member">
        <form onSubmit={handleCreateMember}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter member's full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number * (Unique)</label>
            <input
              type="tel"
              className="form-input"
              placeholder="Enter 10-digit mobile number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Membership Plan</label>
              <select
                className="form-select"
                value={formData.plan}
                onChange={(e) => {
                  const p = e.target.value;
                  const end = calculateEndDate(formData.membership_start, p);
                  let fee = '1500.00';
                  if (p === 'Quarterly') fee = '4000.00';
                  if (p === 'Semi-Annual') fee = '7500.00';
                  if (p === 'Annual') fee = '14000.00';
                  setFormData({ ...formData, plan: p, membership_end: end, monthly_fee: fee });
                }}
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Semi-Annual">Semi-Annual</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Monthly / Period Fee (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.monthly_fee}
                onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.membership_start}
                onChange={(e) => {
                  const start = e.target.value;
                  const end = calculateEndDate(start, formData.plan);
                  setFormData({ ...formData, membership_start: start, membership_end: end });
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.membership_end}
                onChange={(e) => setFormData({ ...formData, membership_end: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Enroll Athlete
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit Member Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit ${selectedMember?.name}`}>
        <form onSubmit={handleUpdateMember}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input
              type="tel"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Fee (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.monthly_fee}
                onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Membership Start</label>
              <input
                type="date"
                className="form-input"
                value={formData.membership_start}
                onChange={(e) => setFormData({ ...formData, membership_start: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Membership End</label>
              <input
                type="date"
                className="form-input"
                value={formData.membership_end}
                onChange={(e) => setFormData({ ...formData, membership_end: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Renew Member Modal */}
      <Modal isOpen={showRenewModal} onClose={() => setShowRenewModal(false)} title={`Renew Membership — ${selectedMember?.name}`}>
        <form onSubmit={handleRenewSubmit}>
          <div style={{ background: 'var(--accent-light)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              Renewing membership extends the member's active period and reactivates their status without altering previous payment records.
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Renewal Plan</label>
              <select
                className="form-select"
                value={renewData.plan}
                onChange={(e) => {
                  const p = e.target.value;
                  const end = calculateEndDate(renewData.membership_start, p);
                  let fee = '1500.00';
                  if (p === 'Quarterly') fee = '4000.00';
                  if (p === 'Semi-Annual') fee = '7500.00';
                  if (p === 'Annual') fee = '14000.00';
                  setRenewData({ ...renewData, plan: p, membership_end: end, monthly_fee: fee });
                }}
              >
                <option value="Monthly">Monthly (+1 Month)</option>
                <option value="Quarterly">Quarterly (+3 Months)</option>
                <option value="Semi-Annual">Semi-Annual (+6 Months)</option>
                <option value="Annual">Annual (+1 Year)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fee Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={renewData.monthly_fee}
                onChange={(e) => setRenewData({ ...renewData, monthly_fee: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">New Start Date</label>
              <input
                type="date"
                className="form-input"
                value={renewData.membership_start}
                onChange={(e) => {
                  const start = e.target.value;
                  const end = calculateEndDate(start, renewData.plan);
                  setRenewData({ ...renewData, membership_start: start, membership_end: end });
                }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New End Date</label>
              <input
                type="date"
                className="form-input"
                value={renewData.membership_end}
                onChange={(e) => setRenewData({ ...renewData, membership_end: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowRenewModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Renewal
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Member Profile & History Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`Profile: ${selectedMember?.name}`} maxWidth="700px">
        {selectedMember && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PHONE</span>
                <div style={{ fontWeight: '600' }}>{selectedMember.phone}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>STATUS</span>
                <div>
                  <span className={`badge badge-${selectedMember.status === 'active' ? 'active' : 'inactive'}`}>
                    {selectedMember.status}
                  </span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PLAN & FEE</span>
                <div style={{ fontWeight: '600' }}>{selectedMember.plan || 'Standard'} (₹{Number(selectedMember.monthly_fee || 0).toLocaleString('en-IN')})</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>EXPIRATION</span>
                <div style={{ fontWeight: '600', color: selectedMember.membership_end && new Date(selectedMember.membership_end) < new Date() ? 'var(--error)' : 'var(--accent)' }}>
                  {selectedMember.membership_end || 'Not set'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Attendances */}
              <div>
                <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Recent Attendances ({memberHistory.attendances.length})
                </h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  {memberHistory.attendances.length === 0 ? (
                    <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      No check-ins on record.
                    </div>
                  ) : (
                    <table className="data-table" style={{ fontSize: '12px' }}>
                      <tbody>
                        {memberHistory.attendances.map((a, i) => (
                          <tr key={i}>
                            <td>{a.attendance_date}</td>
                            <td style={{ textAlign: 'right', color: 'var(--accent)' }}>✓ Present</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Payments */}
              <div>
                <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Payment History ({memberHistory.payments.length})
                </h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  {memberHistory.payments.length === 0 ? (
                    <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      No payments on record.
                    </div>
                  ) : (
                    <table className="data-table" style={{ fontSize: '12px' }}>
                      <tbody>
                        {memberHistory.payments.map((p, i) => (
                          <tr key={i}>
                            <td>
                              <div>₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{p.fee_month || p.payment_date}</div>
                            </td>
                            <td style={{ textAlign: 'right', textTransform: 'uppercase', fontSize: '11px' }}>
                              <span className="badge badge-frozen">{p.payment_method || 'cash'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
