import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Month collection summary
  const [summaryMonth, setSummaryMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthTotal, setMonthTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [feeMonthFilter, setFeeMonthFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Record Payment Modal
  const [showModal, setShowModal] = useState(false);
  const [membersList, setMembersList] = useState([]);
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    payment_method: 'upi',
    payment_date: new Date().toISOString().split('T')[0],
    fee_month: () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    },
  });
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await api.getPayments({
        search: search.trim() || undefined,
        payment_method: methodFilter || undefined,
        fee_month: feeMonthFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
      });
      setPayments(res.payments || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error('Failed to load transactions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCollectionSummary = async (month) => {
    try {
      const res = await api.getCollection(month);
      setMonthTotal(res.total_collected || 0);
    } catch {
      // Ignored
    }
  };

  const loadMembersForSelect = async () => {
    try {
      const res = await api.getMembers({ page_size: 100 });
      setMembersList(res.members || res.items || []);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadMembersForSelect();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [page, methodFilter, feeMonthFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadCollectionSummary(summaryMonth);
  }, [summaryMonth]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadPayments();
  };

  const handleOpenRecord = () => {
    const today = new Date().toISOString().split('T')[0];
    const curMonth = today.slice(0, 7);
    setFormData({
      member_id: membersList.length > 0 ? String(membersList[0].id) : '',
      amount: membersList.length > 0 && membersList[0].monthly_fee ? String(membersList[0].monthly_fee) : '1500.00',
      payment_method: 'upi',
      payment_date: today,
      fee_month: curMonth,
    });
    setShowModal(true);
  };

  const handleMemberChange = (memberIdStr) => {
    const m = membersList.find((item) => item.id === parseInt(memberIdStr));
    setFormData((prev) => ({
      ...prev,
      member_id: memberIdStr,
      amount: m && m.monthly_fee ? String(m.monthly_fee) : prev.amount || '1500.00',
    }));
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!formData.member_id || !formData.amount) {
      toast.warning('Please select a member and enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createPayment({
        member_id: parseInt(formData.member_id),
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
        fee_month: formData.fee_month || null,
      });
      toast.success('Payment recorded successfully!');
      setShowModal(false);
      loadPayments();
      loadCollectionSummary(summaryMonth);
    } catch (err) {
      toast.error(err.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Financials & Payments
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Record dues, review collections, and track transaction ledgers.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleOpenRecord}>
            + Record Fee Payment
          </button>
        </div>
      </div>

      {/* Monthly Collection Summary Card */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, var(--bg-card), var(--bg-tertiary))' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
              Cashflow Metric (By Received Date)
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent)', marginTop: '4px' }}>
              ₹{Number(monthTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Actual receipts collected during calendar month {summaryMonth}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Summary Month:</label>
            <input
              type="month"
              className="form-input"
              value={summaryMonth}
              onChange={(e) => setSummaryMonth(e.target.value)}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            />
          </div>
        </div>
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
              onClick={() => { setSearch(''); setPage(1); loadPayments(); }}
            >
              Clear
            </button>
          )}
        </form>

        <div className="filter-group">
          <label>Method:</label>
          <select
            className="form-select"
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Methods</option>
            <option value="upi">UPI / QR</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Fee Month:</label>
          <input
            type="month"
            className="form-input"
            value={feeMonthFilter}
            onChange={(e) => { setFeeMonthFilter(e.target.value); setPage(1); }}
            style={{ width: 'auto' }}
          />
        </div>

        {(feeMonthFilter || methodFilter) && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => { setFeeMonthFilter(''); setMethodFilter(''); setPage(1); }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Payments Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '32px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton skeleton-row" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-title">No Transactions Recorded</div>
            <div className="empty-state-text">
              {search || methodFilter || feeMonthFilter
                ? 'No transactions match your search filters.'
                : 'Click "Record Fee Payment" to register a payment receipt.'}
            </div>
            <button className="btn btn-primary" onClick={handleOpenRecord}>
              Record First Payment
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Fee Month</th>
                  <th>Payment Date</th>
                  <th style={{ textAlign: 'right' }}>Receipt Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {p.member_name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {p.member_phone}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--accent)' }}>
                        ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-method-${p.payment_method || 'cash'}`} style={{ textTransform: 'uppercase', fontSize: '11px' }}>
                        {p.payment_method === 'upi' ? '⚡ UPI / QR' : p.payment_method === 'card' ? '💳 Card' : p.payment_method === 'bank_transfer' ? '🏦 Wire' : '💵 Cash'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '500', fontSize: '13px' }}>
                        {p.fee_month || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {p.payment_date}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-paid">
                        ✓ Settled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 25 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {page} of {Math.ceil(total / 25)} ({total} total receipts)
            </span>
            <button
              className="pagination-btn"
              disabled={page >= Math.ceil(total / 25)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Membership Fee Payment">
        <form onSubmit={handleSubmitPayment}>
          <div className="form-group">
            <label className="form-label">Select Athlete / Member *</label>
            <select
              className="form-select"
              value={formData.member_id}
              onChange={(e) => handleMemberChange(e.target.value)}
              required
            >
              <option value="">-- Choose member --</option>
              {membersList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.phone}) {m.monthly_fee ? `• ₹${Number(m.monthly_fee).toLocaleString('en-IN')}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="1500.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="upi">UPI / Instant QR</option>
                <option value="card">Credit / Debit Card</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Wire / Transfer</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fee Month (Applies To)</label>
              <input
                type="month"
                className="form-input"
                value={formData.fee_month}
                onChange={(e) => setFormData({ ...formData, fee_month: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Date (Received On)</label>
              <input
                type="date"
                className="form-input"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Recording...' : 'Confirm Receipt'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
