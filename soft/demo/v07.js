const root = document.documentElement;
const themeToggle = document.querySelector('#themeToggle');
const storedTheme = localStorage.getItem('nbs-theme');
root.dataset.theme = storedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
updateThemeLabel();

// Normalize semantics for progressively enhanced demo widgets before QA scans run.
document.querySelector('#commandResults')?.setAttribute('aria-label', 'NeoLicenser destinations');
document.querySelector('.v07-chart[role="img"]')?.setAttribute('role', 'group');

themeToggle?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('nbs-theme', root.dataset.theme);
  updateThemeLabel();
});
function updateThemeLabel() { if (themeToggle) themeToggle.textContent = root.dataset.theme === 'dark' ? 'Light mode' : 'Dark mode'; }

const viewMeta = {
  overview: ['Overview', 'Licensing operations · September 8, 2026', '+ New product'],
  licenses: ['Licenses', 'Search, inspect, and manage entitlement', '+ Create license'],
  releases: ['Releases', 'Artifacts, scheduling, and rollout', '+ New release'],
  integrations: ['Integrations', 'Commerce, storage, source, and delivery', '+ Connect service'],
  agents: ['Agents', 'Scoped plans, approvals, and audit events', '+ New agent']
};
const viewButtons = [...document.querySelectorAll('[data-view]')];
const panels = [...document.querySelectorAll('[data-panel]')];
const pageTitle = document.querySelector('#pageTitle');
const pageSubtitle = document.querySelector('#pageSubtitle');
const primaryAction = document.querySelector('#primaryAction');

