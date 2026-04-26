function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
    ...(error.details ? { details: error.details } : {}),
    ...(process.env.NODE_ENV === "development" && error.stack
      ? { stack: error.stack }
      : {}),
  });
}

module.exports = { errorHandler };
