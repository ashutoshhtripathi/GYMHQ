import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { user } = useAuth();
  const toast = useToast();

  const loadDashboard = async (month) => {
    setLoading(true);
    try {
      const res = await api.getDashboard(month);
      setData(res);
    } catch (err) {
      toast.error('Failed to load dashboard metrics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(selectedMonth);
  }, [selectedMonth]);

  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'members' | 'attendance'

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const monthlyGraph = data?.monthly_graph || [];
  const total6MonthRevenue = monthlyGraph.reduce((acc, m) => acc + Number(m.collection || 0), 0);
  const total6MonthMembers = monthlyGraph.reduce((acc, m) => acc + (m.new_members || 0), 0);
  const total6MonthAttendance = monthlyGraph.reduce((acc, m) => acc + (m.attendance_count || 0), 0);
  const avgMonthlyRevenue = monthlyGraph.length ? Math.round(total6MonthRevenue / monthlyGraph.length) : 0;

  const getMetricMax = () => {
    if (chartMetric === 'revenue') {
      const maxRev = Math.max(...monthlyGraph.map((m) => Number(m.collection || 0)), 0);
      return maxRev > 0 ? maxRev : 10000;
    }
    if (chartMetric === 'members') {
      const maxMem = Math.max(...monthlyGraph.map((m) => m.new_members || 0), 0);
      return maxMem > 0 ? maxMem : 10;
    }
    const maxAtt = Math.max(...monthlyGraph.map((m) => m.attendance_count || 0), 0);
    return maxAtt > 0 ? maxAtt : 20;
  };

  const metricMax = getMetricMax();

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Gym Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Real-time performance metrics, membership flow, and revenue collections.
          </p>
        </div>

        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Month:</label>
            <input
              type="month"
              className="form-input"
              value={selectedMonth}
              onChange={handleMonthChange}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            />
          </div>
          <Link to="/members" className="btn btn-primary btn-sm">
            + Add Member
          </Link>
          <Link to="/attendance" className="btn btn-secondary btn-sm">
            Check-In
          </Link>
        </div>
      </div>

      {loading && !data ? (
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card skeleton skeleton-card" />
          ))}
        </div>
      ) : (
        <>
          {/* Key Metric Stat Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-card-label">Active Members</div>
                  <div className="stat-card-value">{data?.stats?.active_members ?? 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Out of {data?.stats?.total_members ?? 0} total enrolled
                  </div>
                </div>
                <div className="stat-card-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                  👥
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-card-label">Today's Check-Ins</div>
                  <div className="stat-card-value" style={{ color: 'var(--accent)' }}>
                    {data?.today_attendance_count ?? 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Daily floor attendance
                  </div>
                </div>
                <div className="stat-card-icon" style={{ background: 'rgba(0, 230, 118, 0.15)', color: 'var(--accent)' }}>
                  ⚡
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-card-label">Collections ({selectedMonth})</div>
                  <div className="stat-card-value" style={{ color: '#00e676' }}>
                    ₹{Number(data?.current_month_collection || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Total payments received
                  </div>
                </div>
                <div className="stat-card-icon" style={{ background: 'rgba(68, 138, 255, 0.15)', color: 'var(--info)' }}>
                  💳
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-card-label">Dues & Expired</div>
                  <div className="stat-card-value" style={{ color: 'var(--warning)' }}>
                    {data?.stats?.pending_dues_count ?? 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {data?.stats?.expired_memberships ?? 0} expired memberships
                  </div>
                </div>
                <div className="stat-card-icon" style={{ background: 'rgba(255, 171, 64, 0.15)', color: 'var(--warning)' }}>
                  ⚠️
                </div>
              </div>
            </div>
          </div>

          {/* New Gym Zero-State Welcome Card */}
          {(!data?.stats?.total_members || data.stats.total_members === 0) && (
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.08), rgba(68, 138, 255, 0.08))',
              borderColor: 'rgba(0, 230, 118, 0.35)',
              margin: '24px 0 12px 0',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span className="badge badge-paid" style={{ marginBottom: '8px' }}>
                    🚀 Clean Slate • Ready for Your Gym
                  </span>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '6px 0' }}>
                    Welcome, {user?.full_name || user?.username || 'Gym Owner'}!
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '620px', lineHeight: 1.5 }}>
                    Your system is completely clean and ready. Click below to enroll your gym's first athletes, set up your pricing plans in Indian Rupees (₹), and log daily floor entries.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Link to="/members" className="btn btn-primary">
                    + Enroll First Athlete
                  </Link>
                  <Link to="/attendance" className="btn btn-secondary">
                    Check-In Desk
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Gym Performance Graph Card */}
          <div className="monthly-chart-card">
            {/* Header with Title and Metric Pills */}
            <div className="monthly-chart-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    Monthly Gym Performance Trends
                  </h2>
                  <span className="badge badge-paid" style={{ fontSize: '10px' }}>
                    6-Month Historical
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Track revenue collections in Indian Rupees (₹), athlete signups, and daily floor check-ins over the last 6 months.
                </p>
              </div>

              {/* Metric Switcher Pills */}
              <div className="chart-metric-pills">
                <button
                  type="button"
                  className={`chart-metric-btn ${chartMetric === 'revenue' ? 'active' : ''}`}
                  onClick={() => setChartMetric('revenue')}
                >
                  💰 Collections (₹)
                </button>
                <button
                  type="button"
                  className={`chart-metric-btn ${chartMetric === 'members' ? 'active' : ''}`}
                  onClick={() => setChartMetric('members')}
                >
                  👥 Enrollments
                </button>
                <button
                  type="button"
                  className={`chart-metric-btn ${chartMetric === 'attendance' ? 'active' : ''}`}
                  onClick={() => setChartMetric('attendance')}
                >
                  ⚡ Check-Ins
                </button>
              </div>
            </div>

            {/* Summary KPI Strip */}
            <div className="chart-summary-strip">
              <div className="chart-summary-item">
                <div className="chart-summary-label">6-Month Total Collections</div>
                <div className="chart-summary-val" style={{ color: '#00e676' }}>
                  ₹{total6MonthRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="chart-summary-item">
                <div className="chart-summary-label">Monthly Average Revenue</div>
                <div className="chart-summary-val" style={{ color: '#69f0ae' }}>
                  ₹{avgMonthlyRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="chart-summary-item">
                <div className="chart-summary-label">6-Month New Athletes</div>
                <div className="chart-summary-val" style={{ color: 'var(--info)' }}>
                  {total6MonthMembers}
                </div>
              </div>
              <div className="chart-summary-item">
                <div className="chart-summary-label">Total Floor Visits</div>
                <div className="chart-summary-val" style={{ color: '#ffd700' }}>
                  {total6MonthAttendance}
                </div>
              </div>
            </div>

            {/* Interactive Bars Container */}
            <div className="chart-bars-container">
              {monthlyGraph.map((item) => {
                const isSelected = item.month === selectedMonth;
                let val = 0;
                let bubbleText = '';
                let gradient = 'linear-gradient(180deg, #00e676 0%, rgba(0, 230, 118, 0.25) 100%)';

                if (chartMetric === 'revenue') {
                  val = Number(item.collection || 0);
                  bubbleText = `₹${val.toLocaleString('en-IN')}`;
                  gradient = isSelected 
                    ? 'linear-gradient(180deg, #00e676 0%, rgba(0, 230, 118, 0.5) 100%)' 
                    : 'linear-gradient(180deg, #00e676 0%, rgba(0, 230, 118, 0.2) 100%)';
                } else if (chartMetric === 'members') {
                  val = item.new_members || 0;
                  bubbleText = `${val} enrolled`;
                  gradient = isSelected
                    ? 'linear-gradient(180deg, #448aff 0%, rgba(68, 138, 255, 0.5) 100%)'
                    : 'linear-gradient(180deg, #448aff 0%, rgba(68, 138, 255, 0.2) 100%)';
                } else {
                  val = item.attendance_count || 0;
                  bubbleText = `${val} visits`;
                  gradient = isSelected
                    ? 'linear-gradient(180deg, #ffd700 0%, rgba(255, 215, 0, 0.5) 100%)'
                    : 'linear-gradient(180deg, #ffd700 0%, rgba(255, 215, 0, 0.2) 100%)';
                }

                const heightPercent = val > 0 
                  ? Math.max(14, Math.min(100, Math.round((val / metricMax) * 100))) 
                  : 5;

                return (
                  <div
                    key={item.month}
                    className={`chart-bar-column ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedMonth(item.month)}
                    title={`Click to filter dashboard to ${item.month_label}`}
                  >
                    <div className="chart-bar-value-bubble">
                      {bubbleText}
                    </div>

                    <div
                      className="chart-bar-fill"
                      style={{
                        height: `${heightPercent}%`,
                        background: gradient,
                        border: isSelected ? '1px solid var(--accent)' : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="chart-x-labels">
              {monthlyGraph.map((item) => (
                <div
                  key={item.month}
                  className={`chart-x-label ${item.month === selectedMonth ? 'selected' : ''}`}
                  onClick={() => setSelectedMonth(item.month)}
                  style={{ cursor: 'pointer' }}
                >
                  <div>{item.short_label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>{item.month.split('-')[0]}</div>
                </div>
              ))}
            </div>

            {/* Explanatory Footer Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--accent)' }}>💡</span>
                <span>Click any month bar to inspect its exact members, dues, and transaction records.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-active" style={{ fontSize: '11px' }}>
                  Viewing: {selectedMonth}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '24px 0' }}>
            <Link to="/attendance" className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', transition: 'transform 0.2s, border-color 0.2s', borderColor: 'var(--border-color)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'var(--accent)' }}>
                ✓
              </div>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>Instant Check-In</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Log floor attendance</div>
              </div>
            </Link>

            <Link to="/members" className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', transition: 'transform 0.2s, border-color 0.2s' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(68, 138, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'var(--info)' }}>
                +
              </div>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>Enroll Member</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Register new athlete</div>
              </div>
            </Link>

            <Link to="/payments" className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', transition: 'transform 0.2s, border-color 0.2s' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 230, 118, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'var(--accent)' }}>
                ₹
              </div>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>Record Payment</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>UPI, Cash, Card, Net Banking</div>
              </div>
            </Link>

            <Link to="/reports" className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', transition: 'transform 0.2s, border-color 0.2s' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255, 171, 64, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'var(--warning)' }}>
                📊
              </div>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>Dues & Export</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>CSV reports & summaries</div>
              </div>
            </Link>
          </div>

          {/* Three-Column Operational Overview */}
          <div className="dashboard-grid">
            {/* 1. Expiring Memberships & Alerts */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="card-title">Renewal Alerts</h3>
                  <p className="card-subtitle">Expiring in 30 days or lapsed</p>
                </div>
                <Link to="/reports" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>
                  View All →
                </Link>
              </div>

              {(!data?.expiring_memberships || data.expiring_memberships.length === 0) ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div style={{ fontSize: '28px', opacity: 0.5 }}>🎉</div>
                  <div className="empty-state-title" style={{ fontSize: '14px' }}>All Memberships Active</div>
                  <div className="empty-state-text" style={{ fontSize: '12px' }}>No memberships expiring soon.</div>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Plan</th>
                        <th>Remaining</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.expiring_memberships.slice(0, 5).map((m) => {
                        const isExpired = m.days_remaining < 0;
                        const isUrgent = m.days_remaining <= 7 && !isExpired;
                        return (
                          <tr key={m.member_id}>
                            <td>
                              <div style={{ fontWeight: '600' }}>{m.member_name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.phone}</div>
                            </td>
                            <td>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.plan || 'Standard'}</span>
                            </td>
                            <td>
                              <span className={`badge ${isExpired ? 'badge-inactive' : isUrgent ? 'badge-expired' : 'badge-frozen'}`}>
                                {isExpired ? `Expired (${Math.abs(m.days_remaining)}d ago)` : `${m.days_remaining} days left`}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Link 
                                to={`/members?renew=${m.member_id}`}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                              >
                                Renew
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

            {/* 2. Recent Payments */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="card-title">Recent Transactions</h3>
                  <p className="card-subtitle">Latest fee collections</p>
                </div>
                <Link to="/payments" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>
                  View All →
                </Link>
              </div>

              {(!data?.recent_payments || data.recent_payments.length === 0) ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div style={{ fontSize: '28px', opacity: 0.5 }}>💳</div>
                  <div className="empty-state-title" style={{ fontSize: '14px' }}>No Transactions Yet</div>
                  <div className="empty-state-text" style={{ fontSize: '12px' }}>Record a fee payment to get started.</div>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Method</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_payments.slice(0, 5).map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: '600' }}>{p.member_name}</td>
                          <td>
                            <span className="badge badge-frozen" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                              {p.payment_method || 'Cash'}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {p.payment_date}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent)' }}>
                            +₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 3. Recent Attendance Activity */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="card-title">Live Floor Activity</h3>
                  <p className="card-subtitle">Recent gym entries</p>
                </div>
                <Link to="/attendance" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>
                  Open Log →
                </Link>
              </div>

              {(!data?.recent_attendance || data.recent_attendance.length === 0) ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div style={{ fontSize: '28px', opacity: 0.5 }}>🏃</div>
                  <div className="empty-state-title" style={{ fontSize: '14px' }}>No Check-Ins Logged</div>
                  <div className="empty-state-text" style={{ fontSize: '12px' }}>Mark member attendance for today.</div>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_attendance.slice(0, 5).map((a, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>{a.member_name}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {a.attendance_date}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="badge badge-active" style={{ fontSize: '10px' }}>
                              ✓ Checked In
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
