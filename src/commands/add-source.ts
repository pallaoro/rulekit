import type { SourceType, Source } from "../schema.js";
import { addSource } from "../writer.js";

const VALID_TYPES = ["document", "api", "database", "message", "structured"];

export async function addSourceCmd(
  file: string,
  flags: Record<string, string>,
): Promise<void> {
  const { id, type, format, description } = flags;

  if (!id || !type || !description) {
    console.error(
      "Usage: rulespec add-source --id <id> --type <document|api|database|message|structured> --description <text> [--format <fmt>]",
    );
    process.exit(1);
  }

  if (!VALID_TYPES.includes(type)) {
    console.error(
      `Invalid type: "${type}". Must be one of: ${VALID_TYPES.join(", ")}`,
    );
    process.exit(1);
  }

  const source: Source = {
    id,
    type: type as SourceType,
    description,
  };
  if (format) source.format = format;

  await addSource(file, source);
  console.log(`Added source "${id}"`);
}
