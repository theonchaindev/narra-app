#!/usr/bin/env node
// Copies the Prisma query engine binary for rhel-openssl-3.0.x into apps/web/.prisma/client/
// so that Vercel Lambda can find it at runtime (it searches /var/task/apps/web/.prisma/client/).

const fs = require("fs");
const path = require("path");

const TARGET_PLATFORM = "rhel-openssl-3.0.x";
const ENGINE_NAME = `libquery_engine-${TARGET_PLATFORM}.so.node`;

const scriptDir = __dirname; // packages/db/scripts/
const repoRoot = path.resolve(scriptDir, "../../..");
const destDir = path.resolve(repoRoot, "apps/web/.prisma/client");

// Search the pnpm store for the engine binary
function findEngine(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === ENGINE_NAME) return fullPath;
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        const found = findEngine(fullPath);
        if (found) return found;
      }
    }
  } catch (_) {}
  return null;
}

const pnpmStore = path.join(repoRoot, "node_modules/.pnpm");
const enginePath = findEngine(pnpmStore);

if (!enginePath) {
  console.log(`[copy-engine] ${ENGINE_NAME} not found in pnpm store, skipping.`);
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
const dest = path.join(destDir, ENGINE_NAME);
fs.copyFileSync(enginePath, dest);
console.log(`[copy-engine] Copied ${ENGINE_NAME} -> ${dest}`);
