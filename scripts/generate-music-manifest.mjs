import fs from "node:fs";
import path from "node:path";

const musicDir = path.resolve("Musics");
if (!fs.existsSync(musicDir)) {
  console.error("Musics/ folder not found");
  process.exit(1);
}

const files = fs
  .readdirSync(musicDir)
  .filter((f) => /\.(mp3|m4a|ogg|oga|wav|flac)$/i.test(f))
  .sort();

const tracks = files.map((f) => "Musics/" + encodeURI(f));

const out = path.resolve("music-manifest.json");
fs.writeFileSync(out, JSON.stringify({ tracks }, null, 2) + "\n");

console.log(`Wrote ${out} with ${tracks.length} track(s):`);
tracks.forEach((t) => console.log(`  - ${t}`));
