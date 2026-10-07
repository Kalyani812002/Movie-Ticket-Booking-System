import Booking from "../models/Booking.js";

const bookingPopulation = [
  { path: "user", select: "name email" },
  {
    path: "show",
    populate: { path: "movie", select: "title genre duration language posterUrl" }
  }
];

export function createBooking(bookingData) {
  return Booking.create(bookingData);
}

export function listBookingsForUser(userId) {
  return Booking.find({ user: userId })
    .populate(bookingPopulation)
    .sort({ bookingDate: -1 })
    .lean();
}

export function listBookings() {
  return Booking.find()
    .populate(bookingPopulation)
    .sort({ bookingDate: -1 })
    .lean();
}
