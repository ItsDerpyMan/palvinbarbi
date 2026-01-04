import { connectionManager } from "./connection-manager.ts";
import { define } from "../../utils/utils.ts";
// Import room-manager to initialize event subscriptions
import "./room-manager.ts";

export const handleWebSocket = define.handlers({
    GET(ctx) {
        console.log("[WS] WebSocket route hit! Headers:", ctx.req.headers.get("upgrade"));

        const upgrade = ctx.req.headers.get("upgrade") || "";

        if (upgrade.toLowerCase() !== "websocket") {
            console.error("[WS] Not a WebSocket upgrade request");
            return new Response("Expected WebSocket connection", { status: 426 });
        }

        console.log("[WS] Upgrading to WebSocket...");
        const { socket, response } = Deno.upgradeWebSocket(ctx.req);

        socket.onopen = () => {
            console.log("[WS] New WebSocket connection established");
            connectionManager.handlesNewConnection(socket);
        };

        socket.onerror = (e) => {
            console.error("[WS] WebSocket error:", e);
        };

        return response;
    },
});