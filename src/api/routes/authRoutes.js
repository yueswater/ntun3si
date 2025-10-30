import express from "express";
import passport from "../middleware/passport.js";

const router = express.Router();

// Google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = req.user.token;
    const user = req.user.user;
    const redirectUrl = `${
      process.env.FRONTEND_URL
    }/auth/success?token=${token}&user=${encodeURIComponent(
      JSON.stringify(user)
    )}`;
    res.redirect(redirectUrl);
  }
);

// Facebook login
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  (req, res) => {
    const { token, user } = req.user;
    const redirectUrl = `${
      process.env.FRONTEND_URL
    }/auth/success?token=${token}&user=${encodeURIComponent(
      JSON.stringify(user)
    )}`;
    res.redirect(redirectUrl);
  }
);

export default router;
