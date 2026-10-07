export function notFound(request, response) {
  response.status(404).json({
    message: `Route not found: ${request.method} ${request.originalUrl}`
  });
}

export function errorHandler(error, _request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  console.error(error);

  let status = Number.isInteger(error.statusCode) ? error.statusCode : error.status;
  let message = error.message || "The request could not be completed.";

  if (error.name === "ValidationError" || error.name === "CastError") {
    status = 400;
  } else if (error.code === 11000) {
    status = 409;
    message = "A record with that value already exists.";
  } else if (error.type === "entity.parse.failed") {
    status = 400;
    message = "Request body contains invalid JSON.";
  } else if (error.message === "Not allowed by CORS") {
    status = 403;
    message = "This origin is not allowed.";
  }

  if (!Number.isInteger(status) || status < 400 || status > 599) {
    status = 500;
  }

  return response.status(status).json({
    message: status >= 500 ? "Something went wrong. Please try again." : message
  });
}
