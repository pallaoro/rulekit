import { addExample } from "../writer.js";

export async function addExampleCmd(
  file: string,
  flags: Record<string, string>,
): Promise<void> {
  const { input, output, description } = flags;

  if (!input || !output) {
    console.error(
      'Usage: rulespec add-example --input \'{"key": "val"}\' --output \'{"key": "val"}\' [--description <text>]',
    );
    process.exit(1);
  }

  let parsedInput: Record<string, unknown>;
  let parsedOutput: Record<string, unknown>;

  try {
    parsedInput = JSON.parse(input);
  } catch {
    console.error("Invalid JSON for --input");
    process.exit(1);
  }

  try {
    parsedOutput = JSON.parse(output);
  } catch {
    console.error("Invalid JSON for --output");
    process.exit(1);
  }

  await addExample(file, {
    input: parsedInput,
    output: parsedOutput,
    description: description || undefined,
  });

  console.log(
    `Added example${description ? `: "${description}"` : ` (${(flags._exampleCount ?? "1")})`}`,
  );
}
