import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api.js";

const SECTIONS = [
  { id: "movies", label: "Movies" },
  { id: "shows", label: "Shows" },
  { id: "bookings", label: "Bookings" }
];

const EMPTY_MOVIE = { title: "", genre: "", duration: "", language: "", description: "" };
const EMPTY_SHOW = {
  movie: "",
  date: "",
  time: "",
  theatre: "",
  screen: "",
  totalSeats: "",
  availableSeats: ""
};

function formatDate(value) {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function bookingShowDate(show) {
  return show ? `${formatDate(show.date)} · ${show.time || "—"}` : "Show unavailable";
}

export default function AdminDashboard({ initialSection = "movies" }) {
  const [section, setSection] = useState(initialSection);
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editingMovie, setEditingMovie] = useState(null);
  const [editingShow, setEditingShow] = useState(null);
  const [movieForm, setMovieForm] = useState(EMPTY_MOVIE);
  const [showForm, setShowForm] = useState(EMPTY_SHOW);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    setLoadState("loading");
    setLoadError("");
    Promise.all([api.getMovies(), api.getAllShows(), api.getAllBookings()])
      .then(([movieResponse, showResponse, bookingResponse]) => {
        if (!active) return;
        setMovies(movieResponse.movies);
        setShows(showResponse.shows);
        setBookings(bookingResponse.bookings);
        setLoadState("ready");
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(error.message);
        setLoadState("error");
      });
    return () => { active = false; };
  }, [reloadKey]);

  const clearFeedback = () => {
    setActionError("");
    setNotice("");
  };

  function startMovieEdit(movie) {
    clearFeedback();
    setEditingMovie(movie);
    setMovieForm({
      title: movie.title || "",
      genre: Array.isArray(movie.genre) ? movie.genre.join(", ") : "",
      duration: String(movie.duration ?? ""),
      language: movie.language || "",
      description: movie.description || ""
    });
    document.getElementById("admin-movie-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelMovieEdit() {
    setEditingMovie(null);
    setMovieForm(EMPTY_MOVIE);
  }

  function startShowEdit(show) {
    clearFeedback();
    setEditingShow(show);
    setShowForm({
      movie: show.movie?._id || "",
      date: show.date || "",
      time: show.time || "",
      theatre: show.theatre || "",
      screen: show.screen || "",
      totalSeats: String(show.totalSeats ?? ""),
      availableSeats: String(show.availableSeats ?? "")
    });
    document.getElementById("admin-show-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelShowEdit() {
    setEditingShow(null);
    setShowForm(EMPTY_SHOW);
  }

  async function submitMovie(event) {
    event.preventDefault();
    clearFeedback();
    const genres = movieForm.genre.split(",").map((genre) => genre.trim()).filter(Boolean);
    const duration = Number(movieForm.duration);
    if (!Number.isInteger(duration) || duration < 1 || duration > 600) {
      setActionError("Duration must be a whole number between 1 and 600 minutes.");
      return;
    }
    if (genres.length < 1 || genres.length > 8) {
      setActionError("Enter between 1 and 8 comma-separated genres.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: movieForm.title.trim(),
        genre: genres,
        duration,
        language: movieForm.language.trim(),
        description: movieForm.description.trim()
      };
      const result = editingMovie
        ? await api.updateMovie(editingMovie._id, payload)
        : await api.createMovie(payload);
      setMovies((current) => editingMovie
        ? current.map((movie) => movie._id === result.movie._id ? result.movie : movie)
        : [...current, result.movie].sort((left, right) => left.title.localeCompare(right.title)));
      setNotice(editingMovie ? "Movie updated." : "Movie added.");
      cancelMovieEdit();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeMovie(movie) {
    if (!window.confirm(`Delete “${movie.title}”?`)) return;
    clearFeedback();
    setSaving(true);
    try {
      await api.deleteMovie(movie._id);
      setMovies((current) => current.filter((item) => item._id !== movie._id));
      setNotice("Movie deleted.");
      if (editingMovie?._id === movie._id) cancelMovieEdit();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitShow(event) {
    event.preventDefault();
    clearFeedback();
    const totalSeats = Number(showForm.totalSeats);
    const availableSeats = Number(showForm.availableSeats);
    if (!Number.isInteger(totalSeats) || totalSeats < 1 || totalSeats > 10000) {
      setActionError("Total seats must be a whole number between 1 and 10,000.");
      return;
    }
    if (!Number.isInteger(availableSeats) || availableSeats < 0 || availableSeats > totalSeats) {
      setActionError("Available seats must be a whole number between 0 and total seats.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...showForm,
        theatre: showForm.theatre.trim(),
        screen: showForm.screen.trim(),
        totalSeats,
        availableSeats
      };
      const result = editingShow
        ? await api.updateShow(editingShow._id, payload)
        : await api.createShow(payload);
      setShows((current) => editingShow
        ? current.map((show) => show._id === result.show._id ? result.show : show)
        : [...current, result.show].sort((left, right) => (
          `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`)
        )));
      setNotice(editingShow ? "Show updated." : "Show created.");
      cancelShowEdit();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeShow(show) {
    if (!window.confirm(`Delete the show for ${show.movie?.title || "this movie"} on ${formatDate(show.date)}?`)) return;
    clearFeedback();
    setSaving(true);
    try {
      await api.deleteShow(show._id);
      setShows((current) => current.filter((item) => item._id !== show._id));
      setNotice("Show deleted.");
      if (editingShow?._id === show._id) cancelShowEdit();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setSaving(false);
    }
  }

  const retryLoad = useCallback(() => setReloadKey((key) => key + 1), []);

  return (
    <section className="admin-page page-width">
      <div className="admin-heading">
        <div>
          <span className="eyebrow"><span className="eyebrow-line" /> Movie Ticket Booking System</span>
          <h1>Admin Dashboard<span className="accent-dot">.</span></h1>
          <p>Manage your catalogue, show schedule, and reservations.</p>
        </div>
        {loadState === "ready" && (
          <div className="admin-summary" aria-label="Dashboard totals">
            <span><strong>{movies.length}</strong> Movies</span>
            <span><strong>{shows.length}</strong> Shows</span>
            <span><strong>{bookings.length}</strong> Bookings</span>
          </div>
        )}
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Dashboard sections">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            className={section === item.id ? "admin-tab active" : "admin-tab"}
            type="button"
            role="tab"
            aria-selected={section === item.id}
            aria-controls={`${item.id}-panel`}
            onClick={() => { setSection(item.id); clearFeedback(); }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loadState === "loading" && <div className="state-message" role="status">Loading dashboard data…</div>}
      {loadState === "error" && (
        <div className="admin-feedback error" role="alert">
          <p>{loadError}</p>
          <button className="button button-outline" type="button" onClick={retryLoad}>Try again</button>
        </div>
      )}
      {loadState === "ready" && (
        <>
          {actionError && <p className="admin-feedback error" role="alert">{actionError}</p>}
          {notice && <p className="admin-feedback success" role="status">{notice}</p>}

          {section === "movies" && (
            <div id="movies-panel" className="admin-section" role="tabpanel">
              <div className="admin-section-heading">
                <div><span className="eyebrow">Catalogue</span><h2>Movies</h2></div>
                <span className="section-count">{movies.length} TITLES</span>
              </div>
              <form id="admin-movie-form" className="admin-form" onSubmit={submitMovie}>
                <h3>{editingMovie ? "Edit movie" : "Add a movie"}</h3>
                <div className="admin-form-grid">
                  <label>Title<input required maxLength="160" value={movieForm.title} onChange={(event) => setMovieForm({ ...movieForm, title: event.target.value })} /></label>
                  <label>Genres <span>(comma separated)</span><input required maxLength="330" placeholder="Drama, Sci-Fi" value={movieForm.genre} onChange={(event) => setMovieForm({ ...movieForm, genre: event.target.value })} /></label>
                  <label>Duration (minutes)<input required type="number" min="1" max="600" step="1" value={movieForm.duration} onChange={(event) => setMovieForm({ ...movieForm, duration: event.target.value })} /></label>
                  <label>Language<input required minLength="2" maxLength="50" value={movieForm.language} onChange={(event) => setMovieForm({ ...movieForm, language: event.target.value })} /></label>
                  <label className="admin-form-wide">Description<textarea required maxLength="5000" rows="3" value={movieForm.description} onChange={(event) => setMovieForm({ ...movieForm, description: event.target.value })} /></label>
                </div>
                <div className="admin-form-actions">
                  <button className="button button-primary" type="submit" disabled={saving}>{saving ? "Saving…" : editingMovie ? "Save changes" : "Add movie"}</button>
                  {editingMovie && <button className="button button-outline" type="button" onClick={cancelMovieEdit} disabled={saving}>Cancel</button>}
                </div>
              </form>
              {movies.length === 0 ? <p className="admin-empty">No movies yet. Add one using the form above.</p> : (
                <div className="admin-card-grid">
                  {movies.map((movie) => (
                    <article className="admin-item-card" key={movie._id}>
                      <div className="admin-item-copy">
                        <h3>{movie.title}</h3>
                        <p>{Array.isArray(movie.genre) ? movie.genre.join(" · ") : movie.genre} · {movie.duration} min · {movie.language}</p>
                        <p className="admin-description">{movie.description}</p>
                      </div>
                      <div className="admin-item-actions">
                        <button className="button button-outline" type="button" onClick={() => startMovieEdit(movie)} disabled={saving}>Edit</button>
                        <button className="button button-danger" type="button" onClick={() => removeMovie(movie)} disabled={saving}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === "shows" && (
            <div id="shows-panel" className="admin-section" role="tabpanel">
              <div className="admin-section-heading">
                <div><span className="eyebrow">Schedule</span><h2>Shows</h2></div>
                <span className="section-count">{shows.length} SCHEDULED</span>
              </div>
              <form id="admin-show-form" className="admin-form" onSubmit={submitShow}>
                <h3>{editingShow ? "Edit show" : "Create a show"}</h3>
                <div className="admin-form-grid">
                  <label>Movie<select required value={showForm.movie} onChange={(event) => setShowForm({ ...showForm, movie: event.target.value })}><option value="">Select a movie</option>{movies.map((movie) => <option key={movie._id} value={movie._id}>{movie.title}</option>)}</select></label>
                  <label>Date<input required type="date" value={showForm.date} onChange={(event) => setShowForm({ ...showForm, date: event.target.value })} /></label>
                  <label>Time<input required type="time" value={showForm.time} onChange={(event) => setShowForm({ ...showForm, time: event.target.value })} /></label>
                  <label>Theatre<input required maxLength="120" value={showForm.theatre} onChange={(event) => setShowForm({ ...showForm, theatre: event.target.value })} /></label>
                  <label>Screen<input required maxLength="80" value={showForm.screen} onChange={(event) => setShowForm({ ...showForm, screen: event.target.value })} /></label>
                  <label>Total seats<input required type="number" min="1" max="10000" step="1" value={showForm.totalSeats} onChange={(event) => setShowForm({ ...showForm, totalSeats: event.target.value })} /></label>
                  <label>Available seats<input required type="number" min="0" max={showForm.totalSeats || 10000} step="1" value={showForm.availableSeats} onChange={(event) => setShowForm({ ...showForm, availableSeats: event.target.value })} /></label>
                </div>
                <div className="admin-form-actions">
                  <button className="button button-primary" type="submit" disabled={saving || movies.length === 0}>{saving ? "Saving…" : editingShow ? "Save changes" : "Create show"}</button>
                  {editingShow && <button className="button button-outline" type="button" onClick={cancelShowEdit} disabled={saving}>Cancel</button>}
                  {movies.length === 0 && <span className="admin-form-hint">Add a movie before creating a show.</span>}
                </div>
              </form>
              {shows.length === 0 ? <p className="admin-empty">No shows yet. Create one using the form above.</p> : (
                <div className="admin-card-grid">
                  {shows.map((show) => (
                    <article className="admin-item-card" key={show._id}>
                      <div className="admin-item-copy">
                        <h3>{show.movie?.title || "Movie unavailable"}</h3>
                        <p>{formatDate(show.date)} · {show.time} · {show.theatre} / {show.screen}</p>
                        <p className="admin-description">{show.availableSeats} of {show.totalSeats} seats available</p>
                      </div>
                      <div className="admin-item-actions">
                        <button className="button button-outline" type="button" onClick={() => startShowEdit(show)} disabled={saving}>Edit</button>
                        <button className="button button-danger" type="button" onClick={() => removeShow(show)} disabled={saving}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === "bookings" && (
            <div id="bookings-panel" className="admin-section" role="tabpanel">
              <div className="admin-section-heading">
                <div><span className="eyebrow">Reservations</span><h2>All bookings</h2></div>
                <span className="section-count">{bookings.length} BOOKINGS</span>
              </div>
              {bookings.length === 0 ? <p className="admin-empty">Bookings will appear here when customers reserve seats.</p> : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>Movie</th><th>Customer</th><th>Show</th><th>Theatre / screen</th><th>Seats</th><th>Booked on</th><th>Status</th></tr></thead>
                    <tbody>{bookings.map((booking) => {
                      const show = booking.show;
                      return (
                        <tr key={booking._id}>
                          <td data-label="Movie">{show?.movie?.title || "Unavailable"}</td>
                          <td data-label="Customer">{booking.user?.name || "Unavailable"}<small>{booking.user?.email}</small></td>
                          <td data-label="Show">{bookingShowDate(show)}</td>
                          <td data-label="Theatre / screen">{show ? `${show.theatre} / ${show.screen}` : "Unavailable"}</td>
                          <td data-label="Seats">{Array.isArray(booking.seatsBooked) ? booking.seatsBooked.join(", ") : "Unavailable"}</td>
                          <td data-label="Booked on">{formatDate(booking.bookingDate)}</td>
                          <td data-label="Status"><span className={`record-status ${booking.status}`}>{booking.status || "Unknown"}</span></td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
