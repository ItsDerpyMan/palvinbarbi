import {define} from "../../utils/utils.ts";
import {database} from "../../utils/database/database.ts";


const connections = new Map<string, Set<WebSocket>>();
enum Event {
    'time_left',

}
export const handleSocket = define.handlers({
    GET(ctx) {
        const roomId = ctx.params.roomId;

        if (ctx.req.headers.get("upgrade") != "websocket") {
            return new Response("Expected Websocket", { status: 426 })
        }

        const { socket, response } = Deno.upgradeWebSocket(ctx.req);

        socket.onopen = () => {
            console.log(`[WS] Client connected to game room ${roomId}`);

            addConnection(roomId, socket);
            sendGameState(roomId, socket);
        };
        socket.onmessage = (e) => {
            const msg: Event = JSON.parse(e.data);
            handleClientMessage(roomId, socket, msg);
        };
        socket.onclose = () => {
            console.log(`[WS] Client disconnected from game room ${roomId}`);

            removeConnection(roomId, socket);
        };

        return response;
    },
});

function addConnection(roomId: string, socket: WebSocket) {
    if(!connections.has(roomId)) {
        connections.set(roomId, new Set());
    }
    connections.get(roomId)?.add(socket);
}

function removeConnection(roomId: string, socket: WebSocket) {
    connections.get(roomId)?.delete(socket);
}

async function sendGameState(roomId: string, socket: WebSocket) {
    const { data } = await database()
}