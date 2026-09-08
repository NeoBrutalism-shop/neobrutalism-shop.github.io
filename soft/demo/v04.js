const root = document.documentElement;
const themeToggle = document.querySelector('#themeToggle');
const toastRegion = document.querySelector('#toastRegion');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* v0.4 originally used labels as visual field containers around both an input and a button.
   Normalize those containers into groups before interaction/a11y tooling runs; inputs already
   carry explicit aria-labels, so no accessible name is lost. */
document.querySelectorAll('label.nbs-date-field').forEach((field) => {
  const group = document.createElement('div');
  group.className = field.className;
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', field.querySelector('.nbs-label')?.textContent?.trim() || 'Date field');
  while (field.firstChild) group.append(field.firstChild);
  field.replaceWith(group);
});

/* Segmented meters were visually complete but exposed aria-label on generic divs.
   Upgrade them to real meters before assistive technology reads the page. */
const meterNumberWords = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

function meterNumber(token) {
  const numeric = Number(token);
  if (Number.isFinite(numeric)) return numeric;
  return meterNumberWords[String(token).toLowerCase()];
}

function upgradeMeter(meter) {
  const originalLabel = meter.getAttribute('aria-label')?.trim();
  if (!originalLabel) return;

  let name = originalLabel;
  let now;
  let max;

  const percentMatch = originalLabel.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s+percent$/i);
  const ratioMatch = originalLabel.match(/^(\w+)\s+of\s+(\w+)\s+(.+)$/i);

  if (percentMatch) {
    name = percentMatch[1];
    now = Number(percentMatch[2]);
    max = 100;
  } else if (ratioMatch) {
    now = meterNumber(ratioMatch[1]);
    max = meterNumber(ratioMatch[2]);
    name = ratioMatch[3];
  }

  if (!Number.isFinite(now) || !Number.isFinite(max) || max <= 0) {
    meter.setAttribute('role', 'img');
    return;
  }

  meter.setAttribute('role', 'meter');
  meter.setAttribute('aria-label', name);
  meter.setAttribute('aria-valuemin', '0');
  meter.setAttribute('aria-valuemax', String(max));
  meter.setAttribute('aria-valuenow', String(now));
}

document.querySelectorAll('.nbs-meter[aria-label], .nbs-seat-meter__track[aria-label]').forEach(upgradeMeter);

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

function toast(message, tone = 'success') {
  const item = document.createElement('div');
  item.className = 'v04-toast';
  const mark = document.createElement('span');
  mark.className = `nbs-badge nbs-badge--${tone}`;
  mark.textContent = tone === 'danger' ? '!' : tone === 'warning' ? '!' : '✓';
  const copy = document.createElement('p');
  copy.textContent = message;
  const close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', 'Dismiss notification');
  close.textContent = '×';
  item.append(mark, copy, close);
  toastRegion.append(item);
  const remove = () => item.remove();
  close.addEventListener('click', remove);
  window.setTimeout(remove, 4200);
}

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 0 : ms));

const viewButtons = [...document.querySelectorAll('.v04-view')];
viewButtons.forEach((button) => button.addEventListener('click', () => {
  viewButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  toast(`${button.textContent.trim()} view loaded.`, 'info');
}));

const activationChart = document.querySelector('#activationChart');
const chartBars = [...activationChart.querySelectorAll('.nbs-chart-bar')];
let chartTooltip = null;

function showChartTooltip(bar) {
  chartTooltip?.remove();
  const tip = document.createElement('div');
  tip.className = 'v04-chart-tooltip';
  tip.textContent = `${bar.dataset.label}: ${Number(bar.dataset.value).toLocaleString()} activations`;
  activationChart.append(tip);
  const chartRect = activationChart.getBoundingClientRect();
  const barRect = bar.getBoundingClientRect();
  const left = Math.min(Math.max(barRect.left - chartRect.left, 8), Math.max(8, chartRect.width - 150));
  const top = Math.max(8, barRect.top - chartRect.top - 36);
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
  chartTooltip = tip;
}

