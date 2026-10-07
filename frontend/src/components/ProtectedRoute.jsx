import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user, initializing, sessionError, restoreSession } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <div className="auth-loading page-width" role="status">Checking your session…</div>;
  }
  if (sessionError) {
    return (
      <div className="auth-loading page-width session-error" role="alert">
        <p>{sessionError}</p>
        <button className="button button-outline" type="button" onClick={restoreSession}>Retry session check</button>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}
