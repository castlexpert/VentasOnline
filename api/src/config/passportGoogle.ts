import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "../env.js";
import { UserQuote } from "../models/index.js";

export function configureGoogleAuth(): void {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return;

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL
      },
      async (_access, _refresh, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase().trim();
          if (!email) return done(new Error("No email in Google profile"));

          let u = await UserQuote.findByPk(email);
          if (!u) {
            u = await UserQuote.create({
              user_quote: email,
              name: profile.name?.givenName || profile.displayName || "Usuario",
              apellido1: profile.name?.familyName || "-",
              apellido2: null,
              phone: "",
              phone2: null,
              direccion: null,
              ind_sync: false
            });
          }
          return done(null, u);
        } catch (e) {
          return done(e as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, (user as UserQuote).user_quote);
  });

  passport.deserializeUser(async (email: string, done) => {
    try {
      const u = await UserQuote.findByPk(email);
      done(null, u);
    } catch (e) {
      done(e as Error);
    }
  });
}
