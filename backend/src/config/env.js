import "dotenv/config";

function parsePort(value) {
  const port = Number(value ?? 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return port;
}

export function getClientOrigin() {
  const clientUrl = process.env.CLIENT_URL?.trim();
  if (!clientUrl) {
    throw new Error("CLIENT_URL is required. Set it in backend/.env.");
  }
  try {
    const parsedUrl = new URL(clientUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error();
    }
    return parsedUrl.origin;
  } catch {
    throw new Error("CLIENT_URL must be a valid HTTP or HTTPS origin.");
  }
}

export function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;
  if (typeof jwtSecret !== "string" || Buffer.byteLength(jwtSecret, "utf8") < 32) {
    throw new Error("JWT_SECRET must be set to a secret of at least 32 bytes.");
  }
  return jwtSecret;
}

export function getConfig() {
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required. Set it in backend/.env.");
  }

  return {
    port: parsePort(process.env.PORT),
    mongoUri,
    clientUrl: getClientOrigin(),
    jwtSecret: getJwtSecret()
  };
}
