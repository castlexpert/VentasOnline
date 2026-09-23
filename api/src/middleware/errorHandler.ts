import type { NextFunction, Request, Response } from "express";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const e = err as { status?: number; message?: string };
  const status = typeof e.status === "number" ? e.status : 500;
  const message = e.message || "Internal error";
  // eslint-disable-next-line no-console
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}
