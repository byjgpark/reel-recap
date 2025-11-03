type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50,
};

function resolveLevel(): LogLevel {
  const envLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL || '').toLowerCase() as LogLevel;
  if (envLevel && levelOrder[envLevel] !== undefined) return envLevel;

  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') return 'warn';
  if (nodeEnv === 'test') return 'warn';
  return 'debug';
}

const currentLevel: LogLevel = resolveLevel();

function shouldLog(level: LogLevel) {
  return levelOrder[level] >= levelOrder[currentLevel];
}

function format(scope: string | undefined, msg: string, meta?: unknown) {
  const base = scope ? `[${scope}] ${msg}` : msg;
  return meta !== undefined ? [base, meta] : [base];
}

export const logger = {
  debug(msg: string, meta?: unknown, scope?: string) {
    if (!shouldLog('debug')) return;
    console.debug(...format(scope, msg, meta));
  },
  info(msg: string, meta?: unknown, scope?: string) {
    if (!shouldLog('info')) return;
    console.info(...format(scope, msg, meta));
  },
  warn(msg: string, meta?: unknown, scope?: string) {
    if (!shouldLog('warn')) return;
    console.warn(...format(scope, msg, meta));
  },
  error(msg: string, meta?: unknown, scope?: string) {
    if (!shouldLog('error')) return;
    console.error(...format(scope, msg, meta));
  },
  json(level: LogLevel, event: string, payload: Record<string, unknown>, scope?: string) {
    if (!shouldLog(level)) return;
    const entry = {
      level,
      event,
      scope,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      ...payload,
    };
    const line = JSON.stringify(entry);
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  },
};

export type { LogLevel };