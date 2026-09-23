import "express-session";

declare module "express-session" {
  interface SessionData {
    adminUser?: string;
    quoteUser?: string;
    oauthPendingEmail?: string;
  }
}
