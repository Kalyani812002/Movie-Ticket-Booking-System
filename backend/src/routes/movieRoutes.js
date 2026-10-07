import { Router } from "express";
import {
  createMovie,
  deleteMovie,
  getMovie,
  getMovies,
  updateMovie
} from "../controllers/movieController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = Router();

router.get("/", getMovies);
router.post("/", authenticate, authorizeRoles("admin"), createMovie);
router.put("/:id", authenticate, authorizeRoles("admin"), updateMovie);
router.patch("/:id", authenticate, authorizeRoles("admin"), updateMovie);
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteMovie);
router.get("/:id", getMovie);

export default router;
