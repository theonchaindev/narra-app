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
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image src="/narra-logo.png" alt="Narra" width={32} height={32} className="rounded-lg" />
              <span className="font-bold text-base tracking-tight">Narra</span>
            </Link>

            <nav className="hidden sm:flex items-center gap-0.5">
              <Link href="/" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Discover
              </Link>
              <Link href="/launched" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Launched
              </Link>
              <Link href="/docs" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Docs
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <a
                href="https://x.com/i/communities/narra"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/55 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="hidden md:inline">Community</span>
              </a>

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

          <div className="sm:hidden border-b border-white/10 px-4 py-2 flex gap-1">
            <Link href="/" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Discover</Link>
            <Link href="/launched" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Launched</Link>
            <Link href="/wallet" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Wallet</Link>
            <Link href="/docs" className="px-3 py-1.5 text-sm text-white/55 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Docs</Link>
          </div>

          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
