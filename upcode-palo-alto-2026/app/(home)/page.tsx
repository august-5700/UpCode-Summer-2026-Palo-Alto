import Image from "next/image";
import { LeafletImporter}  from '@/components/leaflet-importer'

export default function Home() {

  return (
    <div className="relative bg-zinc-50 font-sans dark:bg-black">
      <LeafletImporter/>
      <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
        <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Looking for a starting point or more instructions? Head over to{" "}
          center.
        </p>
      </div>
    </div>
  );
}
