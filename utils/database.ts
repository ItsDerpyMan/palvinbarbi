import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase.ts";

const supabaseUrl = Deno.env.get("FRESH_PUBLIC_SUPABASE_URL");
const supabaseKey = Deno.env.get("FRESH_PUBLIC_SUPABASE_ANON_KEY");
export const database = createClient<Database>(supabaseUrl, supabaseKey);

export type Room = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string; // timestamps are returned as strings
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