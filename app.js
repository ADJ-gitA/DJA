/* DJA – lecteur de musique, extraits 30 s via l'API publique Deezer (JSONP). */
'use strict';

/* ================= Styles musicaux ================= */
const STYLES = [
  { id: 'maroc', name: 'Musique marocaine', color: 'linear-gradient(135deg,#c1272d 0%,#8a1c22 55%,#006233 100%)', solid: '#a3242a',
    artists: ['Saad Lamjarred', 'ElGrande Toto', 'Nass El Ghiwane', 'Douzi', 'Hatim Ammor', 'Asma Lmnawar', 'Manal', 'Dizzy DROS', 'Inkonnu', 'Hoba Hoba Spirit', 'Jil Jilala', 'Najat Aatabou', 'Stormy', 'Abdelhadi Belkhayat', 'Hamid El Kasri', 'Zina Daoudia'] },
  { id: 'topmaroc', name: 'Top Maroc', playlist: 1362512715, solid: '#006233', desc: 'Le classement Deezer de ce qu\'on écoute le plus au Maroc' },
  { id: 'pop', name: 'Pop', genre: 132, solid: '#8d67ab' },
  { id: 'rock', name: 'Rock', genre: 152, solid: '#e61e32' },
  { id: 'rap', name: 'Rap / Hip-hop', genre: 116, solid: '#ba5d07' },
  { id: 'rnb', name: 'R&B', genre: 165, solid: '#dc148c' },
  { id: 'electro', name: 'Électro', genre: 106, solid: '#0d73ec' },
  { id: 'dance', name: 'Dance', genre: 113, solid: '#477d95' },
  { id: 'jazz', name: 'Jazz', genre: 129, solid: '#1e3264' },
  { id: 'classique', name: 'Classique', genre: 98, solid: '#7d4b32' },
  { id: 'reggae', name: 'Reggae', genre: 144, solid: '#148a08' },
  { id: 'afrique', name: 'Musique africaine', genre: 2, solid: '#e8115b' },
  { id: 'latino', name: 'Latino', genre: 197, solid: '#e1118c' },
  { id: 'soul', name: 'Soul & Funk', genre: 169, solid: '#af2896' },
];
const styleById = id => STYLES.find(s => s.id === id);
const bgOf = s => s.color || `linear-gradient(135deg, ${s.solid}, ${shade(s.solid, -35)})`;

/* ================= Utilitaires ================= */
const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = sec => { sec = Math.max(0, Math.floor(sec || 0)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16); const f = c => Math.max(0, Math.min(255, Math.round(c + (pct / 100) * 255)));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(x => x.toString(16).padStart(2, '0')).join('');
}
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }
function shuffleArr(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15a.7.7 0 0 0 1.05.6l12.6-7.5a.7.7 0 0 0 0-1.2L8.05 3.9A.7.7 0 0 0 7 4.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.4 3.8 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.4 0 5.6 3.4 4.4 6.7C19.5 15.4 12 20 12 20z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/></svg>',
  heartOn: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.4 3.8 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.4 0 5.6 3.4 4.4 6.7C19.5 15.4 12 20 12 20z" fill="currentColor"/></svg>',
  dots: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M9 18V5l11-2v13" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="17" cy="16" r="3" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
  clock: '<svg viewBox="0 0 24 24" style="width:16px;height:16px;margin-left:auto"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  repeat: '<svg viewBox="0 0 24 24"><path d="M4 11V9a3 3 0 0 1 3-3h13M17 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H4M7 21l-3-3 3-3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  repeatOne: '<svg viewBox="0 0 24 24"><path d="M4 11V9a3 3 0 0 1 3-3h13M17 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H4M7 21l-3-3 3-3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 10.5 12.5 9.5V15" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  vol: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  volLow: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="m16 9 5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  shuffle: $('#shuffleBtn').innerHTML,
  plus: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/></svg>',
};
const EQ = '<span class="eq"><i></i><i></i><i></i></span>';

/* ================= API Deezer (JSONP, pas de CORS côté Deezer) ================= */
let cbSeq = 0;
function dz(path) {
  return new Promise((resolve, reject) => {
    const name = '__dz' + (++cbSeq);
    const s = document.createElement('script');
    const done = () => { clearTimeout(timer); window[name] = () => {}; s.remove(); };
    const timer = setTimeout(() => { done(); reject(new Error('Délai dépassé')); }, 15000);
    window[name] = data => { done(); data && data.error ? reject(new Error(data.error.message || 'Erreur Deezer')) : resolve(data); };
    s.onerror = () => { done(); reject(new Error('Réseau indisponible')); };
    s.src = `https://api.deezer.com/${path}${path.includes('?') ? '&' : '?'}output=jsonp&callback=${name}`;
    document.head.appendChild(s);
  });
}
const toTrack = t => ({
  id: t.id, title: t.title_short || t.title, artist: t.artist?.name || '', album: t.album?.title || '',
  cover: t.album?.cover_medium || t.artist?.picture_medium || '', coverSmall: t.album?.cover_small || t.album?.cover_medium || '',
  coverBig: t.album?.cover_xl || t.album?.cover_big || t.album?.cover_medium || '', duration: t.duration || 30, rank: t.rank || 0,
  preview: t.preview || '', at: Date.now(),
});

const styleCache = {};
function loadStyle(st) {
  if (styleCache[st.id]) return styleCache[st.id];
  const p = (async () => {
    let tracks;
    if (st.playlist) {
      tracks = ((await dz(`playlist/${st.playlist}/tracks?limit=100`)).data || []).map(toTrack);
    } else if (st.genre != null) {
      tracks = ((await dz(`chart/${st.genre}/tracks?limit=50`)).data || []).map(toTrack);
    } else {
      // Pas de genre « marocain » chez Deezer : on agrège les titres d'artistes marocains.
      const res = await Promise.allSettled(st.artists.map(a => dz(`search?q=${encodeURIComponent(a)}&limit=12`)));
      const lists = res.map((r, i) => {
        if (r.status !== 'fulfilled') return [];
        const key = norm(st.artists[i]);
        return (r.value.data || []).filter(t => norm(t.artist?.name || '').includes(key) || key.includes(norm(t.artist?.name || '') || '#')).slice(0, 6).map(toTrack);
      });
      tracks = [];
      // Les plus populaires en haut (score de popularité Deezer).
      tracks = lists.flat().sort((a, b) => b.rank - a.rank);
    }
    const seen = new Set();
    tracks = tracks.filter(t => t.preview && !seen.has(t.id) && seen.add(t.id));
    if (!tracks.length) throw new Error('Aucun titre trouvé');
    return tracks;
  })();
  styleCache[st.id] = p;
  p.catch(() => delete styleCache[st.id]);
  return p;
}

