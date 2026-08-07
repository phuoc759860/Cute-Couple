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

  /* ---------- In-app confirm dialog ---------- */
  const confirmDialog = $("#confirmDialog");
  const confirmTitle = $("#confirmTitle");
  const confirmText = $("#confirmText");
  const confirmOk = $("#confirmOk");
  const confirmCancel = $("#confirmCancel");
  let confirmCallback = null;

  function openConfirmDialog(opts) {
    const { title = "Delete", message = "Are you sure?", confirmLabel = "Delete", onConfirm } = opts || {};
    confirmTitle.textContent = title;
    confirmText.textContent = message;
    confirmOk.textContent = confirmLabel;
    confirmCallback = onConfirm || null;
    confirmDialog.classList.add("open");
    confirmDialog.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    confirmOk.focus();
  }

  function closeConfirmDialog() {
    confirmDialog.classList.remove("open");
    confirmDialog.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    confirmCallback = null;
  }

  if (confirmDialog) {
    confirmOk.addEventListener("click", () => {
      const cb = confirmCallback;
      closeConfirmDialog();
      if (cb) cb();
    });
    confirmCancel.addEventListener("click", closeConfirmDialog);
    confirmDialog.addEventListener("click", (e) => {
      if (e.target === confirmDialog) closeConfirmDialog();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && confirmDialog.classList.contains("open")) closeConfirmDialog();
    });
  }

  /* ---------- Login / site lock ---------- */
  const SESSION_KEY = "love-session";
  let currentUser = (() => {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      return s && (s.role === "boyfriend" || s.role === "girlfriend") ? s : null;
    } catch (_) {
      return null;
    }
  })();

  const loginOverlay = $("#loginOverlay");
  const loginStepPick = $("#loginStepPick");
  const loginStepCode = $("#loginStepCode");
  const loginKeypad = $("#loginKeypad");
  const loginAsk = $("#loginAsk");
  const loginBack = $("#loginBack");
  const loginCard = $(".login-card");
  const codeDots = $("#codeDots");
  const codeError = $("#codeError");
  const logoutBtn = $("#logoutBtn");

  let loginMode = null;
  let pinEntry = "";

  function partnerOf(role) {
    return role === "boyfriend" ? "girlfriend" : "boyfriend";
  }

  function buildDots() {
    codeDots.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const d = document.createElement("span");
      d.className = "code-dot";
      codeDots.appendChild(d);
    }
  }

  function paintDots() {
    $$(".code-dot", codeDots).forEach((d, i) => {
      d.classList.toggle("filled", i < pinEntry.length);
    });
  }

  function showCodeError(msg) {
    codeError.textContent = msg || "";
  }

  function lockSite() {
    document.body.classList.add("site-locked");
    loginOverlay.classList.remove("hidden");
    loginOverlay.setAttribute("aria-hidden", "false");
  }

  function unlockSite() {
    document.body.classList.remove("site-locked");
    loginOverlay.classList.add("hidden");
    loginOverlay.setAttribute("aria-hidden", "true");
  }

  function isLoggedIn() {
    return !!currentUser;
  }

  function saveSession(user) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (_) {}
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (_) {}
  }

  function startLogin(persona) {
    loginMode = persona;
    pinEntry = "";
    buildDots();
    paintDots();
    showCodeError("");
    loginStepPick.hidden = true;
    loginStepCode.hidden = false;
    loginKeypad.hidden = false;
    loginAsk.textContent = `Enter your 6-digit code, ${COUPLE[persona].name}`;
  }

  function resetLogin() {
    loginMode = null;
    pinEntry = "";
    loginStepPick.hidden = false;
    loginStepCode.hidden = true;
    loginKeypad.hidden = true;
    showCodeError("");
  }

  loginBack.addEventListener("click", resetLogin);

  $$(".persona").forEach((p) => {
    p.addEventListener("click", () => startLogin(p.dataset.persona));
  });

  loginKeypad.addEventListener("click", (e) => {
    const digit = e.target.closest("[data-digit]");
    const action = e.target.closest("[data-action]");
    if (!loginMode) return;
    if (digit) {
      if (pinEntry.length >= 6) return;
      pinEntry += digit.dataset.digit;
      paintDots();
      if (pinEntry.length === 6) setTimeout(verifyLogin, 130);
    } else if (action) {
      if (action.dataset.action === "back") {
        pinEntry = pinEntry.slice(0, -1);
        paintDots();
      } else if (action.dataset.action === "clear") {
        pinEntry = "";
        paintDots();
      }
    }
  });

  function verifyLogin() {
    if (pinEntry === LOGIN_CODES[loginMode]) {
      currentUser = { role: loginMode };
      saveSession(currentUser);
      completeLogin();
    } else {
      showCodeError("Wrong code — try again, love");
      pinEntry = "";
      paintDots();
      loginCard.classList.remove("shake");
      void loginCard.offsetWidth;
      loginCard.classList.add("shake");
    }
  }

  function completeLogin() {
    unlockSite();
    resetLogin();
    updateAuthUI();
    showToast(`Welcome back, ${COUPLE[currentUser.role].name} ♥`);
    initCoupleFeatures();
    setTimeout(openFromHash, 800);
  }

  function logoutNow() {
    currentUser = null;
    clearSession();
    hideCoupleUI();
    teardownCoupleChannels();
    updateAuthUI();
    lockSite();
    showToast("Locked — see you soon ♥");
  }

  logoutBtn.addEventListener("click", logoutNow);

  if (currentUser) unlockSite();
  else lockSite();
  updateAuthUI();

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
    $$(".bottom-navbar .bnav-item").forEach((b) => {
      b.classList.toggle("active", b.dataset.target === current);
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

  /* ---------- Days together counter ---------- */
  const TOGETHER_DATE = new Date("2026-02-10T00:00:00").getTime();
  const daysTogetherEl = $("#daysTogether");
  let daysCounted = false;
  function updateDaysTogether() {
    if (!daysTogetherEl) return;
    const days = Math.max(0, Math.floor((Date.now() - TOGETHER_DATE) / 86400000));
    if (daysCounted) {
      daysTogetherEl.textContent = days;
      return;
    }
    daysCounted = true;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / 1600);
      const eased = 1 - Math.pow(1 - p, 3);
      daysTogetherEl.textContent = Math.round(days * eased);
      if (p < 1) requestAnimationFrame(step);
      else daysTogetherEl.textContent = days;
    };
    requestAnimationFrame(step);
  }
  updateDaysTogether();

  /* ---------- Cursor heart trail ---------- */
  const TRAIL_HEART_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.9-10-9.5C.5 8.5 2 4.5 6 3.5c2.4-.6 4.5.3 6 2 1.5-1.7 3.6-2.6 6-2 4 1 5.5 5 4 8C19.5 16.1 12 21 12 21z"/></svg>';
  function initCursorHearts() {
    if (!window.matchMedia("(hover: hover)").matches || "ontouchstart" in window) return;
    let last = 0;
    document.addEventListener("pointermove", (e) => {
      const now = performance.now();
      if (now - last < 70) return;
      last = now;
      const span = document.createElement("span");
      span.className = "trail-heart";
      span.style.left = `${e.clientX + (Math.random() * 14 - 7)}px`;
      span.style.top = `${e.clientY + (Math.random() * 14 - 7)}px`;
      span.innerHTML = TRAIL_HEART_SVG;
      document.body.appendChild(span);
      setTimeout(() => span.remove(), 1100);
    });
  }
  initCursorHearts();

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

  /* ---------- Surprise me ---------- */
  const surpriseBtn = $("#surpriseBtn");
  surpriseBtn.addEventListener("click", () => {
    const visible = visibleCards();
    if (!visible.length) {
      showToast("No memories to surprise you with yet");
      return;
    }
    const idx = Math.floor(Math.random() * visible.length);
    openLightbox(idx);
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
  const lightboxImgWrap = $("#lightboxImgWrap");
  const lightboxTitle = $("#lightboxTitle");
  const lightboxDesc = $("#lightboxDesc");
  const lightboxDate = $("#lightboxDate");
  const lightboxCategory = $("#lightboxCategory");
  const lightboxCategoryText = $("#lightboxCategoryText");
  const lightboxCounter = $("#lightboxCounter");
  const lightboxDownload = $("#lightboxDownload");
  const lightboxShare = $("#lightboxShare");
  const lightboxLike = $("#lightboxLike");
  const lightboxLikes = $("#lightboxLikes");
  const lightboxEditDate = $("#lightboxEditDate");
  const lightboxClose = $("#lightboxClose");
  const lightboxPrev = $("#lightboxPrev");
  const lightboxNext = $("#lightboxNext");
  const lightboxSlideshow = $("#lightboxSlideshow");
  const lightboxProgress = $("#lightboxProgress");
  const modePhotoBtn = $("#modePhotoBtn");
  const modeStoryBtn = $("#modeStoryBtn");
  const lightboxMusic = $("#lightboxMusic");
  const lightboxMusicLabel = $("#lightboxMusicLabel");
  const lightboxBurst = $("#lightboxBurst");
  const lightboxFullscreen = $("#lightboxFullscreen");
  const lightboxFilmstrip = $("#lightboxFilmstrip");
  let lightboxIndex = 0;
  let lightboxCard = null;
  let lightboxPlaying = false;
  const STORY_DURATION = 6000;
  const KENBURNS = ["kb-zoom", "kb-pan-left", "kb-pan-right", "kb-zoom-out"];
  const LIGHTBOX_MODE_KEY = "lc-lb-mode";
  let lightboxMode = "story";
  try {
    lightboxMode = localStorage.getItem(LIGHTBOX_MODE_KEY) === "photo" ? "photo" : "story";
  } catch (_) {}

  const CATEGORY_LABELS = {
    all: "All",
    dates: "Dates",
    travel: "Travel",
    celebrations: "Celebrations",
    everyday: "Everyday",
  };

  /* ---------- Likes (localStorage per photo) ---------- */
  const LIKES_KEY = "lc-photo-likes";
  function loadLikes() {
    try {
      return JSON.parse(localStorage.getItem(LIKES_KEY)) || {};
    } catch (_) {
      return {};
    }
  }
  function saveLikes(map) {
    try {
      localStorage.setItem(LIKES_KEY, JSON.stringify(map));
    } catch (_) {}
  }

  /* ---------- Story progress bars ---------- */
  lightboxProgress.style.setProperty("--story-duration", STORY_DURATION + "ms");

  function renderProgressBars(count) {
    lightboxProgress.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const seg = document.createElement("button");
      seg.type = "button";
      seg.className = "lbp-seg";
      seg.setAttribute("aria-label", "Go to photo " + (i + 1));
      seg.innerHTML = '<span class="lbp-fill"></span>';
      seg.addEventListener("click", (e) => {
        e.stopPropagation();
        goToPhoto(i);
      });
      lightboxProgress.appendChild(seg);
    }
  }

  function setActiveProgress(index) {
    Array.from(lightboxProgress.children).forEach((seg, i) => {
      seg.classList.toggle("done", i < index);
      seg.classList.toggle("active", i === index);
    });
  }

  function pauseStory() {
    lightboxPlaying = false;
    lightbox.classList.add("paused");
    lightboxSlideshow.innerHTML = "&#9654;";
    lightboxSlideshow.setAttribute("aria-label", "Play");
    lightboxSlideshow.title = "Play";
  }

  function playStory() {
    if (!lightbox.classList.contains("open")) return;
    lightboxPlaying = true;
    lightbox.classList.remove("paused");
    lightboxSlideshow.innerHTML = "&#10074;&#10074;";
    lightboxSlideshow.setAttribute("aria-label", "Pause");
    lightboxSlideshow.title = "Pause";
  }

  function toggleStory() {
    if (lightboxMode !== "story") {
      applyMode("story");
      return;
    }
    if (lightboxPlaying) pauseStory();
    else playStory();
  }

  function applyMode(mode) {
    lightboxMode = mode;
    try {
      localStorage.setItem(LIGHTBOX_MODE_KEY, mode);
    } catch (_) {}
    const isStory = mode === "story";
    modePhotoBtn.setAttribute("aria-pressed", String(!isStory));
    modeStoryBtn.setAttribute("aria-pressed", String(isStory));
    lightbox.classList.toggle("story-mode", isStory);
    if (isStory) {
      lightboxPlaying = true;
      lightbox.classList.remove("paused");
      lightboxSlideshow.innerHTML = "&#10074;&#10074;";
      lightboxSlideshow.setAttribute("aria-label", "Pause");
      lightboxSlideshow.title = "Pause";
      applyKenBurns();
    } else {
      lightboxPlaying = false;
      lightbox.classList.add("paused");
      lightboxSlideshow.innerHTML = "&#9654;";
      lightboxSlideshow.setAttribute("aria-label", "Play");
      lightboxSlideshow.title = "Play";
      KENBURNS.forEach((c) => lightboxImg.classList.remove(c));
    }
  }

  lightboxProgress.addEventListener("animationend", (e) => {
    if (
      e.target.classList.contains("lbp-fill") &&
      e.target.closest(".lbp-seg") &&
      e.target.closest(".lbp-seg").classList.contains("active")
    ) {
      goToPhoto(lightboxIndex + 1);
    }
  });

  /* ---------- Ken Burns + caption animation ---------- */
  function applyKenBurns() {
    KENBURNS.forEach((c) => lightboxImg.classList.remove(c));
    if (lightboxMode !== "story") return;
    const kb = KENBURNS[Math.floor(Math.random() * KENBURNS.length)];
    void lightboxImg.offsetWidth;
    lightboxImg.classList.add(kb);
  }

  function restartCaptionAnim() {
    const caption = $("#lightboxCaption");
    caption.classList.remove("anim");
    void caption.offsetWidth;
    caption.classList.add("anim");
  }

  function swapImage(src, alt) {
    lightboxImg.classList.add("swapping");
    setTimeout(() => {
      lightboxImg.src = src;
      lightboxImg.alt = alt || "";
      applyKenBurns();
      lightboxImg.classList.remove("swapping");
    }, 240);
  }

  /* ---------- Navigation ---------- */
  function goToPhoto(index) {
    const visible = visibleCards();
    if (!visible.length) return;
    const clamped = ((index % visible.length) + visible.length) % visible.length;
    const card = visible[clamped];
    const img = $("img", card);
    const title = $(".card-title", card).textContent;
    const desc = $(".card-desc", card).textContent;
    const date = $(".card-date", card).textContent;
    const category = card.dataset.category || "everyday";
    swapImage(img.src, img.alt);
    lightboxTitle.textContent = title || "Our Memory";
    lightboxDesc.textContent = desc;
    lightboxDate.textContent = date;
    lightboxCategoryText.textContent = CATEGORY_LABELS[category] || category;
    lightboxCounter.textContent = `${clamped + 1} / ${visible.length}`;
    lightboxIndex = clamped;
    lightboxCard = card;
    lightboxEditDate.hidden = !card._record;
    setActiveProgress(clamped);
    if (lightboxFilmstrip && !lightboxFilmstrip.hidden) {
      Array.from(lightboxFilmstrip.children).forEach((th, i) => {
        th.classList.toggle("active", i === clamped);
      });
      lightboxFilmstrip.querySelector(".active")?.scrollIntoView({
        behavior: "smooth", block: "nearest", inline: "nearest",
      });
    }
    updateLikeState();
    updateMusicPill();
    restartCaptionAnim();
  }

  function openLightbox(index) {
    const visible = visibleCards();
    if (!visible.length) return;
    renderProgressBars(visible.length);
    renderFilmstrip();
    goToPhoto(index);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    applyMode(lightboxMode);
  }

  function closeLightbox() {
    pauseStory();
    exitLightboxFullscreen();
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function toggleLightboxFullscreen() {
    if (!document.fullscreenEnabled) {
      showToast("Fullscreen isn't available on this browser");
      return;
    }
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        lightbox.requestFullscreen();
      }
    } catch (_) {}
  }

  function exitLightboxFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function renderFilmstrip() {
    const visible = visibleCards();
    if (!lightboxFilmstrip) return;
    if (visible.length <= 8) {
      lightboxFilmstrip.hidden = true;
      return;
    }
    lightboxFilmstrip.hidden = false;
    lightboxFilmstrip.innerHTML = "";
    visible.forEach((card, i) => {
      const img = $("img", card);
      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "filmstrip-item" + (i === lightboxIndex ? " active" : "");
      thumb.setAttribute("aria-label", "Go to photo " + (i + 1));
      const im = document.createElement("img");
      im.src = img.src;
      im.alt = "";
      im.loading = "lazy";
      thumb.appendChild(im);
      thumb.addEventListener("click", (e) => {
        e.stopPropagation();
        goToPhoto(i);
      });
      lightboxFilmstrip.appendChild(thumb);
    });
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
  lightboxPrev.addEventListener("click", () => goToPhoto(lightboxIndex - 1));
  lightboxNext.addEventListener("click", () => goToPhoto(lightboxIndex + 1));
  lightboxSlideshow.addEventListener("click", toggleStory);
  modePhotoBtn.addEventListener("click", () => applyMode("photo"));
  modeStoryBtn.addEventListener("click", () => applyMode("story"));
  lightboxDownload.addEventListener("click", downloadCurrentPhoto);
  lightboxShare.addEventListener("click", shareCurrentPhoto);
  lightboxFullscreen.addEventListener("click", toggleLightboxFullscreen);
  document.addEventListener("fullscreenchange", () => {
    lightboxFullscreen.classList.toggle("active", !!document.fullscreenElement);
  });
  lightboxLike.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleLike();
  });
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") goToPhoto(lightboxIndex - 1);
    if (e.key === "ArrowRight") goToPhoto(lightboxIndex + 1);
    if (e.key.toLowerCase() === "s") toggleStory();
    if (e.key === " ") {
      e.preventDefault();
      toggleStory();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !notifPanel.hidden) closeNotifPanel();
  });

  /* ---------- Likes ---------- */
  function currentPhotoId() {
    const card = visibleCards()[lightboxIndex];
    return card && card._record ? card._record.id : null;
  }

  function updateLikeState() {
    const id = currentPhotoId();
    const likes = loadLikes();
    const entry = id ? likes[id] : null;
    const n = entry ? entry.count : 0;
    lightboxLikes.textContent = n > 999 ? (n / 1000).toFixed(1) + "k" : String(n);
    lightboxLike.classList.toggle("liked", !!(entry && entry.liked));
  }

  function toggleLike() {
    const id = currentPhotoId();
    if (!id) return;
    const likes = loadLikes();
    const entry = likes[id] || { count: 0, liked: false };
    entry.liked = !entry.liked;
    entry.count += entry.liked ? 1 : -1;
    if (entry.count < 0) entry.count = 0;
    likes[id] = entry;
    saveLikes(likes);
    updateLikeState();
    if (entry.liked) likeBurst();
  }

  function likeBurst() {
    const HEART =
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.9-10-9.5C.5 8.5 2 4.5 6 3.5c2.4-.6 4.5.3 6 2 1.5-1.7 3.6-2.6 6-2 4 1 5.5 5 4 8C19.5 16.1 12 21 12 21z"/></svg>';
    for (let i = 0; i < 12; i++) {
      const h = document.createElement("span");
      h.className = "burst-heart";
      h.innerHTML = HEART;
      h.style.left = 50 + (Math.random() * 56 - 28) + "%";
      h.style.fontSize = 18 + Math.random() * 24 + "px";
      h.style.animationDelay = Math.random() * 0.3 + "s";
      lightboxBurst.appendChild(h);
      setTimeout(() => h.remove(), 1700);
    }
  }

  /* ---------- Share + deep link ---------- */
  async function shareCurrentPhoto() {
    const id = currentPhotoId();
    const card = visibleCards()[lightboxIndex];
    const url = id
      ? location.origin + location.pathname + "#photo=" + id
      : location.href;
    const title = card && card._record ? card._record.title : "Our Love Album";
    // Native share sheet on mobile first.
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: title || "A memory from our album",
          url,
        });
        return;
      } catch (_) {
        /* user cancelled or share failed → fall back to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    } catch (_) {
      window.prompt("Copy the link", url);
    }
  }

  function openFromHash() {
    const m = /#photo=([0-9a-f-]+)/i.exec(location.hash);
    if (!m) return;
    const idx = visibleCards().findIndex((c) => c._record && c._record.id === m[1]);
    if (idx !== -1) {
      openLightbox(idx);
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  /* ---------- Touch: swipe + double-tap ---------- */
  let touchStartX = 0;
  let lastTap = 0;
  lightboxImgWrap.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    pauseStory();
  }, { passive: true });
  lightboxImgWrap.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx < 0) goToPhoto(lightboxIndex + 1);
      else goToPhoto(lightboxIndex - 1);
    } else {
      const now = Date.now();
      if (now - lastTap < 300) {
        toggleLike();
        lastTap = 0;
      } else {
        lastTap = now;
      }
    }
    playStory();
  }, { passive: true });
  lightboxImgWrap.addEventListener("mousedown", pauseStory);
  lightboxImgWrap.addEventListener("mouseup", () => setTimeout(playStory, 260));
  lightboxImgWrap.addEventListener("dblclick", (e) => {
    e.preventDefault();
    toggleLike();
  });

  /* ---------- Music pill ---------- */
  function updateMusicPill() {
    if (!musicOn || !musicTracks.length) {
      lightboxMusic.hidden = true;
      return;
    }
    lightboxMusicLabel.textContent = trackLabel(musicTracks[musicTrackIndex]);
    lightboxMusic.hidden = false;
    lightboxMusic.classList.toggle("playing", musicOn);
  }
  lightboxMusic.addEventListener("click", () => {
    if (musicOn) pauseMusic();
    else playMusic();
    setTimeout(updateMusicPill, 80);
  });

  async function downloadCurrentPhoto() {
    const src = lightboxImg.src;
    if (!src) return;
    try {
      const resp = await fetch(src);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const name =
        (lightboxTitle.textContent || "our-memory")
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
  const EDIT_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
  const CARD_ACTIONS =
    '<button class="card-edit" type="button" aria-label="Edit details" title="Edit">' + EDIT_ICON + "</button><button class=\"card-delete\" type=\"button\" aria-label=\"Delete\" title=\"Delete\">" + DELETE_ICON + "</button>";

  function formatPhotoDate(record) {
    const d = record.taken_at
      ? new Date(record.taken_at + "T00:00:00")
      : new Date(record.created_at);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }

  function makeSavedCard(record) {
    const fig = document.createElement("figure");
    fig.className = "card";
    fig.dataset.category = record.category || "everyday";
    fig.dataset.savedId = record.id;
    fig._record = record;
    const dateLabel = record.dateLabel ? record.dateLabel : formatPhotoDate(record);
    fig.innerHTML = `
      <img src="${record.url}" alt="${escapeHtml(record.title)}" loading="lazy" />
      <figcaption class="card-overlay">
        <p class="card-date">${escapeHtml(dateLabel)}</p>
        <h3 class="card-title">${escapeHtml(record.title || "Our Memory")}</h3>
        <p class="card-desc">${escapeHtml(record.description || "")}</p>
      </figcaption>
      <div class="card-actions">${CARD_ACTIONS}</div>
    `;
    const del = $(".card-delete", fig);
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      openConfirmDialog({
        title: "Delete photo",
        message: "Remove this photo from the album?",
        onConfirm: () => deletePhoto(record, fig),
      });
    });
    const edt = $(".card-edit", fig);
    edt.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditModal({ kind: "photo", record, cardEl: fig });
    });
    return fig;
  }

  /* ---------- Edit photo date ---------- */
  const dateModal = $("#dateModal");
  const dateModalClose = $("#dateModalClose");
  const dateCancel = $("#dateCancel");
  const dateSave = $("#dateSave");
  const dateEditInput = $("#dateEditInput");

  function openDateModal() {
    const rec = lightboxCard && lightboxCard._record;
    if (!rec) return;
    dateEditInput.value = rec.taken_at || "";
    dateModal.classList.add("open");
    dateModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeDateModal() {
    dateModal.classList.remove("open");
    dateModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = lightbox.classList.contains("open") ? "hidden" : "";
  }

  lightboxEditDate.addEventListener("click", openDateModal);
  dateModalClose.addEventListener("click", closeDateModal);
  dateCancel.addEventListener("click", closeDateModal);
  dateModal.addEventListener("click", (e) => {
    if (e.target === dateModal) closeDateModal();
  });
  document.addEventListener("keydown", (e) => {
    if (!dateModal.classList.contains("open")) return;
    if (e.key === "Escape") closeDateModal();
  });

  dateSave.addEventListener("click", async () => {
    const rec = lightboxCard && lightboxCard._record;
    if (!rec) return;
    const val = dateEditInput.value || null;
    dateSave.disabled = true;
    dateSave.textContent = "Saving...";
    try {
      const { error } = await supabase
        .from("photos")
        .update({ taken_at: val })
        .eq("id", rec.id);
      if (error) throw error;
      rec.taken_at = val;
      const label = formatPhotoDate(rec);
      const dateEl = $(".card-date", lightboxCard);
      if (dateEl) dateEl.textContent = label;
      lightboxDate.textContent = label;
      closeDateModal();
      showToast("Date updated");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not update the date");
    } finally {
      dateSave.disabled = false;
      dateSave.textContent = "Save Date";
    }
  });

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

  /* ---------- Edit media details (photo / video) ---------- */
  const editModal = $("#editModal");
  const editModalClose = $("#editModalClose");
  const editCancel = $("#editCancel");
  const editSave = $("#editSave");
  const editTitle = $("#editTitle");
  const editDesc = $("#editDesc");
  const editCategoryField = $("#editCategoryField");
  const editCategory = $("#editCategory");
  const editDateField = $("#editDateField");
  const editDate = $("#editDate");
  let editTarget = null;

  function openEditModal({ kind, record, cardEl }) {
    editTarget = { kind, record, cardEl };
    editTitle.value = record.title || "";
    editDesc.value = record.description || "";
    const isPhoto = kind === "photo";
    editCategoryField.hidden = !isPhoto;
    editDateField.hidden = !isPhoto;
    if (isPhoto) {
      editCategory.value = record.category || "everyday";
      editDate.value = record.taken_at || "";
    }
    $("#editModalTitle").textContent = isPhoto ? "Edit Photo" : "Edit Video";
    editModal.classList.add("open");
    editModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    editTitle.focus();
  }

  function closeEditModal() {
    editModal.classList.remove("open");
    editModal.setAttribute("aria-hidden", "true");
    editTarget = null;
    document.body.style.overflow = "";
  }

  editModalClose.addEventListener("click", closeEditModal);
  editCancel.addEventListener("click", closeEditModal);
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) closeEditModal();
  });
  document.addEventListener("keydown", (e) => {
    if (!editModal.classList.contains("open")) return;
    if (e.key === "Escape") closeEditModal();
  });

  editSave.addEventListener("click", async () => {
    if (!editTarget) return;
    const { kind, record, cardEl } = editTarget;
    const updates = { title: editTitle.value.trim() || (kind === "photo" ? "Our Memory" : "Our Moment"), description: editDesc.value.trim() };
    if (kind === "photo") {
      updates.category = editCategory.value;
      updates.taken_at = editDate.value || null;
    }
    editSave.disabled = true;
    editSave.textContent = "Saving...";
    try {
      const table = kind === "photo" ? "photos" : "videos";
      const { error } = await supabase.from(table).update(updates).eq("id", record.id);
      if (error) throw error;
      Object.assign(record, updates);
      const titleEl = $(".card-title", cardEl);
      const descEl = $(".card-desc", cardEl);
      if (titleEl) titleEl.textContent = record.title || (kind === "photo" ? "Our Memory" : "Our Moment");
      if (descEl) descEl.textContent = record.description || "";
      if (kind === "photo") {
        const dateEl = $(".card-date", cardEl);
        if (dateEl) dateEl.textContent = formatPhotoDate(record);
      }
      closeEditModal();
      showToast(kind === "photo" ? "Photo updated" : "Video updated");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not save the changes");
    } finally {
      editSave.disabled = false;
      editSave.textContent = "Save";
    }
  });

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
  const photoDate = $("#photoDate");
  const uploadProgress = $("#uploadProgress");
  const uploadProgressText = $("#uploadProgressText");
  let pendingDataUrl = null;
  let pendingFile = null;

  function openModal() {
    photoModal.classList.add("open");
    photoModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    initStickerGroups(true).catch(() => {});
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
    photoDate.value = "";
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

  function isHeicFile(file) {
    return /\.(heic|heif)$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif";
  }

  function beginPhotoEdit(file) {
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
  }

  photoInput.addEventListener("change", () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !isHeicFile(file)) {
      showToast("Please choose an image file");
      return;
    }
    if (isHeicFile(file)) {
      if (typeof window.heic2any !== "function") {
        showToast("HEIC converter isn't loaded");
        return;
      }
      showToast("Converting HEIC photo...");
      window.heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 })
        .then((result) => {
          const blob = Array.isArray(result) ? result[0] : result;
          const jpgName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
          beginPhotoEdit(new File([blob], jpgName, { type: "image/jpeg" }));
        })
        .catch((err) => {
          console.error(err);
          showToast("Could not convert this HEIC photo");
        });
      return;
    }
    beginPhotoEdit(file);
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
          taken_at: photoDate.value || null,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      const url = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(storagePath).data.publicUrl;
      addGalleryCard(makeSavedCard({ ...data, url }), true);
      closeModal();
      setTimeout(resetModal, 350);
      burstHearts();
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
  const stickerRotateEl = $("#stickerRotate");
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

  async function fetchStickerGroupsFromGitHub(force = false) {
    const cacheKey = "lc-stickers-v2";
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
        if (cached && Array.isArray(cached.groups) && cached.groups.length && Date.now() - cached.t < 120000) {
          return cached.groups;
        }
      } catch (_) {}
    }
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

  async function initStickerGroups(force = false) {
    const sources = isLocalHost()
      ? [() => fetchStickerGroupsFromManifest(), () => fetchStickerGroupsFromGitHub(force)]
      : [() => fetchStickerGroupsFromGitHub(force), () => fetchStickerGroupsFromManifest()];
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
    if (!stickerGroups.some((g) => g.id === activeStickerGroup)) {
      activeStickerGroup = stickerGroups[0] ? stickerGroups[0].id : null;
    }
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
      if (s.rot) el.style.transform = `translate(-50%, -50%) rotate(${s.rot}deg)`;
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
      stickerRotateEl.value = s.rot || 0;
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

  stickerRotateEl.addEventListener("input", () => {
    const s = editor.stickers[editor.selected];
    if (!s) return;
    s.rot = parseInt(stickerRotateEl.value, 10) || 0;
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
        ctx.save();
        ctx.translate(s.x * base.w, s.y * base.h);
        if (s.rot) ctx.rotate((s.rot * Math.PI) / 180);
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
        continue;
      }
      const px = Math.max(6, s.size * base.w);
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.translate(s.x * base.w, s.y * base.h);
      if (s.rot) ctx.rotate((s.rot * Math.PI) / 180);
      if (s.type === "text") {
        ctx.font = `${px}px ${s.font}`;
        ctx.fillStyle = s.color;
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = Math.max(2, px * 0.12);
        ctx.shadowOffsetY = Math.max(1, px * 0.05);
      } else {
        ctx.font = `${px}px ${EMOJI_FONT}`;
      }
      ctx.fillText(s.content, 0, 0);
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

  /* ---------- Heart confetti ---------- */
  const confettiCanvas = $("#confettiCanvas");
  function burstHearts(count = 26) {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext("2d");
    const W = (confettiCanvas.width = window.innerWidth);
    const H = (confettiCanvas.height = window.innerHeight);
    const parts = Array.from({ length: count }, () => ({
      x: W * 0.25 + Math.random() * W * 0.5,
      y: H * 0.3 + Math.random() * H * 0.25,
      vy: -(0.8 + Math.random() * 1.3),
      vx: (Math.random() - 0.5) * 1.5,
      s: 8 + Math.random() * 14,
      r: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.12,
      hue: Math.random(),
    }));
    function heartPath(x, y, s) {
      ctx.moveTo(x, y + s);
      ctx.bezierCurveTo(x - s, y + s * 0.4, x - s, y - s * 0.5, x, y - s * 0.1);
      ctx.bezierCurveTo(x + s, y - s * 0.5, x + s, y + s * 0.4, x, y + s);
      ctx.closePath();
    }
    let frame = 0;
    (function tick() {
      frame++;
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of parts) {
        p.x += p.vx + Math.sin((frame + p.r * 20) / 18) * 0.4;
        p.y += p.vy * 0.9;
        p.vy *= 0.985;
        p.vx *= 0.985;
        p.r += p.vr;
        if (p.y < -50) continue;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.hue < 0.5 ? "#e0527a" : p.hue < 0.8 ? "#ff9eb8" : "#ffd9a8";
        ctx.beginPath();
        heartPath(0, 0, p.s);
        ctx.fill();
        ctx.restore();
      }
      if (alive) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    })();
  }

  /* ---------- Toast ---------- */
  function showToast(msg, duration = 2600) {
    const toast = $("#toast");
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), duration);
  }

  /* ---------- Ambient music ---------- */
  const musicBtn = $("#musicBtn");
  const musicNow = $("#musicNow");
  const MUSIC_MANIFEST = "music-manifest.json";
  const FALLBACK_TRACKS = ["Musics/Post Malone - Circles.mp3"];
  const AUDIO_EXT_RE = /\.(mp3|m4a|ogg|oga|wav|flac)$/i;
  const musicAudio = new Audio();
  musicAudio.volume = 0.7;
  musicAudio.preload = "metadata";
  let musicOn = false;
  let musicTracks = [];
  let musicTrackIndex = 0;

  function trackLabel(src) {
    try {
      return decodeURIComponent(src.split("/").pop().replace(/\.[^.]+$/, ""));
    } catch (_) {
      return src;
    }
  }

  function setNowPlaying() {
    if (!musicTracks.length) return;
    musicNow.textContent = "♪ " + trackLabel(musicTracks[musicTrackIndex]);
    musicNow.hidden = false;
  }

  async function initMusicTracks() {
    try {
      const res = await fetch(MUSIC_MANIFEST, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tracks) && data.tracks.length) {
          musicTracks = data.tracks.filter((t) => AUDIO_EXT_RE.test(t));
        }
      }
    } catch (_) {}
    if (!musicTracks.length) musicTracks = FALLBACK_TRACKS.slice();
    if (!musicAudio.src) musicAudio.src = musicTracks[0];
  }

  function playMusic() {
    const attempt = () =>
      musicAudio.play().then(() => {
        musicOn = true;
        musicBtn.classList.add("playing");
        musicBtn.setAttribute("aria-label", "Pause music");
        const b = $("#bnavMusic");
        if (b) b.classList.add("playing");
        setNowPlaying();
        updateMusicPill();
      });
    if (!musicTracks.length) {
      initMusicTracks().then(attempt).catch((err) => {
        console.error(err);
        showToast("Could not find the music");
      });
    } else {
      attempt().catch((err) => {
        console.error(err);
        showToast("Could not play the music");
      });
    }
  }

  function pauseMusic() {
    musicOn = false;
    musicAudio.pause();
    musicBtn.classList.remove("playing");
    musicBtn.setAttribute("aria-label", "Play our song");
    musicNow.hidden = true;
    const b = $("#bnavMusic");
    if (b) b.classList.remove("playing");
    updateMusicPill();
  }

  musicAudio.addEventListener("ended", () => {
    if (!musicTracks.length) return;
    musicTrackIndex = (musicTrackIndex + 1) % musicTracks.length;
    musicAudio.src = musicTracks[musicTrackIndex];
    musicAudio.play().catch(() => {});
    setNowPlaying();
    updateMusicPill();
  });
  musicAudio.addEventListener("error", () => {
    if (musicOn) showToast("Could not load the music file");
  });

  musicBtn.addEventListener("click", () => {
    if (musicOn) pauseMusic();
    else playMusic();
  });
  musicBtn.addEventListener("dblclick", () => {
    if (!musicTracks.length || musicTracks.length < 2) return;
    musicTrackIndex = (musicTrackIndex + 1) % musicTracks.length;
    musicAudio.src = musicTracks[musicTrackIndex];
    if (musicOn) {
      musicAudio.play().catch(() => {});
      setNowPlaying();
      updateMusicPill();
    }
  });
  musicBtn.title = "Play our song";

  initMusicTracks();

  /* ---------- Love Notes guestbook ---------- */
  const notesGrid = $("#notesGrid");
  const notesEmpty = $("#notesEmpty");
  const notesOffline = $("#notesOffline");
  const noteName = $("#noteName");
  const noteText = $("#noteText");
  const noteSend = $("#noteSend");

  function noteTimeLabel(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  function addNoteCard(note) {
    const card = document.createElement("blockquote");
    card.className = "note-card";
    card.innerHTML = `
      <span class="note-quote">“</span>
      <p class="note-text">${escapeHtml(note.message)}</p>
      <footer class="note-meta">
        <cite>— ${escapeHtml(note.name || "Anonymous")}</cite>
        <time>${noteTimeLabel(note.created_at)}</time>
      </footer>`;
    notesGrid.prepend(card);
    notesEmpty.classList.toggle("show", !notesGrid.children.length);
  }

  async function initNotes() {
    try {
      const { data, error } = await supabase
        .from("love_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      (data || []).forEach(addNoteCard);
      supabase
        .channel("love-notes-live")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "love_messages" },
          (payload) => addNoteCard(payload.new)
        )
        .subscribe();
    } catch (err) {
      console.warn("Guestbook not available:", err.message || err);
      notesOffline.hidden = false;
      notesEmpty.classList.remove("show");
      noteName.disabled = true;
      noteText.disabled = true;
      noteSend.disabled = true;
    }
  }

  function postNote() {
    const msg = noteText.value.trim();
    const name = noteName.value.trim() || "Anonymous";
    if (!msg) {
      showToast("Write a sweet note first");
      return;
    }
    noteSend.disabled = true;
    supabase
      .from("love_messages")
      .insert({ name, message: msg })
      .then(({ error }) => {
        if (error) throw error;
        noteText.value = "";
        showToast("Your note was posted");
      })
      .catch((err) => {
        console.error(err);
        showToast(err.message || "Could not post your note");
      })
      .finally(() => {
        noteSend.disabled = false;
      });
  }
  noteSend.addEventListener("click", postNote);
  noteText.addEventListener("keydown", (e) => {
    if (e.key === "Enter") postNote();
  });

  /* ---------- Video gallery ---------- */
  const addVideoBtn = $("#addVideoBtn");
  const videoEmptyAddBtn = $("#videoEmptyAddBtn");
  const videoRefreshBtn = $("#videoRefreshBtn");
  const videoModalEl = $("#videoModal");
  const videoModalClose = $("#videoModalClose");
  const videoCancel = $("#videoCancel");
  const videoSave = $("#videoSave");
  const videoInput = $("#videoInput");
  const videoDrop = $("#videoDrop");
  const videoDropText = $("#videoDropText");
  const videoDropFile = $("#videoDropFile");
  const videoTitle = $("#videoTitle");
  const videoDesc = $("#videoDesc");
  const videoProgress = $("#videoProgress");
  const videoProgressText = $("#videoProgressText");
  const videosGrid = $("#videosGrid");
  const videosCount = $("#videosCount");
  const videosLoading = $("#videosLoading");
  const videosEmpty = $("#videosEmpty");
  const videosOffline = $("#videosOffline");
  const videoViewer = $("#videoViewer");
  const videoViewerPlayer = $("#videoViewerPlayer");
  const videoViewerTitle = $("#videoViewerTitle");
  const videoViewerClose = $("#videoViewerClose");
  let pendingVideoFile = null;
  let videosAvailable = true;

  function videoPublicUrl(row) {
    return supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(row.storage_path).data.publicUrl;
  }

  function openVideoModal() {
    videoModalEl.classList.add("open");
    videoModalEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeVideoModal() {
    videoModalEl.classList.remove("open");
    videoModalEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function resetVideoModal() {
    pendingVideoFile = null;
    videoInput.value = "";
    videoTitle.value = "";
    videoDesc.value = "";
    videoDropText.hidden = false;
    videoDropFile.hidden = true;
    videoDropFile.textContent = "";
  }

  addVideoBtn.addEventListener("click", () => videoInput.click());
  videoEmptyAddBtn.addEventListener("click", () => videoInput.click());
  videoDrop.addEventListener("click", () => videoInput.click());
  videoInput.addEventListener("change", () => {
    const file = videoInput.files && videoInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      showToast("Please choose a video file");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      showToast("Video is too big (max 200 MB)");
      return;
    }
    pendingVideoFile = file;
    videoDropText.hidden = true;
    videoDropFile.hidden = false;
    videoDropFile.textContent = file.name + " (" + Math.round(file.size / 1024 / 1024) + " MB)";
    if (!videoTitle.value) {
      videoTitle.value = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    }
    openVideoModal();
  });

  videoModalClose.addEventListener("click", () => {
    closeVideoModal();
    setTimeout(resetVideoModal, 350);
  });
  videoCancel.addEventListener("click", () => {
    closeVideoModal();
    setTimeout(resetVideoModal, 350);
  });
  videoModalEl.addEventListener("click", (e) => {
    if (e.target === videoModalEl) {
      closeVideoModal();
      setTimeout(resetVideoModal, 350);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (!videoModalEl.classList.contains("open")) return;
    if (e.key === "Escape") {
      closeVideoModal();
      setTimeout(resetVideoModal, 350);
    }
  });

  videoSave.addEventListener("click", async () => {
    if (!pendingVideoFile) {
      showToast("Choose a video first");
      return;
    }
    videoSave.disabled = true;
    videoSave.textContent = "Saving...";
    videoProgress.classList.add("show", "indeterminate");
    videoProgressText.textContent = "Uploading your video...";
    try {
      const ext = (pendingVideoFile.name.match(/\.([a-z0-9]+)$/i) || [])[1] || "mp4";
      const storagePath = `videos/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(storagePath, pendingVideoFile, {
          contentType: pendingVideoFile.type || "video/mp4",
        });
      if (upErr) throw upErr;

      videoProgressText.textContent = "Saving details...";

      const { data, error: insErr } = await supabase
        .from("videos")
        .insert({
          title: (videoTitle.value || "Our Moment").trim(),
          description: videoDesc.value.trim(),
          storage_path: storagePath,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      addVideoCard(makeVideoCard({ ...data, url: videoPublicUrl(data) }), true);
      closeVideoModal();
      setTimeout(resetVideoModal, 350);
      showToast("Video shared with everyone");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not save the video");
    } finally {
      videoSave.disabled = false;
      videoSave.textContent = "Save Video";
      videoProgress.classList.remove("show", "indeterminate");
    }
  });

  function makeVideoCard(record) {
    const fig = document.createElement("figure");
    fig.className = "video-card";
    fig.dataset.videoId = record.id;
    const dateLabel = new Date(record.created_at).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    fig.innerHTML = `
      <video src="${record.url}" preload="metadata" muted playsinline></video>
      <span class="video-play">&#9654;</span>
      <figcaption class="video-overlay">
        <p class="card-date">${escapeHtml(dateLabel)}</p>
        <h3 class="card-title">${escapeHtml(record.title || "Our Moment")}</h3>
        <p class="card-desc">${escapeHtml(record.description || "")}</p>
      </figcaption>
      <div class="card-actions">${CARD_ACTIONS}</div>
    `;
    const del = $(".card-delete", fig);
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      openConfirmDialog({
        title: "Delete video",
        message: "Remove this video from the album?",
        onConfirm: () => deleteVideo(record, fig),
      });
    });
    const edt = $(".card-edit", fig);
    edt.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditModal({ kind: "video", record, cardEl: fig });
    });
    fig.addEventListener("click", () => openVideoViewer(record, record.url));
    return fig;
  }

  function addVideoCard(card, atTop = false) {
    if (atTop) videosGrid.prepend(card);
    else videosGrid.appendChild(card);
    updateVideoCount();
  }

  function removeVideoCard(cardEl) {
    cardEl.remove();
    updateVideoCount();
  }

  function updateVideoCount() {
    const n = videosGrid.children.length;
    videosCount.innerHTML = n
      ? `<strong>${n}</strong> ${n === 1 ? "video" : "videos"}`
      : "0 videos";
    videosEmpty.classList.toggle("show", videosAvailable && n === 0);
    videosLoading.classList.remove("show");
  }

  async function loadVideos() {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      (data || []).forEach((row) => addVideoCard(makeVideoCard({ ...row, url: videoPublicUrl(row) })));
      videosOffline.hidden = true;
    } catch (err) {
      console.warn("Video gallery not available:", err.message || err);
      videosAvailable = false;
      videosOffline.hidden = false;
      addVideoBtn.disabled = true;
      videoEmptyAddBtn.disabled = true;
      videoRefreshBtn.disabled = true;
      videosCount.textContent = "";
    } finally {
      updateVideoCount();
    }
  }

  async function refreshVideos() {
    if (videoRefreshBtn.classList.contains("spinning")) return;
    videoRefreshBtn.classList.add("spinning");
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data || [];
      const serverIds = new Set(rows.map((r) => r.id));
      Array.from(videosGrid.querySelectorAll(".video-card")).forEach((card) => {
        if (card.dataset.videoId && !serverIds.has(card.dataset.videoId)) {
          removeVideoCard(card);
        }
      });
      const localIds = new Set(
        Array.from(videosGrid.querySelectorAll(".video-card"))
          .map((c) => c.dataset.videoId)
          .filter(Boolean)
      );
      rows.slice().reverse().forEach((row) => {
        if (localIds.has(row.id)) return;
        addVideoCard(makeVideoCard({ ...row, url: videoPublicUrl(row) }), true);
      });
      showToast("Videos refreshed");
    } catch (err) {
      console.error(err);
      showToast("Could not refresh the videos");
    } finally {
      videoRefreshBtn.classList.remove("spinning");
    }
  }
  videoRefreshBtn.addEventListener("click", refreshVideos);

  async function deleteVideo(record, cardEl) {
    try {
      const { error: delErr } = await supabase.from("videos").delete().eq("id", record.id);
      if (delErr) throw delErr;
      const { error: stErr } = await supabase.storage.from(SUPABASE_BUCKET).remove([record.storage_path]);
      if (stErr) throw stErr;
      removeVideoCard(cardEl);
      showToast("Video removed");
    } catch (err) {
      console.error(err);
      showToast("Could not remove the video");
    }
  }

  function subscribeToVideos() {
    try {
      supabase
        .channel("videos-live")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "videos" },
          (payload) => {
            const row = payload.new;
            addVideoCard(makeVideoCard({ ...row, url: videoPublicUrl(row) }), true);
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "videos" },
          (payload) => {
            const el = videosGrid.querySelector(`[data-video-id="${payload.old.id}"]`);
            if (el) removeVideoCard(el);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn("Video realtime not available:", err.message || err);
    }
  }

  function openVideoViewer(record, url) {
    videoViewerPlayer.src = url;
    videoViewerTitle.textContent = record.title || "Our Moment";
    videoViewer.classList.add("open");
    videoViewer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    videoViewerPlayer.play().catch(() => {});
  }

  function closeVideoViewer() {
    videoViewerPlayer.pause();
    videoViewerPlayer.removeAttribute("src");
    videoViewerPlayer.load();
    videoViewer.classList.remove("open");
    videoViewer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  videoViewerClose.addEventListener("click", closeVideoViewer);
  videoViewer.addEventListener("click", (e) => {
    if (e.target === videoViewer) closeVideoViewer();
  });
  document.addEventListener("keydown", (e) => {
    if (!videoViewer.classList.contains("open")) return;
    if (e.key === "Escape") closeVideoViewer();
  });

  /* ---------- Back to top ---------- */
  const backTop = $("#backTop");
  if (backTop) {
    const updateBackTop = () => backTop.classList.toggle("show", window.scrollY > 600);
    window.addEventListener("scroll", updateBackTop, { passive: true });
    backTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  /* ---------- Offline / online banner ---------- */
  const onlineBanner = $("#onlineBanner");
  function setOnlineState() {
    if (!onlineBanner) return;
    const offline = !navigator.onLine;
    onlineBanner.classList.toggle("show", offline);
    if (!offline && !setOnlineState._wasOffline) return;
    if (!offline) showToast("You're back online");
    setOnlineState._wasOffline = offline;
  }
  window.addEventListener("online", setOnlineState);
  window.addEventListener("offline", setOnlineState);
  setOnlineState();

  /* ---------- Bottom navigation (mobile) ---------- */
  const bnavItems = $$(".bottom-navbar .bnav-item");
  const bnavMusic = $("#bnavMusic");
  bnavItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const el = document.getElementById(btn.dataset.target);
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 78;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    });
  });
  if (bnavMusic) {
    bnavMusic.addEventListener("click", () => {
      if (musicOn) pauseMusic();
      else playMusic();
    });
  }
  /* Hide bottom nav while the on-screen keyboard is open */
  if (window.visualViewport) {
    const onVP = () => {
      const kbOpen = window.visualViewport.height < window.innerHeight * 0.72;
      document.body.classList.toggle("ime-open", kbOpen);
    };
    window.visualViewport.addEventListener("resize", onVP);
    window.visualViewport.addEventListener("scroll", onVP);
  }

  /* ---------- Service worker (offline app shell) ---------- */
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  /* ---------- Anniversary / next milestone widget ---------- */
  const annivTitle = $("#anniversaryTitle");
  const annivDate = $("#anniversaryDate");
  const annivDays = $("#annivDays");
  const annivTogether = $("#annivTogether");
  if (annivTitle) {
    const baseDate = new Date(TOGETHER_DATE);
    const fmt = new Intl.DateTimeFormat(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    function addMonthsSafe(d, months) {
      const y = d.getFullYear();
      const m = d.getMonth() + months;
      const ny = y + Math.floor(m / 12);
      const nm = ((m % 12) + 12) % 12;
      const nd = new Date(ny, nm, 1);
      nd.setDate(Math.min(d.getDate(), new Date(ny, nm + 1, 0).getDate()));
      nd.setHours(0, 0, 0, 0);
      return nd;
    }
    const now = Date.now();
    const candidates = [];
    for (let i = 1; i <= 11; i++) {
      const t = addMonthsSafe(baseDate, i).getTime();
      if (t > now) candidates.push({ t, label: i === 1 ? "1 Month" : i + " Months" });
    }
    for (let i = 1; i <= 3; i++) {
      const t = addMonthsSafe(baseDate, i * 12).getTime();
      if (t > now) candidates.push({ t, label: i === 1 ? "1 Year" : i + " Years" });
    }
    candidates.sort((a, b) => a.t - b.t);
    const next = candidates[0];
    if (next) {
      const refresh = () => {
        const daysTo = Math.max(0, Math.ceil((next.t - Date.now()) / 86400000));
        const daysTogether = Math.max(0, Math.floor((Date.now() - TOGETHER_DATE) / 86400000));
        annivTitle.textContent = next.label + " Anniversary";
        annivDate.textContent = fmt.format(new Date(next.t));
        annivDays.textContent = daysTo;
        annivTogether.textContent = daysTogether;
      };
      refresh();
      setInterval(refresh, 10 * 60 * 1000);
    }
  }

  /* ---------- Dating + notifications (couple features) ---------- */
  const datesOffline = $("#datesOffline");
  const datesDashboard = $("#datesDashboard");
  const dateForm = $("#dateForm");
  const dateTitle = $("#dateTitle");
  const dateDay = $("#dateDay");
  const dateTime = $("#dateTime");
  const dateActivity = $("#dateActivity");
  const dateDuration = $("#dateDuration");
  const datePlace = $("#datePlace");
  const dateNote = $("#dateNote");
  const dateSend = $("#dateSend");
  const surpriseDateBtn = $("#surpriseDateBtn");
  const dateSentNote = $("#dateSentNote");
  const dateImportanceWrap = $("#dateImportance");
  const pendingList = $("#pendingList");
  const upcomingList = $("#upcomingList");
  const historyList = $("#historyList");
  const pendingEmpty = $("#pendingEmpty");
  const upcomingEmpty = $("#upcomingEmpty");
  const historyEmpty = $("#historyEmpty");
  const notifBell = $("#notifBell");
  const notifBadge = $("#notifBadge");
  const notifPanel = $("#notifPanel");
  const notifList = $("#notifList");
  const notifEmpty = $("#notifEmpty");
  const notifClear = $("#notifClear");
  const notifClose = $("#notifClose");

  const ACTIVITY_LABELS = {
    dinner: "Dinner", movie: "Movie", coffee: "Coffee", walk: "Walk",
    trip: "Trip", surprise: "Surprise", other: "Other",
  };
  const DURATION_LABELS = { "1h": "~1 hour", "2h": "~2 hours", "half-day": "Half day", "full-day": "Full day" };
  const IMPORTANCE_LABELS = { casual: "Casual", special: "Special", must: "Must-not-miss" };
  const activityLabel = (a) => ACTIVITY_LABELS[a] || a;
  const durationLabel = (d) => DURATION_LABELS[d] || "";
  const importanceLabel = (i) => IMPORTANCE_LABELS[i] || i;

  let dateRows = [];
  let notifRows = [];
  let notifChannel = null;
  let dateChannel = null;
  let currentImportance = "special";

  /* ---- Identity chrome ---- */
  function updateAuthUI() {
    const id = $("#navIdentity");
    if (id) {
      id.hidden = !currentUser;
      if (currentUser) id.textContent = `Hi, ${COUPLE[currentUser.role].name}`;
    }
    const lockBtn = $("#logoutBtn");
    if (lockBtn) lockBtn.hidden = !currentUser;
    if (!currentUser) {
      const badge = $("#notifBadge");
      if (badge) badge.hidden = true;
    }
  }

  function hideCoupleUI() {
    const dash = $("#datesDashboard");
    if (dash) dash.hidden = true;
    const badge = $("#notifBadge");
    if (badge) badge.hidden = true;
    const panel = $("#notifPanel");
    if (panel) panel.hidden = true;
  }

  function teardownCoupleChannels() {
    if (notifChannel) {
      supabase.removeChannel(notifChannel);
      notifChannel = null;
    }
    if (dateChannel) {
      supabase.removeChannel(dateChannel);
      dateChannel = null;
    }
  }

  /* ---- Email (EmailJS) ---- */
  let emailReady = false;
  function initEmail() {
    if (!window.emailjs || !EMAILJS.publicKey) return;
    try {
      emailjs.init({ publicKey: EMAILJS.publicKey });
      emailReady = true;
    } catch (_) {}
  }

  async function sendDateEmail({ to, request }) {
    if (!emailReady) return { sent: false, skipped: true };
    const toEmail = to === "boyfriend" ? EMAILJS.boyfriendEmail : EMAILJS.girlfriendEmail;
    if (!toEmail) return { sent: false, skipped: true };
    const when = new Date(request.date_time);
    const params = {
      to_email: toEmail,
      to_name: COUPLE[to].name,
      from_name: COUPLE[request.proposer].name,
      date_title: request.title,
      date_day: when.toLocaleDateString(undefined, {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      }),
      date_time: when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      place: request.place || "—",
      activity: activityLabel(request.activity),
      duration: durationLabel(request.duration) || "Any",
      importance: importanceLabel(request.importance),
      note: request.note || "—",
      link: location.origin + location.pathname + "#dates",
    };
    try {
      await emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, params);
      return { sent: true };
    } catch (err) {
      console.error("EmailJS send failed:", err);
      return { sent: false, error: (err && (err.message || err.text)) || "EmailJS send error" };
    }
  }

  /* When a date is created, email BOTH partners (invitee + a copy to the proposer). */
  async function sendDateEmailToBoth(request) {
    const results = [];
    let error = "";
    for (const role of ["boyfriend", "girlfriend"]) {
      const r = await sendDateEmail({ to: role, request });
      results.push(r);
      if (r.error && !error) error = r.error;
    }
    if (results.some((r) => r.sent)) return { sent: true };
    if (results.every((r) => r.skipped)) return { sent: false, skipped: true };
    return { sent: false, error };
  }

  /* ---- Notifications ---- */
  async function pushNotification(recipient, { type, title, body, href }) {
    try {
      await supabase.from("notifications").insert({
        recipient, type, title, body, href: href || "#dates",
      });
    } catch (err) {
      console.error("Notification insert failed:", err);
    }
  }

  function notifTimeLabel(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  function renderNotifications() {
    if (!notifBadge) return;
    const unread = notifRows.filter((n) => !n.read).length;
    notifBadge.hidden = unread === 0;
    notifBadge.textContent = unread > 99 ? "99+" : unread;
    if (notifList) {
      notifList.innerHTML = "";
      notifRows.slice(0, 15).forEach((n) => notifList.appendChild(notifItem(n)));
    }
    if (notifEmpty) notifEmpty.hidden = notifRows.length > 0;
  }

  function notifItem(n) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "notif-item" + (n.read ? "" : " unread");
    const ico =
      n.type === "date_response"
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
    btn.innerHTML = `
      <span class="n-ico">${ico}</span>
      <span class="n-body">
        <span class="n-title">${escapeHtml(n.title)}<span class="n-dot"></span></span>
        <span class="n-text">${escapeHtml(n.body)}</span>
        <span class="n-time">${notifTimeLabel(n.created_at)}</span>
      </span>
      <button class="n-x" type="button" aria-label="Delete notification" title="Delete">&times;</button>`;
    btn.addEventListener("click", (e) => {
      if (e.target.closest(".n-x")) return;
      markNotifRead(n.id);
      closeNotifPanel();
      const target = document.querySelector(n.href);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
    $(".n-x", btn).addEventListener("click", (e) => {
      e.stopPropagation();
      deleteNotif(n.id);
    });
    return btn;
  }

  async function markNotifRead(id) {
    const row = notifRows.find((r) => r.id === id);
    if (row && row.read) return;
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    } catch (_) {}
    if (row) row.read = true;
    renderNotifications();
  }

  async function deleteNotif(id) {
    try {
      await supabase.from("notifications").delete().eq("id", id);
    } catch (_) {}
    notifRows = notifRows.filter((r) => r.id !== id);
    renderNotifications();
  }

  async function loadNotifications() {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient", currentUser.role)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      notifRows = data || [];
      renderNotifications();
    } catch (err) {
      console.warn("Notifications unavailable:", err.message || err);
    }
  }

  function openNotifPanel() {
    notifPanel.hidden = false;
  }
  function closeNotifPanel() {
    notifPanel.hidden = true;
  }

  notifBell.addEventListener("click", (e) => {
    e.stopPropagation();
    if (notifPanel.hidden) openNotifPanel();
    else closeNotifPanel();
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".bell-wrap")) closeNotifPanel();
  });
  notifClear.addEventListener("click", async () => {
    await Promise.all(notifRows.filter((n) => !n.read).map((n) => markNotifRead(n.id)));
    showToast("All caught up");
  });
  notifClose.addEventListener("click", (e) => {
    e.stopPropagation();
    closeNotifPanel();
  });

  /* ---- Dates ---- */
  function dateDayLabel(iso) {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric",
    });
  }
  function dateTimeLabel(d) {
    if (!d) return "";
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  function setImportance(v) {
    currentImportance = v;
    $$(".importance-pills .pill", dateImportanceWrap).forEach((p) => {
      p.classList.toggle("active", p.dataset.importance === v);
    });
  }
  dateImportanceWrap.addEventListener("click", (e) => {
    const p = e.target.closest(".pill");
    if (p) setImportance(p.dataset.importance);
  });

  function dateCard(r) {
    const art = document.createElement("article");
    art.className =
      "date-item" +
      (r.proposer === currentUser.role ? " mine" : "") +
      (r.status === "accepted" ? " accepted" : "");
    const isForMe = r.proposer !== currentUser.role;
    const when = new Date(r.date_time);
    const daysTo = Math.ceil((when.getTime() - Date.now()) / 86400000);
    const count =
      r.status !== "declined" && daysTo >= 0
        ? `<span class="di-count ${r.status === "pending" ? "di-count-waiting" : ""}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>${
            daysTo === 0 ? "Today" : daysTo === 1 ? "Tomorrow" : daysTo + "d"
          }</span>`
        : daysTo < 0
        ? `<span class="di-count di-count-past"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>${Math.abs(daysTo) + "d"}</span>`
        : "";
    const rows = [
      `<div class="di-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>${dateDayLabel(r.date_time)} &middot; ${dateTimeLabel(when)}</div>`,
      r.place ? `<div class="di-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHtml(r.place)}</div>` : "",
      `<div class="di-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.7L19 10l-5.1 1.3L12 17l-1.9-5.7L5 10l5.1-1.3z"/></svg>${escapeHtml(activityLabel(r.activity))}</div>`,
      r.duration ? `<div class="di-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>${escapeHtml(durationLabel(r.duration))}</div>` : "",
      r.importance !== "casual" ? `<div class="di-row"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.9 5.7L19 10l-5.1 1.3L12 17l-1.9-5.7L5 10l5.1-1.3z"/></svg>${escapeHtml(importanceLabel(r.importance))}</div>` : "",
      r.note ? `<div class="di-note">${escapeHtml(r.note)}</div>` : "",
    ].join("");
    let actions = "";
    if (isForMe && r.status === "pending") {
      actions = `<div class="di-actions">
        <button class="btn btn-accept" type="button" data-accept="${r.id}">Accept</button>
        <button class="btn btn-decline" type="button" data-decline="${r.id}">Decline</button>
      </div>`;
    }
    art.innerHTML = `
      <div class="di-head">
        <h4 class="di-title">${escapeHtml(r.title)}</h4>
        <span class="di-head-actions">
          <span class="di-badge ${r.status}">${r.status}</span>
          <button class="card-delete di-delete" type="button" data-delete="${r.id}" aria-label="Delete date">${DELETE_ICON}</button>
        </span>
      </div>
      <div class="di-rows">${rows}</div>
      <div class="di-meta">
        <span>by ${escapeHtml(COUPLE[r.proposer].name)}</span>
        ${count}
      </div>
      ${actions}`;
    return art;
  }

  function renderDates() {
    if (!currentUser) return;
    const role = currentUser.role;
    const now = Date.now();
    const pending = dateRows.filter((r) => r.status === "pending" && r.proposer !== role);
    const upcoming = dateRows
      .filter((r) => r.status === "accepted" && new Date(r.date_time).getTime() >= now)
      .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
    const history = dateRows
      .filter((r) => !pending.includes(r) && !upcoming.includes(r))
      .slice(0, 12);

    pendingList.innerHTML = "";
    pending.forEach((r) => pendingList.appendChild(dateCard(r)));
    pendingEmpty.hidden = pending.length > 0;

    upcomingList.innerHTML = "";
    upcoming.forEach((r) => upcomingList.appendChild(dateCard(r)));
    upcomingEmpty.hidden = upcoming.length > 0;

    historyList.innerHTML = "";
    history.forEach((r) => historyList.appendChild(dateCard(r)));
    historyEmpty.hidden = history.length > 0;
  }

  async function loadDates() {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from("date_requests")
        .select("*")
        .order("date_time", { ascending: false })
        .limit(100);
      if (error) throw error;
      dateRows = data || [];
      datesOffline.hidden = true;
      datesDashboard.hidden = false;
      renderDates();
    } catch (err) {
      console.warn("Dating unavailable:", err.message || err);
      datesOffline.hidden = false;
      datesDashboard.hidden = true;
    }
  }

  async function respondToDate(id, status) {
    const row = dateRows.find((r) => r.id === id);
    if (!row || !currentUser) return;
    try {
      const { error } = await supabase
        .from("date_requests")
        .update({ status, responded_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await pushNotification(row.proposer, {
        type: "date_response",
        title: status === "accepted" ? "Date accepted ♥" : "Date declined",
        body: `${COUPLE[currentUser.role].name} ${status === "accepted" ? "said YES to" : "declined"} "${row.title}"`,
        href: "#dates",
      });
      await sendDateEmail({ to: row.proposer, request: { ...row, status } });
      showToast(status === "accepted" ? "Date accepted — yay!" : "Date declined");
    } catch (err) {
      console.error(err);
      showToast("Could not update the date");
    }
  }

  async function deleteDate(id) {
    const row = dateRows.find((r) => r.id === id);
    if (!row || !currentUser) return;
    openConfirmDialog({
      title: "Delete date",
      message: `Delete "${row.title}"? This can't be undone.`,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("date_requests").delete().eq("id", id);
          if (error) throw error;
          await pushNotification(
            row.proposer === currentUser.role
              ? (currentUser.role === "boyfriend" ? "girlfriend" : "boyfriend")
              : row.proposer,
            { type: "date", title: "Date removed", body: `"${row.title}" was removed`, href: "#dates" }
          );
          showToast("Date deleted");
        } catch (err) {
          console.error(err);
          showToast("Could not delete the date");
        }
      },
    });
  }

  [pendingList, upcomingList, historyList].forEach((list) => {
    list.addEventListener("click", (e) => {
      const del = e.target.closest("[data-delete]");
      const acc = e.target.closest("[data-accept]");
      const dec = e.target.closest("[data-decline]");
      if (del) deleteDate(del.dataset.delete);
      else if (acc) respondToDate(acc.dataset.accept, "accepted");
      else if (dec) respondToDate(dec.dataset.decline, "declined");
    });
  });

  const DATE_IDEAS = [
    { title: "Sunset picnic by the lake", activity: "dinner", duration: "half-day", place: "Lakefront park" },
    { title: "Cozy movie night in", activity: "movie", duration: "2h", place: "Home, blankets & snacks" },
    { title: "Slow morning coffee walk", activity: "coffee", duration: "1h", place: "The cute café downtown" },
    { title: "Stargazing rooftop date", activity: "walk", duration: "2h", place: "Rooftop or hilltop" },
    { title: "Mini road trip getaway", activity: "trip", duration: "full-day", place: "Somewhere new, no plan" },
    { title: "Dancing in the kitchen night", activity: "surprise", duration: "1h", place: "Our kitchen" },
    { title: "Hand-in-hand beach sunset", activity: "walk", duration: "half-day", place: "The beach" },
    { title: "Cook a new recipe together", activity: "dinner", duration: "2h", place: "Our kitchen" },
    { title: "Museum + ice cream afternoon", activity: "other", duration: "half-day", place: "The museum" },
    { title: "Bike ride to nowhere", activity: "trip", duration: "half-day", place: "Pick a direction" },
    { title: "Cozy blanket fort + fairy lights", activity: "surprise", duration: "1h", place: "Living room" },
    { title: "Karaoke duet night", activity: "other", duration: "2h", place: "Home karaoke" },
  ];
  const DATE_NOTES = [
    "Bring your best smile 💛",
    "Dress comfy — you're adorable either way",
    "I have a small surprise planned 🤫",
    "Let's take lots of pictures!",
    "No phones, just us 📵",
    "I'll pick you up, be ready 🏃‍♂️",
    "Extra cuddles included 🧸",
  ];
  surpriseDateBtn.addEventListener("click", () => {
    if (!currentUser) {
      showToast("Please log in first");
      return;
    }
    const idea = DATE_IDEAS[Math.floor(Math.random() * DATE_IDEAS.length)];
    const note = DATE_NOTES[Math.floor(Math.random() * DATE_NOTES.length)];
    dateTitle.value = idea.title;
    dateActivity.value = idea.activity;
    dateDuration.value = idea.duration;
    datePlace.value = idea.place;
    dateNote.value = note;
    const future = new Date();
    future.setDate(future.getDate() + 1 + Math.floor(Math.random() * 6));
    dateDay.value = future.toISOString().slice(0, 10);
    dateTime.value = "18:30";
    setImportance("special");
    dateTitle.focus();
    showToast("Here's an idea — make it yours!");
  });

  dateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast("Please log in first");
      return;
    }
    const title = dateTitle.value.trim();
    const day = dateDay.value;
    const time = dateTime.value;
    if (!title || !day || !time) {
      showToast("Please fill in title, date and time");
      return;
    }
    const when = new Date(`${day}T${time || "12:00"}`);
    const payload = {
      proposer: currentUser.role,
      title,
      date_time: when.toISOString(),
      place: datePlace.value.trim(),
      activity: dateActivity.value,
      note: dateNote.value.trim(),
      duration: dateDuration.value,
      importance: currentImportance,
      status: "pending",
    };
    try {
      const { data, error } = await supabase.from("date_requests").insert(payload).select().single();
      if (error) throw error;
      const partner = partnerOf(currentUser.role);
      await pushNotification(partner, {
        type: "date_request",
        title: "You have a date! ♥",
        body: `${COUPLE[currentUser.role].name} wants to take you on: "${title}"`,
        href: "#dates",
      });
      const mail = await sendDateEmailToBoth(data);
      dateForm.reset();
      setImportance("special");
      dateSentNote.hidden = false;
      setTimeout(() => (dateSentNote.hidden = true), 7000);
      if (mail.sent) {
        showToast("Date request sent to both of you! Emails are on their way");
      } else if (mail.skipped) {
        showToast("Request sent — email not configured yet");
      } else {
        showToast("Email failed: " + (mail.error || "unknown error"));
      }
    } catch (err) {
      console.error(err);
      showToast("Could not send the date request");
    }
  });

  /* ---- Realtime subscriptions ---- */
  function subscribeDateRequests() {
    if (dateChannel || !currentUser) return;
    dateChannel = supabase
      .channel("couple-dates-" + currentUser.role)
      .on("postgres_changes", { event: "*", schema: "public", table: "date_requests" }, () => {
        loadDates();
      })
      .subscribe();
  }

  function subscribeCoupleNotifications() {
    if (notifChannel || !currentUser) return;
    notifChannel = supabase
      .channel("couple-notifs-" + currentUser.role)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient=eq.${currentUser.role}` },
        (payload) => {
          notifRows.unshift(payload.new);
          renderNotifications();
        }
      )
      .subscribe();
  }

  function initCoupleFeatures() {
    if (!currentUser) return;
    datesDashboard.hidden = false;
    datesOffline.hidden = true;
    updateAuthUI();
    loadDates();
    loadNotifications();
    subscribeDateRequests();
    subscribeCoupleNotifications();
  }

  /* ---------- Init ---------- */
  initGalleryCards();
  renderGallery();
  loadSavedPhotos();
  subscribeToPhotos();
  loadVideos();
  subscribeToVideos();
  initNotes();
  if (window.emailjs) initEmail();
  setImportance("special");
  if (currentUser) {
    initCoupleFeatures();
    setTimeout(openFromHash, 1200);
  }
})();
