import { Navigate, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import BookingsPage from "./pages/BookingsPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import HomePage from "./pages/HomePage.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/book/:movieId" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/account/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute adminOnly><AdminDashboard initialSection="bookings" /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
