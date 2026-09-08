const root = document.documentElement;
const themeToggle = document.querySelector('#themeToggle');
const preferredTheme = localStorage.getItem('nbs-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
root.dataset.theme = preferredTheme;
updateThemeLabel();

// Keep demo semantics valid even when the examples are progressively enhanced by JS.
const demoProgress = document.querySelector('.nbs-progress[role="progressbar"]');
demoProgress?.setAttribute('aria-label', 'Release verification progress');

const dataMeter = document.querySelector('.cx-chart .cx-meter');
if (dataMeter && !dataMeter.hasAttribute('role')) {
  dataMeter.setAttribute('role', 'meter');
  dataMeter.setAttribute('aria-label', 'Seat usage');
  dataMeter.setAttribute('aria-valuemin', '0');
  dataMeter.setAttribute('aria-valuemax', '10');
  dataMeter.setAttribute('aria-valuenow', '8');
}

document.querySelector('.cx-bars[role="img"]')?.setAttribute('role', 'group');

const tableScroller = document.querySelector('.cx-table-wrap');
if (tableScroller) {
  tableScroller.tabIndex = 0;
  tableScroller.setAttribute('role', 'region');
  tableScroller.setAttribute('aria-label', 'Advanced table; horizontally scrollable on narrow screens');
}

themeToggle?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('nbs-theme', root.dataset.theme);
  updateThemeLabel();
});

function updateThemeLabel() {
  if (themeToggle) themeToggle.textContent = root.dataset.theme === 'dark' ? 'Light mode' : 'Dark mode';
}

const search = document.querySelector('#componentSearch');
const sections = [...document.querySelectorAll('.cx-section')];
search?.addEventListener('input', () => filterSections(search.value));

function filterSections(value) {
  const query = value.trim().toLowerCase();
  for (const section of sections) {
    const haystack = `${section.dataset.search || ''} ${section.textContent}`.toLowerCase();
    section.hidden = query.length > 0 && !haystack.includes(query);
  }
}

const navLinks = [...document.querySelectorAll('.cx-nav a')];
const observer = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  for (const link of navLinks) link.classList.toggle('is-current', link.getAttribute('href') === `#${visible.target.id}`);
}, { rootMargin: '-20% 0px -68% 0px', threshold: [0, .2, .6] });
for (const section of sections) observer.observe(section);

const tabs = [...document.querySelectorAll('[role="tab"]')];
for (const tab of tabs) {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    const group = tabs.filter((item) => item.parentElement === tab.parentElement);
    const index = group.indexOf(tab);
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % group.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + group.length) % group.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = group.length - 1;
    group[next].focus();
    activateTab(group[next]);
  });
}

function activateTab(tab) {
  const group = tabs.filter((item) => item.parentElement === tab.parentElement);
  for (const item of group) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(item.getAttribute('aria-controls'));
    if (panel) panel.hidden = !selected;
  }
}

for (const group of document.querySelectorAll('.nbs-segmented')) {
  group.addEventListener('click', (event) => {
    const button = event.target.closest('.nbs-segmented__item');
    if (!button) return;
    for (const item of group.querySelectorAll('.nbs-segmented__item')) {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    }
  });
}

const toastRegion = document.querySelector('#toastRegion');
document.querySelector('#toastButton')?.addEventListener('click', () => showToast('Release verified', 'Checksum and signature both match.'));

function showToast(title, copy) {
  const toast = document.createElement('div');
  toast.className = 'nbs-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<span class="nbs-toast__icon" aria-hidden="true">✓</span><div><p class="nbs-toast__title">${title}</p><p class="nbs-toast__copy">${copy}</p></div><button class="nbs-button nbs-button--icon nbs-button--quiet" type="button" aria-label="Dismiss notification">×</button>`;
  toast.querySelector('button').addEventListener('click', () => toast.remove());
  toastRegion?.append(toast);
  const timeout = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1000 : 4200;
  setTimeout(() => toast.remove(), timeout);
}

let lastFocus = null;
const dialogOverlay = document.querySelector('#dialogOverlay');
const drawer = document.querySelector('#drawer');
const drawerBackdrop = document.querySelector('#drawerBackdrop');
const commandOverlay = document.querySelector('#commandOverlay');

function openDialog() {
  lastFocus = document.activeElement;
  dialogOverlay.hidden = false;
  document.querySelector('#dialogFocus')?.focus();
}
function closeDialog() {
  dialogOverlay.hidden = true;
  lastFocus?.focus();
}
function openDrawer() {
  lastFocus = document.activeElement;
  drawerBackdrop.hidden = false;
  drawer.hidden = false;
  drawer.querySelector('input,button')?.focus();
}
function closeDrawer() {
  drawer.hidden = true;
  drawerBackdrop.hidden = true;
  lastFocus?.focus();
}

document.querySelector('#dialogButton')?.addEventListener('click', openDialog);
document.querySelector('#drawerButton')?.addEventListener('click', openDrawer);
drawerBackdrop?.addEventListener('click', closeDrawer);
document.querySelectorAll('[data-close="dialog"]').forEach((button) => button.addEventListener('click', closeDialog));
document.querySelectorAll('[data-close="drawer"]').forEach((button) => button.addEventListener('click', closeDrawer));

