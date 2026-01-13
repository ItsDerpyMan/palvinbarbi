// server/index.ts - Unified CLI for the application
import { Select, Input, Confirm } from "@cliffy/prompt";
import { roomManager } from "../room-manager.ts";
import { logger } from "./logger.ts";

export class AppCli {
    private running = false;

    async start(): Promise<void> {
        this.running = true;
        logger.cli.info("CLI Started");

        while (this.running) {
            try {
                await this.showMainMenu();
            } catch (error) {
                if (error instanceof Deno.errors.Interrupted) {
                    logger.cli.info("Exiting CLI...");
                    this.running = false;
                    break;
                }
                logger.cli.error("Menu error:", error);
            }
        }
    }

    private async showMainMenu(): Promise<void> {
        console.log("\n");
        const action = await Select.prompt({
            message: "Select an action:",
            options: [
                { name: "🚀 Start Game", value: "start_round" },
                { name: "📊 Show Room Status", value: "room_status" },
                { name: "📨 Broadcast Message", value: "broadcast" },
                { name: "🔄 Clear Console", value: "clear" },
                { name: "❌ Exit", value: "exit" },
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
            case "clear":
                console.clear();
                logger.cli.info("Console cleared");
                break;
            case "exit":
                this.running = false;
                logger.cli.info("Goodbye!");
                break;
        }
    }

    private async handleStartRound(): Promise<void> {
        console.log("\n🚀 Start Round");
        console.log("─".repeat(30));

        const rooms = roomManager.getRooms();

        if (rooms.size === 0) {
            console.log("\n❌ No active rooms available.\n");
            return;
        }

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
                logger.game.info(`Game started in room "${roomId}"`);
            } catch (error) {
                logger.game.error(`Failed to start round:`, error);
            }
        } else {
            console.log("\n❌ Game start cancelled.\n");
        }
    }

    private async showRoomStatus(): Promise<void> {
        console.log("\n📊 Room Status");
        console.log("─".repeat(30));

        const rooms = roomManager.getRooms();

        if (rooms.size === 0) {
            console.log("No active rooms.\n");
            await Input.prompt({ message: "Press Enter to continue..." });
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

    private async handleBroadcast(): Promise<void> {
        console.log("\n📨 Broadcast Message");
        console.log("─".repeat(30));

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
            validate: (value: string) => {
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
                    logger.room.info(`Broadcasted to ${count} rooms`);
                } else {
                    const room = rooms.get(roomId);
                    if (!room) {
                        console.log(`\n❌ Room "${roomId}" not found.\n`);
                        return;
                    }
                    room.broadcast(eventName, payload);
                    logger.room.info(`Broadcasted to room "${roomId}"`);
                }
            } catch (error) {
                logger.cli.error(`Failed to broadcast:`, error);
            }
        } else {
            console.log("\n❌ Broadcast cancelled.\n");
        }
    }
}

export const cli = new AppCli();