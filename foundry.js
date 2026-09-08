const root = document.documentElement;
const themeToggle = document.querySelector('#themeToggle');
const themeIcon = document.querySelector('#themeIcon');
const depthControl = document.querySelector('#depthControl');
const depthValue = document.querySelector('#depthValue');
const depthDemo = document.querySelector('#depthDemo');
const year = document.querySelector('#year');

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

if (year) year.textContent = new Date().getFullYear();
