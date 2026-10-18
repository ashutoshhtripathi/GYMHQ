import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('monthly-fees');

  // Month selector
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Tab 1: Monthly Fees
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // Tab 2: Expiry
  const [expiryReport, setExpiryReport] = useState(null);
  const [daysAhead, setDaysAhead] = useState(30);
  const [loadingExpiry, setLoadingExpiry] = useState(false);

  // Tab 3: Attendance
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [attFrom, setAttFrom] = useState('');
  const [attTo, setAttTo] = useState('');
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Tab 4: Collection Breakdown
  const [collectionReport, setCollectionReport] = useState(null);
  const [loadingCollection, setLoadingCollection] = useState(false);

  const toast = useToast();

  // Load Monthly Fee Report
  const loadMonthlyReport = async (month) => {
    setLoadingMonthly(true);
    try {
      const res = await api.getMonthlyFeeReport(month);
      setMonthlyReport(res);
    } catch (err) {
      toast.error('Failed to load monthly fee report: ' + err.message);
    } finally {
      setLoadingMonthly(false);
    }
  };

  // Load Expiry Report
  const loadExpiryReport = async (days) => {
    setLoadingExpiry(true);
    try {
      const res = await api.getExpiryReport({ days_ahead: days });
      setExpiryReport(res);
    } catch (err) {
      toast.error('Failed to load expiry report: ' + err.message);
    } finally {
      setLoadingExpiry(false);
    }
  };

  // Load Attendance Report
  const loadAttendanceReport = async () => {
    setLoadingAttendance(true);
    try {
      const res = await api.getAttendanceReport({
        date_from: attFrom || undefined,
        date_to: attTo || undefined,
      });
      setAttendanceReport(res);
    } catch (err) {
      toast.error('Failed to load attendance report: ' + err.message);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Load Collection Breakdown
  const loadCollectionReport = async (month) => {
    setLoadingCollection(true);
    try {
      const res = await api.getCollectionReport(month);
      setCollectionReport(res);
    } catch (err) {
      toast.error('Failed to load collection report: ' + err.message);
    } finally {
      setLoadingCollection(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'monthly-fees') loadMonthlyReport(selectedMonth);
    else if (activeTab === 'expiry') loadExpiryReport(daysAhead);
    else if (activeTab === 'attendance') loadAttendanceReport();
    else if (activeTab === 'collection') loadCollectionReport(selectedMonth);
  }, [activeTab, selectedMonth, daysAhead]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Reports & Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Comprehensive billing reconciliation, attendance statistics, and CSV data export.
          </p>
        </div>

        <div className="page-header-actions" style={{ display: 'flex', gap: '8px' }}>
          {(activeTab === 'monthly-fees' || activeTab === 'collection') && (
            <input
              type="month"
              className="form-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            />
          )}

          {activeTab === 'monthly-fees' && (
            <a
              href={api.exportMonthlyFeesCsv(selectedMonth)}
              className="btn btn-secondary btn-sm"
              download
            >
              📥 Export CSV
            </a>
          )}

          {activeTab === 'attendance' && (
            <a
              href={api.exportAttendanceCsv({ date_from: attFrom, date_to: attTo })}
              className="btn btn-secondary btn-sm"
              download
            >
              📥 Export CSV
            </a>
          )}

          {activeTab === 'collection' && (
            <a
              href={api.exportCollectionCsv(selectedMonth)}
              className="btn btn-secondary btn-sm"
              download
            >
              📥 Export CSV
            </a>
          )}
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <button
          className={`tab-btn ${activeTab === 'monthly-fees' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly-fees')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'monthly-fees' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'monthly-fees' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          💳 Monthly Fees & Dues
        </button>

        <button
          className={`tab-btn ${activeTab === 'expiry' ? 'active' : ''}`}
          onClick={() => setActiveTab('expiry')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'expiry' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'expiry' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          ⚠️ Expiry & Renewals
        </button>

        <button
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'attendance' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'attendance' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          🏃 Attendance Log
        </button>

        <button
          className={`tab-btn ${activeTab === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveTab('collection')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'collection' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'collection' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          📊 Collection Breakdown
        </button>
      </div>

      {/* TAB 1: MONTHLY FEES & DUES */}
      {activeTab === 'monthly-fees' && (
        <div>
          {/* Summary KPIs */}
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-card-label">Expected Fees ({selectedMonth})</div>
              <div className="stat-card-value">
                ₹{Number(monthlyReport?.expected_fees || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                All active membership plans
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Fees Paid ({selectedMonth})</div>
              <div className="stat-card-value" style={{ color: 'var(--accent)' }}>
                ₹{Number(monthlyReport?.total_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Applied to fee month {selectedMonth}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Outstanding Dues</div>
              <div className="stat-card-value" style={{ color: Number(monthlyReport?.outstanding_dues || 0) > 0 ? 'var(--error)' : 'var(--accent)' }}>
                ₹{Number(monthlyReport?.outstanding_dues || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Uncollected revenue balance
              </div>
            </div>
          </div>

          {/* Member Billing Breakdown Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="card-title">Member Billing Status for {selectedMonth}</h3>
              <p className="card-subtitle">Expected monthly fee vs verified payment credits</p>
            </div>

            {loadingMonthly ? (
              <div style={{ padding: '32px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton skeleton-row" />
                ))}
              </div>
            ) : (!monthlyReport?.member_details || monthlyReport.member_details.length === 0) ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No Active Billings</div>
                <div className="empty-state-text">No active member billing schedules found for {selectedMonth}.</div>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Athlete</th>
                      <th>Plan</th>
                      <th>Expected Fee</th>
                      <th>Amount Paid</th>
                      <th>Remaining Due</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReport.member_details.map((m) => (
                      <tr key={m.member_id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{m.member_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.phone}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px' }}>{m.plan || 'Standard'}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '600' }}>₹{Number(m.expected_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </td>
                        <td style={{ color: Number(m.paid_amount) > 0 ? 'var(--accent)' : 'inherit' }}>
                          ₹{Number(m.paid_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ fontWeight: '700', color: Number(m.remaining_balance) > 0 ? 'var(--error)' : 'var(--text-secondary)' }}>
                          ₹{Number(m.remaining_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span className={`badge ${m.payment_status === 'paid' ? 'badge-paid' : m.payment_status === 'partial' ? 'badge-partial' : 'badge-unpaid'}`}>
                            {m.payment_status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {Number(m.remaining_balance) > 0 ? (
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn-reminder"
                                onClick={() => {
                                  const text = `Hi ${m.member_name}, this is a friendly reminder from GYMHQ. Your membership fee of ₹${Number(m.remaining_balance).toLocaleString('en-IN')} for ${selectedMonth} is currently due. Please clear your dues at the front desk or via UPI. Thank you!`;
                                  navigator.clipboard.writeText(text);
                                  toast.success(`Copied reminder text for ${m.member_name}!`);
                                }}
                                title="Copy WhatsApp/SMS payment reminder message"
                              >
                                💬 Reminder
                              </button>
                              <Link
                                to={`/payments?member=${m.member_id}`}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                              >
                                Collect Fee
                              </Link>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }}>✓ Cleared</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EXPIRY & RENEWALS */}
      {activeTab === 'expiry' && (
        <div>
          <div className="filters-bar">
            <div className="filter-group">
              <label>Show memberships expiring within:</label>
              <select
                className="form-select"
                value={daysAhead}
                onChange={(e) => setDaysAhead(parseInt(e.target.value))}
              >
                <option value={7}>Next 7 Days</option>
                <option value={15}>Next 15 Days</option>
                <option value={30}>Next 30 Days</option>
                <option value={60}>Next 60 Days</option>
                <option value={90}>Next 90 Days</option>
              </select>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
              Total Flagged: <strong style={{ color: 'var(--text-primary)' }}>{expiryReport?.total || 0}</strong>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loadingExpiry ? (
              <div style={{ padding: '32px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton skeleton-row" />
                ))}
              </div>
            ) : (!expiryReport?.expiring_members || expiryReport.expiring_members.length === 0) ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎉</div>
                <div className="empty-state-title">No Expiring Memberships</div>
                <div className="empty-state-text">No athletes have memberships expiring in the selected window.</div>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Athlete</th>
                      <th>Phone</th>
                      <th>Plan</th>
                      <th>End Date</th>
                      <th>Days Left</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiryReport.expiring_members.map((m) => {
                      const isExpired = m.days_remaining < 0;
                      return (
                        <tr key={m.member_id}>
                          <td style={{ fontWeight: '600' }}>{m.member_name}</td>
                          <td><span className="font-mono text-sm">{m.phone}</span></td>
                          <td>{m.plan || 'Standard'}</td>
                          <td>{m.membership_end}</td>
                          <td>
                            <span className={`badge ${isExpired ? 'badge-inactive' : m.days_remaining <= 7 ? 'badge-expired' : 'badge-frozen'}`}>
                              {isExpired ? `Expired ${Math.abs(m.days_remaining)}d ago` : `${m.days_remaining} days left`}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${m.status === 'active' ? 'active' : 'inactive'}`}>
                              {m.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link
                              to={`/members?renew=${m.member_id}`}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                            >
                              Renew Now
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE LOG */}
      {activeTab === 'attendance' && (
        <div>
          <div className="filters-bar">
            <div className="filter-group">
              <label>From Date:</label>
              <input
                type="date"
                className="form-input"
                value={attFrom}
                onChange={(e) => setAttFrom(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>To Date:</label>
              <input
                type="date"
                className="form-input"
                value={attTo}
                onChange={(e) => setAttTo(e.target.value)}
              />
            </div>
            <button
              className="btn btn-secondary"
              onClick={loadAttendanceReport}
            >
              Filter
            </button>
            {(attFrom || attTo) && (
              <button
                className="btn btn-ghost"
                onClick={() => { setAttFrom(''); setAttTo(''); }}
              >
                Reset
              </button>
            )}
            <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Total Scans: <strong style={{ color: 'var(--text-primary)' }}>{attendanceReport?.total || 0}</strong>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loadingAttendance ? (
              <div style={{ padding: '32px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton skeleton-row" />
                ))}
              </div>
            ) : (!attendanceReport?.records || attendanceReport.records.length === 0) ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏃</div>
                <div className="empty-state-title">No Attendance Records</div>
                <div className="empty-state-text">No attendance records found for this period.</div>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Athlete</th>
                      <th>Phone</th>
                      <th>Date</th>
                      <th>Checked In</th>
                      <th style={{ textAlign: 'right' }}>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceReport.records.map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600' }}>{r.member_name}</td>
                        <td><span className="font-mono text-sm">{r.phone}</span></td>
                        <td>{r.attendance_date}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {r.checked_in_at ? new Date(r.checked_in_at).toLocaleTimeString() : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="badge badge-active">✓ Present</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: COLLECTION BREAKDOWN */}
      {activeTab === 'collection' && (
        <div>
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-card-label">Total Receipts Collected</div>
              <div className="stat-card-value" style={{ color: 'var(--accent)' }}>
                ₹{Number(collectionReport?.total_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                For month of {selectedMonth}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Transaction Count</div>
              <div className="stat-card-value">
                {collectionReport?.payment_count || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Verified payment slips
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="card-title">Receipts by Payment Channel</h3>
              <p className="card-subtitle">Channel distribution breakdown</p>
            </div>

            {loadingCollection ? (
              <div style={{ padding: '32px' }}>
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton skeleton-row" />
                ))}
              </div>
            ) : (!collectionReport?.by_method || Object.keys(collectionReport.by_method).length === 0) ? (
              <div className="empty-state">
                <div className="empty-state-icon">💳</div>
                <div className="empty-state-title">No Collections in {selectedMonth}</div>
                <div className="empty-state-text">No payment records were recorded with a payment date in this month.</div>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Payment Channel</th>
                      <th>Total Collected</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(collectionReport.by_method).map(([method, amount]) => {
                      const total = Number(collectionReport.total_collected || 1);
                      const pct = Math.round((Number(amount) / total) * 100);
                      return (
                        <tr key={method}>
                          <td style={{ fontWeight: '600', textTransform: 'uppercase' }}>
                            <span className="badge badge-frozen" style={{ marginRight: '8px' }}>
                              {method}
                            </span>
                            {method === 'upi' ? 'UPI / QR Scan' : method === 'card' ? 'Credit / Debit Card' : method === 'cash' ? 'Direct Cash' : 'Bank Transfer'}
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--accent)' }}>
                            ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden', maxWidth: '120px' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)' }} />
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{pct}%</span>
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
        </div>
      )}
    </div>
  );
}
