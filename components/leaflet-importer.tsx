'use client'

import dynamic from 'next/dynamic';
// isolate the importing of leaflet from the server, forcing it to only load on the cliant side
export const LeafletImporter = dynamic(
  () => import('./map'), // All this component does is dynamically render the actual component
  { ssr: false }
);