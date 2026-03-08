import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Providers } from "@/components/Providers";
import { NarraWalletChip } from "@/components/NarraWalletChip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Narra — Find builders worth backing",
  description: "Discover builders on X. Read the narrative. Launch a community token instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        <Providers>
          {/* Beta banner */}
          <div className="w-full bg-brand-500/10 border-b border-brand-500/20 py-1.5 px-4 text-center text-xs text-brand-400 font-medium tracking-wide">
            Narra is in beta — expect rough edges.
          </div>

          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image src="/narra-logo.png" alt="Narra" width={32} height={32} className="rounded-lg" />
              <span className="font-bold text-base tracking-tight">Narra</span>
            </Link>

            <nav className="hidden sm:flex items-center gap-0.5">
              <Link href="/" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Discover</Link>
              <Link href="/track" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Track</Link>
              <Link href="/launched" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Launched</Link>
              <Link href="/wallet" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Wallet</Link>
              <Link href="/docs" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Docs</Link>
            </nav>

            <div className="flex items-center gap-2">
              <NarraWalletChip />
              <a
                href="https://raydium.io/swap/?inputMint=sol&outputMint=narra"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm bg-brand-500 hover:bg-brand-400 text-black font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                Buy $NARRA
              </a>
            </div>
          </header>

          <div className="sm:hidden border-b border-white/10 px-4 py-2 flex gap-1 overflow-x-auto">
            <Link href="/" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors whitespace-nowrap">Discover</Link>
            <Link href="/track" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors whitespace-nowrap">Track</Link>
            <Link href="/launched" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors whitespace-nowrap">Launched</Link>
            <Link href="/wallet" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors whitespace-nowrap">Wallet</Link>
            <Link href="/docs" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors whitespace-nowrap">Docs</Link>
          </div>

          <main>{children}</main>

          {/* Floating Chrome extension CTA */}
          <a
            href="https://chromewebstore.google.com/detail/narra"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#111] border border-white/15 hover:border-brand-500/50 rounded-2xl shadow-xl shadow-black/40 text-sm font-medium text-white/80 hover:text-white transition-all hover:scale-105 group"
          >
            <svg className="w-4 h-4 text-brand-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5a2.5 2.5 0 0 0-5 0V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5a2.5 2.5 0 0 0 0-5z"/>
            </svg>
            <span>Add to Chrome</span>
          </a>
        </Providers>
      </body>
    </html>
  );
}
