// app.js — all UI + state logic
import { supabase } from './supabase.js';
import { fetchItems, insertItem, updateItem, deleteItemDb, deleteAllItems, fetchGenres, insertGenre, insertGenresBulk, migrateFromLocalStorage } from './db.js';
import { logout, getUser } from './auth.js';

// ======= ICONS =======
const I = {
  plus: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>`,
  download: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  upload: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  scan: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
  trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`,
  edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  notes: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  logout: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  link: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  image: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  search: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
};

// ======= STATE =======
const DEFAULT_GENRES = ['Action','Romance','Fantasy','Isekai','Historical','System','Regression','Reincarnation','Martial Arts','School','Horror','Comedy','Mystery','Sci-Fi','Slice of Life','Dungeon','Villainess','Murim','Hunter'];
const STATUSES = ['Reading','Completed','Plan to Read','On Hold','Dropped'];
const COVERS = ['🐉','⚔️','🌸','👊','💀','🔮','🗡️','🌙','🔥','🌊','⚡','🦊','🏯','👁️','🧬','🗺️','💎','🎭','🧿','🐺'];

const GENRE_EMOJI = {'Action':'⚔️','Romance':'💕','Fantasy':'🔮','Isekai':'🌀','Historical':'🏯','System':'💻','Regression':'⏪','Reincarnation':'♻️','Martial Arts':'👊','School':'🏫','Horror':'💀','Comedy':'😂','Mystery':'🔍','Sci-Fi':'🚀','Slice of Life':'☕','Dungeon':'🐉','Villainess':'👑','Murim':'🥋','Hunter':'🗡️'};
const TITLE_EMOJI = [[/dragon|naga/i,'🐉'],[/sword|pedang|blade/i,'⚔️'],[/flower|bunga|sakura/i,'🌸'],[/death|mati|dead/i,'💀'],[/magic|sorcerer|wizard|witch/i,'🔮'],[/moon|bulan/i,'🌙'],[/fire|api|flame/i,'🔥'],[/water|ocean|laut|sea/i,'🌊'],[/wolf|serigala/i,'🐺'],[/princess|putri/i,'👑'],[/villain|villainess/i,'🗡️'],[/husband|wife|marriage|wedding|nikah/i,'💍'],[/baby|child|anak/i,'👶'],[/cat|kucing/i,'🐱'],[/hunter|hunt/i,'🗡️'],[/dungeon|tower/i,'🏰'],[/school|sekolah/i,'🏫'],[/duke|earl|count|lord/i,'🎩'],[/love|cinta/i,'❤️'],[/game|player|level/i,'🎮']];
function autoEmoji(title, genres) {
  for (const g of (genres||[])) if (GENRE_EMOJI[g]) return GENRE_EMOJI[g];
  for (const [rx, em] of TITLE_EMOJI) if (rx.test(title)) return em;
  return COVERS[Math.floor(Math.random() * COVERS.length)];
}

let state = { items: [], genres: [], user: null };
let filter = 'all';
let sortBy = 'added';
let genreFilter = null;
let editingId = null;
let modalRating = 0;
let modalGenres = [];
let modalAltTitles = [];
let modalCoverImage = null;
let modalLinks = [];
let notesModalItemId = null;
let deleteAllStep = 0, deleteAllTimer = null;

// ======= INIT =======
export async function initApp(user) {
  state.user = user;
  try {
    const [items, genres] = await Promise.all([
      fetchItems(user.id),
      fetchGenres(user.id)
    ]);
    // merge default genres if user has none
    state.genres = genres.length ? genres : [...DEFAULT_GENRES];
    state.items = items;
  } catch(e) {
    console.error('Load error:', e);
    showToast('Gagal memuat data dari server.');
    state.genres = [...DEFAULT_GENRES];
    state.items = [];
  }

  renderTopbar(user);
  renderUI();
  setupKeyboard();
}

