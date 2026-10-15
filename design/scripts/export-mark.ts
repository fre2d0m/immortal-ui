/** Run with Node 22: node --experimental-strip-types design/scripts/export-mark.ts */
import { writeFileSync } from 'node:fs';
import { getMerkabaSvg } from '../../src/lib/merkabaMark.ts';

writeFileSync(new URL('../../public/immortal-mark.svg', import.meta.url), getMerkabaSvg());
writeFileSync(new URL('../../public/favicon.svg', import.meta.url), getMerkabaSvg('immortal-favicon', true));
