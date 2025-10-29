import { getDatabase } from "./database.ts"
import type { Context } from "$fresh/server.ts";
// check - room exist
//       - room hasnt been filled up. has enough space for the user to join.
export async function exist(ctx: Context, id: string): Promise<boolean> {
  if(id === undefined || id === "") {
    return false;
  }
  const { data, error } = await getDatabase(ctx.state.auth.jwt)
    .from("rooms")
    .select("id")
    .eq('id', id)
    .limit(1)
    .maybeSingle();
  if (error) return false
  return data !== null
}

export async function capacity(ctx: Context, id: string): Promise<number> {
  if(id === undefined || id === "") {
    return false;
  }
  const { num, error } = await getDatabase(ctx.state.auth.jwt)
    .from("room_membership")
    .select('room_id', count:count(*), { head: false})
    .eq('room_id', id);
  if (error) return -1;
  return num;
}
