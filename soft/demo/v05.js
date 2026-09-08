const root = document.documentElement;
const themeToggle = document.querySelector('#themeToggle');
const savedTheme = localStorage.getItem('nbs-theme');
if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;

function syncTheme() {
  themeToggle.textContent = root.dataset.theme === 'dark' ? 'Light mode' : 'Dark mode';
}
syncTheme();
themeToggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('nbs-theme', root.dataset.theme);
  syncTheme();
});

const table = document.querySelector('#commercialTable');
const rows = [...table.tBodies[0].rows];
const viewButtons = [...document.querySelectorAll('.nbs-saved-view')];
const viewSummary = document.querySelector('#viewSummary');

function applyView(view) {
  let visible = 0;
  rows.forEach((row) => {
    const show = row.dataset.view.split(' ').includes(view);
    row.hidden = !show;
    if (show) visible += 1;
  });
  viewSummary.textContent = `${visible} ${visible === 1 ? 'license' : 'licenses'} visible`;
}

viewButtons.forEach((button) => button.addEventListener('click', () => {
  viewButtons.forEach((item) => item.setAttribute('aria-pressed', 'false'));
  button.setAttribute('aria-pressed', 'true');
  applyView(button.dataset.view);
}));

/* aria-sort belongs on the columnheader, not on the nested button. Normalize the
   existing demo markup immediately, then keep the header state synchronized. */
const sortButtons = [...document.querySelectorAll('.nbs-sort-button')];
sortButtons.forEach((button) => {
  const header = button.closest('th');
  const initialDirection = button.getAttribute('aria-sort') || header?.getAttribute('aria-sort') || 'none';
  button.removeAttribute('aria-sort');
  header?.setAttribute('aria-sort', initialDirection);
});

sortButtons.forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.sort;
  const header = button.closest('th');
  const direction = header?.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';

  sortButtons.forEach((item) => {
    item.closest('th')?.setAttribute('aria-sort', 'none');
    item.querySelector('.nbs-sort-button__mark').textContent = '↕';
  });

  header?.setAttribute('aria-sort', direction);
  button.querySelector('.nbs-sort-button__mark').textContent = direction === 'ascending' ? '↑' : '↓';
  const factor = direction === 'ascending' ? 1 : -1;
  const sorted = [...rows].sort((a, b) => String(a.dataset[key]).localeCompare(String(b.dataset[key])) * factor);
  sorted.forEach((row) => table.tBodies[0].append(row));
}));

const tableWrap = document.querySelector('#licenseTableWrap');
const densityButtons = [...document.querySelectorAll('[data-density]')];
densityButtons.forEach((button) => button.addEventListener('click', () => {
  densityButtons.forEach((item) => item.setAttribute('aria-pressed', 'false'));
  button.setAttribute('aria-pressed', 'true');
  tableWrap.dataset.nbsDensity = button.dataset.density;
}));

const columnsButton = document.querySelector('#columnsButton');
const columnMenu = document.querySelector('#columnMenu');
columnsButton.addEventListener('click', () => {
  const willOpen = columnMenu.hidden;
  columnMenu.hidden = !willOpen;
  columnsButton.setAttribute('aria-expanded', String(willOpen));
});

document.querySelectorAll('[data-column-toggle]').forEach((input) => input.addEventListener('change', () => {
  const name = input.dataset.columnToggle;
  document.querySelectorAll(`[data-column="${name}"]`).forEach((cell) => { cell.hidden = !input.checked; });
}));

const timezoneSelect = document.querySelector('#timezoneSelect');
const publishTime = document.querySelector('#publishTime');
const timezonePreview = document.querySelector('#timezonePreview');
const zoneLabels = {
  'Asia/Kolkata': 'IST',
  UTC: 'UTC',
  'America/Los_Angeles': 'PT',
  'Europe/London': 'BST'
};

