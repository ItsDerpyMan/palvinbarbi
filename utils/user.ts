import { getDatabase } from "./database/database.ts";
import type { Context } from "fresh";
import type { State } from "./utils.ts";
import type { TablesInsert } from "./database/database.types.ts";

export async function createUser(
  ctx: Context<State>,
  userId: string,
  username: string,
) {
  // Basic validation
  if (!ctx.state.auth?.jwt) {
    throw new Error("Missing JWT in context");
  }
  if (!userId || userId.trim() === "") {
    throw new Error("Invalid userId");
  }
  if (!username || username.trim() === "") {
    throw new Error("Invalid username");
  }

  const { error } = await getDatabase(ctx.state.auth.jwt)
    .from("users")
    .upsert(
      {
        id: userId,
        username,
      } satisfies TablesInsert<"users">,
    );

  if (error) {
    throw new Error("User creation failed: " + error.message);
  }
}
