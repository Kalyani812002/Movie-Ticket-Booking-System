import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
    genre: {
      type: [{ type: String, trim: true, minlength: 1, maxlength: 40 }],
      required: true,
      validate: {
        validator: (genres) => Array.isArray(genres) && genres.length > 0 && genres.length <= 8,
        message: "A movie must have between 1 and 8 genres."
      }
    },
    duration: { type: Number, required: true, min: 1, max: 600 },
    language: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    description: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
    rating: { type: String, default: "PG-13", trim: true },
    score: { type: Number, min: 0, max: 10, default: 0 },
    posterUrl: { type: String, default: "" },
    backdropUrl: { type: String, default: "" },
    releaseDate: { type: Date, default: Date.now },
    featured: { type: Boolean, default: false },
    showtimes: {
      type: [String],
      default: ["12:30", "15:45", "18:30", "21:15"]
    }
  },
  { timestamps: true }
);

export default mongoose.model("Movie", movieSchema);
