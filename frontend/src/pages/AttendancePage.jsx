import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Check-In Widget Form
  const [membersList, setMembersList] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.getAttendance({
        search: search.trim() || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
      });
      setRecords(res.records || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error('Failed to load attendance logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const [countRes, membersRes] = await Promise.all([
        api.getTodayAttendance().catch(() => ({ count: 0 })),
        api.getMembers({ status: 'active', page_size: 100 }).catch(() => ({ members: [] })),
      ]);
      setTodayCount(countRes.count || 0);
      setMembersList(membersRes.members || membersRes.items || []);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [page, dateFrom, dateTo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadAttendance();
  };

  const handleQuickCheckIn = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.warning('Please select an athlete to check in.');
      return;
    }

    setSubmitting(true);
    try {
      await api.markAttendance({
        member_id: parseInt(selectedMemberId),
        attendance_date: checkInDate,
      });
      const member = membersList.find((m) => m.id === parseInt(selectedMemberId));
      toast.success(`Check-in recorded for ${member ? member.name : 'athlete'}!`);
      setSelectedMemberId('');
      loadAttendance();
      loadMeta();
    } catch (err) {
      toast.error(err.message || 'Failed to record check-in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Floor Attendance
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Daily check-in logs, member scan history, and floor capacity tracking.
          </p>
        </div>

        <div className="page-header-actions">
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Today's Total:</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>
              {todayCount}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Check-In Station Banner */}
      <div className="card" style={{ marginBottom: '24px', borderColor: 'var(--accent-glow)' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ color: 'var(--accent)' }}>⚡</span> Quick Front-Desk Check-In
        </h3>

        <form onSubmit={handleQuickCheckIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select Active Member</label>
            <select
              className="form-select"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              required
            >
              <option value="">-- Choose athlete --</option>
              {membersList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.phone}) {m.plan ? `• ${m.plan}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Check-In Date</label>
            <input
              type="date"
              className="form-input"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={submitting}
              style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {submitting ? 'Logging...' : '✓ Log Check-In'}
            </button>
          </div>
        </form>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search member name or phone..."
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
              onClick={() => { setSearch(''); setPage(1); loadAttendance(); }}
            >
              Clear
            </button>
          )}
        </form>

        <div className="filter-group">
          <label>From:</label>
          <input
            type="date"
            className="form-input"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          />
        </div>

        <div className="filter-group">
          <label>To:</label>
          <input
            type="date"
            className="form-input"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          />
        </div>

        {(dateFrom || dateTo) && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
          >
            Reset Dates
          </button>
        )}
      </div>

      {/* Attendance Log Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton skeleton-row" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No Attendance Records</div>
            <div className="empty-state-text">
              {search || dateFrom || dateTo
                ? 'No check-ins match your current filters.'
                : 'Use the quick check-in station above to log members as they arrive.'}
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Phone</th>
                  <th>Attendance Date</th>
                  <th>Time Logged</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  let timeFormatted = '—';
                  if (r.checked_in_at) {
                    try {
                      timeFormatted = new Date(r.checked_in_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    } catch {
                      timeFormatted = '—';
                    }
                  }

                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {r.member_name}
                      </td>
                      <td>
                        <span className="font-mono text-sm">{r.member_phone || '—'}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '500' }}>{r.attendance_date}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {timeFormatted}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="badge badge-active">
                          ✓ Present
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 50 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {page} of {Math.ceil(total / 50)} ({total} total entries)
            </span>
            <button
              className="pagination-btn"
              disabled={page >= Math.ceil(total / 50)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
