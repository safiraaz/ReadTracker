const COVERS = ['🐉','⚔️','🌸','👊','💀','🔮','🗡️','🌙','🔥','🌊','⚡','🦊','🏯','👁️','🧬','🗺️','💎','🎭','🧿','🐺'];
const STATUSES = ['Reading','Completed','Plan to Read','On Hold','Dropped'];
const STATUS_BADGE = {Reading:'ongoing',Completed:'completed','Plan to Read':'hiatus','On Hold':'hiatus',Dropped:'dropped'};

const DEFAULT_GENRES = ['Action','Romance','Fantasy','Isekai','Historical','System','Regression','Reincarnation','Martial Arts','School','Horror','Comedy','Mystery','Sci-Fi','Slice of Life','Dungeon','Villainess','Murim','Hunter'];

let state = loadState();

function loadState() {
  try {
    const s = localStorage.getItem('manhwa-tracker-v2');
    if (s) return JSON.parse(s);
  } catch(e){}
  return {
    items: [
      {id:1,title:'Solo Leveling',type:'Manhwa',status:'Completed',chapter:179,totalChapter:179,rating:5,cover:'⚔️',seriesStatus:'completed',added:Date.now()-864e5*10,notes:'',genres:['Action','Fantasy','Hunter']},
      {id:2,title:'Omniscient Reader',type:'Manhwa',status:'Reading',chapter:134,totalChapter:551,rating:5,cover:'🔮',seriesStatus:'ongoing',added:Date.now()-864e5*5,notes:'Bagus banget, plot twist everywhere.',genres:['Action','Fantasy','Regression']},
      {id:3,title:'Tower of God',type:'Manhwa',status:'Reading',chapter:600,totalChapter:0,rating:4,cover:'🏯',seriesStatus:'ongoing',added:Date.now()-864e5*3,notes:'',genres:['Action','Fantasy','Dungeon']},
      {id:4,title:'Chainsaw Man',type:'Manga',status:'Reading',chapter:167,totalChapter:0,rating:5,cover:'🔥',seriesStatus:'ongoing',added:Date.now()-864e5*2,notes:'',genres:['Action','Horror']},
      {id:5,title:'Dungeon Odyssey',type:'Manhwa',status:'Plan to Read',chapter:0,totalChapter:0,rating:0,cover:'🐉',seriesStatus:'ongoing',added:Date.now()-864e5,notes:'',genres:['Dungeon','Action']},
    ],
    genres: [...DEFAULT_GENRES],
    nextId: 6
  };
}

function saveState() {
  try { localStorage.setItem('manhwa-tracker-v2', JSON.stringify(state)); } catch(e){}
}

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

/* AUTO EMOJI */
const GENRE_EMOJI = {
  'Action':'⚔️','Romance':'💕','Fantasy':'🔮','Isekai':'🌀','Historical':'🏯',
  'System':'💻','Regression':'⏪','Reincarnation':'♻️','Martial Arts':'👊',
  'School':'🏫','Horror':'💀','Comedy':'😂','Mystery':'🔍','Sci-Fi':'🚀',
  'Slice of Life':'☕','Dungeon':'🐉','Villainess':'👑','Murim':'🥋',
  'Hunter':'🗡️','BL':'🩵','GL':'🩷','Harem':'💞','Mecha':'🤖',
};
const TITLE_EMOJI = [
  [/dragon|naga/i,'🐉'],[/sword|pedang|blade/i,'⚔️'],[/flower|bunga|sakura/i,'🌸'],
  [/death|mati|dead/i,'💀'],[/magic|sorcerer|wizard|witch/i,'🔮'],
  [/moon|bulan/i,'🌙'],[/fire|api|flame/i,'🔥'],[/water|ocean|laut|sea/i,'🌊'],
  [/wolf|serigala/i,'🐺'],[/princess|putri/i,'👑'],[/villain|villainess/i,'🗡️'],
  [/husband|wife|suami|istri|marriage|wedding|nikah/i,'💍'],[/baby|child|anak/i,'👶'],
  [/cat|kucing/i,'🐱'],[/dog|anjing/i,'🐶'],[/hunter|hunt/i,'🗡️'],
  [/dungeon|tower/i,'🏰'],[/school|sekolah/i,'🏫'],[/duke|earl|count|lord/i,'🎩'],
  [/secret|rahasia/i,'🤫'],[/love|cinta|heart/i,'❤️'],[/money|uang|cash/i,'💰'],
  [/game|player|level/i,'🎮'],[/star|bintang/i,'⭐'],[/rabbit|kelinci/i,'🐇'],
  [/oak|tree|pohon/i,'🌳'],[/pizza/i,'🍕'],[/alchemist|kimia/i,'⚗️'],
];
function autoEmoji(title, genres) {
  for (const g of (genres||[])) { if (GENRE_EMOJI[g]) return GENRE_EMOJI[g]; }
  for (const [rx, em] of TITLE_EMOJI) { if (rx.test(title)) return em; }
  return COVERS[Math.floor(Math.random() * COVERS.length)];
}

