import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GymHqLogo from '../components/GymHqLogo';

export default function GuidePage() {
  const [activeCategory, setActiveCategory] = useState('all');

  // Interactive Checklist stored in localStorage
  const defaultChecklist = {
    gymProfile: false,
    enrollMembers: false,
    practiceCheckin: false,
    recordPayment: false,
    viewGraph: false,
    exportCsv: false,
  };

  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('gymhq_guide_checklist');
      return saved ? JSON.parse(saved) : defaultChecklist;
    } catch {
      return defaultChecklist;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gymhq_guide_checklist', JSON.stringify(checklist));
    } catch {
      // Ignored
    }
  }, [checklist]);

  const toggleChecklistItem = (key) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const checklistItems = [
    {
      key: 'gymProfile',
      title: 'Configure Your Gym Identity',
      desc: 'Set your Gym Name, address, and official UPI ID for member fee receipts.',
      link: '/',
      linkText: 'Top Header ⚡',
    },
    {
      key: 'enrollMembers',
      title: 'Enroll Initial 3-5 Athletes',
      desc: 'Register gym members with phone numbers, duration plans, and emergency contacts.',
      link: '/members',
      linkText: '+ Add Member',
    },
    {
      key: 'practiceCheckin',
      title: 'Conduct Reception Fast Check-In',
      desc: 'Test 1-click attendance check-in from desktop, tablet, or smartphone.',
      link: '/attendance',
      linkText: 'Check-In Station',
    },
    {
      key: 'recordPayment',
      title: 'Record First Fee Receipt',
      desc: 'Log cash or UPI fee collection for current month with zero desk leakage.',
      link: '/payments',
      linkText: 'Record Payment',
    },
    {
      key: 'viewGraph',
      title: 'Inspect Monthly Gym Graph',
      desc: 'View 6-month historical collections, athlete enrollment, and check-in trends.',
      link: '/',
      linkText: 'Gym Overview',
    },
    {
      key: 'exportCsv',
      title: 'Download Monthly Dues Audit CSV',
      desc: 'Generate clean accountant-ready spreadsheets for monthly reconciliation.',
      link: '/reports',
      linkText: 'Reports & Export',
    },
  ];

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

  const categories = [
    { id: 'all', label: '🌟 All Playbook Modules' },
    { id: 'setup', label: '🚀 Gym Profile & Branding' },
    { id: 'members', label: '👥 Athletes & Plans' },
    { id: 'rush', label: '⚡ Rush Hour Check-In' },
    { id: 'payments', label: '💳 Fee Collections & UPI' },
    { id: 'reports', label: '📊 Dues & Analytics' },
  ];

  const modules = [
    {
      id: 'profile-setup',
      category: 'setup',
      icon: '🏢',
      number: '01',
      title: 'Branding & Gym Profile Customization',
      badge: 'Personalization',
      summary: 'Ensure your gym name, location, and UPI ID are prominently displayed across receipts, headers, and invoices.',
      steps: [
        'Click the gym badge at the top navigation bar (or settings gear) on any page.',
        'Enter your official Gym Name, street address, and reception phone number.',
        'Enter your UPI ID (e.g. gymname@okhdfcbank) to enable instant QR fee collections.',
        'Saving immediately updates the top bar, mobile header, sidebar, and browser tab.',
      ],
      tip: 'Your gym name builds authority. Every receipt and WhatsApp dues reminder will carry your personalized brand name.',
      actionLink: '/',
      actionText: 'Update Gym Profile at Top Bar ✏️',
    },
    {
      id: 'athlete-enrollment',
      category: 'members',
      icon: '👥',
      number: '02',
      title: 'Enrolling Athletes & Duration Plans',
      badge: 'Core Operations',
      summary: 'Onboard athletes with accurate contact information, personalized pricing, and auto-computed expiry dates.',
      steps: [
        'Navigate to Athletes & Members and click "+ Add Member".',
        'Enter full name, 10-digit phone number (used as unique athlete ID), and emergency contact.',
        'Select a duration plan: Monthly (30d), Quarterly (90d), Half-Yearly (180d), or Annual (365d).',
        'The system automatically calculates start and expiry dates with zero calendar errors.',
        'Customize individual monthly fee if applying promotional, student, or VIP discounts.',
      ],
      tip: 'Phone numbers are indexed for instant search. Front-desk staff can find any athlete in under 2 seconds.',
      actionLink: '/members',
      actionText: 'Open Athletes & Members →',
    },
    {
      id: 'floor-checkin',
      category: 'rush',
      icon: '⚡',
      number: '03',
      title: 'Front-Desk Fast Check-In Station',
      badge: 'Floor Security',
      summary: 'Keep track of active training volume, prevent unpaid floor entry, and enforce single daily check-ins.',
      steps: [
        'Keep Floor Attendance open on your reception tablet or reception computer.',
        'During morning & evening rush, use the "Fast Check-In" shortcut in the top navigation from anywhere.',
        'Select the athlete by name or phone and tap "Confirm Check-In".',
        'System enforces single daily check-in to prevent accidental duplicate entries.',
        'Today\'s live training volume counter automatically increments on the top bar and dashboard.',
      ],
      tip: 'Lapsed or expired members display warning badges upon check-in, allowing front desk to collect renewal fees immediately.',
      actionLink: '/attendance',
      actionText: 'Launch Check-In Station →',
    },
    {
      id: 'fee-receipts',
      category: 'payments',
      icon: '💳',
      number: '04',
      title: 'Fee Collection in Indian Rupees (₹)',
      badge: 'Zero-Loss Accounting',
      summary: 'Accept and reconcile member payments via UPI QR, Cash, Credit/Debit Cards, or Net Banking with zero register leakage.',
      steps: [
        'Whenever an athlete pays at the desk, navigate to Payments → "Record Payment".',
        'Select athlete, enter amount paid in ₹, and choose payment mode (UPI, Cash, Card, Bank Transfer).',
        'Payment Date logs when money physically transferred; Fee Month sets the billing cycle.',
        'Supports partial installments: if a ₹2,000 monthly fee is paid ₹1,000 now, remaining ₹1,000 dues reflect instantly.',
      ],
      tip: 'Strict daily desk rule: Log every cash payment immediately before handing over keys or locker tokens.',
      actionLink: '/payments',
      actionText: 'Record a Payment Receipt →',
    },
    {
      id: 'dues-recovery',
      category: 'reports',
      icon: '📱',
      number: '05',
      title: '1-Click WhatsApp Dues Recovery & Expiries',
      badge: 'Cash Flow Recovery',
      summary: 'Eliminate awkward phone calls with polite, pre-formatted WhatsApp and SMS payment reminder notices.',
      steps: [
        'Open Reports & Dues at the beginning of each week to review outstanding member balances.',
        'Click "Copy Reminder" next to any member with pending fee dues.',
        'The system copies a polite, professional message containing your gym name, athlete name, and exact balance.',
        'Paste directly into WhatsApp Web or SMS for friction-free digital dues recovery.',
      ],
      tip: 'Sending gentle reminders 3 days before month-end recovers over 90% of gym membership dues on time.',
      actionLink: '/reports',
      actionText: 'Review Pending Dues & Reminders →',
    },
    {
      id: 'monthly-graph',
      category: 'reports',
      icon: '📈',
      number: '06',
      title: 'Monthly Gym Performance Trends Graph',
      badge: 'Strategic Growth',
      summary: 'Interactive 6-month historical graph displaying collections, new member admissions, and check-in density.',
      steps: [
        'View the "Monthly Gym Performance Trends" graph card directly on the Gym Overview Dashboard.',
        'Use the top metric pills to toggle between Collections (₹), Enrollments, and Check-In visits.',
        'Hover over any month column to see exact revenue figures and athlete growth counts.',
        'Click any month column to instantly filter the entire dashboard to that month\'s transaction logs.',
      ],
      tip: 'Use the 6-Month Average Revenue KPI to plan equipment upgrades, trainer payroll, and seasonal membership drives.',
      actionLink: '/',
      actionText: 'View Dashboard Trends Graph →',
    },
    {
      id: 'non-destructive-renewals',
      category: 'members',
      icon: '🔄',
      number: '07',
      title: 'Non-Destructive Membership Renewals',
      badge: 'Data Integrity',
      summary: 'Extend athlete memberships forward without erasing their payment history or past attendance records.',
      steps: [
        'When an athlete lapses, click "Renew" from Renewal Alerts on the Dashboard or on the Members page.',
        'Select the renewal duration plan (e.g. 1 Month, 3 Months, Annual).',
        'System extends their membership end date forward and restores active status.',
        'All past payments, historical attendance records, and join date are safely preserved.',
      ],
      tip: 'Never delete an expired athlete! Inactive athletes can be reactivated anytime with full continuity.',
      actionLink: '/members',
      actionText: 'Manage Members & Renewals →',
    },
  ];

  const filteredModules = activeCategory === 'all'
    ? modules
    : modules.filter((m) => m.category === activeCategory);

  return (
    <div className="page-container">
      {/* Hero Banner */}
      <div className="guide-hero">
        <div style={{ maxWidth: '820px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <GymHqLogo size="lg" />
            <span
              className="status-indicator"
              style={{
                background: 'var(--accent-light)',
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
                fontWeight: '700',
              }}
            >
              👑 Official Gym Owner Playbook
            </span>
          </div>

          <h1
            style={{
              fontSize: '32px',
              fontWeight: '900',
              letterSpacing: '-0.03em',
              color: '#ffffff',
              marginBottom: '12px',
              lineHeight: 1.2,
            }}
          >
            Master Operations & Growth Playbook
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, maxWidth: '720px' }}>
            Welcome to GYMHQ. This playbook gives gym owners and administrators the exact operational blueprints,
            front-desk rush strategies, zero-loss UPI accounting workflows, and automated dues recovery systems needed
            to run a thriving, profitable fitness club.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '22px', flexWrap: 'wrap' }}>
            <Link to="/members" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>+</span> Enroll New Athlete
            </Link>
            <Link to="/attendance" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚡</span> Fast Check-In Desk
            </Link>
            <Link to="/payments" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>₹</span> Record Fee Receipt
            </Link>
            <Link to="/reports" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📊</span> Outstanding Dues & CSV
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Gym Launch & Readiness Checklist */}
      <div className="checklist-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>📋</span>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Gym Launch & Operational Readiness Checklist
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Track your daily onboarding progress. Click each item to mark it complete.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              className={`badge ${progressPercent === 100 ? 'badge-paid' : 'badge-active'}`}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              {completedCount} of {checklistItems.length} Done ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="checklist-progress-wrap">
          <div className="checklist-progress-bar" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Checklist Grid */}
        <div className="checklist-grid">
          {checklistItems.map((item) => {
            const isDone = !!checklist[item.key];
            return (
              <div
                key={item.key}
                className={`checklist-item ${isDone ? 'completed' : ''}`}
                onClick={() => toggleChecklistItem(item.key)}
              >
                <div className="checklist-checkbox">
                  {isDone ? '✓' : ''}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: isDone ? 'var(--accent)' : 'var(--text-primary)',
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}
                  >
                    {item.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                    {item.desc}
                  </div>
                  <Link
                    to={item.link}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'var(--accent)',
                      textDecoration: 'none',
                    }}
                  >
                    {item.linkText} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {progressPercent === 100 && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'rgba(0, 230, 118, 0.1)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#00e676',
              fontSize: '13px',
              fontWeight: '700',
            }}
          >
            <span>🏆</span>
            <span>Outstanding! Your gym operations setup is 100% complete and fully primed for commercial scale.</span>
          </div>
        )}
      </div>

      {/* Category Filter Navigation Pills */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Operating Modules & Workflows
        </h2>
        <div className="guide-category-pills">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`guide-category-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Module Blueprint Grid */}
      <div className="guide-grid">
        {filteredModules.map((mod) => (
          <div key={mod.id} className="guide-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div className="guide-card-icon" style={{ fontSize: '22px' }}>
                {mod.icon}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="badge badge-paid" style={{ fontSize: '10px' }}>
                  {mod.badge}
                </span>
                <span className="badge badge-frozen" style={{ fontSize: '10px' }}>
                  Step {mod.number}
                </span>
              </div>
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {mod.title}
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
              {mod.summary}
            </p>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginBottom: '10px' }}>
              {mod.steps.map((step, idx) => (
                <div key={idx} className="guide-step-item">
                  <span className="guide-step-num">{idx + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <div className="guide-tip-box">
              <strong>Pro Tip:</strong> {mod.tip}
            </div>

            <Link to={mod.actionLink} className="guide-card-action">
              <span>{mod.actionText}</span>
            </Link>
          </div>
        ))}
      </div>

      {/* Indian Gym Business Pro Strategies Grid */}
      <div style={{ marginTop: '36px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '22px' }}>💡</span>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            Pro Gym Owner Strategic Playbook
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Strategy 1 */}
          <div className="guide-pro-strategy-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent)' }}>
                Managing Rush Hour Floor Congestion
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Peak Indian gym hours occur from <strong>6:00 AM – 9:00 AM</strong> and <strong>6:00 PM – 9:30 PM</strong>.
              Keep a dedicated tablet at the desk with the <strong>Fast Check-In</strong> modal open. Never allow members
              to bypass the desk unregistered—this ensures accurate liability records and prevents unauthorized guests.
            </p>
          </div>

          {/* Strategy 2 */}
          <div className="guide-pro-strategy-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>💳</span>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--info)' }}>
                Zero-Leakage UPI & Cash Reconciliation
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Display your official gym UPI QR code standee on the front counter linked to the UPI ID configured in your
              GYMHQ Gym Profile. Log cash payments instantaneously into <strong>Payments → Record Payment</strong>.
              Reconcile your physical cash drawer with GYMHQ daily collection totals at closing time.
            </p>
          </div>

          {/* Strategy 3 */}
          <div className="guide-pro-strategy-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>🎯</span>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--warning)' }}>
                Locking in Annual & Quarterly Commitments
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Monthly members churn at 20-30% higher rates than quarterly or annual subscribers. Offer a 15% discount
              for 3-month or 1-year plans. When renewal dates approach (flagged automatically on the GYMHQ Dashboard 30
              days in advance), offer existing members priority renewal pricing before expiration.
            </p>
          </div>
        </div>
      </div>

      {/* Operational Cadence Quick Reference Table */}
      <div className="card" style={{ padding: '24px', background: 'var(--bg-secondary)', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
          Daily, Weekly & Monthly Operational Cadence
        </h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Frequency</th>
                <th>Responsible Role</th>
                <th>Primary Business Goal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Fast Floor Check-In</strong></td>
                <td><span className="badge badge-paid">Every Visit</span></td>
                <td>Reception / Admin Desk</td>
                <td>Floor safety, attendance records & member accountability</td>
              </tr>
              <tr>
                <td><strong>Payment Receipt Entry</strong></td>
                <td><span className="badge badge-paid">Immediately</span></td>
                <td>Admin Desk</td>
                <td>Zero cash leakage & accurate balance bookkeeping</td>
              </tr>
              <tr>
                <td><strong>WhatsApp Dues Reminders</strong></td>
                <td><span className="badge badge-active">Weekly (Mondays)</span></td>
                <td>Gym Owner</td>
                <td>Friction-free, on-time fee recovery without awkward calls</td>
              </tr>
              <tr>
                <td><strong>Renewal Expiry Outreach</strong></td>
                <td><span className="badge badge-active">Every 2-3 Days</span></td>
                <td>Gym Owner / Admin</td>
                <td>Preventing membership lapse and retaining active athletes</td>
              </tr>
              <tr>
                <td><strong>Monthly Performance Review</strong></td>
                <td><span className="badge badge-frozen">Monthly (1st)</span></td>
                <td>Gym Owner</td>
                <td>Tracking 6-month growth graphs & CSV tax/accountant export</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
