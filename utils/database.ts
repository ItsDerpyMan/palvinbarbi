import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase.ts";

const supabaseUrl = Deno.env.get("HEAD_SUPABASE_URL");
const supabaseKey = Deno.env.get("HEAD_SUPABASE_ANON_KEY");
export function getDatabase(jwt?: string) {
  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    global: {
      headers: {
        Authorization: jwt ? `Bearer ${jwt}` : undefined,
      },
    },
  });
}
export type Room = {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
};

export interface Session {
  id: string;
  is_playing: boolean;
  joined_at: string;
  left_session: string | null;
  room_id: string | null;
  user_id: string | null;
}

export interface User {
  created_At: string | null;
  id: string;
  username: string | null;
}