function setFilter(f, el) {
  filter = f;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  render();
}

function setGenreFilter(g) {
  genreFilter = genreFilter === g ? null : g;
  render();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

/* ---- MODAL ---- */
function openModal(id = null) {
  editingId = id;
  modalRating = 0;
  modalGenres = [];
  modalAltTitles = [];
  modalLinks = [];
  modalCoverImage = null;
  const lbl = document.getElementById('linkLabelInput'); if(lbl) lbl.value='';
  const lurlinput = document.getElementById('linkUrlInput'); if(lurlinput) lurlinput.value='';
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
      modalGenres = [...(item.genres || [])];
      modalAltTitles = [...(item.altTitles || [])];
      modalCoverImage = item.coverImage || null;
      modalLinks = [...(item.links || [])];
      renderModalLinks();
    }
  } else {
    document.getElementById('m-title').value = '';
    document.getElementById('m-type').value = 'Manhwa';
    document.getElementById('m-sst').value = 'ongoing';
    document.getElementById('m-ch').value = '0';
    document.getElementById('m-total').value = '0';
    document.getElementById('m-status').value = 'Reading';
    document.getElementById('m-notes').value = '';
    modalAltTitles = [];
    modalCoverImage = null;
    modalLinks = [];
    renderModalLinks();
  }

  renderCoverSection();
  renderGenrePicker();
  renderAltChips();
  renderModalStars();
  backdrop.classList.add('open');
  setTimeout(() => document.getElementById('m-title').focus(), 100);
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
}

function handleBackdropClick(e) {
  if (e.target === document.getElementById('modalBackdrop')) closeModal();
}

function renderGenrePicker() {
  const el = document.getElementById('genrePicker');
  el.innerHTML = state.genres.map(g => `
    <button class="genre-pick-chip${modalGenres.includes(g)?' selected':''}" onclick="toggleModalGenre('${g}')">${g}</button>
  `).join('');
}

function toggleModalGenre(g) {
  if (modalGenres.includes(g)) {
    modalGenres = modalGenres.filter(x => x !== g);
  } else {
    modalGenres.push(g);
  }
  renderGenrePicker();
}

function addNewGenre() {
  const inp = document.getElementById('genreInput');
  const g = inp.value.trim();
  if (!g) return;
  if (!state.genres.includes(g)) { state.genres.push(g); }
  if (!modalGenres.includes(g)) { modalGenres.push(g); }
  inp.value = '';
  renderGenrePicker();
}

function renderAltChips() {
  const el = document.getElementById('altChips');
  if (!el) return;
  el.innerHTML = modalAltTitles.map((t, i) => `
    <span class="alt-chip">${t}<button class="alt-chip-del" onclick="removeAltTitle(${i})" title="Hapus">×</button></span>
  `).join('');
}

