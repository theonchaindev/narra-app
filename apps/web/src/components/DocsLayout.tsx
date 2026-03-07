"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV = [
  {
    group: "Overview",
    items: [
      { id: "what-is-narra", label: "What is Narra?" },
      { id: "how-it-works",  label: "How it works" },
    ],
  },
  {
    group: "Using Narra",
    items: [
      { id: "web-app",    label: "Web App" },
      { id: "extension",  label: "Browser Extension" },
      { id: "wallet",     label: "Narra Wallet" },
      { id: "scanning",   label: "Scanning for Builders" },
      { id: "narratives", label: "AI Narratives" },
      { id: "launching",  label: "Launching Tokens" },
    ],
  },
  {
    group: "Reference",
    items: [
      { id: "scoring", label: "Scoring Algorithm" },
      { id: "setup",   label: "Getting Started" },
      { id: "env",     label: "Environment Variables" },
    ],
  },
];

const ALL_IDS = NAV.flatMap(g => g.items.map(i => i.id));

export function DocsLayout() {
  const [active, setActive] = useState("what-is-narra");

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    ALL_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto border-r border-white/8 py-8 px-4">
        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 mb-4">Documentation</p>
        <nav className="space-y-5">
          {NAV.map(group => (
            <div key={group.group}>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-2 mb-1.5">
                {group.group}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollTo(item.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                        active === item.id
                          ? "text-white bg-white/8 font-medium"
                          : "text-white/45 hover:text-white/80 hover:bg-white/5"
                      }`}
                    >
                      {active === item.id && (
                        <span className="w-1 h-1 rounded-full bg-brand-400 shrink-0" />
                      )}
                      <span className={active === item.id ? "" : "pl-3"}>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-8 px-2 space-y-1">
          <Link href="/" className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors py-1">
            ← Back to Discover
          </Link>
          <a
            href="https://x.com/i/communities/narra"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors py-1"
          >
            X Community
          </a>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-2xl mx-auto px-6 sm:px-10 py-12 space-y-20">

          {/* Page title */}
          <div>
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">Documentation</p>
            <h1 className="text-3xl font-bold tracking-tight mb-3">Narra Docs</h1>
            <p className="text-white/50 leading-relaxed">
              Discover builders shipping in public on X, generate AI narratives, and launch community tokens via Bags.
            </p>
          </div>

          {/* WHAT IS NARRA */}
          <Section id="what-is-narra" title="What is Narra?">
            <P>
              Narra is a builder discovery platform. It monitors X (Twitter) for developers, indie hackers, and founders actively shipping in public — scores their posts for signal quality — and automatically writes a launch narrative for each one.
            </P>
            <P>
              From that narrative you can launch a community support token via Bags, letting you back the builder before the rest of the market notices them.
            </P>
            <div className="grid grid-cols-3 gap-3 not-prose mt-2">
              {[
                { icon: "🔍", title: "Discover", desc: "X posts scanned for build signals in real time" },
                { icon: "✍️", title: "Narrate",  desc: "Claude writes a launch narrative for each builder" },
                { icon: "🚀", title: "Launch",   desc: "One click to create a community token via Bags" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-white/4 border border-white/10 rounded-xl p-4">
                  <div className="text-xl mb-2">{icon}</div>
                  <p className="text-sm font-semibold mb-1">{title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* HOW IT WORKS */}
          <Section id="how-it-works" title="How it works">
            <Steps items={[
              { n: "1", title: "Scan", desc: "Click Scan X on the feed. Narra calls the X API to fetch recent posts from watched builders or keyword searches." },
              { n: "2", title: "Score", desc: "Each post is scored 0–100 across six signals: engagement rate, follower tier, builder keywords, media, GitHub links, and reply activity." },
              { n: "3", title: "Narrate", desc: "Posts scoring 30+ are sent to Claude Sonnet, which writes a project description, token name, ticker, and launch narrative." },
              { n: "4", title: "Launch", desc: "Click Launch on any narrative card. Review the narrative, confirm your wallet balance, and submit to Bags to create the token." },
            ]} />
          </Section>

          {/* WEB APP */}
          <Section id="web-app" title="Web App">
            <P>The web app is the main interface — the discovery feed, wallet management, and launch flow all live here.</P>
            <Table
              headers={["Route", "Description"]}
              rows={[
                ["/",                 "Discovery feed — all scored opportunities sorted by signal"],
                ["/launched",         "Tokens that have been launched via Bags"],
                ["/wallet",           "Your Narra wallet — balance, address, export key"],
                ["/docs",             "This page"],
                ["/opportunity/[id]", "Full narrative detail for a single opportunity"],
              ]}
            />
          </Section>

          {/* EXTENSION */}
          <Section id="extension" title="Browser Extension">
            <P>The Narra Scout Chrome extension runs alongside X in a side panel. It detects builders as you browse your timeline and surfaces narratives without leaving X.</P>

            <H3>Installation</H3>
            <Steps items={[
              { n: "1", title: "Build", desc: "Run: pnpm --filter extension build" },
              { n: "2", title: "Load", desc: "Chrome → chrome://extensions → Developer mode ON → Load unpacked → select apps/extension/dist" },
              { n: "3", title: "Open", desc: "Navigate to x.com and click the Narra Scout icon in your toolbar to open the side panel" },
            ]} />

            <H3>Side panel tabs</H3>
            <Table
              headers={["Tab", "What it does"]}
              rows={[
                ["Browse", "Lists builders detected on your current X timeline"],
                ["Scan X", "Triggers a full backend scan for new builder posts"],
                ["Wallet", "Shows your synced Narra wallet — balance, address, QR code"],
              ]}
            />

            <Note>
              After reloading the extension in chrome://extensions, the Wallet tab automatically syncs with the wallet set up on the web app — both show the same address.
            </Note>
          </Section>

          {/* WALLET */}
          <Section id="wallet" title="Narra Wallet">
            <P>Narra uses a built-in self-custodial Solana wallet — no Phantom or Solflare required. Your keypair is generated on first load and stored locally in your browser (localStorage). The private key never touches the server.</P>

            <H3>Sync between web and extension</H3>
            <Steps items={[
              { n: "1", title: "Web generates",  desc: "The web app creates a Solana keypair on first visit and stores the private key in localStorage." },
              { n: "2", title: "Pubkey synced",  desc: "The public key is posted to /api/wallet and stored in the database." },
              { n: "3", title: "Extension reads", desc: "The extension fetches the public key from the backend — both apps show the same address and balance." },
            ]} />

            <H3>Wallet dashboard features</H3>
            <Table
              headers={["Feature", "Description"]}
              rows={[
                ["Balance",          "Live SOL balance from Solana mainnet"],
                ["Deposit address",  "Your address + QR code to receive SOL"],
                ["Export private key","Reveal and copy your base58 private key — keep this secret"],
                ["Import wallet",    "Paste a private key to replace the current wallet"],
                ["Generate new",     "Create a fresh keypair — export first or you'll lose access to funds"],
              ]}
            />

            <Note variant="warn">
              You need at least <strong>0.05 SOL</strong> in your Narra wallet to cover token launch fees on Bags.
            </Note>

            <H3>Migrating from an old extension wallet</H3>
            <P>If you used an older version of the extension before the sync feature, your previous private key is still stored in chrome.storage.local and shown in the extension&apos;s Wallet tab.</P>
            <Steps items={[
              { n: "1", title: "Export from extension", desc: "Extension → Wallet tab → Show private key → Copy the base58 key" },
              { n: "2", title: "Import on web",         desc: "Web app → /wallet → Import wallet → Paste the key → Import & Replace" },
              { n: "3", title: "Synced",                desc: "The web app now owns that keypair and syncs it back to the extension automatically" },
            ]} />
          </Section>

          {/* SCANNING */}
          <Section id="scanning" title="Scanning for Builders">
            <P>Click <strong className="text-white/80">Scan X</strong> on the discovery feed to pull fresh builder posts. The scanner tries two modes, falling back automatically:</P>

            <Table
              headers={["Mode", "Requires", "How it works"]}
              rows={[
                ["Search",   "X Basic tier ($100/mo)", "Keyword search across all recent X posts — broad reach"],
                ["Timeline", "X Free tier (app in a Project)", "Fetches recent posts from 25+ curated known builders"],
              ]}
            />

            <H3>Watched builders (timeline mode)</H3>
            <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-3">
              <p className="text-xs text-white/40 font-mono leading-relaxed">
                levelsio · marc_louvion · t3dotgg · dannypostmaa · swyx · simonw · tdinh_me · jasonleow · therealhansolo · pauloagm · getakraft · theandreboso · ajlkn · yongfook · dvassallo · arvidkahl · pjrvs · csallen · stephsmithio · heyeaslo · andymci · anthilemoon · JanelSGM · Prathkum
              </p>
            </div>

            <H3>Feed filters</H3>
            <Table
              headers={["Filter", "Shows"]}
              rows={[
                ["All",         "Every opportunity, sorted by score"],
                ["Builders",    "Posts without charitable fundraising keywords"],
                ["Charitable",  "Posts with GoFundMe, donation, fundraising signals"],
                ["High Signal", "Opportunities scored 60+"],
              ]}
            />
          </Section>

          {/* NARRATIVES */}
          <Section id="narratives" title="AI Narratives">
            <P>Every post scoring 30 or above automatically gets a narrative generated by <strong className="text-white/80">Claude Sonnet</strong>. Generation happens as part of the scan — no manual trigger needed.</P>

            <Table
              headers={["Field", "Description"]}
              rows={[
                ["Project description", "1–2 sentences on what the builder is shipping"],
                ["Why it matters",      "Why the community should care"],
                ["Token name",          "2–3 word name for the community token"],
                ["Ticker",              "3–5 character symbol, e.g. LVLS, SHIP, DATA"],
                ["Launch narrative",    "2–3 sentences for the Bags launch page"],
              ]}
            />

            <Note variant="warn">
              Narrative generation requires a funded Anthropic API key. Add <Mono>ANTHROPIC_API_KEY</Mono> to <Mono>.env.local</Mono> and top up credits at{" "}
              <a href="https://console.anthropic.com/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-100">
                console.anthropic.com/billing
              </a>.
            </Note>
          </Section>

          {/* LAUNCHING */}
          <Section id="launching" title="Launching Tokens">
            <P>Once a narrative exists, the <strong className="text-white/80">Launch</strong> button appears on the card. It opens a three-step modal:</P>

            <Steps items={[
              { n: "1", title: "Review",  desc: "Confirm the token name, ticker, and narrative copy before proceeding." },
              { n: "2", title: "Balance", desc: "Your Narra wallet balance is checked. You need at least 0.05 SOL to cover Bags launch fees." },
              { n: "3", title: "Confirm", desc: "Submit. The token details and your wallet address are sent to Bags, which creates the Solana token and returns the mint address." },
            ]} />

            <P>Launched opportunities move to <Mono>LAUNCHED</Mono> status in the database and appear on the <Link href="/launched" className="underline hover:text-white/80">/launched</Link> page.</P>
          </Section>

          {/* SCORING */}
          <Section id="scoring" title="Scoring Algorithm">
            <P>Each post scores 0–100 across six weighted signals. A minimum score of 30 is required for narrative generation.</P>

            <Table
              headers={["Signal", "Max pts", "Logic"]}
              rows={[
                ["Engagement rate", "30", "(likes + RTs × 2) ÷ followers — capped at ≥5% rate for max"],
                ["Follower tier",   "20", "Log scale: 100 followers = 3 pts, 1k = 10, 10k = 15, 100k = 20"],
                ["Builder keywords","20", "1 keyword match = 8 pts, 2 = 14 pts, 3+ = 20 pts"],
                ["Demo / media",    "15", "Has media attachment (+10) or demo/live link (+5)"],
                ["GitHub link",     "10", "Post contains a github.com URL"],
                ["Reply activity",   "5", "5 or more replies on the post"],
              ]}
            />

            <H3>Builder keywords</H3>
            <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-3">
              <p className="text-xs text-white/40 font-mono leading-relaxed">
                building in public · built this · just shipped · shipped today · just launched · launched my · open source · indie hacker · side project · saas · demo · mvp · v1 · product update · milestone · revenue · users · feedback · weekend project · solo founder · bootstrapped · mrr · arr · startup · shipped · built · launched · release · update
              </p>
            </div>
          </Section>

          {/* SETUP */}
          <Section id="setup" title="Getting Started">
            <H3>Prerequisites</H3>
            <Table
              headers={["Requirement", "Version / Notes"]}
              rows={[
                ["Node.js",         "v18+"],
                ["pnpm",            "v8+ — npm install -g pnpm"],
                ["PostgreSQL",      "v14+, running locally on port 5432"],
                ["X Developer App", "Must be inside a Project at developer.x.com"],
                ["Anthropic key",   "Any tier — console.anthropic.com"],
              ]}
            />

            <H3>Install & migrate</H3>
            <CodeBlock>{`git clone https://github.com/your-org/bags-scout
cd bags-scout
pnpm install
pnpm --filter db db:migrate`}</CodeBlock>

            <H3>Start the dev server</H3>
            <CodeBlock>{`pnpm --filter web dev --port 3001`}</CodeBlock>

            <H3>Seed sample data (optional)</H3>
            <P>Populates the database with real posts from known builders — useful without an X API key.</P>
            <CodeBlock>{`curl -X POST http://localhost:3001/api/seed
# Reset and re-seed:
curl -X POST "http://localhost:3001/api/seed?reset=true"`}</CodeBlock>

            <H3>Load the extension</H3>
            <Steps items={[
              { n: "1", title: "Build", desc: "pnpm --filter extension build" },
              { n: "2", title: "Open",  desc: "Chrome → chrome://extensions → enable Developer mode" },
              { n: "3", title: "Load",  desc: "Click Load unpacked → select apps/extension/dist" },
              { n: "4", title: "Use",   desc: "Go to x.com → click the Narra Scout icon to open the side panel" },
            ]} />

            <H3>X API — client-not-enrolled error</H3>
            <P>This error means your developer app is not inside an X Project. Fix:</P>
            <Steps items={[
              { n: "1", title: "", desc: "Go to developer.x.com → Projects & Apps" },
              { n: "2", title: "", desc: "Create a new Project (or use an existing one)" },
              { n: "3", title: "", desc: "Move your app inside the Project" },
              { n: "4", title: "", desc: "Regenerate your Bearer Token" },
              { n: "5", title: "", desc: "Update TWITTER_BEARER_TOKEN in .env.local and restart the dev server" },
            ]} />
          </Section>

          {/* ENV VARS */}
          <Section id="env" title="Environment Variables">
            <P>Create <Mono>apps/web/.env.local</Mono> with the following:</P>
            <Table
              headers={["Variable", "Required", "Description"]}
              rows={[
                ["TWITTER_BEARER_TOKEN",    "Yes", "X API v2 bearer token from developer.x.com"],
                ["ANTHROPIC_API_KEY",       "Yes", "Anthropic API key for Claude narrative generation"],
                ["DATABASE_URL",            "Yes", "PostgreSQL connection string"],
                ["BAGS_BASE_URL",           "Yes", "URL of your Bags instance (token launch target)"],
                ["NEXT_PUBLIC_APP_URL",     "Yes", "Public URL of this Narra instance"],
                ["CRON_SECRET",             "No",  "Shared secret for the /api/cron endpoint"],
              ]}
            />
            <CodeBlock>{`TWITTER_BEARER_TOKEN=your_bearer_token_here
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://user@localhost:5432/bags_scout
BAGS_BASE_URL=https://bags.app
NEXT_PUBLIC_APP_URL=http://localhost:3001
CRON_SECRET=any-random-string`}</CodeBlock>
          </Section>

        </div>
      </main>
    </div>
  );
}

/* ── Sub-components ── */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      <div className="border-b border-white/8 pb-3">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-white/80 mt-6 mb-2">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-white/8 border border-white/10 rounded px-1.5 py-0.5 text-[11px] font-mono text-white/70">
      {children}
    </code>
  );
}

function Note({ children, variant = "info" }: { children: React.ReactNode; variant?: "info" | "warn" }) {
  const cls = variant === "warn"
    ? "bg-yellow-500/8 border-yellow-500/20 text-yellow-200/65"
    : "bg-brand-500/8 border-brand-500/20 text-brand-300/70";
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm leading-relaxed ${cls}`}>
      {children}
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-4 text-xs font-mono text-white/55 leading-relaxed overflow-x-auto">
      {children}
    </pre>
  );
}

function Steps({ items }: { items: { n: string; title: string; desc: string }[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/6 border border-white/12 flex items-center justify-center text-[10px] font-mono text-white/35 mt-0.5">
            {item.n || i + 1}
          </span>
          <span className="text-sm text-white/60 leading-relaxed pt-0.5">
            {item.title && <strong className="text-white/80 font-medium">{item.title} — </strong>}
            {item.desc}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 bg-white/3">
            {headers.map(h => (
              <th key={h} className="text-left px-4 py-2.5 font-medium text-white/30 uppercase tracking-wider text-[10px]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-3 align-top leading-relaxed ${j === 0 ? "font-mono text-white/65 whitespace-nowrap" : "text-white/45"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
