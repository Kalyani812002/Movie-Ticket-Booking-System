import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const {
    isAuthenticated,
    initializing,
    loading,
    sessionError,
    restoreSession,
    user,
    login,
    register
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedDestination = location.state?.from?.pathname;
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const safeDestination = (path) =>
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\") &&
    !/%5c/i.test(path) &&
    path !== "/login" &&
    path !== "/register";
  const existingDestination = user?.role === "admin"
    ? "/admin"
    : safeDestination(requestedDestination) ? requestedDestination : "/";

  if (initializing) {
    return <div className="auth-loading page-width" role="status">Checking your session…</div>;
  }
  if (isAuthenticated) return <Navigate to={existingDestination} replace />;

  function validateForm() {
    const errors = {};
    const email = form.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      errors.email = "Enter a valid email address.";
    }
    if (isRegister && form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    } else if (isRegister && form.name.trim().length > 80) {
      errors.name = "Name must be no more than 80 characters.";
    }
    if (isRegister && form.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    } else if (new TextEncoder().encode(form.password).length > 72) {
      errors.password = "Password must be no more than 72 UTF-8 bytes.";
    } else if (!isRegister && !form.password) {
      errors.password = "Enter your password.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!validateForm()) return;
    try {
      let authenticatedUser;
      if (isRegister) {
        authenticatedUser = await register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password
        });
      } else {
        authenticatedUser = await login({
          email: form.email.trim(),
          password: form.password
        });
      }
      const destination = authenticatedUser.role === "admin"
        ? "/admin"
        : safeDestination(requestedDestination) ? requestedDestination : "/";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="auth-page page-width">
      <div className="auth-card">
        <span className="eyebrow"><span className="eyebrow-line" /> Movie Ticket Booking System</span>
        <h1>{isRegister ? <>Your next<br /><em>great night.</em></> : <>Good to<br /><em>see you.</em></>}</h1>
        <p className="auth-subtitle">{isRegister ? "Create an account to reserve your favorite seats." : "Sign in to book seats and see your tickets."}</p>
        {sessionError && (
          <div className="session-notice" role="status">
            <p>We couldn’t check for an existing sign-in. You can still try to continue.</p>
            <button type="button" onClick={restoreSession}>Check again</button>
          </div>
        )}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <>
              <label htmlFor="auth-name">Your name</label>
              <input
                id="auth-name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
                value={form.name}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "auth-name-error" : undefined}
                disabled={loading}
                onChange={(event) => {
                  setForm({ ...form, name: event.target.value });
                  setFieldErrors((current) => ({ ...current, name: "" }));
                  setError("");
                }}
              />
              {fieldErrors.name && <p className="field-error" id="auth-name-error">{fieldErrors.name}</p>}
            </>
          )}
          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={form.email}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "auth-email-error" : undefined}
            disabled={loading}
            onChange={(event) => {
              setForm({ ...form, email: event.target.value });
              setFieldErrors((current) => ({ ...current, email: "" }));
              setError("");
            }}
          />
          {fieldErrors.email && <p className="field-error" id="auth-email-error">{fieldErrors.email}</p>}
          <label htmlFor="auth-password">Password</label>
          <div className="password-input-wrap">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={isRegister ? 8 : undefined}
              value={form.password}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "auth-password-error" : isRegister ? "auth-password-hint" : undefined}
              disabled={loading}
              onChange={(event) => {
                setForm({ ...form, password: event.target.value });
                setFieldErrors((current) => ({ ...current, password: "" }));
                setError("");
              }}
            />
            <button
              className="password-visibility"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              disabled={loading}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {fieldErrors.password && <p className="field-error" id="auth-password-error">{fieldErrors.password}</p>}
          {isRegister && !fieldErrors.password && <p className="auth-hint" id="auth-password-hint">Use at least 8 characters. Your account will have the standard user role.</p>}
          {error && <p className="form-error auth-api-error" role="alert">{error}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? <><span className="auth-spinner" aria-hidden="true" /> {isRegister ? "Creating your account…" : "Signing you in…"}</> : isRegister ? "Create account" : "Sign in"}
            {!loading && <span aria-hidden="true">↗</span>}
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "New to Movie Ticket Booking System?"}{" "}
          <Link to={isRegister ? "/login" : "/register"} state={location.state}>
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
      <div className="auth-side-note" aria-hidden="true">
        <span className="auth-side-mark">M</span>
        <p>Every great night<br />starts with a story.</p>
        <span className="auth-side-caption">YOUR SEAT IS WAITING</span>
      </div>
    </section>
  );
}
