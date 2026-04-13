/**
 * Python Ankara — pythonankara.com
 *
 * Three independent modules:
 *   1. PhotoStack  — desktop spread + drag, mobile tap-through deck
 *   2. FooterLogo  — alternating logo swap every 10 s / on hover
 *   3. ContactPop  — delayed-open/close popover with copy-to-clipboard
 */

const MOBILE_BP = 600;
const isMobile = () => window.innerWidth <= MOBILE_BP;

/* ================================================================== */
/* 1. PHOTO STACK                                                     */
/* ================================================================== */
(() => {
  const stack = document.getElementById("stack");
  if (!stack) return;

  const cards = [...stack.querySelectorAll(".stack-card")];
  const n = cards.length;

  // Shared position state for each card (used by desktop drag)
  const positions = new Map();
  cards.forEach((c, i) => {
    positions.set(c, { x: 0, y: 0, tilt: 0 });
    c.style.zIndex = i + 1;
  });

  let topZ = n + 1;

  /* ---- DESKTOP: responsive spread ---- */

  // Fractional offsets calibrated to match the reference layout at 1200 px
  const SPREAD = [
    { xf: -0.69, yf: 0.03, r: -8 },
    { xf: -0.43, yf: 0.10, r:  5 },
    { xf:  0.43, yf: 0.03, r: -5 },
    { xf:  0.69, yf: 0.09, r:  7 },
    { xf: -0.55, yf: 0.14, r:  4 },
    { xf:  0.55, yf: 0.13, r: -6 },
    { xf: -0.28, yf: 0.16, r: -3 },
    { xf:  0.28, yf: 0.14, r:  4 },
    { xf:  0,    yf: 0,    r:  0 },
  ];
  const REF_W = 1200;

  function computeSpreads() {
    const boxW = stack.offsetWidth;
    const rect = stack.getBoundingClientRect();
    const vw = window.innerWidth;
    const gutter = 16;
    const spaceL = rect.left - gutter;
    const spaceR = vw - rect.right - gutter;
    const squeeze = Math.min(vw / REF_W, 1);

    return SPREAD.map((s) => {
      const side = s.xf < 0 ? spaceL : spaceR;
      const abs = Math.abs(s.xf);
      // Power curve: inner cards compress faster on narrow viewports
      const exp = 1 + (1 - squeeze) * 1.5;
      const curved = Math.pow(abs, exp);
      const sign = s.xf < 0 ? -1 : 1;
      return { x: sign * curved * side, y: s.yf * boxW, r: s.r };
    });
  }

  function applySpreads(animate) {
    if (isMobile()) return;
    const spreads = computeSpreads();
    cards.forEach((c, i) => {
      const s = spreads[i % spreads.length];
      const p = positions.get(c);
      p.x = s.x;
      p.y = s.y;
      p.tilt = s.r;
      c.style.transition = animate
        ? "transform 0.8s cubic-bezier(0.34,1.56,0.64,1)"
        : "transform 0.3s ease";
      c.style.transform = `translate(${s.x}px,${s.y}px) rotate(${s.r}deg)`;
    });
    // Pin z-order by data-pin attributes
    cards.forEach((c) => {
      if (c.dataset.pin === "front") c.style.zIndex = 90;
      if (c.dataset.pin === "top") c.style.zIndex = 100;
    });
    topZ = 101;
  }

  function initDesktopDrag() {
    cards.forEach((card) => {
      let dragging = false;
      let startX, startY;
      const pos = positions.get(card);

      card.addEventListener("pointerdown", (e) => {
        if (isMobile()) return;
        dragging = true;
        startX = e.clientX - pos.x;
        startY = e.clientY - pos.y;
        card.style.transition = "none";
        card.style.zIndex = ++topZ;
        card.setPointerCapture(e.pointerId);
      });

      card.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        pos.x = e.clientX - startX;
        pos.y = e.clientY - startY;
        card.style.transform =
          `translate(${pos.x}px,${pos.y}px) rotate(${pos.tilt + pos.x * 0.02}deg)`;
      });

      const up = () => {
        if (!dragging) return;
        dragging = false;
        card.style.transition = "box-shadow 0.2s";
      };
      card.addEventListener("pointerup", up);
      card.addEventListener("pointercancel", up);
    });
  }

  /* ---- MOBILE: stacked deck with peek ---- */

  let deckOrder = [];
  const MAX_PEEK = 4;
  const logoIdx = cards.findIndex((c) => c.dataset.pin === "top");

  function buildDeckOrder() {
    deckOrder = cards.map((_, i) => i).filter((i) => i !== logoIdx);
    deckOrder.push(logoIdx);
  }

  function sizeDeckContainer() {
    requestAnimationFrame(() => {
      const h = cards[0].offsetHeight;
      stack.style.height = h + Math.min(n - 1, MAX_PEEK) * 6 + "px";
    });
  }

  function enterMobileMode() {
    if (deckOrder.length === 0) buildDeckOrder();
    layoutDeck(false);
    sizeDeckContainer();
    updateCounter();
  }

  function layoutDeck(animate) {
    deckOrder.forEach((idx, pos) => {
      const card = cards[idx];
      const depth = n - 1 - pos; // 0 = top card
      card.style.zIndex = pos + 1;

      if (depth < MAX_PEEK) {
        const y = depth * 6;
        const s = 1 - depth * 0.03;
        const r = depth === 0 ? 0 : (depth % 2 === 0 ? -0.6 : 0.6) * depth;
        card.style.transform = `translateY(${y}px) scale(${s}) rotate(${r}deg)`;
        card.style.opacity = "1";
      } else {
        card.style.transform = `translateY(${MAX_PEEK * 6}px) scale(${1 - MAX_PEEK * 0.03})`;
        card.style.opacity = "0";
      }

      card.style.transition = animate
        ? "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease"
        : "none";
    });
  }

  function cycleDeck() {
    const topIdx = deckOrder.pop();
    const top = cards[topIdx];
    top.style.transition = "transform 0.3s ease, opacity 0.25s ease";
    top.style.transform = "translateY(-30px) scale(0.95) rotate(-4deg)";
    top.style.opacity = "0.3";

    setTimeout(() => {
      deckOrder.unshift(topIdx);
      layoutDeck(true);
      updateCounter();
    }, 250);
  }

  function updateCounter() {
    const el = document.getElementById("stackCounter");
    if (!el || deckOrder.length === 0) return;
    const topIdx = deckOrder[deckOrder.length - 1];
    el.textContent = cards[topIdx].querySelector(".card-label").textContent;
  }

  /* ---- Mode switching ---- */

  let currentMode = null; // "desktop" | "mobile"

  function enterDesktopMode(animate) {
    stack.style.height = "";
    cards.forEach((c) => { c.style.opacity = ""; });
    applySpreads(animate);
  }

  function resetCardsForModeSwitch() {
    cards.forEach((c) => {
      c.style.transform = "";
      c.style.transition = "";
      c.style.opacity = "";
      c.style.zIndex = "";
    });
  }

  function setMode(mode, animate) {
    if (mode === currentMode) return false; // no change
    resetCardsForModeSwitch();
    currentMode = mode;
    if (mode === "desktop") {
      enterDesktopMode(animate);
    } else {
      enterMobileMode();
    }
    return true;
  }

  // Bind interaction listeners once (they check isMobile() at runtime)
  initDesktopDrag();
  stack.addEventListener("click", () => { if (isMobile()) cycleDeck(); });
  let touchY = 0;
  stack.addEventListener("touchstart", (e) => {
    if (!isMobile()) return;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  stack.addEventListener("touchend", (e) => {
    if (!isMobile()) return;
    if (touchY - e.changedTouches[0].clientY > 40) cycleDeck();
  }, { passive: true });

  // Initial mode
  const initialMode = isMobile() ? "mobile" : "desktop";
  currentMode = initialMode;
  if (initialMode === "desktop") {
    setTimeout(() => applySpreads(true), 200);
  } else {
    enterMobileMode();
  }

  // Resize: switch mode or re-layout within same mode
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newMode = isMobile() ? "mobile" : "desktop";
      if (!setMode(newMode, false)) {
        // Same mode — just re-layout
        if (newMode === "desktop") {
          applySpreads(false);
        } else {
          layoutDeck(false);
          sizeDeckContainer();
        }
      }
    }, 150);
  });
})();

