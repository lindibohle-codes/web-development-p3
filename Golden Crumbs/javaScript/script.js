/* Golden Crumbs - script.js
   Works with the existing HTML only (no HTML changes needed).
   Everything extra is created and styled from here. */

document.addEventListener("DOMContentLoaded", () => {
  injectStyles();
  fixContactLink();
  highlightActiveNav();
  addImageAccessibility();
  setupGalleryLightbox();
  setupOpenStatus();
  setupPriceEstimator();
  makeContactClickable();
  setupScrollReveal();
  setupBackToTop();
});

/* ---------- Helpers ---------- */

// Find an <h1> by its text (e.g. "Gallery")
function findHeading(text) {
  return Array.from(document.querySelectorAll("main h1")).find(
    (h) => h.textContent.trim().toLowerCase() === text.toLowerCase()
  );
}

// Inject the CSS needed by the dynamic features
function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    html { scroll-behavior: smooth; }
    header a.active { text-decoration: underline; font-weight: bold; }

    .gc-reveal { opacity: 0; transform: translateY(24px); transition: opacity .7s ease, transform .7s ease; }
    .gc-reveal.gc-visible { opacity: 1; transform: none; }

    .gc-gallery-img { cursor: zoom-in; transition: transform .25s ease; }
    .gc-gallery-img:hover { transform: scale(1.03); }

    .gc-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.88); display: none;
      align-items: center; justify-content: center; z-index: 9999; }
    .gc-lightbox.open { display: flex; }
    .gc-lightbox img { max-width: 85vw; max-height: 85vh; border-radius: 8px; }
    .gc-lightbox button { position: absolute; background: none; border: none; color: #fff;
      font-size: 2.5rem; cursor: pointer; padding: 10px 18px; }
    .gc-lightbox .gc-close { top: 10px; right: 15px; }
    .gc-lightbox .gc-prev { left: 10px; top: 50%; transform: translateY(-50%); }
    .gc-lightbox .gc-next { right: 10px; top: 50%; transform: translateY(-50%); }

    .gc-status { font-weight: bold; margin: 8px 0; }
    .gc-status.open { color: #2e7d32; }
    .gc-status.closed { color: #c62828; }

    .gc-estimator { margin: 15px 0; padding: 15px; border: 2px solid #d4a017;
      border-radius: 10px; max-width: 420px; }
    .gc-estimator select, .gc-estimator input { padding: 6px; margin: 6px 0; width: 100%; box-sizing: border-box; }
    .gc-estimator .gc-result { margin-top: 8px; font-weight: bold; }

    .gc-top { position: fixed; bottom: 20px; right: 20px; width: 46px; height: 46px;
      border-radius: 50%; border: none; background: #d4a017; color: #fff; font-size: 1.4rem;
      cursor: pointer; display: none; z-index: 999; box-shadow: 0 2px 8px rgba(0,0,0,.3); }
    .gc-top.show { display: block; }
  `;
  document.head.appendChild(style);
}

/* ---------- Navigation ---------- */

// The "Contact" link points to services.html in the HTML.
// Since the contact details are on this page, scroll to them instead.
function fixContactLink() {
  const contactHeading = findHeading("Contact");
  if (!contactHeading) return;
  contactHeading.id = "contact";

  document.querySelectorAll("header a").forEach((link) => {
    if (link.textContent.trim().toLowerCase() === "contact") {
      link.setAttribute("href", "#contact");
      link.addEventListener("click", (e) => {
        e.preventDefault();
        contactHeading.scrollIntoView({ behavior: "smooth" });
      });
    }
  });
}

// Mark the link of the page the visitor is on
function highlightActiveNav() {
  const current = location.pathname.split("/").pop() || "home.html";
  document.querySelectorAll("header a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === current) link.classList.add("active");
  });
}

/* ---------- Images ---------- */

// Add alt text (from file names) and lazy loading
function addImageAccessibility() {
  document.querySelectorAll("img").forEach((img, i) => {
    if (!img.alt) {
      if (i === 0) {
        img.alt = "Golden Crumbs logo";
      } else {
        const name = img.src.split("/").pop().replace(/\.[^.]+$/, "");
        const readable = name
          .replace(/-?\d+x\d+$/i, "")
          .replace(/-e\d+$/i, "")
          .replace(/[-_]\d*$/g, "")
          .replace(/[-_]/g, " ")
          .trim();
        img.alt = readable ? `${readable} cookie` : "Golden Crumbs product";
      }
    }
    if (i > 1) img.loading = "lazy";
  });
}

// Click a gallery image to view it larger, with next/previous
function setupGalleryLightbox() {
  const heading = findHeading("Gallery");
  if (!heading) return;

  const images = [];
  let node = heading.nextElementSibling;
  while (node && node.tagName !== "H1") {
    if (node.tagName === "IMG") images.push(node);
    node = node.nextElementSibling;
  }
  if (!images.length) return;

  const box = document.createElement("div");
  box.className = "gc-lightbox";
  box.innerHTML = `
    <button class="gc-close" aria-label="Close">&times;</button>
    <button class="gc-prev" aria-label="Previous">&#8249;</button>
    <img alt="">
    <button class="gc-next" aria-label="Next">&#8250;</button>`;
  document.body.appendChild(box);

  const bigImg = box.querySelector("img");
  let index = 0;

  const show = (i) => {
    index = (i + images.length) % images.length;
    bigImg.src = images[index].src;
    bigImg.alt = images[index].alt;
  };
  const open = (i) => { show(i); box.classList.add("open"); };
  const close = () => box.classList.remove("open");

  images.forEach((img, i) => {
    img.classList.add("gc-gallery-img");
    img.addEventListener("click", () => open(i));
  });

  box.querySelector(".gc-close").addEventListener("click", close);
  box.querySelector(".gc-prev").addEventListener("click", () => show(index - 1));
  box.querySelector(".gc-next").addEventListener("click", () => show(index + 1));
  box.addEventListener("click", (e) => { if (e.target === box) close(); });

  document.addEventListener("keydown", (e) => {
    if (!box.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });
}

/* ---------- Operating hours: "Open now / Closed" ---------- */

function setupOpenStatus() {
  const heading = findHeading("Operating Hours");
  if (!heading) return;
  const list = heading.nextElementSibling;
  if (!list) return;

  const OPEN_HOUR = 7;   // 07:00
  const CLOSE_HOUR = 17; // 17:00

  const status = document.createElement("p");
  status.className = "gc-status";
  list.insertAdjacentElement("afterend", status);

  function update() {
    // Use South African time regardless of the visitor's location
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Johannesburg",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const hour = Number(parts.find((p) => p.type === "hour").value) % 24;
    const minute = Number(parts.find((p) => p.type === "minute").value);
    const minutes = hour * 60 + minute;

    const isOpen = minutes >= OPEN_HOUR * 60 && minutes < CLOSE_HOUR * 60;
    status.className = "gc-status " + (isOpen ? "open" : "closed");
    status.textContent = isOpen
      ? "We're open now! Closing at 17:00."
      : "We're currently closed. We open daily at 07:00.";
  }

  update();
  setInterval(update, 60 * 1000);
}

/* ---------- Prices: order estimator ---------- */

function setupPriceEstimator() {
  const heading = findHeading("Prices");
  if (!heading) return;
  const list = heading.nextElementSibling;
  if (!list || list.tagName !== "UL") return;

  // Read each line: "6 cookies | Small Treat Box | R60–R90"
  const packs = Array.from(list.querySelectorAll("li"))
    .map((li) => {
      const parts = li.textContent.split("|").map((s) => s.trim());
      if (parts.length < 3) return null;
      const cookies = parseInt(parts[0], 10);
      const nums = parts[2].replace(/,/g, "").match(/\d+/g);
      if (!cookies || !nums) return null;
      return {
        cookies,
        name: parts[1],
        min: Number(nums[0]),
        max: Number(nums[nums.length - 1]),
      };
    })
    .filter(Boolean);
  if (!packs.length) return;

  const box = document.createElement("div");
  box.className = "gc-estimator";
  box.innerHTML = `
    <h3>Estimate your order</h3>
    <label>Choose a box
      <select>${packs
        .map((p, i) => `<option value="${i}">${p.name} (${p.cookies} cookies)</option>`)
        .join("")}</select>
    </label>
    <label>How many boxes?
      <input type="number" min="1" max="50" value="1">
    </label>
    <div class="gc-result"></div>`;
  list.insertAdjacentElement("afterend", box);

  const select = box.querySelector("select");
  const qty = box.querySelector("input");
  const result = box.querySelector(".gc-result");
  const rand = (n) => "R" + n.toLocaleString("en-ZA");

  function calc() {
    const pack = packs[Number(select.value)];
    let q = parseInt(qty.value, 10);
    if (!q || q < 1) q = 1;
    if (q > 50) q = 50;
    const cookies = pack.cookies * q;
    const min = pack.min * q;
    const max = pack.max * q;
    result.textContent =
      `${q} x ${pack.name}: ${cookies} cookies, estimated ` +
      (min === max ? rand(min) : `${rand(min)} - ${rand(max)}`) +
      ". Contact us to confirm your final price.";
  }

  select.addEventListener("change", calc);
  qty.addEventListener("input", calc);
  calc();
}

/* ---------- Contact: tap to call / email ---------- */

function makeContactClickable() {
  const heading = findHeading("Contact");
  if (!heading) return;

  let node = heading.nextElementSibling;
  while (node && node.tagName !== "H1") {
    if (node.tagName === "H3") {
      const text = node.textContent;
      const email = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
      const phone = text.match(/0\d{9}/);
      const label = text.split(/[-:]/)[0];

      if (email) {
        node.innerHTML = `${label}- <a href="mailto:${email[0]}">${email[0]}</a>`;
      } else if (phone) {
        const display = phone[0].replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
        node.innerHTML = `${label}- <a href="tel:+27${phone[0].slice(1)}">${display}</a>`;
      }
    }
    node = node.nextElementSibling;
  }
}

/* ---------- Scroll effects ---------- */

// Fade each section in as it enters the screen
function setupScrollReveal() {
  const headings = document.querySelectorAll("main h1");
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("gc-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  headings.forEach((h) => {
    h.classList.add("gc-reveal");
    observer.observe(h);
  });
}

// Back-to-top button
function setupBackToTop() {
  const btn = document.createElement("button");
  btn.className = "gc-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = "&uarr;";
  document.body.appendChild(btn);

  window.addEventListener("scroll", () => {
    btn.classList.toggle("show", window.scrollY > 400);
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}