// Full-page collection editor: short steps, a live check panel and a preview,
// instead of one long modal. It edits one collection and saves the whole list
// with the revision it loaded. Output stays compatible with the Starlit client.
import { h, icon, replace } from '../lib/dom.js';
import { t } from '../lib/i18n.js';
import { isConflict } from '../lib/errors.js';
import { clone, equal } from '../lib/merge.js';
import {
  TILE_SHAPES, TMDB_MEDIA, TMDB_PRESETS, TMDB_SORTS, TMDB_SOURCE_TYPES, TRAKT_HOW, TRAKT_SORTS, VIEW_MODES,
  blankFolder, blankSource, fromTemplate, normalize, parseTmdbId, parseTraktListId, sourcesOf, stats, validate,
} from '../lib/collections.js';
import { announce, button, emptyState, errorState, field, iconButton, input, link, loading, notice, select, toggle } from '../lib/ui.js';
import { readOnlyNotice } from './common.js';

const TEMPLATES = ['blank', 'tmdb-list', 'discover', 'trakt', 'addon'];

/** Human description of a validation issue, with where it is. */
export function issueText(issue, list) {
  const c = list[issue.at.collection];
  const parts = [];
  if (issue.at.collection !== undefined) parts.push(c?.title || t('coll.collectionN', { n: issue.at.collection + 1 }));
  if (issue.at.folder !== undefined) parts.push(c?.folders?.[issue.at.folder]?.title || t('coll.folderN', { n: issue.at.folder + 1 }));
  if (issue.at.source !== undefined) parts.push(t('coll.sourceN', { n: issue.at.source + 1 }));
  return `${parts.join(' › ')}${parts.length ? ': ' : ''}${t(`issue.${issue.code}`)}`;
}

const stepOfIssue = issue => {
  if (issue.at.folder === undefined) return issue.field === 'backdropImageUrl' ? 'artwork' : 'basics';
  if (['coverImageUrl', 'heroBackdropUrl', 'titleLogoUrl', 'focusGifUrl', 'heroVideoUrl'].includes(issue.field)) return 'artwork';
  return 'folders';
};
const keyOf = (at, fieldName) => `${at.folder ?? 'c'}.${at.source ?? 'x'}.${fieldName}`;

