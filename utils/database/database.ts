import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";
import type { Tables } from "./supabase.types.ts";

export function getDatabase(jwt?: string) {
  const url = Deno.env.get("HEAD_SUPABASE_URL");
  const key = Deno.env.get("HEAD_SUPABASE_ANON_KEY");
  //const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable",
    );
  }
  return createClient<Database>(
    url,
    key,
    jwt
      ? {
        global: {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      }
      : undefined,
  );
}

export type Room = Tables<"rooms">;
export type Session = Tables<"sessions">;
export type User = Tables<"users">;
export type Room_Membership = Tables<"room_memberships">;
