import { Database } from "../utils/database.ts";
import { assertEquals } from "jsr:@std/assert";

Deno.test("Database basic operations", async () => {
  const kv = await Deno.openKv(":memory:"); // in-memory KV for testing
  const db = new Database(kv);

  console.log("Database initialized");
  const room = await db.createRoom({ name: "Test Room" });
  assertEquals(room.name, "Test Room");

  const user = await db.createUser({
    username: "John",
    session_id: "abc123",
    preferences: { theme: "light" },
  });
  assertEquals(user.username, "John");

  const joined = await db.joinRoom(user.id, room.id);
  assertEquals(joined, true);

  const rooms = await db.listRooms();
  assertEquals(rooms.length, 1);
});
