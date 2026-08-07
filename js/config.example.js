/* =====================================================
   CONFIG EXAMPLE — copy this file to js/config.js and
   fill in your real values. config.js is gitignored so
   your private keys / codes / emails are never committed.
   ===================================================== */

const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-PUBLISHABLE-ANON-KEY";
const SUPABASE_BUCKET = "couple-album";

/* Repo that hosts the Stickers/ folder. */
const STICKERS_REPO = "YOUR_USERNAME/REPO_NAME";

/* 6-digit login codes — Boyfriend and Girlfriend. */
const LOGIN_CODES = {
  boyfriend: "000000",
  girlfriend: "000000",
};

/* Display names shown once logged in. */
const COUPLE = {
  boyfriend: { name: "Boyfriend", role: "Boyfriend" },
  girlfriend: { name: "Girlfriend", role: "Girlfriend" },
};

/* EmailJS keys + recipient addresses. */
const EMAILJS = {
  publicKey: "",
  serviceId: "",
  templateId: "",
  boyfriendEmail: "",
  girlfriendEmail: "",
};