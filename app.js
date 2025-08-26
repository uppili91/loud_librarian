import { initFirebase, db, meRef, roomRef, onSnapshot, doc, setDoc, updateDoc, getDoc, arrayUnion, serverTimestamp } from './firebase.js';
import { categories } from './categories.js';
import { registerPWA } from './pwa.js';

registerPWA();
await initFirebase();

// DOM helpers
const $ = (id)=>document.getElementById(id);
const viewLobby = $('view-lobby');
const viewGame = $('view-game');

// State
let roomId = null;
let isHost = false;
let unsubRoom = null;
let timer = null;

// UI elements
const playerName = $('playerName');
const createRoomBtn = $('createRoom');
const joinRoomBtn = $('joinRoom');
const roomCodeInput = $('roomCode');
const lobbyDiv = $('lobby');
const playersList = $('players');
const teamsDiv = $('teams');
const roomLabel = $('roomLabel');
const startGameBtn = $('startGame');
const shuffleTeamsBtn = $('shuffleTeams');
const leaveRoomBtn = $('leaveRoom');

const roundSecondsSel = $('roundSeconds');
const letterModeSel = $('letterMode');
const langSelect = $('langSelect');

const backToLobbyBtn = $('backToLobby');
const nextRoundBtn = $('nextRound');
const pauseTimerBtn = $('pauseTimer');
const roundNum = $('roundNum');
const timeLeft = $('timeLeft');
const letterEl = $('letter');
const categoryEl = $('category');
const scoreBtns = Array.from(document.querySelectorAll('.scoreBtn'));
const scoreA = $('scoreA');
const scoreB = $('scoreB');
const penaltyA = $('penaltyA');
const penaltyB = $('penaltyB');
const logEl = $('log');
const shareLink = $('shareLink');
const copyLink = $('copyLink');

// Install button
const installBtn = $('btn-install');
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; installBtn.disabled=false;});
installBtn.addEventListener('click', async ()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); deferredPrompt=null; installBtn.disabled=true; });

function letterPool(mode){
  const all = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  if(mode==='NoQXZ') return all.filter(c=>!['Q','X','Z'].includes(c));
  return all;
}
function pickLetter(mode){ const p = letterPool(mode); return p[(Math.random()*p.length)|0]; }
function pickCategory(lang='en'){ const list = categories[lang] || categories['en']; return list[(Math.random()*list.length)|0]; }