/* ================================================================== */
/* 2. FOOTER LOGO SWAP                                                */
/* ================================================================== */
(() => {
  const wrap = document.getElementById("footLogo");
  if (!wrap) return;

  let timer = setInterval(() => wrap.classList.toggle("show-python"), 10_000);

  wrap.addEventListener("mouseenter", () => {
    wrap.classList.toggle("show-python");
    clearInterval(timer);
    timer = setInterval(() => wrap.classList.toggle("show-python"), 10_000);
  });
})();

/* ================================================================== */
/* 3. CONTACT POPOVER                                                 */
/* ================================================================== */
document.querySelectorAll(".contact-wrap").forEach((wrap) => {
  let openT = null;
  let closeT = null;

  function show() {
    clearTimeout(closeT);
    openT = setTimeout(() => wrap.classList.add("is-open"), 350);
  }
  function hide() {
    clearTimeout(openT);
    closeT = setTimeout(() => wrap.classList.remove("is-open"), 400);
  }

  wrap.addEventListener("mouseenter", show);
  wrap.addEventListener("mouseleave", hide);

  // Toggle on click/tap (for mobile or direct clicks)
  wrap.querySelector(".contact-trigger").addEventListener("click", (e) => {
    e.preventDefault();
    clearTimeout(openT);
    clearTimeout(closeT);
    wrap.classList.toggle("is-open");
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) {
      clearTimeout(openT);
      wrap.classList.remove("is-open");
    }
  });
});

/* Copy to clipboard */
document.querySelectorAll(".contact-copy").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const email = btn.dataset.email;
    const icoCopy = btn.querySelector(".ico-copy");
    const icoCheck = btn.querySelector(".ico-check");
    const label = btn.querySelector(".copy-label");

    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Fallback for insecure contexts
      const ta = Object.assign(document.createElement("textarea"), {
        value: email,
        style: "position:fixed;opacity:0",
      });
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* noop */ }
      document.body.removeChild(ta);
    }

    btn.classList.add("copied");
    icoCopy.style.display = "none";
    icoCheck.style.display = "inline";
    label.textContent = "Kopyalandı";

    setTimeout(() => {
      btn.classList.remove("copied");
      icoCopy.style.display = "inline";
      icoCheck.style.display = "none";
      label.textContent = "Kopyala";
    }, 1800);
  });
});
