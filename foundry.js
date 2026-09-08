const root = document.documentElement;
const themeToggle = document.querySelector('#themeToggle');
const themeIcon = document.querySelector('#themeIcon');
const depthControl = document.querySelector('#depthControl');
const depthValue = document.querySelector('#depthValue');
const depthDemo = document.querySelector('#depthDemo');
const year = document.querySelector('#year');
const marquee = document.querySelector('.marquee');
const marqueeTrack = document.querySelector('.marquee-track');

// Load the small post-launch polish layer without disturbing the archived flavor CSS.
const polishHref = new URL('./foundry-polish.css', import.meta.url).href;
if (!document.querySelector(`link[href="${polishHref}"]`)) {
  const polish = document.createElement('link');
  polish.rel = 'stylesheet';
  polish.href = polishHref;
  document.head.append(polish);
}

const storedTheme = localStorage.getItem('nb-foundry-theme');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = storedTheme || (systemDark ? 'dark' : 'light');

function applyTheme(theme) {
  root.dataset.theme = theme;
  const dark = theme === 'dark';
  themeToggle?.setAttribute('aria-pressed', String(dark));
  themeToggle?.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  if (themeIcon) themeIcon.textContent = dark ? '☼' : '◐';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#171717' : '#f3efe5');
}

applyTheme(initialTheme);

themeToggle?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('nb-foundry-theme', next);
  applyTheme(next);
});

function updateDepth(value) {
  const depth = Number(value);
  depthDemo?.style.setProperty('--demo-depth', `${depth}px`);
  if (depthValue) depthValue.value = `${depth}px`;
}

if (depthControl) {
  updateDepth(depthControl.value);
  depthControl.addEventListener('input', (event) => updateDepth(event.currentTarget.value));
}

function setupMarquee() {
  if (!marquee || !marqueeTrack || marqueeTrack.dataset.ready === 'true') return;

  const originalNodes = [...marqueeTrack.children];
  if (!originalNodes.length) return;

  const group = document.createElement('div');
  group.className = 'marquee-group';
  originalNodes.forEach((node) => group.append(node));

  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');

  marqueeTrack.replaceChildren(group, clone);
  marqueeTrack.dataset.ready = 'true';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) marquee.classList.add('is-paused');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'marquee-toggle';

  const syncToggle = () => {
    const paused = marquee.classList.contains('is-paused');
    toggle.textContent = paused ? 'PLAY →' : 'PAUSE ‖';
    toggle.setAttribute('aria-label', paused ? 'Play moving foundry banner' : 'Pause moving foundry banner');
    toggle.setAttribute('aria-pressed', String(paused));
  };

  toggle.addEventListener('click', () => {
    marquee.classList.toggle('is-paused');
    syncToggle();
  });

  syncToggle();
  marquee.append(toggle);
}

function syncCommerceCard() {
  const card = document.querySelector('.system-commerce');
  if (!card) return;
  const status = card.querySelector('.status');
  const action = card.querySelector('.system-actions .button');
  if (status) {
    status.classList.remove('status-building');
    status.classList.add('status-live');
    status.textContent = 'LIVE · v0.2';
  }
  if (action) {
    action.href = './commerce/';
    action.innerHTML = 'Open Commerce <span aria-hidden="true">→</span>';
  }
}

setupMarquee();
syncCommerceCard();

if (year) year.textContent = new Date().getFullYear();
