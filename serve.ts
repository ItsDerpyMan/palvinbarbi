#!/usr/bin/env -S deno run -A --env
// serve.ts - Unified development server with CLI

import { app } from "./main.tsx";
import { cli } from "./backend/server/index.ts";
import { logger } from "./backend/server/logger.ts";

// Helper to stream process output to logger
function streamOutput(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    logFn: (msg: string) => void
): void {
    const decoder = new TextDecoder();
    (async () => {
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const text = decoder.decode(value);
                for (const line of text.split("\n")) {
                    const trimmed = line.trim();
                    if (trimmed) logFn(trimmed);
                }
            }
        } catch {
            // Stream closed
        }
    })();
}

async function main(): Promise<void> {
    const noCli = Deno.args.includes("--no-cli");

    logger.sys.info("Starting servers...");

    // Start Fresh backend directly (handles WebSocket on port 8000)
    logger.ws.info("Starting backend on port 8000...");
    app.listen({ port: 8000, hostname: "0.0.0.0" });
    logger.ws.info("Backend ready on http://0.0.0.0:8000");

    // Spawn Vite for frontend (port 5173)
    const viteProcess = new Deno.Command("deno", {
        args: ["run", "-A", "--env", "npm:vite"],
        stdin: "null",
        stdout: "piped",
        stderr: "piped",
    }).spawn();

    streamOutput(viteProcess.stdout.getReader(), (msg) => logger.page.info(msg));
    streamOutput(viteProcess.stderr.getReader(), (msg) => logger.page.error(msg));

    // Wait for Vite to start
    await new Promise(resolve => setTimeout(resolve, 1500));

    logger.sys.info("All servers started (Backend:8000 + Vite:5173)");

    // Cleanup function
    const cleanup = () => {
        try {
            viteProcess.kill("SIGTERM");
        } catch {
            // Already dead
        }
    };

    // Handle process termination
    Deno.addSignalListener("SIGINT", () => {
        logger.sys.info("Shutting down...");
        cleanup();
        Deno.exit(0);
    });

    if (!noCli) {
        await cli.start();
        cleanup();
    } else {
        logger.sys.info("CLI disabled, running in headless mode");
        await viteProcess.status;
        cleanup();
    }
}

main().catch((err) => {
    console.error("Fatal error:", err);
    Deno.exit(1);
});