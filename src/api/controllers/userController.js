import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendRegistrationEmail } from "../utils/emailService.js";

/**
 * Register a new user (local signup)
 * User remains unverified until email confirmation
 */
export async function registerUser(req, res) {
  try {
    const { username, name, email, password } = req.body;
    if (!username || !name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const normalizedEmail = email.toLowerCase();

    // Check for existing user by email or username
    const existingEmail = await User.findOne({ email: normalizedEmail });
    const existingUsername = await User.findOne({ username });
    if (existingEmail)
      return res.status(400).json({ message: "Email already registered" });
    if (existingUsername)
      return res.status(400).json({ message: "Username already taken" });

    // Generate verification token (valid for 24 hours)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create unverified user
    const user = await User.create({
      username,
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "member",
      emailVerified: false,
      verificationToken,
      tokenExpiresAt,
    });

    // Build the verification URL
    const verifyUrl = `${process.env.BASE_URL}/api/users/verify?token=${verificationToken}`;

    // Send verification email
    await sendRegistrationEmail(user, verifyUrl);

    res.status(201).json({
      message:
        "Registration successful. Please check your email for a verification link (valid for 24 hours).",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Login user (supports email or username)
 * Requires verified email
 */
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email/username and password are required" });

    // Determine whether the login input is an email or username
    let user;
    if (email.includes("@")) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      user = await User.findOne({ username: email });
    }

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.emailVerified)
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { uid: user.uid, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        uid: user.uid,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Verify email link (token-based)
 */
export async function verifyEmailToken(req, res) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Missing token" });

    const user = await User.findOne({ verificationToken: token });
    if (!user)
      return res.status(400).json({ message: "Invalid or used token" });

    if (user.tokenExpiresAt < Date.now()) {
      return res
        .status(400)
        .json({ message: "Token expired, please re-register" });
    }

    user.emailVerified = true;
    user.verificationToken = null;
    user.tokenExpiresAt = null;
    await user.save();

    return res.redirect(302, `${process.env.FRONTEND_URL}/verify-success`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get user profile (protected route)
 */
export async function getProfile(req, res) {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Update current user's profile
 */
export async function updateMyProfile(req, res) {
  try {
    const allowed = ["name", "email", "phone", "avatar"];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] =
          key === "email" ? req.body[key].toLowerCase() : req.body[key];
      }
    }

    const user = await User.findOneAndUpdate({ uid: req.user.uid }, updates, {
      new: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Delete current user account
 * Prevent deleting the last admin
 */
export async function deleteMyAccount(req, res) {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1)
        return res
          .status(400)
          .json({ message: "Cannot delete the last remaining admin" });
    }

    await User.deleteOne({ uid: req.user.uid });
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Admin-only: Get all users
 */
export async function getAllUsers(req, res) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Admin-only: Get a user by UID
 */
export async function getUserByUid(req, res) {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Admin-only: Update a user by UID
 */
export async function updateUserByUid(req, res) {
  try {
    const { uid } = req.params;
    const updates = req.body;

    if (updates.role === "member") {
      const target = await User.findOne({ uid });
      if (target && target.role === "admin") {
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount <= 1)
          return res
            .status(400)
            .json({ message: "Cannot demote the last remaining admin" });
      }
    }

    const user = await User.findOneAndUpdate({ uid }, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Admin-only: Delete a user by UID
 */
export async function deleteUserByUid(req, res) {
  try {
    const { uid } = req.params;
    const target = await User.findOne({ uid });
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1)
        return res
          .status(400)
          .json({ message: "Cannot delete the last remaining admin" });
    }

    await User.deleteOne({ uid });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
