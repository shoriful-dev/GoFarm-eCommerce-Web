const isDev = process.env.NODE_ENV !== 'production';

type Ctx = Record<string, unknown> | undefined;

export const logger = {
  debug(msg: string, ctx?: Ctx) {
    if (isDev) console.debug(`[debug] ${msg}`, ctx ?? '');
  },
  info(msg: string, ctx?: Ctx) {
    if (isDev) console.info(`[info]  ${msg}`, ctx ?? '');
  },
  warn(msg: string, ctx?: Ctx) {
    console.warn(`[warn]  ${msg}`, ctx ?? '');
  },
  error(msg: string, err?: unknown, ctx?: Ctx) {
    console.error(`[error] ${msg}`, err ?? '', ctx ?? '');
  },
};

export type Logger = typeof logger;
