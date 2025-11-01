import { define } from "../utils/utils.ts";
import HomePage from "./index.tsx";
import RoomController from "../islands/RoomController.tsx";
import type { Room } from "../utils/database/database.ts";

// /rooms.tsx
export default define.page(async function RoomsPage(ctx) {
  const { data, error } = await fetch(`${ctx.url.origin}/api/rooms`).then(
    async (
      res,
    ) => await res.json(),
  );
  if (error) console.warn(`Failed to fetch /api/rooms ${error}`);
  const rooms: Room[] = data ?? [];
  return (
    <HomePage>
      <RoomController data={rooms} />
    </HomePage>
  );
});