/* ================= Stockage local (likes, playlists) ================= */
const LS = {
  get(k, d) { try { const v = localStorage.getItem('nagham.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('nagham.' + k, JSON.stringify(v)); } catch { /* stockage indisponible */ } },
};
const store = { liked: LS.get('liked', []), playlists: LS.get('playlists', []) };
const persist = () => { LS.set('liked', store.liked); LS.set('playlists', store.playlists); };
const isLiked = id => store.liked.some(t => t.id === id);
function toggleLike(track) {
  if (isLiked(track.id)) { store.liked = store.liked.filter(t => t.id !== track.id); toast('Retiré des Titres likés'); }
  else { store.liked.unshift({ ...track }); toast('Ajouté aux Titres likés'); }
  persist(); refreshLikes(); renderLibrary();
  if (route.name === 'liked') render();
}
const playlistById = id => store.playlists.find(p => p.id === id);
function createPlaylist() {
  const pl = { id: 'pl' + Date.now().toString(36), name: `Ma playlist n°${store.playlists.length + 1}`, tracks: [], created: Date.now() };
  store.playlists.unshift(pl); persist(); renderLibrary();
  return pl;
}
function addToPlaylist(pl, track) {
  if (pl.tracks.some(t => t.id === track.id)) return toast(`Déjà dans « ${pl.name} »`);
  pl.tracks.push({ ...track }); persist(); renderLibrary(); toast(`Ajouté à « ${pl.name} »`);
  if (route.name === 'playlist' && route.id === pl.id) render();
}

/* ================= Lecteur =================
   Deux moteurs : YouTube (version complète, si une clé API est configurée)
   et l'extrait Deezer de 30 s (secours automatique). */
const audio = new Audio();
audio.preload = 'auto';
const P = {
  current: null, list: [], order: [], pos: -1, ctxKey: '', ctxLabel: '',
  queue: [], shuffle: LS.get('shuffle', false), repeat: LS.get('repeat', 0), // 0 off, 1 tout, 2 un titre
};
let volume = LS.get('volume', 0.8), muted = false;
audio.volume = volume;
let mode = 'audio'; // 'yt' = version complète YouTube, 'audio' = extrait Deezer
let ytPlaying = false;

/* ---------- YouTube ---------- */
const CFG = window.DJA_CONFIG || {};
const ytKey = () => (LS.get('ytKey', '') || CFG.youtubeApiKey || '').trim();
const ytIds = LS.get('ytIds', {}); // id Deezer -> liste d'ids de vidéos YouTube (mémorisé)
let ytQuotaHit = false, ytPlayer = null, ytReady = null;

function loadYT() {
  if (ytReady) return ytReady;
  ytReady = new Promise((resolve, reject) => {
    window.onYouTubeIframeAPIReady = () => {
      ytPlayer = new YT.Player('ytPlayer', {
        host: 'https://www.youtube-nocookie.com', // mode confidentialité renforcée de YouTube
        width: '100%', height: '100%',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, autoplay: 1 },
        events: { onReady: () => resolve(ytPlayer), onStateChange: onYtState, onError: onYtError },
      });
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => { ytReady = null; reject(new Error('YouTube injoignable')); };
    document.head.appendChild(s);
  });
  return ytReady;
}
async function ytSearch(q, key, music) {
  const url = 'https://www.googleapis.com/youtube/v3/search?part=id&type=video&maxResults=5&videoEmbeddable=true'
    + (music ? '&videoCategoryId=10' : '') + `&q=${encodeURIComponent(q)}&key=${encodeURIComponent(key)}`;
  const d = await (await fetch(url)).json();
  if (d.error) { const e = new Error(d.error.message); e.reason = d.error.errors?.[0]?.reason || ''; throw e; }
  return (d.items || []).map(i => i.id?.videoId).filter(Boolean);
}
async function findVideos(track) {
  if (track.id in ytIds) return ytIds[track.id];
  const key = ytKey();
  if (!key || ytQuotaHit) return null;
  const q = `${track.artist} ${track.title}`;
  try {
    let ids = await ytSearch(q, key, true);
    if (!ids.length) ids = await ytSearch(q, key, false);
    ytIds[track.id] = ids; LS.set('ytIds', ytIds);
    return ids;
  } catch (e) {
    if (/quota|rateLimit/i.test(e.reason || '')) { ytQuotaHit = true; toast('Quota YouTube du jour atteint : extraits de 30 s jusqu\'à demain'); }
    else if (e.reason) toast('Clé YouTube refusée : vérifie-la dans les réglages');
    return null;
  }
}
function onYtState(e) {
  const S = YT.PlayerState;
  if (e.data === S.PLAYING) { ytPlaying = true; onPlayState(); }
  else if (e.data === S.PAUSED || e.data === S.ENDED) {
    ytPlaying = false; onPlayState();
    if (e.data === S.ENDED && mode === 'yt') onEnded();
  }
}
function onYtError() {
  const t = P.current; if (!t || mode !== 'yt') return;
  const ids = ytIds[t.id] || [];
  ids.shift(); LS.set('ytIds', ytIds); // vidéo non lisible : on essaie la suivante
  if (ids.length) ytPlayer.loadVideoById(ids[0]);
  else playPreview(t, loadToken, false);
}

/* ---------- Commandes communes aux deux moteurs ---------- */
const isPaused = () => mode === 'yt' ? !ytPlaying : audio.paused;
const curTime = () => mode === 'yt' ? (ytPlayer?.getCurrentTime?.() || 0) : audio.currentTime;
const curDur = () => mode === 'yt' ? (ytPlayer?.getDuration?.() || P.current?.duration || 0) : (audio.duration || 30);
function seekTo(t) { if (mode === 'yt') ytPlayer?.seekTo?.(t, true); else audio.currentTime = t; }
function pauseMedia() { if (mode === 'yt') ytPlayer?.pauseVideo?.(); else audio.pause(); }
function resumeMedia() { if (mode === 'yt') ytPlayer?.playVideo?.(); else audio.play().catch(() => {}); }
function applyVolume() {
  audio.volume = volume; audio.muted = muted;
  if (ytPlayer?.setVolume) { ytPlayer.setVolume(Math.round(volume * 100)); muted ? ytPlayer.mute() : ytPlayer.unMute(); }
}
function onPlayState() { syncPlayState(); renderLibrary(); }
function onEnded() { if (P.repeat === 2) { seekTo(0); resumeMedia(); } else next(true); }
function syncBadge() {
  const b = $('#modeBadge');
  const full = P.current ? mode === 'yt' : !!ytKey();
  b.textContent = full ? 'Version complète' : 'Extrait 30 s';
  b.classList.toggle('full', full);
  b.title = full ? 'Lecture intégrale via YouTube' : 'Ajoute une clé YouTube dans les réglages pour écouter les titres en entier';
}
function setMode(m) {
  if (m !== 'yt' && ytPlayer?.stopVideo) { ytPlayer.stopVideo(); ytPlaying = false; }
  if (m !== 'audio' && audio.src) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
  mode = m;
  document.body.classList.toggle('has-video', m === 'yt');
  $('#videoBox').hidden = m !== 'yt';
  syncBadge();
}

function buildOrder(startIdx) {
  const idx = P.list.map((_, i) => i);
  if (!P.shuffle) { P.order = idx; P.pos = startIdx; return; }
  const rest = shuffleArr(idx.filter(i => i !== startIdx));
  P.order = startIdx >= 0 ? [startIdx, ...rest] : rest; P.pos = startIdx >= 0 ? 0 : -1;
}
function playContext(list, index, key, label) {
  P.list = list.slice(); P.ctxKey = key; P.ctxLabel = label;
  if (index == null) index = P.shuffle ? Math.floor(Math.random() * list.length) : 0;
  buildOrder(index);
  loadAndPlay(P.list[index]);
}
let loadToken = 0;
async function loadAndPlay(track) {
  if (!track) return;
  const token = ++loadToken;
  P.current = track; updateNowPlaying();
  if (ytKey()) {
    const ids = await findVideos(track);
    if (token !== loadToken) return;
    if (ids?.length) {
      try {
        setMode('yt');
        await loadYT();
        if (token !== loadToken) return;
        applyVolume();
        ytPlayer.loadVideoById(ids[0]);
        return;
      } catch { toast('YouTube indisponible : lecture de l\'extrait'); }
    }
  }
  playPreview(track, token, false);
}
async function playPreview(track, token, retried) {
  setMode('audio');
  // Les liens d'extraits Deezer expirent : on les renouvelle s'ils ont plus de 10 min.
  if (retried || !track.preview || Date.now() - (track.at || 0) > 10 * 60 * 1000) {
    try { const fresh = await dz(`track/${track.id}`); track.preview = fresh.preview; track.at = Date.now(); } catch { /* on tente quand même */ }
    if (token !== loadToken) return;
  }
  if (!track.preview) { toast('Titre indisponible'); return next(true); }
  audio.src = track.preview; audio.dataset.retried = retried ? '1' : '';
  applyVolume();
  audio.play().catch(() => {});
}
function next(auto = false) {
  if (P.queue.length) return loadAndPlay(P.queue.shift()).then(renderQueue);
  if (!P.order.length) return;
  if (P.pos + 1 >= P.order.length) {
    if (P.repeat === 1 || !auto) { if (P.shuffle) buildOrder(-1); P.pos = 0; }
    else { pauseMedia(); seekTo(0); return; }
  } else P.pos++;
  loadAndPlay(P.list[P.order[P.pos]]);
}
function prev() {
  if (curTime() > 3 || P.pos <= 0) { seekTo(0); return; }
  P.pos--; loadAndPlay(P.list[P.order[P.pos]]);
}
function togglePlay() {
  if (!P.current) {
    // Rien en cours : on lance la page affichée (ou les titres likés).
    const tracks = currentViewTracks();
    if (tracks?.length) playContext(tracks, null, routeKey(), viewLabel());
    return;
  }
  isPaused() ? resumeMedia() : pauseMedia();
}
function addToQueue(track) { P.queue.push({ ...track }); renderQueue(); toast('Ajouté à la file d\'attente'); }

audio.addEventListener('ended', onEnded);
audio.addEventListener('error', () => {
  if (!P.current || !audio.getAttribute('src') || mode !== 'audio') return;
  if (!audio.dataset.retried) playPreview(P.current, loadToken, true);
  else { toast('Lecture impossible, titre suivant'); next(true); }
});
audio.addEventListener('play', onPlayState);
audio.addEventListener('pause', onPlayState);
audio.addEventListener('timeupdate', () => mode === 'audio' && updateProgress());
setInterval(() => mode === 'yt' && updateProgress(), 400);
function updateProgress() {
  if (seeking) return;
  const d = curDur(), c = curTime();
  seek.max = d || 1; seek.value = c; setFill(seek);
  $('#curTime').textContent = fmt(c); $('#durTime').textContent = fmt(d);
}

/* ---------- Barre de lecture ---------- */
const seek = $('#seek'), vol = $('#volume');
let seeking = false;
const setFill = el => el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min || 1)) * 100 + '%');
seek.addEventListener('input', () => { seeking = true; setFill(seek); $('#curTime').textContent = fmt(seek.value); });
seek.addEventListener('change', () => { if (P.current) seekTo(+seek.value); seeking = false; });
vol.value = volume; setFill(vol);
let lastVol = volume || 0.8;
vol.addEventListener('input', () => { volume = +vol.value; muted = false; setFill(vol); LS.set('volume', volume); applyVolume(); syncVol(); });
$('#muteBtn').onclick = () => {
  if (volume === 0 || muted) { muted = false; volume = volume || lastVol || 0.8; }
  else { lastVol = volume; muted = true; }
  vol.value = muted ? 0 : volume; setFill(vol); applyVolume(); syncVol();
};
function syncVol() { const v = muted ? 0 : volume; $('#muteBtn').innerHTML = v === 0 ? ICON.mute : v < .5 ? ICON.volLow : ICON.vol; }
$('#playBtn').onclick = togglePlay;
$('#nextBtn').onclick = () => next(false);
$('#prevBtn').onclick = prev;
$('#shuffleBtn').onclick = () => {
  P.shuffle = !P.shuffle; LS.set('shuffle', P.shuffle);
  if (P.list.length && P.current) { const i = P.list.findIndex(t => t.id === P.current.id); buildOrder(i); }
  syncModes(); renderQueue(); toast(P.shuffle ? 'Lecture aléatoire activée' : 'Lecture aléatoire désactivée');
};
$('#repeatBtn').onclick = () => { P.repeat = (P.repeat + 1) % 3; LS.set('repeat', P.repeat); syncModes(); renderQueue(); };
function syncModes() {
  $('#shuffleBtn').classList.toggle('on', P.shuffle);
  const r = $('#repeatBtn'); r.classList.toggle('on', P.repeat > 0); r.innerHTML = P.repeat === 2 ? ICON.repeatOne : ICON.repeat;
  r.title = ['Activer la répétition', 'Répéter un titre', 'Désactiver la répétition'][P.repeat];
}
function syncPlayState() {
  const on = !isPaused();
  $('#playBtn').innerHTML = on ? ICON.pause : ICON.play; $('#playBtn').title = on ? 'Pause' : 'Lecture';
  document.body.classList.toggle('is-playing', on);
  markPlaying();
}
function updateNowPlaying() {
  const t = P.current;
  $('#npCover').hidden = !t; $('#npLike').hidden = !t;
  if (!t) return;
  $('#npCover').src = t.coverSmall || t.cover; $('#npTitle').textContent = t.title; $('#npArtist').textContent = t.artist;
  document.title = `${t.title} • ${t.artist}`;
  refreshLikes(); markPlaying(); renderQueue(); renderLibrary();
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: t.album, artwork: [{ src: t.coverBig || t.cover, sizes: '500x500' }] });
    navigator.mediaSession.setActionHandler('nexttrack', () => next(false));
    navigator.mediaSession.setActionHandler('previoustrack', prev);
  }
}
$('#npLike').onclick = () => P.current && toggleLike(P.current);
function refreshLikes() {
  if (P.current) { const on = isLiked(P.current.id); const b = $('#npLike'); b.innerHTML = on ? ICON.heartOn : ICON.heart; b.classList.toggle('on', on); b.title = on ? 'Retirer des titres likés' : 'Ajouter aux titres likés'; }
  document.querySelectorAll('.row').forEach(r => { const on = isLiked(+r.dataset.id); const h = $('.heart', r); if (h) { h.classList.toggle('on', on); h.innerHTML = on ? ICON.heartOn : ICON.heart; } });
}
function markPlaying() {
  const id = P.current?.id; const on = !isPaused();
  document.querySelectorAll('.row').forEach(r => { const me = +r.dataset.id === id && r.closest('[data-ctx]')?.dataset.ctx === P.ctxKey; r.classList.toggle('playing', me); r.classList.toggle('is-on', me && on); });
  document.querySelectorAll('.card[data-id]').forEach(c => { const me = +c.dataset.id === id; c.classList.toggle('playing', me); const f = $('.fab', c); if (f) f.innerHTML = me && on ? ICON.pause : ICON.play; });
  document.querySelectorAll('[data-ctxplay]').forEach(b => { b.innerHTML = b.dataset.ctxplay === P.ctxKey && on ? ICON.pause : ICON.play; });
}

