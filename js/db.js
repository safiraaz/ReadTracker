// db.js — all Supabase DB operations
import { supabase } from './supabase.js';

// ======= ITEMS =======

export async function fetchItems(userId) {
  const { data, error } = await supabase
    .from('tracker_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(dbToLocal);
}

export async function insertItem(userId, item) {
  const { data, error } = await supabase
    .from('tracker_items')
    .insert([localToDb(userId, item)])
    .select()
    .single();
  if (error) throw error;
  return dbToLocal(data);
}

export async function updateItem(item) {
  const { error } = await supabase
    .from('tracker_items')
    .update(localToDb(null, item))
    .eq('id', item.id);
  if (error) throw error;
}

export async function deleteItemDb(id) {
  const { error } = await supabase
    .from('tracker_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAllItems(userId) {
  const { error } = await supabase
    .from('tracker_items')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

// ======= GENRES =======

export async function fetchGenres(userId) {
  const { data, error } = await supabase
    .from('user_genres')
    .select('name')
    .eq('user_id', userId)
    .order('name');
  if (error) throw error;
  return data.map(r => r.name);
}

export async function insertGenre(userId, name) {
  const { error } = await supabase
    .from('user_genres')
    .upsert([{ user_id: userId, name }], { onConflict: 'name' });
  if (error) throw error;
}

export async function insertGenresBulk(userId, names) {
  if (!names.length) return;
  const rows = names.map(name => ({ user_id: userId, name }));
  const { error } = await supabase
    .from('user_genres')
    .upsert(rows, { onConflict: 'name' });
  if (error) console.warn('Genre bulk upsert:', error);
}

// ======= MIGRATE from localStorage =======

export async function migrateFromLocalStorage(userId) {
  try {
    const raw = localStorage.getItem('manhwa-tracker-v2');
    if (!raw) return { items: 0, genres: 0 };
    const local = JSON.parse(raw);

    // insert genres
    const genres = local.genres || [];
    await insertGenresBulk(userId, genres);

    // insert items
    const items = local.items || [];
    if (items.length) {
      const rows = items.map(item => localToDb(userId, item));
      const { error } = await supabase
        .from('tracker_items')
        .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw error;
    }

    return { items: items.length, genres: genres.length };
  } catch(e) {
    console.error('Migration error:', e);
    throw e;
  }
}

// ======= FIELD MAPPING =======

function localToDb(userId, item) {
  // Encode genres into cover field: "emoji||genre1,genre2"
  const emoji = item.cover || '';
  const genres = (item.genres || []).join(',');
  const coverEncoded = genres ? `${emoji}||${genres}` : emoji;

  const row = {
    title: item.title,
    alt_titles: item.altTitles || [],
    type: item.type,
    status: item.status,
    series_status: item.seriesStatus,
    chapter: item.chapter || 0,
    total_chapter: item.totalChapter || 0,
    rating: item.rating || 0,
    notes: item.notes || '',
    cover: coverEncoded,
    cover_image: item.coverImage || null,
    links: item.links || [],
  };
  if (userId) row.user_id = userId;
  // preserve numeric id from localStorage for migration (bigint compatible)
  if (item.id && typeof item.id === 'number') row.id = item.id;
  return row;
}

function dbToLocal(row) {
  // Decode genres from cover field: "emoji||genre1,genre2"
  const coverRaw = row.cover || '';
  let emoji = coverRaw;
  let genres = [];
  if (coverRaw.includes('||')) {
    const parts = coverRaw.split('||');
    emoji = parts[0];
    genres = parts[1] ? parts[1].split(',').filter(Boolean) : [];
  }

  return {
    id: row.id,
    title: row.title,
    altTitles: row.alt_titles || [],
    type: row.type,
    status: row.status,
    seriesStatus: row.series_status,
    chapter: row.chapter || 0,
    totalChapter: row.total_chapter || 0,
    rating: row.rating || 0,
    notes: row.notes || '',
    cover: emoji,
    coverImage: row.cover_image || null,
    links: row.links || [],
    genres,
    added: new Date(row.created_at).getTime(),
  };
}
