// Leonida Trophy Guide v2 — GTA VI PS5 trophy tracker (offline, localStorage only).
// Loads app/data/trophies.json, renders the checklist, the Next Up planner, the
// roadmap, the missables page and one trophy's guide at a time. Progress and
// personal notes never leave the browser; export/import carry both.
const STORE_KEY = 'leonida-trophy-guide-v2';
const NOTES_KEY = 'leonida-trophy-guide-v2-notes';
const SPOILER_KEY = 'leonida-trophy-guide-v2-spoilers';

const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detail');
const hintEl = document.getElementById('listHint');
const emptyEl = document.getElementById('emptyMsg');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const sortEl = document.getElementById('sort');
const missableOnlyEl = document.getElementById('missableOnly');
const hideEarnedEl = document.getElementById('hideEarned');
const spoilersEl = document.getElementById('spoilers');

let trophies = [];
let earned = new Set(loadJson(STORE_KEY));
let notes = loadNotes();
let selectedId = null;
let spoilersOn = loadSpoilers();

function loadJson(key) {
  try { const v = JSON.parse(localStorage.getItem(key) ?? '[]'); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
function loadNotes() {
  try { const v = JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}'); return v && typeof v === 'object' ? v : {}; }
  catch { return {}; }
}
function loadSpoilers() {
  const v = localStorage.getItem(SPOILER_KEY);
  return v === null ? true : v === '1';
}
function saveEarned() { localStorage.setItem(STORE_KEY, JSON.stringify([...earned])); }
function saveNotes() { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); }
function saveSpoilers() { localStorage.setItem(SPOILER_KEY, spoilersOn ? '1' : '0'); }

const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const GRADE_TOTAL = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
const GRADE_RANK = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const KIND_LABEL = {
  story: 'Story', side: 'Side strand', activity: 'Activity', collectible: 'Collectible',
  combat: 'Combat & crime', money: 'Money', misc: 'Misc', completion: 'Completion',
};
// Roadmap stages, built from the official descriptions only. `effort` is our own
// plain-language estimate (short / medium / long grind) from the trophy counts.
const STAGES = [
  { n: 1, title: 'Stage 1 — Play the story', effort: 'Long — one full playthrough, in mission order', body: 'Chapters 1–4, the named story missions and the final mission. Just follow the main missions in order; every chapter and mission trophy lands on completion. While you are near the beach in this stage, take the Ocean Beach cocktail trophy too — it is missable.', ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 44] },
  { n: 2, title: 'Stage 2 — Side strands & partners', effort: 'Medium — stranger strands and partner set-ups', body: 'Finish the stranger strands and the named side characters (Andy, Kenton, Billy, Randy, Tyrone, Bret). Do the partner trophies on purpose — lose a 4-star Wanted Level with your partner, and rob 3 shops in a row with your partner — while strands are fresh.', ids: [22, 23, 24, 25, 26, 27, 29, 33, 34, 47, 48, 49] },
  { n: 3, title: 'Stage 3 — Activities & skills', effort: 'Long — the grindiest stage: 250 stunts, 42 range challenges', body: 'Try all 9 activity types, gold all 42 Shooting Range challenges, win the 14 drone races and 20 races, meditate at 18 spots, bowl at Kolt & Associates, and land the one-shot combat trophies (5 in one Combat Focus, the VCIA departure, the stealth jewelry robbery, the melee drive-by).', ids: [15, 16, 17, 18, 19, 20, 21, 28, 36, 37, 38, 39, 45, 46, 51] },
  { n: 4, title: 'Stage 4 — Collectibles & exploration', effort: 'Long — a full open-world sweep, area by area', body: 'Explore all 52 areas, discover 100 vehicles, WAiNK It at 100 locations, complete 3 card sets, rob one illegal operation per gang, and clear 50 challenges. Do it area by area so nothing is left behind.', ids: [30, 31, 32, 35, 40, 41, 42, 43, 50] },
  { n: 5, title: 'Stage 5 — Money clean-up & the platinum', effort: 'Medium — cash targets, then the platinum pops', body: 'Launder $250,000 of Marked Bills, spend $100,000 in shops, buy all 8 garages and register 10 vehicles in the Scooter Bros app. When the last of these pops, 100% completion and the platinum follow.', ids: [1, 14, 52, 53, 54, 55] },
];

