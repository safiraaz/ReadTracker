// auth.js — handles Supabase auth + session
import { supabase } from './supabase.js';
import { initApp, checkAndShowMigrateBanner } from './app.js';

let currentUser = null;

export function getUser() { return currentUser; }

export async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    showApp(currentUser);
  } else {
    showAuth();
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    if (currentUser) showApp(currentUser);
    else showAuth();
  });
}

function showAuth() {
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('appScreen').style.display = 'none';
  setupAuthUI();
}

async function showApp(user) {
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'block';
  await initApp(user);
  checkAndShowMigrateBanner();
}

function setupAuthUI() {
  // Tab switching
  document.getElementById('tabLogin').addEventListener('click', () => switchTab('login'));
  document.getElementById('tabRegister').addEventListener('click', () => switchTab('register'));

  document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
}

function switchTab(mode) {
  const isLogin = mode === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabRegister').classList.toggle('active', !isLogin);
  document.getElementById('authSubmitBtn').textContent = isLogin ? 'Masuk' : 'Daftar';
  document.getElementById('authFormMode').value = mode;
  document.getElementById('authError').classList.remove('show');

  const migrateNote = document.getElementById('migrateNote');
  if (!isLogin && hasLocalData()) {
    migrateNote.classList.add('show');
  } else {
    migrateNote.classList.remove('show');
  }
}

function hasLocalData() {
  try {
    const s = localStorage.getItem('manhwa-tracker-v2');
    if (s) {
      const parsed = JSON.parse(s);
      return parsed?.items?.length > 0;
    }
  } catch(e) {}
  return false;
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const mode = document.getElementById('authFormMode').value;
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const btn = document.getElementById('authSubmitBtn');
  const errEl = document.getElementById('authError');

  errEl.classList.remove('show');
  btn.disabled = true;
  btn.textContent = mode === 'login' ? 'Masuk...' : 'Mendaftar...';

  try {
    let error;
    if (mode === 'login') {
      ({ error } = await supabase.auth.signInWithPassword({ email, password }));
    } else {
      ({ error } = await supabase.auth.signUp({ email, password }));
      if (!error) {
        errEl.style.color = 'var(--green)';
        errEl.style.background = 'var(--green-dim)';
        errEl.textContent = 'Akun dibuat! Cek email untuk konfirmasi, atau langsung coba login.';
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Daftar';
        return;
      }
    }
    if (error) {
      errEl.style.color = 'var(--red)';
      errEl.style.background = 'var(--red-dim)';
      errEl.textContent = friendlyError(error.message);
      errEl.classList.add('show');
    }
  } catch(err) {
    errEl.textContent = 'Terjadi kesalahan. Coba lagi.';
    errEl.classList.add('show');
  }

  btn.disabled = false;
  btn.textContent = mode === 'login' ? 'Masuk' : 'Daftar';
}

function friendlyError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Email atau password salah.';
  if (msg.includes('Email not confirmed')) return 'Email belum dikonfirmasi. Cek inbox kamu.';
  if (msg.includes('User already registered')) return 'Email ini sudah terdaftar. Coba login.';
  if (msg.includes('Password should be at least')) return 'Password minimal 6 karakter.';
  return msg;
}

export async function logout() {
  await supabase.auth.signOut();
}
