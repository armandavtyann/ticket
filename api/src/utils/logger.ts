interface LogContext {
  jobId?: string;
  traceId?: string;
  userId?: string;
  module?: string;
  [key: string]: any;
}

const isDevelopment = (): boolean => {
  const env = process.env.NODE_ENV;
  return env !== 'production' && env !== 'prod';
};

const PID = process.pid;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const levelColors: Record<string, string> = {
  LOG: colors.green,
  ERROR: colors.red,
  WARN: colors.yellow,
  DEBUG: colors.cyan,
  VERBOSE: colors.magenta,
};

const formatTimestamp = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const hours12 = String(now.getHours() % 12 || 12).padStart(2, '0');
  
  return `${month}/${day}/${year}, ${hours12}:${minutes}:${seconds} ${ampm}`;
};

let startTime = Date.now();
const timings = new Map<string, number>();

const getTiming = (module?: string): string => {
  if (!module) return '';
  
  const now = Date.now();
  const lastTime = timings.get(module) || startTime;
  const elapsed = now - lastTime;
  timings.set(module, now);
  
  return elapsed > 0 ? ` +${elapsed}ms` : '';
};

const formatLog = (
  level: string,
  message: string,
  context?: LogContext,
  error?: Error
): string => {
  if (!isDevelopment()) {
    const logData = {
      level,
      message,
      ...context,
      timestamp: new Date().toISOString(),
      pid: PID,
      ...(error && {
        error: error.message,
        stack: error.stack,
      }),
    };
    return JSON.stringify(logData);
  }

  const levelUpper = level.toUpperCase();
  const color = levelColors[levelUpper] || colors.white;
  const timestamp = formatTimestamp();
  const module = context?.module || '';
  const timing = getTiming(module);
  
  const pidStr = String(PID);
  const levelStr = levelUpper.padEnd(5, ' ');
  const moduleStr = module ? `[${module}] ` : '';
  
  let formatted = `${colors.bright}[Express]${colors.reset} ${colors.dim}${pidStr}${colors.reset}  ${colors.dim}-${colors.reset} ${colors.dim}${timestamp}${colors.reset}     ${color}${levelStr}${colors.reset}`;
  
  if (module) {
    formatted += `${colors.dim}${moduleStr}${colors.reset}`;
  }
  
  formatted += message;
  
  if (timing) {
    formatted += `${colors.dim}${timing}${colors.reset}`;
  }
  
  return formatted;
};

export const logger = {
  info: (message: string, context?: LogContext) => {
    console.log(formatLog('LOG', message, context));
  },
  error: (message: string, error?: Error, context?: LogContext) => {
    const errorMessage = error ? `${message} ${error.message}` : message;
    console.error(formatLog('ERROR', errorMessage, context, error));
    if (error?.stack && isDevelopment()) {
      console.error(`${colors.red}${error.stack}${colors.reset}`);
    }
  },
  warn: (message: string, context?: LogContext) => {
    console.warn(formatLog('WARN', message, context));
  },
  debug: (message: string, context?: LogContext) => {
    if (isDevelopment()) {
      console.log(formatLog('DEBUG', message, context));
    }
  },
  log: (message: string, context?: LogContext) => {
    console.log(formatLog('LOG', message, context));
  },
};
