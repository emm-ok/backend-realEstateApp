import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../modules/user/user.model.js";
import { env } from "./env.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const image = profile.photos?.[0]?.value.replace("=s96-c", "=s400-c");

        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            provider: "google",
            image,
          });
        } else {
          // Sync google image if missing
          if (!user.image && image) {
            user.image = image;
          }

          if (!user.googleId) {
            user.googleId = profile.id;
            user.provider = "google";
          }

          await user.save();
        }

        if (!profile.emails?.[0]?.verified) {
          return done(new Error("Goole account email not verified"));
        }

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    },
  ),
);

export default passport;
