const root = document.documentElement;
const themeToggle = document.querySelector('#themeToggle');
const toastStack = document.querySelector('#toastStack');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const savedTheme = localStorage.getItem('nbs-theme');
if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;

function syncThemeLabel() {
  themeToggle.textContent = root.dataset.theme === 'dark' ? 'Light mode' : 'Dark mode';
}
syncThemeLabel();
themeToggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('nbs-theme', root.dataset.theme);
  syncThemeLabel();
});

function toast(message) {
  const item = document.createElement('div');
  item.className = 'v03-toast';
  item.innerHTML = `<span class="v03-toast__mark" aria-hidden="true">✓</span><p>${message}</p><button type="button" aria-label="Dismiss notification">×</button>`;
  toastStack.append(item);
  const remove = () => item.remove();
  item.querySelector('button').addEventListener('click', remove);
  window.setTimeout(remove, 4200);
}

function focusables(container) {
  return [...container.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')].filter((el) => !el.closest('[hidden]'));
}

let restoreFocus = null;
function openOverlay(overlay, initial) {
  restoreFocus = document.activeElement;
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => (initial || focusables(overlay)[0])?.focus());
}
function closeOverlay(overlay) {
  overlay.hidden = true;
  document.body.style.overflow = '';
  restoreFocus?.focus?.();
  restoreFocus = null;
}
function trapTab(event, overlay) {
  if (event.key !== 'Tab') return;
  const items = focusables(overlay);
  if (!items.length) return;
  const first = items[0];
  const last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

// Command palette
const commandOverlay = document.querySelector('#commandOverlay');
const commandTrigger = document.querySelector('#commandTrigger');
const commandInput = document.querySelector('#commandInput');
const commandItems = [...document.querySelectorAll('.nbs-command__item')];
const commandEmpty = document.querySelector('#commandEmpty');
let commandIndex = 0;

function visibleCommands() { return commandItems.filter((item) => !item.hidden); }
function selectCommand(index) {
  const visible = visibleCommands();
  if (!visible.length) {
    commandItems.forEach((item) => item.setAttribute('aria-selected', 'false'));
    commandIndex = 0;
    return;
  }
  commandIndex = Math.max(0, Math.min(index, visible.length - 1));
  commandItems.forEach((item) => item.setAttribute('aria-selected', 'false'));
  visible[commandIndex].setAttribute('aria-selected', 'true');
  visible[commandIndex].scrollIntoView({ block: 'nearest' });
}
function filterCommands() {
  const query = commandInput.value.trim().toLowerCase();
  commandItems.forEach((item) => { item.hidden = !item.dataset.command.toLowerCase().includes(query); });
  commandEmpty.hidden = visibleCommands().length > 0;
  commandIndex = 0;
  selectCommand(0);
}
function runCommand(item) {
  if (!item) return;
  const label = item.dataset.command;
  closeOverlay(commandOverlay);
  toast(`${label} — command acknowledged.`);
}
function openCommand() {
  commandInput.value = '';
  filterCommands();
  openOverlay(commandOverlay, commandInput);
}
commandTrigger.addEventListener('click', openCommand);
commandInput.addEventListener('input', filterCommands);
commandInput.addEventListener('keydown', (event) => {
  const visible = visibleCommands();
  if (!visible.length) return;
  if (event.key === 'ArrowDown') { event.preventDefault(); selectCommand((commandIndex + 1) % visible.length); }
  if (event.key === 'ArrowUp') { event.preventDefault(); selectCommand((commandIndex - 1 + visible.length) % visible.length); }
  if (event.key === 'Enter') { event.preventDefault(); runCommand(visible[commandIndex]); }
});
commandItems.forEach((item) => {
  item.addEventListener('click', () => runCommand(item));
  item.addEventListener('mouseenter', () => {
    const visible = visibleCommands();
    const index = visible.indexOf(item);
    if (index >= 0) selectCommand(index);
  });
});
commandOverlay.addEventListener('click', (event) => { if (event.target === commandOverlay) closeOverlay(commandOverlay); });
commandOverlay.addEventListener('keydown', (event) => trapTab(event, commandOverlay));

// Filter chips and text filtering
const filterChips = [...document.querySelectorAll('.nbs-filter-chip')];
filterChips.forEach((chip) => chip.addEventListener('click', () => {
  chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') !== 'true' ? 'true' : 'false');
}));

const licenseSearch = document.querySelector('#licenseSearch');
const licenseRows = [...document.querySelectorAll('#licenseTable tbody tr')];
licenseSearch.addEventListener('input', () => {
  const query = licenseSearch.value.trim().toLowerCase();
  licenseRows.forEach((row) => { row.hidden = !row.dataset.search.includes(query); });
});

// Bulk selection
const selectAll = document.querySelector('#selectAll');
const rowChecks = [...document.querySelectorAll('.rowCheck')];
const bulkbar = document.querySelector('#bulkbar');
const selectedCount = document.querySelector('#selectedCount');

function syncSelection() {
  const checked = rowChecks.filter((input) => input.checked);
  rowChecks.forEach((input) => { input.closest('tr').dataset.selected = input.checked ? 'true' : 'false'; });
  selectedCount.textContent = String(checked.length);
  bulkbar.hidden = checked.length === 0;
  selectAll.checked = checked.length === rowChecks.length;
  selectAll.indeterminate = checked.length > 0 && checked.length < rowChecks.length;
}
rowChecks.forEach((input) => input.addEventListener('change', syncSelection));
selectAll.addEventListener('change', () => {
  rowChecks.filter((input) => !input.closest('tr').hidden).forEach((input) => { input.checked = selectAll.checked; });
  syncSelection();
});

// Destructive confirmation
const dangerOverlay = document.querySelector('#dangerOverlay');
const revokeSelected = document.querySelector('#revokeSelected');
const dangerCount = document.querySelector('#dangerCount');
const dangerPhrase = document.querySelector('#dangerPhrase');
const confirmDanger = document.querySelector('#confirmDanger');
const cancelDanger = document.querySelector('#cancelDanger');

revokeSelected.addEventListener('click', () => {
  const count = rowChecks.filter((input) => input.checked).length;
  dangerCount.textContent = `${count} ${count === 1 ? 'license' : 'licenses'}`;
  dangerPhrase.value = '';
  confirmDanger.disabled = true;
  openOverlay(dangerOverlay, dangerPhrase);
});
dangerPhrase.addEventListener('input', () => { confirmDanger.disabled = dangerPhrase.value !== 'REVOKE'; });
cancelDanger.addEventListener('click', () => closeOverlay(dangerOverlay));
dangerOverlay.addEventListener('click', (event) => { if (event.target === dangerOverlay) closeOverlay(dangerOverlay); });
dangerOverlay.addEventListener('keydown', (event) => trapTab(event, dangerOverlay));
confirmDanger.addEventListener('click', () => {
  const affected = rowChecks.filter((input) => input.checked);
  affected.forEach((input) => {
    const row = input.closest('tr');
    const statusCell = row.children[4];
    statusCell.innerHTML = '<span class="nbs-badge nbs-badge--danger">Revoked</span>';
    input.checked = false;
  });
  closeOverlay(dangerOverlay);
  syncSelection();
  toast(`${affected.length} ${affected.length === 1 ? 'license' : 'licenses'} revoked. Audit event created.`);
});

// Agent scopes
const scopeInputs = [...document.querySelectorAll('#scopeGrid input')];
const scopeCount = document.querySelector('#scopeCount');
function syncScopes() { scopeCount.textContent = String(scopeInputs.filter((input) => input.checked).length); }
scopeInputs.forEach((input) => input.addEventListener('change', syncScopes));
syncScopes();

// Agent changeset
const applyAgentDiff = document.querySelector('#applyAgentDiff');
applyAgentDiff.addEventListener('click', async () => {
  const original = applyAgentDiff.textContent;
  applyAgentDiff.disabled = true;
  const rows = [...document.querySelectorAll('.nbs-agent-diff__row')];
  const stepDelay = reduceMotion ? 0 : 260;
  const settleDelay = reduceMotion ? 0 : 220;
  applyAgentDiff.textContent = `Applying 0 / ${rows.length}…`;
  for (let i = 0; i < rows.length; i += 1) {
    if (stepDelay) await new Promise((resolve) => window.setTimeout(resolve, stepDelay));
    rows[i].style.opacity = '.58';
    rows[i].querySelector('.nbs-badge').textContent = 'Applied';
    applyAgentDiff.textContent = `Applying ${i + 1} / ${rows.length}…`;
  }
  if (settleDelay) await new Promise((resolve) => window.setTimeout(resolve, settleDelay));
  applyAgentDiff.textContent = 'Applied ✓';
  toast('Agent changes applied and verified.');
  window.setTimeout(() => {
    applyAgentDiff.disabled = false;
    applyAgentDiff.textContent = original;
    rows.forEach((row) => { row.style.opacity = ''; });
  }, reduceMotion ? 0 : 1800);
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openCommand(); }
  if (event.key === 'Escape') {
    if (!commandOverlay.hidden) closeOverlay(commandOverlay);
    if (!dangerOverlay.hidden) closeOverlay(dangerOverlay);
  }
});
