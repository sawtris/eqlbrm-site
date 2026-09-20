import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Returns the first file in /public that exists (as a URL path), or null. Runs at build time. */
export function firstExisting(candidates: string[]): string | null {
  for (const file of candidates) {
    if (existsSync(join(process.cwd(), 'public', file))) return `/${file}`;
  }
  return null;
}
