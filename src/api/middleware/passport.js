import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const GOOGLE_CALLBACK_URL = `${process.env.BASE_URL}/api/auth/google/callback`;
const FACEBOOK_CALLBACK_URL = `${process.env.BASE_URL}/api/auth/facebook/callback`;

/* Google Strategy */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            username: `google_${profile.id}`,
            name: profile.displayName,
            email,
            password: null,
            role: "member",
            emailVerified: true,
            provider: "google",
          });
        }

        const token = jwt.sign(
          { uid: user.uid, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        done(null, { user, token });
      } catch (error) {
        done(error, null);
      }
    }
  )
);

/* Facebook Strategy */
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "http://localhost:5050/api/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "picture.type(large)"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = `${profile.name.givenName || ""} ${
          profile.name.familyName || ""
        }`;
        const avatar = profile.photos?.[0]?.value;

        // Find or create user
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            username: profile.id,
            name,
            email,
            avatar,
            password: "", // Not required for OAuth users
            isVerified: true,
          });
        }

        const token = generateToken(user);
        done(null, { user, token });
      } catch (error) {
        done(error, null);
      }
    }
  )
);

export default passport;
