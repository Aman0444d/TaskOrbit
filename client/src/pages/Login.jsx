import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Orbit, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { loginUser } from '../services/authService';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { error: toastError } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!form.password) next.password = 'Password is required.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    setServerError('');
    try {
      const res = await loginUser({ email: form.email.trim(), password: form.password });
      login(res.data);
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setServerError(msg);
      toastError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true"><Orbit size={22} /></span>
          <span className="brand-name">TaskOrbit</span>
        </div>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to your workspace to pick up where you left off.</p>

        <form onSubmit={handleSubmit} noValidate style={{ marginTop: 20 }}>
          {serverError && <div className="form-error" role="alert">{serverError}</div>}
          <div className="field">
            <label htmlFor="login-email">Email <span className="req">*</span></label>
            <input id="login-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            {errors.email && <span className="err">{errors.email}</span>}
          </div>
          <div className="field">
            <label htmlFor="login-password">Password <span className="req">*</span></label>
            <div className="password-wrap">
              <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={set('password')} placeholder="Your password" />
              <button type="button" className="icon-btn password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <span className="err">{errors.password}</span>}
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          New to TaskOrbit? <Link to="/register">Create an account</Link>
        </p>
      </div>
      <aside className="auth-side">
        <blockquote>
          “A calm orbit for every project — tasks, deadlines, and progress in one warm workspace.”
        </blockquote>
        <ul>
          <li>Organize work by project</li>
          <li>Track status and priority</li>
          <li>Never miss a deadline</li>
        </ul>
      </aside>
    </div>
  );
};

export default Login;
