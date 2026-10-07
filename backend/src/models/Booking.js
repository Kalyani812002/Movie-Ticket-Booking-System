import mongoose from "mongoose";

const seatPattern = /^[A-H](?:[1-9]|1[0-2])$/;

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
      index: true
    },
    seatsBooked: {
      type: [{ type: String, trim: true }],
      required: true,
      validate: [
        {
          validator: (seats) =>
            Array.isArray(seats) &&
            seats.length >= 1 &&
            seats.length <= 8 &&
            seats.every((seat) => seatPattern.test(seat)),
          message: "Choose between 1 and 8 valid seats."
        },
        {
          validator: (seats) => new Set(seats).size === seats.length,
          message: "A seat can only be booked once per booking."
        }
      ]
    },
    bookingDate: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      required: true,
      default: "confirmed"
    }
  },
  { timestamps: true }
);

bookingSchema.index(
  { show: 1, seatsBooked: 1 },
  {
    name: "unique_seats_per_show",
    unique: true,
    partialFilterExpression: { show: { $exists: true } }
  }
);

export default mongoose.model("Booking", bookingSchema);
