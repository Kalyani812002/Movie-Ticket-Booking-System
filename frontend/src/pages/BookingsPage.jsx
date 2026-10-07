import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function formatDate(value) {
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function BookingsPage({ admin = false, dashboard = false }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError("");
    const load = admin ? api.getAllBookings : api.getMyBookings;
    load()
      .then(({ bookings: results }) => {
        if (active) {
          setBookings(results);
          setStatus("ready");
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message);
          setStatus("error");
        }
      });
    return () => { active = false; };
  }, [admin, retryCount]);

  return (
    <section className="records-page page-width">
      <div className="section-heading">
        <div>
          <span className="eyebrow"><span className="eyebrow-line" /> {admin ? "CineBook management" : `A good night, ${user?.name?.split(" ")[0] || "movie lover"}`}</span>
          <h1>{dashboard ? "Admin Dashboard" : admin ? "All bookings" : "My bookings"}<span className="accent-dot">.</span></h1>
        </div>
        {status === "ready" && <span className="section-count">{String(bookings.length).padStart(2, "0")} {admin ? "RESERVATIONS" : "BOOKINGS"}</span>}
      </div>
      {status === "loading" && <div className="state-message" role="status">Loading bookings…</div>}
      {status === "error" && <div className="records-error" role="alert"><p className="error-message">{error}</p><button className="button button-outline" type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</button></div>}
      {status === "ready" && bookings.length === 0 && (
        <div className="empty-records">
          <span className="empty-star">✦</span>
          <h2>{admin ? "No bookings yet." : "Your next movie night is waiting."}</h2>
          <p>{admin ? "Bookings will appear here once customers reserve seats." : "Find a story you love and we’ll save your seats."}</p>
          {!admin && <Link className="button button-primary" to="/">Explore movies <span aria-hidden="true">↗</span></Link>}
        </div>
      )}
      {status === "ready" && bookings.length > 0 && (
        <div className="booking-record-list">
          {bookings.map((booking) => {
            const show = booking.show;
            const movie = show?.movie;
            return (
              <article className="booking-record" key={booking._id}>
                {movie?.posterUrl && <img src={movie.posterUrl} alt="" loading="lazy" />}
                <div className="record-content">
                  <div className="record-main">
                    <span className={`record-status ${booking.status}`}>{booking.status}</span>
                    <h2>{movie?.title || "Movie unavailable"}</h2>
                    {admin && <p className="record-customer">{booking.user?.name} · {booking.user?.email}</p>}
                  </div>
                  <dl className="record-details">
                    <div><dt>Theatre</dt><dd>{show?.theatre || "Unavailable"}</dd></div>
                    <div><dt>Screen</dt><dd>{show?.screen || "Unavailable"}</dd></div>
                    <div><dt>Date</dt><dd>{formatDate(show?.date)}</dd></div>
                    <div><dt>Time</dt><dd>{show?.time || "Unavailable"}</dd></div>
                    <div><dt>Seats booked</dt><dd>{Array.isArray(booking.seatsBooked) ? `${booking.seatsBooked.length}: ${booking.seatsBooked.join(", ")}` : "Unavailable"}</dd></div>
                    <div><dt>Booking date</dt><dd>{formatDate(booking.bookingDate)}</dd></div>
                    <div><dt>Booking status</dt><dd><span className={`record-status ${booking.status}`}>{booking.status || "Unknown"}</span></dd></div>
                  </dl>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
