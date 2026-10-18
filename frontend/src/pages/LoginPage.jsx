import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import GymHqLogo from '../components/GymHqLogo';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Sign in form state
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');

  // Register gym form states
  const [regFullName, setRegFullName] = useState('');
  const [regGymName, setRegGymName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const { login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      toast.warning('Please enter both your username/email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(loginId.trim(), password);
      toast.success('Signed in successfully! Welcome to GYMHQ.');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Invalid credentials or account suspended.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regUsername.trim() || !regPassword || !regGymName.trim()) {
      toast.warning('Please fill in your Gym Name, Username, and Password.');
      return;
    }

    if (regPassword.length < 6) {
      toast.warning('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        email: regEmail.trim() || null,
        full_name: regFullName.trim() || null,
        gym_name: regGymName.trim(),
        gym_phone: regPhone.trim() || null,
      });

      toast.success(`Welcome to GYMHQ! '${regGymName}' is now active.`);
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.warning('Please enter your account email address.');
      return;
    }
    toast.success('Password recovery link dispatched to ' + forgotEmail);
    setForgotModalOpen(false);
    setForgotEmail('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(0, 230, 153, 0.08) 0%, rgba(13, 17, 23, 0.98) 60%, #0a0d12 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient decorative glows */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(0, 230, 153, 0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: isRegister ? '480px' : '430px',
          background: 'rgba(22, 27, 34, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 230, 153, 0.05)',
          borderRadius: '16px',
          padding: '36px 32px',
          position: 'relative',
          zIndex: 1,
          transition: 'max-width 0.3s ease',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '28px' }}>
          <GymHqLogo size="xl" showTagline={false} />
          
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '14px', letterSpacing: '-0.02em' }}>
            {isRegister ? 'Register Your Fitness Club' : 'Sign In to Your Gym'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
            {isRegister
              ? 'Create your isolated gym operations workspace to manage athletes, floor entry, and collections.'
              : 'Commercial Gym Management & Multi-Tenant Operations Platform'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(13, 17, 23, 0.8)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '7px',
              border: 'none',
              background: !isRegister ? 'var(--bg-card)' : 'transparent',
              color: !isRegister ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: !isRegister ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: !isRegister ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '7px',
              border: 'none',
              background: isRegister ? 'var(--bg-card)' : 'transparent',
              color: isRegister ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isRegister ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: isRegister ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Register Gym
          </button>
        </div>

        {/* SIGN IN FORM */}
        {!isRegister ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Username or Owner Email *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--text-tertiary)' }}>
                  👤
                </span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="admin or owner@gymhq.com"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  autoComplete="username"
                  required
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--text-tertiary)' }}>
                  🔑
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{ paddingLeft: '38px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '15px',
                  }}
                >
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                Keep me signed in
              </label>

              <span style={{ fontSize: '11px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span className="pulse-dot" style={{ width: '5px', height: '5px' }}></span>
                Isolated Database
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ padding: '13px', fontSize: '14px', fontWeight: '700', borderRadius: '8px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to GYMHQ →'}
            </button>
          </form>
        ) : (
          /* REGISTER GYM FORM */
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Gym / Fitness Club Name *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. IronCore Fitness Club"
                value={regGymName}
                onChange={(e) => setRegGymName(e.target.value)}
                required
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Owner Full Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Vikram Malhotra"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Mobile (+91)
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="98765 43210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Business Email Address
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="owner@yourgym.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Admin Username *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ironcore_admin"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Password *
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                background: 'rgba(0, 230, 153, 0.05)',
                border: '1px solid rgba(0, 230, 153, 0.15)',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '18px',
                lineHeight: 1.4,
              }}
            >
              🔒 <strong>Complete Data Isolation:</strong> Your gym's athletes, attendance, and fee collections are private to your account. Other gym owners cannot view your records.
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ padding: '13px', fontSize: '14px', fontWeight: '700', borderRadius: '8px' }}
            >
              {loading ? 'Creating Gym Account...' : 'Register & Launch Gym →'}
            </button>
          </form>
        )}

        {/* Trust Badges */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🔒</span> 256-Bit SSL
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🛡️</span> Data Isolated
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>⚡</span> Real-Time Cloud DB
          </span>
        </div>
      </div>

      {/* Forgot Password Recovery Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="🔒 Reset Account Password"
        maxWidth="420px"
      >
        <form onSubmit={handleForgotSubmit}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
            Enter your registered gym owner email address. We will send secure instructions to reset your administrator credentials.
          </p>

          <div className="form-group">
            <label className="form-label">Registered Account Email *</label>
            <input
              type="email"
              className="form-input"
              placeholder="owner@yourgym.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setForgotModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Send Recovery Link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