function trapFocus(container, event) {
  if (event.key !== 'Tab') return;
  const focusables = [...container.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')].filter((node) => !node.hidden);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

dialogOverlay?.addEventListener('keydown', (event) => trapFocus(dialogOverlay, event));
drawer?.addEventListener('keydown', (event) => trapFocus(drawer, event));
commandOverlay?.addEventListener('keydown', (event) => trapFocus(commandOverlay, event));

const commandInput = document.querySelector('#commandInput');
const commandResults = document.querySelector('#commandResults');
const commandButtons = [...commandResults.querySelectorAll('[role="option"]')];
let commandIndex = 0;

function openCommand() {
  lastFocus = document.activeElement;
  commandOverlay.hidden = false;
  commandInput.value = '';
  commandIndex = 0;
  filterCommand('');
  selectCommand(0);
  commandInput.focus();
}
function closeCommand() {
  commandOverlay.hidden = true;
  lastFocus?.focus();
}
function visibleCommandButtons() { return commandButtons.filter((button) => !button.hidden); }
function selectCommand(index) {
  const visible = visibleCommandButtons();
  if (!visible.length) return;
  commandIndex = Math.max(0, Math.min(index, visible.length - 1));
  for (const button of commandButtons) button.setAttribute('aria-selected', String(button === visible[commandIndex]));
}
function filterCommand(value) {
  const query = value.trim().toLowerCase();
  for (const button of commandButtons) button.hidden = query && !button.textContent.toLowerCase().includes(query);
  commandIndex = 0;
  selectCommand(0);
}
function chooseCommand(button) {
  const target = document.getElementById(button.dataset.target);
  closeCommand();
  target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  target?.querySelector('button,input,a[href]')?.focus({ preventScroll: true });
}

document.querySelector('#openCommand')?.addEventListener('click', openCommand);
document.querySelector('#commandDemo')?.addEventListener('click', openCommand);
commandInput?.addEventListener('input', () => filterCommand(commandInput.value));
commandInput?.addEventListener('keydown', (event) => {
  const visible = visibleCommandButtons();
  if (event.key === 'ArrowDown') { event.preventDefault(); selectCommand((commandIndex + 1) % Math.max(visible.length, 1)); }
  if (event.key === 'ArrowUp') { event.preventDefault(); selectCommand((commandIndex - 1 + visible.length) % Math.max(visible.length, 1)); }
  if (event.key === 'Enter' && visible[commandIndex]) { event.preventDefault(); chooseCommand(visible[commandIndex]); }
});
commandButtons.forEach((button) => button.addEventListener('click', () => chooseCommand(button)));

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openCommand(); return; }
  if (event.key !== 'Escape') return;
  if (!commandOverlay.hidden) closeCommand();
  else if (!dialogOverlay.hidden) closeDialog();
  else if (!drawer.hidden) closeDrawer();
});

const dropZone = document.querySelector('#dropZone');
const fileInput = document.querySelector('#fileInput');
['dragenter', 'dragover'].forEach((name) => dropZone?.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
['dragleave', 'drop'].forEach((name) => dropZone?.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
dropZone?.addEventListener('drop', (event) => handleFile(event.dataTransfer.files[0]));
fileInput?.addEventListener('change', () => handleFile(fileInput.files[0]));
function handleFile(file) {
  if (!file) return;
  const valid = file.name.toLowerCase().endsWith('.zip');
  document.querySelector('#dropTitle').textContent = valid ? file.name : 'Choose a ZIP package';
  document.querySelector('#dropCopy').textContent = valid ? `${formatBytes(file.size)} · ready for verification` : 'Only .zip release packages are accepted';
  if (valid) showToast('Package received', `${file.name} is ready for verification.`);
}
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

document.querySelector('#retryWebhook')?.addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const status = document.querySelector('#retryStatus');
  button.disabled = true;
  status.textContent = 'Retrying delivery…';
  await delay(420);
  status.textContent = 'Recovered · HTTP 200 · 241ms · original failure preserved';
  button.textContent = 'Retry successful ✓';
});

document.querySelector('#agentExecute')?.addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const status = document.querySelector('#agentStatus');
  button.disabled = true;
  status.textContent = 'Applying 1 of 3 · R2 delivery…';
  await delay(260);
  status.textContent = 'Applying 2 of 3 · activation limit…';
  await delay(260);
  status.textContent = 'Applying 3 of 3 · legacy webhook…';
  await delay(260);
  status.textContent = '3 changes applied and verified · audit event created';
  button.textContent = 'Applied ✓';
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));
}

const revokeInput = document.querySelector('#revokeInput');
const revokeButton = document.querySelector('#revokeButton');
revokeInput?.addEventListener('input', () => { revokeButton.disabled = revokeInput.value.trim() !== 'REVOKE'; });
revokeButton?.addEventListener('click', () => {
  revokeButton.textContent = 'Revoked';
  revokeButton.disabled = true;
  revokeInput.disabled = true;
  showToast('License revoked', 'Future update entitlement has been removed.');
});
