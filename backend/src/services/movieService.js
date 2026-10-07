import Movie from "../models/Movie.js";

export function listMovies() {
  return Movie.find().sort({ featured: -1, releaseDate: -1 }).lean();
}

export function findMovieById(id) {
  return Movie.findById(id).lean();
}

export function createMovie(movieData) {
  return Movie.create(movieData);
}

export function updateMovieById(id, movieData) {
  return Movie.findByIdAndUpdate(id, movieData, {
    new: true,
    runValidators: true
  }).lean();
}

export function deleteMovieById(id) {
  return Movie.findByIdAndDelete(id).lean();
}
