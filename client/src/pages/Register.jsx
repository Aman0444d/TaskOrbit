import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Orbit, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { registerUser } from '../services/authService';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { error: toastError } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
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
    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = 'Name must be at least 2 characters.';
    }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!form.password || form.password.length < 6) {
      next.password = 'Password must be at least 6 characters.';
    }
    if (form.confirm !== form.password) {
      next.confirm = 'Passwords do not match.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    setServerError('');
    try {
      const res = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      login(res.data);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
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
        <h1>Create your account</h1>
        <p className="muted">One workspace for all your projects and tasks.</p>

        <form onSubmit={handleSubmit} noValidate style={{ marginTop: 20 }}>
          {serverError && <div className="form-error" role="alert">{serverError}</div>}
          <div className="field">
            <label htmlFor="reg-name">Name <span className="req">*</span></label>
            <input id="reg-name" autoComplete="name" value={form.name} onChange={set('name')} placeholder="Your name" maxLength={100} />
            {errors.name && <span className="err">{errors.name}</span>}
          </div>
          <div className="field">
            <label htmlFor="reg-email">Email <span className="req">*</span></label>
            <input id="reg-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            {errors.email && <span className="err">{errors.email}</span>}
          </div>
          <div className="field">
            <label htmlFor="reg-password">Password <span className="req">*</span></label>
            <div className="password-wrap">
              <input id="reg-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
              <button type="button" className="icon-btn password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <span className="err">{errors.password}</span>}
          </div>
          <div className="field">
            <label htmlFor="reg-confirm">Confirm password <span className="req">*</span></label>
            <input id="reg-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat your password" />
            {errors.confirm && <span className="err">{errors.confirm}</span>}
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
      <aside className="auth-side">
        <blockquote>
          “Start with one project, break it into tasks, and watch the orbit come together.”
        </blockquote>
        <ul>
          <li>Free for personal use</li>
          <li>Your data stays private</li>
          <li>Works on any device</li>
        </ul>
      </aside>
    </div>
  );
};

export default Register;