function addAltTitle() {
  const inp = document.getElementById('altInput');
  const v = inp.value.trim();
  if (!v || modalAltTitles.includes(v)) { inp.focus(); return; }
  modalAltTitles.push(v);
  inp.value = '';
  renderAltChips();
  inp.focus();
}

function removeAltTitle(i) {
  modalAltTitles.splice(i, 1);
  renderAltChips();
}

function renderModalStars() {
  const el = document.getElementById('modalStars');
  el.innerHTML = [1,2,3,4,5].map(s => `
    <span class="star${modalRating>=s?' lit':''}" onclick="setModalRating(${s})">★</span>
  `).join('');
}

function setModalRating(r) {
  modalRating = r;
  renderModalStars();
}

function saveItem() {
  const title = document.getElementById('m-title').value.trim();
  if (!title) { document.getElementById('m-title').focus(); return; }

  if (editingId) {
    const idx = state.items.findIndex(x => x.id === editingId);
    if (idx !== -1) {
      state.items[idx] = {
        ...state.items[idx],
        title,
        type: document.getElementById('m-type').value,
        seriesStatus: document.getElementById('m-sst').value,
        chapter: parseInt(document.getElementById('m-ch').value) || 0,
        totalChapter: parseInt(document.getElementById('m-total').value) || 0,
        status: document.getElementById('m-status').value,
        notes: document.getElementById('m-notes').value,
        rating: modalRating,
        genres: [...modalGenres],
        altTitles: [...modalAltTitles],
        cover: modalCoverImage ? state.items[state.items.findIndex(x=>x.id===editingId)].cover : autoEmoji(title, modalGenres),
        coverImage: modalCoverImage || null,
        links: [...modalLinks]
      };
    }
  } else {
    state.items.unshift({
      id: state.nextId++,
      title,
      type: document.getElementById('m-type').value,
      seriesStatus: document.getElementById('m-sst').value,
      chapter: parseInt(document.getElementById('m-ch').value) || 0,
      totalChapter: parseInt(document.getElementById('m-total').value) || 0,
      status: document.getElementById('m-status').value,
      notes: document.getElementById('m-notes').value,
      rating: modalRating,
      genres: [...modalGenres],
      altTitles: [...modalAltTitles],
      cover: modalCoverImage ? '📖' : autoEmoji(title, modalGenres),
      coverImage: modalCoverImage || null,
      links: [...modalLinks],
      added: Date.now()
    });
  }

  saveState();
  closeModal();
  render();
  showToast(editingId ? '✅ Berhasil diperbarui!' : '✅ Judul ditambahkan!');
}

/* ---- CARD ACTIONS ---- */
function updateChapter(id, val) {
  const item = state.items.find(x => x.id === id);
  if (item) { item.chapter = Math.max(0, parseInt(val) || 0); saveState(); renderStats(); }
}

function updateStatus(id, val) {
  const item = state.items.find(x => x.id === id);
  if (item) { item.status = val; saveState(); render(); }
}

function setRating(id, r) {
  const item = state.items.find(x => x.id === id);
  if (item) { item.rating = r; saveState(); render(); }
}

function deleteItem(id) {
  if (!confirm('Hapus judul ini?')) return;
  state.items = state.items.filter(x => x.id !== id);
  saveState();
  render();
  showToast('🗑️ Judul dihapus.');
}

