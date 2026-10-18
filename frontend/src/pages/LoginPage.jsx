import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import GymHqLogo from '../components/GymHqLogo';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [gymName, setGymName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Sign-In state & custom selector
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize official Google Identity Services if client ID is configured
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
    setGoogleLoading(true);
    try {
      await loginWithGoogle({ credential: response.credential });
      toast.success('Successfully signed in with Google!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleBtnClick = () => {
    if (googleClientId && window.google?.accounts?.id) {
      // Trigger official Google One-Tap prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setShowGoogleModal(true);
        }
      });
    } else {
      // Open interactive Google account selector
      setShowGoogleModal(true);
    }
  };

  const handleQuickGoogleSelect = async (account) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(account);
      toast.success(`Signed in as ${account.name || account.email}!`);
      setShowGoogleModal(false);
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCustomGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) {
      toast.warning('Please enter a valid Google email address.');
      return;
    }
    const cleanEmail = customGoogleEmail.trim().toLowerCase();
    const cleanName = customGoogleName.trim() || cleanEmail.split('@')[0];
    const sub = `google-${Date.now()}`;

    await handleQuickGoogleSelect({
      email: cleanEmail,
      name: cleanName,
      sub,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.warning('Please provide both username and password.');
      return;
    }

    if (isRegister && password.length < 6) {
      toast.warning('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(username.trim(), password, email.trim() || null);
        if (gymName.trim()) {
          localStorage.setItem('gymhq_gym_name', gymName.trim());
        }
        toast.success(`Welcome to GYMHQ! Your account has been created.`);
      } else {
        await login(username.trim(), password);
        toast.success(`Welcome back, ${username}!`);
      }
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <GymHqLogo size="xl" showTagline={false} />
          <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Commercial Gym & Fitness Club Operations Platform
          </p>
        </div>

        {/* 1. Google One-Click Login Button */}
        <div style={{ marginBottom: '16px' }}>
          <div id="googleSignInBtn" style={{ width: '100%' }}></div>

          <button
            type="button"
            className="btn-google"
            onClick={handleGoogleBtnClick}
            disabled={googleLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>or sign in with credentials</span>
        </div>

        {/* Auth Mode Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-tertiary)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          border: '1px solid var(--border-color)'
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
              fontWeight: !isRegister ? '600' : '400',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Owner Login
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
              fontWeight: isRegister ? '600' : '400',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            Register Gym
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Gym / Club Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. IronCore Fitness Club"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. admin or gym_owner"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                className="form-input"
                placeholder="owner@yourgym.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading || googleLoading}
            style={{ marginTop: '16px' }}
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Gym Account' : 'Sign In to Management'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--text-tertiary)'
        }}>
          <span>🔒 256-bit Encrypted</span>
          <span>•</span>
          <span>PostgreSQL Persistence</span>
        </div>
      </div>

      {/* Interactive Google Sign-In Modal */}
      <Modal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        title="Sign in with Google"
        maxWidth="460px"
      >
        <div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'inline-flex', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '50%', marginBottom: '8px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Choose an account
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              to continue to <strong style={{ color: 'var(--accent)' }}>GYMHQ Management</strong>
            </p>
          </div>

          {/* Quick Select Accounts */}
          <div style={{ marginBottom: '16px' }}>
            <div
              className="google-account-item"
              onClick={() => handleQuickGoogleSelect({
                email: 'vikram.gymowner@gmail.com',
                name: 'Vikram Malhotra',
                sub: 'google-vikram-99',
              })}
            >
              <div className="google-avatar" style={{ background: '#4285F4' }}>V</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Vikram Malhotra</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>vikram.gymowner@gmail.com</div>
              </div>
              <span className="badge badge-paid">Gym Owner</span>
            </div>

            <div
              className="google-account-item"
              onClick={() => handleQuickGoogleSelect({
                email: 'rahul.sharma.gym@gmail.com',
                name: 'Rahul Sharma',
                sub: 'google-rahul-88',
              })}
            >
              <div className="google-avatar" style={{ background: '#34A853' }}>R</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>Rahul Sharma</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>rahul.sharma.gym@gmail.com</div>
              </div>
              <span className="badge badge-paid">Gym Admin</span>
            </div>
          </div>

          {/* Custom Google Account Entry */}
          <form onSubmit={handleCustomGoogleSubmit} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Or use your own Google Account:
            </div>
            <div className="form-group">
              <input
                type="email"
                className="form-input"
                placeholder="your.email@gmail.com"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Your Full Name (e.g. Ashutosh Tripathi)"
                value={customGoogleName}
                onChange={(e) => setCustomGoogleName(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={googleLoading}
              style={{ marginTop: '8px' }}
            >
              {googleLoading ? 'Signing in...' : 'Sign In with This Google Account'}
            </button>
          </form>

          {/* Setup Hint */}
          <div style={{ marginTop: '16px', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)' }}>
            💡 <strong>Production Ready:</strong> Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>frontend/.env</code> to connect directly with your Google Cloud Console OAuth 2.0 app.
          </div>
        </div>
      </Modal>
    </div>
  );
}
