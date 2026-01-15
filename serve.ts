#!/usr/bin/env -S deno run -A --env
// serve.ts - Unified development server with CLI

import { cli } from "./backend/server/index.ts";
import { logger } from "./backend/server/logger.ts";
import { connectionManager } from "./backend/connection-manager.ts";
import "./backend/room-manager.ts";

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

    // Start WebSocket server on port 8000 (Vite proxies /api to here)
    logger.ws.info("Starting WebSocket server on port 8000...");
    Deno.serve({ port: 8000, hostname: "0.0.0.0" }, (req) => {
        const upgrade = req.headers.get("upgrade") || "";
        if (upgrade.toLowerCase() !== "websocket") {
            return new Response("Expected WebSocket", { status: 426 });
        }
        type Params = { socketId: string, roomId: string, playerId: string, username: string };
        const params = (<T extends Record<string, string>>(): Partial<T> => {
            const url = new URL(req.url);
            return Object.fromEntries(url.searchParams) as Partial<T>;
        })<Params>();

        const { socket, response } = Deno.upgradeWebSocket(req);
        const { socketId } = params;
        logger.ws.info("WS upgrade", socketId ? `(reconnect: ${socketId})` : "(new)");

        socket.onopen = () => {
            if (socketId) {
                const { roomId, playerId, username } = params;
                connectionManager.handlesReconnection(socket, socketId, roomId!, playerId!, username!);
            } else {
                connectionManager.handlesNewConnection(socket);
            }
        };
        socket.onerror = (e) => logger.ws.error("WS error:", e);
        socket.onclose = () => logger.ws.info("WS closed");
        return response;
    });

    logger.sys.info("Starting Vite dev server...");

    const viteProcess = new Deno.Command("deno", {
        args: ["run", "-A", "--env", "vite"],
        stdin: "null",
        stdout: "piped",
        stderr: "piped",
    }).spawn();

    streamOutput(viteProcess.stdout.getReader(), (msg) => logger.page.info(msg));
    streamOutput(viteProcess.stderr.getReader(), (msg) => logger.page.error(msg));

    // Wait for Vite to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    logger.sys.info("Ready: Vite :5173, WebSocket :8000 (proxied via /api)");

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