function isStoryHidden(t) {
  return spoilersOn && t.kind === 'story' && !earned.has(t.name);
}
function trophyLabel(t) {
  return isStoryHidden(t) ? 'Hidden story trophy — earn it to reveal its name' : t.name;
}
function trophyDesc(t) {
  return isStoryHidden(t) ? 'Spoiler hidden until earned. Turn “Hide story spoilers” off to read it.' : t.description;
}
function hasNote(t) { return Boolean((notes[t.name] || '').trim()); }

function gradeCounts() {
  const c = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (earned.has(t.name)) c[t.grade] += 1;
  return c;
}
function renderProgress() {
  const c = gradeCounts();
  const pct = trophies.length ? Math.round((earned.size / trophies.length) * 100) : 0;
  document.getElementById('earnedCount').textContent = earned.size;
  document.getElementById('barFill').style.width = `${pct}%`;
  document.getElementById('progressLine').textContent =
    `${pct}% to the platinum · ${c.platinum} of 1 platinum, ${c.gold} of 2 gold, ${c.silver} of 6 silver, ${c.bronze} of 46 bronze`;
  const bars = document.getElementById('gradeBars');
  bars.replaceChildren();
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const li = document.createElement('li');
    const label = document.createElement('span');
    const dot = document.createElement('span');
    dot.className = `dot ${g}`;
    label.append(dot, document.createTextNode(GRADE_LABEL[g]));
    const track = document.createElement('span');
    track.className = 'mini';
    const fill = document.createElement('i');
    fill.style.width = `${Math.round((c[g] / GRADE_TOTAL[g]) * 100)}%`;
    track.append(fill);
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = `${c[g]} / ${GRADE_TOTAL[g]}`;
    li.append(label, track, num);
    bars.append(li);
  }
  document.getElementById('missCount').textContent = trophies.filter((t) => t.missable).length;
}

function sortedTrophies(list) {
  const out = [...list];
  if (sortEl.value === 'grade') out.sort((a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || a.id - b.id);
  else if (sortEl.value === 'name') out.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortEl.value === 'kind') out.sort((a, b) => a.kind.localeCompare(b.kind) || a.id - b.id);
  else out.sort((a, b) => a.id - b.id);
  return out;
}

function visibleTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  return sortedTrophies(trophies.filter((t) => {
    if (kindEl.value !== 'all' && t.kind !== kindEl.value) return false;
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (missableOnlyEl.checked && !t.missable) return false;
    if (hideEarnedEl.checked && earned.has(t.name)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.guide || '').toLowerCase().includes(q))) return false;
    return true;
  }));
}

function tag(text, cls) {
  const s = document.createElement('span');
  s.className = `tag ${cls}`;
  s.textContent = text;
  return s;
}
function toggleEarned(t, on) {
  if (on) earned.add(t.name); else earned.delete(t.name);
  saveEarned();
  renderAll();
}
function trophyRow(t, showGuide) {
  const li = document.createElement('li');
  if (earned.has(t.name)) li.classList.add('earned');
  if (selectedId === t.id) li.classList.add('selected');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.name);
  box.setAttribute('aria-label', `Earned: ${t.name}`);
  box.addEventListener('click', (e) => e.stopPropagation());
  box.addEventListener('change', () => toggleEarned(t, box.checked));
  const body = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'tname';
  name.textContent = trophyLabel(t);
  const desc = document.createElement('div');
  desc.className = 'tdesc';
  desc.textContent = showGuide && !isStoryHidden(t) ? (t.guide || t.description) : trophyDesc(t);
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.append(tag(GRADE_LABEL[t.grade], t.grade), tag(KIND_LABEL[t.kind] || t.kind, ''));
  if (t.hidden) meta.append(tag('Hidden on PSN', 'hidden'));
  if (t.missable) meta.append(tag('Missable', 'miss'));
  if (t.target) meta.append(tag(`Target: ${t.target}`, ''));
  if (hasNote(t)) meta.append(tag('Note saved', 'note'));
  body.append(name, desc, meta);
  li.append(box, body);
  li.addEventListener('click', () => { selectedId = t.id; renderAll(); });
  return li;
}

