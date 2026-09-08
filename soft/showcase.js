const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const themeToggle = document.querySelector('#themeToggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const savedTheme = localStorage.getItem('nbs-theme');

if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;

function syncTheme() {
  const dark = root.dataset.theme === 'dark';
  themeToggle.textContent = dark ? 'Light mode' : 'Dark mode';
  themeMeta?.setAttribute('content', dark ? '#171717' : '#f6f2ea');
}

syncTheme();
themeToggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('nbs-theme', root.dataset.theme);
  syncTheme();
});

const nav = document.querySelector('.sc-nav');
if (nav && !nav.querySelector('a[href="./components.html"]')) {
  const componentLink = document.createElement('a');
  componentLink.href = './components.html';
  componentLink.textContent = 'Components';
  nav.insertBefore(componentLink, nav.querySelector('a[href="#workflows"]'));
}
const versionBadge = document.querySelector('.sc-desktop-badge');
if (versionBadge) versionBadge.textContent = 'v0.7 · pre-1.0';
const heroActions = document.querySelector('.sc-hero__actions');
if (heroActions && !heroActions.querySelector('a[href="./components.html"]')) {
  const browse = document.createElement('a');
  browse.className = 'nbs-button nbs-button--lg';
  browse.href = './components.html';
  browse.textContent = 'Browse components';
  heroActions.append(browse);
}
const oldLabLink = document.querySelector('.sc-final__actions a[href="./demo/v05.html"]');
if (oldLabLink) {
  oldLabLink.href = './components.html';
  oldLabLink.textContent = 'Browse components';
  const lab = document.createElement('a');
  lab.className = 'nbs-button nbs-button--lg';
  lab.href = './demo/v07.html';
  lab.textContent = 'Open NeoLicenser lab';
  oldLabLink.after(lab);
}

const depthRange = document.querySelector('#depthRange');
const physicsStage = document.querySelector('#physicsStage');
const depthValue = document.querySelector('#depthValue');
const restReadout = document.querySelector('#restReadout');
const hoverReadout = document.querySelector('#hoverReadout');
const presetButtons = [...document.querySelectorAll('[data-depth]')];

function setDepth(value) {
  const depth = Math.max(2, Math.min(8, Number(value)));
  const hover = Math.max(1, depth / 2);
  depthRange.value = String(depth);
  physicsStage.style.setProperty('--play-depth', `${depth}px`);
  physicsStage.style.setProperty('--play-hover', `${hover}px`);
  depthValue.textContent = `${depth}px`;
  restReadout.textContent = `${depth}px`;
  hoverReadout.textContent = `${Number.isInteger(hover) ? hover : hover.toFixed(1)}px`;
  presetButtons.forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.depth) === depth)));
}

depthRange.addEventListener('input', () => setDepth(depthRange.value));
presetButtons.forEach((button) => button.addEventListener('click', () => setDepth(button.dataset.depth)));
setDepth(depthRange.value);

const copyButtons = [...document.querySelectorAll('[data-copy]')];
copyButtons.forEach((button) => button.addEventListener('click', async () => {
  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(button.dataset.copy || '');
    button.textContent = 'Copied ✓';
  } catch {
    button.textContent = 'Select text';
  }
  window.setTimeout(() => { button.textContent = original; }, reduceMotion ? 1 : 1400);
}));

const agentApprove = document.querySelector('#agentApprove');
const agentResult = document.querySelector('#agentResult');
agentApprove.addEventListener('click', () => {
  agentApprove.disabled = true;
  agentApprove.textContent = 'Applying 7 changes…';
  agentResult.textContent = 'Executing approved plan. Each change remains auditable.';
  window.setTimeout(() => {
    agentApprove.textContent = 'Changes applied ✓';
    agentResult.textContent = '7 of 7 changes verified. Audit event created.';
    agentApprove.classList.remove('nbs-button--primary');
    agentApprove.classList.add('nbs-button--success');
  }, reduceMotion ? 1 : 650);
});

