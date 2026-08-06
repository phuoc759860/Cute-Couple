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

/* =====================================================
   LOGIN CODES — a soft, 6-digit phone-style lock.
   Entering the right code unlocks the whole site and
   identifies you as the Boyfriend or the Girlfriend.
   NOTE: this is a client-side lock (codes live in this
   file), not real security — it keeps strangers out and
   tells the Dating feature who is who.
   ===================================================== */
const LOGIN_CODES = {
  boyfriend: "759860",
  girlfriend: "170500",
};

/* Display names used across the site once logged in. */
const COUPLE = {
  boyfriend: { name: "Anh F", role: "Boyfriend" },
  girlfriend: { name: "Em Mỹ", role: "Girlfriend" },
};

/* =====================================================
   EMAILJS — free email-from-a-static-site (no backend).
   1) Sign up at https://www.emailjs.com (free)
   2) "Email Services" → add a service (e.g. Gmail) → copy Service ID
   3) "Email Templates" → create a template using these variables:
        {{to_email}} {{to_name}} {{from_name}} {{date_title}}
        {{date_day}} {{date_time}} {{place}} {{activity}}
        {{duration}} {{importance}} {{note}} {{link}}
      → copy Template ID
   4) Account → General → copy the Public Key
   Paste them below. Leave publicKey empty to disable email
   (date requests then show as in-app notifications only).
   ===================================================== */
const EMAILJS = {
  publicKey: "",
  serviceId: "",
  templateId: "",
  boyfriendEmail: "phuochuynh120@gmail.com",
  girlfriendEmail: "nttmy170505@gmail.com",
};
