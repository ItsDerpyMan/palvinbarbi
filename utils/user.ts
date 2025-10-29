import { database } from "./database.ts";

export async function createUser(userId: string, username: string) {
  const { error } = await database.from("users").upsert({ id: userId, username });
  if (error) throw new Error("User creation failed: " + error.message);
}
