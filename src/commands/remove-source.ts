import { removeSource } from "../writer.js";

export async function removeSourceCmd(
  file: string,
  id: string,
): Promise<void> {
  await removeSource(file, id);
  console.log(`Removed source "${id}"`);
}
