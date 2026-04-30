import { useState } from 'react';
import { register, login } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function AuthForm() {
  const { login: authLogin } = useAuth();
  const [mode,     setMode]     = useState('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  function switchMode(next) {
    setMode(next);
    setError(null);
    setConfirm('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (mode === 'register' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = mode === 'login'
        ? await login(email, password)
        : await register(email, password);
      authLogin(data.token, data.refreshToken, data.email);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark" />
          <div className="brand-name">Brew <em>Tracker</em></div>
          <div className="brand-tag">Est. 2026 · OKC</div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >Sign in</button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >Create account</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label className="field-label">Email</label>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'username' : 'email'}
            />
          </div>
          <div className="field-group">
            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
            />
          </div>
          {mode === 'register' && (
            <div className="field-group">
              <label className="field-label">Confirm password</label>
              <input
                className="field-input"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading
              ? (mode === 'login' ? 'Signing in…'        : 'Creating account…')
              : (mode === 'login' ? 'Sign in →'          : 'Create account →')}
          </button>
        </form>

        {mode === 'register' && (
          <p className="auth-hint">Password must be at least 8 characters and include a number.</p>
        )}
      </div>
    </div>
  );
}
