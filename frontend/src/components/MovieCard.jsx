import { Link } from "react-router-dom";

export default function MovieCard({ movie, index }) {
  return (
    <article className="movie-card" style={{ "--card-index": index }}>
      <Link className="poster-wrap" to={`/book/${movie._id}`} aria-label={`Book tickets for ${movie.title}`}>
        <img className="poster-image" src={movie.posterUrl} alt={`${movie.title} poster`} loading="lazy" />
        <span className="poster-overlay" />
        <span className="poster-rating"><span aria-hidden="true">★</span> {movie.score?.toFixed(1) || "New"}</span>
        {movie.featured && <span className="poster-featured">CINEBOOK PICK</span>}
        <span className="poster-play" aria-hidden="true">↗</span>
      </Link>
      <div className="movie-card-info">
        <div>
          <Link className="movie-title" to={`/book/${movie._id}`}>{movie.title}</Link>
          <p>{movie.genre?.slice(0, 2).join(" · ") || "Now showing"} <span>·</span> {movie.duration} min</p>
        </div>
        <span className="movie-age">{movie.rating}</span>
      </div>
    </article>
  );
}
