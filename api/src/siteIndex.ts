import type { Sequelize } from "sequelize";
import { QueryTypes } from "sequelize";
import { env } from "./env.js";

const EMBEDDING_DIM = 1536;

function schemaQualified(table: string) {
  const s = env.DB_SCHEMA.replace(/"/g, "");
  return `"${s}".${table}`;
}

function formatVector(arr: number[]) {
  return `[${arr.join(",")}]`;
}

function getOpenAiKey() {
  return (env.OPENAI_API_KEY || env.OPENIA_API_KEY || "").trim();
}

function getOpenAiModel() {
  return (env.OPENIA_MODEL || env.OPENAI_MODEL || "gpt-4o-mini").trim();
}

function isVectorExtensionUnavailableError(e: unknown): boolean {
  const msg = String((e as { message?: string })?.message ?? e ?? "");
  return (
    msg.includes('extension "vector" is not available') ||
    msg.includes("could not open extension control file") ||
    /Code:\s*`?0A000`?/i.test(msg)
  );
}

/** Ensures pgvector + site_page_index exist. Returns false if pgvector is not installed on the server. */
export async function ensureSiteIndexSchema(sq: Sequelize): Promise<boolean> {
  try {
    await sq.query(`create extension if not exists vector;`);
  } catch (e) {
    if (isVectorExtensionUnavailableError(e)) {
      // eslint-disable-next-line no-console
      console.warn(
        "[site-index] PostgreSQL extension pgvector is missing. Site RAG index sync is skipped. " +
          "Install pgvector on the server, then restart the API (see https://github.com/pgvector/pgvector#installation)."
      );
      return false;
    }
    throw e;
  }

  await sq.query(`
    create table if not exists ${schemaQualified("site_page_index")} (
      url text primary key,
      titulo_es text not null default '',
      descripcion_es text not null default '',
      titulo_en text not null default '',
      descripcion_en text not null default '',
      secciones jsonb not null default '[]'::jsonb,
      embedding vector(${EMBEDDING_DIM}),
      updated_at timestamptz not null default now()
    );
  `);
  // Best-effort index; may fail on low row counts or permission, so ignore.
  await sq
    .query(`
      create index if not exists site_page_index_embedding_idx
      on ${schemaQualified("site_page_index")} using ivfflat (embedding vector_cosine_ops)
      with (lists = 100);
    `)
    .catch(() => {});
  return true;
}

export async function embedQueryText(text: string): Promise<number[] | null> {
  const key = getOpenAiKey();
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: env.OPENAI_EMBEDDING_MODEL,
      input: String(text).slice(0, 8000)
    })
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { data?: { embedding?: number[] }[] };
  const vec = data.data?.[0]?.embedding;
  return Array.isArray(vec) ? vec : null;
}

export type SiteIndexRow = {
  url: string;
  titulo_es: string;
  descripcion_es: string;
  titulo_en: string;
  descripcion_en: string;
  secciones: unknown;
};

export async function searchSitePagesByEmbedding(
  sq: Sequelize,
  embedding: number[],
  limit = 5
): Promise<SiteIndexRow[]> {
  if (!embedding?.length) return [];
  const vec = formatVector(embedding);
  const rows = (await sq.query(
    `
      select url, titulo_es, descripcion_es, titulo_en, descripcion_en, secciones
      from ${schemaQualified("site_page_index")}
      where embedding is not null
      order by embedding <=> $1::vector
      limit $2
    `,
    { bind: [vec, limit], type: QueryTypes.SELECT }
  )) as SiteIndexRow[];
  return rows;
}

