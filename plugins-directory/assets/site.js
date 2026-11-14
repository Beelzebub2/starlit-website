// A first-party, read-only metadata directory. It never loads or executes plugin JS.
const t = JSON.parse(document.getElementById('translations').textContent);
const state = { query: '', language: 'all', sort: 'available' };
const results = document.getElementById('repository-list');
const countText = document.getElementById('result-count');
const filters = document.getElementById('filters');
const input = document.getElementById('search');
const sort = document.getElementById('sort');
const toast = document.getElementById('toast');
let catalog;
let lastToast = 0;
const labels = {en:'English',fr:'Français',ar:'العربية',hi:'हिन्दी',id:'Bahasa Indonesia',ja:'日本語',ko:'한국어',ta:'தமிழ்',te:'తెలుగు',mal:'Malayalam',tr:'Türkçe',pt:'Português',es:'Español',it:'Italiano'};
const node = (tag, className, content) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined) el.textContent = String(content);
  return el;
};
const ghUrl = r => `https://github.com/${r.repo}`;
const manifestUrl = r => `https://raw.githubusercontent.com/${r.repo}/refs/heads/${r.branch}/manifest.json`;
function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  const id = ++lastToast;
  window.setTimeout(() => { if (id === lastToast) toast.hidden = true; }, 4500);
}
async function copyManifest(repository) {
  const url = manifestUrl(repository);
  let didCopy = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      didCopy = true;
    }
  } catch { /* use manual selection fallback */ }
  if (!didCopy) {
    const textarea = node('textarea');
    textarea.value = url;
    textarea.setAttribute('aria-label', t.copy);
    textarea.className = 'copy-fallback';
    document.body.append(textarea);
    textarea.select();
    try { didCopy = Boolean(document.execCommand('copy')); } catch { /* manual selection stays available */ }
    if (didCopy) textarea.remove();
    else { textarea.focus(); showToast(t.copyFailed); return; }
  }
  showToast(t.copied);
}
function providerList(repository, source) {
  const container = node('div', 'provider-panel');
  const heading = node('h4', '', t.full);
  const list = node('ul', 'provider-list');
  repository.providers.forEach(name => list.append(node('li', 'provider-name', name)));
  container.append(heading, list);
  return container;
}
function repositoryCard(r) {
  const available = r.status === 'source-visible';
  const card = node('article', 'repo-card');
  const header = node('div', 'repo-header');
  const leading = node('div', 'repo-leading');
  const title = node('h3', 'repo-title', r.name);
  const owner = node('p', 'repo-owner', `${r.publisher} · ${r.repo}`);
  const badges = node('div', 'repo-statuses');
  const status = node('span', available ? 'status-available' : 'status-unavailable', available ? t.available : t.missing);
  const languageList = r.languages.map(l => labels[l] || l.toUpperCase()).join(' / ');
  const languages = node('span', 'repo-languages', languageList);
  badges.append(status, languages);
  leading.append(title, owner, badges);
  const stat = node('div', 'repo-stat');
  stat.append(node('strong', 'repo-count', available ? r.providers.length : '—'), node('span', 'repo-count-label', t.items));
  header.append(leading, stat);
  card.append(header);
  if (available) {
    const snippet = node('div', 'repo-preview');
    r.providers.slice(0, 4).forEach(name => snippet.append(node('span', '', name)));
    if (r.providers.length > 4) snippet.append(node('span', 'preview-more', `+${r.providers.length - 4}`));
    card.append(snippet);
  } else {
    card.append(node('p', 'repo-unavailable-reason', t.unavailableDesc));
  }
  const footer = node('div','repo-footer');
  const srcLink = node('a', 'source-link', t.read);
  srcLink.href = ghUrl(r);
  srcLink.target = '_blank';
  srcLink.rel = 'noopener noreferrer';
  srcLink.setAttribute('aria-label', `${t.source}: ${r.publisher}`);
  const actions = node('div','repo-buttons');
  if (available && r.providers.length) {
    const toggle = node('button', 'more-button', t.inspect);
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    const panel = providerList(r);
    panel.hidden = true;
    panel.id = `providers-${r.id}`;
    toggle.setAttribute('aria-controls', panel.id);
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.textContent = open ? t.inspect : t.hide;
      panel.hidden = open;
      card.classList.toggle('is-open', !open);
    });
    actions.append(toggle);
    const button = node('button','copy-button',t.copy);
    button.type = 'button';
    button.setAttribute('aria-label', `${t.copy} — ${r.name}`);
    button.addEventListener('click', () => copyManifest(r));
    actions.append(button);
    footer.append(srcLink, actions);
    card.append(footer, panel);
  } else {
    const button = node('button','copy-button',t.copy);
    button.type = 'button';
    button.disabled = true;
    button.title = t.unavailableLabel;
    actions.append(button);
    footer.append(srcLink, actions);
    card.append(footer);
  }
  return card;
}
function normalize(v) { return String(v).toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function filtered() {
  const query = normalize(state.query.trim());
  const entries = catalog.repositories.filter(r => {
    if (state.language !== 'all' && !r.languages.includes(state.language)) return false;
    if (!query) return true;
    return normalize([r.name,r.publisher,r.repo,...r.providers,...r.languages.map(l=>labels[l]||l)].join(' ')).includes(query);
  });
  entries.sort((a,b) => {
    if (state.sort === 'count') return b.providers.length - a.providers.length || a.name.localeCompare(b.name);
    if (state.sort === 'name') return a.name.localeCompare(b.name);
    return (a.status === b.status ? 0 : a.status === 'source-visible' ? -1 : 1) || b.providers.length - a.providers.length || a.name.localeCompare(b.name);
  });
  return entries;
}
function updateResults() {
  if (!catalog) return;
  const entries = filtered();
  countText.textContent = `${entries.length} ${t.results}`;
  const fragment = document.createDocumentFragment();
  if (!entries.length) {
    const empty = node('div','empty-state');
    empty.append(node('p','',t.empty));
    const reset = node('button','reset-button',t.clear);
    reset.type = 'button';
    reset.addEventListener('click', () => {
      input.value = ''; state.query = ''; state.language = 'all';
      updateFilters(); updateResults(); input.focus();
    });
    empty.append(reset);
    fragment.append(empty);
  } else {
    entries.forEach(r => fragment.append(repositoryCard(r)));
  }
  results.replaceChildren(fragment);
}
function updateFilters() {
  const languages = [...new Set(catalog.repositories.flatMap(r=>r.languages))]
    .sort((a,b)=>(labels[a]||a).localeCompare(labels[b]||b));
  const group = document.createDocumentFragment();
  const all = ['all', ...languages];
  for (const lang of all) {
    const n = node('button', 'filter' + (state.language === lang ? ' is-active' : ''), lang === 'all' ? t.all : (labels[lang] || lang));
    n.type = 'button';
    n.setAttribute('aria-pressed', String(state.language === lang));
    n.addEventListener('click', () => { state.language = lang; updateFilters(); updateResults(); });
    const matches = lang === 'all' ? catalog.repositories.length : catalog.repositories.filter(r=>r.languages.includes(lang)).length;
    n.append(node('span','filter-count',matches));
    group.append(n);
  }
  filters.replaceChildren(group);
}
async function start() {
  try {
    const response = await fetch('/catalog.json', { cache: 'no-store' });
    if (!response.ok) throw Error('Catalog returned status ' + response.status);
    catalog = await response.json();
    if (!Array.isArray(catalog.repositories)) throw Error('Catalog format');
    updateFilters(); updateResults();
  } catch (error) {
    results.replaceChildren(node('p','directory-error',t.error));
    console.warn('Directory catalog could not be loaded', error.message);
  }
}
input.addEventListener('input', () => { state.query = input.value; updateResults(); });
sort.addEventListener('change', () => { state.sort = sort.value; updateResults(); });
document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName) && !event.ctrlKey && !event.altKey) { event.preventDefault(); input.focus(); }
  if (event.key === 'Escape' && document.activeElement === input && input.value) { input.value = ''; state.query = ''; updateResults(); }
});
start();
