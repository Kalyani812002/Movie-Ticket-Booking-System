import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MovieCard from "../components/MovieCard.jsx";
import { api } from "../services/api.js";

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError("");
    api.getMovies()
      .then(({ movies: results }) => {
        if (active) {
          setMovies(results);
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
  }, [reloadKey]);

  const featured = movies.find((movie) => movie.featured) || movies[0];

  return (
    <>
      <section className="hero">
        <div className="hero-image" style={featured?.backdropUrl ? { backgroundImage: `url("${featured.backdropUrl}")` } : undefined} />
        <div className="hero-shade" />
        <div className="hero-content page-width">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-line" /> A little more magic, please</span>
            <h1>Your night,<br />on the <em>big screen.</em></h1>
            <p>Pick the story. Pick your seat. We’ll save you the best part of going out.</p>
            <a className="button button-primary" href="#movies">Explore what’s on <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-note">
            <span className="hero-note-icon">✦</span>
            <span><strong>Made for movie people</strong><br />A better kind of night out.</span>
          </div>
          <div className="hero-index"><span>01</span> / NOW SHOWING</div>
        </div>
      </section>

      <section className="movies-section page-width" id="movies">
        <div className="section-heading">
          <div>
            <span className="eyebrow"><span className="eyebrow-line" /> The good stuff</span>
            <h2>Now showing<span className="accent-dot">.</span></h2>
          </div>
          <span className="section-count">{String(movies.length).padStart(2, "0")} FILMS TO DISCOVER</span>
        </div>
        {status === "loading" && <div className="state-message">Finding your next favorite…</div>}
        {status === "error" && (
          <div className="state-message error-message" role="alert">
            <p>{error}</p>
            <button className="button button-outline" type="button" onClick={() => setReloadKey((key) => key + 1)}>Try again</button>
          </div>
        )}
        {status === "ready" && movies.length === 0 && (
          <div className="state-message">No movies are listed yet. Add a few with <code>npm run seed</code> from the backend folder.</div>
        )}
        {movies.length > 0 && (
          <>
            <div className="movie-grid">
              {movies.map((movie, index) => <MovieCard key={movie._id} movie={movie} index={index} />)}
            </div>
            {featured && (
              <div className="featured-banner" id="experience">
                <div className="featured-copy">
                  <span className="eyebrow"><span className="eyebrow-line" /> Your seat is waiting</span>
                  <h3>Make an evening<br />of <em>{featured.title}.</em></h3>
                  <Link className="text-link" to={`/book/${featured._id}`}>Book your tickets <span aria-hidden="true">↗</span></Link>
                </div>
                <div className="featured-image" style={featured.backdropUrl ? { backgroundImage: `url("${featured.backdropUrl}")` } : undefined} />
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
