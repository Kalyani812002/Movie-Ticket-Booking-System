import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import {
  createBooking as insertBooking,
  listBookings,
  listBookingsForUser
} from "../services/bookingService.js";

const seatPattern = /^[A-H](?:[1-9]|1[0-2])$/;

export async function createBooking(request, response, next) {
  const body = request.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return response.status(400).json({ message: "Request body must be a JSON object." });
  }

  const { show: showId, seatsBooked } = body;
  const unknownField = Object.keys(body).find((field) => !["show", "seatsBooked"].includes(field));
  if (unknownField) {
    return response.status(400).json({ message: `Unsupported booking field: ${unknownField}.` });
  }
  if (!mongoose.isValidObjectId(showId)) {
    return response.status(400).json({ message: "show must be a valid show id." });
  }
  if (
    !Array.isArray(seatsBooked) ||
    seatsBooked.length < 1 ||
    seatsBooked.length > 8 ||
    seatsBooked.some((seat) => typeof seat !== "string" || !seatPattern.test(seat)) ||
    new Set(seatsBooked).size !== seatsBooked.length
  ) {
    return response.status(400).json({
      message: "Choose between 1 and 8 unique seats using the A1–H12 seat format."
    });
  }

  try {
    const reservedShow = await Show.findOneAndUpdate(
      {
        _id: showId,
        availableSeats: { $gte: seatsBooked.length },
        bookedSeats: { $nin: seatsBooked }
      },
      {
        $inc: { availableSeats: -seatsBooked.length },
        $addToSet: { bookedSeats: { $each: seatsBooked } }
      },
      { new: true }
    );

    if (!reservedShow) {
      const showExists = await Show.exists({ _id: showId });
      if (!showExists) {
        return response.status(404).json({ message: "Show not found." });
      }
      return response.status(409).json({
        message: "One or more selected seats are unavailable, or the show has insufficient seats."
      });
    }

    try {
      const booking = await insertBooking({
        user: request.user.id,
        show: showId,
        seatsBooked,
        status: "confirmed"
      });
      return response.status(201).json({ booking });
    } catch (error) {
      const rollback = await Show.updateOne(
        {
          _id: showId,
          bookedSeats: { $all: seatsBooked },
          $expr: {
            $lte: [
              {
                $add: [
                  "$availableSeats",
                  seatsBooked.length,
                  {
                    $subtract: [
                      { $size: { $ifNull: ["$bookedSeats", []] } },
                      seatsBooked.length
                    ]
                  }
                ]
              },
              "$totalSeats"
            ]
          }
        },
        {
          $inc: { availableSeats: seatsBooked.length },
          $pull: { bookedSeats: { $in: seatsBooked } }
        }
      );
      if (rollback.modifiedCount !== 1) {
        throw new Error("Booking creation failed and reserved seats could not be restored.", {
          cause: error
        });
      }
      throw error;
    }
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: "One or more selected seats are already booked." });
    }
    return next(error);
  }
}

export async function getMyBookings(request, response, next) {
  try {
    return response.json({ bookings: await listBookingsForUser(request.user.id) });
  } catch (error) {
    return next(error);
  }
}

export async function getAllBookings(_request, response, next) {
  try {
    return response.json({ bookings: await listBookings() });
  } catch (error) {
    return next(error);
  }
}

export async function getOccupiedSeats(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.showId)) {
    return response.status(400).json({ message: "Invalid show id." });
  }

  try {
    const show = await Show.findById(request.params.showId)
      .select("+bookedSeats")
      .lean();
    if (!show) {
      return response.status(404).json({ message: "Show not found." });
    }
    return response.json({
      availableSeats: show.availableSeats,
      occupiedSeats: show.bookedSeats ?? []
    });
  } catch (error) {
    return next(error);
  }
}
