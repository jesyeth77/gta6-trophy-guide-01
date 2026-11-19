// Leonida Trophy Guide — GTA VI PS5 trophy tracker (offline, localStorage only).
// Own code for this entry: loads app/data/trophies.json, renders the checklist,
// the roadmap, the missables page and one trophy's guide at a time.
const STORE_KEY = 'leonida-trophy-guide-v1';
const SPOILER_KEY = 'leonida-trophy-guide-spoilers';

const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detail');
const hintEl = document.getElementById('listHint');
const emptyEl = document.getElementById('emptyMsg');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const missableOnlyEl = document.getElementById('missableOnly');
const hideEarnedEl = document.getElementById('hideEarned');
const spoilersEl = document.getElementById('spoilers');

let trophies = [];
let earned = new Set(loadEarned());
let selectedId = null;
let spoilersOn = loadSpoilers();

function loadEarned() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]'); } catch { return []; }
}
function loadSpoilers() {
  const v = localStorage.getItem(SPOILER_KEY);
  return v === null ? true : v === '1';
}
function saveEarned() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned]));
}
function saveSpoilers() {
  localStorage.setItem(SPOILER_KEY, spoilersOn ? '1' : '0');
}

const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = {
  story: 'Story', side: 'Side strand', activity: 'Activity', collectible: 'Collectible',
  combat: 'Combat & crime', money: 'Money', misc: 'Misc', completion: 'Completion',
};
const STAGES = [
  { n: 1, title: 'Stage 1 — Play the story', body: 'Chapters 1–4, the named story missions and the final mission. Just follow the main missions in order; every chapter and mission trophy lands on completion. Take the Ocean Beach cocktail trophy while you are near the beach in this stage.', ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 44] },
  { n: 2, title: 'Stage 2 — Side strands & partners', body: 'Finish the stranger strands and the named side characters (Andy, Kenton, Billy, Randy, Tyrone, Bret). Do the partner trophies on purpose — 4-star escape with your partner, and 3 shops in a row with your partner — while strands are fresh.', ids: [22, 23, 24, 25, 26, 27, 29, 33, 34, 47, 48, 49] },
  { n: 3, title: 'Stage 3 — Activities & skills', body: 'Try all 9 activity types, gold the 42 Shooting Range challenges, win the 14 drone races and 20 races, meditate at 18 spots, bowl at Kolt & Associates, and land the one-shot combat trophies (5 in one Combat Focus, the VCIA departure, the stealth jewelry robbery, the melee drive-by).', ids: [15, 16, 17, 18, 19, 20, 21, 28, 36, 37, 38, 39, 45, 46, 51] },
  { n: 4, title: 'Stage 4 — Collectibles & exploration', body: 'Explore all 52 areas, discover 100 vehicles, WAiNK It at 100 locations, complete 3 card sets, rob one illegal operation per gang, and clear 50 challenges. This is the long open-world sweep — do it area by area so nothing is left behind.', ids: [30, 31, 32, 35, 40, 41, 42, 43, 50] },
  { n: 5, title: 'Stage 5 — Money clean-up & the platinum', body: 'Launder $250,000 of Marked Bills, spend $100,000 in shops, buy all 8 garages and register 10 vehicles in the Scooter Bros app. When the last of these pops, 100% completion and the platinum follow.', ids: [1, 14, 52, 53, 54, 55] },
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

function gradeCounts() {
  const c = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (earned.has(t.name)) c[t.grade] += 1;
  return c;
}
function renderProgress() {
  const c = gradeCounts();
  document.getElementById('earnedCount').textContent = earned.size;
  document.getElementById('barFill').style.width = `${Math.round((earned.size / trophies.length) * 100)}%`;
  document.getElementById('progressLine').textContent =
    `${Math.round((earned.size / trophies.length) * 100)}% to the platinum · ${c.platinum} of 1 platinum, ${c.gold} of 2 gold, ${c.silver} of 6 silver, ${c.bronze} of 46 bronze`;
  document.getElementById('missCount').textContent = trophies.filter((t) => t.missable).length;
}

function visibleTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kindEl.value !== 'all' && t.kind !== kindEl.value) return false;
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (missableOnlyEl.checked && !t.missable) return false;
    if (hideEarnedEl.checked && earned.has(t.name)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.guide || '').toLowerCase().includes(q))) return false;
    return true;
  });
}

function tag(text, cls) {
  const s = document.createElement('span');
  s.className = `tag ${cls}`;
  s.textContent = text;
  return s;
}

