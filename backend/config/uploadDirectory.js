import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const uploadDirectory = join(dirname(fileURLToPath(import.meta.url)), '../uploads');

mkdirSync(uploadDirectory, { recursive: true });