/* ---- MULTI LINKS ---- */
function renderModalLinks() {
  const el = document.getElementById('linksList');
  if (!el) return;
  if (!modalLinks.length) { el.innerHTML = ''; return; }
  el.innerHTML = modalLinks.map((lk, i) => `
    <div class="modal-link-row">
      <span class="modal-link-label">${lk.label || 'Link ' + (i+1)}</span>
      <span class="modal-link-url">${lk.url}</span>
      <button class="modal-link-del" onclick="removeModalLink(${i})">×</button>
    </div>`).join('');
}
function addModalLink() {
  const label = (document.getElementById('linkLabelInput').value.trim()) || ('Link ' + (modalLinks.length + 1));
  const url   = document.getElementById('linkUrlInput').value.trim();
  if (!url) { document.getElementById('linkUrlInput').focus(); return; }
  modalLinks.push({ label, url });
  document.getElementById('linkLabelInput').value = '';
  document.getElementById('linkUrlInput').value = '';
  renderModalLinks();
  document.getElementById('linkLabelInput').focus();
}
function removeModalLink(i) {
  modalLinks.splice(i, 1);
  renderModalLinks();
}

/* ---- COVER IMAGE ---- */
function renderCoverSection() {
  const wrap = document.getElementById('coverImageWrap');
  const area = document.getElementById('coverUploadArea');
  const img  = document.getElementById('coverPreviewImg');
  if (modalCoverImage) {
    wrap.style.display = 'block'; area.style.display = 'none'; img.src = modalCoverImage;
  } else {
    wrap.style.display = 'none'; area.style.display = 'block';
  }
}
function handleCoverUpload(e) {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 2*1024*1024) { showToast('⚠️ Maks 2MB'); return; }
  const r = new FileReader();
  r.onload = ev => { modalCoverImage = ev.target.result; renderCoverSection(); };
  r.readAsDataURL(file); e.target.value = '';
}
function removeCoverImage() { modalCoverImage = null; renderCoverSection(); }

/* ---- NOTES MODAL ---- */
function openNotesModal(id) {
  const item = state.items.find(x => x.id === id);
  if (!item) return;
  notesModalItemId = id;
  document.getElementById('notesModalTitle').textContent = item.title;
  document.getElementById('notesModalTA').value = item.notes || '';
  document.getElementById('notesModalBackdrop').classList.add('open');
  setTimeout(() => document.getElementById('notesModalTA').focus(), 100);
}
function closeNotesModal() {
  saveNotesModal();
  document.getElementById('notesModalBackdrop').classList.remove('open');
}
function saveNotesModal() {
  const item = state.items.find(x => x.id === notesModalItemId);
  if (!item) return;
  item.notes = document.getElementById('notesModalTA').value;
  saveState();
  // update inline toggle button too
  const btn = document.getElementById('notes-btn-' + notesModalItemId);
  if (btn) btn.innerHTML = '▸ Notes' + (item.notes ? ' ✦' : '');
}