/* ---------- File d'attente ---------- */
const queuePanel = $('#queuePanel');
$('#queueBtn').onclick = () => { queuePanel.hidden = !queuePanel.hidden; $('#queueBtn').classList.toggle('on', !queuePanel.hidden); renderQueue(); };
$('#closeQueue').onclick = () => { queuePanel.hidden = true; $('#queueBtn').classList.remove('on'); };
const qItem = (t, attrs, extra = '') => `<div class="q-item" ${attrs}><img src="${esc(t.coverSmall || t.cover)}" alt=""><div class="meta"><div class="tt">${esc(t.title)}</div><div class="ar">${esc(t.artist)}</div></div>${extra}</div>`;
function renderQueue() {
  if (queuePanel.hidden) return;
  const body = $('#queueBody');
  if (!P.current) { body.innerHTML = '<div class="empty"><h3>File vide</h3>Lancez un titre pour remplir la file d\'attente.</div>'; return; }
  let h = `<div class="q-label">En cours de lecture</div>` + qItem(P.current, 'class="q-item current"');
  if (P.queue.length) {
    h += `<div class="q-label">Suivant dans la file <button class="q-clear" data-qclear>Effacer</button></div>`;
    h += P.queue.map((t, i) => qItem(t, `data-q="${i}"`, `<button class="icon-btn" data-qrm="${i}" title="Retirer">${ICON.x}</button>`)).join('');
  }
  const upcoming = [];
  for (let k = P.pos + 1; k < P.order.length && upcoming.length < 30; k++) upcoming.push(P.order[k]);
  if (upcoming.length) h += `<div class="q-label">Suivant de : ${esc(P.ctxLabel)}</div>` + upcoming.map(i => qItem(P.list[i], `data-qctx="${i}"`)).join('');
  body.innerHTML = h;
}
$('#queueBody').addEventListener('click', e => {
  const rm = e.target.closest('[data-qrm]'); if (rm) { P.queue.splice(+rm.dataset.qrm, 1); return renderQueue(); }
  if (e.target.closest('[data-qclear]')) { P.queue = []; return renderQueue(); }
  const q = e.target.closest('[data-q]'); if (q) { const [t] = P.queue.splice(+q.dataset.q, 1); return loadAndPlay(t); }
  const c = e.target.closest('[data-qctx]'); if (c) { const i = +c.dataset.qctx; P.pos = P.order.indexOf(i); loadAndPlay(P.list[i]); }
});

