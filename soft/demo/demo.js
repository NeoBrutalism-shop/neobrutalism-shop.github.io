const root = document.documentElement;
const themeToggle = document.querySelector('#themeToggle');
const sidebar = document.querySelector('#appSidebar');
const navToggle = document.querySelector('#navToggle');
const toastRegion = document.querySelector('#toastRegion');
let lastFocusedElement = null;

const storedTheme = localStorage.getItem('nbs-theme');
if (storedTheme === 'light' || storedTheme === 'dark') root.dataset.theme = storedTheme;

function syncThemeLabel() {
  if (!themeToggle) return;
  themeToggle.textContent = root.dataset.theme === 'dark' ? 'Light mode' : 'Dark mode';
}

function showToast(title, copy = '') {
  if (!toastRegion) return;
  const toast = document.createElement('div');
  toast.className = 'nbs-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="nbs-toast__icon" aria-hidden="true">✓</span>
    <div>
      <p class="nbs-toast__title"></p>
      <p class="nbs-toast__copy"></p>
    </div>
    <button class="nbs-button nbs-button--sm nbs-button--quiet" type="button" aria-label="Dismiss notification">Close</button>
  `;
  toast.querySelector('.nbs-toast__title').textContent = title;
  toast.querySelector('.nbs-toast__copy').textContent = copy;
  const dismiss = () => toast.remove();
  toast.querySelector('button').addEventListener('click', dismiss);
  toastRegion.prepend(toast);
  window.setTimeout(dismiss, 4800);
}

function getFocusable(container) {
  return [...container.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
}

function openLayer(id) {
  const layer = document.getElementById(id);
  if (!layer) return;
  lastFocusedElement = document.activeElement;
  layer.hidden = false;
  document.body.style.overflow = 'hidden';
  const panel = layer.querySelector('[role="dialog"]');
  requestAnimationFrame(() => (panel || layer).focus());
}

function closeLayer(id) {
  const layer = document.getElementById(id);
  if (!layer) return;
  layer.hidden = true;
  document.body.style.overflow = '';
  if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

function handleDialogKeys(event) {
  const openLayerEl = [...document.querySelectorAll('.nbs-overlay:not([hidden])')].at(-1);
  if (!openLayerEl) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeLayer(openLayerEl.id);
    return;
  }

  if (event.key !== 'Tab') return;
  const dialog = openLayerEl.querySelector('[role="dialog"]');
  if (!dialog) return;
  const focusable = getFocusable(dialog);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

syncThemeLabel();

themeToggle?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('nbs-theme', next);
  syncThemeLabel();
});

navToggle?.addEventListener('click', () => {
  const isOpen = sidebar?.dataset.open === 'true';
  if (!sidebar) return;
  sidebar.dataset.open = String(!isOpen);
  navToggle.setAttribute('aria-expanded', String(!isOpen));
});

document.querySelectorAll('.nbs-nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nbs-nav-item[aria-current="page"]').forEach((active) => active.removeAttribute('aria-current'));
    item.setAttribute('aria-current', 'page');
    if (sidebar && window.matchMedia('(max-width: 900px)').matches) {
      sidebar.dataset.open = 'false';
      navToggle?.setAttribute('aria-expanded', 'false');
    }
  });
});

document.querySelector('#openDialog')?.addEventListener('click', () => openLayer('productDialog'));
document.querySelector('#openDrawer')?.addEventListener('click', () => openLayer('setupDrawerOverlay'));

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => closeLayer(button.dataset.close));
});

document.querySelectorAll('.nbs-overlay').forEach((overlay) => {
  overlay.addEventListener('mousedown', (event) => {
    if (event.target === overlay) closeLayer(overlay.id);
  });
});

document.addEventListener('keydown', handleDialogKeys);

document.querySelector('#showToast')?.addEventListener('click', () => {
  showToast('Feedback is immediate', 'The action acknowledged contact, completed, and returned a visible result.');
});

document.querySelector('#createProduct')?.addEventListener('click', () => {
  const name = document.querySelector('#productName')?.value.trim() || 'Untitled product';
  closeLayer('productDialog');
  showToast('Product created', `${name} is ready for its license policy.`);
});

document.querySelector('#generatePlan')?.addEventListener('click', () => {
  closeLayer('setupDrawerOverlay');
  showToast('Plan generated', 'The agent prepared a reviewable change set without applying anything yet.');
});

document.querySelector('#applyPlan')?.addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Applying…';
  await new Promise((resolve) => setTimeout(resolve, 650));
  button.textContent = 'Applied ✓';
  showToast('Configuration applied', '4 changes were verified and added to the audit trail.');
  window.setTimeout(() => {
    button.disabled = false;
    button.textContent = original;
  }, 1800);
});

document.querySelector('#copyKey')?.addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const value = document.querySelector('#apiKey')?.textContent || '';
  try {
    await navigator.clipboard.writeText(value);
    const original = button.textContent;
    button.textContent = 'Copied ✓';
    showToast('Copied to clipboard', 'The visible key reference was copied.');
    window.setTimeout(() => (button.textContent = original), 1400);
  } catch {
    showToast('Copy unavailable', 'Clipboard access is blocked in this browser context.');
  }
});
