export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="brand footer-brand"><span className="brand-mark">C</span><span>cine<span className="brand-light">book</span></span></div>
        <p>Good stories deserve the big screen.</p>
        <span>© {new Date().getFullYear()} CineBook</span>
      </div>
    </footer>
  );
}
