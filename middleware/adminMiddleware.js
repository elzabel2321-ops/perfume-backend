const adminOnly = (req, res, next) => {
  // User must be authenticated first
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      message: "Authentication required",
    });
  }

  // User must be admin
  if (req.user.role !== "admin" && req.user.role !== "admnin") {
    return res.status(403).json({
      ok: false,
      message: "Admin access required",
    });
  }

  // Admin is allowed
  next();
};

module.exports = adminOnly;