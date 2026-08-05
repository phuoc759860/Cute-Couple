/* =====================================================
   SUPABASE CONFIG
   Supabase Dashboard -> Project Settings -> API Keys
   Use the PUBLISHABLE key (starts with sb_publishable_).
   Never put a secret (sb_secret_) key here — it is a
   full admin key and must not be exposed publicly.
   ===================================================== */

const SUPABASE_URL = "https://vdnablfsknvowhzzwpey.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkbmFibGZza252b3doenp3cGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NTA1MTgsImV4cCI6MjEwMTQyNjUxOH0.LgzMgwojwL22kuf4beO4yEpAI_LWpu1Jz6Z0iJoDJaA";
const SUPABASE_BUCKET = "couple-album";

/* Repo that hosts the Stickers/ folder — used to auto-list sticker packs
   at runtime via the GitHub API when the site is hosted on GitHub Pages. */
const STICKERS_REPO = "phuoc759860/Cute-Couple";
