const params = new URLSearchParams(location.search);
const staticMode = params.has("static") || !("IntersectionObserver" in window);
const calm = staticMode || matchMedia("(prefers-reduced-motion: reduce)").matches;

// Nav turns solid once the page leaves the hero
const nav = document.querySelector(".nav");
const burger = document.querySelector(".nav-burger");
const onNavScroll = () => nav.classList.toggle("scrolled", scrollY > 24);
addEventListener("scroll", onNavScroll, { passive: true });
onNavScroll();

const setMenu = (open) => {
  nav.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
};
burger.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
document.querySelectorAll(".nav-mobile a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

// Hero headline rises in on load
requestAnimationFrame(() => document.querySelector(".hero").classList.add("ready"));

// Fade-up reveals
const reveals = document.querySelectorAll(".reveal");
if (staticMode) {
  document.documentElement.style.scrollBehavior = "auto";
  reveals.forEach((el) => el.classList.add("in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  reveals.forEach((el) => io.observe(el));
}

// Lights each item as it crosses the middle of the screen, and stays lit
const lightOnScroll = (items, onLight) => {
  if (calm) {
    items.forEach((el) => el.classList.add("on"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("on");
        onLight?.(e.target);
      }
    },
    { rootMargin: "-42% 0px -42% 0px" }
  );
  items.forEach((el) => io.observe(el));
};
lightOnScroll(document.querySelectorAll(".answers-list li"));

const stepNum = document.querySelector(".approach-num");
lightOnScroll(document.querySelectorAll(".steps li"), (li) => {
  stepNum.textContent = li.querySelector("span").textContent;
});

// Statement reads itself in, word by word, as you scroll
const scrub = document.querySelector(".scrub");
scrub.innerHTML = scrub.textContent
  .split(" ")
  .map((word) => `<span class="w">${word}</span>`)
  .join(" ");
const words = scrub.querySelectorAll(".w");
const paintWords = () => {
  const box = scrub.getBoundingClientRect();
  const start = innerHeight * 0.85;
  const end = innerHeight * 0.4;
  const progress = Math.min(1, Math.max(0, (start - box.top) / (start - end + box.height)));
  const lit = calm ? words.length : Math.round(progress * words.length);
  words.forEach((w, i) => w.classList.toggle("on", i < lit));
};
addEventListener("scroll", () => requestAnimationFrame(paintWords), { passive: true });
paintWords();

// Services index: hover or focus on desktop, tap to open on mobile
const services = [...document.querySelectorAll(".svc")];
const stacked = matchMedia("(max-width: 900px)");
const openService = (svc) => {
  services.forEach((s) => {
    const open = s === svc;
    s.classList.toggle("is-active", open);
    s.querySelector("button").setAttribute("aria-expanded", open);
  });
};
services.forEach((svc) => {
  const button = svc.querySelector("button");
  button.addEventListener("click", () => {
    if (stacked.matches && svc.classList.contains("is-active")) {
      svc.classList.remove("is-active");
      button.setAttribute("aria-expanded", false);
    } else {
      openService(svc);
    }
  });
  button.addEventListener("pointerenter", (e) => {
    if (!stacked.matches && e.pointerType === "mouse") openService(svc);
  });
  button.addEventListener("focus", () => {
    if (!stacked.matches) openService(svc);
  });
});

document.querySelector(".contact-form").addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.querySelector(".form-sent").textContent = "Thank you. We’ll be in touch shortly.";
});

// The signature graphic: scattered marks sweep into line and point forward,
// and a few stay lit, the opportunities worth pursuing
const FORWARD = -0.35;
const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const turn = (from, to, t) => {
  const d = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + d * t;
};
const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const sizeCanvas = (canvas) => {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round";
  return { ctx, w, h };
};

const heroField = () => {
  const hero = document.querySelector(".hero");
  const canvas = hero.querySelector(".field");
  let ctx, w, h, ticks, gap;
  let visible = true;
  let frame = 0;
  let begin = performance.now();
  const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

  const build = () => {
    ({ ctx, w, h } = sizeCanvas(canvas));
    const compact = w <= 900;
    gap = compact ? 26 : 32;
    const top = canvas.getBoundingClientRect().top;
    const footTop = hero.querySelector(".hero-foot").getBoundingClientRect().top - top;
    const headTop = hero.querySelector("h1").getBoundingClientRect().top - top;
    // The marks live clear of the text: right of the headline on desktop, above it on mobile
    const zoneOf = compact
      ? (x, y) => smooth(84, 126, y) * (1 - smooth(headTop - 44, headTop - 4, y))
      : (x, y) => smooth(w * 0.57, w * 0.68, x) * smooth(84, 136, y) * (1 - smooth(footTop - 48, footTop - 8, y));
    // A rising path of lit marks through the field
    const from = compact ? { x: 0, y: headTop - 24 } : { x: w * 0.6, y: footTop - 40 };
    const to = { x: w, y: compact ? 104 : 116 };
    const span = Math.hypot(to.x - from.x, to.y - from.y);
    const offPath = (x, y) =>
      Math.abs((to.y - from.y) * x - (to.x - from.x) * y + to.x * from.y - to.y * from.x) / span;
    const limit = compact ? headTop - 8 : footTop - 8;
    const random = seeded(7);
    ticks = [];
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) {
        if (y < 76 || y > limit) continue;
        const zone = zoneOf(x, y);
        const off = offPath(x, y);
        const odds = zone < 0.5 ? 0 : off < gap * 1.3 ? 0.62 : off < gap * 3 ? 0.13 : 0.012;
        ticks.push({
          x,
          y,
          from: random() * Math.PI * 2,
          lag: random() * 420,
          hot: random() < odds,
          dim: 0.09 + zone * 0.91,
        });
      }
    }
  };

  const draw = (now) => {
    const elapsed = calm ? 1e5 : now - begin;
    const time = calm ? 0 : now * 0.00042;
    pointer.x += (pointer.tx - pointer.x) * 0.1;
    pointer.y += (pointer.ty - pointer.y) * 0.1;
    ctx.clearRect(0, 0, w, h);

    for (const t of ticks) {
      const settled = smooth(0, 1, (elapsed - 250 - (t.x / w) * 1300 - t.lag) / 1500);
      const wave = Math.sin(t.x * 0.0034 + t.y * 0.0052 + time);
      const dx = pointer.x - t.x;
      const dy = pointer.y - t.y;
      const near = Math.max(0, 1 - Math.hypot(dx, dy) / 200);
      const aim = turn(FORWARD + wave * 0.17, Math.atan2(dy, dx), near * near);
      const angle = turn(t.from, aim, settled);
      const size = gap * (t.hot ? 0.36 : 0.24) * (0.72 + settled * 0.28) * (1 + near * 0.5);
      const cos = Math.cos(angle) * size;
      const sin = Math.sin(angle) * size;

      ctx.beginPath();
      ctx.moveTo(t.x - cos, t.y - sin);
      ctx.lineTo(t.x + cos, t.y + sin);
      if (t.hot) {
        ctx.strokeStyle = "#ff5a2b";
        ctx.globalAlpha = (0.2 + settled * 0.8) * t.dim;
        ctx.lineWidth = 2.2;
      } else {
        ctx.strokeStyle = "#ffffff";
        ctx.globalAlpha = (0.2 + settled * 0.22 + (wave + 1) * 0.08 + near * 0.4) * t.dim;
        ctx.lineWidth = 1.2;
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const loop = (now) => {
    draw(now);
    frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  };
  const wake = () => {
    if (!calm && !frame && visible && !document.hidden) frame = requestAnimationFrame(loop);
  };

  build();
  addEventListener("resize", () => {
    build();
    if (calm) draw(0);
  });
  if (calm) {
    draw(0);
    return;
  }
  hero.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const box = canvas.getBoundingClientRect();
    pointer.tx = e.clientX - box.left;
    pointer.ty = e.clientY - box.top;
  });
  hero.addEventListener("pointerleave", () => {
    pointer.tx = pointer.ty = -9999;
  });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    wake();
  }).observe(hero);
  document.addEventListener("visibilitychange", wake);
  begin = performance.now();
  wake();
};

