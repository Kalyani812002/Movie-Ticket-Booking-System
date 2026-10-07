import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/env.js";

const TOKEN_ISSUER = "cinebook-api";
const TOKEN_AUDIENCE = "cinebook-client";

export function createAccessToken(user) {
  return jwt.sign({}, getJwtSecret(), {
    algorithm: "HS256",
    subject: user._id.toString(),
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    expiresIn: "1d"
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: ["HS256"],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE
  });
}
