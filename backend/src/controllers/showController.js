import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import {
  createShow as insertShow,
  deleteShowById,
  findShowById,
  listShows,
  updateAvailableSeatsById,
  updateShowById
} from "../services/showService.js";

const SHOW_FIELDS = new Set([
  "movie",
  "date",
  "time",
  "theatre",
  "screen",
  "totalSeats",
  "availableSeats"
]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function isValidDate(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validateShowInput(input, { partial = false } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Request body must be a JSON object." };
  }

  const keys = Object.keys(input);
  const unknownField = keys.find((key) => !SHOW_FIELDS.has(key));
  if (unknownField) {
    return { error: `Unsupported show field: ${unknownField}.` };
  }
  if (partial && keys.length === 0) {
    return { error: "Provide at least one show field to update." };
  }

  const fieldsToValidate = partial ? keys : [...SHOW_FIELDS];
  for (const field of fieldsToValidate) {
    const value = input[field];
    if (field === "movie" && !mongoose.isValidObjectId(value)) {
      return { error: "movie must be a valid movie id." };
    }
    if (field === "date" && !isValidDate(value)) {
      return { error: "date must be a valid date in YYYY-MM-DD format." };
    }
    if (field === "time" && (typeof value !== "string" || !TIME_PATTERN.test(value))) {
      return { error: "time must be in 24-hour HH:mm format." };
    }
    if (field === "theatre" || field === "screen") {
      const maximum = field === "theatre" ? 120 : 80;
      if (
        typeof value !== "string" ||
        !value.trim() ||
        value.trim().length > maximum
      ) {
        return { error: `${field} must be a non-empty string of at most ${maximum} characters.` };
      }
    }
    if (
      (field === "totalSeats" || field === "availableSeats") &&
      (!Number.isInteger(value) || value < (field === "availableSeats" ? 0 : 1) || value > 10000)
    ) {
      return {
        error: field === "totalSeats"
          ? "totalSeats must be an integer between 1 and 10000."
          : "availableSeats must be an integer between 0 and 10000."
      };
    }
  }

  const showData = {};
  for (const field of keys) {
    showData[field] =
      field === "theatre" || field === "screen" ? input[field].trim() : input[field];
  }

  const totalSeats = showData.totalSeats;
  const availableSeats = showData.availableSeats;
  if (
    totalSeats !== undefined &&
    availableSeats !== undefined &&
    availableSeats > totalSeats
  ) {
    return { error: "availableSeats cannot exceed totalSeats." };
  }

  return { showData };
}

function validateMovieFilter(value) {
  return value === undefined || mongoose.isValidObjectId(value);
}

export async function getShows(request, response, next) {
  const { movie, date } = request.query;
  if (!validateMovieFilter(movie)) {
    return response.status(400).json({ message: "movie must be a valid movie id." });
  }
  if (date !== undefined && !isValidDate(date)) {
    return response.status(400).json({ message: "date must be a valid date in YYYY-MM-DD format." });
  }

  try {
    const filters = { availableSeats: { $gt: 0 } };
    if (movie) filters.movie = movie;
    if (date) filters.date = date;
    return response.json({ shows: await listShows(filters) });
  } catch (error) {
    return next(error);
  }
}

export async function getAllShows(_request, response, next) {
  try {
    return response.json({ shows: await listShows() });
  } catch (error) {
    return next(error);
  }
}

export async function getShow(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid show id." });
  }

  try {
    const show = await findShowById(request.params.id);
    if (!show) {
      return response.status(404).json({ message: "Show not found." });
    }
    return response.json({ show });
  } catch (error) {
    return next(error);
  }
}

export async function createShow(request, response, next) {
  const validation = validateShowInput(request.body);
  if (validation.error) {
    return response.status(400).json({ message: validation.error });
  }

  try {
    const movieExists = await Movie.exists({ _id: validation.showData.movie });
    if (!movieExists) {
      return response.status(404).json({ message: "Movie not found." });
    }
    const show = await insertShow(validation.showData);
    return response.status(201).json({ show });
  } catch (error) {
    return next(error);
  }
}

export async function updateShow(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid show id." });
  }

  const validation = validateShowInput(request.body, { partial: true });
  if (validation.error) {
    return response.status(400).json({ message: validation.error });
  }

  try {
    const changesShowIdentity = ["movie", "date", "time", "theatre", "screen"]
      .some((field) => validation.showData[field] !== undefined);
    if (changesShowIdentity && await Booking.exists({ show: request.params.id })) {
      return response.status(409).json({
        message: "A show with bookings cannot change its movie, date, time, theatre, or screen."
      });
    }

    if (validation.showData.movie) {
      const movieExists = await Movie.exists({ _id: validation.showData.movie });
      if (!movieExists) {
        return response.status(404).json({ message: "Movie not found." });
      }
    }

    const show = await updateShowById(request.params.id, validation.showData);
    if (!show) {
      const existingShow = await findShowById(request.params.id);
      if (!existingShow) {
        return response.status(404).json({ message: "Show not found." });
      }
      if (
        changesShowIdentity &&
        await Booking.exists({ show: request.params.id })
      ) {
        return response.status(409).json({
          message: "A show with bookings cannot change its movie, date, time, theatre, or screen."
        });
      }
      return response.status(400).json({
        message: "availableSeats cannot exceed totalSeats. Update both values together if needed."
      });
    }
    return response.json({ show });
  } catch (error) {
    return next(error);
  }
}

export async function updateAvailableSeats(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid show id." });
  }
  if (
    !request.body ||
    typeof request.body !== "object" ||
    Array.isArray(request.body) ||
    Object.keys(request.body).length !== 1 ||
    !Object.hasOwn(request.body, "availableSeats")
  ) {
    return response.status(400).json({
      message: "Request body must contain only the availableSeats field."
    });
  }
  const { availableSeats } = request.body ?? {};
  if (!Number.isInteger(availableSeats) || availableSeats < 0 || availableSeats > 10000) {
    return response.status(400).json({
      message: "availableSeats must be an integer between 0 and 10000."
    });
  }

  try {
    const show = await updateAvailableSeatsById(request.params.id, availableSeats);
    if (!show) {
      const existingShow = await findShowById(request.params.id);
      if (!existingShow) {
        return response.status(404).json({ message: "Show not found." });
      }
      return response.status(400).json({ message: "availableSeats cannot exceed totalSeats." });
    }
    return response.json({ show });
  } catch (error) {
    return next(error);
  }
}

export async function deleteShow(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid show id." });
  }

  try {
    if (await Booking.exists({ show: request.params.id })) {
      return response.status(409).json({
        message: "A show with bookings cannot be deleted."
      });
    }
    const show = await deleteShowById(request.params.id);
    if (!show) {
      const existingShow = await findShowById(request.params.id);
      if (!existingShow) {
        return response.status(404).json({ message: "Show not found." });
      }
      return response.status(409).json({
        message: "A show with reserved seats cannot be deleted."
      });
    }
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
}
