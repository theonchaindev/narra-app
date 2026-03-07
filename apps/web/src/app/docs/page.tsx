import type { Metadata } from "next";
import { DocsLayout } from "@/components/DocsLayout";

export const metadata: Metadata = {
  title: "Docs — Narra",
  description: "Everything you need to know about Narra — builder discovery, narratives, and token launches.",
};

export default function DocsPage() {
  return <DocsLayout />;
}
