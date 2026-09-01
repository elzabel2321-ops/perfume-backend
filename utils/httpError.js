class HttpError extends Error {
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

function sendError(res, error) {
  if (error.name === "CastError") {
    return res.status(400).json({
      ok: false,
      success: false,
      message: "Invalid ID",
    });
  }

  const status = error.status || 500;
  const payload = {
    ok: false,
    success: false,
    message:
      status >= 500 && !error.status
        ? "Something went wrong. Please try again."
        : error.message || "Request failed",
    ...(error.extra || {}),
  };

  if (status >= 500) {
    console.error("SERVER ERROR:", error);
  }

  return res.status(status).json(payload);
}

module.exports = { HttpError, sendError };
