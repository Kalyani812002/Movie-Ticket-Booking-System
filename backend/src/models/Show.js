import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true
    },
    date: { type: String, required: true },
    time: { type: String, required: true },
    theatre: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    screen: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    totalSeats: { type: Number, required: true, min: 1, max: 10000 },
    availableSeats: { type: Number, required: true, min: 0, max: 10000 },
    bookedSeats: {
      type: [{ type: String, trim: true, select: false }],
      default: [],
      select: false,
      validate: {
        validator: (seats) => new Set(seats).size === seats.length,
        message: "A seat can only be reserved once per show."
      }
    }
  },
  { timestamps: true }
);

showSchema.index(
  { movie: 1, date: 1, time: 1, theatre: 1, screen: 1 },
  { unique: true }
);

showSchema.pre("validate", function validateAvailableSeats() {
  const bookedSeatCount = this.bookedSeats?.length ?? 0;
  if (this.availableSeats + bookedSeatCount > this.totalSeats) {
    this.invalidate("availableSeats", "Available seats and booked seats cannot exceed total seats.");
  }
});

export default mongoose.model("Show", showSchema);