function syncTimezonePreview() {
  if (!publishTime.value) return;
  const date = new Date(`${publishTime.value}:00`);
  const formatter = new Intl.DateTimeFormat('en', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: timezoneSelect.value
  });
  timezonePreview.textContent = `${formatter.format(date)} ${zoneLabels[timezoneSelect.value] || timezoneSelect.value}`;
}
timezoneSelect.addEventListener('change', syncTimezonePreview);
publishTime.addEventListener('change', syncTimezonePreview);
syncTimezonePreview();

const rolloutButtons = [...document.querySelectorAll('[data-rollout]')];
const rolloutFill = document.querySelector('#rolloutFill');
const rolloutLabel = document.querySelector('#rolloutLabel');
const rolloutTrack = document.querySelector('.nbs-rollout__track');

/* The visual rollout track is a real progress indicator, so expose progressbar
   semantics rather than placing aria-label on a generic div. */
rolloutTrack?.setAttribute('role', 'progressbar');
rolloutTrack?.setAttribute('aria-label', 'Release rollout');
rolloutTrack?.setAttribute('aria-valuemin', '0');
rolloutTrack?.setAttribute('aria-valuemax', '100');
rolloutTrack?.setAttribute('aria-valuenow', '25');
rolloutTrack?.setAttribute('aria-valuetext', '25% of eligible installs');

rolloutButtons.forEach((button) => button.addEventListener('click', () => {
  const value = Number(button.dataset.rollout);
  rolloutFill.style.setProperty('--nbs-rollout-value', `${value}%`);
  const copy = value === 0 ? 'Rollout paused' : `${value}% of eligible installs`;
  rolloutLabel.textContent = copy;
  rolloutTrack?.setAttribute('aria-valuenow', String(value));
  rolloutTrack?.setAttribute('aria-valuetext', copy);
  rolloutButtons.forEach((item) => { item.disabled = item === button; });
}));

const inspectorData = {
  failed: {
    meta: ['HTTP 500', 'Attempt 3', '682ms'],
    tone: 'danger',
    request: '{\n  "event": "payment.failed",\n  "license": "NL-IMG-••07",\n  "customer": "Pixel Harbor",\n  "amount": 1900,\n  "currency": "USD"\n}',
    response: '{\n  "error": "commerce_upstream_unavailable",\n  "retryable": true,\n  "request_id": "req_8J4K"\n}'
  },
  created: {
    meta: ['HTTP 200', 'Attempt 1', '142ms'],
    tone: 'success',
    request: '{\n  "event": "license.created",\n  "license": "NL-RVT-••92",\n  "product": "Rivet Pro"\n}',
    response: '{\n  "accepted": true,\n  "delivery_id": "wh_8921"\n}'
  },
  renewed: {
    meta: ['HTTP 200', 'Attempt 1', '118ms'],
    tone: 'success',
    request: '{\n  "event": "license.renewed",\n  "license": "NL-SFT-••18",\n  "term": "annual"\n}',
    response: '{\n  "accepted": true,\n  "delivery_id": "wh_8918"\n}'
  }
};

const inspectorItems = [...document.querySelectorAll('.nbs-inspector__item')];
const inspectorTabs = [...document.querySelectorAll('.nbs-inspector-tab')];
const inspectorMeta = document.querySelector('#inspectorMeta');
const inspectorCode = document.querySelector('#inspectorCode');
let currentEvent = 'failed';
let currentPanel = 'request';

function renderInspector() {
  const data = inspectorData[currentEvent];
  inspectorMeta.innerHTML = data.meta.map((value, index) => `<span class="nbs-badge ${index === 0 ? `nbs-badge--${data.tone}` : ''}">${value}</span>`).join('');
  inspectorCode.textContent = data[currentPanel];
}

inspectorItems.forEach((button) => button.addEventListener('click', () => {
  inspectorItems.forEach((item) => item.setAttribute('aria-current', 'false'));
  button.setAttribute('aria-current', 'true');
  currentEvent = button.dataset.event;
  renderInspector();
}));

inspectorTabs.forEach((button) => button.addEventListener('click', () => {
  inspectorTabs.forEach((item) => item.setAttribute('aria-selected', 'false'));
  button.setAttribute('aria-selected', 'true');
  currentPanel = button.dataset.panel;
  renderInspector();
}));

applyView('all');
