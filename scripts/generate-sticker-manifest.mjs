/* Scans the Stickers/ folder and writes sticker-manifest.json so the site
   can list sticker packs without calling the GitHub API (used for local
   testing and as an offline fallback on GitHub Pages).

   Usage:
     node scripts/generate-sticker-manifest.mjs
   Run this whenever you add / remove folders inside Stickers/.
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "Stickers");
const out = path.join(root, "sticker-manifest.json");
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp)$/i;

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "stickers";

const groups = [];
if (fs.existsSync(dir)) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const files = fs
      .readdirSync(path.join(dir, entry.name))
      .filter((f) => IMAGE_EXT.test(f))
      .sort();
    if (!files.length) continue;
    groups.push({ id: slug(entry.name), label: entry.name, folder: entry.name, files });
  }
  groups.sort((a, b) => a.label.localeCompare(b.label));
}

fs.writeFileSync(out, JSON.stringify({ groups }, null, 2) + "\n", "utf8");
console.log(`Wrote ${out} with ${groups.length} group(s):`);
groups.forEach((g) => console.log(`  - ${g.label} (${g.files.length} files)`));