function randomId(n=6){ const s='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({length:n},()=>s[(Math.random()*s.length)|0]).join(''); }

function renderPlayers(players){
  playersList.innerHTML='';
  players.forEach(p=>{
    const li = document.createElement('li');
    li.textContent = p.name + (p.isHost?' (Host)':'');
    playersList.appendChild(li);
  });
}

function renderTeams(state){
  teamsDiv.innerHTML = '';
  ['A','B'].forEach(t=>{
    const div = document.createElement('div');
    const members = (state.players||[]).filter(p=>p.team===t).map(p=>p.name).join(', ') || '—';
    div.innerHTML = `<div class="team"><span class="pill">Team ${t}</span> <span>${members}</span></div>`;
    teamsDiv.appendChild(div);
  });
}

function updateShare(){
  if(!roomId) return;
  const url = `${location.origin}${location.pathname}?room=${roomId}`;
  shareLink.value = url;
}

copyLink.addEventListener('click', async ()=>{
  try{ await navigator.clipboard.writeText(shareLink.value); copyLink.textContent='Copied!'; setTimeout(()=>copyLink.textContent='Copy',1200); }catch(e){}
});

async function createRoom(){
  roomId = randomId();
  isHost = true;
  const r = roomRef(roomId);
  const player = { id: meRef().id, name: (playerName.value||'Player'), team:'A', isHost:true, joinedAt: serverTimestamp() };
  await setDoc(r, {
    createdAt: serverTimestamp(),
    players: [player],
    settings: { secs: Number(roundSecondsSel.value), letterMode: letterModeSel.value, lang: langSelect.value },
    state: { phase:'lobby', round: 0, letter: '', category:'', scoreA:0, scoreB:0, timeLeft: Number(roundSecondsSel.value), paused:false, log:[] }
  });
  subscribe();
  lobbyDiv.classList.remove('hidden');
  roomLabel.textContent = roomId;
  updateShare();
}

async function joinRoom(id){
  roomId = id.toUpperCase();
  const r = roomRef(roomId);
  const snap = await getDoc(r);
  if(!snap.exists()){ alert('Room not found'); return; }
  isHost = false;
  const player = { id: meRef().id, name: (playerName.value||'Player'), team:'B', isHost:false, joinedAt: serverTimestamp() };
  await updateDoc(r, { players: arrayUnion(player) });
  subscribe();
  lobbyDiv.classList.remove('hidden');
  roomLabel.textContent = roomId;
  updateShare();
}

function subscribe(){
  if(unsubRoom) unsubRoom();
  unsubRoom = onSnapshot(roomRef(roomId), (docSnap)=>{
    if(!docSnap.exists()) return;
    const data = docSnap.data();
    const { players, settings, state } = data;
    renderPlayers(players||[]);
    renderTeams(data);
    roundSecondsSel.value = String(settings?.secs||60);
    letterModeSel.value = settings?.letterMode || 'A-Z';
    langSelect.value = settings?.lang || 'en';
    scoreA.textContent = state?.scoreA ?? 0;
    scoreB.textContent = state?.scoreB ?? 0;
    timeLeft.textContent = state?.timeLeft ?? settings?.secs ?? 60;
    roundNum.textContent = state?.round ?? 0;
    letterEl.textContent = state?.letter || '—';
    categoryEl.textContent = state?.category || '—';
    logEl.innerHTML = (state?.log||[]).map(x=>`<div>• ${x}</div>`).join('');
    if(state?.phase === 'game'){
      viewLobby.classList.add('hidden');
      viewGame.classList.remove('hidden');
      startTimerIfHost(state);
    } else {
      viewGame.classList.add('hidden');
      viewLobby.classList.remove('hidden');
    }
  });
}

async function startRound(){
  const r = roomRef(roomId);
  const settings = { secs: Number(roundSecondsSel.value), letterMode: letterModeSel.value, lang: langSelect.value };
  const newState = {
    phase:'game',
    round: (Number(($('roundNum').textContent)||0) + 1),
    letter: pickLetter(settings.letterMode),
    category: pickCategory(settings.lang),
    scoreA: Number(scoreA.textContent)||0,
    scoreB: Number(scoreB.textContent)||0,
    timeLeft: settings.secs,
    paused:false,
    log: []
  };
  await updateDoc(r, { settings, state:newState });
}

function startTimerIfHost(state){
  if(!isHost) return;
  if(timer) clearInterval(timer);
  timer = setInterval(async ()=>{
    const snap = await getDoc(roomRef(roomId)); if(!snap.exists()) return;
    const cur = snap.data().state;
    if(cur.phase!=='game' || cur.paused) return;
    const t = Math.max(0, (cur.timeLeft??60) - 1);
    let updates = { 'state.timeLeft': t };
    if(t===0){ updates['state.phase'] = 'lobby'; }
    await updateDoc(roomRef(roomId), updates);
  }, 1000);
}

async function adjustScore(team, delta){
  const key = team==='A' ? 'state.scoreA' : 'state.scoreB';
  const logMsg = (delta>0?`Team ${team} +1`:`Penalty Team ${team}`);
  await updateDoc(roomRef(roomId), { [key]: (team==='A'? Number(scoreA.textContent): Number(scoreB.textContent)) + delta, 'state.log': arrayUnion(logMsg) });
}

createRoomBtn.addEventListener('click', createRoom);
joinRoomBtn.addEventListener('click', ()=> joinRoom(roomCodeInput.value.trim()));
startGameBtn.addEventListener('click', startRound);
shuffleTeamsBtn.addEventListener('click', async ()=>{
  const snap = await getDoc(roomRef(roomId)); if(!snap.exists()) return;
  const players = snap.data().players || [];
  const shuffled = players.map((p,i)=> ({...p, team: (i%2===0)?'A':'B'}));
  await updateDoc(roomRef(roomId), { players: shuffled });
});
leaveRoomBtn.addEventListener('click', ()=> location.href = location.pathname);

backToLobbyBtn.addEventListener('click', async ()=>{
  await updateDoc(roomRef(roomId), { 'state.phase':'lobby' });
});
nextRoundBtn.addEventListener('click', startRound);
pauseTimerBtn.addEventListener('click', async ()=>{
  const snap = await getDoc(roomRef(roomId)); if(!snap.exists()) return;
  const paused = !snap.data().state.paused;
  await updateDoc(roomRef(roomId), { 'state.paused': paused });
  pauseTimerBtn.textContent = paused? 'Resume':'Pause';
});
scoreBtns.forEach(btn=> btn.addEventListener('click', ()=> adjustScore(btn.dataset.team, +1)));
penaltyA.addEventListener('click', ()=> adjustScore('A', -1));
penaltyB.addEventListener('click', ()=> adjustScore('B', -1));

// Auto-join via ?room= param
const urlRoom = new URL(location.href).searchParams.get('room');
if(urlRoom){ roomCodeInput.value = urlRoom; joinRoomBtn.click(); }
