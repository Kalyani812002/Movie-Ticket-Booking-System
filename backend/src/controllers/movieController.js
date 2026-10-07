import mongoose from "mongoose";
import Show from "../models/Show.js";
import {
  createMovie as insertMovie,
  deleteMovieById,
  findMovieById,
  listMovies,
  updateMovieById
} from "../services/movieService.js";

const MOVIE_FIELDS = new Set(["title", "genre", "duration", "language", "description"]);

function validateMovieInput(input, { partial = false } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Request body must be a JSON object." };
  }

  const keys = Object.keys(input);
  const unknown = keys.filter((key) => !MOVIE_FIELDS.has(key));
  if (unknown.length) {
    return { error: `Unsupported movie field: ${unknown[0]}.` };
  }
  if (partial && keys.length === 0) {
    return { error: "Provide at least one movie field to update." };
  }

  const required = partial ? keys : [...MOVIE_FIELDS];
  for (const field of required) {
    const value = input[field];
    if (field === "title" || field === "language" || field === "description") {
      if (typeof value !== "string" || !value.trim()) {
        return { error: `${field} must be a non-empty string.` };
      }
      const trimmed = value.trim();
      const maximum = field === "title" ? 160 : field === "language" ? 50 : 5000;
      if (trimmed.length > maximum) {
        return { error: `${field} must be no more than ${maximum} characters.` };
      }
      if (field === "language" && trimmed.length < 2) {
        return { error: "language must be between 2 and 50 characters." };
      }
    } else if (field === "genre") {
      if (
        !Array.isArray(value) ||
        value.length < 1 ||
        value.length > 8 ||
        value.some(
          (genre) =>
            typeof genre !== "string" ||
            !genre.trim() ||
            genre.trim().length > 40
        )
      ) {
        return { error: "genre must be an array of 1 to 8 non-empty strings (up to 40 characters each)." };
      }
    } else if (
      field === "duration" &&
      (!Number.isInteger(value) || value < 1 || value > 600)
    ) {
      return { error: "duration must be an integer between 1 and 600 minutes." };
    }
  }

  const movieData = {};
  for (const field of keys) {
    movieData[field] = field === "genre"
      ? input.genre.map((genre) => genre.trim())
      : typeof input[field] === "string" ? input[field].trim() : input[field];
  }
  return { movieData };
}

export async function getMovies(_request, response, next) {
  try {
    response.json({ movies: await listMovies() });
  } catch (error) {
    next(error);
  }
}

export async function getMovie(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid movie id." });
  }

  try {
    const movie = await findMovieById(request.params.id);
    if (!movie) {
      return response.status(404).json({ message: "Movie not found." });
    }
    return response.json({ movie });
  } catch (error) {
    return next(error);
  }
}

export async function createMovie(request, response, next) {
  const validation = validateMovieInput(request.body);
  if (validation.error) {
    return response.status(400).json({ message: validation.error });
  }

  try {
    const movie = await insertMovie(validation.movieData);
    return response.status(201).json({ movie });
  } catch (error) {
    return next(error);
  }
}

export async function updateMovie(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid movie id." });
  }

  const validation = validateMovieInput(request.body, { partial: true });
  if (validation.error) {
    return response.status(400).json({ message: validation.error });
  }

  try {
    const movie = await updateMovieById(request.params.id, validation.movieData);
    if (!movie) {
      return response.status(404).json({ message: "Movie not found." });
    }
    return response.json({ movie });
  } catch (error) {
    return next(error);
  }
}

export async function deleteMovie(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid movie id." });
  }

  try {
    if (await Show.exists({ movie: request.params.id })) {
      return response.status(409).json({
        message: "A movie with scheduled or booked shows cannot be deleted because show and booking history must be preserved."
      });
    }
    const movie = await deleteMovieById(request.params.id);
    if (!movie) {
      return response.status(404).json({ message: "Movie not found." });
    }
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
}