export function formatSitePagesForContext(rows: SiteIndexRow[], language: string) {
  if (!rows?.length) return "";
  const lang = language === "en" ? "en" : "es";
  return rows
    .map((r) => {
      const title = lang === "en" ? r.titulo_en || r.titulo_es : r.titulo_es || r.titulo_en;
      const desc =
        lang === "en" ? r.descripcion_en || r.descripcion_es : r.descripcion_es || r.descripcion_en;
      let secciones: any = r.secciones;
      if (typeof secciones === "string") {
        try {
          secciones = JSON.parse(secciones);
        } catch {
          secciones = [];
        }
      }
      const secLines = Array.isArray(secciones)
        ? secciones
            .map((s) => {
              const st = lang === "en" ? s?.titulo_en ?? s?.titulo : s?.titulo_es ?? s?.titulo;
              const sd =
                lang === "en" ? s?.descripcion_en ?? s?.descripcion : s?.descripcion_es ?? s?.descripcion;
              if (!st && !sd) return null;
              return `  - ${String(st || "").trim()}: ${String(sd || "").trim()}`.trim();
            })
            .filter(Boolean)
            .join("\n")
        : "";
      const header =
        lang === "es"
          ? `Página: ${r.url}\nTítulo: ${title}\nResumen: ${desc}`
          : `Page: ${r.url}\nTitle: ${title}\nSummary: ${desc}`;
      return secLines ? `${header}\nSecciones:\n${secLines}` : header;
    })
    .join("\n\n---\n\n");
}

export function formatSiteFallbackAnswer(rows: SiteIndexRow[], language: string) {
  if (!rows?.length) return null;
  const top = rows[0];
  const lang = language === "en" ? "en" : "es";
  const title = lang === "en" ? top.titulo_en || top.titulo_es : top.titulo_es || top.titulo_en;
  const desc =
    lang === "en" ? top.descripcion_en || top.descripcion_es : top.descripcion_es || top.descripcion_en;
  return lang === "es"
    ? `Según el contenido del sitio (${top.url}): ${title}\n${desc}\n\nSi quieres, dime en qué sección estás (Productos, Sistemas, Catálogo, Contacto o Cotización) y te guío.`
    : `Based on site content (${top.url}): ${title}\n${desc}\n\nTell me which section you are in (Products, Systems, Catalog, Contact or Quote) and I’ll guide you.`;
}

export async function upsertSitePage(
  sq: Sequelize,
  input: {
    url: string;
    titulo_es: string;
    descripcion_es: string;
    titulo_en: string;
    descripcion_en: string;
    secciones: unknown;
    embedding: number[] | null;
  }
) {
  const embeddingSql = input.embedding ? `('${formatVector(input.embedding)}')::vector` : "null";
  await sq.query(
    `
    insert into ${schemaQualified("site_page_index")}
      (url, titulo_es, descripcion_es, titulo_en, descripcion_en, secciones, embedding, updated_at)
    values
      ($1, $2, $3, $4, $5, $6::jsonb, ${embeddingSql}, now())
    on conflict (url) do update set
      titulo_es = excluded.titulo_es,
      descripcion_es = excluded.descripcion_es,
      titulo_en = excluded.titulo_en,
      descripcion_en = excluded.descripcion_en,
      secciones = excluded.secciones,
      embedding = excluded.embedding,
      updated_at = now()
  `,
    { bind: [input.url, input.titulo_es, input.descripcion_es, input.titulo_en, input.descripcion_en, JSON.stringify(input.secciones ?? [])] }
  );
}

export async function answerWithLlm(args: {
  language: string;
  question: string;
  context: string;
  history: { role: "user" | "assistant"; content: string }[];
}) {
  const key = getOpenAiKey();
  if (!key) return null;
  const system =
    args.language === "en"
      ? "You are Tienda Online's commercial assistant (Costa Rica). Be concise and helpful. Use the provided website context. If the user asks for prices, guide them to request a quote."
      : "Eres el asistente comercial de Tienda Online (Costa Rica). Responde breve y útil. Usa el contexto del sitio. Si piden precios, guía a solicitar cotización.";

  const messages = [
    { role: "system", content: system },
    ...(args.history || []).slice(-8),
    { role: "system", content: `Contexto del sitio:\n${args.context || ""}` },
    { role: "user", content: args.question }
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: getOpenAiModel(),
      messages,
      temperature: 0.4
    })
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() || null;
}