function hideChartTooltip() {
  chartTooltip?.remove();
  chartTooltip = null;
}

chartBars.forEach((bar) => {
  bar.addEventListener('mouseenter', () => showChartTooltip(bar));
  bar.addEventListener('mouseleave', hideChartTooltip);
  bar.addEventListener('focus', () => showChartTooltip(bar));
  bar.addEventListener('blur', hideChartTooltip);
});

const calendarDays = [...document.querySelectorAll('.nbs-calendar__day[data-day]')];
const rangeStart = document.querySelector('#rangeStart');
const rangeEnd = document.querySelector('#rangeEnd');
const rangeBadge = document.querySelector('#rangeBadge');
const renewalCount = document.querySelector('#renewalCount');
const applyRange = document.querySelector('#applyRange');
let startDay = 7;
let endDay = 13;
let awaitingEnd = false;

function formatDay(day) {
  return `Sep ${day}, 2026`;
}

function syncRange() {
  const from = Math.min(startDay, endDay);
  const to = Math.max(startDay, endDay);
  const days = to - from + 1;
  calendarDays.forEach((dayButton) => {
    const day = Number(dayButton.dataset.day);
    const boundary = day === from || day === to;
    dayButton.removeAttribute('aria-selected');
    dayButton.setAttribute('aria-pressed', String(boundary));
    if (day > from && day < to) dayButton.dataset.inRange = 'true';
    else delete dayButton.dataset.inRange;
  });
  rangeStart.value = formatDay(from);
  rangeEnd.value = formatDay(to);
  rangeBadge.textContent = `${days} ${days === 1 ? 'day' : 'days'} selected`;
  renewalCount.textContent = String(108 + days * 8 - (days > 12 ? 6 : 0));
}

calendarDays.forEach((button) => button.addEventListener('click', () => {
  const day = Number(button.dataset.day);
  if (!awaitingEnd) {
    startDay = day;
    endDay = day;
    awaitingEnd = true;
  } else {
    endDay = day;
    awaitingEnd = false;
  }
  syncRange();
}));

applyRange.addEventListener('click', () => {
  toast(`Renewal window applied: ${rangeStart.value} → ${rangeEnd.value}.`, 'info');
});

const dropzone = document.querySelector('#dropzone');
const releaseFile = document.querySelector('#releaseFile');
const uploadResult = document.querySelector('#uploadResult');
const uploadName = document.querySelector('#uploadName');
const uploadMeta = document.querySelector('#uploadMeta');

function humanFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function acceptFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.zip')) {
    toast('Release rejected: choose a ZIP package.', 'danger');
    return;
  }
  uploadResult.hidden = false;
  uploadName.textContent = file.name;
  uploadMeta.textContent = `${humanFileSize(file.size)} · calculating SHA-256…`;
  await wait(420);
  uploadMeta.textContent = `${humanFileSize(file.size)} · SHA-256 calculated · ready for R2`;
  toast(`${file.name} verified and ready for upload.`, 'success');
}

releaseFile.addEventListener('change', () => acceptFile(releaseFile.files?.[0]));
['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropzone.dataset.dragging = 'true';
}));
['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
  event.preventDefault();
  delete dropzone.dataset.dragging;
}));
dropzone.addEventListener('drop', (event) => acceptFile(event.dataTransfer?.files?.[0]));

const retryFailed = document.querySelector('#retryFailed');
const failedWebhook = document.querySelector('#failedWebhook');
const failedWebhookStatus = document.querySelector('#failedWebhookStatus');

