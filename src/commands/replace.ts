import { replaceInFile } from "../writer.js";

export async function replaceCmd(
  file: string,
  flags: Record<string, string>,
): Promise<void> {
  const { old: oldStr, new: newStr } = flags;

  if (!oldStr || newStr === undefined) {
    console.error(
      'Usage: rulespec replace --old "text to find" --new "replacement text"',
    );
    process.exit(1);
  }

  await replaceInFile(file, oldStr, newStr);
  console.log("Replaced and revalidated.");
}
