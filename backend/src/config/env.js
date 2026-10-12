import "dotenv/config";

function parsePort(value) {
  const port = Number(value ?? 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return port;
}

function parseClientOrigin(clientUrl) {
  try {
    const parsedUrl = new URL(clientUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error();
    }
    return parsedUrl.origin;
  } catch {
    throw new Error("CLIENT_URL and CLIENT_URLS must contain valid HTTP or HTTPS origins.");
  }
}

export function getClientOrigins() {
  const primaryClientUrl = process.env.CLIENT_URL?.trim();
  if (!primaryClientUrl) {
    throw new Error("CLIENT_URL is required. Set it in backend/.env.");
  }

  const additionalClientUrls = (process.env.CLIENT_URLS ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  return [...new Set([primaryClientUrl, ...additionalClientUrls].map(parseClientOrigin))];
}

export function getClientOrigin() {
  return getClientOrigins()[0];
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