/* ================= Routage ================= */
let route = { name: 'home' };
function parseHash() {
  const [, name = 'home', id = ''] = ((location.hash.slice(1) || '/home').split('?')[0]).split('/');
  return { name, id: decodeURIComponent(id) };
}
const routeKey = () => `${route.name}:${route.id || ''}`;
window.addEventListener('hashchange', () => {
  if (matchMedia('(max-width:768px)').matches) $('#closeQueue').click();
  route = parseHash(); render();
});
$('#backBtn').onclick = () => history.back();
$('#fwdBtn').onclick = () => history.forward();
const main = $('#main');
main.addEventListener('scroll', () => $('#topbar').classList.toggle('solid', main.scrollTop > 40));

let viewTracks = null; // titres affichés dans la vue courante
const currentViewTracks = () => viewTracks || store.liked;
function viewLabel() {
  if (route.name === 'style') return styleById(route.id)?.name || '';
  if (route.name === 'playlist') return playlistById(route.id)?.name || '';
  if (route.name === 'liked') return 'Titres likés';
  if (route.name === 'search') return `Recherche « ${$('#searchInput').value} »`;
  return 'Accueil';
}

const view = $('#view');
let renderSeq = 0;
function render() {
  const seq = ++renderSeq; viewTracks = null;
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === route.name));
  view.className = 'view'; main.scrollTop = 0; closeMenu();
  const r = route.name;
  if (r === 'search') {
    const q = new URLSearchParams(location.hash.split('?')[1] || '').get('q') || '';
    if (document.activeElement !== $('#searchInput')) $('#searchInput').value = q;
    return renderSearch($('#searchInput').value.trim(), seq);
  }
  if (r === 'style') return renderStyle(seq);
  if (r === 'playlist' || r === 'liked') return renderPlaylist();
  if (r === 'library') return renderLibraryView();
  renderHome(seq);
  renderLibrary();
}
const isCurrentRender = seq => seq === renderSeq;

