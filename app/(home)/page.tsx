import { LeafletImporter}  from '@/components/leaflet-importer'
import { Search } from '@/components/search'

export default function Home() {

  return (
    <div className="relative bg-zinc-50 font-sans dark:bg-black">
      <LeafletImporter/>
    </div>
  );
}