retryFailed.addEventListener('click', async () => {
  retryFailed.disabled = true;
  retryFailed.textContent = 'Retrying…';
  failedWebhookStatus.className = 'nbs-badge nbs-badge--info';
  failedWebhookStatus.textContent = 'retrying';
  await wait(700);
  failedWebhookStatus.className = 'nbs-badge nbs-badge--success';
  failedWebhookStatus.textContent = '200 · 241ms';
  failedWebhook.querySelector('.nbs-webhook-event__copy span').textContent = 'evt_8918 · retry 3/5 · recovered';
  retryFailed.textContent = 'Retry failed webhook';
  retryFailed.disabled = false;
  toast('Webhook retry succeeded. Delivery log preserved.', 'success');
});

const startBatch = document.querySelector('#startBatch');
const batchProgress = document.querySelector('#batchProgress');
const batchMeta = document.querySelector('#batchMeta');
const batchState = document.querySelector('#batchState');
const partialFailure = document.querySelector('#partialFailure');
const batchSteps = [
  document.querySelector('#stepValidate'),
  document.querySelector('#stepExtend'),
  document.querySelector('#stepNotify')
];

function setStep(step, status, label) {
  step.dataset.status = status;
  const badge = step.querySelector('.nbs-badge');
  badge.className = `nbs-badge ${status === 'success' ? 'nbs-badge--success' : status === 'warning' ? 'nbs-badge--warning' : status === 'danger' ? 'nbs-badge--danger' : 'nbs-badge--info'}`;
  badge.textContent = label;
}

function setBatchProgress(value, copy) {
  batchProgress.style.setProperty('--nbs-progress-value', `${value}%`);
  batchProgress.setAttribute('aria-valuenow', String(value));
  batchMeta.textContent = copy;
}

startBatch.addEventListener('click', async () => {
  startBatch.disabled = true;
  partialFailure.hidden = true;
  batchState.className = 'nbs-badge nbs-badge--info';
  batchState.textContent = 'Running';
  batchSteps.forEach((step) => {
    delete step.dataset.status;
    const badge = step.querySelector('.nbs-badge');
    badge.className = 'nbs-badge';
    badge.textContent = 'Pending';
  });

  setStep(batchSteps[0], 'running', 'Running');
  setBatchProgress(18, 'Validating 164 entitlements…');
  await wait(620);
  setStep(batchSteps[0], 'success', '162 eligible');

  setStep(batchSteps[1], 'running', 'Running');
  setBatchProgress(58, 'Extending update access…');
  await wait(700);
  setStep(batchSteps[1], 'warning', '162 / 164');

  setStep(batchSteps[2], 'running', 'Running');
  setBatchProgress(84, 'Delivering audit events and webhooks…');
  await wait(620);
  setStep(batchSteps[2], 'success', 'Delivered');

  setBatchProgress(100, '162 extended · 1 skipped · 1 needs retry.');
  batchState.className = 'nbs-badge nbs-badge--warning';
  batchState.textContent = 'Partial success';
  partialFailure.hidden = false;
  partialFailure.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  startBatch.disabled = false;
  startBatch.textContent = 'Run again';
  toast('Batch completed with 2 isolated exceptions.', 'warning');
});

const renewalInputs = [...document.querySelectorAll('#renewalPolicy input[name="renewal"]')];
const renewalForecast = document.querySelector('#renewalForecast');
const saveRenewal = document.querySelector('#saveRenewal');

function syncRenewalForecast() {
  const selected = renewalInputs.find((input) => input.checked)?.value;
  renewalForecast.textContent = selected === 'active'
    ? '8 assigned seats would renew on October 1 for $392/year after confirmation.'
    : '10 purchased seats renew on October 1 for $490/year.';
}
renewalInputs.forEach((input) => input.addEventListener('change', syncRenewalForecast));
saveRenewal.addEventListener('click', () => {
  const selected = renewalInputs.find((input) => input.checked)?.value;
  toast(selected === 'active' ? 'Renewal policy saved: assigned seats only.' : 'Renewal policy saved: preserve purchased capacity.', 'success');
});

syncRange();
syncRenewalForecast();
