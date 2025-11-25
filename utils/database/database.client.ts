// utils/getDatabase.ts
import type { Database } from "./database.types.ts";
import { createClient } from "@supabase/supabase-js";

export async function getAnonDatabase(jwt?: string) {
  const res = await fetch("/api/public-keys");
  const data = await res.json();
  return createClient<Database>(
    data.url,
    data.key,
    jwt
      ? {
        global: {
          headers: { Authorization: `Bearer ${jwt}` },
        },
      }
      : undefined,
  );
}
