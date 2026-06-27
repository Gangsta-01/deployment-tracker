import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MOCK_USER } from '../data/mockData';
import './Login.css';

export default function Login() {
  const { login, loading, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const handleLogin = async () => {
  try {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    sessionStorage.setItem(
      "dp_user",
      JSON.stringify(response.data)
    );

    window.location.reload();

  } catch (err) {
    alert("Invalid email or password");
  }
};
    // // ── MOCK LOGIN (remove when backend is live) ──────────────
    // if (email === 'admin' && password === 'password') {
    //   sessionStorage.setItem('dp_user', JSON.stringify({ ...MOCK_USER, token: 'mock-token' }));
    //   window.location.reload();
    //   return;
    // }

    await login(email, password);
  };

  return (
    <div className="login-root">
      {/* Left panel — branding */}
      <div className="login-left">
        <div className="login-brand">
          <span className="login-brand-icon">⬡</span>
          <span className="login-brand-name">DeployPulse</span>
        </div>
        <div className="login-tagline">
          <h1>Ship with<br /><span className="login-tagline-accent">confidence.</span></h1>
          <p>Real-time visibility across every deployment,<br />environment, and service in your stack.</p>
        </div>
        <div className="login-stats-row">
          {[
            { label: 'Deployments tracked', value: '248' },
            { label: 'Uptime', value: '99.9%' },
            { label: 'Environments', value: '4' },
          ].map(s => (
            <div key={s.label} className="login-stat">
              <span className="login-stat-value">{s.value}</span>
              <span className="login-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="login-grid-bg" aria-hidden="true" />
      </div>

      {/* Right panel — form */}
      <div className="login-right">
        <div className="login-form-wrap">
          <div className="login-form-header">
            <h2>Sign in</h2>
            <p>Access your deployment dashboard</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="login-error" role="alert">
                <span>⚠</span> {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@company.io"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrap">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-signin"
              disabled={loading || !email || !password}
            >
              {loading ? <span className="btn-spinner" /> : 'Sign in'}
            </button>
          </form>

          <p className="login-hint">
            Demo: <code>admin@deploypulse.io</code> / <code>password</code>
          </p>
        </div>
      </div>
    </div>
  );
}