function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  for (const t of shown) listEl.append(trophyRow(t, false));
  emptyEl.hidden = shown.length > 0;
  hintEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies · ${earned.size} earned · ${trophies.filter((t) => t.missable).length} missable flagged · ${Object.keys(notes).filter((k) => (notes[k] || '').trim()).length} notes saved`;
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId);
  detailEl.replaceChildren();
  if (!t) {
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Pick a trophy on the left to read its guide — what to do, where, when it can be missed, and its sources. You can also jot a personal note on any trophy; notes stay in your browser.';
    detailEl.append(p);
    return;
  }
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.append(tag(GRADE_LABEL[t.grade], t.grade), tag(KIND_LABEL[t.kind] || t.kind, ''));
  if (t.hidden) meta.append(tag('Hidden on PSN', 'hidden'));
  if (t.missable) meta.append(tag('Missable', 'miss'));
  if (t.target) meta.append(tag(`Target: ${t.target}`, ''));
  const h = document.createElement('h2');
  h.textContent = trophyLabel(t);
  const od = document.createElement('p');
  od.className = 'odesc';
  od.textContent = `Official description: “${t.description}”`;
  detailEl.append(meta, h, od);
  if (isStoryHidden(t)) {
    const p = document.createElement('p');
    p.textContent = 'Guide hidden with the spoiler setting — earn this trophy, or turn “Hide story spoilers” off, to read its guide.';
    detailEl.append(p);
    return;
  }
  if (t.missable) {
    const w = document.createElement('p');
    w.className = 'warn';
    w.textContent = 'Missable — do this one on purpose, in one clean attempt. See the guide below for the exact set-up.';
    detailEl.append(w);
  }
  const gh = document.createElement('h3');
  gh.textContent = 'Guide';
  const g = document.createElement('p');
  g.textContent = t.guide || 'No guide yet.';
  const sh = document.createElement('h3');
  sh.textContent = 'Sources';
  const s = document.createElement('p');
  s.className = 'src';
  s.textContent = `Name, description and grade: official trophy list on Exophase. ${t.target ? `PSN target (${t.target}): PSNProfiles. ` : ''}Guide text: our own words from the official description — not copied from any other guide. ${t.sources || ''}`;
  const earnBtn = document.createElement('button');
  earnBtn.type = 'button';
  earnBtn.className = 'earnBtn';
  earnBtn.textContent = earned.has(t.name) ? '✓ Earned — tap to unmark' : 'Mark as earned';
  earnBtn.addEventListener('click', () => toggleEarned(t, !earned.has(t.name)));
  const nh = document.createElement('h3');
  nh.textContent = 'My note';
  const area = document.createElement('textarea');
  area.value = notes[t.name] || '';
  area.placeholder = 'e.g. where you found it, what loadout worked… (saved in this browser only)';
  area.setAttribute('aria-label', `Personal note for ${t.name}`);
  const saved = document.createElement('p');
  saved.className = 'note-saved';
  area.addEventListener('input', () => {
    const v = area.value.trim();
    if (v) notes[t.name] = area.value; else delete notes[t.name];
    saveNotes();
    saved.textContent = 'Note saved in this browser.';
    renderList();
  });
  detailEl.append(gh, g, sh, s, earnBtn, nh, area, saved);
}

// Next Up: the three easiest un-earned trophies. Missables jump the queue so
// their moment is never missed; inside each group, bronze beats silver beats
// gold, and short jobs (low id / early roadmap stage) beat long grinds.
function nextUpPicks() {
  const left = trophies.filter((t) => !earned.has(t.name) && t.grade !== 'platinum');
  const score = (t) => (t.missable ? 0 : 1) * 100 + GRADE_RANK[t.grade] * 10 + (t.stage || 5);
  return [...left].sort((a, b) => score(a) - score(b)).slice(0, 3);
}
function renderNextUp() {
  const ol = document.getElementById('nextup');
  ol.replaceChildren();
  const picks = nextUpPicks();
  for (const t of picks) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = trophyLabel(t);
    const p = document.createElement('p');
    p.textContent = t.guide || t.description;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.append(tag(GRADE_LABEL[t.grade], t.grade), tag(KIND_LABEL[t.kind] || t.kind, ''));
    if (t.missable) meta.append(tag('Missable — do it now', 'miss'));
    li.append(h, p, meta);
    li.addEventListener('click', () => { selectedId = t.id; showView('checklist'); renderAll(); });
    ol.append(li);
  }
  document.getElementById('nextupNote').textContent = earned.size >= trophies.length
    ? 'Everything is earned — the platinum is yours. Leonida Legend.'
    : `${trophies.length - earned.size} trophies left. Missables are pulled forward on purpose: a missed one can cost a whole replay.`;
}

function renderRoadmap() {
  const ol = document.getElementById('roadmap');
  ol.replaceChildren();
  for (const st of STAGES) {
    const li = document.createElement('li');
    const done = st.ids.filter((id) => { const t = trophies.find((x) => x.id === id); return t && earned.has(t.name); }).length;
    if (done === st.ids.length) li.classList.add('done');
    const h = document.createElement('h3');
    h.textContent = st.title;
    const p = document.createElement('p');
    p.textContent = st.body;
    const eff = document.createElement('p');
    eff.className = 'effort';
    eff.textContent = `Effort: ${st.effort}`;
    const c = document.createElement('p');
    c.className = 'stage-count';
    c.textContent = done === st.ids.length ? `✓ Stage complete — ${done} of ${st.ids.length} earned` : `${done} of ${st.ids.length} trophies in this stage earned`;
    const names = document.createElement('p');
    names.textContent = st.ids.map((id) => { const t = trophies.find((x) => x.id === id); return t ? (earned.has(t.name) ? `✓ ${t.name}` : t.name) : ''; }).join(' · ');
    li.append(h, p, eff, c, names);
    ol.append(li);
  }
}

function renderMissables() {
  const ul = document.getElementById('missableList');
  ul.replaceChildren();
  const ordered = trophies.filter((x) => x.missable).sort((a, b) => (earned.has(a.name) ? 1 : 0) - (earned.has(b.name) ? 1 : 0) || a.id - b.id);
  for (const t of ordered) ul.append(trophyRow(t, true));
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderNextUp();
  renderRoadmap();
  renderMissables();
}

function showView(name) {
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  document.getElementById('nextupView').hidden = name !== 'nextup';
  document.getElementById('roadmapView').hidden = name !== 'roadmap';
  document.getElementById('missablesView').hidden = name !== 'missables';
  document.getElementById('aboutView').hidden = name !== 'about';
  const listMode = name === 'checklist';
  document.getElementById('listWrap').hidden = !listMode;
  document.getElementById('detail').hidden = !listMode;
  document.getElementById('controls').style.display = listMode ? '' : 'none';
}
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));

for (const el of [searchEl, kindEl, gradeEl, sortEl, missableOnlyEl, hideEarnedEl]) {
  el.addEventListener('input', renderList);
  el.addEventListener('change', renderList);
}
spoilersEl.checked = spoilersOn;
spoilersEl.addEventListener('change', () => { spoilersOn = spoilersEl.checked; saveSpoilers(); renderAll(); });
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== searchEl && document.activeElement?.tagName !== 'TEXTAREA') {
    e.preventDefault();
    showView('checklist');
    searchEl.focus();
  }
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned], notes, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set((names || []).filter((n) => known.has(n)));
    if (data && typeof data === 'object' && data.notes && typeof data.notes === 'object') {
      notes = {};
      for (const [k, v] of Object.entries(data.notes)) if (known.has(k) && typeof v === 'string') notes[k] = v;
      saveNotes();
    }
    saveEarned();
    renderAll();
  } catch { alert('That file is not a valid progress export.'); }
  e.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies and notes?')) { earned = new Set(); notes = {}; saveEarned(); saveNotes(); renderAll(); }
});

// Deep links for screenshots and sharing: #nextup, #roadmap, #missables, #about, #trophy-<id>.
// ?spoilers=off turns the spoiler setting off on load (used by screenshots).
function applyHash() {
  const params = new URLSearchParams(location.search);
  if (params.get('spoilers') === 'off') { spoilersOn = false; spoilersEl.checked = false; saveSpoilers(); }
  const h = location.hash.replace(/^#/, '');
  if (h === 'nextup' || h === 'roadmap' || h === 'missables' || h === 'about') showView(h);
  else if (h.startsWith('trophy-')) {
    const id = Number(h.slice('trophy-'.length));
    if (trophies.some((t) => t.id === id)) { selectedId = id; showView('checklist'); }
  }
}

const data = await (await fetch('data/trophies.json')).json();
trophies = data.trophies;
applyHash();
renderAll();
