import { LeafletImporter}  from '@/components/leaflet-importer'
import Sidebar from '@/components/sidebar'

export default function Home() {

  return (
    <div className="relative bg-zinc-50 font-sans dark:bg-black">
      <LeafletImporter/>
      <Sidebar/> 
    </div>
  );
}
