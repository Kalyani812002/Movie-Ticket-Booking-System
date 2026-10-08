import User from "../models/User.js";
import { createAccessToken } from "../services/authService.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_COOKIE = "cinebook_session";
const TOKEN_MAX_AGE = 24 * 60 * 60 * 1000;

function setSessionCookie(response, token) {
  response.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: TOKEN_MAX_AGE,
    path: "/api"
  });
}

function clearSessionCookie(response) {
  response.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api"
  });
}

function validName(value) {
  return typeof value === "string" && value.trim().length >= 2 && value.trim().length <= 80;
}

function validPassword(value) {
  return (
    typeof value === "string" &&
    value.length >= 8 &&
    Buffer.byteLength(value, "utf8") <= 72
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export async function register(request, response, next) {
  const { name, email, password } = request.body ?? {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!validName(name)) {
    return response.status(400).json({ message: "Name must be between 2 and 80 characters." });
  }
  if (normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail)) {
    return response.status(400).json({ message: "Enter a valid email address." });
  }
  if (!validPassword(password)) {
    return response.status(400).json({
      message: "Password must be at least 8 characters and no more than 72 UTF-8 bytes."
    });
  }

  try {
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "user"
    });
    setSessionCookie(response, createAccessToken(user));
    return response.status(201).json({
      user: publicUser(user)
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return response.status(409).json({ message: "An account with this email already exists." });
    }
    return next(error);
  }
}

export async function login(request, response, next) {
  const { email, password } = request.body ?? {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (
    normalizedEmail.length > 254 ||
    !emailPattern.test(normalizedEmail) ||
    typeof password !== "string" ||
    password.length === 0 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return response.status(400).json({ message: "Enter a valid email address and password." });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return response.status(401).json({ message: "Invalid email or password." });
    }

    setSessionCookie(response, createAccessToken(user));
    return response.json({
      user: publicUser(user)
    });
  } catch (error) {
    return next(error);
  }
}

export function getCurrentUser(request, response) {
  return response.json({ user: request.user ?? null });
}

export function logout(_request, response) {
  clearSessionCookie(response);
  return response.status(204).end();
}