function toggleNotes(id) {
  const el = document.getElementById(`notes-body-${id}`);
  if (!el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  const btn = document.getElementById(`notes-btn-${id}`);
  if (btn) btn.innerHTML = (open ? '▸ Notes' : '▾ Notes') + (document.getElementById(`notes-ta-${id}`)?.value ? ' ✦' : '');
}

function saveNotes(id) {
  const ta = document.getElementById(`notes-ta-${id}`);
  if (!ta) return;
  const item = state.items.find(x => x.id === id);
  if (item) { item.notes = ta.value; saveState(); }
  const btn = document.getElementById(`notes-btn-${id}`);
  if (btn) btn.innerHTML = '▾ Notes' + (ta.value ? ' ✦' : '');
}

/* ---- RENDER ---- */
function renderStats() {
  const reading = state.items.filter(x => x.status === 'Reading').length;
  const completed = state.items.filter(x => x.status === 'Completed').length;
  const planned = state.items.filter(x => x.status === 'Plan to Read').length;
  const totalCh = state.items.reduce((a, x) => a + x.chapter, 0);
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
    allGenres.map(g => `<button class="genre-chip${genreFilter===g?' active':''}" onclick="setGenreFilter('${g}')">${g}</button>`).join('');
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

  if (sortBy === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
  else if (sortBy === 'chapter') list.sort((a, b) => b.chapter - a.chapter);
  else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
  else list.sort((a, b) => b.added - a.added);

  const el = document.getElementById('list');
  if (!list.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📭</div><p>Belum ada judul di sini.</p></div>`;
    return;
  }

  el.innerHTML = list.map(item => {
    const pct = item.totalChapter > 0 ? Math.min(100, Math.round(item.chapter / item.totalChapter * 100)) : 0;
    const stars = [1,2,3,4,5].map(s => `<span class="star${item.rating>=s?' lit':''}" onclick="setRating(${item.id},${s})">★</span>`).join('');
    const genreTags = (item.genres||[]).map(g => `<span class="genre-tag">${g}</span>`).join('');
    const hasNotes = item.notes && item.notes.trim();
    const coverBg = {Manhwa:'rgba(124,106,247,0.12)',Manga:'rgba(74,158,245,0.12)',Manhua:'rgba(245,110,179,0.12)'}[item.type] || 'rgba(255,255,255,0.05)';
    const coverContent = item.coverImage
      ? `<img src="${item.coverImage}" alt="cover" style="width:56px;min-height:80px;object-fit:cover;display:block;border-radius:0;" />`
      : item.cover || '📖';
    const itemLinks = item.links || (item.link ? [{label:'Link', url: item.link}] : []);
    const firstLink = itemLinks[0];
    const linkAttr = firstLink ? `data-href="${encodeURIComponent(firstLink.url)}" class="cover-link"` : '';
    const titleEl = firstLink
      ? `<a class="card-title card-title-link" href="${firstLink.url}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${item.title}</a>`
      : `<div class="card-title">${item.title}</div>`;
    const linkChips = itemLinks.length ? '<div class="link-chips">' + itemLinks.map(lk=>'<a class="link-chip" href="' + lk.url + '" target="_blank" rel="noopener">↗ ' + lk.label + '</a>').join('') + '</div>' : '';

    return `
    <div class="card" id="card-${item.id}">
      <div class="card-main">
        <div class="cover" style="background:${item.coverImage?'transparent':coverBg}" ${linkAttr} onclick="if(this.dataset.href)window.open(decodeURIComponent(this.dataset.href),'_blank')">
          ${coverContent}
        </div>
        <div class="card-body">
          ${titleEl}
          ${(item.altTitles&&item.altTitles.length)?`<div class="alt-titles">${item.altTitles.map(t=>`<span class="alt-title-item">${t}</span>`).join('')}</div>`:''}
          <div class="tags-row">
            <span class="badge badge-${item.type.toLowerCase()}">${item.type}</span>
            <span class="badge badge-${item.seriesStatus}">${item.seriesStatus.charAt(0).toUpperCase()+item.seriesStatus.slice(1)}</span>
            <div class="stars">${stars}</div>
          </div>
          ${genreTags ? `<div class="genre-tags">${genreTags}</div>` : ''}
          ${linkChips}
        </div>
      </div>

      <div class="card-footer">
        <div class="ch-group">
          <div class="ch-row">
            <label style="font-size:12px;color:var(--muted);flex-shrink:0;">Ch.</label>
            <input class="ch-input" type="number" value="${item.chapter}" min="0" onchange="updateChapter(${item.id},this.value)" />
            <span class="ch-total">${item.totalChapter > 0 ? `/ ${item.totalChapter} (${pct}%)` : '<span style="color:var(--green);font-size:11px;font-weight:500;">ongoing</span>'}</span>
          </div>
          ${item.totalChapter > 0 ? `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>` : ''}
        </div>
        <div class="card-actions">
          <select class="status-select" onchange="updateStatus(${item.id},this.value)">
            ${STATUSES.map(s => `<option${s===item.status?' selected':''}>${s}</option>`).join('')}
          </select>
          <button class="icon-btn" onclick="openModal(${item.id})" title="Edit" style="color:var(--muted)">✏️</button>
          <button class="icon-btn" onclick="deleteItem(${item.id})" title="Hapus">🗑</button>
        </div>
      </div>

      <div class="notes-section">
        <button class="notes-toggle" id="notes-btn-${item.id}" onclick="openNotesModal(${item.id})">
          ▸ Notes${hasNotes ? ' ✦' : ''}
        </button>
      </div>
    </div>`;
  }).join('');
}

/* ---- SCAN SCREENSHOT ---- */
let scanFiles = [];
let scanDetected = [];

function openScanModal() {
  resetScan();
  document.getElementById('scanBackdrop').classList.add('open');
}
function closeScanModal() {
  document.getElementById('scanBackdrop').classList.remove('open');
}
function resetScan() {
  scanFiles = [];
  scanDetected = [];
  document.getElementById('scanPreviews').innerHTML = '';
  document.getElementById('scanStatus').style.display = 'none';
  document.getElementById('scanResults').style.display = 'none';
  document.getElementById('scanUploadArea').style.display = 'block';
  document.getElementById('scanCloseRow').style.display = 'flex';
  document.getElementById('scanFileInput').value = '';
}

function handleScanDrop(e) {
  e.preventDefault();
  document.getElementById('scanUploadArea').style.borderColor = 'var(--border2)';
  handleScanFiles(e.dataTransfer.files);
}

function handleScanFiles(files) {
  if (!files || !files.length) return;
  scanFiles = Array.from(files);

  // Show previews
  const prev = document.getElementById('scanPreviews');
  prev.innerHTML = scanFiles.map((f, i) => {
    const url = URL.createObjectURL(f);
    return `<div style="position:relative;"><img src="${url}" style="height:80px;width:60px;object-fit:cover;border-radius:6px;border:0.5px solid var(--border2);" /><div style="position:absolute;bottom:2px;left:2px;background:rgba(0,0,0,0.6);border-radius:3px;font-size:10px;padding:1px 4px;color:#fff;">${i+1}</div></div>`;
  }).join('');

  document.getElementById('scanUploadArea').style.display = 'none';
  document.getElementById('scanCloseRow').style.display = 'none';
  runScan();
}

async function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function runScan() {
  document.getElementById('scanStatus').style.display = 'block';
  document.getElementById('scanStatusText').textContent = 'Menganalisa screenshot...';

  try {
    // Build content array with all images
    const imageContents = await Promise.all(scanFiles.map(async (f) => ({
      type: 'image',
      source: { type: 'base64', media_type: f.type || 'image/png', data: await fileToBase64(f) }
    })));

    imageContents.push({
      type: 'text',
      text: `Ini adalah screenshot dari aplikasi baca manhwa/manga/manhua (seperti MangaToon, Webtoon, dll). 
Ekstrak semua judul manhwa/manga/manhua yang ada beserta chapter terakhir yang dibaca.
Kembalikan HANYA JSON array, tanpa penjelasan apapun, tanpa markdown, format:
[{"title":"Judul Manhwa","chapter":74,"type":"Manhwa"},...]
- type harus salah satu dari: "Manhwa", "Manga", "Manhua" (tebak dari konteks, default Manhwa)
- chapter adalah angka saja (ambil angka dari teks chapter, jika tidak ada angka pakai 0)
- Abaikan teks yang bukan judul (like "4 days ago", username, dll)
- Bersihkan judul dari tag seperti [DINDIN], (BL), S3, dll — tapi boleh tetap masuk jika bagian judul asli`
    });

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: imageContents }]
      })
    });

    const data = await resp.json();
    const raw = data.content?.map(c => c.text || '').join('').trim();
    const clean = raw.replace(/```json|```/g, '').trim();
    scanDetected = JSON.parse(clean);
    renderScanResults();
  } catch(err) {
    document.getElementById('scanStatusText').textContent = '❌ Gagal menganalisa. Coba lagi.';
    document.getElementById('scanCloseRow').style.display = 'flex';
    console.error(err);
  }
}

