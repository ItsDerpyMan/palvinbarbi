import { define } from "./utils/utils.ts";

export const getPublicKeys = define.handlers({
  POST() {
    const url = Deno.env.get("PUBLIC_SUPABASE_URL");
    const anon_key = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY");
    if (!url || !anon_key) {
      return new Response(JSON.stringify({ ok: false, error: "Error accessing .env secret keys" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ ok: true, data: { url: url, key: anon_key }} ),
      { headers: { "Content-Type": "application/json" } },
    );
  },
});
