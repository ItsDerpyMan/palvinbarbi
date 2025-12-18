import { Context } from "fresh";
import { Auth } from "../utils/auth.ts";

// components/DebugContext.tsx   ← this file makes Tailwind work!
export default function DebugContext({ data }: { data: Auth }) {
  return (
    <div class="bg-gray-900 text-gray-200 p-5 rounded-xl font-mono text-sm space-y-3">
      <h1 class="text-2xl font-bold text-white mb-4">Debug Context</h1>
      <div class="truncate max-w-xs">key: {data.jwt ?? "—"}</div>
      <div class="truncate max-w-xs">session id: {data.sessionId ?? "—"}</div>
      <div class="truncate max-w-xs">room id: {data.roomId ?? "—"}</div>
      <div class="truncate max-w-xs">user id: {data.userId ?? "—"}</div>
      <div>username: {data.username ?? "—"}</div>
    </div>
  );
}