/* ---------- Accueil ---------- */
function genCover(st, cls = '', noText = false) { return `<div class="gen-cover ${cls}" style="background:${bgOf(st)}${noText ? ';font-size:0' : ''}">${noText ? '' : esc(st.name)}</div>`; }
const likedCover = (cls = '') => `<div class="gen-cover liked ${cls}">${ICON.heartOn}</div>`;
const plCover = (pl, cls = '') => pl.tracks[0] ? `<img class="${cls}" src="${esc(pl.tracks[0].cover)}" alt="" style="object-fit:cover">` : `<div class="gen-cover pl ${cls}">${ICON.note}</div>`;

function renderHome(seq) {
  const h = new Date().getHours();
  const greet = h < 5 ? 'Bonne nuit' : h < 18 ? 'Bonjour' : 'Bonsoir';
  const quick = [{ href: '#/liked', thumb: likedCover('thumb'), label: 'Titres likés', ctx: 'liked:' },
    ...STYLES.slice(0, 7).map(s => ({ href: `#/style/${s.id}`, thumb: genCover(s, 'thumb'), label: s.name, ctx: `style:${s.id}`, sid: s.id }))];
  const banner = ytKey() ? "" : `<div class="banner"><div><b>Écoute les titres en entier</b><span>Pour l'instant, seuls des extraits de 30 s sont lus. Ajoute une clé YouTube pour les versions complètes.</span></div><button class="pill" data-settings>Activer</button></div>`;
  view.innerHTML = `<h1 class="greet">${greet}</h1>${banner}
    <div class="quick-grid">${quick.map(q => `<a class="quick" href="${q.href}" ${q.sid ? `data-qs="${q.sid}"` : ''}>${q.thumb}<span class="label">${esc(q.label)}</span><button class="fab" data-ctxplay="${q.ctx}" data-playstyle="${q.sid || ''}" title="Lecture">${ICON.play}</button></a>`).join('')}</div>
    ${STYLES.map(s => `<section class="shelf" data-shelf="${s.id}">
      <div class="shelf-head"><h2><a href="#/style/${s.id}">${esc(s.name)}</a></h2><a class="more" href="#/style/${s.id}">Tout afficher</a></div>
      <div class="cards">${Array.from({ length: 8 }, () => `<div class="card"><div class="art skeleton"></div><div class="skeleton" style="height:14px;width:80%"></div></div>`).join('')}</div>
    </section>`).join('')}`;
  markPlaying();
  STYLES.forEach(s => loadStyle(s).then(tracks => {
    if (!isCurrentRender(seq)) return;
    const shelf = view.querySelector(`[data-shelf="${s.id}"] .cards`);
    shelf.dataset.ctx = `style:${s.id}`;
    shelf.innerHTML = tracks.slice(0, 10).map((t, i) => `<div class="card" data-id="${t.id}" data-style="${s.id}" data-i="${i}">
      <div class="art"><img src="${esc(t.cover)}" alt="" loading="lazy"><button class="fab" title="Lecture">${ICON.play}</button></div>
      <div class="t">${esc(t.title)}</div><div class="s">${esc(t.artist)}</div></div>`).join('');
    const q = view.querySelector(`[data-qs="${s.id}"] .thumb`);
    if (q && tracks[0]) q.outerHTML = `<img class="thumb" src="${esc(tracks[0].cover)}" alt="" style="object-fit:cover">`;
    markPlaying();
  }).catch(err => {
    if (!isCurrentRender(seq)) return;
    view.querySelector(`[data-shelf="${s.id}"] .cards`).outerHTML = `<div class="err">Impossible de charger ce style (${esc(err.message)}).</div>`;
  }));
}

