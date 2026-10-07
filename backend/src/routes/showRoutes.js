import { Router } from "express";
import {
  createShow,
  deleteShow,
  getAllShows,
  getShow,
  getShows,
  updateAvailableSeats,
  updateShow
} from "../controllers/showController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = Router();
const adminOnly = [authenticate, authorizeRoles("admin")];

router.get("/", getShows);
router.get("/admin/all", ...adminOnly, getAllShows);
router.post("/", ...adminOnly, createShow);
router.patch("/:id/seats", ...adminOnly, updateAvailableSeats);
router.put("/:id", ...adminOnly, updateShow);
router.patch("/:id", ...adminOnly, updateShow);
router.delete("/:id", ...adminOnly, deleteShow);
router.get("/:id", getShow);

export default router;
