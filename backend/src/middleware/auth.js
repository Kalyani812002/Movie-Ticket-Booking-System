import User from "../models/User.js";
import { verifyAccessToken } from "../services/authService.js";

export async function authenticate(request, response, next) {
  const authorization = request.get("authorization") || "";
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  const token = request.cookies?.cinebook_session || match?.[1];
  if (!token) {
    return response.status(401).json({ message: "Authentication is required." });
  }

  try {
    const payload = verifyAccessToken(token);
    if (!payload || typeof payload !== "object" || typeof payload.sub !== "string") {
      return response.status(401).json({ message: "Invalid or expired access token." });
    }

    const user = await User.findById(payload.sub).select("name email role").lean();
    if (!user) {
      return response.status(401).json({ message: "Invalid or expired access token." });
    }

    request.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return response.status(401).json({ message: "Invalid or expired access token." });
    }
    return next(error);
  }
}

export function authorizeRoles(...allowedRoles) {
  if (allowedRoles.length === 0 || allowedRoles.some((role) => !["user", "admin"].includes(role))) {
    throw new Error("authorizeRoles requires one or more valid roles.");
  }

  return function roleAuthorization(request, response, next) {
    if (!request.user) {
      return response.status(401).json({ message: "Authentication is required." });
    }
    if (!allowedRoles.includes(request.user.role)) {
      return response.status(403).json({ message: "You do not have permission to access this resource." });
    }
    return next();
  };
}
