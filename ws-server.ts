#!/usr/bin/env -S deno run -A
import { connectionManager } from "./handlers/sockets/connection-manager.ts";
import "./handlers/sockets/room-manager.ts";
import { WSCli } from "./ws-cli.ts";

const PORT = 8000;
const HOSTNAME = "0.0.0.0";

console.log(`🚀 WebSocket server starting on ${HOSTNAME}:${PORT}...`);

Deno.serve({
    port: PORT,
    hostname: HOSTNAME,
    handler: (req) => {
        const url = new URL(req.url);

        // Log all requests
        console.log(`[WS Server] ${req.method} ${url.pathname}`);

        // Handle WebSocket upgrade for /api path
        if (url.pathname === "/api") {
            const upgrade = req.headers.get("upgrade") || "";

            if (upgrade.toLowerCase() !== "websocket") {
                console.error("[WS Server] Not a WebSocket upgrade request");
                return new Response("Expected WebSocket connection", {
                    status: 426,
                    headers: { "Upgrade": "websocket" }
                });
            }

            console.log("[WS Server] Upgrading to WebSocket...");
            const { socket, response } = Deno.upgradeWebSocket(req);

            socket.onopen = () => {
                console.log("[WS Server] ✅ New WebSocket connection established");
                connectionManager.handlesNewConnection(socket);
            };

            socket.onerror = (e) => {
                console.error("[WS Server] ⚠️ WebSocket error:", e);
            };

            socket.onclose = () => {
                console.log("[WS Server] ❌ Connection closed");
            };

            return response;
        }

        // Health check endpoint
        if (url.pathname === "/health") {
            return new Response(JSON.stringify({
                status: "ok",
                connections: connectionManager.getRegistry().size(),
            }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        // 404 for other paths
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`✅ WebSocket server listening on http://${HOSTNAME}:${PORT}`);
console.log(`   WebSocket endpoint: ws://${HOSTNAME}:${PORT}`);
console.log(`   Health check: http://${HOSTNAME}:${PORT}/health`);

// Start the CLI interface
const cli = new WSCli();
cli.start();