const views = {
  overview: {
    eyebrow: 'OPERATIONS',
    title: 'Overview',
    action: '+ New product',
    metrics: [
      ['TOTAL LICENSES', '12,420', 'Across 4 products'],
      ['ACTIVE', '11,892', '95.7% healthy'],
      ['EXPIRING', '528', 'Next 30 days']
    ],
    listTitle: 'Recent license activity',
    rows: [
      ['green', 'Rivet Pro activated', 'apex.studio · 2 minutes ago', 'success', 'Active'],
      ['purple', 'Soft Team renewed', 'northstar.dev · 14 minutes ago', 'info', 'Renewed'],
      ['yellow', 'ImageForge payment', 'pixelharbor.io · 31 minutes ago', 'warning', 'Review']
    ]
  },
  licenses: {
    eyebrow: 'ENTITLEMENTS',
    title: 'Licenses',
    action: '+ Create license',
    metrics: [
      ['VALID', '11,892', '95.7% of total'],
      ['GRACE PERIOD', '84', '7 day window'],
      ['REVOKED', '126', '1.0% of total']
    ],
    listTitle: 'Licenses needing attention',
    rows: [
      ['yellow', 'NL-IMG-••07', 'Pixel Harbor · card expired', 'warning', 'Renew'],
      ['purple', 'NL-SFT-••18', 'Monsoon Works · seat review', 'info', '8 / 10'],
      ['green', 'NL-RVT-••92', 'Apex Studio · recently renewed', 'success', 'Healthy']
    ]
  },
  releases: {
    eyebrow: 'DELIVERY',
    title: 'Releases',
    action: '+ Publish release',
    metrics: [
      ['STABLE', '2.8.0', '25% rollout'],
      ['INSTALLS', '5,136', 'Eligible population'],
      ['REGRESSIONS', '0', 'Last 24 hours']
    ],
    listTitle: 'Release pipeline',
    rows: [
      ['green', 'ImageForge 2.8.0', 'Signed · SHA-256 verified', 'success', '25%'],
      ['purple', 'Soft 0.7.0', 'Component explorer + NeoLicenser lab', 'info', 'Preview'],
      ['yellow', 'Rivet 1.4.2', 'Waiting for changelog', 'warning', 'Draft']
    ]
  },
  agents: {
    eyebrow: 'AUTOMATION',
    title: 'Agents',
    action: '+ Grant access',
    metrics: [
      ['ACTIVE AGENTS', '3', 'Scoped credentials'],
      ['PLANS TODAY', '18', '17 approved'],
      ['HIGH RISK', '0', 'Approval required']
    ],
    listTitle: 'Recent agent plans',
    rows: [
      ['purple', 'Configure R2 delivery', '7 changes · ImageForge', 'info', 'Review'],
      ['green', 'Prepare release 2.8.0', '5 changes · verified', 'success', 'Done'],
      ['yellow', 'Rotate webhook secret', 'Sensitive action · approval', 'warning', 'Approve']
    ]
  }
};

const demoButtons = [...document.querySelectorAll('.sc-demo-nav [data-view]')];
const demoEyebrow = document.querySelector('#demoEyebrow');
const demoTitle = document.querySelector('#demoTitle');
const demoAction = document.querySelector('#demoAction');
const demoListTitle = document.querySelector('#demoListTitle');
const demoList = document.querySelector('#demoList');
const metricNodes = [
  [document.querySelector('#metricOneLabel'), document.querySelector('#metricOne')],
  [document.querySelector('#metricTwoLabel'), document.querySelector('#metricTwo')],
  [document.querySelector('#metricThreeLabel'), document.querySelector('#metricThree')]
];

function renderView(name) {
  const view = views[name];
  if (!view) return;
  demoButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === name)));
  demoEyebrow.textContent = view.eyebrow;
  demoTitle.textContent = view.title;
  demoAction.textContent = view.action;
  demoListTitle.textContent = view.listTitle;

  metricNodes.forEach((pair, index) => {
    const [labelNode, valueNode] = pair;
    labelNode.textContent = view.metrics[index][0];
    valueNode.textContent = view.metrics[index][1];
    const small = valueNode.parentElement.querySelector('small');
    if (small) small.textContent = view.metrics[index][2];
  });

  demoList.replaceChildren(...view.rows.map(([tone, title, meta, badgeTone, badge]) => {
    const row = document.createElement('div');
    const status = document.createElement('span');
    status.className = `sc-status sc-status--${tone}`;
    status.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = title;
    const small = document.createElement('small');
    small.textContent = meta;
    copy.append(strong, small);
    const state = document.createElement('span');
    state.className = `nbs-badge nbs-badge--${badgeTone}`;
    state.textContent = badge;
    row.append(status, copy, state);
    return row;
  }));
}

demoButtons.forEach((button) => button.addEventListener('click', () => renderView(button.dataset.view)));
renderView('overview');
