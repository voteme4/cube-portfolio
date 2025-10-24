// js/carousel.js
'use strict';

// Update year
document.getElementById('year').textContent = new Date().getFullYear();

// Panel navigation (sidebar dots)
const panels = document.querySelectorAll('.panel');
const dots = document.querySelectorAll('.nav-dot');

// Update active dot based on scroll position
const observerOptions = { root: null, threshold: 0.7 };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const panelId = entry.target.id;
      updateActiveDot(panelId);
    }
  });
}, observerOptions);
panels.forEach(panel => observer.observe(panel));

function updateActiveDot(panelId) {
  dots.forEach(dot => dot.classList.toggle('active', dot.dataset.panel === panelId));
}

// Smooth scroll to panel when clicking sidebar dots
dots.forEach(dot => {
  dot.addEventListener('click', () => {
    const targetId = dot.dataset.panel;
    document.getElementById(targetId).scrollIntoView({ behavior: 'smooth' });
  });
});

// Optional: Hide/show navigation dots based on scroll
let lastScrollY = window.scrollY;
const nav = document.querySelector('.panel-nav');
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const isScrollingDown = scrollY > lastScrollY;
  if (nav) nav.style.opacity = isScrollingDown ? '0.3' : '1';
  lastScrollY = scrollY;
});

// --- Carousel initialization for gallery panels (with dots) ---
document.querySelectorAll('.carousel').forEach(carousel => {
  const track = carousel.querySelector('.photo-grid');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.photo'));

  // Create dots container
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'carousel-dots';
  const dotButtons = slides.map((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dotsContainer.appendChild(b);
    return b;
  });
  carousel.appendChild(dotsContainer);

  // Helper: find index of slide closest to carousel center
  const getCenteredIndex = () => {
    const center = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDist = Infinity;
    slides.forEach((s, idx) => {
      const sCenter = s.offsetLeft + s.getBoundingClientRect().width / 2;
      const d = Math.abs(center - sCenter);
      if (d < closestDist) { closestDist = d; closestIndex = idx; }
    });
    return closestIndex;
  };

  // Scroll so slide at index i is centered
  const scrollToIndex = (i) => {
    if (i < 0) i = 0; if (i >= slides.length) i = slides.length - 1;
    const s = slides[i];
    const offset = s.offsetLeft - (track.clientWidth - s.clientWidth) / 2;
    track.scrollTo({ left: Math.round(offset), behavior: 'smooth' });
  };

  // Update dots to reflect centered slide
  const updateDots = () => {
    const idx = getCenteredIndex();
    dotButtons.forEach((b, i) => b.classList.toggle('active', i === idx));
  };

  // Wire up dots clicks — go directly to clicked slide
  dotButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => scrollToIndex(i));
  });

  // Lock to the closest slide after scrolling (no single-step restriction)
  let rafPending = false;
  let scrollTimeout = null;

  track.addEventListener('scroll', () => {
    // continuous updates for dots while scrolling
    if (!rafPending) {
      rafPending = true;
      window.requestAnimationFrame(() => {
        updateDots();
        rafPending = false;
      });
    }

    // debounce scroll end
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const target = getCenteredIndex();
      scrollToIndex(target);
      updateDots();
    }, 120);
  });

  // Keyboard support when focus inside carousel
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { const idx = getCenteredIndex(); scrollToIndex(idx + 1); }
    if (e.key === 'ArrowLeft') { const idx = getCenteredIndex(); scrollToIndex(idx - 1); }
  });

  // Initialize dots to reflect starting position
  updateDots();
});