/* ---------- Page d'un style ---------- */
async function renderStyle(seq) {
  const st = styleById(route.id);
  if (!st) { location.hash = '#/home'; return; }
  view.className = 'view full-bleed';
  view.innerHTML = heroHTML({ bg: bgOf(st), coverHTML: genCover(st, 'cover'), kind: 'Style', title: st.name, info: 'Chargement…' }) +
    `<div class="tracks"><div class="skeleton" style="height:300px"></div></div>`;
  renderLibrary();
  try {
    const tracks = await loadStyle(st);
    if (!isCurrentRender(seq)) return;
    viewTracks = tracks;
    $('.hero .info', view).innerHTML = `<b>DJA</b> • ${tracks.length} titres • ${ytKey() ? "versions complètes" : "extraits de 30 s"}`;
    $('.tracks', view).outerHTML = actionsHTML(`style:${st.id}`) + trackTable(tracks, `style:${st.id}`);
    markPlaying(); refreshLikes(); syncModes();
  } catch (err) {
    if (isCurrentRender(seq)) $('.tracks', view).innerHTML = `<div class="err" style="padding:24px">Impossible de charger ce style : ${esc(err.message)}. <button class="more" onclick="render()" style="text-decoration:underline">Réessayer</button></div>`;
  }
}
function heroHTML({ bg, coverHTML, kind, title, info, editable }) {
  return `<div class="hero" style="background:${bg}"><div style="position:absolute;inset:0;background:linear-gradient(transparent 0,rgba(0,0,0,.45))"></div>
    <div style="position:relative">${coverHTML}</div>
    <div style="position:relative;min-width:0"><div class="kind">${esc(kind)}</div><h1 ${editable ? 'contenteditable="true" spellcheck="false" title="Cliquer pour renommer" id="plName"' : ''}>${esc(title)}</h1><div class="info">${info}</div></div></div>`;
}
function actionsHTML(ctx, extra = '') {
  return `<div class="actions"><button class="fab big" data-ctxplay="${ctx}" data-playview title="Lecture">${ICON.play}</button>
    <button class="icon-btn ${P.shuffle ? 'on' : ''}" data-shuffleview title="Lecture aléatoire">${ICON.shuffle}</button>${extra}</div>`;
}
function trackTable(tracks, ctx, { compact = false, playlistId = '' } = {}) {
  return `<div class="tracks ${compact ? 'compact' : ''}" data-ctx="${esc(ctx)}" data-pl="${esc(playlistId)}">
    ${compact ? '' : `<div class="thead"><span style="text-align:center">#</span><span>Titre</span><span>Album</span><span></span><span class="dur">${ICON.clock}</span><span></span></div>`}
    ${tracks.map((t, i) => `<div class="row" data-id="${t.id}" data-i="${i}">
      <div class="num"><span class="n">${i + 1}</span>${EQ}<button class="play-small" data-rowplay title="Lecture">${ICON.play}</button></div>
      <div class="tcell"><img src="${esc(t.coverSmall || t.cover)}" alt="" loading="lazy"><div class="title-line"><div class="tt">${esc(t.title)}</div><div class="ar">${esc(t.artist)}</div></div></div>
      <div class="alb">${esc(t.album)}</div>
      <button class="icon-btn heart" data-like title="Titres likés">${ICON.heart}</button>
      <div class="dur">${fmt(t.duration)}</div>
      <button class="icon-btn dots" data-menu title="Plus d'options">${ICON.dots}</button>
    </div>`).join('')}</div>`;
}

/* ---------- Titres likés / playlist ---------- */
function renderPlaylist() {
  const liked = route.name === 'liked';
  const pl = liked ? null : playlistById(route.id);
  if (!liked && !pl) { location.hash = '#/home'; return; }
  const tracks = liked ? store.liked : pl.tracks;
  viewTracks = tracks;
  const ctx = routeKey();
  const total = tracks.reduce((a, t) => a + (t.duration || 0), 0);
  view.className = 'view full-bleed';
  view.innerHTML = heroHTML({
    bg: liked ? 'linear-gradient(#c0396b,#2d1530)' : 'linear-gradient(#4a4160,#221d2f)',
    coverHTML: liked ? likedCover('cover') : plCover(pl, 'cover'),
    kind: 'Playlist', title: liked ? 'Titres likés' : pl.name, editable: !liked,
    info: `<b>Vous</b> • ${tracks.length} titre${tracks.length > 1 ? 's' : ''}${total ? ` • ${Math.round(total / 60)} min` : ''}`,
  }) + (tracks.length ? actionsHTML(ctx, liked ? '' : `<button class="icon-btn" data-delpl title="Supprimer la playlist">${ICON.trash}</button>`) + trackTable(tracks, ctx, { playlistId: liked ? 'liked' : pl.id })
    : `${liked ? '' : actionsHTML(ctx, `<button class="icon-btn" data-delpl title="Supprimer la playlist">${ICON.trash}</button>`).replace('class="fab big"', 'class="fab big" style="visibility:hidden"')}
       <div class="empty"><h3>${liked ? 'Les titres que vous aimez s\'afficheront ici' : 'Cette playlist est vide'}</h3>${liked ? 'Cliquez sur le cœur d\'un titre pour l\'ajouter.' : 'Utilisez le menu « … » d\'un titre puis « Ajouter à la playlist ».'}<br><br><a class="fab" href="#/search" style="display:inline-grid;width:auto;padding:0 28px;height:44px;border-radius:500px;font-weight:700">Trouver des titres</a></div>`);
  const name = $('#plName');
  if (name) {
    name.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); name.blur(); } });
    name.addEventListener('blur', () => { const v = name.textContent.trim(); if (v && v !== pl.name) { pl.name = v.slice(0, 80); persist(); renderLibrary(); toast('Playlist renommée'); } else name.textContent = pl.name; });
  }
  markPlaying(); refreshLikes(); renderLibrary();
}

/* ---------- Recherche ---------- */
const searchInput = $('#searchInput');
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const q = searchInput.value.trim();
    const target = '#/search' + (q ? '?q=' + encodeURIComponent(q) : '');
    if (location.hash !== target) history[route.name === 'search' ? 'replaceState' : 'pushState'](null, '', target);
    route = parseHash(); render();
  }, 300);
});
searchInput.addEventListener('focus', () => { if (route.name !== 'search') location.hash = '#/search'; });

function renderSearch(q, seq) {
  renderLibrary();
  if (!q) {
    view.innerHTML = `<h2 class="browse-title">Parcourir tous les styles</h2><div class="genre-grid">${STYLES.map(s =>
      `<a class="genre-tile" href="#/style/${s.id}" style="background:${s.color || s.solid}" data-gt="${s.id}">${esc(s.name)}</a>`).join('')}</div>`;
    STYLES.forEach(s => loadStyle(s).then(tr => { const el = view.querySelector(`[data-gt="${s.id}"]`); if (el && tr[0] && isCurrentRender(seq)) el.insertAdjacentHTML('beforeend', `<img src="${esc(tr[0].cover)}" alt="">`); }).catch(() => {}));
    return;
  }
  view.innerHTML = `<div class="skeleton" style="height:240px;margin-top:8px"></div>`;
  dz(`search?q=${encodeURIComponent(q)}&limit=40`).then(d => {
    if (!isCurrentRender(seq)) return;
    const tracks = (d.data || []).map(toTrack).filter(t => t.preview);
    viewTracks = tracks;
    if (!tracks.length) { view.innerHTML = `<div class="empty"><h3>Aucun résultat pour « ${esc(q)} »</h3>Vérifiez l'orthographe ou essayez d'autres mots-clés.</div>`; return; }
    const ctx = `search:${q}`; const top = tracks[0];
    view.innerHTML = `<div class="search-top">
      <div><h2>Meilleur résultat</h2><div class="top-result" data-ctx="${esc(ctx)}"><div class="row" data-id="${top.id}" data-i="0" style="display:block;height:auto;padding:0;background:none">
        <img src="${esc(top.cover)}" alt=""><div class="t">${esc(top.title)}</div><div class="s">Titre • <b>${esc(top.artist)}</b></div>
        <button class="fab" data-rowplay title="Lecture">${ICON.play}</button></div></div></div>
      <div><h2>Titres</h2>${trackTable(tracks.slice(0, 4), ctx, { compact: true })}</div></div>
      <h2 class="section-h">Tous les titres</h2>${trackTable(tracks, ctx)}`;
    markPlaying(); refreshLikes();
  }).catch(err => { if (isCurrentRender(seq)) view.innerHTML = `<div class="err">La recherche a échoué : ${esc(err.message)}</div>`; });
}

/* ---------- Bibliothèque ---------- */
function libraryItems() {
  const playingCtx = !isPaused() ? P.ctxKey : '';
  const item = (href, thumb, name, desc, ctx) => `<a class="lib-item ${location.hash === href ? 'active' : ''} ${playingCtx === ctx ? 'playing' : ''}" href="${href}">${thumb}<div class="meta"><div class="name">${esc(name)}</div><div class="desc">${desc}</div></div></a>`;
  return item('#/liked', likedCover('thumb'), 'Titres likés', `Playlist • ${store.liked.length} titre${store.liked.length > 1 ? 's' : ''}`, 'liked:') +
    store.playlists.map(p => item(`#/playlist/${p.id}`, plCover(p, 'thumb'), p.name, `Playlist • ${p.tracks.length} titre${p.tracks.length > 1 ? 's' : ''}`, `playlist:${p.id}`)).join('') +
    `<div class="lib-section">Styles</div>` +
    STYLES.map(s => item(`#/style/${s.id}`, genCover(s, 'thumb', true), s.name, 'Style', `style:${s.id}`)).join('');
}
function renderLibrary() { $('#libList').innerHTML = libraryItems(); }
function renderLibraryView() {
  view.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin:8px 0 12px"><h1 class="greet" style="margin:0">Bibliothèque</h1>
    <button class="icon-btn" data-newpl title="Créer une playlist" style="width:40px;height:40px">${ICON.plus}</button></div><div class="lib-list" style="padding:0">${libraryItems()}</div>`;
}
$('#newPlaylistBtn').onclick = () => { const pl = createPlaylist(); location.hash = `#/playlist/${pl.id}`; toast('Playlist créée – cliquez sur le titre pour la renommer'); };

/* ================= Interactions (délégation) ================= */
function trackFromRow(row) {
  const wrap = row.closest('[data-ctx]');
  const card = row.classList.contains('card');
  if (card) { const p = styleCache[row.dataset.style]; return { wrap, ctx: `style:${row.dataset.style}`, i: +row.dataset.i, getList: () => p }; }
  return { wrap, ctx: wrap?.dataset.ctx, i: +row.dataset.i, getList: () => Promise.resolve(listForCtx(wrap)) };
}
function listForCtx(wrap) {
  const pl = wrap?.dataset.pl;
  if (pl === 'liked') return store.liked;
  if (pl) return playlistById(pl)?.tracks || [];
  return viewTracks || [];
}
async function playFromEl(el) {
  const { ctx, i, getList } = trackFromRow(el);
  const list = await getList();
  if (!list?.[i]) return;
  if (P.current?.id === list[i].id && P.ctxKey === ctx) return togglePlay();
  const label = ctx.startsWith('style:') ? styleById(ctx.slice(6)).name : viewLabel();
  playContext(list, i, ctx, label);
}
view.addEventListener('click', async e => {
  const t = e.target;
  const like = t.closest('[data-like]');
  if (like) { const row = like.closest('.row'); const list = listForCtx(row.closest('[data-ctx]')); const tr = list[+row.dataset.i]; if (tr) toggleLike(tr); return; }
  const menuBtn = t.closest('[data-menu]');
  if (menuBtn) { e.stopPropagation(); return openTrackMenu(menuBtn.closest('.row'), menuBtn.getBoundingClientRect()); }
  if (t.closest('[data-rowplay]')) return playFromEl(t.closest('.row'));
  if (t.closest('[data-shuffleview]')) { $('#shuffleBtn').click(); t.closest('[data-shuffleview]').classList.toggle('on', P.shuffle); return; }
  if (t.closest('[data-delpl]')) {
    const pl = playlistById(route.id);
    if (pl && confirm(`Supprimer la playlist « ${pl.name} » ?`)) { store.playlists = store.playlists.filter(p => p !== pl); persist(); location.hash = '#/home'; toast('Playlist supprimée'); }
    return;
  }
  if (t.closest('[data-newpl]')) return $('#newPlaylistBtn').click();
  if (t.closest('[data-settings]')) return openSettings();
  const ctxBtn = t.closest('[data-ctxplay]');
  if (ctxBtn) {
    e.preventDefault(); e.stopPropagation();
    const key = ctxBtn.dataset.ctxplay;
    if (P.ctxKey === key && P.current) return togglePlay();
    if (ctxBtn.dataset.playstyle) { const s = styleById(ctxBtn.dataset.playstyle); const tr = await loadStyle(s); return playContext(tr, null, key, s.name); }
    if (key === 'liked:' && !ctxBtn.hasAttribute('data-playview')) { if (store.liked.length) playContext(store.liked, null, key, 'Titres likés'); else toast('Aucun titre liké pour le moment'); return; }
    const list = currentViewTracks(); if (list.length) playContext(list, null, key, viewLabel());
    return;
  }
  const card = t.closest('.card[data-id]');
  if (card) return playFromEl(card);
  const row = t.closest('.row');
  if (row && row.closest('.top-result')) return playFromEl(row);
  if (row) {
    document.querySelectorAll('.row.sel').forEach(r => r.classList.remove('sel')); row.classList.add('sel');
    if (matchMedia('(max-width:768px)').matches) playFromEl(row); // un seul tap sur mobile
  }
});
view.addEventListener('dblclick', e => { const row = e.target.closest('.row'); if (row && !e.target.closest('button')) playFromEl(row); });
view.addEventListener('contextmenu', e => { const row = e.target.closest('.row'); if (row) { e.preventDefault(); openTrackMenu(row, { left: e.clientX, bottom: e.clientY, right: e.clientX }); } });

/* ---------- Menu contextuel ---------- */
const menu = $('#menu');
function openTrackMenu(row, rect) {
  const wrap = row.closest('[data-ctx]'); const list = listForCtx(wrap); const track = list[+row.dataset.i];
  if (!track) return;
  const plId = wrap.dataset.pl;
  menu.innerHTML = `<button data-m="queue">Ajouter à la file d'attente</button>
    <button data-m="like">${isLiked(track.id) ? 'Retirer des Titres likés' : 'Ajouter aux Titres likés'}</button>
    ${plId && plId !== 'liked' ? '<button data-m="remove">Retirer de cette playlist</button>' : ''}
    <hr><div class="sub-label">Ajouter à la playlist</div>
    <button data-m="newpl">+ Nouvelle playlist</button>
    ${store.playlists.map(p => `<button data-m="add" data-pl="${p.id}">${esc(p.name)}</button>`).join('')}
    <hr><button data-m="deezer">Écouter en entier sur Deezer ↗</button>`;
  menu.hidden = false;
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  let x = Math.min(rect.right - mw, innerWidth - mw - 8); if (x < 8) x = Math.min(rect.left, innerWidth - mw - 8);
  let y = rect.bottom + 4; if (y + mh > innerHeight - 8) y = Math.max(8, innerHeight - mh - 8);
  menu.style.left = x + 'px'; menu.style.top = y + 'px';
  menu.onclick = e => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    const m = b.dataset.m;
    if (m === 'queue') addToQueue(track);
    if (m === 'like') toggleLike(track);
    if (m === 'remove') { const pl = playlistById(plId); pl.tracks = pl.tracks.filter(t => t.id !== track.id); persist(); render(); toast('Retiré de la playlist'); }
    if (m === 'newpl') { const pl = createPlaylist(); addToPlaylist(pl, track); }
    if (m === 'add') addToPlaylist(playlistById(b.dataset.pl), track);
    if (m === 'deezer') window.open(`https://www.deezer.com/track/${track.id}`, '_blank', 'noopener');
    closeMenu();
  };
}
function closeMenu() { menu.hidden = true; }
document.addEventListener('click', e => { if (!menu.contains(e.target)) closeMenu(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu();
  const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
  if (typing) return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.key === 'ArrowRight' && e.shiftKey) next(false);
  if (e.key === 'ArrowLeft' && e.shiftKey) prev();
});
main.addEventListener('scroll', closeMenu);

