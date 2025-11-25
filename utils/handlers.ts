import { define } from "./utils.ts";

export const getPublicKeys = define.handlers({
  GET() {
    return new Response(
      JSON.stringify({
        url: Deno.env.get("PUBLIC_SUPABASE_URL"),
        key: Deno.env.get("PUBLIC_SUPABASE_ANON_KEY"),
      }),
      { headers: { "Content-type": "application/json" } },
    );
  },
});
