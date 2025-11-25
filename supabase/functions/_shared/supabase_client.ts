import { createClient } from "npm:@supabase/supabase-js@2";

export function database(req: Request) {
  return createClient(
    Deno.env.get("PUBLIC_SUPABASE_URL") ?? "",
    Deno.env.get("PUBLIC_SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    },
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
