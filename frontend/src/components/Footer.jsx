export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="brand footer-brand"><span className="brand-mark">M</span><span className="brand-name">Movie Ticket Booking System</span></div>
        <p>Good stories deserve the big screen.</p>
        <span>© {new Date().getFullYear()} Movie Ticket Booking System</span>
      </div>
    </footer>
  );
}
