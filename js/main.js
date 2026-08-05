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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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

  /* ---------- Gallery filtering + pagination + search ---------- */
  const galleryGrid = $("#galleryGrid");
  const paginationEl = $("#pagination");
  const filterBtns = $$(".filter-btn");
  const galleryCountEl = $("#galleryCount");
  const gallerySearch = $("#gallerySearch");
  const searchClear = $("#searchClear");
  const refreshBtn = $("#refreshBtn");
  const galleryLoading = $("#galleryLoading");
  const galleryEmpty = $("#galleryEmpty");
  const galleryEmptyTitle = $("#galleryEmptyTitle");
  const galleryEmptyText = $("#galleryEmptyText");
  const PAGE_SIZE = 6;
  let activeCategory = "all";
  let currentPage = 1;
  let searchQuery = "";
  let galleryCards = [];
  let initialLoadDone = false;

  function initGalleryCards() {
    galleryCards = $$(".card", galleryGrid);
  }

  function cardMatchesSearch(card) {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const text = [
      $(".card-title", card),
      $(".card-desc", card),
      $(".card-date", card),
    ]
      .filter(Boolean)
      .map((el) => el.textContent.toLowerCase());
    return text.some((t) => t.includes(q));
  }

  function filteredCards() {
    return galleryCards.filter(
      (c) =>
        (activeCategory === "all" || c.dataset.category === activeCategory) &&
        cardMatchesSearch(c)
    );
  }

  function visibleCards() {
    return $$(".card", galleryGrid).filter((c) => !c.classList.contains("hide"));
  }

  function updateGalleryCount(filteredLength) {
    const total = galleryCards.length;
    if (total === 0) {
      galleryCountEl.innerHTML = "0 memories";
    } else if (filteredLength === total) {
      galleryCountEl.innerHTML = `<strong>${total}</strong> ${total === 1 ? "memory" : "memories"}`;
    } else {
      galleryCountEl.innerHTML = `Showing <strong>${filteredLength}</strong> of <strong>${total}</strong> memories`;
    }
  }

  function updateEmptyState(filteredLength) {
    const noPhotos = galleryCards.length === 0;
    const noResults = !noPhotos && filteredLength === 0;
    if (noPhotos) {
      galleryEmptyTitle.textContent = "No memories yet";
      galleryEmptyText.textContent = "Be the first to add a photo to our shared album.";
      $("#emptyAddBtn").style.display = "";
    } else if (noResults) {
      galleryEmptyTitle.textContent = "No photos found";
      galleryEmptyText.textContent = searchQuery
        ? `Nothing matches "${searchQuery}". Try a different search or category.`
        : "No photos match this category yet.";
      $("#emptyAddBtn").style.display = "none";
    }
    galleryEmpty.classList.toggle("show", noPhotos || noResults);
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      paginationEl.classList.remove("show");
      paginationEl.innerHTML = "";
      return;
    }
    paginationEl.classList.add("show");
    let html = `<span class="pagination-info">Page ${currentPage} of ${totalPages}</span>`;
    html += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Previous page">&#8249;</button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} aria-label="Next page">&#8250;</button>`;
    paginationEl.innerHTML = html;
  }

  function goToPage(page, totalPages) {
    currentPage = Math.max(1, Math.min(page, totalPages));
    renderGallery();
    const top = $("#gallery").offsetTop - 90;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  }

  function renderGallery() {
    const filtered = filteredCards();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    galleryCards.forEach((card) => {
      const catMatch = activeCategory === "all" || card.dataset.category === activeCategory;
      const pos = filtered.indexOf(card);
      card.classList.toggle("hide", !(catMatch && cardMatchesSearch(card) && pos >= start && pos < end));
    });
    galleryLoading.classList.toggle("show", !initialLoadDone);
    updateGalleryCount(filtered.length);
    updateEmptyState(filtered.length);
    renderPagination(totalPages);
  }

  function addGalleryCard(card, atTop = false) {
    if (atTop) {
      galleryGrid.prepend(card);
      galleryCards.unshift(card);
    } else {
      galleryGrid.appendChild(card);
      galleryCards.push(card);
    }
    bindCard(card);
    bindTilt(card);
    renderGallery();
  }

  function removeGalleryCard(cardEl) {
    const idx = galleryCards.indexOf(cardEl);
    if (idx > -1) galleryCards.splice(idx, 1);
    cardEl.remove();
    renderGallery();
  }

  paginationEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".page-btn");
    if (!btn || btn.disabled) return;
    const page = parseInt(btn.dataset.page, 10);
    const filtered = filteredCards();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    goToPage(page, totalPages);
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.filter;
      currentPage = 1;
      renderGallery();
    });
  });

  gallerySearch.addEventListener("input", () => {
    searchQuery = gallerySearch.value.trim();
    searchClear.classList.toggle("show", !!searchQuery);
    currentPage = 1;
    renderGallery();
  });
  searchClear.addEventListener("click", () => {
    gallerySearch.value = "";
    searchQuery = "";
    searchClear.classList.remove("show");
    currentPage = 1;
    renderGallery();
    gallerySearch.focus();
  });

  async function refreshPhotos() {
    if (refreshBtn.classList.contains("spinning")) return;
    refreshBtn.classList.add("spinning");
    try {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data || [];
      const serverIds = new Set(rows.map((r) => r.id));
      galleryCards.slice().forEach((card) => {
        if (card.dataset.savedId && !serverIds.has(card.dataset.savedId)) {
          removeGalleryCard(card);
        }
      });
      const localIds = new Set(galleryCards.map((c) => c.dataset.savedId).filter(Boolean));
      rows
        .slice()
        .reverse()
        .forEach((row) => {
          if (localIds.has(row.id)) return;
          const url = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(row.storage_path).data.publicUrl;
          addGalleryCard(makeSavedCard({ ...row, url }), true);
        });
      showToast("Gallery refreshed");
    } catch (err) {
      console.error(err);
      showToast("Could not refresh the gallery");
    } finally {
      refreshBtn.classList.remove("spinning");
    }
  }
  refreshBtn.addEventListener("click", refreshPhotos);

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
  const lightboxCounter = $("#lightboxCounter");
  const lightboxDownload = $("#lightboxDownload");
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
    lightboxCounter.textContent = `${clamped + 1} / ${visible.length}`;
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
  lightboxDownload.addEventListener("click", downloadCurrentPhoto);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(lightboxIndex - 1);
    if (e.key === "ArrowRight") openLightbox(lightboxIndex + 1);
  });

  async function downloadCurrentPhoto() {
    const src = lightboxImg.src;
    if (!src) return;
    try {
      const resp = await fetch(src);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const name =
        (lightboxCaption.textContent || "our-memory")
          .replace(/[^\w\- ]+/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .slice(0, 40) || "our-memory";
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Photo downloaded");
    } catch (err) {
      console.error(err);
      window.open(src, "_blank");
    }
  }

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
      removeGalleryCard(cardEl);
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
      const cards = (data || []).map((row) => {
        const url = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(row.storage_path).data.publicUrl;
        return makeSavedCard({ ...row, url });
      });
      cards.forEach((card) => {
        galleryGrid.appendChild(card);
        galleryCards.push(card);
        bindCard(card);
        bindTilt(card);
      });
    } catch (err) {
      console.warn("Could not load saved photos:", err.message || err);
    } finally {
      initialLoadDone = true;
      renderGallery();
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
            addGalleryCard(makeSavedCard({ ...row, url }), true);
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "photos" },
          (payload) => {
            const el = galleryGrid.querySelector(`[data-saved-id="${payload.old.id}"]`);
            if (el) removeGalleryCard(el);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime not available:", err.message || err);
    }
  }

  /* ---------- Add Photo flow ---------- */
  const addPhotoBtn = $("#addPhotoBtn");
  const emptyAddBtn = $("#emptyAddBtn");
  const photoInput = $("#photoInput");
  const photoModal = $("#photoModal");
  const photoModalClose = $("#photoModalClose");
  const photoCancel = $("#photoCancel");
  const photoSave = $("#photoSave");
  const photoTitle = $("#photoTitle");
  const photoDesc = $("#photoDesc");
  const photoCategory = $("#photoCategory");
  const uploadProgress = $("#uploadProgress");
  const uploadProgressText = $("#uploadProgressText");
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
    editor.baseImage = null;
    editor.frame = "none";
    editor.stickers = [];
    editor.selected = -1;
    editorCanvas.width = 0;
    editorCanvas.height = 0;
    editorCanvas.style.width = "";
    editorCanvas.style.height = "";
    stickerLayer.innerHTML = "";
    frameLayer.className = "frame-layer";
    editorPanel.hidden = true;
    editorHint.style.display = "flex";
    stickerSizeEl.value = 15;
    removeStickerBtn.disabled = true;
    clearDecorBtn.disabled = true;
    updateFrameOptions();
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
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
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
  emptyAddBtn.addEventListener("click", () => photoInput.click());
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
      const img = new Image();
      img.onload = () => {
        initEditor(img);
        if (!photoTitle.value) {
          photoTitle.value = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        }
        openModal();
      };
      img.onerror = () => showToast("Could not read the image");
      img.src = pendingDataUrl;
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
    uploadProgress.classList.add("show", "indeterminate");
    uploadProgressText.textContent = "Uploading your photo...";
    try {
      const image = editorHasDecorations() ? await compositeEditedImage() : await resizeImage(pendingFile);
      const ext = image.type === "image/jpeg" ? "jpg" : "png";
      const storagePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(storagePath, image, { contentType: image.type });
      if (uploadError) throw uploadError;

      uploadProgressText.textContent = "Saving details...";

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
      addGalleryCard(makeSavedCard({ ...data, url }), true);
      closeModal();
      setTimeout(resetModal, 350);
      showToast("Photo shared with everyone");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not save the photo");
    } finally {
      photoSave.disabled = false;
      photoSave.textContent = "Save Photo";
      uploadProgress.classList.remove("show", "indeterminate");
    }
  });

  /* ---------- Photo editor ---------- */
  const editorStage = $("#editorStage");
  const editorCanvas = $("#editorCanvas");
  const stickerLayer = $("#stickerLayer");
  const frameLayer = $("#frameLayer");
  const editorHint = $("#editorHint");
  const editorPanel = $("#editorPanel");
  const editorTabs = $$(".editor-tab");
  const editorSubpanels = $$(".editor-subpanel");
  const frameOptions = $("#frameOptions");
  const stickerGrid = $("#stickerGrid");
  const stickerSizeEl = $("#stickerSize");
  const removeStickerBtn = $("#removeStickerBtn");
  const textInput = $("#textInput");
  const textFont = $("#textFont");
  const textColor = $("#textColor");
  const addTextBtn = $("#addTextBtn");
  const clearDecorBtn = $("#clearDecorBtn");

  const EMOJI_FONT =
    '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

  const FALLBACK_STICKER_GROUPS = [
    {
      id: "cute",
      label: "Cute girls",
      folder: "cute girls",
      files: [
        "1157-cute-girl-17.png", "1767-cute-girl-29.png", "1828-cute-girl-14.png",
        "2217-cute-girl-27.png", "2242-cute-girl-23.png", "2467-cute-girl-5.png",
        "2544-cute-girl-26.png", "2664-cute-girl-20.png", "2669-cute-girl-24.png",
        "3083-cute-girl-19.png", "3287-cute-girl-16.png", "3306-cute-girl-2.png",
        "3965-cute-girl-1.png", "4003-cute-girl-28.png", "4497-cute-girl-25.png",
        "4838-cute-girl-22.png", "5081-cute-girl-21.png", "6307-cute-girl-10.png",
        "7399-cute-girl-12.png", "7790-cute-girl-7.png", "7969-cute-girl-4.png",
        "8789-cute-girl-30.png", "8924-cute-girl-11.png", "9228-cute-girl-8.png",
        "9286-cute-girl-15.png",
      ],
    },
    {
      id: "hamster",
      label: "Hamster",
      folder: "hamster",
      files: [
        "1519-kawaii-hamster.png", "2023-kawaii-hamster.png", "2286-kawaii-hamster.png",
        "2387-kawaii-hamster.png", "3789-kawaii-hamster.png", "4088-kawaii-hamster.png",
        "4245-kawaii-hamster.png", "4246-kawaii-hamster.png", "4522-kawaii-hamster.png",
        "5190-kawaii-hamster.png", "5462-kawaii-hamster.png", "5536-kawaii-hamster.png",
        "6275-kawaii-hamster.png", "6617-kawaii-hamster.png", "7571-kawaii-hamster.png",
        "8288-kawaii-hamster.png", "8581-kawaii-hamster.png", "9297-kawaii-hamster.png",
        "9505-kawaii-hamster.png", "9795-kawaii-hamster.png",
      ],
    },
    {
      id: "meme",
      label: "Meme",
      folder: "Meme",
      files: [
        "1028-sex-2.png", "1917-nom-fast.png", "2026-smoking-rat.jpg",
        "3516-cat-meme-2.png", "4018-meme-brain-11.png", "4458-yeaaaa.gif",
        "4727-ishowspeed.png", "6273-what-the.png", "6543-stop-pls.png",
        "6665-scubaa.gif", "7444-meme-brain-7.png", "8765-chad-21.png",
        "9066-let-em-cook.png", "9144-the-rock.png",
      ],
    },
  ];

  const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|bmp)$/i;

  const slug = (s) =>
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "stickers";

  let stickerGroups = [];
  let activeStickerGroup = null;

  function isLocalHost() {
    return (
      location.protocol === "file:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1"
    );
  }

  async function fetchStickerGroupsFromGitHub() {
    const cacheKey = "lc-stickers-v1";
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (cached && Array.isArray(cached.groups) && cached.groups.length && Date.now() - cached.t < 3600000) {
        return cached.groups;
      }
    } catch (_) {}
    const base = `https://api.github.com/repos/${STICKERS_REPO}/contents/Stickers`;
    const res = await fetch(base);
    if (!res.ok) throw new Error("github list failed: " + res.status);
    const items = await res.json();
    if (!Array.isArray(items)) throw new Error("unexpected github response");
    const groups = [];
    for (const item of items) {
      if (item.type !== "dir") continue;
      const subRes = await fetch(item.url);
      if (!subRes.ok) continue;
      const sub = await subRes.json();
      if (!Array.isArray(sub)) continue;
      const files = sub
        .filter((f) => f.type === "file" && IMAGE_EXT_RE.test(f.name))
        .map((f) => f.name)
        .sort();
      if (!files.length) continue;
      groups.push({ id: slug(item.name), label: item.name, folder: item.name, files });
    }
    groups.sort((a, b) => a.label.localeCompare(b.label));
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), groups }));
    } catch (_) {}
    return groups;
  }

  async function fetchStickerGroupsFromManifest() {
    const res = await fetch("sticker-manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error("sticker manifest missing");
    const data = await res.json();
    if (!data || !Array.isArray(data.groups)) throw new Error("bad sticker manifest");
    return data.groups;
  }

  async function initStickerGroups() {
    const sources = isLocalHost()
      ? [fetchStickerGroupsFromManifest, fetchStickerGroupsFromGitHub]
      : [fetchStickerGroupsFromGitHub, fetchStickerGroupsFromManifest];
    for (const src of sources) {
      try {
        const groups = await src();
        if (groups && groups.length) {
          stickerGroups = groups;
          break;
        }
      } catch (_) {}
    }
    if (!stickerGroups.length) stickerGroups = FALLBACK_STICKER_GROUPS.slice();
    activeStickerGroup = stickerGroups[0] ? stickerGroups[0].id : null;
    renderStickerSections();
    renderStickerGrid();
  }

  function stickerSrc(group, file) {
    return "Stickers/" + encodeURI(group.folder) + "/" + encodeURI(file);
  }

  const stickerImgCache = new Map();
  function getStickerImage(src) {
    if (!stickerImgCache.has(src)) {
      const img = new Image();
      img.src = src;
      stickerImgCache.set(src, img);
    }
    return stickerImgCache.get(src);
  }

  const stickerImagesGrid = $("#stickerImagesGrid");
  const stickerSections = $("#stickerSections");
  const stickerImagesEmpty = $("#stickerImagesEmpty");

  const editor = {
    baseImage: null,
    frame: "none",
    stickers: [],
    selected: -1,
  };

  function editorHasDecorations() {
    return editor.frame !== "none" || editor.stickers.length > 0;
  }

  function getEditorCtx() {
    return editorCanvas.getContext("2d");
  }

  function fitEditorToStage() {
    const base = editor.baseImage;
    if (!base) return;
    const stageBox = editorStage.getBoundingClientRect();
    const fit = Math.min(1, (stageBox.width - 24) / base.w, (stageBox.height - 24) / base.h);
    const dw = Math.round(base.w * fit);
    const dh = Math.round(base.h * fit);
    editorCanvas.style.width = `${dw}px`;
    editorCanvas.style.height = `${dh}px`;
    stickerLayer.style.width = `${dw}px`;
    stickerLayer.style.height = `${dh}px`;
    frameLayer.style.width = `${dw}px`;
    frameLayer.style.height = `${dh}px`;
  }

  function initEditor(img) {
    const maxDim = 1600;
    const natW = img.naturalWidth || img.width;
    const natH = img.naturalHeight || img.height;
    const scale = Math.min(1, maxDim / Math.max(natW, natH));
    const w = Math.round(natW * scale);
    const h = Math.round(natH * scale);
    editor.baseImage = { img, w, h };
    editor.frame = "none";
    editor.stickers = [];
    editor.selected = -1;

    editorCanvas.width = w;
    editorCanvas.height = h;
    fitEditorToStage();
    getEditorCtx().drawImage(img, 0, 0, w, h);
    editorHint.style.display = "none";
    editorPanel.hidden = false;
    stickerSizeEl.value = 15;
    removeStickerBtn.disabled = true;
    clearDecorBtn.disabled = true;
    updateFrameOptions();
    renderFrameOverlay();
    renderStickerOverlays();
  }

  function renderStickerOverlays() {
    stickerLayer.innerHTML = "";
    const layerWidth = stickerLayer.clientWidth || 1;
    editor.stickers.forEach((s, i) => {
      const el = document.createElement("span");
      el.className = "sticker-el" + (i === editor.selected ? " selected" : "");
      el.dataset.index = i;
      el.addEventListener("pointerdown", onStickerPointerDown);
      el.addEventListener("dblclick", onStickerDblClick);
      if (s.type === "image") {
        const img = document.createElement("img");
        img.src = s.src;
        img.alt = "sticker";
        el.appendChild(img);
        const box = Math.max(10, s.size * layerWidth);
        const si = getStickerImage(s.src);
        const ar =
          si.naturalWidth && si.naturalHeight ? si.naturalWidth / si.naturalHeight : 1;
        let w = box;
        let h = box;
        if (ar > 1) h = Math.round(box / ar);
        else w = Math.round(box * ar);
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
      } else {
        el.textContent = s.content;
        if (s.type === "text") {
          el.style.fontFamily = s.font;
          el.style.color = s.color;
        }
        el.style.fontSize = `${Math.max(8, Math.round(s.size * layerWidth))}px`;
      }
      el.style.left = `${(s.x * 100).toFixed(3)}%`;
      el.style.top = `${(s.y * 100).toFixed(3)}%`;
      stickerLayer.appendChild(el);
    });
  }

  let dragState = null;
  function onStickerPointerDown(e) {
    e.preventDefault();
    const index = parseInt(e.currentTarget.dataset.index, 10);
    selectSticker(index);
    if (dragState) return;
    const s = editor.stickers[index];
    if (!s) return;
    dragState = {
      index,
      startX: e.clientX,
      startY: e.clientY,
      sX: s.x,
      sY: s.y,
    };
    try {
      stickerLayer.setPointerCapture(e.pointerId);
    } catch (_) {}
    e.currentTarget.classList.add("dragging");
  }
  function onStickerPointerMove(e) {
    if (!dragState) return;
    const rect = stickerLayer.getBoundingClientRect();
    const s = editor.stickers[dragState.index];
    if (!s) return;
    s.x = clamp(dragState.sX + (e.clientX - dragState.startX) / rect.width, 0, 1);
    s.y = clamp(dragState.sY + (e.clientY - dragState.startY) / rect.height, 0, 1);
    const el = stickerLayer.children[dragState.index];
    if (el) {
      el.style.left = `${(s.x * 100).toFixed(3)}%`;
      el.style.top = `${(s.y * 100).toFixed(3)}%`;
    }
  }
  function onStickerPointerUp(e) {
    if (!dragState) return;
    try {
      stickerLayer.releasePointerCapture(e.pointerId);
    } catch (_) {}
    const el = stickerLayer.children[dragState.index];
    if (el) el.classList.remove("dragging");
    dragState = null;
  }
  stickerLayer.addEventListener("pointermove", onStickerPointerMove);
  stickerLayer.addEventListener("pointerup", onStickerPointerUp);
  stickerLayer.addEventListener("pointercancel", onStickerPointerUp);

  function onStickerDblClick(e) {
    removeSticker(parseInt(e.currentTarget.dataset.index, 10));
  }

  function selectSticker(index) {
    editor.selected = index;
    $$(".sticker-el", stickerLayer).forEach((el) => {
      el.classList.toggle("selected", parseInt(el.dataset.index, 10) === index);
    });
    const s = editor.stickers[index];
    if (s) {
      stickerSizeEl.value = Math.round(s.size * 100);
      removeStickerBtn.disabled = false;
    }
  }

  function removeSticker(index) {
    if (index < 0) return;
    editor.stickers.splice(index, 1);
    if (editor.selected >= editor.stickers.length) editor.selected = editor.stickers.length - 1;
    renderStickerOverlays();
    selectSticker(editor.selected);
    updateEditorFooter();
  }

  function addSticker(s) {
    editor.stickers.push(s);
    editor.selected = editor.stickers.length - 1;
    renderStickerOverlays();
    selectSticker(editor.selected);
    updateEditorFooter();
  }

  function updateEditorFooter() {
    removeStickerBtn.disabled = editor.selected < 0;
    clearDecorBtn.disabled = !editorHasDecorations();
  }

  stickerGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sticker]");
    if (!btn) return;
    addSticker({ type: "emoji", content: btn.dataset.sticker, x: 0.5, y: 0.5, size: 0.16 });
  });

  function renderStickerSections() {
    stickerSections.innerHTML = "";
    stickerGroups.forEach((g) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sticker-section-btn" + (g.id === activeStickerGroup ? " active" : "");
      btn.dataset.stickerGroup = g.id;
      btn.textContent = g.label;
      stickerSections.appendChild(btn);
    });
  }

  function renderStickerGrid() {
    const group = stickerGroups.find((g) => g.id === activeStickerGroup);
    stickerImagesGrid.innerHTML = "";
    const hasStickers = !!group && group.files.length > 0;
    stickerImagesEmpty.classList.toggle("show", !hasStickers);
    if (!hasStickers) return;
    group.files.forEach((file) => {
      const src = stickerSrc(group, file);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sticker-img-btn";
      btn.dataset.stickerSrc = src;
      const img = document.createElement("img");
      img.src = src;
      img.alt = "sticker";
      btn.appendChild(img);
      stickerImagesGrid.appendChild(btn);
    });
  }

  initStickerGroups();

  stickerSections.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sticker-group]");
    if (!btn) return;
    activeStickerGroup = btn.dataset.stickerGroup;
    renderStickerSections();
    renderStickerGrid();
  });

  stickerImagesGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sticker-src]");
    if (!btn) return;
    addSticker({ type: "image", src: btn.dataset.stickerSrc, x: 0.5, y: 0.5, size: 0.25 });
  });

  stickerSizeEl.addEventListener("input", () => {
    const s = editor.stickers[editor.selected];
    if (!s) return;
    s.size = parseInt(stickerSizeEl.value, 10) / 100;
    renderStickerOverlays();
  });

  removeStickerBtn.addEventListener("click", () => {
    removeSticker(editor.selected);
  });

  addTextBtn.addEventListener("click", () => {
    const value = textInput.value.trim();
    if (!value) {
      showToast("Type some text first");
      return;
    }
    addSticker({ type: "text", content: value, font: textFont.value, color: textColor.value, x: 0.5, y: 0.5, size: 0.07 });
    textInput.value = "";
  });

  clearDecorBtn.addEventListener("click", () => {
    editor.stickers = [];
    editor.selected = -1;
    renderStickerOverlays();
    updateEditorFooter();
    showToast("Decorations cleared");
  });

  editorTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      editorTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      editorSubpanels.forEach((p) => p.classList.toggle("show", p.dataset.subpanel === tab.dataset.panel));
    });
  });

  frameOptions.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-frame]");
    if (!btn) return;
    editor.frame = btn.dataset.frame;
    updateFrameOptions();
    renderFrameOverlay();
    updateEditorFooter();
  });

  function updateFrameOptions() {
    $$(".frame-opt", frameOptions).forEach((b) => {
      b.classList.toggle("active", b.dataset.frame === editor.frame);
    });
  }

  function renderFrameOverlay() {
    frameLayer.className = "frame-layer";
    frameLayer.innerHTML = "";
    if (editor.frame === "none") return;
    frameLayer.classList.add(`frame-${editor.frame}`);
    if (editor.frame === "hearts") {
      const heart =
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.9-10-9.5C.5 8.5 2 4.5 6 3.5c2.4-.6 4.5.3 6 2 1.5-1.7 3.6-2.6 6-2 4 1 5.5 5 4 8C19.5 16.1 12 21 12 21z"/></svg>';
      frameLayer.innerHTML =
        `<span class="f-h f-h-tl">${heart}</span>` +
        `<span class="f-h f-h-tr">${heart}</span>` +
        `<span class="f-h f-h-bl">${heart}</span>` +
        `<span class="f-h f-h-br">${heart}</span>`;
    }
  }

  async function compositeEditedImage() {
    const base = editor.baseImage;
    if (!base) throw new Error("No image to render");
    const canvas = document.createElement("canvas");
    canvas.width = base.w;
    canvas.height = base.h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, base.w, base.h);
    ctx.drawImage(base.img, 0, 0, base.w, base.h);

    for (const s of editor.stickers) {
      if (s.type === "image") {
        const img = getStickerImage(s.src);
        try {
          await img.decode();
        } catch (_) {}
        const box = Math.max(10, s.size * base.w);
        const ar =
          img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
        let dw = box;
        let dh = box;
        if (ar > 1) dh = box / ar;
        else dw = box * ar;
        ctx.drawImage(img, s.x * base.w - dw / 2, s.y * base.h - dh / 2, dw, dh);
        continue;
      }
      const px = Math.max(6, s.size * base.w);
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (s.type === "text") {
        ctx.font = `${px}px ${s.font}`;
        ctx.fillStyle = s.color;
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = Math.max(2, px * 0.12);
        ctx.shadowOffsetY = Math.max(1, px * 0.05);
      } else {
        ctx.font = `${px}px ${EMOJI_FONT}`;
      }
      ctx.fillText(s.content, s.x * base.w, s.y * base.h);
      ctx.restore();
    }

    drawFrame(ctx, base.w, base.h, editor.frame);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) throw new Error("Could not render your edits");
    return new File([blob], "memory.jpg", { type: "image/jpeg" });
  }

  function drawFrame(ctx, w, h, frame) {
    if (!frame || frame === "none") return;
    const pad = Math.max(14, Math.round(w * 0.025));
    if (frame === "hearts") {
      const hs = Math.max(24, Math.round(w * 0.09));
      const off = pad * 1.1;
      ctx.save();
      drawHeart(ctx, off, off, hs);
      drawHeart(ctx, w - off, off, hs);
      drawHeart(ctx, off, h - off, hs);
      drawHeart(ctx, w - off, h - off, hs);
      ctx.restore();
    } else if (frame === "border") {
      ctx.save();
      ctx.strokeStyle = "#e0527a";
      ctx.lineWidth = Math.max(3, Math.round(w * 0.008));
      ctx.strokeRect(pad / 2, pad / 2, w - pad, h - pad);
      ctx.restore();
    } else if (frame === "gradient") {
      ctx.save();
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#ffd1de");
      grad.addColorStop(0.5, "#e0527a");
      grad.addColorStop(1, "#b98a5e");
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(8, Math.round(w * 0.03));
      ctx.strokeRect(pad / 2, pad / 2, w - pad, h - pad);
      ctx.restore();
    } else if (frame === "dots") {
      ctx.save();
      ctx.fillStyle = "#e0527a";
      const d = Math.max(6, Math.round(w * 0.02));
      const gap = Math.max(20, Math.round(w * 0.045));
      for (let x = pad; x <= w - pad; x += gap) {
        ctx.beginPath();
        ctx.arc(x, pad, d / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, h - pad, d / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let y = pad + gap; y <= h - pad; y += gap) {
        ctx.beginPath();
        ctx.arc(pad, y, d / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w - pad, y, d / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawHeart(ctx, x, y, size) {
    const s = size / 24;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = "#e0527a";
    ctx.beginPath();
    ctx.moveTo(12, 21);
    ctx.bezierCurveTo(12, 21, 4.5, 16.1, 2, 11.5);
    ctx.bezierCurveTo(0.5, 8.5, 2, 4.5, 6, 3.5);
    ctx.bezierCurveTo(8.4, 2.9, 10.5, 3.8, 12, 5.5);
    ctx.bezierCurveTo(13.5, 3.8, 15.6, 2.9, 18, 3.5);
    ctx.bezierCurveTo(22, 4.5, 23.5, 8.5, 22, 11.5);
    ctx.bezierCurveTo(19.5, 16.1, 12, 21, 12, 21);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  window.addEventListener("resize", () => {
    if (editor.baseImage && $("#photoModal").classList.contains("open")) {
      fitEditorToStage();
      renderFrameOverlay();
      renderStickerOverlays();
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
  initGalleryCards();
  renderGallery();
  loadSavedPhotos();
  subscribeToPhotos();
})();
