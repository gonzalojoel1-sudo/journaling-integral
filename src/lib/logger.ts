type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function formatLog(level: LogLevel, msg: string, context?: LogContext, error?: unknown): string {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...context,
    ...(error instanceof Error
      ? { error: { message: error.message, stack: error.stack, name: error.name } }
      : error
      ? { error: String(error) }
      : {}),
  };
  return JSON.stringify(entry);
}

export const logger = {
  debug(msg: string, context?: LogContext): void {
    if (!isProduction()) {
      console.debug(formatLog('debug', msg, context));
    }
  },
  info(msg: string, context?: LogContext): void {
    console.info(formatLog('info', msg, context));
  },
  warn(msg: string, context?: LogContext, error?: unknown): void {
    console.warn(formatLog('warn', msg, context, error));
  },
  error(msg: string, context?: LogContext, error?: unknown): void {
    console.error(formatLog('error', msg, context, error));
  },
};