/* ================= Réglages (clé YouTube) ================= */
const settings = $('#settings'), keyInput = $('#ytKeyInput'), ytStatus = $('#ytStatus');
function setStatus(msg, cls = '') { ytStatus.textContent = msg; ytStatus.className = 'status ' + cls; }
function openSettings() {
  keyInput.value = LS.get('ytKey', '');
  const fromFile = !LS.get('ytKey', '') && CFG.youtubeApiKey;
  setStatus(ytKey() ? (fromFile ? 'Versions complètes activées (clé du fichier config.js).' : 'Versions complètes activées.') : 'Aucune clé : extraits de 30 s.', ytKey() ? 'ok' : '');
  settings.hidden = false; setTimeout(() => keyInput.focus(), 50);
}
function closeSettings() { settings.hidden = true; }
$('#settingsBtn').onclick = openSettings;
$('#settingsClose').onclick = closeSettings;
settings.addEventListener('click', e => { if (e.target === settings) closeSettings(); });
$('#ytKeySave').onclick = async () => {
  const k = keyInput.value.trim();
  if (!k) return setStatus('Colle d\'abord ta clé.', 'bad');
  setStatus('Vérification de la clé…');
  try {
    const r = await (await fetch('https://www.googleapis.com/youtube/v3/videos?part=id&id=kJQP7kiw5Fk&key=' + encodeURIComponent(k))).json(); // 1 unité de quota
    if (r.error) { const er = new Error(r.error.message); er.reason = r.error.errors?.[0]?.reason || 'invalid'; throw er; }
    LS.set('ytKey', k); ytQuotaHit = false;
    setStatus('Clé valide : les titres seront joués en entier.', 'ok');
    syncBadge(); if (route.name === 'home') render();
    setTimeout(closeSettings, 900); toast('Versions complètes activées');
  } catch (e) {
    if (/quota|rateLimit/i.test(e.reason || '')) { LS.set('ytKey', k); setStatus('Clé enregistrée, mais le quota du jour est épuisé : retour demain.', 'bad'); }
    else if (!e.reason) setStatus('Impossible de joindre Google : vérifie ta connexion.', 'bad');
    else setStatus('Clé refusée par Google : ' + (e.message || 'erreur inconnue'), 'bad');
  }
};
$('#ytKeyClear').onclick = () => { LS.set('ytKey', ''); keyInput.value = ''; setStatus('Clé retirée : extraits de 30 s.'); syncBadge(); if (route.name === 'home') render(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !settings.hidden) closeSettings(); });

/* ================= Démarrage ================= */
syncModes(); syncVol(); syncPlayState(); syncBadge();
route = parseHash();
render();