export function checkAndShowMigrateBanner() {
  try {
    const raw = localStorage.getItem('manhwa-tracker-v2');
    if (!raw) return;
    const local = JSON.parse(raw);
    if (local?.items?.length > 0 && state.items.length === 0) {
      document.getElementById('migrateBanner').style.display = 'flex';
    }
  } catch(e) {}
}

// ======= TOPBAR =======
function renderTopbar(user) {
  const email = user.email || '';
  const initial = email[0].toUpperCase();
  document.getElementById('topbar').innerHTML = `
    <div class="topbar-left">
      <div class="topbar-logo">${I.notes}</div>
      <div>
        <div class="topbar-title">Reading Tracker</div>
        <div class="topbar-sub">Manhwa · Manga · Manhua</div>
      </div>
    </div>
    <div class="topbar-right" id="topbarRight">
      <button class="btn-primary" onclick="window._openModal()">${I.plus} Tambah</button>
      <button class="btn-icon" onclick="window._exportData()" title="Export JSON">${I.download}</button>
      <label class="btn-icon" title="Import JSON" style="cursor:pointer;">${I.upload}<input type="file" accept=".json" onchange="window._importData(event)" style="display:none" /></label>
      <button class="btn-icon accent" onclick="window._openScanModal()" title="Scan Screenshot">${I.scan}</button>
      <button class="btn-danger-sm" id="deleteAllBtn" onclick="window._deleteAll()" title="Hapus semua">${I.trash}</button>
      <div class="user-chip" onclick="window._logout()" title="Logout: ${email}">
        <div class="user-avatar">${initial}</div>
        <span class="user-email">${email}</span>
        ${I.logout}
      </div>
    </div>
  `;
}

// ======= GLOBAL BINDINGS (needed for inline onclick) =======
window._openModal = (id) => openModal(id);
window._exportData = exportData;
window._importData = importData;
window._openScanModal = openScanModal;
window._deleteAll = deleteAll;
window._logout = async () => { await logout(); };
window._setFilter = setFilter;
window._setGenreFilter = setGenreFilter;
window._updateChapter = updateChapter;
window._updateStatus = updateStatus;
window._setRating = setRating;
window._deleteItem = deleteItem;
window._openNotesModal = openNotesModal;
window._closeModal = closeModal;
window._closeNotesModal = closeNotesModal;
window._saveItem = saveItem;
window._saveNotesModal = saveNotesModal;
window._toggleModalGenre = toggleModalGenre;
window._addNewGenre = addNewGenre;
window._addAltTitle = addAltTitle;
window._removeAltTitle = removeAltTitle;
window._setModalRating = setModalRating;
window._addModalLink = addModalLink;
window._removeModalLink = removeModalLink;
window._handleCoverUpload = handleCoverUpload;
window._removeCoverImage = removeCoverImage;
window._handleScanDrop = handleScanDrop;
window._handleScanFiles = handleScanFiles;
window._resetScan = resetScan;
window._closeScanModal = closeScanModal;
window._confirmScanImport = confirmScanImport;
window._render = () => render();
window._setSortBy = (v) => { sortBy = v; render(); };
window._closeNotesModalNoSave = () => { document.getElementById('notesModalBackdrop').classList.remove('open'); };
window._handleMigrate = handleMigrate;

