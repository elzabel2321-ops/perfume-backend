const crypto = require("crypto");

function expectedInternalSecret() {
  return (
    process.env.INTERNAL_API_SECRET ||
    "aromanova-dev-internal"
  );
}

function requireInternalSecret(req, res, next) {
  const provided = String(
    req.headers["x-internal-secret"] || ""
  );

  const expected = expectedInternalSecret();

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({
      ok: false,
      message: "Forbidden",
    });
  }

  next();
}

module.exports = requireInternalSecret;
