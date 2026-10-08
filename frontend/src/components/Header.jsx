import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLogoutError("");
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      setLogoutError(error.message);
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Movie Ticket Booking System home">
          <span className="brand-mark">M</span>
          <span className="brand-name">Movie Ticket Booking System</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/#movies">Movies</Link>
          <Link to="/#experience">Our experience</Link>
        </nav>
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <Link className="header-account" to={user.role === "admin" ? "/admin" : "/account/bookings"}>
                {user.role === "admin" ? "Dashboard" : "My tickets"}
              </Link>
              {user.role === "admin" && <span className="admin-badge">ADMIN</span>}
              <button className="header-signout" type="button" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <Link className="header-account" to="/login">Sign in</Link>
              <Link className="header-cta" to="/register">Join now <span aria-hidden="true">↗</span></Link>
            </>
          )}
        </div>
      </div>
      {logoutError && <p className="header-error" role="alert">{logoutError}</p>}
    </header>
  );
}
