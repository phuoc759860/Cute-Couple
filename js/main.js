(() => {
  "use strict";

  /* ---------- Helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const COUNTER_EVENT = new Date("2026-08-14T00:00:00").getTime();

  /* ---------- Preloader ---------- */
  window.addEventListener("load", () => {
    setTimeout(() => $("#preloader").classList.add("hidden"), 400);
  });
  setTimeout(() => {
    const pre = $("#preloader");
    if (pre) pre.classList.add("hidden");
  }, 4000);

  /* ---------- Navbar scroll state ---------- */
  const navbar = $("#navbar");
  const onScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
    setActiveLink();
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Active nav link ---------- */
  const sections = $$("section[id]");
  const navLinks = $$(".nav-links a");
  function setActiveLink() {
    const pos = window.scrollY + 140;
    let current = "home";
    for (const s of sections) {
      if (pos >= s.offsetTop) current = s.id;
    }
    navLinks.forEach((l) => {
      l.classList.toggle("active", l.getAttribute("href") === `#${current}`);
    });
  }

  /* ---------- Mobile menu ---------- */
  const navToggle = $("#navToggle");
  const navLinksEl = $("#navLinks");
  navToggle.addEventListener("click", () => {
    navToggle.classList.toggle("open");
    navLinksEl.classList.toggle("open");
  });
  navLinksEl.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      navToggle.classList.remove("open");
      navLinksEl.classList.remove("open");
    }
  });

  /* ---------- Floating hearts ---------- */
  const heartsWrap = $("#floatingHearts");
  const HEART_SVG =
    '<svg class="float-heart" viewBox="0 0 24 24" fill="currentColor" style="font-size:inherit"><path d="M12 21s-7.5-4.9-10-9.5C.5 8.5 2 4.5 6 3.5c2.4-.6 4.5.3 6 2 1.5-1.7 3.6-2.6 6-2 4 1 5.5 5 4 8C19.5 16.1 12 21 12 21z"/></svg>';

  function spawnHeart() {
    const size = 14 + Math.random() * 22;
    const heart = document.createElement("span");
    heart.className = "float-heart";
    heart.style.cssText = `
      left: ${Math.random() * 100}%;
      font-size: ${size}px;
      animation-duration: ${6 + Math.random() * 6}s;
      animation-delay: ${Math.random() * 2}s;
    `;
    heart.innerHTML = HEART_SVG;
    heartsWrap.appendChild(heart);
    setTimeout(() => heart.remove(), 14000);
  }
  for (let i = 0; i < 12; i++) setTimeout(spawnHeart, i * 260);

  /* ---------- Gallery filtering ---------- */
  const filterBtns = $$(".filter-btn");
  const cards = $$(".card");
  let activeCategory = "all";

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.filter;
      cards.forEach((card) => {
        const match = activeCategory === "all" || card.dataset.category === activeCategory;
        card.classList.toggle("hide", !match);
      });
    });
  });

  /* ---------- Tilt effect ---------- */
  const tiltCards = $$("[data-tilt]");
  if (window.matchMedia("(hover: hover)").matches && "ontouchstart" in window === false) {
    tiltCards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Lightbox ---------- */
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");
  const lightboxCaption = $("#lightboxCaption");
  const lightboxClose = $("#lightboxClose");
  const lightboxPrev = $("#lightboxPrev");
  const lightboxNext = $("#lightboxNext");
  let lightboxIndex = 0;

  function visibleCards() {
    return cards.filter((c) => !c.classList.contains("hide"));
  }

  function openLightbox(index) {
    const visible = visibleCards();
    if (!visible.length) return;
    const clamped = Math.max(0, Math.min(index, visible.length - 1));
    const card = visible[clamped];
    const img = $("img", card);
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = `${$(".card-title", card).textContent} — ${$(".card-desc", card).textContent}`;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lightboxIndex = clamped;
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  cards.forEach((card, i) => {
    card.addEventListener("click", () => {
      const visible = visibleCards();
      openLightbox(visible.indexOf(card) === -1 ? 0 : visible.indexOf(card));
    });
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => openLightbox(lightboxIndex - 1));
  lightboxNext.addEventListener("click", () => openLightbox(lightboxIndex + 1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(lightboxIndex - 1);
    if (e.key === "ArrowRight") openLightbox(lightboxIndex + 1);
  });

  /* ---------- Countdown ---------- */
  const cdDays = $("#cdDays");
  const cdHours = $("#cdHours");
  const cdMinutes = $("#cdMinutes");
  const cdSeconds = $("#cdSeconds");

  function updateCountdown() {
    const now = Date.now();
    let diff = COUNTER_EVENT - now;
    if (diff < 0) diff = 0;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const pad = (n) => String(n).padStart(2, "0");
    cdDays.textContent = pad(days);
    cdHours.textContent = pad(hours);
    cdMinutes.textContent = pad(minutes);
    cdSeconds.textContent = pad(seconds);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => observer.observe(el));

  /* ---------- Toast ---------- */
  function showToast(msg) {
    const toast = $("#toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2600);
  }

  let hintShown = false;
  window.addEventListener("keydown", (e) => {
    if (!hintShown && e.key.toLowerCase() === "g") {
      showToast("Tip: use ← → arrow keys in the lightbox");
      hintShown = true;
    }
  });
})();
