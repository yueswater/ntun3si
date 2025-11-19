import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Authenticate user by checking JWT token
 */
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ uid: decoded.uid }).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

/**
 * Allow only admin role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

/**
 * Allow user to access only their own data, or admin
 * (用在 PUT /users/:uid)
 */
export const requireSelfOrAdmin = (req, res, next) => {
  const targetUid = req.params.uid;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // 本人 或 管理員
  if (req.user.uid === targetUid || req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({ message: "Forbidden" });
};
