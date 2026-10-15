import React, { SVGProps, useId, useMemo } from 'react';
import { getMerkabaArtwork } from '../lib/merkabaMark';

/** Shared, bevelled platinum Merkaba for every Immortal UI brand surface. */
export function ImmortalMark(props: SVGProps<SVGSVGElement>) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const artwork = useMemo(() => getMerkabaArtwork(`merkaba-${id}`), [id]);
  // Artwork is generated only from our fixed geometry and palette.
  return <svg viewBox="0 0 128 128" fill="none" aria-hidden="true" {...props}
    dangerouslySetInnerHTML={{ __html: artwork }} />;
}
