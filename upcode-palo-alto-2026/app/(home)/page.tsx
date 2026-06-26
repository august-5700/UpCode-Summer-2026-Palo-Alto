import Image from "next/image";
import { LeafletImporter}  from '@/components/leaflet-importer'

export default function Home() {

  return (
    <div className="relative bg-zinc-50 font-sans dark:bg-black">
      <LeafletImporter/>
    </div>
  );
}