// Insight covers are the same mark field, drawn once per card
const THEMES = {
  navy: { bg: "#131f4a", mark: "#ffffff", hot: "#ff5a2b", alpha: 0.42 },
  signal: { bg: "#ff5a2b", mark: "#0a1430", hot: "#ffffff", alpha: 0.5 },
  white: { bg: "#ffffff", mark: "#131f4a", hot: "#ff5a2b", alpha: 0.4 },
};
const drawCover = (canvas) => {
  const { ctx, w, h } = sizeCanvas(canvas);
  const theme = THEMES[canvas.dataset.theme];
  const random = seeded(Number(canvas.dataset.seed));
  const freq = 0.006 + random() * 0.012;
  const phase = random() * 6.28;
  const tilt = random() * 1.5 + 0.5;
  const gap = 18;
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, w, h);
  for (let y = gap / 2; y < h; y += gap) {
    for (let x = gap / 2; x < w; x += gap) {
      const angle = FORWARD + Math.sin(x * freq + y * freq * tilt + phase) * 1.1;
      const hot = random() < 0.07;
      const size = gap * (hot ? 0.34 : 0.24);
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(angle) * size, y - Math.sin(angle) * size);
      ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
      ctx.strokeStyle = hot ? theme.hot : theme.mark;
      ctx.globalAlpha = hot ? 1 : theme.alpha;
      ctx.lineWidth = hot ? 1.8 : 1;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
};
const covers = document.querySelectorAll(".cover");
covers.forEach(drawCover);
addEventListener("resize", () => covers.forEach(drawCover));

heroField();
