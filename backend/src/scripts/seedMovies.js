import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import Movie from "../models/Movie.js";

const movies = [
  {
    title: "The Last Horizon",
    description: "A crew on a final deep-space mission discovers a signal that could change humanity's future.",
    genre: ["Sci-Fi", "Adventure"],
    duration: 128,
    language: "English",
    rating: "PG-13",
    score: 8.4,
    posterUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=85",
    backdropUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1800&q=85",
    releaseDate: "2026-09-18",
    featured: true
  },
  {
    title: "Velvet City",
    description: "An ambitious jazz pianist gets one last chance to find her sound in a city that never sleeps.",
    genre: ["Drama", "Music"],
    duration: 114,
    language: "English",
    rating: "PG-13",
    score: 7.9,
    posterUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85",
    backdropUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=85",
    releaseDate: "2026-09-25",
    featured: true
  },
  {
    title: "Wildwood",
    description: "Two siblings return to their childhood home and uncover a mystery hidden deep in the forest.",
    genre: ["Mystery", "Thriller"],
    duration: 106,
    language: "English",
    rating: "PG-13",
    score: 7.6,
    posterUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=85",
    backdropUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1800&q=85",
    releaseDate: "2026-10-02",
    featured: false
  },
  {
    title: "Small Wonders",
    description: "A curious young inventor and her unlikely crew turn a neighborhood workshop into a place of possibility.",
    genre: ["Family", "Comedy"],
    duration: 98,
    language: "English",
    rating: "PG",
    score: 8.1,
    posterUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=85",
    backdropUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1800&q=85",
    releaseDate: "2026-10-09",
    featured: false
  },
  {
    title: "After the Rain",
    description: "A photographer revisits a coastal town where a chance reunion changes the course of an ordinary summer.",
    genre: ["Romance", "Drama"],
    duration: 121,
    language: "English",
    rating: "PG-13",
    score: 7.7,
    posterUrl: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=900&q=85",
    backdropUrl: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1800&q=85",
    releaseDate: "2026-10-16",
    featured: false
  },
  {
    title: "The Quiet Room",
    description: "A sound engineer working the night shift begins to hear a voice hidden inside a collection of old recordings.",
    genre: ["Thriller", "Mystery"],
    duration: 109,
    language: "English",
    rating: "R",
    score: 8.0,
    posterUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85",
    backdropUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
    releaseDate: "2026-10-23",
    featured: false
  }
];

try {
  await connectDatabase();
  await Movie.bulkWrite(
    movies.map((movie) => ({
      updateOne: {
        filter: { title: movie.title },
        update: { $set: movie },
        upsert: true
      }
    }))
  );
  console.log(`Seeded ${movies.length} movies.`);
} catch (error) {
  console.error("Unable to seed movies:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