function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    if (earned.has(t.name)) li.classList.add('earned');
    if (selectedId === t.id) li.classList.add('selected');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      saveEarned();
      renderAll();
    });
    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'tname';
    name.textContent = trophyLabel(t);
    const desc = document.createElement('div');
    desc.className = 'tdesc';
    desc.textContent = trophyDesc(t);
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.append(tag(GRADE_LABEL[t.grade], t.grade), tag(KIND_LABEL[t.kind] || t.kind, ''));
    if (t.hidden) meta.append(tag('Hidden on PSN', 'hidden'));
    if (t.missable) meta.append(tag('Missable', 'miss'));
    if (t.target) meta.append(tag(`Target: ${t.target}`, ''));
    body.append(name, desc, meta);
    li.append(box, body);
    li.addEventListener('click', () => { selectedId = t.id; renderAll(); });
    listEl.append(li);
  }
  emptyEl.hidden = shown.length > 0;
  hintEl.textContent = `Showing ${shown.length} of ${trophies.length} trophies · ${earned.size} earned · ${trophies.filter((t) => t.missable).length} missable flagged`;
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) {
    detailEl.innerHTML = '<p class="detail-empty">Pick a trophy on the left to read its guide — what to do, where, when it can be missed, and its sources.</p>';
    return;
  }
  detailEl.replaceChildren();
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.append(tag(GRADE_LABEL[t.grade], t.grade), tag(KIND_LABEL[t.kind] || t.kind, ''));
  if (t.hidden) meta.append(tag('Hidden on PSN', 'hidden'));
  if (t.missable) meta.append(tag('Missable', 'miss'));
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
    w.textContent = '⚠ Missable — do this one on purpose, in one clean attempt. See the guide below for the exact set-up.';
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
  detailEl.append(gh, g, sh, s);
}

function renderRoadmap() {
  const ol = document.getElementById('roadmap');
  ol.replaceChildren();
  for (const st of STAGES) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = st.title;
    const p = document.createElement('p');
    p.textContent = st.body;
    const done = st.ids.filter((id) => { const t = trophies.find((x) => x.id === id); return t && earned.has(t.name); }).length;
    const c = document.createElement('p');
    c.className = 'stage-count';
    c.textContent = `${done} of ${st.ids.length} trophies in this stage earned`;
    const names = document.createElement('p');
    names.textContent = st.ids.map((id) => { const t = trophies.find((x) => x.id === id); return t ? (earned.has(t.name) ? `✓ ${t.name}` : t.name) : ''; }).join(' · ');
    li.append(h, p, c, names);
    ol.append(li);
  }
}

function renderMissables() {
  const ul = document.getElementById('missableList');
  ul.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const li = document.createElement('li');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      saveEarned();
      renderAll();
    });
    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'tname';
    name.textContent = t.name;
    const desc = document.createElement('div');
    desc.className = 'tdesc';
    desc.textContent = t.guide || t.description;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.append(tag(GRADE_LABEL[t.grade], t.grade), tag('Missable', 'miss'));
    body.append(name, desc, meta);
    li.append(box, body);
    li.addEventListener('click', () => { selectedId = t.id; showView('checklist'); renderAll(); });
    ul.append(li);
  }
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function showView(name) {
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  document.getElementById('roadmapView').hidden = name !== 'roadmap';
  document.getElementById('missablesView').hidden = name !== 'missables';
  document.getElementById('aboutView').hidden = name !== 'about';
  const listMode = name === 'checklist';
  document.getElementById('listWrap').hidden = !listMode;
  document.getElementById('detail').hidden = !listMode;
  document.getElementById('controls').style.display = listMode ? '' : 'none';
}
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));

for (const el of [searchEl, kindEl, gradeEl, missableOnlyEl, hideEarnedEl]) {
  el.addEventListener('input', renderList);
  el.addEventListener('change', renderList);
}
spoilersEl.checked = spoilersOn;
spoilersEl.addEventListener('change', () => { spoilersOn = spoilersEl.checked; saveSpoilers(); renderAll(); });

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned], exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
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
    saveEarned();
    renderAll();
  } catch { alert('That file is not a valid progress export.'); }
  e.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies?')) { earned = new Set(); saveEarned(); renderAll(); }
});

// Deep links for screenshots and sharing: #roadmap, #missables, #about, #trophy-<id>.
// ?spoilers=off turns the spoiler setting off on load (used by screenshots).
function applyHash() {
  const params = new URLSearchParams(location.search);
  if (params.get('spoilers') === 'off') { spoilersOn = false; spoilersEl.checked = false; saveSpoilers(); }
  const h = location.hash.replace(/^#/, '');
  if (h === 'roadmap' || h === 'missables' || h === 'about') showView(h);
  else if (h.startsWith('trophy-')) {
    const id = Number(h.slice('trophy-'.length));
    if (trophies.some((t) => t.id === id)) { selectedId = id; showView('checklist'); }
  }
}

const data = await (await fetch('data/trophies.json')).json();
trophies = data.trophies;
applyHash();
renderAll();
