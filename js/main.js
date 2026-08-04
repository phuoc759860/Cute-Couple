(() => {
  "use strict";

  /* ---------- Helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const COUNTER_EVENT = new Date("2026-08-14T00:00:00").getTime();

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

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
  const galleryGrid = $("#galleryGrid");
  const filterBtns = $$(".filter-btn");
  let activeCategory = "all";

  function visibleCards() {
    return $$(".card", galleryGrid).filter((c) => !c.classList.contains("hide"));
  }

  function applyFilter() {
    const cards = $$(".card", galleryGrid);
    cards.forEach((card) => {
      const match = activeCategory === "all" || card.dataset.category === activeCategory;
      card.classList.toggle("hide", !match);
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.filter;
      applyFilter();
    });
  });

  /* ---------- Tilt effect ---------- */
  function bindTilt(card) {
    if (!window.matchMedia("(hover: hover)").matches) return;
    if ("ontouchstart" in window) return;
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  }
  $$("[data-tilt]", galleryGrid).forEach(bindTilt);

  /* ---------- Lightbox ---------- */
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");
  const lightboxCaption = $("#lightboxCaption");
  const lightboxClose = $("#lightboxClose");
  const lightboxPrev = $("#lightboxPrev");
  const lightboxNext = $("#lightboxNext");
  let lightboxIndex = 0;

  function openLightbox(index) {
    const visible = visibleCards();
    if (!visible.length) return;
    const clamped = Math.max(0, Math.min(index, visible.length - 1));
    const card = visible[clamped];
    const img = $("img", card);
    const title = $(".card-title", card).textContent;
    const desc = $(".card-desc", card).textContent;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = desc ? `${title} — ${desc}` : title;
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

  function bindCard(card) {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".card-delete")) return;
      const visible = visibleCards();
      openLightbox(visible.indexOf(card) === -1 ? 0 : visible.indexOf(card));
    });
  }
  $$(".card", galleryGrid).forEach(bindCard);

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

  /* ---------- Saved photos (IndexedDB) ---------- */
  const DB_NAME = "couple-album";
  const DB_VERSION = 1;
  const STORE = "photos";
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB not supported"));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function idbRequest(mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  const idbGetAll = () => idbRequest("readonly", (s) => s.getAll());
  const idbPut = (record) => idbRequest("readwrite", (s) => s.put(record));
  const idbDelete = (id) => idbRequest("readwrite", (s) => s.delete(id));

  const DELETE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg>';

  function makeSavedCard(record) {
    const fig = document.createElement("figure");
    fig.className = "card";
    fig.dataset.category = record.category || "everyday";
    fig.dataset.savedId = record.id;
    fig.innerHTML = `
      <img src="${record.dataUrl}" alt="${escapeHtml(record.title)}" />
      <figcaption class="card-overlay">
        <p class="card-date">${escapeHtml(record.dateLabel || "Added")}</p>
        <h3 class="card-title">${escapeHtml(record.title || "Our Memory")}</h3>
        <p class="card-desc">${escapeHtml(record.desc || "")}</p>
      </figcaption>
      <button class="card-delete" type="button" aria-label="Delete photo">${DELETE_ICON}</button>
    `;
    const del = $(".card-delete", fig);
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!window.confirm("Remove this photo from the album?")) return;
      idbDelete(record.id).then(() => {
        fig.remove();
        showToast("Photo removed");
      });
    });
    return fig;
  }

  async function loadSavedPhotos() {
    try {
      const records = await idbGetAll();
      records
        .sort((a, b) => b.addedAt - a.addedAt)
        .forEach((r) => {
          const card = makeSavedCard(r);
          galleryGrid.appendChild(card);
          bindCard(card);
          bindTilt(card);
        });
      applyFilter();
    } catch (err) {
      console.warn("Could not load saved photos:", err);
    }
  }

  /* ---------- Add Photo flow ---------- */
  const addPhotoBtn = $("#addPhotoBtn");
  const photoInput = $("#photoInput");
  const photoModal = $("#photoModal");
  const photoModalClose = $("#photoModalClose");
  const photoCancel = $("#photoCancel");
  const photoSave = $("#photoSave");
  const photoPreviewImg = $("#photoPreviewImg");
  const photoPreview = $("#photoPreview");
  const photoTitle = $("#photoTitle");
  const photoDesc = $("#photoDesc");
  const photoCategory = $("#photoCategory");
  let pendingDataUrl = null;

  function openModal() {
    photoModal.classList.add("open");
    photoModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    photoModal.classList.remove("open");
    photoModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function resetModal() {
    pendingDataUrl = null;
    photoInput.value = "";
    photoTitle.value = "";
    photoDesc.value = "";
    photoCategory.value = "everyday";
    photoPreviewImg.removeAttribute("src");
    photoPreview.innerHTML = '<span class="preview-empty">No image selected yet</span>';
  }

  addPhotoBtn.addEventListener("click", () => photoInput.click());
  photoInput.addEventListener("change", () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      pendingDataUrl = reader.result;
      photoPreviewImg.src = pendingDataUrl;
      photoPreview.innerHTML = "";
      photoPreview.appendChild(photoPreviewImg);
      if (!photoTitle.value) {
        photoTitle.value = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      }
      openModal();
    };
    reader.readAsDataURL(file);
  });

  photoModalClose.addEventListener("click", () => {
    closeModal();
    setTimeout(resetModal, 350);
  });
  photoCancel.addEventListener("click", () => {
    closeModal();
    setTimeout(resetModal, 350);
  });
  photoModal.addEventListener("click", (e) => {
    if (e.target === photoModal) {
      closeModal();
      setTimeout(resetModal, 350);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (!photoModal.classList.contains("open")) return;
    if (e.key === "Escape") {
      closeModal();
      setTimeout(resetModal, 350);
    }
  });

  photoSave.addEventListener("click", async () => {
    if (!pendingDataUrl) {
      showToast("No image selected");
      return;
    }
    const record = {
      id: `saved-${Date.now()}`,
      dataUrl: pendingDataUrl,
      title: (photoTitle.value || "Our Memory").trim(),
      desc: photoDesc.value.trim(),
      category: photoCategory.value,
      dateLabel: new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      addedAt: Date.now(),
    };
    try {
      await idbPut(record);
      const card = makeSavedCard(record);
      galleryGrid.appendChild(card);
      bindCard(card);
      bindTilt(card);
      applyFilter();
      closeModal();
      setTimeout(resetModal, 350);
      showToast("Photo saved to your album");
    } catch (err) {
      console.error(err);
      showToast("Could not save the photo");
    }
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
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  /* ---------- Init ---------- */
  loadSavedPhotos();
})();
