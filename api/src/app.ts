import path from "path";
import express from "express";
import { z } from "zod";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import pg from "pg";
import bcrypt from "bcrypt";
import multer from "multer";
import { body, param, query, validationResult } from "express-validator";
import { Op, QueryTypes, UniqueConstraintError } from "sequelize";
import { env } from "./env.js";
import { sequelize } from "./db/sequelize.js";
import { sqlSetSearchPath } from "./db/pgSchema.js";
import {
  Product,
  ProductCategory,
  Store,
  UserAdmin,
  UserQuote,
  Quoter,
  Quote
} from "./models/index.js";
import { CMS_PAGES } from "./fixtures/cmsPages.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { sendQuoteEmail, trimSendDetail } from "./services/emailResend.js";
import { configureGoogleAuth } from "./config/passportGoogle.js";
import { generateChatbotReply } from "./chatbot.js";
import {
  answerWithLlm,
  embedQueryText,
  formatSiteFallbackAnswer,
  formatSitePagesForContext,
  searchSitePagesByEmbedding
} from "./siteIndex.js";
import { notifyAdvisorWhatsApp } from "./whatsapp.js";

const PgSession = connectPgSimple(session);
const EIGHT_HOURS = 8 * 60 * 60 * 1000;

function v(req: Parameters<typeof validationResult>[0]): boolean {
  return validationResult(req).isEmpty();
}

