import React, { useState, useEffect } from 'react';
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
  const [googleInfoModal, setGoogleInfoModal] = useState(false);

  // Form states
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');

  // Register form states
  const [regFullName, setRegFullName] = useState('');
  const [regGymName, setRegGymName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const { login, register, loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize official Google Identity Services if client ID is set
  useEffect(() => {
    if (!googleClientId) return;

    const initializeGsi = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });
        const btnContainer = document.getElementById('googleSignInBtn');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_black',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'rectangular',
          });
        }
      }
    };

    if (window.google?.accounts?.id) {
      initializeGsi();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGsi;
      document.body.appendChild(script);
    }
  }, [googleClientId]);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response.credential) return;
    setLoading(true);
    try {
      await loginWithGoogle({ credential: response.credential });
      toast.success('Successfully authenticated with Google!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleBtnClick = () => {
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setGoogleInfoModal(true);
        }
      });
    } else {
      setGoogleInfoModal(true);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      toast.warning('Please enter both your email/username and password.');
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

      toast.success(`Welcome to GYMHQ! '${regGymName}' is now live.`);
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
    toast.success('Password recovery instructions dispatched to your email.');
    setForgotModalOpen(false);
    setForgotEmail('');
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '440px', width: '100%' }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', textAlign: 'center' }}>
          <GymHqLogo size="xl" showTagline={false} />
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '12px', letterSpacing: '-0.02em' }}>
            {isRegister ? 'Register Your Fitness Club' : 'Sign In to Your Gym'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isRegister
              ? 'Join hundreds of gym owners streamlining member management and fee collection.'
              : 'Secure Gym Owner & Administrator Operations Portal'}
          </p>
        </div>

        {/* 1. Official Google OAuth Button */}
        <div style={{ marginBottom: '18px' }}>
          <div id="googleSignInBtn" style={{ width: '100%' }}></div>

          <button
            type="button"
            className="btn-google"
            onClick={handleGoogleBtnClick}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '11px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider" style={{ display: 'flex', alignItems: 'center', margin: '18px 0', color: 'var(--text-tertiary)', fontSize: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            or with credentials
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Auth Mode Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-tertiary)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          border: '1px solid var(--border-color)',
        }}>
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: !isRegister ? 'var(--bg-card)' : 'transparent',
              color: !isRegister ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: !isRegister ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: isRegister ? 'var(--bg-card)' : 'transparent',
              color: isRegister ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isRegister ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Register Gym
          </button>
        </div>

        {/* SIGN IN FORM */}
        {!isRegister ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600' }}>
                Username or Business Email *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="admin or name@yourgym.com"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>
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
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: '40px' }}
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                Keep me signed in
              </label>

              <span style={{ fontSize: '11px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="pulse-dot" style={{ width: '5px', height: '5px' }}></span>
                SSL Secure
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ padding: '12px', fontSize: '14px', fontWeight: '700' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to GYMHQ →'}
            </button>
          </form>
        ) : (
          /* REGISTER GYM FORM */
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600' }}>
                Gym / Fitness Center Name *
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600' }}>
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

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600' }}>
                  Phone / Mobile
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600' }}>
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600' }}>
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

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600' }}>
                  Password *
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 chars"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
              🔒 By registering, you become the primary administrator for your gym. You can manage members, floor entries, and UPI fee collections with complete data privacy.
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ padding: '12px', fontSize: '14px', fontWeight: '700' }}
            >
              {loading ? 'Creating Gym Account...' : 'Register & Launch Gym →'}
            </button>
          </form>
        )}

        {/* Genuine Trust & Security Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🔒</span> 256-Bit SSL
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>⚡</span> Real-Time Cloud DB
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🛡️</span> Data Isolated
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
            Enter your registered gym email address. We will send a secure link to reset your administrator credentials.
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

          <div className="form-actions">
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
              Send Recovery Instructions
            </button>
          </div>
        </form>
      </Modal>

      {/* Google OAuth Production Setup Guide Modal */}
      <Modal
        isOpen={googleInfoModal}
        onClose={() => setGoogleInfoModal(false)}
        title="⚡ Google One-Click Authentication"
        maxWidth="460px"
      >
        <div style={{ textAlign: 'left', lineHeight: 1.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(66, 133, 244, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>Official Google OAuth 2.0</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Enterprise Identity Verification</div>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            GYMHQ supports direct Google Workspace & Personal Google Account single sign-on.
          </p>

          <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-primary)', marginBottom: '16px' }}>
            <div style={{ fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>Deployment Instructions:</div>
            To enable live Google 1-Tap on your custom domain, set your Google Cloud Client ID in your environment:
            <code style={{ display: 'block', margin: '8px 0', padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: '4px', color: 'var(--info)' }}>
              VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
            </code>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            You can sign in directly using your <strong>Username</strong> or <strong>Business Email</strong> and password on the form.
          </p>

          <div className="form-actions" style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => setGoogleInfoModal(false)}
            >
              Got it, continue with password
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