function renderScanResults() {
  document.getElementById('scanStatus').style.display = 'none';
  document.getElementById('scanResults').style.display = 'block';

  const list = document.getElementById('scanResultList');
  list.innerHTML = scanDetected.map((item, i) => `
    <div class="scan-item">
      <input type="checkbox" id="scan-check-${i}" checked />
      <div class="scan-item-info">
        <div class="scan-item-title"><input type="text" id="scan-title-${i}" value="${item.title}" /></div>
        <div class="scan-item-meta">
          <label style="font-size:12px;color:var(--muted);">Ch.</label>
          <input type="number" id="scan-ch-${i}" value="${item.chapter||0}" min="0" />
          <select id="scan-type-${i}">
            <option${item.type==='Manhwa'?' selected':''}>Manhwa</option>
            <option${item.type==='Manga'?' selected':''}>Manga</option>
            <option${item.type==='Manhua'?' selected':''}>Manhua</option>
          </select>
          <span style="font-size:11px;color:var(--muted2);">${state.items.find(x=>x.title.toLowerCase()===item.title.toLowerCase())?'⚠️ sudah ada':''}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function confirmScanImport() {
  let added = 0;
  scanDetected.forEach((_, i) => {
    const checked = document.getElementById(`scan-check-${i}`)?.checked;
    if (!checked) return;
    const title = document.getElementById(`scan-title-${i}`)?.value.trim();
    if (!title) return;
    const exists = state.items.find(x => x.title.toLowerCase() === title.toLowerCase());
    if (exists) {
      // update chapter if higher
      const newCh = parseInt(document.getElementById(`scan-ch-${i}`)?.value)||0;
      if (newCh > exists.chapter) { exists.chapter = newCh; }
      return;
    }
    state.items.unshift({
      id: state.nextId++,
      title,
      type: document.getElementById(`scan-type-${i}`)?.value || 'Manhwa',
      chapter: parseInt(document.getElementById(`scan-ch-${i}`)?.value)||0,
      totalChapter: 0,
      status: 'Reading',
      seriesStatus: 'ongoing',
      rating: 0,
      genres: [],
      altTitles: [],
      notes: '',
      cover: COVERS[Math.floor(Math.random()*COVERS.length)],
      added: Date.now()
    });
    added++;
  });
  saveState();
  render();
  closeScanModal();
  showToast(`✅ ${added} judul ditambahkan dari screenshot!`);
}

/* ---- EXPORT / IMPORT ---- */
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `manhwa-tracker-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Data berhasil di-export!');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!imported.items || !Array.isArray(imported.items)) throw new Error('Format salah');
      const existingTitles = new Set(state.items.map(x => x.title.toLowerCase().trim()));
      const existingIds = new Set(state.items.map(x => x.id));
      let added = 0;
      let runningMax = Math.max(0, ...state.items.map(x => x.id));
      imported.items.forEach(item => {
        if (existingTitles.has(item.title.toLowerCase().trim())) return;
        if (existingIds.has(item.id)) item.id = ++runningMax;
        state.items.push(item);
        existingTitles.add(item.title.toLowerCase().trim());
        existingIds.add(item.id);
        added++;
      });
      (imported.genres || []).forEach(g => { if (!state.genres.includes(g)) state.genres.push(g); });
      state.nextId = Math.max(0, ...state.items.map(x => x.id)) + 1;
      saveState();
      render();
      showToast(added > 0 ? `✅ ${added} judul baru di-import!` : 'ℹ️ Semua judul sudah ada.');
    } catch(err) {
      showToast('❌ File tidak valid!');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}

function confirmResetAll() {
  if (!confirm('⚠️ Reset semua data? Semua judul, rating, notes, dan links akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.')) return;
  state = { items: [], genres: [...DEFAULT_GENRES], nextId: 1 };
  saveState();
  render();
  showToast('🗑️ Semua data direset.');
}

// keyboard shortcut: N to add
document.addEventListener('keydown', e => {
  if (e.key === 'n' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName === 'BODY') openModal();
  if (e.key === 'Escape') closeModal();
});

render();