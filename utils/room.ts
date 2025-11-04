import { getDatabase } from "./database/database.ts";
import type { Context } from "fresh";
import type { State } from "./utils.ts";

// -------------------------
// Check if a room exists
// -------------------------
export async function exist(
  ctx: Context<State>,
  id: string,
): Promise<boolean> {
  console.log(`id: ${id}\nkey: ${ctx.state.auth?.jwt}`);
  if (!id || !ctx.state.auth?.jwt) return false;

  const { data, error } = await getDatabase(ctx.state.auth.jwt)
    .from("rooms")
    .select("id")
    .eq("id", id)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error) return false;
  return data !== null;
}

// -------------------------
// Get current room capacity
// -------------------------
export async function capacity(
  ctx: Context<State>,
  id: string,
): Promise<number> {
  if (!id || !ctx.state.auth?.jwt) return 0;

  const { count, error } = await getDatabase(ctx.state.auth.jwt)
    .from("room_memberships")
    .select("room_id", { count: "exact", head: true })
    .eq("room_id", id);

  if (error) return -1;

  // If count is null or undefined, return 0
  return count ?? 0;
}
