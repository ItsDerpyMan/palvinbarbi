import { createClient, Session, User } from "jsr:@supabase/supabase-js@2";
import { getCookies, setCookie } from "@std/http/cookie";

export function getCookies(req: Request): Record<string, string> {
  return getCookies(req.headers);
}

type Auth = {
  user: User;
  session: Session;
};
export async function getAuthCookies(
  cookies: Record<string, string>,
): Promise<Auth | null> {
  const session: string | null = cookies["session_id"];
  const jwt: string | null = cookies["sb_jwt"];

  if (!session || !jwt) return null;

  const { data: sessionData, error } = await getDatabase(jwt)
    .from("sessions")
    .select("id, user_id, token, expires_at")
    .eq("id", session)
    .single<Tables<"sessions">>();

  if (error || !sessionData) return null;
  if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
    return null;
  }
  return sessionData;
}
