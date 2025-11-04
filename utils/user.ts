import { getDatabase } from "./database/database.ts";
import type { TablesInsert } from "./database/database.types.ts";

export async function createUser(
  jwt: string,
  userId: string,
  username: string,
) {
  // Basic validation
  if (!jwt) {
    throw new Error("Missing JWT in context");
  }
  if (!userId || userId.trim() === "") {
    throw new Error("Invalid userId");
  }
  if (!username || username.trim() === "") {
    throw new Error("Invalid username");
  }

  const { error } = await getDatabase(jwt)
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
