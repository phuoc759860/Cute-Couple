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

  /* ---------- Saved photos (Supabase) ---------- */
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const DELETE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg>';

  function makeSavedCard(record) {
    const fig = document.createElement("figure");
    fig.className = "card";
    fig.dataset.category = record.category || "everyday";
    fig.dataset.savedId = record.id;
    const dateLabel = record.dateLabel
      ? record.dateLabel
      : new Date(record.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    fig.innerHTML = `
      <img src="${record.url}" alt="${escapeHtml(record.title)}" loading="lazy" />
      <figcaption class="card-overlay">
        <p class="card-date">${escapeHtml(dateLabel)}</p>
        <h3 class="card-title">${escapeHtml(record.title || "Our Memory")}</h3>
        <p class="card-desc">${escapeHtml(record.description || "")}</p>
      </figcaption>
      <button class="card-delete" type="button" aria-label="Delete photo">${DELETE_ICON}</button>
    `;
    const del = $(".card-delete", fig);
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!window.confirm("Remove this photo from the album?")) return;
      deletePhoto(record, fig);
    });
    return fig;
  }

  async function deletePhoto(record, cardEl) {
    try {
      const { error: delError } = await supabase
        .from("photos")
        .delete()
        .eq("id", record.id);
      if (delError) throw delError;
      const { error: storageError } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .remove([record.storage_path]);
      if (storageError) throw storageError;
      cardEl.remove();
      showToast("Photo removed");
    } catch (err) {
      console.error(err);
      showToast("Could not remove the photo");
    }
  }

  async function loadSavedPhotos() {
    try {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      (data || []).forEach((row) => {
        const url = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(row.storage_path).data.publicUrl;
        const card = makeSavedCard({ ...row, url });
        galleryGrid.appendChild(card);
        bindCard(card);
        bindTilt(card);
      });
      applyFilter();
    } catch (err) {
      console.warn("Could not load saved photos:", err.message || err);
    }
  }

  function subscribeToPhotos() {
    try {
      supabase
        .channel("photos-live")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "photos" },
          (payload) => {
            const row = payload.new;
            const url = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(row.storage_path).data.publicUrl;
            const card = makeSavedCard({ ...row, url });
            galleryGrid.prepend(card);
            bindCard(card);
            bindTilt(card);
            applyFilter();
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "photos" },
          (payload) => {
            const el = galleryGrid.querySelector(`[data-saved-id="${payload.old.id}"]`);
            if (el) el.remove();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime not available:", err.message || err);
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
  let pendingFile = null;

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
    pendingFile = null;
    photoInput.value = "";
    photoTitle.value = "";
    photoDesc.value = "";
    photoCategory.value = "everyday";
    photoPreviewImg.removeAttribute("src");
    photoPreview.innerHTML = '<span class="preview-empty">No image selected yet</span>';
  }

  function resizeImage(file, maxDim = 1600) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
                resolve(new File([blob], name, { type: "image/jpeg" }));
              } else {
                reject(new Error("Image conversion failed"));
              }
            },
            "image/jpeg",
            0.85
          );
        };
        img.onerror = () => reject(new Error("Could not read the image"));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error("Could not read the file"));
      reader.readAsDataURL(file);
    });
  }

  addPhotoBtn.addEventListener("click", () => photoInput.click());
  photoInput.addEventListener("change", () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file");
      return;
    }
    pendingFile = file;
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
    if (!pendingFile || !pendingDataUrl) {
      showToast("No image selected");
      return;
    }
    photoSave.disabled = true;
    photoSave.textContent = "Saving...";
    try {
      const resized = await resizeImage(pendingFile);
      const ext = resized.type === "image/jpeg" ? "jpg" : "png";
      const storagePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(storagePath, resized, { contentType: resized.type });
      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from("photos")
        .insert({
          title: (photoTitle.value || "Our Memory").trim(),
          description: photoDesc.value.trim(),
          category: photoCategory.value,
          storage_path: storagePath,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      const url = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(storagePath).data.publicUrl;
      const card = makeSavedCard({ ...data, url });
      galleryGrid.appendChild(card);
      bindCard(card);
      bindTilt(card);
      applyFilter();
      closeModal();
      setTimeout(resetModal, 350);
      showToast("Photo shared with everyone");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not save the photo");
    } finally {
      photoSave.disabled = false;
      photoSave.textContent = "Save Photo";
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
  subscribeToPhotos();
})();
