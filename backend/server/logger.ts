// utils/logger.ts - Simple unified logging with source prefixes

export type LogSource = "PAGE" | "WS" | "ROOM" | "GAME" | "CLI" | "SYS";

const colors = {
    PAGE: "\x1b[36m",    // Cyan
    WS: "\x1b[33m",      // Yellow
    ROOM: "\x1b[32m",    // Green
    GAME: "\x1b[35m",    // Magenta
    CLI: "\x1b[34m",     // Blue
    SYS: "\x1b[90m",     // Gray
    reset: "\x1b[0m",
    error: "\x1b[31m",   // Red
    warn: "\x1b[33m",    // Yellow
};

function formatArgs(args: unknown[]): string {
    return args.map(a => {
        if (a === undefined) return "undefined";
        if (a === null) return "null";
        if (typeof a === "object") {
            try {
                return JSON.stringify(a);
            } catch {
                return String(a);
            }
        }
        return String(a);
    }).join(" ");
}

function getTimestamp(): string {
    return new Date().toLocaleTimeString("en-US", { hour12: false });
}

function log(source: LogSource, message: string, ...args: unknown[]): void {
    const time = getTimestamp();
    const color = colors[source];
    const prefix = `${colors.SYS}${time}${colors.reset} ${color}[${source}]${colors.reset}`;
    const formatted = args.length > 0 ? `${message} ${formatArgs(args)}` : message;
    console.log(`${prefix} ${formatted}`);
}

function error(source: LogSource, message: string, ...args: unknown[]): void {
    const time = getTimestamp();
    const color = colors[source];
    const prefix = `${colors.SYS}${time}${colors.reset} ${color}[${source}]${colors.reset} ${colors.error}ERROR${colors.reset}`;
    const formatted = args.length > 0 ? `${message} ${formatArgs(args)}` : message;
    console.error(`${prefix} ${formatted}`);
}

function warn(source: LogSource, message: string, ...args: unknown[]): void {
    const time = getTimestamp();
    const color = colors[source];
    const prefix = `${colors.SYS}${time}${colors.reset} ${color}[${source}]${colors.reset} ${colors.warn}WARN${colors.reset}`;
    const formatted = args.length > 0 ? `${message} ${formatArgs(args)}` : message;
    console.warn(`${prefix} ${formatted}`);
}

// Create namespaced loggers
function createLogger(source: LogSource) {
    return {
        info: (message: string, ...args: unknown[]) => log(source, message, ...args),
        error: (message: string, ...args: unknown[]) => error(source, message, ...args),
        warn: (message: string, ...args: unknown[]) => warn(source, message, ...args),
    };
}

export const logger = {
    page: createLogger("PAGE"),
    ws: createLogger("WS"),
    room: createLogger("ROOM"),
    game: createLogger("GAME"),
    cli: createLogger("CLI"),
    sys: createLogger("SYS"),
};