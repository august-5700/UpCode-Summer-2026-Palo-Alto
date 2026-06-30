'use client'

import dynamic from 'next/dynamic';
// isolate the importing of leaflet from the server, forcing it to only load on the cliant side
export const LeafletImporter = dynamic(
  () => import('./map-view'), // renders the map + sidebar together (client-only)
  { ssr: false }
);