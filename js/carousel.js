// js/carousel.js
'use strict';

// Update year
document.getElementById('year').textContent = new Date().getFullYear();

// 3D Cube Navigation (vertical)
const cube = document.querySelector('.cube');
const faces = ['intro', 'projects', 'work', 'gallery'];
const dots = document.querySelectorAll('.nav-dot');
const cubeFaces = document.querySelectorAll('.cube-face');
let currentIndex = 0;
let lastAngle = 0;

function rotateCube(index) {
  // Always rotate the shortest direction
  let diff = index - currentIndex;
  // Handle wrap-around for shortest path
  if (diff > 2) diff -= 4;
  if (diff < -2) diff += 4;
  lastAngle += diff * -90;
  cube.style.transform = `rotateX(${lastAngle}deg)`;
  dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  cubeFaces.forEach((face, i) => face.classList.toggle('active', i === index));
  currentIndex = index;
}

// Dot navigation
dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    rotateCube(i);
  });
});

// Scroll navigation (wheel) - only rotate cube if not inside gallery carousel
window.addEventListener('wheel', (e) => {
  // If the event target is inside a .photo-grid, do not rotate cube
  let el = e.target;
  while (el) {
    if (el.classList && el.classList.contains('photo-grid')) return;
    el = el.parentElement;
  }
  // Reduce sensitivity: require a larger deltaY to trigger rotation
  const threshold = 60; // typical mouse wheel is ~100, trackpad is ~30
  if (Math.abs(e.deltaY) < threshold) return;
  // Debounce: only allow one rotation per wheel event
  if (window.cubeRotating) return;
  window.cubeRotating = true;
  let nextIndex;
  // Reverse scroll direction: scroll down goes to previous, up goes to next
  if (e.deltaY > 0) {
    nextIndex = (currentIndex - 1 + faces.length) % faces.length;
  } else {
    nextIndex = (currentIndex + 1) % faces.length;
  }
  rotateCube(nextIndex);
  setTimeout(() => { window.cubeRotating = false; }, 500); // matches cube transition
});

// Keyboard navigation
window.addEventListener('keydown', (e) => {
  let nextIndex = currentIndex;
  // Reverse arrow key direction: Down goes to previous, Up goes to next
  if (e.key === 'ArrowDown') {
    nextIndex = (currentIndex - 1 + faces.length) % faces.length;
    rotateCube(nextIndex);
  }
  if (e.key === 'ArrowUp') {
    nextIndex = (currentIndex + 1) % faces.length;
    rotateCube(nextIndex);
  }
});

// Initialize
rotateCube(0);

// --- Carousel initialization for gallery panels (with dots) ---

document.querySelectorAll('.carousel').forEach(carousel => {
  const track = carousel.querySelector('.photo-grid');
  if (!track) return;

  let slides = Array.from(track.querySelectorAll('.photo'));
  const slideCount = slides.length;

  // Clone first and last photo for infinite scroll
  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slideCount - 1].cloneNode(true);
  firstClone.classList.add('clone');
  lastClone.classList.add('clone');
  track.insertBefore(lastClone, slides[0]);
  track.appendChild(firstClone);

  slides = Array.from(track.querySelectorAll('.photo'));

  // Create dots container
  let dotsContainer = carousel.querySelector('.carousel-dots');
  if (!dotsContainer) {
    dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    carousel.appendChild(dotsContainer);
  }
  const dotButtons = Array.from({length: slideCount}, (_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dotsContainer.appendChild(b);
    return b;
  });

  // Helper: find index of slide closest to carousel center (excluding clones)
  const getCenteredIndex = () => {
    const center = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDist = Infinity;
    slides.forEach((s, idx) => {
      if (s.classList.contains('clone')) return;
      const sCenter = s.offsetLeft + s.getBoundingClientRect().width / 2;
      const d = Math.abs(center - sCenter);
      if (d < closestDist) { closestDist = d; closestIndex = idx - 1; }
    });
    // closestIndex is -1 for lastClone, 0 for first real, ...
    return Math.max(0, Math.min(slideCount - 1, closestIndex));
  };

  // Scroll so slide at index i is centered
  const scrollToIndex = (i) => {
    // i: 0..slideCount-1 (real slides)
    const s = slides[i + 1]; // +1 for clone at start
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

  // Standard carousel scroll logic (no infinite scroll)
  track.addEventListener('scroll', updateDots);

  // Keyboard support when focus inside carousel
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', (e) => {
    const idx = getCenteredIndex();
    if (e.key === 'ArrowRight') scrollToIndex((idx + 1) % slideCount);
    if (e.key === 'ArrowLeft') scrollToIndex((idx - 1 + slideCount) % slideCount);
  });

  // Initialize to first real slide
  scrollToIndex(0);
  updateDots();
});
