const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TOKENS = {
  ts: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`[^`]*`)|\b(import|from|export|const|let|await|async|function|return|if|else|for|of|type|new|throw|continue|true|false|null)\b|\b(\d[\d_.]*)\b|([A-Za-z_$][\w$]*)(?=\()/g,
  xml: /(<!--[\s\S]*?--!?>)|("[^"\n]*")|(<\/?[\w.:-]+|\/?>)/g,
  sh: /(#[^\n]*)/g,
};

const CLASSES = ['c', 's', 'k', 'n', 'f'];

document.querySelectorAll('pre[data-lang] code').forEach((code) => {
  const pattern = TOKENS[code.parentElement.dataset.lang];
  if (!pattern) return;
  const source = code.textContent;
  let html = '';
  let last = 0;
  for (const match of source.matchAll(pattern)) {
    html += escapeHtml(source.slice(last, match.index));
    const group = match.slice(1).findIndex((g) => g !== undefined);
    const cls =
      code.parentElement.dataset.lang === 'xml' && group === 2
        ? 'k'
        : CLASSES[group];
    html += `<span class="${cls}">${escapeHtml(match[0])}</span>`;
    last = match.index + match[0].length;
  }
  code.innerHTML = html + escapeHtml(source.slice(last));
});

const filter = document.querySelector('[data-filter]');
if (filter) {
  const rows = document.querySelectorAll(filter.dataset.filter);
  const count = document.querySelector('[data-filter-count]');
  filter.addEventListener('input', () => {
    const query = filter.value.trim().toLowerCase();
    let shown = 0;
    rows.forEach((row) => {
      const match = row.textContent.toLowerCase().includes(query);
      row.hidden = !match;
      if (match) shown += 1;
    });
    if (count) count.textContent = String(shown);
  });
}

document.querySelectorAll('[data-tabs]').forEach((root) => {
  const tabs = root.querySelectorAll('[role="tab"]');
  const panels = root.querySelectorAll('[data-panel]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      panels.forEach((p) => {
        p.hidden = p.dataset.panel !== tab.dataset.tab;
      });
    });
  });
});

const menuBtn = document.querySelector('[data-menu]');
const mobileNav = document.querySelector('[data-mobile-nav]');
if (menuBtn && mobileNav) {
  const sync = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    mobileNav.hidden = !open;
    menuBtn.textContent = open ? 'Close' : 'Menu';
  };
  menuBtn.addEventListener('click', () => {
    sync(menuBtn.getAttribute('aria-expanded') !== 'true');
  });
  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => sync(false));
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') sync(false);
  });
  window
    .matchMedia('(min-width: 901px)')
    .addEventListener('change', (event) => {
      if (event.matches) sync(false);
    });
}

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const source =
      document.getElementById(button.dataset.copy) ??
      button.closest('.code')?.querySelector('pre');
    if (!source) return;
    try {
      await navigator.clipboard.writeText(source.innerText.trim());
    } catch {
      return;
    }
    const label = button.textContent;
    button.textContent = 'Copied';
    button.dataset.copied = '';
    setTimeout(() => {
      button.textContent = label;
      delete button.dataset.copied;
    }, 1600);
  });
});
