import jwt from "jsonwebtoken";

/**
 * Middleware for verifying JWT token
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

/**
 * Restrict route to admin users only
 */
export function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  }
  next();
}

/**
 * Optional authentication middleware
 * Attaches user to req if token is valid, but doesn't reject if no token
 * Useful for routes that work differently for logged-in vs anonymous users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      // No token, continue as anonymous
      req.user = null;
      return next();
    }

    // Verify token if present
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Invalid token, continue as anonymous
    req.user = null;
    next();
  }
};