function switchView(name, { focus = false } = {}) {
  const meta = viewMeta[name];
  if (!meta) return;
  for (const button of viewButtons) button.classList.toggle('is-active', button.dataset.view === name);
  for (const panel of panels) {
    const active = panel.dataset.panel === name;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  }
  pageTitle.textContent = meta[0];
  pageSubtitle.textContent = meta[1];
  primaryAction.textContent = meta[2];
  history.replaceState(null, '', `#${name}`);
  closeMobileNav();
  if (focus) panels.find((panel) => panel.dataset.panel === name)?.querySelector('h2')?.focus?.({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
viewButtons.forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
document.querySelectorAll('[data-jump]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.jump)));
const initialView = location.hash.replace('#', '');
if (viewMeta[initialView]) switchView(initialView);

const sidebar = document.querySelector('#sidebar');
const mobileBackdrop = document.querySelector('#mobileBackdrop');
document.querySelector('#mobileNav')?.addEventListener('click', () => {
  const open = sidebar.dataset.open !== 'true';
  sidebar.dataset.open = String(open);
  mobileBackdrop.hidden = !open;
});
mobileBackdrop?.addEventListener('click', closeMobileNav);
function closeMobileNav() { sidebar.dataset.open = 'false'; mobileBackdrop.hidden = true; }

for (const segmented of document.querySelectorAll('.nbs-segmented')) {
  segmented.addEventListener('click', (event) => {
    const item = event.target.closest('.nbs-segmented__item');
    if (!item) return;
    for (const button of segmented.querySelectorAll('.nbs-segmented__item')) {
      const selected = button === item;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
  });
}

const licenseSearch = document.querySelector('#licenseSearch');
const licenseSegments = document.querySelector('#licenseSegments');
const licenseCards = [...document.querySelectorAll('[data-license]')];
const noResults = document.querySelector('#noLicenseResults');
let licenseFilter = 'all';
licenseSearch?.addEventListener('input', filterLicenses);
licenseSegments?.addEventListener('click', (event) => {
  const item = event.target.closest('[data-filter]');
  if (!item) return;
  licenseFilter = item.dataset.filter;
  filterLicenses();
});
function filterLicenses() {
  const query = (licenseSearch?.value || '').trim().toLowerCase();
  let visible = 0;
  for (const card of licenseCards) {
    const haystack = `${card.dataset.license} ${card.textContent}`.toLowerCase();
    const matchQuery = !query || haystack.includes(query);
    const matchFilter = licenseFilter === 'all' || haystack.includes(licenseFilter);
    const show = matchQuery && matchFilter;
    card.hidden = !show;
    if (show) visible += 1;
  }
  noResults.hidden = visible !== 0;
}

const toastRegion = document.querySelector('#toastRegion');
function showToast(title, copy) {
  const toast = document.createElement('div');
  toast.className = 'nbs-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<span class="nbs-toast__icon" aria-hidden="true">✓</span><div><p class="nbs-toast__title">${title}</p><p class="nbs-toast__copy">${copy}</p></div><button class="nbs-button nbs-button--icon nbs-button--quiet" type="button" aria-label="Dismiss notification">×</button>`;
  toast.querySelector('button').addEventListener('click', () => toast.remove());
  toastRegion?.append(toast);
  setTimeout(() => toast.remove(), matchMedia('(prefers-reduced-motion: reduce)').matches ? 1000 : 4200);
}

const rolloutProgress = document.querySelector('#rolloutProgress');
const rolloutLabel = document.querySelector('#rolloutLabel');
const rolloutBadge = document.querySelector('#rolloutBadge');
document.querySelectorAll('[data-rollout]').forEach((button) => button.addEventListener('click', () => {
  const value = Number(button.dataset.rollout);
  rolloutProgress.style.setProperty('--nbs-progress-value', `${value}%`);
  rolloutProgress.setAttribute('aria-valuenow', String(value));
  rolloutLabel.textContent = value === 0 ? 'Rollout paused' : `${value}% of eligible installs`;
  rolloutBadge.textContent = value === 0 ? 'Paused' : `${value}% rollout`;
  rolloutBadge.className = `nbs-badge ${value === 0 ? 'nbs-badge--danger' : value === 100 ? 'nbs-badge--success' : 'nbs-badge--warning'}`;
  showToast(value === 0 ? 'Rollout paused' : `Promoted to ${value}%`, value === 0 ? 'No new installs will receive 2.8.0.' : 'Health signals remain visible before the next promotion.');
}));

const publishTime = document.querySelector('#publishTime');
const timezone = document.querySelector('#timezone');
const schedulePreview = document.querySelector('#schedulePreview');
[publishTime, timezone].forEach((control) => control?.addEventListener('change', updateSchedule));
function updateSchedule() {
  const date = publishTime?.value ? new Date(`${publishTime.value}:00`) : null;
  if (!date || Number.isNaN(date.valueOf())) return;
  const tz = timezone.value;
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz, timeZoneName: 'short' });
  schedulePreview.textContent = formatter.format(date);
}

async function copyText(value, button, successLabel = 'Copied ✓') {
  try { await navigator.clipboard.writeText(value); }
  catch { return; }
  const previous = button.textContent;
  button.textContent = successLabel;
  showToast('Copied', value);
  setTimeout(() => { button.textContent = previous; }, 1200);
}
document.querySelector('#copyArtifact')?.addEventListener('click', (event) => copyText('r2://releases/imageforge/2.8.0.zip', event.currentTarget));
document.querySelector('#copySecret')?.addEventListener('click', (event) => copyText('secret://r2/production', event.currentTarget));

const approveAgent = document.querySelector('#approveAgent');
const agentStatus = document.querySelector('#agentPlanStatus');
approveAgent?.addEventListener('click', async () => {
  approveAgent.disabled = true;
  const steps = ['Applying R2 provider…', 'Updating activation limit…', 'Removing legacy webhook…', 'Verifying configuration…'];
  for (const step of steps) { agentStatus.textContent = step; await delay(280); }
  agentStatus.textContent = '3 changes applied · verified · audit event written';
  approveAgent.textContent = 'Applied ✓';
  showToast('Agent plan applied', '3 changes verified successfully.');
});
function delay(ms) { return new Promise((resolve) => setTimeout(resolve, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms)); }

let lastFocus = null;
const revokeOverlay = document.querySelector('#revokeOverlay');
const revokeConfirm = document.querySelector('#revokeConfirm');
const confirmRevoke = document.querySelector('#confirmRevoke');
document.querySelectorAll('[data-revoke]').forEach((button) => button.addEventListener('click', () => {
  lastFocus = button;
  document.querySelector('#revokeKey').textContent = button.dataset.revoke;
  revokeConfirm.value = '';
  confirmRevoke.disabled = true;
  revokeOverlay.hidden = false;
  revokeConfirm.focus();
}));
revokeConfirm?.addEventListener('input', () => { confirmRevoke.disabled = revokeConfirm.value.trim() !== 'REVOKE'; });
document.querySelectorAll('[data-close-revoke]').forEach((button) => button.addEventListener('click', closeRevoke));
function closeRevoke() { revokeOverlay.hidden = true; lastFocus?.focus(); }
confirmRevoke?.addEventListener('click', () => {
  confirmRevoke.disabled = true;
  confirmRevoke.textContent = 'Revoked';
  showToast('License revoked', 'Future update entitlement removed; production runtime remains unchanged.');
  setTimeout(closeRevoke, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 550);
});

const commandOverlay = document.querySelector('#commandOverlay');
const commandInput = document.querySelector('#commandInput');
const commandButtons = [...document.querySelectorAll('[data-command]')];
let commandIndex = 0;
function openCommand() {
  lastFocus = document.activeElement;
  commandOverlay.hidden = false;
  commandInput.value = '';
  filterCommands('');
  commandInput.focus();
}
function closeCommand() { commandOverlay.hidden = true; lastFocus?.focus(); }
function visibleCommands() { return commandButtons.filter((button) => !button.hidden); }
function selectCommand(index) {
  const visible = visibleCommands();
  if (!visible.length) return;
  commandIndex = Math.max(0, Math.min(index, visible.length - 1));
  for (const button of commandButtons) button.setAttribute('aria-selected', String(button === visible[commandIndex]));
}
function filterCommands(value) {
  const query = value.trim().toLowerCase();
  for (const button of commandButtons) button.hidden = query && !button.textContent.toLowerCase().includes(query);
  commandIndex = 0;
  selectCommand(0);
}
function chooseCommand(button) { closeCommand(); switchView(button.dataset.command); }
document.querySelector('#quickSearch')?.addEventListener('click', openCommand);
commandInput?.addEventListener('input', () => filterCommands(commandInput.value));
commandInput?.addEventListener('keydown', (event) => {
  const visible = visibleCommands();
  if (event.key === 'ArrowDown') { event.preventDefault(); selectCommand((commandIndex + 1) % Math.max(visible.length, 1)); }
  if (event.key === 'ArrowUp') { event.preventDefault(); selectCommand((commandIndex - 1 + visible.length) % Math.max(visible.length, 1)); }
  if (event.key === 'Enter' && visible[commandIndex]) { event.preventDefault(); chooseCommand(visible[commandIndex]); }
});
commandButtons.forEach((button) => button.addEventListener('click', () => chooseCommand(button)));

function trapFocus(container, event) {
  if (event.key !== 'Tab') return;
  const nodes = [...container.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')].filter((node) => !node.hidden);
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
commandOverlay?.addEventListener('keydown', (event) => trapFocus(commandOverlay, event));
revokeOverlay?.addEventListener('keydown', (event) => trapFocus(revokeOverlay, event));

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openCommand(); return; }
  if (event.key !== 'Escape') return;
  if (!commandOverlay.hidden) closeCommand();
  else if (!revokeOverlay.hidden) closeRevoke();
  else closeMobileNav();
});

primaryAction?.addEventListener('click', () => showToast(viewMeta[location.hash.replace('#','') || 'overview']?.[2].replace('+ ', '') || 'Action', 'This v0.7 lab keeps the action local to demonstrate feedback without mutating production data.'));
