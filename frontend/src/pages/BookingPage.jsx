import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useBooking } from "../context/BookingContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

const ROWS = "ABCDEFGH".split("");
const COLUMNS = Array.from({ length: 12 }, (_, index) => index + 1);

function dateOptions() {
  return Array.from({ length: 5 }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return {
      key,
      weekday: offset === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" }),
      day: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" })
    };
  });
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function BookingPage() {
  const { movieId } = useParams();
  const { drafts, updateDraft, clearDraft } = useBooking();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [occupied, setOccupied] = useState([]);
  const [availableSeats, setAvailableSeats] = useState(0);
  const [status, setStatus] = useState("loading");
  const [seatStatus, setSeatStatus] = useState("idle");
  const [pageError, setPageError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);
  const dates = useMemo(dateOptions, []);
  const draft = drafts[movieId] || {};
  const showDate = draft.showDate || dates[0].key;
  const selectedSeats = draft.seats || [];

  useEffect(() => {
    let active = true;
    setStatus("loading");
    api.getMovie(movieId)
      .then(({ movie: result }) => {
        if (!active) return;
        setMovie(result);
        setStatus("ready");
      })
      .catch((error) => {
        if (active) {
          setPageError(error.message);
          setStatus("error");
        }
      });
    return () => { active = false; };
  }, [movieId]);

  useEffect(() => {
    if (!movie) return undefined;
    let active = true;
    setStatus("loading");
    setShows([]);
    setSelectedShow(null);
    setOccupied([]);
    setSeatStatus("idle");
    api.getShows({ movie: movieId, date: showDate })
      .then(({ shows: results }) => {
        if (!active) return;
        setShows(results);
        const previous = results.find((show) => show._id === draft.showId);
        const nextShow = previous || results[0] || null;
        setSelectedShow(nextShow);
        if (nextShow) {
          updateDraft(movieId, { showDate, showId: nextShow._id, seats: previous ? draft.seats || [] : [] });
        } else {
          updateDraft(movieId, { showDate, showId: null, seats: [] });
        }
        setPageError("");
        setStatus("ready");
      })
      .catch((error) => {
        if (active) {
          setPageError(error.message);
          setStatus("error");
        }
      });
    return () => { active = false; };
  }, [movie, movieId, showDate]);

  useEffect(() => {
    if (!selectedShow) return undefined;
    let active = true;
    setSeatStatus("loading");
    api.getOccupiedSeats(selectedShow._id)
      .then(({ occupiedSeats, availableSeats: remaining }) => {
        if (!active) return;
        setOccupied(occupiedSeats);
        setAvailableSeats(remaining);
      })
      .catch((error) => {
        if (active) {
          setPageError(error.message);
          setSeatStatus("error");
        }
      })
      .finally(() => {
        if (active) setSeatStatus("ready");
      });
    return () => { active = false; };
  }, [selectedShow]);

  function selectDate(date) {
    updateDraft(movieId, { showDate: date, showId: null, seats: [] });
    setPageError("");
    setBooking(null);
  }

  function selectShow(show) {
    setSelectedShow(show);
    updateDraft(movieId, { showDate, showId: show._id, seats: [] });
    setPageError("");
    setBooking(null);
  }

  function toggleSeat(seat) {
    if (occupied.includes(seat)) return;
    const next = selectedSeats.includes(seat)
      ? selectedSeats.filter((item) => item !== seat)
      : selectedSeats.length < 8 && selectedSeats.length < availableSeats
        ? [...selectedSeats, seat]
        : selectedSeats;
    updateDraft(movieId, { seats: next });
  }

  async function submitBooking(event) {
    event.preventDefault();
    if (!selectedShow || selectedSeats.length === 0) return;
    setPageError("");
    setSubmitting(true);
    try {
      const { booking: result } = await api.createBooking({
        show: selectedShow._id,
        seatsBooked: selectedSeats
      });
      setBooking(result);
      clearDraft(movieId);
    } catch (error) {
      setPageError(error.message);
      if (error.status === 409) {
        try {
          const data = await api.getOccupiedSeats(selectedShow._id);
          setOccupied(data.occupiedSeats);
          setAvailableSeats(data.availableSeats);
          const unavailable = new Set(data.occupiedSeats);
          updateDraft(movieId, {
            seats: selectedSeats.filter((seat) => !unavailable.has(seat))
          });
        } catch (refreshError) {
          setPageError(refreshError.message);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" && !movie) {
    return <section className="booking-page page-width"><div className="state-message" role="status">Preparing your movie night…</div></section>;
  }
  if (!movie) {
    return <section className="booking-page page-width"><Link className="back-link" to="/">← Back to movies</Link><div className="state-message error-message" role="alert">{pageError || "Movie not found."}</div></section>;
  }
  if (booking) {
    return (
      <section className="confirmation-wrap page-width">
        <div className="confirmation-card">
          <span className="confirmation-check">✓</span>
          <span className="eyebrow"><span className="eyebrow-line" /> It’s a date</span>
          <h1>You’re going<br />to the <em>movies.</em></h1>
          <p className="confirmation-intro">Your seats are saved. We can’t wait to see you there.</p>
          <div className="ticket">
            <div className="ticket-top"><div><span className="ticket-label">YOUR MOVIE</span><strong>{movie.title}</strong></div><span className="ticket-stamp">CINEBOOK</span></div>
            <div className="ticket-details">
              <div><span className="ticket-label">DATE</span><strong>{formatDate(selectedShow.date)}</strong></div>
              <div><span className="ticket-label">SHOWTIME</span><strong>{selectedShow.time}</strong></div>
              <div><span className="ticket-label">SEATS</span><strong>{booking.seatsBooked.join(", ")}</strong></div>
              <div><span className="ticket-label">THEATRE</span><strong>{selectedShow.theatre} · {selectedShow.screen}</strong></div>
            </div>
            <div className="ticket-email">Booking confirmation for {user.email}</div>
          </div>
          <Link className="button button-primary" to="/account/bookings">View my tickets <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    );
  }

  return (
    <section className="booking-page page-width">
      <Link className="back-link" to="/">← Back to movies</Link>
      <div className="booking-layout">
        <div className="booking-main">
          <div className="booking-heading">
            <div>
              <span className="eyebrow"><span className="eyebrow-line" /> Make it a movie night</span>
              <h1>Pick your <em>seats.</em></h1>
              <p>Booking tickets for <strong>{movie.title}</strong></p>
            </div>
            <span className="booking-step">01 <span>/</span> 02</span>
          </div>
          <div className="booking-section">
            <div className="booking-section-title"><span>01</span><h2>Choose a date</h2></div>
            <div className="date-options">
              {dates.map((date) => (
                <button className={`date-option ${showDate === date.key ? "selected" : ""}`} key={date.key} type="button" onClick={() => selectDate(date.key)}>
                  <span>{date.weekday}</span><strong>{date.day}</strong><small>{date.month}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="booking-section">
            <div className="booking-section-title"><span>02</span><h2>Choose a show</h2></div>
            {status === "loading" && <p className="seat-loading" role="status">Finding screenings…</p>}
            {status === "error" && <p className="form-error" role="alert">{pageError}</p>}
            {status === "ready" && shows.length === 0 && <p className="seat-loading">No shows available on this date. Try another day.</p>}
            {shows.length > 0 && (
              <div className="show-options">
                {shows.map((show) => (
                  <button className={`show-option ${selectedShow?._id === show._id ? "selected" : ""}`} key={show._id} type="button" onClick={() => selectShow(show)}>
                    <strong>{show.time}</strong>
                    <span>{show.theatre} · {show.screen}</span>
                    <small>{show.availableSeats} seats left</small>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedShow && (
            <div className="booking-section seat-section">
              <div className="booking-section-title"><span>03</span><h2>Find your seat</h2><small>Up to 8 tickets</small></div>
              <div className="screen-curve" /><span className="screen-label">SCREEN</span>
              {seatStatus === "loading" && <p className="seat-loading" role="status">Checking seat availability…</p>}
              {seatStatus === "error" && <p className="form-error" role="alert">{pageError}</p>}
              {seatStatus === "ready" && (
                <>
                  <div className="seat-map">
                    {ROWS.map((row) => (
                      <div className="seat-row" key={row}>
                        <span className="row-label">{row}</span>
                        {COLUMNS.map((column) => {
                          const seat = `${row}${column}`;
                          const isOccupied = occupied.includes(seat);
                          const isSelected = selectedSeats.includes(seat);
                          return <button key={seat} className={`seat ${isOccupied ? "occupied" : ""} ${isSelected ? "selected" : ""}`} type="button" aria-label={`${seat}${isOccupied ? ", unavailable" : isSelected ? ", selected" : ""}`} aria-pressed={isSelected} disabled={isOccupied} onClick={() => toggleSeat(seat)} />;
                        })}
                        <span className="row-label">{row}</span>
                      </div>
                    ))}
                  </div>
                  <div className="seat-legend"><span><i className="legend-seat" /> Available</span><span><i className="legend-seat chosen" /> Selected</span><span><i className="legend-seat taken" /> Taken</span></div>
                  <p className="remaining-seats">{availableSeats} seats remain for this screening</p>
                </>
              )}
            </div>
          )}
        </div>
        <aside className="booking-aside">
          <div className="summary-card">
            <span className="summary-label">YOUR SCREENING</span>
            <h2>{movie.title}</h2>
            <p>{movie.genre?.join(" · ")} <span>·</span> {movie.duration} min</p>
            <div className="summary-rule" />
            <div className="summary-row"><span>Date</span><strong>{formatDate(showDate)}</strong></div>
            <div className="summary-row"><span>Showtime</span><strong>{selectedShow?.time || "Choose a show"}</strong></div>
            <div className="summary-row"><span>Theatre</span><strong>{selectedShow ? `${selectedShow.theatre} · ${selectedShow.screen}` : "—"}</strong></div>
            <div className="summary-row"><span>Seats</span><strong>{selectedSeats.length ? selectedSeats.join(", ") : "Choose your seats"}</strong></div>
            <div className="summary-rule" />
            <div className="summary-row total-row"><span>{selectedSeats.length} {selectedSeats.length === 1 ? "seat" : "seats"}</span><strong>{selectedSeats.length || "—"}</strong></div>
            {pageError && <p className="form-error" role="alert">{pageError}</p>}
            <button className="button button-primary book-button" type="button" onClick={submitBooking} disabled={!selectedShow || !selectedSeats.length || submitting || seatStatus !== "ready"}>
              {submitting ? "Saving your seats…" : "Reserve my seats"} <span aria-hidden="true">↗</span>
            </button>
            <span className="summary-footnote">Secure booking · Signed in as {user.email}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
