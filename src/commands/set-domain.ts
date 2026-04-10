import { setDomain } from "../writer.js";

export async function setDomainCmd(
  file: string,
  domain: string,
): Promise<void> {
  await setDomain(file, domain);
  console.log(`Domain set to "${domain}"`);
}
