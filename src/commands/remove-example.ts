import { removeExample } from "../writer.js";

export async function removeExampleCmd(
  file: string,
  indexStr: string,
): Promise<void> {
  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 0) {
    console.error("Usage: rulespec remove-example <index> (0-based)");
    process.exit(1);
  }

  await removeExample(file, index);
  console.log(`Removed example at index ${index}`);
}
