// utils/getDatabase.ts
import type { Database, Tables } from "./database.types.ts";
import { createClient } from "@supabase/supabase-js";

export function getDatabase(jwt?: string, anon: boolean = false) {
  const url = Deno.env.get("PUBLIC_SUPABASE_URL")!;
  const anon_key = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")!;
  const service_key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const key = anon ? anon_key : service_key;

  return createClient<Database>(
    url,
    key,
    jwt
      ? {
        global: {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      }
      : undefined,
  );
}
export type Room = Tables<"rooms">;
export type Session = Tables<"sessions">;
export type User = Tables<"users">;
export type Room_Membership = Tables<"room_memberships">;
