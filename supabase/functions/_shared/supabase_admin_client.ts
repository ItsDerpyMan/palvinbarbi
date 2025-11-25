import { createClient } from "npm:@supabase/supabase-js@2";

export function database(req: Request) {
  return createClient(
    Deno.env.get("PUBLIC_SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    },
  );
}
