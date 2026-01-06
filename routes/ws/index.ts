import { connectionManager } from "../../handlers/sockets/connection-manager.ts";
import { define } from "../../utils/utils.ts";
// Import room-manager to initialize event subscriptions
import "../../handlers/sockets/room-manager.ts";

export const handler = define.handlers({
    GET(ctx) {
        console.log("[WS ROUTE] WebSocket route hit! Headers:", ctx.req.headers.get("upgrade"));

        const upgrade = ctx.req.headers.get("upgrade") || "";

        if (upgrade.toLowerCase() !== "websocket") {
            console.error("[WS ROUTE] Not a WebSocket upgrade request");
            return new Response("Expected WebSocket connection", { status: 426 });
        }

        console.log("[WS ROUTE] Upgrading to WebSocket...");
        const { socket, response } = Deno.upgradeWebSocket(ctx.req);

        socket.onopen = () => {
            console.log("[WS ROUTE] New WebSocket connection established");
            connectionManager.handlesNewConnection(socket);
        };

        socket.onerror = (e) => {
            console.error("[WS ROUTE] WebSocket error:", e);
        };

        return response;
    },
});