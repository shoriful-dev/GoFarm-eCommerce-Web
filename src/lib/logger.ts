/**
 * Tiny logger.
 *
 *   logger.debug / info  → console only in development
 *   logger.warn          → always
 *   logger.error         → always; in production the third arg can carry
 *                          structured context for an external sink (Sentry, etc.)
 *
 * Replace `console.log` / `console.error` with these so production logs aren't
 * polluted with noisy debug output.
 */

const isDev = process.env.NODE_ENV !== "production";

type Ctx = Record<string, unknown> | undefined;

export const logger = {
  debug(msg: string, ctx?: Ctx) {
    if (isDev) console.debug(`[debug] ${msg}`, ctx ?? "");
  },
  info(msg: string, ctx?: Ctx) {
    if (isDev) console.info(`[info]  ${msg}`, ctx ?? "");
  },
  warn(msg: string, ctx?: Ctx) {
    console.warn(`[warn]  ${msg}`, ctx ?? "");
  },
  error(msg: string, err?: unknown, ctx?: Ctx) {
    console.error(`[error] ${msg}`, err ?? "", ctx ?? "");
    // Hook point for production error sinks:
    // if (!isDev) Sentry.captureException(err, { extra: { msg, ...ctx } });
  },
};

export type Logger = typeof logger;
