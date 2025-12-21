// utils/getDatabase.ts
import { createClient } from "@supabase/supabase-js";
import { Tables } from "./database.types.ts";

export function database() {
  return createClient(
    Deno.env.get("PUBLIC_SUPABASE_URL") ?? "",
    Deno.env.get("PUBLIC_SUPABASE_ANON_KEY") ?? "",
  );
}
export function databaseWithKey(key?: string | null) {
  return createClient(
    Deno.env.get("PUBLIC_SUPABASE_URL") ?? "",
    Deno.env.get("PUBLIC_SUPABASE_ANON_KEY") ?? "",
    key
      ? {
        global: {
          headers: { Authorization: `Bearer ${key}` },
        },
      }
      : undefined,
  );
}

export type Room = Tables<"rooms">;
export type Session = Tables<"sessions">;
export type User = Tables<"users">;
export type Room_Membership = Tables<"room_memberships">;
