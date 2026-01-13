import { define } from "../handlers/utils/utils.ts";
import { Partial } from "fresh/runtime";

export default define.page(function App({ Component }) {
    const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL");
    const supabaseKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY");

  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Join a room</title>
          <script dangerouslySetInnerHTML={{
              __html: `window.__SUPABASE__ = {
              url: "${supabaseUrl}",
              key: "${supabaseKey}"
            };`
          }} />
      </head>
      <body f-client-nav>
        <Partial name="body">
          <Component />
        </Partial>
      </body>
    </html>
  );
});
