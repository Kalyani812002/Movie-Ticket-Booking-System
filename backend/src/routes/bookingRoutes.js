import { Router } from "express";
import {
  createBooking,
  getAllBookings,
  getMyBookings,
  getOccupiedSeats
} from "../controllers/bookingController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = Router();

router.get("/my", authenticate, getMyBookings);
router.get("/", authenticate, authorizeRoles("admin"), getAllBookings);
router.post("/", authenticate, createBooking);
router.get("/shows/:showId/seats", getOccupiedSeats);

export default router;
