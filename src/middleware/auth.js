const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const userIdHeader = req.headers["x-user-id"];

  if (!token && !userIdHeader) {
    return res.status(401).json({ message: "Missing authentication" });
  }

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.authUserId = payload.sub;
      req.authRole = payload.role;
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  }

  req.authUserId = req.authUserId || userIdHeader;

  if (userIdHeader && req.authUserId && userIdHeader !== req.authUserId) {
    return res.status(403).json({ message: "User mismatch" });
  }

  console.log("[AUTH] authUserId:", req.authUserId, "from token:", !!token, "from header:", !!userIdHeader);

  return next();
}

module.exports = {
  requireAuth
};