// ======= TOAST =======
export function showToast(msg, icon = I.check) {
  const t = document.getElementById('toast');
  t.innerHTML = `${icon}<span>${msg}</span>`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ======= RENDER =======
function renderUI() {
  renderStats();
  renderGenreFilter();
  render();
}

function renderStats() {
  const reading   = state.items.filter(x => x.status === 'Reading').length;
  const completed = state.items.filter(x => x.status === 'Completed').length;
  const planned   = state.items.filter(x => x.status === 'Plan to Read').length;
  const totalCh   = state.items.reduce((a, x) => a + x.chapter, 0);
  document.getElementById('stats').innerHTML = `
    <div class="stat"><div class="stat-label">Reading</div><div class="stat-value">${reading}</div></div>
    <div class="stat"><div class="stat-label">Completed</div><div class="stat-value">${completed}</div></div>
    <div class="stat"><div class="stat-label">Plan to Read</div><div class="stat-value">${planned}</div></div>
    <div class="stat"><div class="stat-label">Total Chapter</div><div class="stat-value">${totalCh.toLocaleString()}</div></div>
  `;
}

function renderGenreFilter() {
  const allGenres = [...new Set(state.items.flatMap(x => x.genres || []))].sort();
  const el = document.getElementById('genreFilter');
  if (!allGenres.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<span class="genre-filter-label">Genre:</span>` +
    allGenres.map(g => `<button class="genre-chip${genreFilter===g?' active':''}" onclick="_setGenreFilter('${g}')">${g}</button>`).join('');
}

function render() {
  renderStats();
  renderGenreFilter();

  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  let list = state.items.filter(x => {
    if (filter !== 'all' && x.status !== filter) return false;
    if (genreFilter && !(x.genres||[]).includes(genreFilter)) return false;
    if (q && !x.title.toLowerCase().includes(q) && !(x.altTitles||[]).some(t=>t.toLowerCase().includes(q))) return false;
    return true;
  });

  if (sortBy === 'title') list.sort((a,b) => a.title.localeCompare(b.title));
  else if (sortBy === 'chapter') list.sort((a,b) => b.chapter - a.chapter);
  else if (sortBy === 'rating') list.sort((a,b) => b.rating - a.rating);
  else list.sort((a,b) => b.added - a.added);

  const el = document.getElementById('list');
  if (!list.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">${I.notes}</div><p>Belum ada judul di sini.</p></div>`;
    return;
  }

  el.innerHTML = list.map((item, idx) => {
    const pct = item.totalChapter > 0 ? Math.min(100, Math.round(item.chapter / item.totalChapter * 100)) : 0;
    const stars = [1,2,3,4,5].map(s => `<span class="star${item.rating>=s?' lit':''}" onclick="_setRating(${item.id},${s})">★</span>`).join('');
    const genreTags = (item.genres||[]).map(g => `<span class="genre-tag">${g}</span>`).join('');
    const coverBg = {Manhwa:'rgba(232,80,106,0.1)',Manga:'rgba(91,168,255,0.1)',Manhua:'rgba(216,127,255,0.1)'}[item.type]||'rgba(255,255,255,0.04)';
    const coverContent = item.coverImage
      ? `<img src="${item.coverImage}" alt="cover" />`
      : (item.cover || '📖');
    const itemLinks = item.links || [];
    const firstLink = itemLinks[0];
    const titleEl = firstLink
      ? `<a class="card-title" href="${firstLink.url}" target="_blank" rel="noopener">${item.title}</a>`
      : `<span class="card-title">${item.title}</span>`;
    const linkChips = itemLinks.length
      ? `<div class="link-chips">${itemLinks.map(lk=>`<a class="link-chip" href="${lk.url}" target="_blank" rel="noopener">${I.link} ${lk.label}</a>`).join('')}</div>` : '';
    const hasNotes = item.notes && item.notes.trim();

    return `
    <div class="card" id="card-${item.id}" style="animation-delay:${idx*0.04}s">
      <div class="card-main">
        <div class="cover" style="background:${item.coverImage?'transparent':coverBg}">${coverContent}</div>
        <div class="card-body">
          ${titleEl}
          ${(item.altTitles&&item.altTitles.length)?`<div class="alt-titles">${item.altTitles.join(' · ')}</div>`:''}
          <div class="tags-row">
            <span class="badge badge-${item.type.toLowerCase()}">${item.type}</span>
            <span class="badge badge-${item.seriesStatus}">${item.seriesStatus.charAt(0).toUpperCase()+item.seriesStatus.slice(1)}</span>
            <div class="stars">${stars}</div>
          </div>
          ${genreTags?`<div class="genre-tags">${genreTags}</div>`:''}
          ${linkChips}
        </div>
      </div>
      <div class="card-footer">
        <div class="ch-group">
          <div class="ch-row">
            <span class="ch-label">Ch.</span>
            <input class="ch-input" type="number" value="${item.chapter}" min="0" onchange="_updateChapter(${item.id},this.value)" />
            <span class="ch-total">${item.totalChapter>0?`/ ${item.totalChapter} (${pct}%)`:'<span style="color:var(--green);font-size:10px;font-weight:600;">ONGOING</span>'}</span>
          </div>
          ${item.totalChapter>0?`<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`:''}
        </div>
        <div class="card-actions">
          <select class="status-select" onchange="_updateStatus(${item.id},this.value)">${STATUSES.map(s=>`<option${s===item.status?' selected':''}>${s}</option>`).join('')}</select>
          <button class="card-icon-btn" onclick="_openModal(${item.id})" title="Edit">${I.edit}</button>
          <button class="card-icon-btn del" onclick="_deleteItem(${item.id})" title="Hapus">${I.trash}</button>
        </div>
      </div>
      <div class="notes-section">
        <button class="notes-toggle" onclick="_openNotesModal(${item.id})">
          ${I.notes} Notes${hasNotes?'<span class="notes-dot"></span>':''}
        </button>
      </div>
    </div>`;
  }).join('');
}

// ======= FILTER =======
export function setFilter(f, el) {
  filter = f;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  render();
}

export function setGenreFilter(g) {
  genreFilter = genreFilter === g ? null : g;
  render();
}

// ======= CARD ACTIONS =======
async function updateChapter(id, val) {
  const item = state.items.find(x => x.id === id);
  if (!item) return;
  item.chapter = Math.max(0, parseInt(val)||0);
  try { await updateItem(item); renderStats(); } catch(e) { showToast('Gagal menyimpan.'); }
}

async function updateStatus(id, val) {
  const item = state.items.find(x => x.id === id);
  if (!item) return;
  item.status = val;
  try { await updateItem(item); render(); } catch(e) { showToast('Gagal menyimpan.'); }
}

async function setRating(id, r) {
  const item = state.items.find(x => x.id === id);
  if (!item) return;
  item.rating = r;
  try { await updateItem(item); render(); } catch(e) { showToast('Gagal menyimpan.'); }
}

async function deleteItem(id) {
  if (!confirm('Hapus judul ini?')) return;
  state.items = state.items.filter(x => x.id !== id);
  render();
  try { await deleteItemDb(id); showToast('Dihapus.', I.trash); } catch(e) { showToast('Gagal menghapus.'); }
}

// ======= MODAL =======
function openModal(id = null) {
  editingId = id;
  modalRating = 0; modalGenres = []; modalAltTitles = []; modalLinks = []; modalCoverImage = null;

  const backdrop = document.getElementById('modalBackdrop');
  document.getElementById('modalTitle').textContent = id ? 'Edit judul' : 'Tambah judul baru';

  if (id) {
    const item = state.items.find(x => x.id === id);
    if (item) {
      document.getElementById('m-title').value = item.title;
      document.getElementById('m-type').value = item.type;
      document.getElementById('m-sst').value = item.seriesStatus;
      document.getElementById('m-ch').value = item.chapter;
      document.getElementById('m-total').value = item.totalChapter;
      document.getElementById('m-status').value = item.status;
      document.getElementById('m-notes').value = item.notes || '';
      modalRating = item.rating;
      modalGenres = [...(item.genres||[])];
      modalAltTitles = [...(item.altTitles||[])];
      modalCoverImage = item.coverImage || null;
      modalLinks = [...(item.links||[])];
    }
  } else {
    document.getElementById('m-title').value = '';
    document.getElementById('m-type').value = 'Manhwa';
    document.getElementById('m-sst').value = 'ongoing';
    document.getElementById('m-ch').value = '0';
    document.getElementById('m-total').value = '0';
    document.getElementById('m-status').value = 'Reading';
    document.getElementById('m-notes').value = '';
  }

  renderModalLinks(); renderCoverSection(); renderGenrePicker(); renderAltChips(); renderModalStars();
  backdrop.classList.add('open');
  setTimeout(() => document.getElementById('m-title').focus(), 100);
}

function closeModal() { document.getElementById('modalBackdrop').classList.remove('open'); }

function renderGenrePicker() {
  document.getElementById('genrePicker').innerHTML = state.genres.map(g =>
    `<button class="genre-pick-chip${modalGenres.includes(g)?' selected':''}" onclick="_toggleModalGenre('${g}')">${g}</button>`
  ).join('');
}
function toggleModalGenre(g) {
  modalGenres.includes(g) ? (modalGenres = modalGenres.filter(x=>x!==g)) : modalGenres.push(g);
  renderGenrePicker();
}
async function addNewGenre() {
  const inp = document.getElementById('genreInput');
  const g = inp.value.trim(); if (!g) return;
  if (!state.genres.includes(g)) {
    state.genres.push(g);
    try { await insertGenre(state.user.id, g); } catch(e) {}
  }
  if (!modalGenres.includes(g)) modalGenres.push(g);
  inp.value = ''; renderGenrePicker();
}
function renderAltChips() {
  document.getElementById('altChips').innerHTML = modalAltTitles.map((t,i) =>
    `<span class="alt-chip">${t}<button class="alt-chip-del" onclick="_removeAltTitle(${i})">×</button></span>`
  ).join('');
}
function addAltTitle() {
  const inp = document.getElementById('altInput');
  const v = inp.value.trim(); if (!v || modalAltTitles.includes(v)) { inp.focus(); return; }
  modalAltTitles.push(v); inp.value = ''; renderAltChips(); inp.focus();
}
function removeAltTitle(i) { modalAltTitles.splice(i,1); renderAltChips(); }
function renderModalStars() {
  document.getElementById('modalStars').innerHTML = [1,2,3,4,5].map(s =>
    `<span class="star${modalRating>=s?' lit':''}" onclick="_setModalRating(${s})">★</span>`
  ).join('');
}
function setModalRating(r) { modalRating = r; renderModalStars(); }

async function saveItem() {
  const title = document.getElementById('m-title').value.trim();
  if (!title) { document.getElementById('m-title').focus(); return; }

  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<span class="scan-spinner"></span> Menyimpan...`;

  // Ambil nilai status dan ubah ke huruf kecil agar lolos validasi CHECK di SQL
  const rawSeriesStatus = document.getElementById('m-sst').value || 'ongoing';
  const cleanSeriesStatus = rawSeriesStatus.toLowerCase();

  const payload = {
    title,
    type: document.getElementById('m-type').value,
    seriesStatus: cleanSeriesStatus, // Sudah dipastikan huruf kecil!
    chapter: parseInt(document.getElementById('m-ch').value)||0,
    totalChapter: parseInt(document.getElementById('m-total').value)||0,
    status: document.getElementById('m-status').value,
    notes: document.getElementById('m-notes').value,
    rating: modalRating,
    genres: [...modalGenres],
    altTitles: [...modalAltTitles],
    links: [...modalLinks],
    coverImage: modalCoverImage || null,
  };

  try {
    if (editingId) {
      const idx = state.items.findIndex(x => x.id === editingId);
      if (idx !== -1) {
        const existing = state.items[idx];
        payload.id = editingId;
        payload.cover = modalCoverImage ? existing.cover : autoEmoji(title, modalGenres);
        payload.added = existing.added;
        state.items[idx] = { ...existing, ...payload };
        await updateItem(state.items[idx]);
        showToast('Diperbarui!');
      }
    } else {
      payload.cover = modalCoverImage ? '📖' : autoEmoji(title, modalGenres);
      const saved = await insertItem(state.user.id, payload);
      saved.genres = [...modalGenres]; 
      state.items.unshift(saved);
      showToast('Ditambahkan!');
    }
    closeModal(); render();
  } catch(e) {
    console.error("Gagal simpan:", e);
    showToast('Gagal menyimpan ke server.', I.warning);
  }

  saveBtn.disabled = false;
  saveBtn.innerHTML = `${I.check} Simpan`;
}

function renderModalLinks() {
  const el = document.getElementById('linksList');
  if (!el) return;
  el.innerHTML = modalLinks.map((lk,i) => `
    <div class="modal-link-row">
      <span class="modal-link-label">${lk.label||'Link '+(i+1)}</span>
      <span class="modal-link-url">${lk.url}</span>
      <button class="modal-link-del" onclick="_removeModalLink(${i})">${I.close}</button>
    </div>`).join('');
}
function addModalLink() {
  const label = (document.getElementById('linkLabelInput').value.trim())||('Link '+(modalLinks.length+1));
  const url   = document.getElementById('linkUrlInput').value.trim();
  if (!url) { document.getElementById('linkUrlInput').focus(); return; }
  modalLinks.push({label,url});
  document.getElementById('linkLabelInput').value=''; document.getElementById('linkUrlInput').value='';
  renderModalLinks(); document.getElementById('linkLabelInput').focus();
}
function removeModalLink(i) { modalLinks.splice(i,1); renderModalLinks(); }
function renderCoverSection() {
  const wrap = document.getElementById('coverImageWrap');
  const area = document.getElementById('coverUploadArea');
  const img  = document.getElementById('coverPreviewImg');
  if (modalCoverImage) {
    wrap.style.display='block'; area.style.display='none'; img.src=modalCoverImage;
  } else {
    wrap.style.display='none'; area.style.display='flex';
  }
}
function handleCoverUpload(e) {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 2*1024*1024) { showToast('Maks 2MB', I.warning); return; }
  const r = new FileReader();
  r.onload = ev => { modalCoverImage = ev.target.result; renderCoverSection(); };
  r.readAsDataURL(file); e.target.value='';
}
function removeCoverImage() { modalCoverImage=null; renderCoverSection(); }

// ======= NOTES MODAL =======
function openNotesModal(id) {
  const item = state.items.find(x=>x.id===id); if (!item) return;
  notesModalItemId = id;
  document.getElementById('notesModalTitle').textContent = item.title;
  document.getElementById('notesModalTA').value = item.notes||'';
  document.getElementById('notesModalBackdrop').classList.add('open');
  setTimeout(()=>document.getElementById('notesModalTA').focus(),100);
}
function closeNotesModal() { saveNotesModal(); document.getElementById('notesModalBackdrop').classList.remove('open'); }
async function saveNotesModal() {
  const item = state.items.find(x=>x.id===notesModalItemId); if (!item) return;
  item.notes = document.getElementById('notesModalTA').value;
  try { await updateItem(item); } catch(e) {}
}

// ======= DELETE ALL =======
async function deleteAll() {
  const btn = document.getElementById('deleteAllBtn');
  if (deleteAllStep===0) {
    deleteAllStep=1; btn.classList.add('confirming');
    btn.innerHTML = I.warning + ' Yakin?';
    deleteAllTimer = setTimeout(()=>{ deleteAllStep=0; btn.classList.remove('confirming'); btn.innerHTML=I.trash; },3000);
  } else {
    clearTimeout(deleteAllTimer); deleteAllStep=0;
    btn.classList.remove('confirming'); btn.innerHTML=I.trash;
    try {
      await deleteAllItems(state.user.id);
      state.items=[];
      render();
      showToast('Semua data direset.', I.trash);
    } catch(e) { showToast('Gagal reset.', I.warning); }
  }
}

// ======= EXPORT / IMPORT =======
function exportData() {
  const blob = new Blob([JSON.stringify({items:state.items,genres:state.genres},null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download=`manhwa-tracker-${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
  showToast('Export berhasil!');
}

async function importData(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!imported.items || !Array.isArray(imported.items)) throw new Error('Format salah');
      
      const existingTitles = new Set(state.items.map(x => x.title.toLowerCase().trim()));
      const itemsToInsert = [];
      
      // 1. Kumpulkan semua item baru & paksa seriesStatus jadi huruf kecil
      for (const item of imported.items) {
        if (existingTitles.has(item.title.toLowerCase().trim())) continue;
        
        const { id, ...cleanItem } = item; 
        
        cleanItem.genres = item.genres || [];
        cleanItem.altTitles = item.altTitles || [];
        cleanItem.links = item.links || [];
        cleanItem.added = item.added || Date.now();
        
        // Memastikan isi JSON lama dipaksa jadi huruf kecil ('ongoing', 'completed', dll)
        if (item.seriesStatus) {
          cleanItem.seriesStatus = item.seriesStatus.toLowerCase();
        } else {
          cleanItem.seriesStatus = 'ongoing';
        }

        itemsToInsert.push(cleanItem);
      }

      let addedCount = 0;

      // 2. Kirim massal ke database Supabase
      if (itemsToInsert.length > 0) {
        const savedItems = await insertItem(state.user.id, itemsToInsert);
        if (Array.isArray(savedItems)) {
          state.items.push(...savedItems);
          addedCount = savedItems.length;
        } else {
          state.items.push(...itemsToInsert);
          addedCount = itemsToInsert.length;
        }
      }
      
      // 3. Masukkan master genre ke local state tracker
      const newGenres = imported.genres || [];
      newGenres.forEach(g => { 
        if (!state.genres.includes(g)) state.genres.push(g); 
      });

      // 4. Kirim genre baru. Jika error 'unique constraint' di database, abaikan lewat catch
      if (newGenres.length > 0) {
        try {
          await insertGenresBulk(state.user.id, newGenres);
        } catch (genreErr) {
          console.warn("Master genre sudah ada di database, dilewati safely.");
        }
      }
      
      render();
      showToast(addedCount > 0 ? `${addedCount} judul berhasil di-import!` : 'Semua judul sudah ada.');
    } catch (err) { 
      console.error("Detail Error Impor:", err); 
      showToast('File tidak valid atau ditolak database!', I.warning); 
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}

// ======= MIGRATE =======
async function handleMigrate() {
  const btn = document.getElementById('migrateBtnEl');
  btn.disabled = true; btn.textContent = 'Migrasi...';
  try {
    const result = await migrateFromLocalStorage(state.user.id);
    const [items, genres] = await Promise.all([fetchItems(state.user.id), fetchGenres(state.user.id)]);
    state.items = items; state.genres = genres.length?genres:[...DEFAULT_GENRES];
    render();
    document.getElementById('migrateBanner').style.display = 'none';
    showToast(`Berhasil! ${result.items} judul & ${result.genres} genre dimigrasi.`);
  } catch(e) {
    console.error(e);
    showToast('Migrasi gagal. Coba lagi.', I.warning);
    btn.disabled=false; btn.textContent='Migrasi';
  }
}

// ======= SCAN =======
let scanFiles = [], scanDetected = [];

function openScanModal() { resetScan(); document.getElementById('scanBackdrop').classList.add('open'); }
function closeScanModal() { document.getElementById('scanBackdrop').classList.remove('open'); }
function resetScan() {
  scanFiles=[]; scanDetected=[];
  document.getElementById('scanPreviews').innerHTML='';
  document.getElementById('scanStatus').style.display='none';
  document.getElementById('scanResults').style.display='none';
  document.getElementById('scanUploadArea').style.display='flex';
  document.getElementById('scanCloseRow').style.display='flex';
  document.getElementById('scanFileInput').value='';
}
function handleScanDrop(e) {
  e.preventDefault();
  document.getElementById('scanUploadArea').style.borderColor='var(--border2)';
  handleScanFiles(e.dataTransfer.files);
}
function handleScanFiles(files) {
  if (!files||!files.length) return;
  scanFiles = Array.from(files);
  const prev = document.getElementById('scanPreviews');
  prev.innerHTML = scanFiles.map((f,i) => {
    const url = URL.createObjectURL(f);
    return `<div style="position:relative"><img src="${url}" style="height:72px;width:52px;object-fit:cover;border-radius:7px;border:1px solid var(--border2);" /><div style="position:absolute;bottom:2px;left:2px;background:rgba(0,0,0,0.65);border-radius:3px;font-size:9px;padding:1px 4px;color:#fff;">${i+1}</div></div>`;
  }).join('');
  document.getElementById('scanUploadArea').style.display='none';
  document.getElementById('scanCloseRow').style.display='none';
  runScan();
}
async function fileToBase64(file) {
  return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(',')[1]); r.onerror=rej; r.readAsDataURL(file); });
}
async function runScan() {
  document.getElementById('scanStatus').style.display='block';
  document.getElementById('scanStatusText').textContent='Menganalisa screenshot...';
  try {
    const imageContents = await Promise.all(scanFiles.map(async f => ({type:'image',source:{type:'base64',media_type:f.type||'image/png',data:await fileToBase64(f)}})));
    imageContents.push({type:'text',text:`Screenshot dari aplikasi baca manhwa/manga/manhua. Ekstrak semua judul beserta chapter terakhir. Kembalikan HANYA JSON array tanpa penjelasan:\n[{"title":"Judul","chapter":74,"type":"Manhwa"},...]\ntype: "Manhwa"|"Manga"|"Manhua". chapter: angka saja, 0 jika tidak ada.`});
    const resp = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:imageContents}]})});
    const data = await resp.json();
    const raw = data.content?.map(c=>c.text||'').join('').trim();
    scanDetected = JSON.parse(raw.replace(/```json|```/g,'').trim());
    renderScanResults();
  } catch(err) {
    document.getElementById('scanStatusText').textContent='Gagal menganalisa. Coba lagi.';
    document.getElementById('scanCloseRow').style.display='flex';
  }
}
function renderScanResults() {
  document.getElementById('scanStatus').style.display='none';
  document.getElementById('scanResults').style.display='block';
  document.getElementById('scanResultList').innerHTML = scanDetected.map((item,i)=>`
    <div class="scan-item">
      <input type="checkbox" id="scan-check-${i}" checked />
      <div class="scan-item-info">
        <div class="scan-item-title"><input type="text" id="scan-title-${i}" value="${item.title}" /></div>
        <div class="scan-item-meta">
          <span style="font-size:11px;color:var(--muted);">Ch.</span>
          <input type="number" id="scan-ch-${i}" value="${item.chapter||0}" min="0" />
          <select id="scan-type-${i}"><option${item.type==='Manhwa'?' selected':''}>Manhwa</option><option${item.type==='Manga'?' selected':''}>Manga</option><option${item.type==='Manhua'?' selected':''}>Manhua</option></select>
          <span style="font-size:10px;color:var(--amber);">${state.items.find(x=>x.title.toLowerCase()===item.title.toLowerCase())?'Sudah ada':''}</span>
        </div>
      </div>
    </div>`).join('');
}
async function confirmScanImport() {
  let added = 0;
  for (let i=0; i<scanDetected.length; i++) {
    if (!document.getElementById(`scan-check-${i}`)?.checked) continue;
    const title = document.getElementById(`scan-title-${i}`)?.value.trim(); if (!title) continue;
    const exists = state.items.find(x=>x.title.toLowerCase()===title.toLowerCase());
    if (exists) {
      const newCh = parseInt(document.getElementById(`scan-ch-${i}`)?.value)||0;
      if (newCh > exists.chapter) { exists.chapter=newCh; try{await updateItem(exists);}catch(e){} }
      continue;
    }
    const item = {title,type:document.getElementById(`scan-type-${i}`)?.value||'Manhwa',chapter:parseInt(document.getElementById(`scan-ch-${i}`)?.value)||0,totalChapter:0,status:'Reading',seriesStatus:'ongoing',rating:0,genres:[],altTitles:[],notes:'',cover:COVERS[Math.floor(Math.random()*COVERS.length)]};
    try {
      const saved = await insertItem(state.user.id, item);
      saved.genres=[];
      state.items.unshift(saved);
      added++;
    } catch(e) {}
  }
  render(); closeScanModal(); showToast(`${added} judul ditambahkan dari screenshot!`);
}

// ======= KEYBOARD =======
function setupKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.key==='n'&&!e.ctrlKey&&!e.metaKey&&document.activeElement.tagName==='BODY') openModal();
    if (e.key==='Escape') { closeModal(); document.getElementById('notesModalBackdrop').classList.remove('open'); }
  });
}