export default {
  title: ctx => (ctx.params.id ? t('editor.editTitle') : t('editor.newTitle')),
  render(ctx) {
    const isNew = !ctx.params.id;
    const steps = isNew ? ['start', 'basics', 'folders', 'artwork', 'review'] : ['basics', 'folders', 'artwork', 'review'];
    let step = steps[0];
    let list = [], revision = 0, index = -1, original = null, draft = null, pristine = null;
    let template = 'blank', showErrors = false, busy = false, loaded = false;

    const heading = h('h1', { class: 'page-title', tabindex: '-1' }, isNew ? t('editor.newTitle') : t('editor.editTitle'));
    const messages = h('div', {});
    const stepNav = h('nav', { class: 'steps', 'aria-label': t('editor.steps') });
    const stage = h('div', { class: 'editor-stage' });
    const side = h('aside', { class: 'editor-side', 'aria-label': t('editor.check') });
    const footer = h('div', { class: 'editor-footer' });
    const body = h('div', { class: 'editor-grid' }, stepNav, h('div', { class: 'editor-main' }, stage, footer), side);
    const host = h('div', {}, loading(6, 'card'));

    ctx.isDirty = () => loaded && !equal(draft, pristine);

    const fullList = () => (index >= 0 ? list.map((c, i) => (i === index ? draft : c)) : [...list, draft]);
    const myIndex = () => (index >= 0 ? index : list.length);
    const myIssues = () => validate(fullList()).filter(i => i.at.collection === myIndex() || i.at.collection === undefined);
    const errFor = (at, fieldName) => {
      if (!showErrors) return null;
      const hit = myIssues().find(i => i.level === 'error' && i.field === fieldName && i.at.folder === at.folder && i.at.source === at.source);
      return hit ? t(`issue.${hit.code}`) : null;
    };

    async function load() {
      try {
        const data = await ctx.api.blob(ctx.profileId, 'collections', null, { signal: ctx.signal });
        list = Array.isArray(data.value) ? data.value : [];
        revision = data.revision;
        if (isNew) { draft = fromTemplate(null); }
        else {
          index = list.findIndex(c => c.id === ctx.params.id);
          if (index < 0) { replace(host, emptyState({ title: t('editor.notFound'), body: t('editor.notFoundBody'), action: link(t('nav.collections'), '/collections', { variant: 'ghost', icon: 'back' }) })); return; }
          original = clone(list[index]);
          draft = clone(list[index]);
          heading.textContent = t('editor.editing', { name: draft.title || t('coll.untitled') });
          ctx.setTitle(t('editor.editing', { name: draft.title }));
        }
        pristine = clone(draft);
        loaded = true;
        replace(host, body);
        draw();
      } catch (error) {
        if (ctx.signal.aborted || error.kind === 'auth' || error.kind === 'aborted') return;
        replace(host, errorState(error, { onRetry: load }));
      }
    }

    // ---------------------------------------------------------------- drawing
    function draw(focusKey) {
      drawSteps();
      replace(stage, h('div', { class: 'step-panel', role: 'group', 'aria-labelledby': 'step-title' },
        h('h2', { class: 'step-title', id: 'step-title', tabindex: '-1' }, t(`editor.step.${step}`)),
        h('p', { class: 'step-desc' }, t(`editor.stepDesc.${step}`)),
        STEP[step]()));
      drawFooter();
      drawSide();
      if (focusKey === 'step') stage.querySelector('#step-title')?.focus();
      else if (focusKey) stage.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
    }

    function drawSteps() {
      const issues = myIssues().filter(i => i.level === 'error');
      replace(stepNav, h('ol', { role: 'list' }, steps.map((s, i) => {
        const count = issues.filter(x => stepOfIssue(x) === s).length;
        return h('li', {}, h('button', { type: 'button', class: 'step', 'aria-current': s === step ? 'step' : undefined, onclick: () => go(s) },
          h('span', { class: 'step-num' }, String(i + 1)), h('span', { class: 'step-name' }, t(`editor.step.${s}`)),
          showErrors && count ? h('span', { class: 'step-flag', 'aria-label': t('editor.stepIssues', { n: count }) }, String(count)) : null));
      })));
    }

    function drawFooter() {
      const i = steps.indexOf(step);
      const back = i > 0 ? button(t('editor.back'), { icon: 'back', onClick: () => go(steps[i - 1]) }) : link(t('common.cancel'), '/collections', { variant: 'ghost' });
      const next = step === 'review'
        ? button(busy ? t('common.saving') : t('editor.save'), { variant: 'accent', icon: 'check', onClick: save, busy, disabled: !ctx.canWrite() })
        : button(t('editor.continue'), { variant: 'accent', onClick: () => go(steps[i + 1]) });
      replace(footer, h('p', { class: 'editor-pos' }, t('editor.position', { n: i + 1, total: steps.length })), h('div', { class: 'editor-footer-actions' }, back, next));
    }

    let sideTimer = null;
    function drawSide() {
      const s = stats([draft]);
      const issues = myIssues();
      const errors = issues.filter(i => i.level === 'error'), warnings = issues.filter(i => i.level === 'warning');
      replace(side,
        h('h2', { class: 'side-title' }, t('editor.check')),
        h('p', { class: 'ledger-line' }, h('b', {}, String(s.folders)), ' ', t('coll.statFolders', { n: s.folders }), ' · ', h('b', {}, String(s.sources)), ' ', t('coll.statSources', { n: s.sources })),
        h('p', { class: ['check', errors.length ? 'check-bad' : 'check-ok'], role: 'status' },
          icon(errors.length ? 'alert' : 'check', { size: 16 }),
          errors.length ? t('editor.errors', { n: errors.length }) : t('editor.noErrors'),
          warnings.length ? h('span', { class: 'muted' }, ` · ${t('editor.warnings', { n: warnings.length })}`) : null),
        preview(draft));
    }
    const sideSoon = () => { clearTimeout(sideTimer); sideTimer = setTimeout(() => { drawSide(); drawSteps(); }, 150); };

    function go(next) {
      if (!steps.includes(next)) return;
      step = next;
      draw('step');
    }

    // Bind an input to a property; updates the draft without redrawing (keeps focus).
    function bind(control, target, prop, { parse = v => v, focusKey } = {}) {
      control.dataset.focusKey = focusKey ?? prop;
      const handler = () => { target[prop] = parse(control.type === 'checkbox' ? control.checked : control.value); sideSoon(); };
      control.addEventListener(control.tagName === 'SELECT' || control.type === 'checkbox' || control.type === 'radio' ? 'change' : 'input', handler);
      return control;
    }
    const nullable = v => (String(v).trim() === '' ? null : v);
    // What was typed into id fields, so an invalid entry is not wiped on redraw.
    const typed = new WeakMap();
    const remember = (target, prop, parser) => v => {
      const parsed = parser(v);
      typed.set(target, { ...(typed.get(target) ?? {}), [prop]: String(v) });
      return parsed;
    };
    const shown = (target, prop) => typed.get(target)?.[prop] ?? target[prop] ?? '';

    // ---------------------------------------------------------------- steps
    const STEP = {
      start() {
        const cards = TEMPLATES.map(id => h('label', { class: 'tpl' },
          h('input', { type: 'radio', name: 'template', value: id, checked: template === id, onchange: () => choose({ kind: id }, id) }),
          h('span', { class: 'tpl-title' }, t(`editor.tpl.${id}`)), h('span', { class: 'tpl-desc' }, t(`editor.tplDesc.${id}`))));
        const presets = TMDB_PRESETS.map((p, i) => h('label', { class: 'tpl tpl-s' },
          h('input', { type: 'radio', name: 'template', value: `preset-${i}`, checked: template === `preset-${i}`, onchange: () => choose({ kind: 'preset', preset: p }, `preset-${i}`) }),
          h('span', { class: 'tpl-title' }, p.title), h('span', { class: 'tpl-desc mono' }, `TMDB ${p.source.tmdbSourceType.toLowerCase()} · ${p.source.tmdbId}`)));
        return h('div', { class: 'stack' },
          h('fieldset', { class: 'tpl-group' }, h('legend', {}, t('editor.startFrom')), h('div', { class: 'tpl-grid' }, cards)),
          h('fieldset', { class: 'tpl-group' }, h('legend', {}, t('editor.presets')), h('p', { class: 'field-hint' }, t('editor.presetsHint')), h('div', { class: 'tpl-grid tpl-grid-s' }, presets)));
      },
      basics() {
        const title = bind(input({ value: draft.title ?? '', maxlength: '120', required: true }), draft, 'title', { focusKey: keyOf({}, 'title') });
        const modes = h('fieldset', { class: 'choice-group' }, h('legend', {}, t('editor.viewMode')),
          VIEW_MODES.map(m => h('label', { class: 'choice choice-card' },
            h('input', { type: 'radio', name: 'viewMode', value: m, checked: String(draft.viewMode ?? 'TABBED_GRID').toUpperCase() === m, onchange: () => { draft.viewMode = m; sideSoon(); } }),
            h('span', {}, h('b', {}, t(`coll.view.${m}`)), h('span', { class: 'muted' }, t(`editor.viewDesc.${m}`))))));
        return h('div', { class: 'stack' },
          field({ label: t('editor.title'), hint: t('editor.titleHint'), control: title, error: errFor({}, 'title') }),
          modes,
          toggle({ label: t('editor.showAll'), hint: t('editor.showAllHint'), checked: draft.showAllTab !== false, onChange: v => { draft.showAllTab = v; sideSoon(); } }),
          toggle({ label: t('editor.pin'), hint: t('editor.pinHint'), checked: Boolean(draft.pinToTop), onChange: v => { draft.pinToTop = v; sideSoon(); } }));
      },
      folders() {
        const folders = draft.folders ?? (draft.folders = []);
        return h('div', { class: 'stack' },
          folders.length ? h('ol', { role: 'list', class: 'folder-list' }, folders.map((f, fi) => folderCard(f, fi, folders))) : emptyState({ title: t('editor.noFolders'), body: t('editor.noFoldersBody') }),
          button(t('editor.addFolder'), { icon: 'plus', onClick: () => { folders.push(blankFolder('')); draw(keyOf({ folder: folders.length - 1 }, 'title')); announce(t('editor.folderAdded')); } }),
          h('datalist', { id: 'catalog-types' }, ['movie', 'series', 'anime', 'channel', 'tv'].map(v => h('option', { value: v }))));
      },
      artwork() {
        const rows = [urlField(draft, 'backdropImageUrl', {}, t('editor.art.backdrop'), 'landscape')];
        (draft.folders ?? []).forEach((f, fi) => {
          rows.push(h('h3', { class: 'sub-title' }, f.title || t('coll.folderN', { n: fi + 1 })));
          rows.push(urlField(f, 'coverImageUrl', { folder: fi }, t('editor.art.cover'), f.tileShape === 'landscape' || f.tileShape === 'wide' ? 'landscape' : f.tileShape === 'square' ? 'square' : 'poster'));
          rows.push(urlField(f, 'heroBackdropUrl', { folder: fi }, t('editor.art.hero'), 'landscape'));
          rows.push(urlField(f, 'titleLogoUrl', { folder: fi }, t('editor.art.logo'), 'logo'));
        });
        return h('div', { class: 'stack' }, h('p', { class: 'field-hint' }, t('editor.art.privacy')), rows);
      },
      review() {
        const issues = myIssues();
        const list = fullList();
        const items = issues.map(i => h('li', { class: `issue issue-${i.level}` }, icon(i.level === 'error' ? 'alert' : 'info', { size: 16 }), h('span', {}, issueText(i, list)),
          button(t('editor.fix'), { size: 's', onClick: () => { showErrors = true; step = stepOfIssue(i); draw(keyOf(i.at, i.field ?? 'title')); } })));
        const json = JSON.stringify(normalize([draft])[0], null, 2);
        return h('div', { class: 'stack' },
          issues.length ? h('ul', { role: 'list', class: 'issue-list' }, items) : notice({ tone: 'ok', title: t('editor.ready'), body: t('editor.readyBody') }),
          h('div', { class: 'preview-large' }, h('h3', { class: 'sub-title' }, t('editor.previewTitle')), preview(draft, true)),
          h('details', { class: 'json' }, h('summary', {}, t('editor.json')),
            h('pre', { tabindex: '0', 'aria-label': t('editor.json') }, h('code', {}, json)),
            button(t('editor.copyJson'), { size: 's', icon: 'copy', onClick: async () => { try { await navigator.clipboard.writeText(json); announce(t('editor.copied')); } catch { announce(t('ext.copyFailed')); } } })),
          h('p', { class: 'muted small' }, t('editor.validationNote')));
      },
    };

    function choose(tpl, id) {
      template = id;
      const keepTitle = draft.title;
      draft = fromTemplate(tpl);
      if (keepTitle && tpl.kind !== 'preset') draft.title = keepTitle;
      sideSoon();
    }

    function folderCard(f, fi, folders) {
      const at = { folder: fi };
      const title = bind(input({ value: f.title ?? '', maxlength: '120' }), f, 'title', { focusKey: keyOf(at, 'title') });
      const emoji = bind(input({ value: f.coverEmoji ?? '', maxlength: '8', class: 'input input-short' }), f, 'coverEmoji', { parse: nullable, focusKey: keyOf(at, 'coverEmoji') });
      const shape = bind(select(TILE_SHAPES.map(s => ({ value: s, label: t(`editor.shape.${s}`) })), String(f.tileShape ?? 'poster').toLowerCase()), f, 'tileShape', { focusKey: keyOf(at, 'tileShape') });
      const sources = sourcesOf(f);
      if (!Array.isArray(f.sources) || (!f.sources.length && sources.length)) f.sources = sources.map(s => ({ ...s }));
      const legend = f.title || t('coll.folderN', { n: fi + 1 });
      return h('li', { class: 'folder' },
        h('fieldset', { class: 'folder-set' },
          h('legend', { class: 'folder-legend' }, t('coll.folderN', { n: fi + 1 })),
          h('div', { class: 'folder-tools', role: 'group', 'aria-label': legend },
            focus(iconButton('up', t('editor.folderUp', { name: legend }), () => moveFolder(fi, -1), { disabled: fi === 0 }), keyOf(at, 'up')),
            focus(iconButton('down', t('editor.folderDown', { name: legend }), () => moveFolder(fi, 1), { disabled: fi === folders.length - 1 }), keyOf(at, 'down')),
            iconButton('trash', t('editor.folderRemove', { name: legend }), () => { folders.splice(fi, 1); draw(); announce(t('editor.folderRemoved')); })),
          h('div', { class: 'grid-2' },
            field({ label: t('editor.folderTitle'), control: title, error: errFor(at, 'title') }),
            h('div', { class: 'grid-2 tight' }, field({ label: t('editor.emoji'), control: emoji, optional: true }), field({ label: t('editor.shape'), control: shape }))),
          toggle({ label: t('editor.hideTitle'), checked: Boolean(f.hideTitle), onChange: v => { f.hideTitle = v; sideSoon(); } }),
          h('div', { class: 'sources' },
            h('h3', { class: 'sub-title' }, t('editor.sources')),
            f.sources.length ? h('ol', { role: 'list', class: 'source-list' }, f.sources.map((s, si) => sourceCard(f, s, fi, si))) : h('p', { class: 'muted small' }, t('editor.noSources')),
            h('div', { class: 'row-actions' }, ['tmdb', 'trakt', 'addon'].map(pv => button(t(`editor.add.${pv}`), { size: 's', icon: 'plus',
              onClick: () => { f.sources.push(blankSource(pv)); draw(keyOf({ folder: fi, source: f.sources.length - 1 }, 'provider')); } }))))));
    }
    const focus = (el, key) => { el.dataset.focusKey = key; return el; };

    function moveFolder(i, d) {
      const folders = draft.folders, j = i + d;
      if (j < 0 || j >= folders.length) return;
      [folders[i], folders[j]] = [folders[j], folders[i]];
      draw(keyOf({ folder: j }, d < 0 ? 'up' : 'down'));
      announce(t('ext.moved', { name: folders[j].title, pos: j + 1, total: folders.length }));
    }

    function sourceCard(f, s, fi, si) {
      const at = { folder: fi, source: si };
      const provider = select(['tmdb', 'trakt', 'addon'].map(v => ({ value: v, label: t(`editor.provider.${v}`) })), String(s.provider ?? 'addon').toLowerCase());
      provider.dataset.focusKey = keyOf(at, 'provider');
      provider.addEventListener('change', () => { f.sources[si] = blankSource(provider.value); draw(keyOf(at, 'provider')); });
      const fields = [];
      const add = (label, control, fieldName, opts = {}) => fields.push(field({ label, control, error: errFor(at, fieldName), ...opts }));
      if (s.provider === 'trakt') {
        const id = input({ value: shown(s, 'traktListId'), inputmode: 'numeric' });
        bind(id, s, 'traktListId', { parse: remember(s, 'traktListId', parseTraktListId), focusKey: keyOf(at, 'traktListId') });
        add(t('editor.traktId'), id, 'traktListId', { hint: t('editor.traktIdHint') });
        add(t('editor.label'), bind(input({ value: s.title ?? '' }), s, 'title', { parse: nullable, focusKey: keyOf(at, 'title') }), 'title', { optional: true });
        add(t('editor.sortBy'), bind(select(TRAKT_SORTS.map(v => ({ value: v, label: t(`editor.trakt.${v}`) })), s.sortBy ?? 'rank'), s, 'sortBy', { focusKey: keyOf(at, 'sortBy') }), 'sortBy');
        add(t('editor.sortHow'), bind(select(TRAKT_HOW.map(v => ({ value: v, label: t(`editor.how.${v}`) })), s.sortHow ?? 'asc'), s, 'sortHow', { focusKey: keyOf(at, 'sortHow') }), 'sortHow');
      } else if (s.provider === 'addon') {
        add(t('editor.addonId'), bind(input({ value: s.addonId ?? '', spellcheck: 'false' }), s, 'addonId', { focusKey: keyOf(at, 'addonId') }), 'addonId', { hint: t('editor.addonIdHint') });
        const type = bind(input({ value: s.type ?? '', list: 'catalog-types', spellcheck: 'false' }), s, 'type', { focusKey: keyOf(at, 'type') });
        add(t('editor.catalogType'), type, 'type');
        add(t('editor.catalogId'), bind(input({ value: s.catalogId ?? '', spellcheck: 'false' }), s, 'catalogId', { focusKey: keyOf(at, 'catalogId') }), 'catalogId');
        add(t('editor.genre'), bind(input({ value: s.genre ?? '' }), s, 'genre', { parse: nullable, focusKey: keyOf(at, 'genre') }), 'genre', { optional: true });
      } else {
        const type = select(TMDB_SOURCE_TYPES.map(v => ({ value: v, label: t(`editor.tmdbType.${v}`) })), String(s.tmdbSourceType ?? 'LIST').toUpperCase());
        type.dataset.focusKey = keyOf(at, 'tmdbSourceType');
        type.addEventListener('change', () => { s.tmdbSourceType = type.value; if (type.value === 'DISCOVER') { s.tmdbId = null; s.filters = s.filters ?? {}; } draw(keyOf(at, 'tmdbSourceType')); });
        fields.push(field({ label: t('editor.tmdbType'), control: type, error: errFor(at, 'tmdbSourceType') }));
        if (String(s.tmdbSourceType).toUpperCase() !== 'DISCOVER') {
          const id = input({ value: shown(s, 'tmdbId'), spellcheck: 'false' });
          const parsed = h('p', { class: 'field-hint mono', 'aria-live': 'polite' }, s.tmdbId ? t('editor.tmdbParsed', { id: s.tmdbId }) : '');
          bind(id, s, 'tmdbId', { parse: remember(s, 'tmdbId', v => { const n = parseTmdbId(v); parsed.textContent = n ? t('editor.tmdbParsed', { id: n }) : ''; return n; }), focusKey: keyOf(at, 'tmdbId') });
          const wrap = field({ label: t('editor.tmdbId'), hint: t('editor.tmdbIdHint'), control: id, error: errFor(at, 'tmdbId') });
          wrap.append(parsed);
          fields.push(wrap);
        } else {
          s.filters = s.filters ?? {};
          add(t('editor.genres'), bind(input({ value: s.filters.withGenres ?? '', spellcheck: 'false' }), s.filters, 'withGenres', { parse: nullable, focusKey: keyOf(at, 'filters.withGenres') }), 'filters.withGenres', { hint: t('editor.genresHint'), optional: true });
          add(t('editor.year'), bind(input({ value: s.filters.year ?? '', inputmode: 'numeric', class: 'input input-short' }), s.filters, 'year', { parse: v => (String(v).trim() === '' ? null : Number(v)), focusKey: keyOf(at, 'filters.year') }), 'filters.year', { optional: true });
          add(t('editor.language'), bind(input({ value: s.filters.withOriginalLanguage ?? '', maxlength: '5', class: 'input input-short', spellcheck: 'false' }), s.filters, 'withOriginalLanguage', { parse: nullable, focusKey: keyOf(at, 'filters.withOriginalLanguage') }), 'filters.withOriginalLanguage', { hint: t('editor.languageHint'), optional: true });
        }
        add(t('editor.mediaType'), bind(select(TMDB_MEDIA.map(v => ({ value: v, label: t(`editor.media.${v}`) })), String(s.mediaType ?? 'MOVIE').toUpperCase()), s, 'mediaType', { focusKey: keyOf(at, 'mediaType') }), 'mediaType');
        add(t('editor.sortBy'), bind(select(TMDB_SORTS.map(v => ({ value: v, label: t(`editor.sort.${v}`) })), s.sortBy ?? 'popularity.desc'), s, 'sortBy', { focusKey: keyOf(at, 'sortBy') }), 'sortBy');
        add(t('editor.label'), bind(input({ value: s.title ?? '' }), s, 'title', { parse: nullable, focusKey: keyOf(at, 'title') }), 'title', { optional: true, hint: t('editor.labelHint') });
      }
      return h('li', { class: 'source' },
        h('div', { class: 'source-head' }, field({ label: t('editor.sourceN', { n: si + 1 }), control: provider }),
          iconButton('trash', t('editor.sourceRemove', { n: si + 1 }), () => { f.sources.splice(si, 1); draw(); announce(t('editor.sourceRemoved')); })),
        h('div', { class: 'grid-2' }, fields));
    }

    function urlField(target, prop, at, label, shape) {
      const control = bind(input({ type: 'url', value: target[prop] ?? '', placeholder: 'https://', spellcheck: 'false' }), target, prop, { parse: nullable, focusKey: keyOf(at, prop) });
      const box = h('div', { class: ['art-box', `art-${shape}`] }, h('span', { class: 'muted small' }, t('editor.art.none')));
      const show = button(t('editor.art.preview'), { size: 's', icon: 'eye', onClick: () => {
        const value = control.value.trim();
        let ok = false;
        try { ok = new URL(value).protocol === 'https:'; } catch { ok = false; }
        if (!ok) { replace(box, h('span', { class: 'muted small' }, t('issue.https'))); return; }
        const img = h('img', { src: value, alt: t('editor.art.alt', { label }), referrerpolicy: 'no-referrer', decoding: 'async' });
        img.addEventListener('error', () => replace(box, h('span', { class: 'muted small' }, t('editor.art.failed'))));
        replace(box, img);
      } });
      const wrap = field({ label, control, optional: true, error: errFor(at, prop) });
      return h('div', { class: 'art-row' }, wrap, h('div', { class: 'art-preview' }, box, show));
    }

    // A small, image-free sketch of how the collection will be laid out in the app.
    function preview(c, large = false) {
      const folders = c?.folders ?? [];
      const mode = String(c?.viewMode ?? 'TABBED_GRID').toUpperCase();
      const tile = f => h('span', { class: ['pv-tile', `pv-${String(f?.tileShape ?? 'poster').toLowerCase()}`] }, f?.coverEmoji ?? '');
      const head = h('p', { class: 'pv-title' }, c?.pinToTop ? icon('up', { size: 12, label: t('coll.pinned') }) : null, c?.title || t('coll.untitled'));
      let bodyEl;
      if (!folders.length) bodyEl = h('p', { class: 'muted small' }, t('editor.noFolders'));
      else if (mode === 'TABBED_GRID') {
        bodyEl = h('div', {}, h('div', { class: 'pv-tabs' }, c.showAllTab !== false ? h('span', { class: 'pv-tab pv-tab-on' }, t('editor.allTab')) : null,
          folders.map((f, i) => h('span', { class: ['pv-tab', c.showAllTab === false && i === 0 && 'pv-tab-on'] }, f.hideTitle ? '•' : f.title || '—'))),
        h('div', { class: 'pv-grid' }, Array.from({ length: large ? 8 : 4 }, (_, i) => tile(folders[i % folders.length]))));
      } else {
        bodyEl = h('div', { class: 'pv-rows' }, folders.slice(0, large ? 6 : 3).map(f => h('div', { class: 'pv-row' },
          h('span', { class: 'pv-row-title' }, f.hideTitle ? '' : f.title || '—'), h('div', { class: 'pv-strip' }, Array.from({ length: large ? 6 : 4 }, () => tile(f))))));
      }
      return h('figure', { class: ['pv', large && 'pv-large'] }, head, bodyEl,
        h('figcaption', { class: 'muted small' }, mode === 'FOLLOW_LAYOUT' ? t('editor.previewFollow') : t('editor.previewNote')));
    }

    // ---------------------------------------------------------------- saving
    async function save() {
      const errors = myIssues().filter(i => i.level === 'error');
      if (errors.length) {
        showErrors = true;
        step = 'review';
        draw('step');
        messages.replaceChildren(notice({ tone: 'danger', live: true, title: t('coll.cannotSave', { n: errors.length }) }));
        return;
      }
      busy = true; drawFooter();
      try {
        await ctx.api.saveBlob(ctx.profileId, 'collections', null, normalize(fullList()), revision, { signal: ctx.signal });
        pristine = clone(draft);
        announce(t('editor.saved', { name: draft.title }));
        ctx.navigate('/collections', { force: true });
      } catch (error) {
        busy = false; drawFooter();
        if (isConflict(error)) return conflict();
        if (error.kind === 'auth' || error.kind === 'aborted') return;
        messages.replaceChildren(errorState(error, { onRetry: save }));
      }
    }

    async function conflict() {
      try {
        const latest = await ctx.api.blob(ctx.profileId, 'collections', null, { signal: ctx.signal });
        const theirsList = Array.isArray(latest.value) ? latest.value : [];
        const theirs = theirsList.find(c => c.id === draft.id) ?? null;
        list = theirsList; revision = latest.revision;
        index = theirsList.findIndex(c => c.id === draft.id);
        const changedHere = original && theirs && !equal(theirs, original);
        const deletedThere = original && !theirs;
        let body = t('editor.conflictReapplied');
        const actions = [];
        if (changedHere) {
          body = t('editor.conflictSame');
          actions.push(button(t('editor.useTheirs'), { onClick: () => { draft = clone(theirs); original = clone(theirs); pristine = clone(theirs); messages.replaceChildren(); draw('step'); announce(t('editor.usedTheirs')); } }));
          actions.push(h('details', { class: 'compare' }, h('summary', {}, t('conflict.compare')), h('div', { class: 'compare-grid' },
            h('div', {}, h('h4', {}, t('conflict.theirs')), preview(theirs)), h('div', {}, h('h4', {}, t('conflict.yours')), preview(draft)))));
        }
        if (deletedThere) body = t('editor.conflictDeleted');
        original = theirs ? clone(theirs) : original;
        messages.replaceChildren(notice({ tone: 'warn', live: true, title: t('conflict.title'), body, actions }));
        step = 'review'; draw('step');
      } catch (error) {
        if (error.kind !== 'auth' && error.kind !== 'aborted') messages.replaceChildren(errorState(error, { onRetry: conflict }));
      }
    }

    load();
    return h('section', { class: 'page page-wide' },
      h('header', { class: 'page-head' }, h('div', { class: 'page-head-text' },
        link(t('nav.collections'), '/collections', { icon: 'back' }), h('p', { class: 'eyebrow' }, t('common.profileEyebrow', { name: ctx.profile.name })), heading,
        h('p', { class: 'lede' }, t('editor.lede')))),
      readOnlyNotice(ctx), messages, host);
  },
};
