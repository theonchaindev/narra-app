import Image from "next/image";
import { BuilderFeed } from "@/components/BuilderFeed";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <div className="border-b border-white/10 px-6 py-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Image src="/narra-logo.png" alt="Narra" width={40} height={40} className="rounded-xl" />
          <h1 className="text-3xl font-bold tracking-tight">Find builders worth backing</h1>
        </div>
        <p className="text-white/50 max-w-xl mx-auto">
          Narra scans X for developers and creators who are shipping. Discover real traction,
          read the narrative, and launch a community support token via Bags.
        </p>
      </div>

      <BuilderFeed />
    </div>
  );
}
