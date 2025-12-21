import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

interface SupabaseConfig {
    url: string;
    key: string;
}

declare global {
    // For browser (window)
    interface Window {
        __SUPABASE__: SupabaseConfig;
    }
    // For globalThis (Deno/Node/universal)
    var __SUPABASE__: SupabaseConfig;
}

export function database(jwt?: string) {
    const { url, key } = globalThis.__SUPABASE__;

    return createClient<Database>(url, key, jwt ? {
        global: { headers: { Authorization: `Bearer ${jwt}` } }
    } : undefined);
}