function badValidation(req: Parameters<typeof validationResult>[0], res: express.Response) {
  res.status(400).json({ error: "Validation failed", details: validationResult(req).array() });
}

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isDev = (env.NODE_ENV || "development") !== "production";
        if (isDev && /^https?:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
        if (origin === env.CORS_ORIGIN) return callback(null, true);
        return callback(new Error("CORS not allowed"));
      },
      credentials: true
    })
  );

  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : undefined
  });

  const sessionSearchPath = sqlSetSearchPath(env.DB_SCHEMA);
  pool.on("connect", (client) => {
    void client.query(sessionSearchPath);
  });

  app.use(
    session({
      store: new PgSession({ pool, tableName: "session", createTableIfMissing: false }),
      name: "venta_online.sid",
      secret: env.JWT_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: EIGHT_HOURS,
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "lax" : "lax"
      }
    }) as unknown as express.RequestHandler
  );

  configureGoogleAuth();
  app.use(passport.initialize() as unknown as express.RequestHandler);
  app.use(passport.session() as unknown as express.RequestHandler);

  const uploadRoot = path.join(process.cwd(), "public", "uploads", "productos");
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_a, _b, cb) => cb(null, uploadRoot),
      filename: (_req, file, cb) => {
        const safe = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        cb(null, safe);
      }
    }),
    limits: { fileSize: 12 * 1024 * 1024 }
  });

  app.use(express.json({ limit: "2mb" }));
  app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  /** --- Public CMS (fixture) --- */
  app.get("/api/pages/:slug", (req, res) => {
    const slug = String(req.params.slug || "");
    const page = CMS_PAGES[slug];
    if (!page) return res.status(404).json({ error: "Not found" });
    res.json(page);
  });

  /** --- Catalog --- */
  app.get(
    "/api/product-categories",
    query("language").isIn(["ESPA", "ENGL"]),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const q = req.query ?? {};
        const language = String(q.language) as "ESPA" | "ENGL";
        const rows = await ProductCategory.findAll({
          where: { language },
          order: [["des_category", "ASC"]]
        });
        res.json(rows.map((c) => ({ id_category: c.id_category, des_category: c.des_category, language: c.language })));
      } catch (e) {
        next(e);
      }
    }
  );

  app.get(
    "/api/products",
    query("language").isIn(["ESPA", "ENGL"]),
    query("categoryId").optional().isInt(),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const q = req.query ?? {};
        const language = String(q.language) as "ESPA" | "ENGL";
        const categoryId = q.categoryId ? Number(q.categoryId) : undefined;
        const where: Record<string, unknown> = { language };
        if (categoryId) where.id_category = categoryId;
        const rows = await Product.findAll({
          where,
          include: [{ model: ProductCategory, as: "category" }],
          order: [["id_product", "ASC"]]
        });
        res.json(rows);
      } catch (e) {
        next(e);
      }
    }
  );

  app.get("/api/products/:id", param("id").isInt(), async (req, res, next) => {
    try {
      if (!v(req)) return badValidation(req, res);
      const id = Number((req.params ?? {}).id);
      const product = await Product.findByPk(id, {
        include: [{ model: ProductCategory, as: "category" }]
      });
      if (!product) return res.status(404).json({ error: "Not found" });
      res.json(product);
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/stores", async (_req, res, next) => {
    try {
      const stores = await Store.findAll({ order: [["name", "ASC"]] });
      res.json(stores);
    } catch (e) {
      next(e);
    }
  });

  /** --- Quote user auth (email + phone match, sin columna password en esquema) --- */
  app.post(
    "/api/auth/register",
    body("email").isEmail(),
    body("name").isString().trim().isLength({ min: 1 }),
    body("apellido1").isString().trim().isLength({ min: 1 }),
    body("phone").isString().trim().isLength({ min: 6 }),
    body("apellido2").optional().isString(),
    body("phone2").optional().isString(),
    body("direccion").optional().isString(),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const email = String(req.body.email).toLowerCase().trim();
        const [u, created] = await UserQuote.findOrCreate({
          where: { user_quote: email },
          defaults: {
            user_quote: email,
            name: req.body.name,
            apellido1: req.body.apellido1,
            apellido2: req.body.apellido2 || null,
            phone: req.body.phone,
            phone2: req.body.phone2 || null,
            direccion: req.body.direccion || null,
            ind_sync: false
          }
        });
        if (!created) {
          return res.status(409).json({ error: "El correo ya está registrado. Use Iniciar sesión." });
        }
        req.session.quoteUser = u.user_quote;
        res.json({ ok: true, user: { email: u.user_quote, name: u.name } });
      } catch (e) {
        next(e);
      }
    }
  );

  app.post(
    "/api/auth/login",
    body("email").isEmail(),
    body("phone").isString().trim().isLength({ min: 6 }),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const email = String(req.body.email).toLowerCase().trim();
        const phone = String(req.body.phone).trim();
        const u = await UserQuote.findByPk(email);
        if (!u || u.phone !== phone) {
          return res.status(401).json({ error: "Credenciales inválidas" });
        }
        req.session.quoteUser = u.user_quote;
        res.json({ ok: true, user: { email: u.user_quote, name: u.name } });
      } catch (e) {
        next(e);
      }
    }
  );

  app.post("/api/auth/logout", (req, res, next) => {
    req.session.quoteUser = undefined;
    if (req.user) {
      req.logout((err) => {
        if (err) return next(err);
        res.json({ ok: true });
      });
    } else {
      res.json({ ok: true });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session.quoteUser && !req.user) return res.json({ user: null });
    const email = req.session.quoteUser || (req.user as UserQuote)?.user_quote;
    if (!email) return res.json({ user: null });
    UserQuote.findByPk(email).then((u) => {
      if (!u) return res.json({ user: null });
      res.json({
        user: {
          email: u.user_quote,
          name: u.name,
          apellido1: u.apellido1,
          phone: u.phone,
          needsPhone: !u.phone || u.phone.length < 6
        }
      });
    });
  });

  /** Google OAuth */
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    app.get(
      "/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] }) as unknown as express.RequestHandler
    );

    app.get(
      "/auth/google/callback",
      passport.authenticate("google", { failureRedirect: `${env.FRONTEND_URL}/?auth=fail` }) as unknown as express.RequestHandler,
      (req, res) => {
        const u = req.user as UserQuote;
        if (u?.user_quote) req.session.quoteUser = u.user_quote;
        res.redirect(`${env.FRONTEND_URL}/?auth=ok`);
      }
    );
  }

  app.post(
    "/api/auth/complete-phone",
    body("phone").isString().trim().isLength({ min: 6 }),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const email = req.session.quoteUser;
        if (!email) return res.status(401).json({ error: "No session" });
        const u = await UserQuote.findByPk(email);
        if (!u) return res.status(404).json({ error: "Usuario no encontrado" });
        await u.update({ phone: req.body.phone });
        res.json({ ok: true });
      } catch (e) {
        next(e);
      }
    }
  );

  /** --- Quotes (cart submit) --- */
  app.post(
    "/api/quotes",
    body("id_store").isInt(),
    body("det_quote").optional().isString(),
    body("items").isArray({ min: 1 }),
    body("items.*.id_product").isInt(),
    body("items.*.quantity").isFloat({ min: 0.01 }),
    body("items.*.note").optional().isString(),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const email = req.session.quoteUser;
        if (!email) return res.status(401).json({ error: "Debe iniciar sesión" });
        const uq = await UserQuote.findByPk(email);
        if (!uq || !uq.phone || uq.phone.length < 6) {
          return res.status(400).json({ error: "Complete su teléfono en el perfil" });
        }
        const id_store = Number(req.body.id_store);
        const det_quote = String(req.body.det_quote || "");
        const items = req.body.items as { id_product: number; quantity: number; note?: string }[];

        const store = await Store.findByPk(id_store);
        if (!store) return res.status(400).json({ error: "Tienda inválida" });
        const quoter = await Quoter.findOne({ where: { id_store } });
        if (!quoter) return res.status(503).json({ error: "Sin cotizador para esta tienda" });

        const today = new Date();
        const rows: Quote[] = [];
        const lineDisplayNames: string[] = [];
        for (const it of items) {
          const prod = await Product.findByPk(it.id_product);
          if (!prod) return res.status(400).json({ error: `Producto ${it.id_product} no existe` });
          lineDisplayNames.push(prod.name_product || `Producto #${prod.id_product}`);
          const unit = prod.amount != null ? Number(prod.amount) : 0;
          const line = Math.round(unit * it.quantity * 100) / 100;
          const qrow = await Quote.create({
            user_quote: email,
            id_store,
            id_product: prod.id_product,
            id_category: prod.id_category,
            quote_status: "Solicitada",
            send_detail: null,
            det_quote,
            total_amount: String(line),
            date_quote: today,
            date_last_sync: null
          });
          rows.push(qrow);
        }

        const subject = `Nueva cotización de ${uq.name} ${uq.apellido1} — ${today.toISOString().slice(0, 10)}`;
        const cc = (quoter.cc_email || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const html = buildQuoteHtml({ uq, store, items: req.body.items, det_quote, productRows: rows, lineDisplayNames });

        const send = await sendQuoteEmail({ to: quoter.email_quoter, cc, subject, html });
        const msg500 = send.ok ? "" : trimSendDetail(send.ok === false ? send.error : "", 500);

        const status: "Enviada" | "Error" = send.ok ? "Enviada" : "Error";
        await Quote.update(
          { quote_status: status, send_detail: msg500 || null, date_last_sync: today },
          { where: { user_quote: email, quote_id: { [Op.in]: rows.map((r) => r.quote_id) } } }
        );

        if (!send.ok) {
          return res.status(502).json({ ok: false, error: "No se pudo enviar el correo", detail: msg500 });
        }
        res.status(201).json({ ok: true, quoteIds: rows.map((r) => r.quote_id) });
      } catch (e) {
        next(e);
      }
    }
  );

  function buildQuoteHtml(args: {
    uq: UserQuote;
    store: Store;
    items: { id_product: number; quantity: number; note?: string }[];
    det_quote: string;
    productRows: Quote[];
    lineDisplayNames: string[];
  }) {
    let body = `<table border="1" cellpadding="6"><tr><th>Producto</th><th>Cant.</th><th>Nota</th><th>Total línea</th></tr>`;
    args.items.forEach((it, i) => {
      const tr = args.productRows[i];
      const label = escapeHtml(args.lineDisplayNames[i] || `Producto #${it.id_product}`);
      body += `<tr><td>${label}</td><td>${it.quantity}</td><td>${it.note || ""}</td><td>${tr?.total_amount ?? ""}</td></tr>`;
    });
    body += `</table><p><b>Detalle general:</b> ${escapeHtml(args.det_quote)}</p>`;
    body += `<p><b>Cliente:</b> ${escapeHtml(args.uq.name)} ${escapeHtml(args.uq.apellido1)}<br/>Email: ${escapeHtml(args.uq.user_quote)}<br/>Tel: ${escapeHtml(args.uq.phone)}</p>`;
    body += `<p><b>Tienda:</b> ${escapeHtml(args.store.name)} — ${escapeHtml(args.store.address)}</p>`;
    return `<!DOCTYPE html><html><body>${body}</body></html>`;
  }

  function buildQuoteResendHtml(args: {
    uq: UserQuote;
    store: Store;
    product: Product;
    quote: Quote;
  }) {
    const pname = escapeHtml(args.product.name_product || `#${args.product.id_product}`);
    const body =
      `<table border="1" cellpadding="6">` +
      `<tr><th>Producto</th><th>Total línea</th></tr>` +
      `<tr><td>${pname} (id ${args.product.id_product})</td><td>${escapeHtml(String(args.quote.total_amount))}</td></tr>` +
      `</table>` +
      `<p><b>Detalle:</b> ${escapeHtml(String(args.quote.det_quote || ""))}</p>` +
      `<p><b>Cliente:</b> ${escapeHtml(args.uq.name)} ${escapeHtml(args.uq.apellido1)}<br/>Email: ${escapeHtml(args.uq.user_quote)}<br/>Tel: ${escapeHtml(args.uq.phone)}</p>` +
      `<p><b>Tienda:</b> ${escapeHtml(args.store.name)} — ${escapeHtml(args.store.address)}</p>` +
      `<p style="font-size:12px;color:#555">Reenvío automático desde panel admin.</p>`;
    return `<!DOCTYPE html><html><body>${body}</body></html>`;
  }

  function escapeHtml(s: string) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** --- Admin --- */
  async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (!req.session.adminUser) return res.status(401).json({ error: "Unauthorized" });
    next();
  }

  app.post(
    "/api/admin/login",
    body("user").isString().trim().isLength({ min: 1 }),
    body("password").isString().isLength({ min: 1 }),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const row = await UserAdmin.findByPk(req.body.user);
        if (!row || row.ind_status !== "ACTIVO") return res.status(401).json({ error: "Credenciales inválidas" });
        const ok = await bcrypt.compare(req.body.password, row.password);
        if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });
        req.session.adminUser = row.user;
        res.json({ ok: true, user: row.user });
      } catch (e) {
        next(e);
      }
    }
  );

  app.post("/api/admin/logout", requireAdmin, (req, res) => {
    req.session.adminUser = undefined;
    res.json({ ok: true });
  });

  app.get("/api/admin/me", requireAdmin, async (req, res, next) => {
    try {
      const row = await UserAdmin.findByPk(req.session.adminUser!);
      if (!row) return res.status(401).json({ error: "Unauthorized" });
      res.json({ user: row.user, name: row.name, status: row.ind_status });
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res, next) => {
    try {
      const [quotes, pending, products] = await Promise.all([
        Quote.count(),
        Quote.count({ where: { quote_status: { [Op.in]: ["Solicitada", "Error"] } } }),
        Product.count()
      ]);
      res.json({ totalQuotes: quotes, pendingQuotes: pending, activeProducts: products });
    } catch (e) {
      next(e);
    }
  });

  app.get(
    "/api/admin/stats/quotes-by-store",
    requireAdmin,
    query("month").optional().matches(/^\d{4}-\d{2}$/),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const now = new Date();
        const def = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const ym = String((req.query as { month?: string }).month || def);
        const [yStr, mStr] = ym.split("-");
        const y = Number(yStr);
        const mo = Number(mStr);
        const lastDay = new Date(y, mo, 0).getDate();
        const startStr = `${y}-${String(mo).padStart(2, "0")}-01`;
        const endStr = `${y}-${String(mo).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

        const rows = await sequelize.query<{ id_store: number; name: string; count: string }>(
          `
          SELECT p."id_store", p."name", COALESCE(c.cnt, 0)::text AS count
          FROM "W1_store" p
          LEFT JOIN (
            SELECT q."id_store", COUNT(*)::int AS cnt
            FROM "W1_quote" q
            WHERE q."date_quote" BETWEEN :start AND :end
            GROUP BY q."id_store"
          ) c ON c."id_store" = p."id_store"
          ORDER BY p."name" ASC
          `,
          { replacements: { start: startStr, end: endStr }, type: QueryTypes.SELECT }
        );

        res.json({
          month: ym,
          items: rows.map((r) => ({
            id_store: r.id_store,
            storeName: r.name,
            count: Number(r.count) || 0
          }))
        });
      } catch (e) {
        next(e);
      }
    }
  );

  app.get(
    "/api/admin/categories",
    requireAdmin,
    query("language").optional().isIn(["ESPA", "ENGL"]),
    async (req, res, next) => {
      try {
        const lang = req.query.language as "ESPA" | "ENGL" | undefined;
        const rows = await ProductCategory.findAll({
          where: lang ? { language: lang } : {},
          order: [["id_category", "ASC"]]
        });
        res.json(rows);
      } catch (e) {
        next(e);
      }
    }
  );

  app.post(
    "/api/admin/categories",
    requireAdmin,
    body("des_category").isString().trim().isLength({ min: 1 }),
    body("language").isIn(["ESPA", "ENGL"]),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const c = await ProductCategory.create({
          des_category: req.body.des_category,
          language: req.body.language
        });
        res.status(201).json(c);
      } catch (e) {
        next(e);
      }
    }
  );

  app.put(
    "/api/admin/categories/:id",
    requireAdmin,
    param("id").isInt(),
    body("des_category").optional().isString(),
    body("language").optional().isIn(["ESPA", "ENGL"]),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const c = await ProductCategory.findByPk(req.params.id);
        if (!c) return res.status(404).json({ error: "Not found" });
        await c.update({
          des_category: req.body.des_category ?? c.des_category,
          language: req.body.language ?? c.language
        });
        res.json(c);
      } catch (e) {
        next(e);
      }
    }
  );

  app.delete("/api/admin/categories/:id", requireAdmin, param("id").isInt(), async (req, res, next) => {
    try {
      if (!v(req)) return badValidation(req, res);
      const n = await ProductCategory.destroy({ where: { id_category: req.params.id } });
      res.json({ deleted: n });
    } catch (e) {
      next(e);
    }
  });

  app.get(
    "/api/admin/products",
    requireAdmin,
    query("language").optional().isIn(["ESPA", "ENGL"]),
    query("categoryId").optional().isInt(),
    async (req, res, next) => {
      try {
        const where: Record<string, unknown> = {};
        if (req.query.language) where.language = req.query.language;
        if (req.query.categoryId) where.id_category = Number(req.query.categoryId);
        const rows = await Product.findAll({
          where,
          include: [{ model: ProductCategory, as: "category" }],
          order: [["id_product", "ASC"]]
        });
        res.json(rows);
      } catch (e) {
        next(e);
      }
    }
  );

  app.post(
    "/api/admin/products",
    requireAdmin,
    upload.fields([
      { name: "image", maxCount: 1 },
      { name: "pdf", maxCount: 1 }
    ]) as unknown as express.RequestHandler,
    body("id_category").isInt(),
    body("name_product").isString(),
    body("language").isIn(["ESPA", "ENGL"]),
    body("desc_product").optional().isString(),
    body("det_product").optional().isString(),
    body("amount").optional(),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const files = req.files as Record<string, Express.Multer.File[]> | undefined;
        const img = files?.image?.[0];
        const pdf = files?.pdf?.[0];
        const p = await Product.create({
          id_category: Number(req.body.id_category),
          name_product: req.body.name_product,
          desc_product: req.body.desc_product || null,
          det_product: req.body.det_product || null,
          amount: req.body.amount ? String(req.body.amount) : null,
          language: req.body.language,
          img_path_name: img ? `/uploads/productos/${img.filename}` : null,
          pdf_path_name: pdf ? `/uploads/productos/${pdf.filename}` : null
        });
        res.status(201).json(p);
      } catch (e) {
        next(e);
      }
    }
  );

  app.put(
    "/api/admin/products/:id",
    requireAdmin,
    param("id").isInt(),
    upload.fields([
      { name: "image", maxCount: 1 },
      { name: "pdf", maxCount: 1 }
    ]) as unknown as express.RequestHandler,
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const p = await Product.findByPk(req.params.id);
        if (!p) return res.status(404).json({ error: "Not found" });
        const files = req.files as Record<string, Express.Multer.File[]> | undefined;
        const img = files?.image?.[0];
        const pdf = files?.pdf?.[0];
        await p.update({
          id_category: req.body.id_category != null ? Number(req.body.id_category) : p.id_category,
          name_product: req.body.name_product ?? p.name_product,
          desc_product: req.body.desc_product ?? p.desc_product,
          det_product: req.body.det_product ?? p.det_product,
          amount: req.body.amount != null ? String(req.body.amount) : p.amount,
          language: req.body.language ?? p.language,
          img_path_name: img ? `/uploads/productos/${img.filename}` : p.img_path_name,
          pdf_path_name: pdf ? `/uploads/productos/${pdf.filename}` : p.pdf_path_name
        });
        res.json(p);
      } catch (e) {
        next(e);
      }
    }
  );

  app.delete("/api/admin/products/:id", requireAdmin, param("id").isInt(), async (req, res, next) => {
    try {
      if (!v(req)) return badValidation(req, res);
      await Product.destroy({ where: { id_product: req.params.id } });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/admin/stores", requireAdmin, async (_req, res, next) => {
    try {
      res.json(await Store.findAll({ order: [["name", "ASC"]] }));
    } catch (e) {
      next(e);
    }
  });

  app.post(
    "/api/admin/stores",
    requireAdmin,
    body("name").isString(),
    body("address").isString(),
    body("phone").isString(),
    body("email").isEmail(),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const p = await Store.create({ ...req.body, createdAt: new Date() });
        res.status(201).json(p);
      } catch (e) {
        next(e);
      }
    }
  );

  app.put("/api/admin/stores/:id", requireAdmin, param("id").isInt(), async (req, res, next) => {
    try {
      const p = await Store.findByPk(req.params.id);
      if (!p) return res.status(404).json({ error: "Not found" });
      await p.update(req.body);
      res.json(p);
    } catch (e) {
      next(e);
    }
  });

  app.delete("/api/admin/stores/:id", requireAdmin, param("id").isInt(), async (req, res, next) => {
    try {
      await Store.destroy({ where: { id_store: req.params.id } });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/admin/quoters", requireAdmin, async (_req, res, next) => {
    try {
      const rows = await Quoter.findAll({ include: [{ model: Store, as: "store" }] });
      res.json(rows);
    } catch (e) {
      next(e);
    }
  });

  app.post(
    "/api/admin/quoters",
    requireAdmin,
    body("email_quoter").isEmail(),
    body("id_store").isInt(),
    body("name").isString(),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const q = await Quoter.create(req.body);
        res.status(201).json(q);
      } catch (e) {
        next(e);
      }
    }
  );

  app.put(
    "/api/admin/quoters/:email/:id_store",
    requireAdmin,
    async (req, res, next) => {
      try {
        const oldEmail = decodeURIComponent(req.params.email).trim().toLowerCase();
        const oldPlant = Number(req.params.id_store);
        const row = await Quoter.findOne({
          where: { email_quoter: oldEmail, id_store: oldPlant },
          include: [{ model: Store, as: "store" }]
        });
        if (!row) return res.status(404).json({ error: "Not found" });

        const newEmailRaw = req.body.email_quoter != null ? String(req.body.email_quoter).trim().toLowerCase() : oldEmail;
        const newPlant = req.body.id_store != null ? Number(req.body.id_store) : oldPlant;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmailRaw)) {
          return res.status(400).json({ error: "Correo cotizador inválido" });
        }
        if (!Number.isFinite(newPlant) || newPlant <= 0) {
          return res.status(400).json({ error: "Tienda inválida" });
        }
        const storeExists = await Store.findByPk(newPlant);
        if (!storeExists) return res.status(400).json({ error: "Tienda no existe" });

        const patch = {
          name: req.body.name != null ? String(req.body.name) : row.name,
          apellido1: req.body.apellido1 !== undefined ? req.body.apellido1 : row.apellido1,
          apellido2: req.body.apellido2 !== undefined ? req.body.apellido2 : row.apellido2,
          phone: req.body.phone !== undefined ? req.body.phone : row.phone,
          phone2: req.body.phone2 !== undefined ? req.body.phone2 : row.phone2,
          address: req.body.address !== undefined ? req.body.address : row.address,
          cc_email: req.body.cc_email !== undefined ? req.body.cc_email : row.cc_email
        };

        const emailChanged = newEmailRaw !== oldEmail;
        const plantChanged = newPlant !== oldPlant;

        if (!emailChanged && !plantChanged) {
          await row.update(patch);
          const reloaded = await Quoter.findOne({
            where: { email_quoter: oldEmail, id_store: oldPlant },
            include: [{ model: Store, as: "store" }]
          });
          return res.json(reloaded);
        }

        await sequelize.transaction(async (t) => {
          const dup = await Quoter.findOne({
            where: { email_quoter: newEmailRaw, id_store: newPlant },
            transaction: t
          });
          if (dup) {
            const err = new Error("DUPLICATE_QUOTER");
            (err as { code?: string }).code = "DUPLICATE_QUOTER";
            throw err;
          }
          await Quoter.create(
            {
              email_quoter: newEmailRaw,
              id_store: newPlant,
              ...patch
            },
            { transaction: t }
          );
          await Quoter.destroy({ where: { email_quoter: oldEmail, id_store: oldPlant }, transaction: t });
        });

        const created = await Quoter.findOne({
          where: { email_quoter: newEmailRaw, id_store: newPlant },
          include: [{ model: Store, as: "store" }]
        });
        res.json(created);
      } catch (e: unknown) {
        if ((e as { code?: string })?.code === "DUPLICATE_QUOTER") {
          return res.status(409).json({ error: "Ya existe un cotizador con ese correo y tienda." });
        }
        if (e instanceof UniqueConstraintError) {
          return res.status(409).json({ error: "Ya existe un cotizador con ese correo y tienda." });
        }
        next(e);
      }
    }
  );

  app.delete(
    "/api/admin/quoters/:email/:id_store",
    requireAdmin,
    async (req, res, next) => {
      try {
        await Quoter.destroy({
          where: {
            email_quoter: decodeURIComponent(req.params.email),
            id_store: Number(req.params.id_store)
          }
        });
        res.json({ ok: true });
      } catch (e) {
        next(e);
      }
    }
  );

  app.get(
    "/api/admin/quotes",
    requireAdmin,
    query("status").optional().isString(),
    query("id_store").optional().isInt(),
    query("date_from").optional().isString(),
    query("date_to").optional().isString(),
    async (req, res, next) => {
      try {
        const whereParts: Record<string, unknown>[] = [];
        const q = req.query ?? {};
        if (q.status) whereParts.push({ quote_status: q.status });
        if (q.id_store) whereParts.push({ id_store: Number(q.id_store) });
        const df = (q as { date_from?: string }).date_from;
        const dt = (q as { date_to?: string }).date_to;
        if (df || dt) {
          if (df && dt) {
            whereParts.push({ date_quote: { [Op.between]: [new Date(df), new Date(dt)] } });
          } else if (df) {
            whereParts.push({ date_quote: { [Op.gte]: new Date(df) } });
          } else if (dt) {
            whereParts.push({ date_quote: { [Op.lte]: new Date(dt) } });
          }
        }
        const where = whereParts.length === 0 ? {} : whereParts.length === 1 ? whereParts[0]! : { [Op.and]: whereParts };
        const rows = await Quote.findAll({
          where,
          include: [
            { model: Store, as: "store" },
            { model: Product, as: "product" },
            { model: UserQuote, as: "quoteUser" }
          ],
          order: [["date_quote", "DESC"]],
          limit: 200
        });
        res.json(rows);
      } catch (e) {
        next(e);
      }
    }
  );

  app.get(
    "/api/admin/quotes/detail",
    requireAdmin,
    query("user_quote").isString().trim().isLength({ min: 1 }),
    query("quote_id").isInt(),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const q = req.query ?? {};
        const user_quote = String(q.user_quote);
        const quote_id = Number(q.quote_id);
        const row = await Quote.findOne({
          where: { user_quote, quote_id },
          include: [
            { model: Store, as: "store" },
            { model: Product, as: "product" },
            { model: UserQuote, as: "quoteUser" }
          ]
        });
        if (!row) return res.status(404).json({ error: "Not found" });
        res.json(row);
      } catch (e) {
        next(e);
      }
    }
  );

  app.post(
    "/api/admin/quotes/resend-email",
    requireAdmin,
    body("user_quote").isString().trim().isLength({ min: 1 }),
    body("quote_id").isInt(),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const user_quote = String(req.body.user_quote);
        const quote_id = Number(req.body.quote_id);
        const qrow = await Quote.findOne({
          where: { user_quote, quote_id },
          include: [{ model: Store, as: "store" }, { model: Product, as: "product" }]
        });
        if (!qrow) return res.status(404).json({ error: "Not found" });
        if (qrow.quote_status !== "Error") {
          return res.status(400).json({ error: "Solo se reenvía si el estado es Error" });
        }
        const uq = await UserQuote.findByPk(user_quote);
        if (!uq) return res.status(400).json({ error: "Cliente no encontrado" });
        const store = qrow.store as Store;
        const prod = qrow.product as Product;
        const quoter = await Quoter.findOne({ where: { id_store: qrow.id_store } });
        if (!quoter) return res.status(503).json({ error: "Sin cotizador" });
        const subject = `REENVÍO Cotización ${user_quote} — #${quote_id} — ${new Date().toISOString().slice(0, 10)}`;
        const cc = (quoter.cc_email || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const html = buildQuoteResendHtml({ uq, store, product: prod, quote: qrow });
        const send = await sendQuoteEmail({ to: quoter.email_quoter, cc, subject, html });
        const msg500 = send.ok ? "" : trimSendDetail(send.ok === false ? send.error : "", 500);
        const today = new Date();
        await qrow.update({
          quote_status: send.ok ? "Enviada" : "Error",
          send_detail: msg500 || null,
          date_last_sync: today
        });
        if (!send.ok) return res.status(502).json({ ok: false, error: msg500 });
        res.json({ ok: true });
      } catch (e) {
        next(e);
      }
    }
  );

  app.patch(
    "/api/admin/quotes/:user/:quoteId",
    requireAdmin,
    body("quote_status").isIn(["Solicitada", "Enviada", "Error", "Atendida"]),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const uq = decodeURIComponent(req.params.user);
        await Quote.update(
          { quote_status: req.body.quote_status },
          { where: { user_quote: uq, quote_id: Number(req.params.quoteId) } }
        );
        res.json({ ok: true });
      } catch (e) {
        next(e);
      }
    }
  );

  app.get("/api/admin/users", requireAdmin, async (_req, res, next) => {
    try {
      const rows = await UserAdmin.findAll({ attributes: { exclude: ["password"] } });
      res.json(rows);
    } catch (e) {
      next(e);
    }
  });

  app.post(
    "/api/admin/users",
    requireAdmin,
    body("user").isString(),
    body("password").isString().isLength({ min: 8 }),
    async (req, res, next) => {
      try {
        if (!v(req)) return badValidation(req, res);
        const hash = await bcrypt.hash(req.body.password, 12);
        const row = await UserAdmin.create({
          user: req.body.user,
          password: hash,
          name: req.body.name || null,
          apellido1: req.body.apellido1 || null,
          apellido2: req.body.apellido2 || null,
          phone: req.body.phone || null,
          phone2: req.body.phone2 || null,
          direccion: req.body.direccion || null,
          ind_tip_user: "LOCAL",
          ind_status: "ACTIVO"
        });
        res.status(201).json({ user: row.user });
      } catch (e) {
        next(e);
      }
    }
  );

  app.patch(
    "/api/admin/users/:user/status",
    requireAdmin,
    body("ind_status").isIn(["ACTIVO", "INACTIVO"]),
    async (req, res, next) => {
      try {
        await UserAdmin.update({ ind_status: req.body.ind_status }, { where: { user: req.params.user } });
        res.json({ ok: true });
      } catch (e) {
        next(e);
      }
    }
  );

  app.post(
    "/api/admin/users/:user/reset-password",
    requireAdmin,
    body("password").isString().isLength({ min: 8 }),
    async (req, res, next) => {
      try {
        const hash = await bcrypt.hash(req.body.password, 12);
        await UserAdmin.update({ password: hash }, { where: { user: req.params.user } });
        res.json({ ok: true });
      } catch (e) {
        next(e);
      }
    }
  );

  /** Legacy chat + RAG */
  app.post("/api/chatbot/message", async (req, res, next) => {
    try {
      const Schema = z.object({
        sessionId: z.string().min(5),
        message: z.string().min(1).max(1500)
      });
      const parsed = Schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
      const reply = await generateChatbotReply([{ role: "user", content: parsed.data.message }]);
      res.json({ reply, messageId: `m_${Date.now()}` });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/chat", async (req, res, next) => {
    try {
      const Schema = z.object({
        conversationId: z.string().min(5),
        language: z.enum(["es", "en"]),
        message: z.string().min(1).max(1500)
      });
      const parsed = Schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      const { language, message } = parsed.data;
      let siteRows: any[] = [];
      try {
        const emb = await embedQueryText(message);
        if (emb) siteRows = await searchSitePagesByEmbedding(sequelize, emb, 5);
      } catch {
        siteRows = [];
      }
      const context = siteRows.length ? formatSitePagesForContext(siteRows, language) : "";
      let llmAnswer: string | null = null;
      try {
        llmAnswer = await answerWithLlm({ language, question: message, context, history: [] });
      } catch {
        llmAnswer = null;
      }
      const siteFallback = siteRows.length ? formatSiteFallbackAnswer(siteRows, language) : null;
      const answer =
        llmAnswer ||
        siteFallback ||
        (language === "es"
          ? "Puedo ayudarte con productos, tiendas y cotización."
          : "I can help with products, stores and quotes.");
      res.json({ answer });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/chatbot", async (req, res, next) => {
    try {
      const Schema = z.object({
        message: z.string().min(1).max(4000),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
          .optional(),
        language: z.enum(["es", "en"]).optional(),
        userId: z.string().optional(),
        cartItems: z
          .array(z.object({ id_product: z.number(), quantity: z.number(), note: z.string().optional() }))
          .optional()
      });
      const parsed = Schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      const { message, history, cartItems } = parsed.data;
      const language = (parsed.data.language || detectLang(message, history || [])) as "es" | "en";

      const [catsE, prodsE, storesL] = await Promise.all([
        ProductCategory.findAll({ where: { language: language === "en" ? "ENGL" : "ESPA" } }),
        Product.findAll({
          where: { language: language === "en" ? "ENGL" : "ESPA" },
          include: [{ model: ProductCategory, as: "category" }],
          limit: 200
        }),
        Store.findAll({ order: [["name", "ASC"]] })
      ]);

      const catalog = {
        categories: catsE.map((c) => ({ id: c.id_category, name: c.des_category })),
        products: prodsE.map((p) => ({
          id: p.id_product,
          categoryId: p.id_category,
          name: p.name_product,
          desc: p.desc_product,
          tech: p.det_product,
          price: p.amount != null ? p.amount : null,
          priceNote: p.amount != null ? String(p.amount) : "consultar cotización"
        })),
        stores: storesL.map((pl) => ({
          id: pl.id_store,
          name: pl.name,
          phone: pl.phone,
          email: pl.email,
          address: pl.address
        }))
      };

      const system =
        language === "en"
          ? `You are Tienda Online assistant. Use this JSON catalog only for facts. Never invent prices; if price is null say "ask for a quote". You must guide the user to build and submit a quote.

Return STRICT JSON ONLY (no markdown, no extra text), with this shape:
{
  "reply": "text to show the user",
  "language": "en",
  "actions": [
    { "type": "add_to_cart", "id_product": 123, "quantity": 1, "note": null },
    { "type": "select_store", "id_store": 1 },
    { "type": "set_quote_details", "det_quote": "..." },
    { "type": "submit_quote" }
  ]
}

Rules:
- actions is optional; use it only when the user clearly asked.
- add_to_cart: only when the user asked to add a product; quantity defaults to 1; include note only if user said it.
- select_store: only when user chose a store by name or id; otherwise ask which store.
- set_quote_details: only when user provided project details; otherwise ask for details.
- submit_quote: only when the user confirms sending the quote.

CATALOG:${JSON.stringify(catalog)}`
          : `Eres el asistente Tienda Online. Usa solo este JSON para hechos. Nunca inventes precios; si price es null, di "consultar cotización". Debes guiar al usuario para armar y enviar una cotización.

Devuelve SOLO JSON ESTRICTO (sin markdown ni texto extra), con esta forma:
{
  "reply": "texto para mostrar",
  "language": "es",
  "actions": [
    { "type": "add_to_cart", "id_product": 123, "quantity": 1, "note": null },
    { "type": "select_store", "id_store": 1 },
    { "type": "set_quote_details", "det_quote": "..." },
    { "type": "submit_quote" }
  ]
}

Reglas:
- actions es opcional; úsalo solo si el usuario lo pide claramente.
- add_to_cart: solo si el usuario pidió agregar un producto; quantity por defecto 1; note solo si el usuario lo dijo.
- select_store: solo si el usuario eligió tienda por nombre o id; si no, pregunta cuál tienda.
- set_quote_details: solo si el usuario dio detalles del proyecto; si no, pide detalles.
- submit_quote: solo si el usuario confirma enviar la cotización.

CATALOG:${JSON.stringify(catalog)}`;

      const key = (env.OPENAI_API_KEY || env.OPENIA_API_KEY || "").trim();
      if (!key) {
        return res.json({
          reply: language === "es" ? "Configure OPENAI_API_KEY para el asistente." : "Set OPENAI_API_KEY.",
          action: null,
          productId: null,
          qty: null
        });
      }

      const messages = [
        { role: "system" as const, content: system },
        ...(history || []).slice(-10).map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
        { role: "user" as const, content: message }
      ];

      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: env.OPENAI_MODEL,
          messages,
          temperature: 0.3
        })
      });
      const data = (await openaiRes.json()) as { choices?: { message?: { content?: string } }[] };
      const raw = data.choices?.[0]?.message?.content?.trim() || "{}";
      let parsedJson: any = {};
      try {
        const m = raw.match(/\{[\s\S]*\}/);
        parsedJson = JSON.parse(m ? m[0] : raw);
      } catch {
        parsedJson = { reply: raw };
      }

      const reply: string =
        String(parsedJson.reply || "") ||
        (language === "es" ? "¿En qué producto o tienda puedo ayudarle?" : "How can I help with products or stores?");
      const actions = normalizeChatbotActions(parsedJson, catalog);

      // Back-compat: if model returned legacy fields, map them to actions
      if ((!actions || actions.length === 0) && parsedJson.action === "add_to_cart" && parsedJson.productId) {
        const id_product = Number(parsedJson.productId);
        const nm = catalog.products?.find((p: { id: number }) => p.id === id_product)?.name ?? null;
        actions.push({
          type: "add_to_cart",
          id_product,
          quantity: Number(parsedJson.qty || 1),
          note: null,
          name_product: nm
        });
      }

      res.json({
        reply,
        language,
        actions,
        cartItems: cartItems || []
      });
    } catch (e) {
      next(e);
    }
  });

  function detectLang(message: string, history: { role: "user" | "assistant"; content: string }[]) {
    const sample = [message, ...history.slice(-6).map((h) => h.content)].join(" ").toLowerCase();
    const hasEn = /\b(hi|hello|price|prices|quote|cart|Store|category|categories|products|add)\b/.test(sample);
    const hasEs = /\b(hola|precio|precios|cotiz|carrito|planta|categor[ií]a|categor[ií]as|productos|agregar)\b/.test(
      sample
    );
    if (hasEn && !hasEs) return "en";
    if (hasEs && !hasEn) return "es";
    return "es";
  }

  function normalizeChatbotActions(parsedJson: any, catalog: { products?: { id: number; name: string | null }[] }) {
    const products = Array.isArray(catalog?.products) ? catalog.products : [];
    const nameById = new Map<number, string | null>(products.map((p: { id: number; name: string | null }) => [p.id, p.name]));
    const rawActions = Array.isArray(parsedJson?.actions) ? parsedJson.actions : [];
    const out: any[] = [];
    for (const a of rawActions) {
      if (!a || typeof a !== "object") continue;
      const type = String(a.type || "");
      if (type === "add_to_cart") {
        const id_product = Number(a.id_product);
        if (!Number.isFinite(id_product) || id_product <= 0) continue;
        const quantity = Number(a.quantity ?? 1);
        const q = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
        const note = a.note == null ? null : String(a.note).slice(0, 180);
        const name_product = nameById.has(id_product) ? nameById.get(id_product) ?? null : null;
        out.push({ type, id_product, quantity: q, note, name_product });
      } else if (type === "select_store") {
        const id_store = Number(a.id_store);
        if (!Number.isFinite(id_store) || id_store <= 0) continue;
        out.push({ type, id_store });
      } else if (type === "set_quote_details") {
        const det_quote = String(a.det_quote || "").trim();
        if (!det_quote) continue;
        out.push({ type, det_quote: det_quote.slice(0, 2000) });
      } else if (type === "submit_quote") {
        out.push({ type });
      } else if (type === "go_to_quote_page") {
        out.push({ type });
      }
    }
    return out;
  }

  app.post("/api/handoff", async (req, res, next) => {
    try {
      const Schema = z.object({
        conversationId: z.string().min(5),
        language: z.enum(["es", "en"]),
        phone: z.string().optional(),
        transcript: z.string().optional()
      });
      const parsed = Schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const { language, phone, transcript } = parsed.data;
      const body =
        language === "es"
          ? ["Nuevo contacto desde el chatbot (Tienda Online).", phone ? `WhatsApp: ${phone}` : ""].join("\n")
          : ["New lead from Tienda Online chatbot.", phone ? `WhatsApp: ${phone}` : ""].join("\n");
      try {
        await notifyAdvisorWhatsApp({ body: `${body}\n\n${String(transcript || "").slice(0, 8000)}` });
        res.json({ ok: true });
      } catch (e: any) {
        const code = e?.code;
        if (code === "NO_TWILIO" || code === "NO_WHATSAPP_NUMBERS") return res.status(501).json({ ok: false });
        res.status(503).json({ ok: false });
      }
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/quote-requests", async (req, res) => {
    res.status(410).json({ error: "Deprecated: use /api/quotes con sesión" });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
