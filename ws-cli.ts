// ws-cli.ts - CLI interface for the WebSocket server
import { Select, Input, Confirm } from "@cliffy/prompt";
import { roomManager } from "./handlers/sockets/room-manager.ts";

export class WSCli {
    private running = false;

    async start() {
        this.running = true;
        console.log("\n🎮 WebSocket Server CLI Started");
        console.log("================================\n");

        while (this.running) {
            try {
                await this.showMainMenu();
            } catch (error) {
                if (error instanceof Deno.errors.Interrupted) {
                    console.log("\n\n👋 Exiting CLI...");
                    this.running = false;
                    break;
                }
                console.error("Error:", error);
            }
        }
    }

    private async showMainMenu() {
        const action = await Select.prompt({
            message: "Select an action:",
            options: [
                { name: "🚀 Start Game", value: "start_round" },
                { name: "📊 Show Room Status", value: "room_status" },
                { name: "📨 Broadcast Custom Message", value: "broadcast" },
                { name: "❌ Exit CLI", value: "exit" },
            ],
        });

        switch (action) {
            case "start_round":
                await this.handleStartRound();
                break;
            case "room_status":
                await this.showRoomStatus();
                break;
            case "broadcast":
                await this.handleBroadcast();
                break;
            case "exit":
                this.running = false;
                console.log("\n👋 Goodbye!\n");
                break;
        }
    }

    private async handleStartRound() {
        console.log("\n🚀 Start Round");
        console.log("──────────────");

        const rooms = roomManager.getRooms();

        if (rooms.size === 0) {
            console.log("\n❌ No active rooms available.\n");
            return;
        }

        // Create options for room selection
        const roomOptions = Array.from(rooms.entries()).map(([id, room]) => ({
            name: `Room ${id} - ${room.getPlayerCount()} player(s)`,
            value: id,
        }));

        const roomId = await Select.prompt({
            message: "Select a room:",
            options: roomOptions,
        });

        const room = rooms.get(roomId);
        if (!room) {
            console.log("\n❌ Room not found.\n");
            return;
        }

        const confirm = await Confirm.prompt({
            message: `Start game in room "${roomId}"?`,
            default: true,
        });

        if (confirm) {
            try {
                room.startRound();
                console.log(`\n✅ Game started successfully in room "${roomId}"!\n`);
            } catch (error) {
                console.error(`\n❌ Failed to start round:`, error, "\n");
            }
        } else {
            console.log("\n❌ Game start cancelled.\n");
        }
    }


    private async showRoomStatus() {
        console.log("\n📊 Room Status");
        console.log("──────────────");

        const rooms = roomManager.getRooms();

        if (rooms.size === 0) {
            console.log("No active rooms.\n");
            return;
        }

        for (const [roomId, room] of rooms.entries()) {
            console.log(`\n🏠 Room ID: ${roomId}`);
            console.log(`   Players: ${room.getPlayerCount()}`);

            if (room.getPlayerCount() > 0) {
                console.log(`   Player List:`);
                for (const player of room.getPlayers()) {
                    console.log(`      - ${player.username} (Score: ${player.score})`);
                }
            }
        }

        console.log("");
        await Input.prompt({ message: "Press Enter to continue..." });
    }

    private async handleBroadcast() {
        console.log("\n📨 Broadcast Custom Message");
        console.log("───────────────────────────");

        const rooms = roomManager.getRooms();

        if (rooms.size === 0) {
            console.log("\n❌ No active rooms available.\n");
            return;
        }

        const roomOptions = [
            { name: "All rooms", value: "all" },
            ...Array.from(rooms.entries()).map(([id, room]) => ({
                name: `Room ${id} - ${room.getPlayerCount()} player(s)`,
                value: id,
            })),
        ];

        const roomId = await Select.prompt({
            message: "Select target:",
            options: roomOptions,
        });

        const eventName = await Input.prompt({
            message: "Enter event name:",
            default: "client:cancel",
        });

        const payloadStr = await Input.prompt({
            message: "Enter payload (JSON):",
            default: '{"reason": "Test message"}',
            validate: (value) => {
                try {
                    JSON.parse(value);
                    return true;
                } catch {
                    return "Invalid JSON";
                }
            },
        });

        const confirm = await Confirm.prompt({
            message: `Broadcast "${eventName}" to ${roomId === "all" ? "all rooms" : `room ${roomId}`}?`,
            default: true,
        });

        if (confirm) {
            try {
                const payload = JSON.parse(payloadStr);

                if (roomId === "all") {
                    let count = 0;
                    for (const room of rooms.values()) {
                        room.broadcast(eventName, payload);
                        count++;
                    }
                    console.log(`\n✅ Broadcasted to ${count} rooms!\n`);
                } else {
                    const room = rooms.get(roomId);
                    if (!room) {
                        console.log(`\n❌ Room "${roomId}" not found.\n`);
                        return;
                    }
                    room.broadcast(eventName, payload);
                    console.log(`\n✅ Broadcasted to room "${roomId}"!\n`);
                }
            } catch (error) {
                console.error(`\n❌ Failed to broadcast:`, error, "\n");
            }
        } else {
            console.log("\n❌ Broadcast cancelled.\n");
        }
    }

}