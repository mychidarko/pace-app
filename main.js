// Sticky nav background on scroll
const nav = document.querySelector(".nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile menu
const burger = document.querySelector(".nav-burger");
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});
document.querySelectorAll(".nav-mobile a").forEach((a) =>
  a.addEventListener("click", () => nav.classList.remove("open"))
);

// Static mode: reveal everything immediately (headless capture, print, no-JS-observer fallback)
const staticMode =
  new URLSearchParams(location.search).has("static") || !("IntersectionObserver" in window);
if (staticMode) {
  document.documentElement.classList.add("static");
  document.documentElement.style.scrollBehavior = "auto";
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  const target = new URLSearchParams(location.search).get("go");
  if (target) document.getElementById(target)?.scrollIntoView({ block: "start" });
}

// Scroll reveal
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
if (!staticMode) {
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}
