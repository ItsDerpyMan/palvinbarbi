import { getDatabase } from "./database/database.ts";
import type { Context } from "fresh";
import type { State } from "./utils.ts";

// TODO GetCookies and fetch the jwt key from them and get query the database safely
//
// -------------------------
// Check if a room exists
// -------------------------
export async function exist(
  id: string,
): Promise<boolean> {
  if (!id) return false;

  const { data, error } = await getDatabase()
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
  id: string,
): Promise<number> {
  if (!id) return 0;

  const { count, error } = await getDatabase()
    .from("room_memberships")
    .select("room_id", { count: "exact", head: true })
    .eq("room_id", id);

  if (error) return -1;

  // If count is null or undefined, return 0
  return count ?? 0;
}
