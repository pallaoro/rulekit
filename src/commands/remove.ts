import { removeRule } from "../writer.js";

export async function remove(file: string, id: string): Promise<void> {
  await removeRule(file, id);
  console.log(`Removed rule "${id}"`);
}
