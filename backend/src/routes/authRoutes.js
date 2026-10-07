import { Router } from "express";
import {
  getCurrentUser,
  login,
  logout,
  register
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);
router.post("/logout", logout);

export default router;
