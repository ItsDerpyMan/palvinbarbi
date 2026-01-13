import { connectionManager } from "../backend/connection-manager.ts";
import { define } from "./utils/utils.ts";
import { logger } from "../backend/server/logger.ts";
import "../backend/room-manager.ts";

export const socketHandler = define.handlers({
    GET(ctx) {
            const upgrade = ctx.req.headers.get("upgrade") || "";

            if (upgrade.toLowerCase() !== "websocket") {
                logger.ws.error("Not a WebSocket upgrade request");
                return new Response("Expected WebSocket connection", {
                    status: 426,
                    headers: {"Upgrade": "websocket"}
                });
            }

            const url = new URL(ctx.req.url);
            const SocketId = url.searchParams.get("socketId");

            logger.ws.info("Upgrading to WebSocket...", SocketId ? `(reconnect: ${SocketId})` : "(new)");
            const {socket, response} = Deno.upgradeWebSocket(ctx.req);

            socket.onopen = () => {
                if (SocketId) {
                    logger.ws.info("Reconnection established for:", SocketId);
                    connectionManager.handlesReconnection(socket, SocketId);
                } else {
                    logger.ws.info("New WebSocket connection established");
                    connectionManager.handlesNewConnection(socket);
                }
            };

            socket.onerror = (e) => {
                logger.ws.error("WebSocket error:", e);
            };

            socket.onclose = () => {
                logger.ws.info("Connection closed");
            };

            return response;
    }
});