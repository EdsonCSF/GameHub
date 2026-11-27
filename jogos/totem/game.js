// Totem Ascension v10.3.12 — ataques visíveis e recompensas Perfect.

'use strict';

/* ════════════════════════════════════════
   SISTEMA DE SONS RICO — WebAudio API sintetizada
   Música ambiente + SFX elaborados
════════════════════════════════════════ */
let audioCtx=null;
let soundEnabled=true;
let musicEnabled=true;
let musicGain=null;
let sfxGain=null;
let currentMusic=null;
let currentMusicName=null;

function initAudioBase1(){
  if(!audioCtx){
    try{
      audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      // Master gains - aumentados para menu e jogo mais presentes
      musicGain=audioCtx.createGain();
      musicGain.gain.value=0.58; /* MÚSICA ALTA: menu/jogo/boss */
      musicGain.connect(audioCtx.destination);
      sfxGain=audioCtx.createGain();
      sfxGain.gain.value=0.72; /* SFX ALTO: instabilidade e boss */
      sfxGain.connect(audioCtx.destination);
    }catch(e){audioCtx=null;}
  }
  if(audioCtx && audioCtx.state==='suspended'){
    audioCtx.resume();
  }
}

/* Tom com envelope ADSR simplificado */
function playTone(freq, duration, type='sine', volume=0.15, when=0){
  if(!soundEnabled) return;
  initAudio();
  if(!audioCtx) return;
  const t=audioCtx.currentTime + when;
  const osc=audioCtx.createOscillator();
  const gain=audioCtx.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t+0.008);
  gain.gain.exponentialRampToValueAtTime(volume*0.4, t+duration*0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, t+duration);
  osc.connect(gain);
  gain.connect(sfxGain||audioCtx.destination);
  osc.start(t);
  osc.stop(t+duration+0.05);
}

/* Slide de frequência */
function playSlide(f1, f2, duration, type='sine', volume=0.15){
  if(!soundEnabled) return;
  initAudio();
  if(!audioCtx) return;
  const t=audioCtx.currentTime;
  const osc=audioCtx.createOscillator();
  const gain=audioCtx.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(f1, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20,f2), t+duration);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t+0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t+duration);
  osc.connect(gain);
  gain.connect(sfxGain||audioCtx.destination);
  osc.start(t);
  osc.stop(t+duration+0.05);
}

/* Acorde (3+ notas simultâneas) */
function playChord(freqs, duration, type='sine', volume=0.1){
  if(!soundEnabled) return;
  initAudio();
  if(!audioCtx) return;
  freqs.forEach((f,i)=>playTone(f, duration, type, volume, i*0.02));
}

/* Som percussivo (ruído filtrado) */
function playNoise(duration, volume=0.1, filterFreq=1000, type='lowpass'){
  if(!soundEnabled) return;
  initAudio();
  if(!audioCtx) return;
  const t=audioCtx.currentTime;
  const bufferSize=Math.floor(audioCtx.sampleRate * duration);
  const buffer=audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++){
    data[i]=(Math.random()*2-1)*(1-i/bufferSize);
  }
  const noise=audioCtx.createBufferSource();
  noise.buffer=buffer;
  const filter=audioCtx.createBiquadFilter();
  filter.type=type;
  filter.frequency.value=filterFreq;
  const gain=audioCtx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t+duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain||audioCtx.destination);
  noise.start(t);
  noise.stop(t+duration);
}

/* ══ MÚSICA AMBIENTE — loops contínuos ══ */
function stopMusicBase1(){
  if(currentMusic){
    try{
      clearInterval(currentMusic);
      currentMusic=null;
      currentMusicName=null;
    }catch(e){}
  }
}

/* Música do menu — mistica, lenta, com arpejos */

/* Música de gameplay — mais ritmada */

/* ══ EFEITOS SONOROS ELABORADOS ══ */
const SFX={
  click:   ()=>{
    playTone(660,0.06,'sine',0.12);
    playTone(880,0.05,'sine',0.08,0.02);
  },
  dice:    ()=>{
    // Rolagem de dado com múltiplos cliques
    for(let i=0;i<5;i++){
      setTimeout(()=>{
        playTone(180+Math.random()*120,0.04,'square',0.06);
      }, i*60);
    }
    playNoise(0.18,0.06,1200,'bandpass');
  },
  success: ()=>{
    // Arpejo ascendente maior
    [523,659,784,1046].forEach((f,i)=>playTone(f,0.18,'triangle',0.10,i*0.05));
  },
  perfect: ()=>{
    // Fanfarra dourada
    [523,659,784,1046,1318].forEach((f,i)=>playTone(f,0.22,'sine',0.12,i*0.06));
    playTone(2093,0.4,'sine',0.08,0.3);
  },
  crit:    ()=>{
    // Explosão critica
    playSlide(110,880,0.35,'sawtooth',0.15);
    playNoise(0.25,0.12,2000,'highpass');
    [784,988,1318].forEach((f,i)=>playTone(f,0.2,'triangle',0.10,i*0.04));
  },
  fail:    ()=>{
    // Descida triste
    playSlide(440,110,0.4,'sawtooth',0.16);
    playNoise(0.2,0.08,300,'lowpass');
    playTone(220,0.3,'square',0.08,0.1);
  },
  piece:   ()=>{
    // Drop de peça com peso
    playTone(330,0.08,'triangle',0.10);
    playTone(220,0.15,'sine',0.12,0.03);
    playNoise(0.05,0.04,500);
  },
  coin:    ()=>{
    // Moeda tilintante
    playTone(988,0.05,'sine',0.10);
    playTone(1318,0.05,'sine',0.10,0.04);
    playTone(1760,0.12,'sine',0.08,0.08);
  },
  boss:    ()=>{
    // Rugido de boss
    playSlide(110,55,0.6,'sawtooth',0.18);
    playNoise(0.4,0.12,250,'lowpass');
    playTone(82,0.5,'square',0.12);
  },
  bossHit: ()=>{
    // Impacto
    playTone(150,0.08,'sawtooth',0.12);
    playNoise(0.1,0.1,800,'bandpass');
    playTone(100,0.12,'square',0.08,0.02);
  },
  bossDefeat: ()=>{
    // Vitória épica
    [261,329,392,523,659,784,1046].forEach((f,i)=>{
      playTone(f,0.3,'triangle',0.13,i*0.08);
    });
    playNoise(0.5,0.10,3000,'highpass');
    playTone(1568,0.6,'sine',0.10,0.5);
  },
  power:   ()=>{
    // Carga mística
    playSlide(220,880,0.3,'sine',0.14);
    playTone(440,0.2,'triangle',0.10,0.1);
    playTone(880,0.25,'sine',0.08,0.2);
  },
  milestone: ()=>{
    // Sequência vitoriosa
    [523,659,784,1046,1318,1568].forEach((f,i)=>{
      playTone(f,0.2,'triangle',0.13,i*0.08);
    });
    playTone(2093,0.5,'sine',0.10,0.5);
  },
  achievement: ()=>{
    [659,784,988,1318].forEach((f,i)=>playTone(f,0.18,'triangle',0.13,i*0.07));
    playTone(1568,0.3,'sine',0.10,0.28);
  },
  prestige: ()=>{
    // Ascensão celestial
    [220,330,440,550,660,880,1100,1760].forEach((f,i)=>{
      playTone(f,0.4,'sine',0.12,i*0.08);
    });
    playTone(2093,0.8,'sine',0.10,0.6);
  },
  buy:     ()=>{
    playTone(523,0.06,'triangle',0.10);
    playTone(659,0.06,'triangle',0.10,0.04);
    playTone(784,0.14,'sine',0.10,0.08);
  },
  event:   ()=>{
    // Aviso místico
    playSlide(440,660,0.2,'sine',0.12);
    playTone(550,0.18,'triangle',0.10,0.1);
    playTone(740,0.25,'sine',0.08,0.18);
  },
  combo:   ()=>{
    // Escalada de combo
    const base=440+G.combo*30;
    playTone(base,0.06,'triangle',0.10);
    playTone(base*1.25,0.06,'triangle',0.10,0.04);
    playTone(base*1.5,0.10,'triangle',0.10,0.08);
  },
  critical: ()=>{
    // Sirene de estado crítico
    playSlide(880,440,0.2,'sawtooth',0.18);
    setTimeout(()=>{ if(soundEnabled) playSlide(440,880,0.2,'sawtooth',0.18); }, 220);
  },
  recover: ()=>{
    // Recuperação bem-sucedida
    [392,523,659,784].forEach((f,i)=>playTone(f,0.18,'triangle',0.14,i*0.06));
    playTone(1046,0.3,'sine',0.10,0.25);
  },
  revive: ()=>{
    // Renascimento
    [220,330,440,550,660,880,1046,1318].forEach((f,i)=>{
      playTone(f,0.3,'sine',0.14,i*0.07);
    });
  },
  death: ()=>{
    // Morte lenta
    playSlide(440,55,1.2,'sawtooth',0.18);
    playNoise(0.6,0.10,200,'lowpass');
    playTone(82,1.0,'square',0.12,0.2);
  },
  toggleSound: ()=>{
    if(soundEnabled){
      playTone(523,0.08,'triangle',0.10);
      playTone(784,0.12,'sine',0.10,0.05);
    }
  }
};

function updateAudioButtons(){
 document.querySelectorAll('[data-audio-toggle]').forEach(b=>{const music=b.dataset.audioToggle==='music',on=music?musicEnabled:soundEnabled;b.textContent=(music?'♫ Música: ':'🔊 Efeitos: ')+(on?'ligados':'desligados');b.setAttribute('aria-pressed',String(on));});
}
function toggleSound(){
 soundEnabled=!soundEnabled;
 if(sfxGain)sfxGain.gain.value=soundEnabled?audioPrefs.effects:0;
 try{localStorage.setItem('totemSound',soundEnabled?'1':'0');}catch(e){}
 updateAudioButtons();if(soundEnabled)SFX.toggleSound();return soundEnabled;
}
function toggleMusic(){
 musicEnabled=!musicEnabled;
 try{localStorage.setItem('totemMusic',musicEnabled?'1':'0');}catch(e){}
 if(musicEnabled)resumeSceneMusic();else stopMusic();updateAudioButtons();
}
function loadSoundPref(){
 try{const p=localStorage.getItem('totemSound');soundEnabled=p!=='0';const m=localStorage.getItem('totemMusic');musicEnabled=m===null?soundEnabled:m!=='0';}catch(e){}
 updateAudioButtons();
}
function openAudioSettings(){
 openModal('<h2>Áudio</h2><button class="modal-action" data-audio-toggle="music" onclick="toggleMusic()"></button><label class="form-field">Volume da música<input aria-label="Volume da música" type="range" min="0" max="1" step=".05" value="'+audioPrefs.music+'" oninput="setMix(\'music\',this.value)"></label><button class="modal-action" data-audio-toggle="effects" onclick="toggleSound()"></button><label class="form-field">Volume dos efeitos<input aria-label="Volume dos efeitos" type="range" min="0" max="1" step=".05" value="'+audioPrefs.effects+'" oninput="setMix(\'effects\',this.value)"></label><button class="modal-close" onclick="closeModal()">Fechar</button>');updateAudioButtons();
}

/* ════════════════════════════════════════
   RUNE SYMBOLS
════════════════════════════════════════ */
const RUNES = [
  { glyph:'ᚠ', name:'Fehu'   },
  { glyph:'ᚢ', name:'Uruz'   },
  { glyph:'ᚦ', name:'Thuris' },
  { glyph:'ᚨ', name:'Ansuz'  },
  { glyph:'ᚱ', name:'Raido'  },
  { glyph:'ᚲ', name:'Kaunan' },
  { glyph:'ᚷ', name:'Gebo'   },
  { glyph:'ᚹ', name:'Wunjo'  },
];

/* ════════════════════════════════════════
   PIECE TYPES
════════════════════════════════════════ */
const PIECES = [
  { id:'ember',   rune:'ᚠ', name:'Fogo',   cls:'tp-ember',   hv:1,  cv:2,  minH:0,   sRec:1, rarity:'common',   effectDesc:'+1 altura base'           },
  { id:'stone',   rune:'ᚢ', name:'Terra',   cls:'tp-stone',   hv:2,  cv:3,  minH:8,   sRec:1, rarity:'common',   effectDesc:'+1 altura base'           },
  { id:'forest',  rune:'ᚦ', name:'Natureza',  cls:'tp-forest',  hv:2,  cv:4,  minH:16,  sRec:2, rarity:'common',   effectDesc:'+1 estab. por acerto'    },
  { id:'water',   rune:'ᚨ', name:'Água',   cls:'tp-water',   hv:3,  cv:5,  minH:28,  sRec:2, rarity:'uncommon', effectDesc:'+5% moedas'              },
  { id:'wind',    rune:'ᚱ', name:'Vento',    cls:'tp-wind',    hv:3,  cv:6,  minH:42,  sRec:1, rarity:'uncommon', effectDesc:'+5% velocidade de carga' },
  { id:'gold',    rune:'ᚲ', name:'Metal',    cls:'tp-gold',    hv:5,  cv:9,  minH:60,  sRec:2, rarity:'uncommon', effectDesc:'+8% moedas'              },
  { id:'crystal', rune:'ᚷ', name:'Cristal', cls:'tp-crystal', hv:6,  cv:13, minH:85,  sRec:3, rarity:'rare',     effectDesc:'+10% moedas'             },
  { id:'shadow',  rune:'ᚹ', name:'Sombra',  cls:'tp-shadow',  hv:7,  cv:15, minH:115, sRec:1, rarity:'rare',     effectDesc:'+10% moedas'             },
  { id:'light',   rune:'ᛊ', name:'Luz',   cls:'tp-light',   hv:8,  cv:18, minH:155, sRec:3, rarity:'rare',     effectDesc:'+15% moedas'             },
  { id:'chaos',   rune:'ᛏ', name:'Arcano',   cls:'tp-chaos',   hv:10, cv:22, minH:210, sRec:0, rarity:'epic',     effectDesc:'Efeito aleatório a cada peça' },
  { id:'ancient', rune:'ᛚ', name:'Tempo', cls:'tp-ancient', hv:13, cv:28, minH:280, sRec:4, rarity:'legendary', effectDesc:'+2 estabilidade por acerto' },
  { id:'divine',  rune:'ᛟ', name:'Celestial',  cls:'tp-divine',  hv:18, cv:38, minH:380, sRec:5, rarity:'mythic',   effectDesc:'Bônus duplo em tudo'      },
];

const RARITY_INFO = {
  common:    {label:'Comum',     color:'#9aa0b0', stars:0, glyph:''},
  uncommon:  {label:'Incomum',   color:'#3de87a', stars:1, glyph:'★'},
  rare:      {label:'Rara',      color:'#4488ff', stars:2, glyph:'★★'},
  epic:      {label:'Épica',     color:'#aa44ff', stars:3, glyph:'★★★'},
  legendary: {label:'Lendária',  color:'#f0c040', stars:4, glyph:'★★★★'},
  mythic:    {label:'Mística',   color:'#ff44ff', stars:5, glyph:'★★★★★'},
};

/* Progressão com trade-offs (5 níveis, cada um com benefício E desvantagem) */
const PROGRESSIONS=[
  {
    id:1, name:'Era do Ouro', icon:'💰',
    benefit:'+50% moedas', drawback:'Dados mais rápidos (+15%)',
    minH:50,
    apply:()=>{
      G._progCoinMult=1.5;
      G.timingSpd=0.85;
    }
  },
  {
    id:2, name:'Era das Sombras', icon:'🌑',
    benefit:'+30% peças raras', drawback:'Vento mais frequente (+10%)',
    minH:312,
    apply:()=>{
      G._progRareBoost=0.30;
      G._progWindChance=0.10;
    }
  },
  {
    id:3, name:'Era dos Cristais', icon:'💎',
    benefit:'+50% cristais', drawback:'Sequências aparecem por menos tempo',
    minH:1953,
    apply:()=>{
      G._progCrystalMult=1.5;
      G._progSeqTimeMult=0.75; /* menos tempo para memorizar */
    }
  },
  {
    id:4, name:'Era Ancestral', icon:'🏺',
    benefit:'+25% chance Ancient', drawback:'Área verde -25%',
    minH:12207,
    apply:()=>{
      G._progAncientBoost=0.25;
      G.tGreenW=Math.max(4, G.tGreenW*0.75);
    }
  },
  {
    id:5, name:'Era Divina', icon:'✨',
    benefit:'+100% Essência no prestígio', drawback:'Bosses +50% HP',
    minH:30517,
    apply:()=>{
      G._progEssenceMult=2.0;
      G._progBossHpMult=1.5;
    }
  }
];

/* Aplica progressões com base na altura */

/* Peso por raridade (afeta inclinação da torre) */
const RARITY_WEIGHT={
  ember:1, stone:1, forest:1, water:1, wind:2,
  gold:2, crystal:2, shadow:2, light:3,
  chaos:3, ancient:4, divine:5,
  rainbow:3, 'boss-':0
};

/* Curva de dificuldade suave:
   - 0 a 300: fácil (sem penalidade, recupera bem)
   - Após 300: ×1.8 escalonado (300→540→972→1750→3150→...)
   Cada nível adiciona +8% de penalidade */
const DIFFICULTY_THRESHOLDS=[300, 540, 972, 1750, 3150, 5670, 10206, 18371, 33068, 59452];
function getDifficultyLevel(h){
  let lvl=0;
  for(const t of DIFFICULTY_THRESHOLDS){
    if(h>=t) lvl++;
    else break;
  }
  return lvl;
}

/* Multiplicador de dificuldade geral (afeta dano, sorte, etc) */

/* Sorte (luck) ajustada pela dificuldade — fica mais difícil em níveis altos */
function getLuckChance(h){
  const base=Math.min(0.35, upLv('luck')*0.04);
  return base / getDifficultyMult(h);
}

/* Aplica o efeito da raridade da peça ao sucesso (chamado em onSuccess) */

/* Tier base — alturas escaladas ×2.5 a partir de 50 */
const TIERS_BASE = [
  {h:0,    label:'🌲 Floresta',   bg:'#071a07', accent:'#3de87a' },
  {h:50,   label:'🌋 Terra',      bg:'#1a0f05', accent:'#c06820' },
  {h:125,  label:'🪨 Pedra',      bg:'#0d0d11', accent:'#8090a0' },
  {h:312,  label:'🌊 Oceano',     bg:'#030b14', accent:'#4488ff' },
  {h:781,  label:'⚡ Tempestade', bg:'#05050f', accent:'#aa44ff' },
  {h:1953, label:'💎 Cristal',    bg:'#05030f', accent:'#88aaff' },
  {h:4882, label:'🌑 Sombria',    bg:'#050005', accent:'#9930cc' },
  {h:12207,label:'☀️ Dourada',    bg:'#0f0b00', accent:'#f0c040' },
  {h:30517,label:'🌌 Cósmica',    bg:'#020208', accent:'#6688ff' },
  {h:76293,label:'☄️ Cometa',     bg:'#080018', accent:'#88ccff' },
];

/* Quantidade de altura total de um ciclo completo (último tier + 1) */
const TIER_CYCLE = 76293;

/* Gera o TIERS dinâmico para o ciclo atual do jogador (1.0, 2.0, 3.0...) */
function buildTiersForCycle(cycle){
  const suffix = cycle>0 ? ' '+cycle+'.0' : '';
  return TIERS_BASE.map(t=>({
    h: t.h + cycle*TIER_CYCLE,
    label: t.label + suffix,
    bg: t.bg,
    accent: t.accent
  }));
}

/* TIERS visível para a sessão atual (compatível com código antigo) */
let TIERS = buildTiersForCycle(0);

/* Recalcula TIERS quando muda de ciclo */

const MILESTONES = [
  {h:50,    t:'🌋 Terra!',      s:'A floresta cedeu lugar à terra bruta.'},
  {h:125,   t:'🪨 Pedra!',      s:'O totem endurece. As rochas falam.'},
  {h:312,   t:'🌊 Oceano!',     s:'Forças aquáticas fluem pelo totem!'},
  {h:781,   t:'⚡ Tempestade!', s:'O vento e o trovão sopram alto!'},
  {h:1953,  t:'💎 Cristal!',    s:'Energia mágica se manifesta!'},
  {h:4882,  t:'🌑 Sombria!',    s:'O poder das trevas desperta!'},
  {h:12207, t:'☀️ Dourada!',    s:'A lenda dourada se revela!'},
  {h:30517, t:'🌌 Cósmica!',    s:'Além dos limites mortais!'},
  {h:76293, t:'☄️ Cometa!',     s:'Você cruzou o véu estelar!'},
];

/* ════════════════════════════════════════
   LOJA — 3 CATEGORIAS COM CUSTOS MÚLTIPLOS
═══════════════════════════════════════ */
/* Recursos: wood=Madeira, stone=Pedra, goldR=Ouro, crystal=Cristal */

const UPGRADES = [];

/* ── Construção (custa recursos) ── */
const BUILDINGS = [];

/* ── Relíquias (custam cristal) ── */
/* Relíquias: req.height 115 inicial, multiplicador ×1.8 progressivo
   115 → 207 → 372 → 670 → 1206 → 2171 → ... */
function getRelicUnlockHeight(idx){return 99999;}

const RELICS = [];

/* ── Codex / Enciclopédia completa ── */
const CODEX = [
  // ── PEÇAS (Raridades) ──
  {id:'ember',   icon:'🔥',rarity:'Comum',     unlockH:0,   effect:'+1 altura base',                   desc:'A primeira peça. Simples, mas essencial para começar sua jornada.'},
  {id:'stone',   icon:'🪨',rarity:'Comum',     unlockH:8,   effect:'+1 altura base',                   desc:'A resistência da pedra dá solidez ao totem em construções iniciais.'},
  {id:'forest',  icon:'🌲',rarity:'Comum',     unlockH:16,  effect:'+1 estab. por acerto',             desc:'A energia vital da floresta regenera a estabilidade a cada vitória.'},
  {id:'water',   icon:'💧',rarity:'Incomum',   unlockH:28,  effect:'+5% moedas',                       desc:'O fluxo constante da água atrai pequenas fortunas para o totem.'},
  {id:'wind',    icon:'💨',rarity:'Incomum',   unlockH:42,  effect:'+5% velocidade de carga',          desc:'O vento acelera o Power Meter, permitindo liberar bônus mais rápido.'},
  {id:'gold',    icon:'🪙',rarity:'Incomum',   unlockH:60,  effect:'+8% moedas',                       desc:'Peças douradas amplificam os ganhos monetários de forma consistente.'},
  {id:'crystal', icon:'💎',rarity:'Rara',      unlockH:85,  effect:'+10% moedas',                      desc:'Cristais místicos intensificam as recompensas com sua energia.'},
  {id:'shadow',  icon:'🌑',rarity:'Rara',      unlockH:115, effect:'+10% moedas + protege combo',     desc:'O poder das sombras multiplica discretamente suas moedas. 50% chance de manter combo ao errar.'},
  {id:'light',   icon:'☀️',rarity:'Rara',      unlockH:155, effect:'+15% moedas',                      desc:'A luz divina amplifica tudo o que toca com brilho dourado.'},
  {id:'chaos',   icon:'🌀',rarity:'Épica',     unlockH:210, effect:'Efeito aleatório a cada peça',     desc:'O caos é imprevisível: pode dar moedas, estabilidade, altura, power ou sorte.'},
  {id:'ancient', icon:'🏺',rarity:'Lendária',  unlockH:280, effect:'+2 estabilidade por acerto',      desc:'A sabedoria ancestral fortalece cada acerto de forma permanente.'},
  {id:'divine',  icon:'✨',rarity:'Mística',   unlockH:380, effect:'Bônus duplo + 30% chance sobreviver queda', desc:'A peça suprema: dobra moedas E altura. 30% de chance de salvar o totem da queda.'},
  {id:'rainbow', icon:'🌈',rarity:'Mítica',    unlockH:0,   effect:'Todos os recursos + cor especial', desc:'Peça especial que aparece durante eventos Arco-Íris. Dá todos os recursos de uma vez.'},
];

const ACHIEVEMENTS = [
  // ── Iniciais ──
  {id:'first',     icon:'🎯',name:'Primeiros Passos',   desc:'Construa sua primeira peça',           check:()=>G.hits>=1},
  {id:'hits50',    icon:'🔨',name:'Trabalhador',        desc:'Acerte 50 vezes no total',              check:()=>G.hits>=50},
  {id:'hits200',   icon:'🏗️',name:'Pedreiro',           desc:'Acerte 200 vezes no total',             check:()=>G.hits>=200},
  // ── Sequências ──
  {id:'streak5',   icon:'🔥',name:'Em Chamas',          desc:'Sequência de 5 acertos',               check:()=>G.bestStreak>=5},
  {id:'streak10',  icon:'⚡',name:'Imparável',          desc:'Sequência de 10 acertos',              check:()=>G.bestStreak>=10},
  {id:'streak20',  icon:'🌟',name:'Lendário',           desc:'Sequência de 20 acertos',              check:()=>G.bestStreak>=20},
  {id:'streak30',  icon:'👑',name:'Imortal',            desc:'Sequência de 30 acertos',              check:()=>G.bestStreak>=30},
  // ── Altura (escala nova ×2.5) ──
  {id:'h50',       icon:'🌋',name:'Construtor',         desc:'Alcance 50 de altura (Terra)',          check:()=>G.bestHeight>=50},
  {id:'h125',      icon:'🪨',name:'Arquiteto',          desc:'Alcance 125 de altura (Pedra)',         check:()=>G.bestHeight>=125},
  {id:'h312',      icon:'🌊',name:'Engenheiro',         desc:'Alcance 312 de altura (Oceano)',        check:()=>G.bestHeight>=312},
  {id:'h781',      icon:'⚡',name:'Mestre',             desc:'Alcance 781 de altura (Tempestade)',    check:()=>G.bestHeight>=781},
  {id:'h1953',     icon:'💎',name:'Grão-Mestre',        desc:'Alcance 1953 de altura (Cristal)',      check:()=>G.bestHeight>=1953},
  {id:'h4882',     icon:'🌑',name:'Sombrio',            desc:'Alcance 4882 de altura (Sombria)',      check:()=>G.bestHeight>=4882},
  {id:'h12207',    icon:'☀️',name:'Dourado',            desc:'Alcance 12207 de altura (Dourada)',     check:()=>G.bestHeight>=12207},
  // ── Bosses ──
  {id:'boss1',     icon:'⚔️',name:'Caçador',            desc:'Derrote seu primeiro boss',            check:()=>G.bossDefeated.length>=1},
  {id:'boss5',     icon:'🏆',name:'Exterminador',       desc:'Derrote 5 bosses',                     check:()=>G.bossDefeated.length>=5},
  {id:'boss10',    icon:'👹',name:'Justiceiro',         desc:'Derrote 10 bosses',                    check:()=>G.bossDefeated.length>=10},
  {id:'boss20',    icon:'💀',name:'Lenda Sombria',      desc:'Derrote 20 bosses',                    check:()=>G.bossDefeated.length>=20},
  // ── Economia ──
  {id:'rich',      icon:'💰',name:'Rico',               desc:'Acumule 1000 moedas',                   check:()=>G.totalCoins>=1000},
  {id:'rich10k',   icon:'💎',name:'Magnata',            desc:'Acumule 10000 moedas',                  check:()=>G.totalCoins>=10000},
  // ── Especiais ──
  {id:'crit',      icon:'💥',name:'Crítico',            desc:'Consiga um acerto crítico',            check:()=>G.critHits>=1},
  {id:'crit10',    icon:'🌟',name:'Mestre Crítico',     desc:'Consiga 10 acertos críticos',           check:()=>G.critHits>=10},
  {id:'prestige',  icon:'⭐',name:'Renascer',           desc:'Faça seu primeiro prestígio',          check:()=>(G.prestige||0)>=1},
  {id:'prestige3', icon:'🌠',name:'Ciclo Eterno',       desc:'Faça 3 prestígios',                    check:()=>(G.prestige||0)>=3},
  {id:'perfect',   icon:'✨',name:'Perfeição',          desc:'Acerte a zona perfeita do timing',     check:()=>G.perfectHits>=1},
  {id:'perfect10', icon:'💫',name:'Mestre do Timing',   desc:'Acerte 10 vezes a zona perfeita',       check:()=>G.perfectHits>=10},
  {id:'combo3',    icon:'🎨',name:'Combo Mestre',       desc:'Alcance combo ×3',                      check:()=>G.bestCombo>=3},
  {id:'combo5',    icon:'🎭',name:'Virtuose',           desc:'Alcance combo ×5',                      check:()=>G.bestCombo>=5},
  {id:'dice20',    icon:'🎲',name:'Sortudo',            desc:'Tire o máximo num dado',                check:()=>G.luckyMax>=1},
  {id:'essence5',  icon:'✨',name:'Alquimista',         desc:'Acumule 5 de Essência Divina',          check:()=>(G.divineEssence||0)>=5},
];

const EVENTS = [
  {id:'rain',    name:'🌧️ Chuva',    desc:'Erros causam 2x dano à estabilidade',  dur:6, col:'#4080ff'},
  {id:'wind',    name:'💨 Vento',    desc:'Perde 2 estabilidade por turno',       dur:8, col:'#80c0ff'},
  {id:'blessing',name:'🌟 Bênção',   desc:'Próximas 5 peças garantidas + estab',  dur:5, col:'#c09000'},
  {id:'eclipse', name:'🌑 Eclipse',  desc:'Peças raras 3x mais frequentes',       dur:7, col:'#600090'},
  {id:'quake',   name:'🌋 Tremor',   desc:'Tremor súbito! -15 estabilidade (não fatal)',dur:1, col:'#804020'},
  {id:'festival',name:'🎉 Festival', desc:'Moedas dobradas por 8 turnos',         dur:8, col:'#006040'},
  {id:'spring',  name:'🌸 Primavera',desc:'+2 estabilidade por turno (cura)',     dur:6, col:'#a04060'},
  {id:'ancient', name:'🏺 Ancestral',desc:'Apenas peças Ancient por 5 turnos',    dur:5, col:'#806000'},
  {id:'rainbow', name:'🌈 Arco-Íris',desc:'Peças Rainbow especiais aparecem! (dão todos os recursos)', dur:6, col:'#ff8040'},
];

/* Bosses: 5 originais (símbolos corrigidos) + 6 novos = 11 total
   Habilidades especiais:
   - damageReduction: % de redução de dano por acerto (0-1)
   - failDamageMult: multiplicador de dano ao jogador quando erra (1 = padrão)
   - hpRegenOnHit: HP que o boss recupera quando jogador acerta
   - hpRegenOnFail: HP que o boss recupera quando jogador erra
*/
const BOSSES = [
  /* heightLoss: altura perdida ao errar durante boss fight
     (não tira mais estabilidade — só altura) */
  {id:'wind',    name:' Espírito do Vento',     hp:32,  stabReward:25,  coinReward:60,  emoji:'', damageReduction:0,    failDamageMult:1.0, hpRegenOnHit:0, hpRegenOnFail:1, heightLoss:5  },
  {id:'forest',  name:' Guardião da Floresta',  hp:36,  stabReward:30,  coinReward:90,  emoji:'', damageReduction:0.20, failDamageMult:1.0, hpRegenOnHit:0, hpRegenOnFail:1, heightLoss:5  },
  {id:'serpent', name:' Serpente Ancestral',    hp:40,  stabReward:35,  coinReward:130, emoji:'', damageReduction:0,    failDamageMult:1.0, hpRegenOnHit:0, hpRegenOnFail:2, heightLoss:10 },
  {id:'storm',   name:' Espírito da Tempestade',hp:44,  stabReward:40,  coinReward:180, emoji:'', damageReduction:0.10, failDamageMult:1.0, hpRegenOnHit:1, hpRegenOnFail:2, heightLoss:10 },
  {id:'titan',   name:' Titã do Caos',          hp:48,  stabReward:50,  coinReward:250, emoji:'', damageReduction:0.25, failDamageMult:1.0, hpRegenOnHit:2, hpRegenOnFail:1, heightLoss:15 },
  {id:'alien',   name:' Invasor Alienígena',     hp:52,  stabReward:45,  coinReward:220, emoji:'', damageReduction:0.15, failDamageMult:1.0, hpRegenOnHit:1, hpRegenOnFail:1, heightLoss:15 },
  {id:'death',   name:' Ceifador da Morte',     hp:56, stabReward:55,  coinReward:300, emoji:'', damageReduction:0,    failDamageMult:1.0, hpRegenOnHit:0, hpRegenOnFail:3, heightLoss:20 },
  {id:'pixel',   name:' Pixel King',            hp:60,  stabReward:40,  coinReward:200, emoji:'', damageReduction:0.30, failDamageMult:1.0, hpRegenOnHit:2, hpRegenOnFail:1, heightLoss:20 },
  {id:'ghost',   name:' Fantasma Errante',      hp:64,  stabReward:35,  coinReward:170, emoji:'', damageReduction:0,    failDamageMult:1.0, hpRegenOnHit:0, hpRegenOnFail:2, heightLoss:25 },
  {id:'doll',    name:' Boneca Maldita',        hp:68,  stabReward:50,  coinReward:280, emoji:'.', damageReduction:0.20, failDamageMult:1.0, hpRegenOnHit:1, hpRegenOnFail:2, heightLoss:25 },
  {id:'drama',   name:' Mestre do Disfarce',    hp:72, stabReward:60,  coinReward:350, emoji:'', damageReduction:0.15, failDamageMult:1.0, hpRegenOnHit:2, hpRegenOnFail:3, heightLoss:30 },
];

/* Cap de recuperação de estabilidade ao derrotar boss (máx 50) */
function applyBossStabReward(reward){
  const capped=Math.min(50, reward);
  G.stab=Math.round(Math.min(G.maxStab, G.stab+capped));
  return capped;
}

/* ════════════════════════════════════════
   DICE TYPES — with custom colors & pips
════════════════════════════════════════ */
const DICE_TYPES = [
  { sides:6,  name:'d6',  color:'#e84050', dark:'#801020', label:'Cubo'      },
  { sides:8,  name:'d8',  color:'#3de87a', dark:'#106030', label:'Octaedro'  },
  { sides:12, name:'d12', color:'#aa44ff', dark:'#5020a0', label:'Dodecaedro'},
  { sides:20, name:'d20', color:'#f0c040', dark:'#705010', label:'Icosaedro' },
];

/* ════════════════════════════════════════
   STATE
════════════════════════════════════════ */
const SAVE_KEY='totemAsc_fresh_v1';
let G={};

function newStateBase1(){
  return {
    coins:0,totalCoins:0,
 xp:0,level:1,eventCooldown:4,
    height:0,bestHeight:0,
    stab:100,maxStab:100,
    hits:0,misses:0,streak:0,bestStreak:0,
    critHits:0,perfectHits:0,luckyMax:0,
    combo:0,bestCombo:0,lastMechanic:'',
    power:0,powerReady:false,
    divineEssence:0,
    phase:1,
    diceReq:4,diceSides:6,diceType:0,
    diceMode:'higher', /* higher/lower/exact/parity/interval */
    diceModeLabel:'Maior',
    diceParityTarget:'par', /* par/ímpar */
    diceIntervalMin:0,diceIntervalMax:0,
    lastDiceTypes:[], /* anti-repetição */
    luckCombo:0, /* combo de sorte — escalonado */
    timingSpd:0.72,tGreenW:16,tYellowW:44,tPerfectW:5,
    timingPattern:'pingpong', /* pingpong/delay/hidden/dual/moving/reverse */
    timingZoneSlide:0, /* para zona móvel */
    timingHideColors:false, /* pulso oculto */
    seqLen:4,seqSol:[],seqProg:0,seqTimer:5,seqTimerMax:5,seqShowTime:3,seqEcho:false,seqModifier:null,
    seqEcho:false,
    bossActive:false,bossIdx:0,bossHp:0,bossMaxHp:0,bossDefeated:[],
    lastBossEmoji:null,
    eventId:null,eventLeft:0,
    doubleCoins:false,windOn:false,
    springOn:false,ancientOn:false,rainbowOn:false,
    upgrades:{},
    pieces:[],
    piecesSinceBoss:0,bossThreshold:40,
    turn:0,
    timingConsec:0,
    lastPhase:1,
    mergeSpeed:0.5,
    achievements:{},
    totemsSaved:0,
    _inCritical:false,
    reviveCount:0,
    _lastPieceWeight:1,
    _divineSaves:0,
    _shadowProtections:0,
    _timingZones:null,
    _tempCoinMult:1,
    _tempHeightMult:1,
    _tempLuckBoost:0,
  };
}

/* ════════════════════════════════════════
   SCREEN NAV
════════════════════════════════════════ */
let curScreen='menu';
function goScreenBase1(id){
  SFX.click();
  // Música ambiente
  if(id==='menu' && musicEnabled) playMenuMusic();
  else if(id==='game' && musicEnabled) playGameMusic();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+id).classList.add('active');
  if(id!=='menu'){
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    const nb=document.getElementById('nb-'+id);
    if(nb) nb.classList.add('active');
  }
  curScreen=id;
  if(id==='upgrades')      renderUpgrades();
  if(id==='inventory')     renderInventory();
  if(id==='codex')         renderCodex();
  if(id==='achievements')  renderAchievements();
  if(id==='stats')         renderStats();
  if(id==='log')           renderLog();
  if(id==='inventory')     renderInventory();
  if(id==='codex')         renderCodex();
  if(id==='game')          updateHUD();
}

function continuarJogo(){
  loadGame();
  goScreen('game');
  applyUpgFx();
  
  applyProgressions();
  renderTotem();
  setPhaseUI();
  updateHUD();
  startTimingLoop();
  startAutoLoop();
  startEventLoop();
  startStabCheckLoop();
  addLog('▶️ Jogo retomado!','e');
}

/* ════════════════════════════════════════
   MENU BACKGROUND — floating runes & stars
════════════════════════════════════════ */
function initMenuBackground(){
  const bg=document.getElementById('menu-bg');
  if(!bg) return;
  bg.innerHTML='';
  // Floating runes
  for(let i=0;i<14;i++){
    const r=document.createElement('div');
    r.className='menu-rune';
    r.textContent=RUNES[Math.floor(Math.random()*RUNES.length)].glyph;
    r.style.left=Math.random()*100+'%';
    r.style.animationDuration=(10+Math.random()*12)+'s';
    r.style.animationDelay=(-Math.random()*15)+'s';
    r.style.fontSize=(1+Math.random()*1.5)+'em';
    bg.appendChild(r);
  }
  // Stars
  for(let i=0;i<30;i++){
    const s=document.createElement('div');
    s.className='menu-star';
    s.style.left=Math.random()*100+'%';
    s.style.top=Math.random()*100+'%';
    s.style.animationDelay=(-Math.random()*3)+'s';
    bg.appendChild(s);
  }
}

/* ════════════════════════════════════════
   HOW TO PLAY
════════════════════════════════════════ */

/* ════════════════════════════════════════
   MODAL
════════════════════════════════════════ */
let modalOpen=false;
function openModalBase1(html){
 window.modalEpoch=(window.modalEpoch||0)+1;
  document.getElementById('modal-box').innerHTML=html;
  document.getElementById('modal-overlay').classList.add('open');
  modalOpen=true;
}
function closeModalBase1(){
 if(window.rollBusy)return;
 if(G._seqRepeatInterval)clearInterval(G._seqRepeatInterval);seqTimerRunning=false;window.seqResolved=true;
  const ov=document.getElementById('modal-overlay');
  const box=document.getElementById('modal-box');
  ov.classList.remove('open','mechanic-modal');
  if(box){box.classList.remove('mechanic-sheet');box.dataset.action='';}
  modalOpen=false;
 startActionPresentation();
 window.modalEpoch=(window.modalEpoch||0)+1;
  tRunning=false;
}
document.getElementById('modal-overlay').addEventListener('click',e=>{
  if(e.target===document.getElementById('modal-overlay')) closeModal();
});

/* ════════════════════════════════════════
   MAIN ACTION
════════════════════════════════════════ */

/* ════════════════════════════════════════
   DICE MODAL — Beautiful 3D dice with pips
════════════════════════════════════════ */
function openDiceModalBase1(){
  normalizeDiceState();
  const bMode=G.bossActive;
  const boss=bMode?BOSSES[G.bossIdx%BOSSES.length]:null;
  const diceType=DICE_TYPES[G.diceType%DICE_TYPES.length];
  const modeInfo=getDiceModeInfo();

  openModal(`
    <h2 style="font-size:1em;">${bMode?'⚔️ '+boss.name:'🎲 Dado da Sorte'}</h2>
    <div id="dice-objective-card" style="background:linear-gradient(135deg,${modeInfo.color}22,${modeInfo.color}08);border:2px solid ${modeInfo.color};border-radius:10px;padding:8px 10px;margin:2px 0;text-align:center;width:100%;box-sizing:border-box;">
      <div style="font-size:.62em;color:var(--muted);text-transform:uppercase;letter-spacing:1px;">OBJETIVO — ${diceType.name}</div>
      <div style="font-size:1.2em;font-weight:900;color:${modeInfo.color};line-height:1.2;">${modeInfo.icon} ${modeInfo.label}</div>
      <div style="font-size:.95em;color:var(--text);margin-top:2px;font-weight:700;" id="drn">${getDiceRequirementText()}</div>
    </div>
    <div id="dice-stage">
      <div class="dd-scene" id="dice-scene">
        <div class="dd-cube" id="dice-cube">
          <div class="dd-face dd-front  dd-f1"><span class="dice-numeral">1</span></div>
          <div class="dd-face dd-back   dd-f6"><span class="dice-numeral">6</span></div>
          <div class="dd-face dd-right  dd-f3"><span class="dice-numeral">3</span></div>
          <div class="dd-face dd-left   dd-f4"><span class="dice-numeral">4</span></div>
          <div class="dd-face dd-top    dd-f2"><span class="dice-numeral">2</span></div>
          <div class="dd-face dd-bottom dd-f5"><span class="dice-numeral">5</span></div>
        </div>
        <div class="dd-poly-container" id="dice-poly-container">
          <svg class="dd-poly-svg" id="dice-poly-svg" viewBox="0 0 200 200"></svg>
        </div>
      </div>
    </div>
    <div id="dice-result-msg" style="min-height:18px;font-size:.85em;font-weight:700;text-align:center;"></div>
    <button class="upg-buy" style="width:100%;padding:10px;font-size:.9em"
      id="dice-roll-btn" onclick="execDiceRoll()">🎲 Rolar!</button>
    <button class="modal-close" onclick="closeModal()" style="font-size:.72em;padding:4px 14px;">Fechar</button>
  `);
  renderDiceFace(1);
}

/* Info visual de cada modo */
function getDiceModeInfo(){
  const m=G.diceMode;
  const map={
    higher:   {icon:'≥',label:'Maior ou igual',color:'#3de87a',desc:'Tirou igual ou acima'},
    lower:    {icon:'≤',label:'Menor ou igual',color:'#4488ff',desc:'Tirou igual ou abaixo'},
    exact:    {icon:'=',label:'Exato',    color:'#f0c040',desc:'Tirou exatamente o número'},
    parity:   {icon:'½',label:'Par/Ímpar',color:'#aa44ff',desc:'Paridade sorteada'},
    interval: {icon:'…',label:'Intervalo',color:'#ff8833',desc:'Dentro do intervalo'}
  };
  return map[m]||map.higher;
}

/* Mapeamento de rotação do cubo real para cada resultado do D6 */
const d6Rotations={1:[0,0],2:[-90,0],3:[0,-90],4:[0,90],5:[90,0],6:[0,180]};

/* Geometria SVG dos poliedros D8 / D12 / D20 (fiel ao arquivo de referência) */
const POLY_GEOMETRY={
  8:(svg,num,color)=>{
    svg.innerHTML=`
      <polygon points="100,20 170,100 100,180 30,100" fill="${color}" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
      <line x1="30" y1="100" x2="170" y2="100" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      <text x="100" y="110" text-anchor="middle" dominant-baseline="middle" fill="white" class="dd-poly-num font-dd8">${num}</text>
    `;
  },
  12:(svg,num,color)=>{
    svg.innerHTML=`
      <polygon points="100,30 166,78 141,156 59,156 34,78" fill="${color}" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
      <text x="100" y="105" text-anchor="middle" dominant-baseline="middle" fill="white" class="dd-poly-num font-dd12">${num}</text>
    `;
  },
  20:(svg,num,color)=>{
    svg.innerHTML=`
      <polygon points="100,20 180,70 180,140 100,190 20,140 20,70" fill="${color}" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
      <line x1="100" y1="20" x2="100" y2="190" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <line x1="20" y1="70" x2="180" y2="140" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <line x1="20" y1="140" x2="180" y2="70" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <text x="100" y="115" text-anchor="middle" dominant-baseline="middle" fill="white" class="dd-poly-num font-dd20">${num}</text>
    `;
  }
};

/* Renderiza a face do dado: cubo real (D6) ou poliedro SVG (D8/D12/D20) */
function renderDiceFaceBase1(value,cls){
  const cube=document.getElementById('dice-cube');
  const polyContainer=document.getElementById('dice-poly-container');
  const polySvg=document.getElementById('dice-poly-svg');
  if(!cube||!polyContainer) return;
  const diceType=DICE_TYPES[G.diceType%DICE_TYPES.length];
  const sides=diceType.sides;

  if(sides===6){
    cube.style.display='block';
    polyContainer.classList.remove('visible');
    const [rx,ry]=d6Rotations[value]||[0,0];
    cube.style.transform=`rotateX(${rx}deg) rotateY(${ry}deg)`;
  } else {
    cube.style.display='none';
    polyContainer.classList.add('visible');
    if(polySvg&&POLY_GEOMETRY[sides]) POLY_GEOMETRY[sides](polySvg,value,diceType.color);
  }

  const stage=document.getElementById('dice-stage');
  if(stage){
    stage.classList.remove('dice-win','dice-lose');
    if(cls==='win'){ void stage.offsetWidth; stage.classList.add('dice-win'); }
    else if(cls==='lose'){ void stage.offsetWidth; stage.classList.add('dice-lose'); }
  }
}

/* Perfect dos Dados: apenas acertos diretos, sem assistência ou vantagem. */
function dicePerfectResult(roll){
  const sides=G.diceSides;
  switch(G.diceMode){
    case 'higher':return roll===sides;
    case 'lower':return roll===1;
    case 'exact':return roll===G.diceReq;
    case 'parity':return roll===(G.diceParityTarget==='par'?sides:sides-1);
    case 'interval':return roll===Math.floor((G.diceIntervalMin+G.diceIntervalMax)/2);
    default:return false;
  }
}
function execDiceRoll(){
 normalizeDiceState();
 if(window.rollBusy)return;window.rollBusy=true;
  SFX.dice();
  const btn=document.getElementById('dice-roll-btn');
  if(btn) btn.disabled=true;
  const container=document.getElementById('dice-scene');
  if(!container){window.rollBusy=false;return;}

  container.classList.add('dd-shaking');
  container.classList.remove('dd-rolling-3d');
  void container.offsetWidth;
  container.classList.add('dd-rolling-3d');
  let tick=0;
  const totalTicks=14;
  const iv=setInterval(()=>{
    try{
      const val=rnd(G.diceSides);
      renderDiceFace(val);
      if(++tick>=totalTicks){
        clearInterval(iv);
        container.classList.remove('dd-shaking','dd-rolling-3d');
        let roll=rnd(G.diceSides);
        const firstRoll=roll;
        const luckB=getLuckChance(G.height);
        const maxVal=G.diceSides;
        let isLuckyMax=roll===maxVal;
        G._advantageCache=null;
        const goldenRescue=G.activePowerUps?.goldenDice>0&&!diceRollPassesBase1(roll);const pass=goldenRescue||diceRollPasses(roll)||((G.blessing||0)>0)||(Math.random()<luckB);
        if(G._advantageCache?.pass)roll=G._advantageCache.second;
        isLuckyMax=roll===maxVal;
        addLog('D'+G.diceSides+' • resultado '+firstRoll+(G._advantageCache?' • vantagem: '+G._advantageCache.second:'')+' • objetivo '+getDiceRequirementText()+' • '+(pass?'acerto':'erro')); 

        renderDiceFace(roll,pass?'win':'lose');

        const assisted=goldenRescue||!!G._advantageCache||!diceRollPassesBase1(firstRoll)||((G.blessing||0)>0&&!diceRollPassesBase1(firstRoll))||((G.activePowerUps?.goldenDice||0)>0);
        const isPerfect=pass&&!assisted&&dicePerfectResult(roll);
        if(pass){
          spawnDiceParticles(isPerfect?'#f0c040':'#3de87a');
        } else {
          spawnDiceParticles('#e84050');
        }

        const msg=document.getElementById('dice-result-msg');
        if(msg){
          if(isPerfect){
            msg.textContent='🌟 PERFECT!';
            msg.style.color='#f0c040';
            G.luckyMax++;
            SFX.perfect();
          } else if(pass){
            msg.textContent=goldenRescue?'✨ DADOS DOURADOS • ERRO CONVERTIDO EM ACERTO!':'✅ Acertou! ('+roll+')';
            msg.style.color='#3de87a';
            SFX.success();
          } else {
            msg.textContent='❌ Falhou! ('+roll+')';
            msg.style.color='#e84050';
            SFX.fail();
          }
        }

        const mechanic='dice';
        if(G.lastMechanic&&G.lastMechanic!==mechanic){
          G.combo++;
          if(G.combo>G.bestCombo) G.bestCombo=G.combo;
          if(G.combo>=2) spawnFloat('🎨 Combo ×'+(G.combo+1)+'!','#aa44ff',0);
        } else {
          G.combo=0;
        }
        G.lastMechanic=mechanic;

        if(pass){
          onSuccess('dice',isPerfect?'perfect':'lucky',6);
        } else {
          // Um erro real sempre usa a penalidade comum; bônus legado não concede acerto.
          onFail();
        }
        G.diceNeedsRequirement=true;
        setTimeout(()=>{window.rollBusy=false;closeModal();checkPhaseShift();checkAchievements();},550);
      }
    }catch(e){
      console.error('Erro no execDiceRoll:',e);
      clearInterval(iv);
    }
  },G.eventId==='gale'?55/1.2:55);

}

function spawnDiceParticles(color){
  const stage=document.getElementById('dice-stage');
  if(!stage) return;
  const rect=stage.getBoundingClientRect();
  for(let i=0;i<14;i++){
    const p=document.createElement('div');
    p.style.cssText=`position:fixed;left:${rect.left+rect.width/2}px;top:${rect.top+rect.height/2}px;
      width:6px;height:6px;border-radius:50%;background:${color};pointer-events:none;z-index:250;
      box-shadow:0 0 8px ${color};`;
    document.body.appendChild(p);
    const angle=(Math.PI*2*i)/14;
    const dist=60+Math.random()*40;
    p.animate([
      {transform:'translate(0,0) scale(1)',opacity:1},
      {transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) scale(0)`,opacity:0}
    ],{duration:700,easing:'cubic-bezier(.22,.68,0,1)'}).onfinish=()=>p.remove();
  }
}

function getDiceRequirementText(){
  switch(G.diceMode){
    case 'higher':   return '≥ '+G.diceReq;
    case 'lower':    return '≤ '+G.diceReq;
    case 'exact':    return '= '+G.diceReq;
    case 'parity':   return G.diceParityTarget==='par'?'Par':'Ímpar';
    case 'interval': return G.diceIntervalMin+'-'+G.diceIntervalMax;
    default: return '≥ '+G.diceReq;
  }
}

function updateDiceReq(){
  const diceType=DICE_TYPES[G.diceType%DICE_TYPES.length];
  const sides=diceType.sides;
  G.diceSides=sides;
  // Pesos: Maior/Menor comuns (70%), Exato/Par-Ímpar/Intervalo raros (30%)
  const modes=[
    {m:'higher',   w:38},
    {m:'lower',    w:32},
    {m:'exact',    w:8},
    {m:'parity',   w:12},
    {m:'interval', w:10}
  ];
  const totalW=modes.reduce((s,x)=>s+x.w,0);
  let r=Math.random()*totalW;
  let chosen=modes[0].m;
  for(const x of modes){
    r-=x.w;
    if(r<=0){chosen=x.m;break;}
  }
  G.diceMode=chosen;
  // Configura requisitos por modo — SEMPRE com chance real de passar
  if(chosen==='higher'){
    // Maior ou igual: entre 2 e sides-1 (sempre tem pelo menos 2 valores possíveis)
    // ex: d6 → 2..5 (50-83%), d8 → 3..6, d12 → 4..10, d20 → 6..17
    const minReq=Math.max(2, Math.ceil(sides*(.25+.025*(mechanicLevel()-1))));
    const maxReq=sides-1; /* nunca pedir >sides */
    G.diceReq=minReq+Math.floor(Math.random()*(maxReq-minReq+1));
    G.diceModeLabel='Maior ou igual a';
  } else if(chosen==='lower'){
    // Menor ou igual: entre 2 e sides-1 (sempre tem pelo menos 2 valores possíveis)
    // ex: d6 → 2..5 (33-83%), nunca ≤0 ou ≤1
    const minReq=2;
    const maxReq=Math.max(2, Math.floor(sides*(.8-.03*(mechanicLevel()-1))));
    G.diceReq=minReq+Math.floor(Math.random()*(maxReq-minReq+1));
    G.diceModeLabel='Menor ou igual a';
  } else if(chosen==='exact'){
    // Exatamente: qualquer número entre 1 e sides
    G.diceReq=1+Math.floor(Math.random()*sides);
    G.diceModeLabel='Exatamente';
  } else if(chosen==='parity'){
    G.diceParityTarget=Math.random()<0.5?'par':'impar';
    G.diceModeLabel=G.diceParityTarget==='par'?'Número PAR':'Número ÍMPAR';
  } else if(chosen==='interval'){
    // Intervalo com 30-50% das faces, sempre válido
    const span=Math.max(2, Math.floor(sides*0.4));
    const maxStart=sides-span+1;
    const a=1+Math.floor(Math.random()*maxStart);
    G.diceIntervalMin=a;
    G.diceIntervalMax=a+span-1;
    G.diceModeLabel='Entre '+G.diceIntervalMin+' e '+G.diceIntervalMax;
  }
  // Atualiza UI
  const el=document.getElementById('drn');
  if(el) el.textContent=getDiceRequirementText();
  const dmEl=document.getElementById('dmode');
  if(dmEl) dmEl.textContent=G.diceModeLabel;
}

/* Verifica se o roll passa de acordo com o modo atual */
function diceRollPassesBase1(roll){
  switch(G.diceMode){
    case 'higher':   return roll>=G.diceReq;
    case 'lower':    return roll<=G.diceReq;
    case 'exact':    return roll===G.diceReq;
    case 'parity':   return G.diceParityTarget==='par' ? (roll%2===0) : (roll%2===1);
    case 'interval': return roll>=G.diceIntervalMin && roll<=G.diceIntervalMax;
    default:         return roll>=G.diceReq;
  }
}

/* ════════════════════════════════════════
   TIMING MODAL — with PERFECT PULSE (golden center)
════════════════════════════════════════ */
let tPos=0,tDir=1,tRunning=false,tLast=0;
let timingConsecHits=0;

function getTimingSpeed(){
  const base=G.timingSpd;
  const mult=G.bossActive?3:Math.min(timingConsecHits,3);
  const bonus=mult*0.15;
  return (base+bonus)/(G.eventId==='gale'?1/1.2:1);
}

function getTimingPatternInfo(){
  const p=G.timingPattern||'pingpong';
  const map={
    pingpong: {label:'Ping-Pong',icon:'↔️',desc:'Cursor vai e volta'},
    delay:    {label:'Delay Falso',icon:'🐌',desc:'Desacelera perto do verde'},
    hidden:   {label:'Pulso Oculto',icon:'🌫️',desc:'Cores somem nos últimos 0.6s'},
    dual:     {label:'Janela Dupla',icon:'⛩️',desc:'Dois verdes — só um é válido'},
    moving:   {label:'Zona Móvel',icon:'🏃',desc:'Verde desliza'},
    reverse:  {label:'Reverse',icon:'⏮️',desc:'Começa rápido e desacelera'}
  };
  return map[p]||map.pingpong;
}

function pickTimingPattern(){
  // Padrão aleatório com base na altura (mais variações em alturas altas)
  const h=G.height;
  let pool=['pingpong'];
  if(h>=50)  pool.push('pingpong','delay');
  if(h>=150) pool.push('reverse','moving');
  if(h>=300) pool.push('hidden','dual');
  return pool[Math.floor(Math.random()*pool.length)];
}

function openTimingModalBase1(){
  const bMode=G.bossActive;
  const boss=bMode?BOSSES[G.bossIdx%BOSSES.length]:null;
  let speedMult=timingConsecHits;
  if(bMode) speedMult=3;
  const spdLabel=speedMult===0?'Normal':
    speedMult===1?'Rápido ⚡':
    speedMult===2?'Veloz ⚡⚡':'Extremo ⚡⚡⚡';

  // Sorteia padrão de timing
  G.timingPattern=pickTimingPattern();
  G.timingHideColors=false;
  G.timingZoneSlide=0;
  const pat=getTimingPatternInfo();

  openModal(`
    <h2>${bMode?'⚔️ '+boss.name:'⏱️ Timing'}</h2>
    <p class="msub">Pare o cursor na zona verde! 🌟 Centro = Perfect!</p>
    <div id="timing-speed-badge">${pat.icon} Padrão: ${pat.label} — ${pat.desc} | Vel: ${spdLabel}</div>
    <div class="timing-stone-frame"><div class="timing-inscription" aria-hidden="true">ᚱ · ᚠ · ᚨ</div><div id="timing-track">
      <div id="t-red-l"></div>
      <div id="t-yellow-l"></div>
      <div id="t-green"></div>
      <div id="t-perfect"></div>
      <div id="t-green-2" style="display:none;"></div>
      <div id="t-yellow-r"></div>
      <div id="t-red-r"></div>
      <div id="t-cursor" style="left:0%"><i class="sword-blade"></i><i class="sword-guard"></i><i class="sword-grip"></i></div>
    </div>
    <div class="timing-embers" aria-hidden="true"></div></div><div id="timing-hint">🔴 Falha | 🟡 Fraco | 🟢 Forte | 🌟 Perfect</div>
    <button class="upg-buy" style="width:100%;padding:13px;font-size:.95em"
      id="timing-go-btn" onclick="execTiming()">🔨 Construir!</button>
    <button class="modal-close" onclick="closeModal();tRunning=false;">Fechar</button>
  `);
  reposTimingZones();
  tPos=0;tDir=1;tLast=performance.now();
  tRunning=true;
  // Pulso oculto: esconder cores após 1.4s
  if(G.timingPattern==='hidden'){
    setTimeout(()=>{
      if(!tRunning) return;
      ['t-green','t-perfect','t-yellow-l','t-yellow-r','t-red-l','t-red-r'].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.style.opacity='0.15';
      });
      const hint=document.getElementById('timing-hint');
      if(hint) hint.textContent='🌫️ Cores ocultas — antecipe!';
    },1400);
  }
}

function startTimingLoop(){
 if(startTimingLoop.started)return; startTimingLoop.started=true;
  function loop(ts){
    if(tRunning){
      const dt=Math.min(40,Math.max(0,ts-tLast));
      let spd=getTimingSpeed()+
        (G.bossActive&&BOSSES[G.bossIdx%BOSSES.length].id==='serpent'?0.7:0);
      const pat=G.timingPattern||'pingpong';
      // Variações de velocidade
      if(pat==='delay'){
        // Desacelera perto do verde (centro 50%)
        const z=G._timingZones||{gL:40,gL2:60};
        const center=(z.gL+z.gL2)/2;
        const dist=Math.abs(tPos-center);
        if(dist<15) spd*=0.45; // desacelera perto do verde
        else spd*=1.3; // acelera fora
      } else if(pat==='reverse'){
        // Começa rápido e desacelera
        const phase=(tPos+0.01)/100;
        spd*=(1.6 - phase*1.0);
      }
      tPos+=tDir*spd*dt*0.05;
      if(tPos>=100){tPos=100;tDir=-1;}
      if(tPos<=0)  {tPos=0;  tDir=1;}
      // Zona móvel: desliza o verde
      if(pat==='moving' && G._timingZones){
        G.timingZoneSlide+=dt*0.0015;
        const offset=Math.sin(G.timingZoneSlide)*8;
        reposTimingZones(offset);
      }
      const cur=document.getElementById('t-cursor');
      if(cur) cur.style.left=tPos+'%';
    }
    tLast=ts;
    requestAnimationFrame(loop);
  }
  tLast=performance.now();
  requestAnimationFrame(loop);
}

function execTiming(){
 if(!tRunning)return;
 window.rollBusy=true;
 tRunning=false;
  const btn=document.getElementById('timing-go-btn');
  if(btn) btn.disabled=true;

  const z=G._timingZones||{};
  const hint=document.getElementById('timing-hint');
  let quality=null;
  // Centro perfeito (dourado)
  if(tPos>=z.pL&&tPos<=z.pL2){
    if(hint){hint.textContent='🌟 PERFECT! +18 XP e +18 Gold';hint.style.color='#f0c040';}
    quality='perfect';
    spawnTimingParticles('#f0c040');
    SFX.perfect();
  }
  // Verde = sucesso FORTE
  else if(tPos>=z.gL&&tPos<=z.gL2){
    if(hint){hint.textContent='🟢 Verde! Sucesso forte!';hint.style.color='#3de87a';}
    quality='strong';
    spawnTimingParticles('#3de87a');
    SFX.success();
  }
  // Amarelo = sucesso FRACO
  else if((tPos>=z.yL_l&&tPos<=z.yL_l2)||(tPos>=z.yR_l&&tPos<=z.yR_l2)){
    if(hint){hint.textContent='🟡 Amarelo — Sucesso fraco';hint.style.color='#f0c040';}
    quality='normal';
    spawnTimingParticles('#f0c040');
    SFX.click();
  }
  // Vermelho = FALHA (antes era "normal", agora é falha de verdade)
  else {
    if(hint){hint.textContent='🔴 Vermelho — FALHOU!';hint.style.color='#e84050';}
    SFX.fail();
  }

  // Combo multi-mecânica
  const mechanic='timing';
  if(G.lastMechanic&&G.lastMechanic!==mechanic){
    G.combo++;
    if(G.combo>G.bestCombo) G.bestCombo=G.combo;
    if(G.combo>=2) spawnFloat('🎨 Combo ×'+(G.combo+1)+'!','#aa44ff',0);
  } else {
    G.combo=0;
  }
  G.lastMechanic=mechanic;

  if(quality){
    timingConsecHits++;
    onSuccess('timing',quality,quality==='perfect'?9:quality==='strong'?7:4);
  } else {
    timingConsecHits=0;
    onFail();
  }

  setTimeout(()=>{window.rollBusy=false;closeModal();checkPhaseShift();checkAchievements();},600);
}

function spawnTimingParticles(color){
  const track=document.getElementById('timing-track');
  if(!track) return;
  const rect=track.getBoundingClientRect();
  for(let i=0;i<10;i++){
    const p=document.createElement('div');
    p.style.cssText=`position:fixed;left:${rect.left+tPos*rect.width/100}px;top:${rect.top+rect.height/2}px;
      width:5px;height:5px;border-radius:50%;background:${color};pointer-events:none;z-index:250;
      box-shadow:0 0 6px ${color};`;
    document.body.appendChild(p);
    const angle=Math.random()*Math.PI*2;
    const dist=40+Math.random()*40;
    p.animate([
      {transform:'translate(0,0) scale(1)',opacity:1},
      {transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) scale(0)`,opacity:0}
    ],{duration:600,easing:'ease-out'}).onfinish=()=>p.remove();
  }
}

function reposTimingZones(offset){
  // Verde encolhe AGRESSIVAMENTE: 14% → 2% conforme altura
  const progressFactor=Math.max(0.45,1-Math.log2(1+G.height/100)*0.10);
  const gW=Math.max(7, Math.min(20, G.tGreenW*progressFactor + upLv('zone')*2));
  if(offset===undefined)G._timingBase=10+Math.random()*(80-gW);
  let gL=Math.max(2,Math.min(98-gW,G._timingBase+(offset||0)));
  const pW=Math.min(gW,Math.max(2.5,G.tPerfectW*progressFactor));
  const pL=gL+(gW-pW)/2;
  // Amarelo dos dois lados (cada um 6%)
  const yL_l=Math.max(0, gL-6);
  const yL_w=gL-yL_l;
  const yR_l=gL+gW;
  const yR_w=Math.min(6, 100-yR_l);
  // Vermelho dos dois lados (cada um 14%) — falha!
  const rL_l=Math.max(0, yL_l-14);
  const rL_w=yL_l-rL_l;
  const rR_l=yR_l+yR_w;
  const rR_w=Math.min(14, 100-rR_l);
  const g=document.getElementById('t-green');
  const p=document.getElementById('t-perfect');
  const yl=document.getElementById('t-yellow-l');
  const yr=document.getElementById('t-yellow-r');
  const rl=document.getElementById('t-red-l');
  const rr=document.getElementById('t-red-r');
  if(g){g.style.left=gL+'%';g.style.width=gW+'%';}
  if(p){p.style.left=pL+'%';p.style.width=pW+'%';}
  if(yl){yl.style.left=yL_l+'%';yl.style.width=yL_w+'%';}
  if(yr){yr.style.left=yR_l+'%';yr.style.width=yR_w+'%';}
  if(rl){rl.style.left=rL_l+'%';rl.style.width=rL_w+'%';}
  if(rr){rr.style.left=rR_l+'%';rr.style.width=rR_w+'%';}
  // Janela dupla: segundo verde falso (não pontua)
  const g2=document.getElementById('t-green-2');
  if(G.timingPattern==='dual' && g2){
    g2.style.display='block';
    g2.style.position='absolute';
    g2.style.height='100%';
    g2.style.background='linear-gradient(180deg,rgba(60,220,100,.4),rgba(60,220,100,.25))';
    const g2L=Math.max(0, 100-gL-gW-15)+Math.random()*10;
    g2.style.left=g2L+'%';
    g2.style.width=gW+'%';
    G._timingZonesFake={gL:g2L,gL2:g2L+gW};
  } else if(g2){
    g2.style.display='none';
    G._timingZonesFake=null;
  }
  // Guarda para execTiming
  G._timingZones={gL,gL2:gL+gW,pL,pL2:pL+pW,yL_l,yL_l2:yL_l+yL_w,yR_l,yR_l2:yR_l+yR_w,rL_l,rL_l2:rL_l+rL_w,rR_l,rR_l2:rR_l+rR_w};
}

/* ════════════════════════════════════════
   SEQUENCE MODAL — with ECHO MODE
════════════════════════════════════════ */
let seqShowTimer=null;
let seqTimerRunning=false;

function getSeqLengthForHeight(h){
  // 4 símbolos início → 7 máximo
  if(h<100)   return 4;
  if(h<300)   return 5;
  if(h<800)   return 6;
  return 7;
}

function getSeqShowTime(h, len){
  // Tempo de memorização: base 8s, diminui 0.5s a cada 300 de altura
  const base=Math.max(4, 8 - Math.floor(h/400));
  // +0.6s por símbolo (era 0.2)
  return Math.max(3, (base + len*0.6) * (G._progSeqTimeMult||1));
}

function getSeqRepeatTime(h, len){
  // Tempo para repetir: base 14s, +1.2s por símbolo (mais generoso)
  // Mínimo 8s mesmo em alturas altas
  return Math.max(8, (14 - Math.floor(h/300) + len*1.2) * (G._progSeqTimeMult||1));
}

function pickSeqModifier(h){
  // Modificadores entram progressivamente
  if(h<200) return null;
  const mods=[];
  if(h>=200) mods.push('shadow');
  if(h>=400) mods.push('wind');
  if(h>=700) mods.push('chaos');
  if(h>=1200) mods.push('ancient');
  if(h>=2000) mods.push('divine');
  // 35% chance de ativar um modificador
  if(Math.random()<0.35){
    return mods[Math.floor(Math.random()*mods.length)];
  }
  return null;
}

function getSeqModifierInfo(m){
  const map={
    shadow:  {icon:'🌑',label:'Shadow',desc:'Alguns símbolos escurecidos'},
    wind:    {icon:'💨',label:'Wind',desc:'Símbolos se movem lentamente'},
    chaos:   {icon:'🌀',label:'Chaos',desc:'Ordem dos símbolos embaralhada'},
    ancient: {icon:'🏺',label:'Ancient',desc:'Sequência aparece por menos tempo'},
    divine:  {icon:'✨',label:'Divine',desc:'Tentativa extra se errar'}
  };
  return map[m]||null;
}

function openSeqModal(){
  const bMode=G.bossActive;
  const boss=bMode?BOSSES[G.bossIdx%BOSSES.length]:null;
  G.seqLen=getSeqLengthForHeight(G.height);
  G.seqEcho=(G.streak>=3&&Math.random()<0.20);
  G.seqModifier=pickSeqModifier(G.height);
  G._seqDivineRetry=false;
  const showTime=getSeqShowTime(G.height, G.seqLen);
  const repeatTime=getSeqRepeatTime(G.height, G.seqLen);
  G.seqShowTime=showTime;
  G.seqTimerMax=repeatTime;

  const modInfo=getSeqModifierInfo(G.seqModifier);
  let modBadge='';
  if(modInfo){
    modBadge=`<div id="seq-mode-badge" style="background:rgba(170,68,255,.15);border:1px solid var(--purple);color:#c8a0ff;padding:5px 10px;border-radius:8px;font-size:.72em;margin:4px 0;">${modInfo.icon} ${modInfo.label}: ${modInfo.desc}</div>`;
  }
  openModal(`
    <h2>${bMode?'⚔️ '+boss.name:'🔮 Sequência de Runas'}</h2>
    <p class="msub">${G.seqEcho?'🌟 ECHO! Repita a sequência INVERTIDA!':'Memorize e repita a sequência!'}</p>
    ${G.seqEcho?'<div id="seq-mode-badge" style="background:rgba(240,192,64,.15);border:1px solid var(--gold);color:var(--gold);padding:5px 10px;border-radius:8px;font-size:.72em;margin:4px 0;">🔄 ECHO ATIVO — +50% Recompensa</div>':''}
    ${modBadge}
    <div id="seq-symbols"></div>
    <div id="seq-timer">Memorize: ${showTime.toFixed(1)}s</div>
    <div id="seq-progress-display"></div>
    <div id="seq-btns"></div>
    <div id="seq-hint"></div>
    <button class="modal-close" onclick="closeModal()">Fechar</button>
  `);
  genSeq();
}

function genSeq(){
 window.seqResolved=false;
  G.seqSol=Array.from({length:G.seqLen},()=>RUNES[Math.floor(Math.random()*RUNES.length)].glyph);
  if(G.seqEcho){
    G.seqSolOriginal=[...G.seqSol];
    G.seqSol=[...G.seqSol].reverse();
  }
  // Chaos: salva ordem embaralhada para exibição (mas solução é a original)
  if(G.seqModifier==='chaos'){
    G._seqDisplayOrder=[...G.seqSol].sort(()=>Math.random()-0.5);
    // Se por acaso ficou igual, inverte
    if(G._seqDisplayOrder.join('')===G.seqSol.join('')){
      G._seqDisplayOrder.reverse();
    }
  }
  if(G.seqModifier==='chaos'){G.seqSol=G.seqEcho?[...G._seqDisplayOrder].reverse():[...G._seqDisplayOrder];}
  G.seqProg=0;
  renderSeq();
  showSeqSymbols();
}

function showSeqSymbols(){
 const epoch=window.modalEpoch;
  const symDiv=document.getElementById('seq-symbols');
  if(!symDiv) return;
  // Display ORIGINAL order for memorization
  let display=G.seqEcho?G.seqSolOriginal:G.seqSol;
  // Chaos: mostra ordem embaralhada (jogador precisa descobrir a certa)
  if(G.seqModifier==='chaos' && G._seqDisplayOrder){
    display=G._seqDisplayOrder;
  }
  // Shadow: alguns símbolos escurecidos
  const shadowCount = G.seqModifier==='shadow' ? Math.ceil(G.seqLen/3) : 0;
  const shadowIdx = shadowCount>0 ? new Set() : null;
  if(shadowCount>0){
    while(shadowIdx.size<shadowCount) shadowIdx.add(Math.floor(Math.random()*G.seqLen));
  }
  // Wind: classe para animação de movimento
  const windClass = G.seqModifier==='wind' ? ' ssym-wind' : '';
  symDiv.innerHTML=display.map((g,i)=>{
    const isShadow = shadowIdx && shadowIdx.has(i);
    return `<div class="ssym${windClass}${isShadow?' ssym-shadow':''}" style="animation:dropIn .3s ease ${i*.08}s both">${g}</div>`;
  }).join('');

  if(seqShowTimer) clearTimeout(seqShowTimer);
  seqTimerRunning=true;
  // Ancient: tempo de exibição reduzido em 50%
  let showTime=G.seqShowTime;
  if(G.seqModifier==='ancient') showTime*=0.5;
  let remaining=showTime;
  const timerEl=document.getElementById('seq-timer');

  const startMs=Date.now();
  const tick=setInterval(()=>{
    if(epoch!==window.modalEpoch||!modalOpen||!document.getElementById("seq-symbols")||window.seqResolved){clearInterval(tick);return;}
    const elapsed=(Date.now()-startMs)/1000;
    remaining=Math.max(0, showTime-elapsed);
    if(timerEl) timerEl.textContent=`Memorize: ${remaining.toFixed(1)}s`;
    if(remaining<=0){
      clearInterval(tick);
      seqTimerRunning=false;
      if(symDiv) symDiv.innerHTML=display.map(g=>`<div class="ssym" style="opacity:0.2;pointer-events:none">◇</div>`).join('');
      if(timerEl) timerEl.textContent=G.seqEcho?'🔄 Inverta e repita agora:':'Sequência escondida! Repita:';
      // Inicia timer de repetição
      startRepeatTimer();
    }
  },100);
}

function startRepeatTimer(){
 const epoch=window.modalEpoch;
  const timerEl=document.getElementById('seq-timer');
  let remaining=G.seqTimerMax;
  const startMs=Date.now();
  const tick=setInterval(()=>{
    if(epoch!==window.modalEpoch||!modalOpen||!document.getElementById("seq-symbols")||window.seqResolved){clearInterval(tick);return;}
    const elapsed=(Date.now()-startMs)/1000;
    remaining=Math.max(0, G.seqTimerMax-elapsed);
    if(timerEl) timerEl.textContent=`Repita: ${remaining.toFixed(1)}s`;
    if(remaining<=0){
      clearInterval(tick);
      // Tempo esgotado = falha
      if(G.seqProg<G.seqSol.length){
        const h=document.getElementById('seq-hint');
        if(h){h.textContent='⏰ Tempo esgotado!';h.style.color='#e84050';}
        SFX.fail();
        window.seqResolved=true;window.rollBusy=true;
        setTimeout(()=>{onFail();window.rollBusy=false;closeModal();checkPhaseShift();checkAchievements();},500);
      }
    }
  },100);
  G._seqRepeatInterval=tick;
}

function renderSeq(){
  const symDiv=document.getElementById('seq-symbols');
  const btnDiv=document.getElementById('seq-btns');
  const prog=document.getElementById('seq-progress-display');
  if(!symDiv||!btnDiv) return;

  if(!seqTimerRunning){
    symDiv.innerHTML=G.seqSol.map((g,i)=>{
      const cls=i<G.seqProg?'ssym hit':'ssym';
      return `<div class="${cls}">${g}</div>`;
    }).join('');
  }

  if(prog) prog.textContent=`${G.seqProg} / ${G.seqSol.length}`;

  const pool=[...new Set(G.seqSol)];
  while(pool.length<4){
    const g=RUNES[Math.floor(Math.random()*RUNES.length)].glyph;
    if(!pool.includes(g)) pool.push(g);
  }
  pool.sort(()=>Math.random()-.5);

  btnDiv.innerHTML=pool.map(g=>
    `<button class="sbtn" onclick="seqClick('${g}')">${g}</button>`
  ).join('');

  const h=document.getElementById('seq-hint');
  if(h) h.textContent='';
}

function seqClick(glyph){
 if(window.seqResolved||seqTimerRunning||!modalOpen)return;
  if(G.seqProg>=G.seqSol.length) return;
  if(glyph===G.seqSol[G.seqProg]){
    G.seqProg++;
    renderSeq();
    if(G.seqProg>=G.seqSol.length){
      const h=document.getElementById('seq-hint');
      if(h){h.textContent=G.seqEcho?'🌟 ECHO Completo! +50%':'🌟 Sequência completa!';h.style.color='#f0c040';}
      SFX.perfect();
      if(G._seqRepeatInterval){clearInterval(G._seqRepeatInterval);G._seqRepeatInterval=null;}
      const mechanic='seq';
      if(G.lastMechanic&&G.lastMechanic!==mechanic){
        G.combo++;
        if(G.combo>G.bestCombo) G.bestCombo=G.combo;
        if(G.combo>=2) spawnFloat('🎨 Combo ×'+(G.combo+1)+'!','#aa44ff',0);
      } else {
        G.combo=0;
      }
      G.lastMechanic=mechanic;
      const stabBonus=G.seqEcho?3:2;
      window.seqResolved=true;window.rollBusy=true;
      setTimeout(()=>{onSuccess('seq','perfect',stabBonus);window.rollBusy=false;closeModal();checkPhaseShift();checkAchievements();},480);
    }
  } else {
    // Divine: uma tentativa extra
    if(G.seqModifier==='divine' && !G._seqDivineRetry){
      G._seqDivineRetry=true;
      const h=document.getElementById('seq-hint');
      if(h){h.textContent='✨ Divine te salvou! Tente novamente.';h.style.color='#ff44ff';}
      SFX.power();
      G.seqProg=0;
      renderSeq();
      return;
    }
    const h=document.getElementById('seq-hint');
    if(h){h.textContent='❌ Errado!';h.style.color='#e84050';}
    document.querySelectorAll('#seq-symbols .ssym').forEach(e=>e.classList.add('miss'));
    SFX.fail();
    G.seqProg=0;
    if(G._seqRepeatInterval){clearInterval(G._seqRepeatInterval);G._seqRepeatInterval=null;}
    window.seqResolved=true;window.rollBusy=true;
    setTimeout(()=>{onFail();window.rollBusy=false;closeModal();checkPhaseShift();checkAchievements();},580);
  }
}

/* ════════════════════════════════════════
   PHASE SHIFT
════════════════════════════════════════ */

/* Combo de sorte (acertos consecutivos): 1→x1, 3→x1.2, 5→x1.5, 10→x2, 20→x3 */
function getLuckComboMult(){
  const s=G.luckCombo;
  if(s>=20) return 3.0;
  if(s>=10) return 2.0;
  if(s>=5)  return 1.5;
  if(s>=3)  return 1.2;
  return 1.0;
}
function getLuckComboLabel(){
  const s=G.luckCombo;
  if(s>=20) return 'x3.0 🔥🔥';
  if(s>=10) return 'x2.0 🔥';
  if(s>=5)  return 'x1.5 ⚡';
  if(s>=3)  return 'x1.2 ⚡';
  return 'x1.0';
}

/* ════════════════════════════════════════
   SUCCESS
════════════════════════════════════════ */

/* ════════════════════════════════════════
   FAIL
════════════════════════════════════════ */

/* Estado crítico — abre overlay com 3 desafios de recuperação */

function startCriticalRecovery(type){
  document.getElementById('critical-overlay').classList.remove('show');
  document.body.classList.remove('critical-shake');
  if(type==='timing') criticalTiming();
  else if(type==='seq') criticalSeq();
  else if(type==='balance') criticalBalance();
}

/* Recuperação via Timing simplificado */
function criticalTiming(){
  openModal(`
    <h2>⏱️ Salve o Totem!</h2>
    <p class="msub">Pare o cursor na zona verde!</p>
    <div class="timing-stone-frame"><div class="timing-inscription" aria-hidden="true">ᚱ · ᚠ · ᚨ</div><div id="timing-track">
      <div id="t-green"></div>
      <div id="t-perfect"></div>
      <div id="t-cursor" style="left:0%"><i class="sword-blade"></i><i class="sword-guard"></i><i class="sword-grip"></i></div>
    </div>
    <div class="timing-embers" aria-hidden="true"></div></div><div id="timing-hint">Pressione na zona verde!</div>
    <button class="upg-buy" style="width:100%;padding:13px;" onclick="execCriticalTiming()">🔨 Salvar!</button>
  `);
  // Verde maior para recuperação
  const gW=22; const gL=10+Math.random()*(68-gW);
  const pW=8; const pL=gL+(gW-pW)/2;
  setTimeout(()=>{
    const g=document.getElementById('t-green');
    const p=document.getElementById('t-perfect');
    if(g){g.style.left=gL+'%';g.style.width=gW+'%';}
    if(p){p.style.left=pL+'%';p.style.width=pW+'%';}
    G._critZones={gL,gL2:gL+gW,pL,pL2:pL+pW};
  },50);
  tRunning=true;
}

function execCriticalTiming(){
  tRunning=false;
  const z=G._critZones||{};
  let ok=false;
  if(tPos>=z.gL&&tPos<=z.gL2){ok=true;}
  if(tPos>=z.pL&&tPos<=z.pL2){ok=true;}
  if(ok){
    recoverCritical();
  } else {
    failCritical();
  }
  setTimeout(()=>{closeModal();},500);
}

/* Recuperação via Sequência curta (3 símbolos) */
function criticalSeq(){
  const seq=Array.from({length:3},()=>RUNES[Math.floor(Math.random()*RUNES.length)].glyph);
  G._critSeq=seq;G._critSeqProg=0;
  openModal(`
    <h2>🔮 Salve o Totem!</h2>
    <p class="msub">Memorize e repita: <strong>${seq.join(' ')}</strong></p>
    <div id="seq-symbols">${seq.map(g=>`<div class="ssym">${g}</div>`).join('')}</div>
    <div id="seq-progress-display">0 / 3</div>
    <div id="seq-btns"></div>
    <div id="seq-hint"></div>
    <button class="modal-close" onclick="closeModal();failCritical();">Desistir</button>
  `);
  const pool=[...new Set(seq)];
  while(pool.length<4){const g=RUNES[Math.floor(Math.random()*RUNES.length)].glyph;if(!pool.includes(g))pool.push(g);}
  pool.sort(()=>Math.random()-.5);
  document.getElementById('seq-btns').innerHTML=pool.map(g=>`<button class="sbtn" onclick="critSeqClick('${g}')">${g}</button>`).join('');
}

function critSeqClick(g){
  if(g===G._critSeq[G._critSeqProg]){
    G._critSeqProg++;
    document.getElementById('seq-progress-display').textContent=G._critSeqProg+' / 3';
    document.querySelectorAll('#seq-symbols .ssym')[G._critSeqProg-1].classList.add('hit');
    if(G._critSeqProg>=3){
      setTimeout(()=>{closeModal();recoverCritical();},400);
    }
  } else {
    document.querySelectorAll('#seq-symbols .ssym').forEach(e=>e.classList.add('miss'));
    setTimeout(()=>{closeModal();failCritical();},500);
  }
}

/* Recuperação via Equilíbrio (toques laterais) */
function criticalBalance(){
  const sequence=[];
  for(let i=0;i<5;i++) sequence.push(Math.random()<.5?'L':'R');
  G._critBalance=sequence;G._critBalanceProg=0;
  openModal(`
    <h2>⚖️ Salve o Totem!</h2>
    <p class="msub">Toque o lado que apareceu! Sequência: ${sequence.length}</p>
    <div id="balance-display" style="font-size:2em;color:var(--gold);margin:12px 0;min-height:60px;">Prepare-se...</div>
    <div id="balance-progress">0 / ${sequence.length}</div>
    <div style="display:flex;gap:12px;justify-content:center;margin-top:14px;">
      <button class="sbtn" style="width:80px;height:80px;font-size:1.4em;" onclick="critBalanceClick('L')">⬅️</button>
      <button class="sbtn" style="width:80px;height:80px;font-size:1.4em;" onclick="critBalanceClick('R')">➡️</button>
    </div>
    <button class="modal-close" onclick="closeModal();failCritical();">Desistir</button>
  `);
  let idx=0;
  const showNext=()=>{
    if(idx>=sequence.length){
      setTimeout(()=>{closeModal();recoverCritical();},400);
      return;
    }
    const d=document.getElementById('balance-display');
    if(d) d.textContent=sequence[idx]==='L'?'⬅️ ESQUERDA':'➡️ DIREITA';
    idx++;
  };
  G._critBalanceShow=showNext;
  setTimeout(showNext,800);
}

function critBalanceClick(side){
  const expected=G._critBalance[G._critBalanceProg];
  if(side===expected){
    G._critBalanceProg++;
    document.getElementById('balance-progress').textContent=G._critBalanceProg+' / '+G._critBalance.length;
    G._critBalanceShow();
  } else {
    setTimeout(()=>{closeModal();failCritical();},400);
  }
}

/* Sucesso: torre volta com 50% */
function recoverCritical(){
  G._inCritical=false;
  G.stab=Math.round(Math.max(G.stab, Math.ceil(G.maxStab*0.50)));
  G.totemsSaved=(G.totemsSaved||0)+1;
  G.coins+=30;G.totalCoins+=30;
  SFX.recover();
  showEventToast('✅ TOTEM SALVO! +50% ⚖️ +30💰');
  addLog('✅ Totem salvo! +50% ⚖️ +30💰','s');
  spawnFloat('+50% ⚖️','#3de87a');
  updateHUD();saveGame();
}

/* Falha: torre cai */
function failCritical(){
  G._inCritical=false;
  SFX.death();
  gameOver();
}

/* ════════════════════════════════════════
   TILT
════════════════════════════════════════ */
let curTiltDeg=0;
const towerMotion={target:0,amplitude:0,angle:0,phase:0,last:0,started:false};
function towerSwayAmplitude(ratio){return ratio>=.7?0:ratio<=0?0:Math.min(4.8,Math.pow((.7-ratio)/.7,1.25)*5.5);}
/* Balanço por Ameaça: mesma curva suave do sistema de queda, mas acompanhando os
   pontos de Ameaça a cada 10 (10,20,30...90), até o teto normal de 4.8°.
   A partir de 91% (Boss a caminho) o aviso sobe de patamar — não trava mais:
   91-94% sobe para um nível mais forte, e 95%+ sobe de novo, mais forte ainda. */
const BOSS_WARNING_TIER1=7.7; // 91-94%: chegada do Guardião
const BOSS_WARNING_TIER2=8.7; // 95%+: chegada iminente
function threatSwayAmplitude(threat){
 const t=Math.min(90,Math.max(0,threat||0));
 if(t<10)return 0;
 return Math.min(4.8,Math.pow(t/90,1.25)*5.5);
}
function applyTilt(){
 const stabSway=towerSwayAmplitude(G.stab/Math.max(1,G.maxStab));
 let threatSway=threatSwayAmplitude(G.threat);
 if(!G.bossActive){
  if(G.threat>=95)threatSway=BOSS_WARNING_TIER2;
  else if(G.threat>=91)threatSway=BOSS_WARNING_TIER1;
 }
 towerMotion.target=Math.max(stabSway,threatSway);
 if(!towerMotion.started){towerMotion.started=true;requestAnimationFrame(animateTowerMotion);}
}
function animateTowerMotion(now){
 const m=towerMotion,dt=m.last?Math.min(.05,Math.max(0,(now-m.last)/1000)):0;m.last=now;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const active=curScreen==='game'&&!document.hidden&&!reduced;
 const target=active?m.target:0;
 m.amplitude+=(target-m.amplitude)*(1-Math.exp(-dt*2.2));
 // One continuous pendulum; changing stability does not restart its phase.
 m.phase+=dt*2*Math.PI/4.8;
 const angle=Math.sin(m.phase)*m.amplitude;
 m.angle+=(angle-m.angle)*(1-Math.exp(-dt*7));curTiltDeg=m.angle;
 const normal=document.getElementById('totem-tilt'),boss=document.getElementById('boss-tower');
 if(normal)normal.style.transform='rotate('+m.angle.toFixed(3)+'deg)';
 if(boss)boss.style.transform='translateX(-50%) rotate('+m.angle.toFixed(3)+'deg)';
 requestAnimationFrame(animateTowerMotion);
}

/* ════════════════════════════════════════
   STREAK AURA & STAB WARNING
════════════════════════════════════════ */
function updateStreakAura(){
  const tt=document.getElementById('totem-tilt');
  tt.classList.remove('streak-aura','streak-aura-high');
  if(G.streak>=10) tt.classList.add('streak-aura-high');
  else if(G.streak>=5) tt.classList.add('streak-aura');
}

function startStabCheckLoop(){
 if(startStabCheckLoop.started)return; startStabCheckLoop.started=true;
  setInterval(()=>{
    const row=document.getElementById('stab-row');
    if(!row) return;
    if(G.stab>0 && G.stab/G.maxStab<0.25){
      row.classList.add('danger');
    } else {
      row.classList.remove('danger');
    }
  },500);
}

function updateComboDisplay(){
  const el=document.getElementById('combo-display');
  if(!el) return;
  let txt='';
  if(G.luckCombo>=3) txt='🍀 Sorte '+getLuckComboLabel()+' ('+G.luckCombo+' acertos)';
  if(G.combo>=2) txt+='  🎨 Multi ×'+(G.combo+1);
  el.textContent=txt;
}

/* ════════════════════════════════════════
   BOSS
════════════════════════════════════════ */

function updateBossUIBase1(){
  const strip=document.getElementById('boss-strip');
  if(!strip) return;
  strip.style.display=G.bossActive?'block':'none';
  if(G.bossActive){
    const boss=BOSSES[G.bossIdx%BOSSES.length];
    document.getElementById('boss-name').textContent=boss.name+' • '+Math.max(0,G.bossHp).toFixed(1)+' / '+G.bossMaxHp.toFixed(1)+' HP';
    const pct=Math.max(0,(G.bossHp/G.bossMaxHp)*100);
    document.getElementById('boss-hp-fill').style.width=pct+'%';
  }
}

function spawnBossParticles(){
  for(let i=0;i<25;i++){
    const p=document.createElement('div');
    const colors=['#f0c040','#aa44ff','#3de87a','#ff8833'];
    const color=colors[i%colors.length];
    p.style.cssText=`position:fixed;left:50vw;top:50vh;width:8px;height:8px;border-radius:50%;
      background:${color};pointer-events:none;z-index:250;box-shadow:0 0 10px ${color};`;
    document.body.appendChild(p);
    const angle=Math.random()*Math.PI*2;
    const dist=80+Math.random()*120;
    p.animate([
      {transform:'translate(0,0) scale(1)',opacity:1},
      {transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) scale(0)`,opacity:0}
    ],{duration:1000,easing:'cubic-bezier(.22,.68,0,1)'}).onfinish=()=>p.remove();
  }
}

/* ════════════════════════════════════════
   PIECE SELECTION & VISUAL
════════════════════════════════════════ */

/* ════════════════════════════════════════
   UTILITIES
════════════════════════════════════════ */
function rnd(max){return Math.floor(Math.random()*max)+1;}

function addResource(id,amt){
  /* resources (wood/stone/crystal/goldR) removed — progression uses coins (Gold) + essence */
}

function spawnFloat(txt,col,offsetX=0){
  const float=document.createElement('div');
  float.className='float-text';
  float.textContent=txt;
  float.style.color=col;
  float.style.left=(50+offsetX)+'vw';
  float.style.top='50vh';
  float.style.fontSize='1.1em';
  document.body.appendChild(float);
  setTimeout(()=>float.remove(),1200);
}

function showEventToast(msg){
  const toast=document.getElementById('evt-toast');
  if(!toast) return;
  toast.textContent=msg;
  toast.classList.add('on');
  setTimeout(()=>toast.classList.remove('on'),2500);
}

function notify(msg){
  const notif=document.getElementById('notif');
  if(!notif) return;
  const item=document.createElement('div');
  item.className='notif-item';
  item.textContent=msg;
  notif.appendChild(item);
  setTimeout(()=>{item.style.opacity='0';setTimeout(()=>item.remove(),300);},3500);
}

function bumpHUD(id){
  const el=document.getElementById(id);
  if(!el) return;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

function updateStreakDisplay(){
  const el=document.getElementById('streak-display');
  if(!el) return;
  if(G.streak>0) el.textContent='🔥 '+G.streak+' seguidos';
  else el.textContent='';
}

function updateHUDBase1(){
 updateJourney();
  refreshTiersForHeight(G.height);
  document.getElementById('hud-coins').textContent=G.coins;
  document.getElementById('hud-height').textContent=G.height;
  const hw=document.getElementById('hud-wood');      if(hw) hw.textContent=(G.wood||0);
  const hs=document.getElementById('hud-stone');    if(hs) hs.textContent=(G.stone||0);
  /* hud gold removed */
  const hc=document.getElementById('hud-crystal');  if(hc) hc.textContent=(G.crystal||0);
  const he=document.getElementById('hud-essence');  if(he) he.textContent=G.divineEssence||0;
  document.getElementById('stab-num').textContent=G.stab;
  document.getElementById('stab-max').textContent=G.maxStab;
  const stabPct=(G.stab/G.maxStab)*100;
  const stabFill=document.getElementById('stab-fill');
  stabFill.style.width=stabPct+'%';
  stabFill.style.background=stabPct>50?'linear-gradient(90deg,#3de87a,#2ab860)':
    stabPct>25?'linear-gradient(90deg,#f0c040,#c8980a)':'linear-gradient(90deg,#e84050,#a00020)';
  
  const hb=document.getElementById('hb-num');
  const ht=document.getElementById('hb-tier');
  if(hb) hb.textContent=G.height;
  if(ht){
    const tierIdx=TIERS.reduce((best,t,i)=>G.height>=t.h?i:best,-1);
    const tier=TIERS[Math.max(0,tierIdx)];
    const next=TIERS[tierIdx+1];
    if(next){
      const pct=Math.min(100,Math.floor((G.height-tier.h)/(next.h-tier.h)*100));
      ht.innerHTML=`${tier.label} <span style="color:var(--muted);font-size:.85em">${pct}% → ${next.label}</span>`;
    } else {
      ht.textContent=tier.label+' ✦ MAX';
    }
  }
  
  updatePowerUI();
  updateActionButton();
  updateTierBackground();
}

let _lastTierIdx=-1;

/* ════════════════════════════════════════
   MILESTONES & PRESTIGE
════════════════════════════════════════ */
function checkMilestones(){
  const m=MILESTONES.find(x=>G.height>=x.h && (G._lastMilestoneH||0)<x.h);
  if(m){
    G._lastMilestoneH=m.h;
    const pop=document.getElementById('milestone-pop');
    if(pop){
      document.getElementById('ms-title').textContent=m.t;
      document.getElementById('ms-sub').textContent=m.s;
      pop.classList.add('show');
      setTimeout(()=>pop.classList.remove('show'),3000);
      SFX.milestone();
      // Milestone particles
      for(let i=0;i<20;i++){
        const p=document.createElement('div');
        p.style.cssText=`position:fixed;left:50vw;top:50vh;width:6px;height:6px;border-radius:50%;
          background:#f0c040;pointer-events:none;z-index:250;box-shadow:0 0 8px #f0c040;`;
        document.body.appendChild(p);
        const angle=Math.random()*Math.PI*2;
        const dist=60+Math.random()*80;
        p.animate([
          {transform:'translate(0,0) scale(1)',opacity:1},
          {transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) scale(0)`,opacity:0}
        ],{duration:900,easing:'cubic-bezier(.22,.68,0,1)'}).onfinish=()=>p.remove();
      }
    }
    addLog(m.t+' '+m.s,'a');
  }
}

function checkPresBtn(){
  const btn=document.getElementById('prestige-btn');
  if(!btn) return;
  btn.disabled=G.height<20;
  const infoEl=null; /* prestige removed */
  if(infoEl){
    const ess=Math.floor(G.height/50 * (G._progEssenceMult||1))+((G.buildings||{}) && (G.buildings||{}).sanctum?1:0);
    infoEl.innerHTML=`
      <div style="font-size:1.1em;font-weight:900;margin-bottom:6px;">✨ Essência Divina: ${G.divineEssence||0}</div>
      <div style="font-size:.95em;">Ao renascer agora: <strong style="color:#fff;">+${ess} ✨</strong></div>
      <div style="font-size:.85em;margin-top:4px;">Bônus de moedas atual: <strong style="color:var(--gold);">×${G.presBonus.toFixed(2)}</strong></div>
      <div style="font-size:.85em;">Dificuldade atual: <strong style="color:var(--red);">+${Math.round(((G.prestigeDifficulty||1)-1)*100)}%</strong></div>
      <div style="font-size:.75em;margin-top:6px;color:var(--muted);border-top:1px solid rgba(170,68,255,.3);padding-top:6px;line-height:1.5;">
        📌 <strong>O que é Prestígio?</strong><br>
        Reseta altura/recursos da partida atual, mas mantém <strong>relíquias, construções e conquistas</strong>.<br>
        Cada prestígio: <strong>+10% moedas permanentes</strong>, <strong>+15% dificuldade</strong>, e ganha <strong>Essência Divina</strong>.<br>
        ✨ Essência: <strong>+10% moedas</strong> por unidade, usada para <strong>reviver</strong> ao morrer.
      </div>
    `;
  }
}

function doPrestigeBase1(){ /* removed */ }

function applyRelicBuildEffects(){return; /* removed */
  if((G.buildings||{}) && (G.buildings||{}).tower) G.maxStab+=(G.buildings||{}).tower*25;
}

function getReviveEssenceCost(){
  // 1, 2, 4, 8, 16... (cada vez mais caro)
  return Math.pow(2, G.reviveCount||0);
}
function getReviveGoldCost(){
  const costs=[10000,50000,250000,1000000,5000000];
  const idx=Math.min(G.reviveCount||0, costs.length-1);
  return costs[idx];
}
function formatGold(n){
  if(n>=1000000) return (n/1000000).toFixed(n%1000000===0?0:1)+'M';
  if(n>=1000) return (n/1000).toFixed(n%1000===0?0:1)+'k';
  return n.toString();
}

function reviveGame(){
  SFX.revive();
  updateRanking(getPlayerName(), G.bestHeight, 0, G.bossDefeated.length);
  renderRanking();
  // Estabilidade volta em 50%
  G.stab=Math.ceil(G.maxStab*0.50);
  G._inCritical=false;
  G.luckCombo=0;
  G.streak=0;
  G.combo=0;
  const wasBossActive=G.bossActive;
  G.bossActive=false;
  document.getElementById('go-overlay').classList.remove('show');
  document.getElementById('critical-overlay').classList.remove('show');
  document.body.classList.remove('critical-shake');
  // Se estava em boss, boss volta com vida cheia
  if(wasBossActive && G.bossIdx!==undefined && G.bossDefeated && G.bossDefeated.length< (BOSSES.length*10)){
    const boss=BOSSES[G.bossIdx%BOSSES.length];
    if(boss){
      G.bossActive=true;
      G.bossHp=boss.hp;
      G.bossMaxHp=boss.hp;
      updateBossUI();
      showEventToast('🐉 '+boss.name+' voltou com vida cheia!');
      addLog('🐉 Boss retornou com vida cheia!','e');
    }
  }
  updateBossUI();
  updateHUD();
  showEventToast('✨ Renascido! Estabilidade em 50%');
  addLog('✨ Renascido com Essência/Ouro!','e');
  saveGame();
}

/* ════════════════════════════════════════
   UPGRADES
════════════════════════════════════════ */
let currentShopTab='perm';

function renderShopTab(tab){
  const body=document.getElementById('upg-body');
  if(!body) return;
  document.getElementById('upg-coins').textContent=G.coins;
  currentShopTab=tab;
  document.querySelectorAll('.shop-tab').forEach(t=>t.classList.remove('active'));
  const tabEl=document.getElementById('shop-tab-'+tab);
  if(tabEl) tabEl.classList.add('active');
  if(tab==='perm')   body.innerHTML=UPGRADES.map(u=>renderUpgradeCard(u)).join('');
  else if(tab==='build') body.innerHTML=BUILDINGS.map(b=>renderBuildingCard(b)).join('');
  else if(tab==='relic') body.innerHTML=RELICS.map((r,i)=>renderRelicCard(r,i)).join('');
}

function resIcon(id){return {wood:'🪵',stone:'🪨',goldR:'🪙',crystal:'💎'}[id]||'';}
function resName(id){return {wood:'Madeira',stone:'Pedra',goldR:'Ouro',crystal:'Cristal'}[id]||id;}

function canPayCost(coinsCost,resCost){
  if(G.coins<coinsCost) return false;
  if(resCost){
    for(const k in resCost){
      if((G[k]||0)<resCost[k]) return false;
    }
  }
  return true;
}

function renderCostLines(coinsCost,resCost){
  let html='';
  const haveCoins=G.coins>=coinsCost;
  html+=`<div class="cost-line ${haveCoins?'ok':'no'}"><span class="cost-ic">💰</span><span class="cost-nm">Moeda</span><span class="cost-need">${coinsCost}</span><span class="cost-have">${haveCoins?'✓':'✗ '+G.coins}</span></div>`;
  if(resCost){
    for(const k in resCost){
      const have=(G[k]||0)>=resCost[k];
      html+=`<div class="cost-line ${have?'ok':'no'}"><span class="cost-ic">${resIcon(k)}</span><span class="cost-nm">${resName(k)}</span><span class="cost-need">${resCost[k]}</span><span class="cost-have">${have?'✓':'✗ '+(G[k]||0)}</span></div>`;
    }
  }
  return `<div class="cost-block">${html}</div>`;
}

function renderUpgradeCard(u){
  const lv=upLv(u.id);
  const coinsCost=Math.ceil(u.base*Math.pow(u.mult,lv));
  const resCost=u.costRes||{};
  const maxed=lv>=u.maxLv;
  const canBuy=!maxed && canPayCost(coinsCost,resCost);
  return `
    <div class="upg-card">
      <div class="upg-icon">${u.icon}</div>
      <div class="upg-info">
        <div class="upg-name">${u.name} <span class="upg-lv">Nv ${lv}/${u.maxLv}</span></div>
        <div class="upg-desc">${u.desc}</div>
        ${maxed?'<div class="upg-maxed">★ MAXIMIZADO ★</div>':renderCostLines(coinsCost,resCost)}
      </div>
      <button class="upg-buy ${maxed?'maxed':''}" ${canBuy?'':'disabled'} onclick="buyUpg('${u.id}')">${maxed?'✓':'Comprar'}</button>
    </div>
  `;
}

function renderBuildingCard(b){
  const owned=(G.buildings||{})[b.id]||0;
  const maxed=owned>=b.max;
  const canBuy=!maxed && canPayCost(0,b.cost);
  return `
    <div class="upg-card">
      <div class="upg-icon">${b.icon}</div>
      <div class="upg-info">
        <div class="upg-name">${b.name} <span class="upg-lv">${owned}/${b.max}</span></div>
        <div class="upg-desc">${b.desc}</div>
        ${maxed?'<div class="upg-maxed">★ MÁXIMO ★</div>':renderCostLines(0,b.cost)}
      </div>
      <button class="upg-buy ${maxed?'maxed':''}" ${canBuy?'':'disabled'} onclick="buyBuilding('${b.id}')">${maxed?'✓':'Construir'}</button>
    </div>
  `;
}

function renderRelicCard(r, idx){
  const owned=(G.relics||{})[r.id]||false;
  const reqH=getRelicUnlockHeight(idx);
  const reqMet=G.bestHeight>=reqH;
  const canBuy=!owned && reqMet && canPayCost(0,r.cost);
  return `
    <div class="upg-card relic-card ${owned?'owned':''} ${!reqMet?'locked':''}">
      <div class="upg-icon">${r.icon}</div>
      <div class="upg-info">
        <div class="upg-name">${r.name} ${owned?'<span class="upg-lv owned">✓ EQUIPADA</span>':''}</div>
        <div class="upg-desc">${r.desc}</div>
        ${!reqMet?`<div class="relic-locked">🔒 Requer altura ${reqH} (recorde: ${G.bestHeight})</div>`:(owned?'<div class="upg-maxed">★ ADQUIRIDA ★</div>':renderCostLines(0,r.cost))}
      </div>
      <button class="upg-buy ${owned?'maxed':''}" ${canBuy?'':'disabled'} onclick="buyRelic('${r.id}')">${owned?'✓':(reqMet?'Comprar':'🔒')}</button>
    </div>
  `;
}

function payCost(coinsCost,resCost){
  G.coins-=coinsCost;
  if(resCost){
    for(const k in resCost){
      G[k]=(G[k]||0)-resCost[k];
    }
  }
}

function buyUpg(id){
  const u=UPGRADES.find(x=>x.id===id);
  if(!u) return;
  const lv=upLv(id);
  if(lv>=u.maxLv) return;
  const coinsCost=Math.ceil(u.base*Math.pow(u.mult,lv));
  const resCost=u.costRes||{};
  if(!canPayCost(coinsCost,resCost)){notify('❌ Recursos insuficientes!');return;}
  payCost(coinsCost,resCost);
  G.upgrades[id]=(G.upgrades[id]||0)+1;
  if(id==='shield') G.maxStab+=20;
  if(id==='zone') G.tGreenW+=5;
  applyUpgFx();
  renderUpgrades();
  updateHUD();
  saveGame();
  SFX.buy();
  notify('✅ '+u.name+' melhorado para Nv '+G.upgrades[id]+'!');
}

function buyBuilding(id){
  const b=BUILDINGS.find(x=>x.id===id);
  if(!b) return;
  const owned=(G.buildings||{})[id]||0;
  if(owned>=b.max) return;
  if(!canPayCost(0,b.cost)){notify('❌ Recursos insuficientes!');return;}
  payCost(0,b.cost);
  (G.buildings||{})[id]=owned+1;
  if(id==='tower') G.maxStab+=25;
  applyUpgFx();
  renderUpgrades();
  updateHUD();
  saveGame();
  SFX.buy();
  notify('🏰 '+b.name+' construída! ('+(owned+1)+'/'+b.max+')');
}

function buyRelic(id){
  const r=RELICS.find(x=>x.id===id);
  if(!r) return;
  const idx=RELICS.findIndex(x=>x.id===id);
  if((G.relics||{})[id]) return;
  const reqH=getRelicUnlockHeight(idx);
  if(G.bestHeight<reqH){notify('🔒 Requer altura '+reqH+'!');return;}
  if(!canPayCost(0,r.cost)){notify('❌ Cristal insuficiente!');return;}
  payCost(0,r.cost);
  (G.relics||{})[id]=true;
  applyUpgFx();
  renderUpgrades();
  updateHUD();
  saveGame();
  SFX.buy();
  notify('✨ '+r.name+' adquirida!');
  addLog('✨ Relíquia equipada: '+r.name,'a');
}

function applyUpgFx(){}

/* ════════════════════════════════════════
   ACHIEVEMENTS
════════════════════════════════════════ */
function countAchievements(){
  return ACHIEVEMENTS.filter(a=>G.achievements[a.id]).length;
}

function checkAchievements(){
  let unlocked=false;
  ACHIEVEMENTS.forEach(a=>{
    if(!G.achievements[a.id]&&a.check()){
      G.achievements[a.id]=true;
      unlocked=true;
      notify('🏆 Conquista: '+a.name+'!');
      addLog('🏆 Conquista desbloqueada: '+a.name,'a');
      SFX.achievement();
      // Achievement particles
      for(let i=0;i<12;i++){
        const p=document.createElement('div');
        p.style.cssText=`position:fixed;left:50vw;top:50vh;width:7px;height:7px;border-radius:50%;
          background:#f0c040;pointer-events:none;z-index:250;box-shadow:0 0 8px #f0c040;`;
        document.body.appendChild(p);
        const angle=Math.random()*Math.PI*2;
        const dist=70+Math.random()*70;
        p.animate([
          {transform:'translate(0,0) scale(1)',opacity:1},
          {transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) scale(0)`,opacity:0}
        ],{duration:800,easing:'cubic-bezier(.22,.68,0,1)'}).onfinish=()=>p.remove();
      }
    }
  });
  if(unlocked){
    saveGame();
    if(curScreen==='achievements') renderAchievements();
  }
}

function renderAchievements(){
  const body=document.getElementById('ach-body');
  if(!body) return;
  const unlocked=countAchievements();
  document.getElementById('ach-counter').textContent=unlocked+'/'+ACHIEVEMENTS.length;
  
  body.innerHTML=ACHIEVEMENTS.map(a=>{
    const got=G.achievements[a.id];
    return `
      <div class="ach-card ${got?'unlocked':''}">
        <div class="ach-icon">${a.icon}</div>
        <div class="ach-info">
          <div class="ach-name">${a.name}</div>
          <div class="ach-desc">${a.desc}</div>
        </div>
        <div class="ach-status ${got?'':'locked'}">${got?'✓':'🔒'}</div>
      </div>
    `;
  }).join('');
}

/* ════════════════════════════════════════
   AUTO & EVENT LOOPS
════════════════════════════════════════ */
function startAutoLoop(){
 if(startAutoLoop.started)return; startAutoLoop.started=true;
  setInterval(()=>{
    if(curScreen!=='game') return;
    if(G.stab<=0) return;
    const autolv=upLv('auto');
    if(autolv>0&&Math.random()<autolv*0.15){
      handleAction();
    }
  },2000);
}

function startEventLoop(){}

/* ════════════════════════════════════════
   STATS & LOG
════════════════════════════════════════ */

let gameLog=[];
let _logBuffer=[];
let _logBufferAction=-1;
function addLog(msg,type='',context=null){
  const category=context||(G.bossActive?'boss':G.eventId?'event':'partida');
  const action=G.actionIndex||0;
  // Agrupa linhas da mesma jogada no buffer; flushes quando muda de ação
  if(_logBuffer.length && action!==_logBufferAction){
    flushLogBuffer();
  }
  _logBufferAction=action;
  _logBuffer.push({msg,type:type||'',category});
}
function flushLogBuffer(){
  if(!_logBuffer.length)return;
  const cats=_logBuffer.map(l=>l.category);
  const category=cats.includes('boss')?'boss':cats.includes('event')?'event':'partida';
  const types=_logBuffer.map(l=>l.type).filter(Boolean);
  const type=types.includes('f')?'f':types.includes('s')?'s':types.includes('a')?'a':types.includes('e')?'e':'';
  const label=category==='boss'?'Boss':category==='event'?'Evento':'Partida';
  const lines=_logBuffer.map(l=>l.msg);
  gameLog.unshift({lines,type,category,label,action:_logBufferAction,ts:Date.now()});
  if(gameLog.length>800)gameLog.pop();
  _logBuffer=[];
  if(curScreen==='log') renderLog();
}
function addLogImmediate(msg,type='',context=null){
  flushLogBuffer();
  const category=context||(G.bossActive?'boss':G.eventId?'event':'partida');
  const label=category==='boss'?'Boss':category==='event'?'Evento':'Partida';
  gameLog.unshift({lines:[msg],type:type||'',category,label,action:G.actionIndex||0,ts:Date.now()});
  if(gameLog.length>800)gameLog.pop();
  if(curScreen==='log') renderLog();
}

function renderLog(){
  const body=document.getElementById('log-body');
  if(!body) return;
  flushLogBuffer();
  if(!gameLog.length){
    body.innerHTML='<p class="log-empty">Nenhum registro ainda. Jogue para gerar o histórico.</p>';
    return;
  }
  // Mais recentes em cima. Compatível com saves antigos (msg) e novos (lines).
  body.innerHTML=gameLog.map(e=>{
    let lines=[];
    if(Array.isArray(e.lines)&&e.lines.length){
      lines=e.lines.map(String);
    }else if(e.msg){
      lines=[String(e.msg)];
    }else{
      lines=['(entrada vazia)'];
    }
    const cat=e.category||'partida';
    const label=e.label||(cat==='boss'?'Boss':cat==='event'?'Evento':'Partida');
    const type=e.type||'';
    const linesHtml=lines.map(m=>'<div class="log-line">'+esc(m)+'</div>').join('');
    return '<article class="log-card log-'+esc(cat)+(type?' type-'+esc(type):'')+'">'
      +'<div class="log-tag">'+esc(label)+'</div>'
      +'<div class="log-lines">'+linesHtml+'</div>'
      +'</article>';
  }).join('');
}

function clearLog(){
  gameLog=[];
  _logBuffer=[];
  renderLog();
}

/* ════════════════════════════════════════
   SAVE/LOAD
════════════════════════════════════════ */
/* ════════════════════════════════════════
   INVENTORY
═══════════════════════════════════════ */

function setInventoryView(index,button){
 const body=document.getElementById('inv-body');if(!body)return;
 body.querySelectorAll('.inventory-tabs button').forEach(b=>b.classList.remove('active'));
 if(button)button.classList.add('active');
 const sections=[...body.querySelectorAll('.inv-section')];
 sections.forEach((heading,i)=>{
  let node=heading;const visible=i===index;
  while(node&&(!node.nextElementSibling||!node.nextElementSibling.classList.contains('inv-section'))){
   node.style.display=visible?'':'none';node=node.nextElementSibling;
   if(!node)break;
  }
 });
}

/* ════════════════════════════════════════
   CODEX / ENCICLOPÉDIA
═══════════════════════════════════════ */

function openInfoModal(){
  openModal(`
    <h2>ℹ️ Eventos & Sistemas</h2>
    <p class="msub">Tudo que você precisa saber para evoluir</p>
    <div style="text-align:left;font-size:.78em;line-height:1.6;max-height:60vh;overflow-y:auto;padding-right:8px;">
      <div style="color:var(--gold);font-weight:900;margin:8px 0 4px;">📊 Recursos</div>
      <div>🪵 <strong>Madeira</strong>: drops de peças Ember/Forest — upgrades básicos</div>
      <div>🪨 <strong>Pedra</strong>: drops de Stone/Water — melhorias médias</div>
      <div>🪙 <strong>Ouro</strong>: drops de Gold/Wind/Light — habilidades raras</div>
      <div>💎 <strong>Cristal</strong>: drops de Crystal/Shadow/Chaos/Ancient/Divine — itens lendários</div>
      <div>✨ <strong>Essência Divina</strong>: ganha no prestígio — +10% moedas por unidade, usada para reviver</div>

      <div style="color:var(--gold);font-weight:900;margin:12px 0 4px;">⭐ Prestígio</div>
      <div>Reseta altura/recursos da partida. <strong>Mantém</strong>: relíquias, construções, conquistas, essência.</div>
      <div>Cada prestígio: +10% moedas, +15% dificuldade, ganha Essência (1 a cada 50 altura).</div>

      <div style="color:var(--gold);font-weight:900;margin:12px 0 4px;">💀 Reviver</div>
      <div>Ao morrer, pode reviver com Essência (1→2→4→8) ou Ouro (10k→50k→250k→1M→5M).</div>
      <div>Estabilidade volta em 50%. Se estava em boss, ele retorna com vida cheia.</div>

      <div style="color:var(--gold);font-weight:900;margin:12px 0 4px;">🌀 Eventos Ambientais</div>
      <div>🌧️ <strong>Chuva</strong>: erros causam 2x dano</div>
      <div>💨 <strong>Vento</strong>: -2 estab por turno</div>
      <div>🌟 <strong>Bênção</strong>: 5 peças garantidas</div>
      <div>🌑 <strong>Eclipse</strong>: peças raras 3x mais frequentes</div>
      <div>🌋 <strong>Tremor</strong>: -20 estab instantâneo</div>
      <div>🎉 <strong>Festival</strong>: moedas dobradas</div>
      <div>🌸 <strong>Primavera</strong>: +2 estab por turno (cura)</div>
      <div>🏺 <strong>Ancestral</strong>: só peças Ancient por 5 turnos</div>
      <div>🌈 <strong>Arco-Íris</strong>: peças Rainbow aparecem! (dão todos os recursos + cor especial)</div>

      <div style="color:var(--gold);font-weight:900;margin:12px 0 4px;">🎰 Mecânicas</div>
      <div>🎲 <strong>Dados</strong>: sorte — Maior/Menor (comuns) ou Exato/Par-Ímpar/Intervalo (raros)</div>
      <div>⏱️ <strong>Timing</strong>: agilidade — pare o cursor no verde! Padrões variam (ping-pong, delay, pulso oculto, janela dupla, zona móvel, reverse)</div>
      <div>🔮 <strong>Sequência</strong>: memória — 4 a 7 símbolos. Modificadores: Shadow (escurecidos), Wind (se movem), Chaos (ordem trocada), Ancient (menos tempo), Divine (tentativa extra)</div>

      <div style="color:var(--gold);font-weight:900;margin:12px 0 4px;">📈 Progressões (trade-offs)</div>
      <div>1. Era do Ouro (h=50): +50% moedas / dados +rápidos</div>
      <div>2. Era das Sombras (h=312): +30% raras / +vento</div>
      <div>3. Era dos Cristais (h=1953): +50% cristais / seq menor tempo</div>
      <div>4. Era Ancestral (h=12207): +25% Ancient / verde -25%</div>
      <div>5. Era Divina (h=30517): +100% essência / bosses +50% HP</div>
    </div>
    <button class="modal-close" onclick="closeModal()">Entendi!</button>
  `);
}

function exitToMenu(){
  if(actionPresentation||window.rollBusy)return;
  saveGame();
  stopMusic();
  goScreen('menu');
  if(musicEnabled) playMenuMusic();
  addLog('🏠 Voltou ao menu','e');
}

/* ════════════════════════════════════════
   RANKING DE RECORDES — Top 10 local
═══════════════════════════════════════ */
const RANKING_KEY='totemRanking_fresh_v1';
const NAME_KEY='totemPlayerName';

function getPlayerNameBase1(){
  try{ return localStorage.getItem(NAME_KEY) || 'Jogador'; }catch(e){ return 'Jogador'; }
}
function savePlayerName(name){
  try{ localStorage.setItem(NAME_KEY, (name||'').slice(0,24) || 'Jogador'); }catch(e){}
}

function getRanking(){
  try{
    const data=localStorage.getItem(RANKING_KEY);
    if(!data) return [];
    return JSON.parse(data);
  }catch(e){ return []; }
}

function saveRanking(list){
  try{ localStorage.setItem(RANKING_KEY, JSON.stringify(list)); }catch(e){}
}

/* Adiciona/atualiza score do jogador no ranking */
function updateRanking(name, score, prestige, bosses){
  name=(name||'Jogador').slice(0,24);
  let ranking=getRanking();
  // Procura entrada existente do jogador (mesmo nome)
  let entry=ranking.find(r=>r.name===name);
  if(entry){
    if(score>entry.score){
      entry.score=score;
      entry.prestige=prestige;
      entry.bosses=bosses;
      entry.date=Date.now();
    }
  } else {
    ranking.push({name, score, prestige, bosses, date:Date.now()});
  }
  // Ordena por score decrescente
  ranking.sort((a,b)=>b.score-a.score);
  // Top 10
  ranking=ranking.slice(0,10);
  saveRanking(ranking);
  return ranking;
}

/* Comprar estabilidade com Essência Divina: 1 essência = 10% do máximo */
function buyStabilityWithEssence(){ /* removed */ }

function closeGameOver(){
  document.getElementById('go-overlay').classList.remove('show');
  document.getElementById('critical-overlay').classList.remove('show');
  document.body.classList.remove('critical-shake');
}

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */

const POLY_MESH={"8": {"v": [[-1.0, 0.0, 0.0], [1.0, 0.0, 0.0], [0.0, -1.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, -1.0], [0.0, 0.0, 1.0]], "f": [[2, 0, 4], [4, 1, 2], [5, 0, 2], [2, 1, 5], [3, 1, 4], [4, 0, 3], [5, 1, 3], [3, 0, 5]]}, "12": {"v": [[-0.5773502691896258, -0.5773502691896258, -0.5773502691896258], [-0.5773502691896258, -0.5773502691896258, 0.5773502691896258], [-0.5773502691896258, 0.5773502691896258, -0.5773502691896258], [-0.5773502691896258, 0.5773502691896258, 0.5773502691896258], [0.5773502691896258, -0.5773502691896258, -0.5773502691896258], [0.5773502691896258, -0.5773502691896258, 0.5773502691896258], [0.5773502691896258, 0.5773502691896258, -0.5773502691896258], [0.5773502691896258, 0.5773502691896258, 0.5773502691896258], [0.0, -0.35682208977308993, -0.9341723589627158], [-0.35682208977308993, -0.9341723589627158, 0.0], [-0.9341723589627158, 0.0, -0.35682208977308993], [0.0, -0.35682208977308993, 0.9341723589627158], [-0.35682208977308993, 0.9341723589627158, 0.0], [0.9341723589627158, 0.0, -0.35682208977308993], [0.0, 0.35682208977308993, -0.9341723589627158], [0.35682208977308993, -0.9341723589627158, 0.0], [-0.9341723589627158, 0.0, 0.35682208977308993], [0.0, 0.35682208977308993, 0.9341723589627158], [0.35682208977308993, 0.9341723589627158, 0.0], [0.9341723589627158, 0.0, 0.35682208977308993]], "f": [[16, 10, 0, 9, 1], [3, 12, 2, 10, 16], [5, 11, 1, 9, 15], [15, 9, 0, 8, 4], [6, 13, 4, 8, 14], [14, 8, 0, 10, 2], [5, 15, 4, 13, 19], [6, 14, 2, 12, 18], [19, 13, 6, 18, 7], [3, 16, 1, 11, 17], [17, 11, 5, 19, 7], [18, 12, 3, 17, 7]]}, "20": {"v": [[0.0, -0.5257311121191336, -0.85065080835204], [-0.5257311121191336, -0.85065080835204, 0.0], [-0.85065080835204, 0.0, -0.5257311121191336], [0.0, -0.5257311121191336, 0.85065080835204], [-0.5257311121191336, 0.85065080835204, 0.0], [0.85065080835204, 0.0, -0.5257311121191336], [0.0, 0.5257311121191336, -0.85065080835204], [0.5257311121191336, -0.85065080835204, 0.0], [-0.85065080835204, 0.0, 0.5257311121191336], [0.0, 0.5257311121191336, 0.85065080835204], [0.5257311121191336, 0.85065080835204, 0.0], [0.85065080835204, 0.0, 0.5257311121191336]], "f": [[2, 0, 1], [6, 2, 4], [5, 0, 6], [6, 0, 2], [3, 1, 7], [7, 0, 5], [1, 0, 7], [4, 2, 8], [2, 1, 8], [8, 1, 3], [8, 3, 9], [9, 4, 8], [10, 4, 9], [6, 4, 10], [10, 5, 6], [7, 5, 11], [9, 3, 11], [11, 3, 7], [10, 9, 11], [11, 5, 10]]}};

let diceSpin=0;
function renderDiceFace(value,cls){
 normalizeDiceState();
 renderDiceFaceBase1(value,cls);
 if(G.diceSides===6)return;
 const host=document.getElementById('dice-poly-container');if(!host)return;
 let canvas=host.querySelector('canvas');
 if(!canvas){host.innerHTML='<canvas class="poly-real" width="360" height="360" aria-label="Dado tridimensional"></canvas>';canvas=host.firstChild;}
 const data=POLY_MESH[G.diceSides];if(!data)return;
 const rolling=window.rollBusy&&!cls;diceSpin+=rolling?0.72:0;
 const ax=rolling?diceSpin:0.24,ay=rolling?diceSpin*1.3:0.32;
 const rot=p=>{const [x,y,z]=p;const yy=y*Math.cos(ax)-z*Math.sin(ax),zz=y*Math.sin(ax)+z*Math.cos(ax);return [x*Math.cos(ay)+zz*Math.sin(ay),yy,-x*Math.sin(ay)+zz*Math.cos(ay)];};
 const verts=data.v.map(rot);
 const faces=data.f.map((ids,i)=>({ids,i,z:ids.reduce((a,j)=>a+verts[j][2],0)/ids.length})).sort((a,b)=>a.z-b.z);
 const front=faces[faces.length-1].i;
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,360,360);
 ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(180,318,80,12,0,0,7);ctx.fill();
 const color=DICE_TYPES[G.diceType].color;
 const rgb=color.match(/\w\w/g).map(h=>parseInt(h,16));
 for(const face of faces){
  const pts=face.ids.map(j=>[180+verts[j][0]*112,170+verts[j][1]*112]);
  const shade=.48+(face.z+1)*.25;
  ctx.fillStyle='rgb('+rgb.map(c=>Math.min(255,Math.round(c*shade+16))).join(',')+')';
  ctx.strokeStyle='#a2967d';ctx.lineWidth=3;
  ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();
  // Stone material follows each projected face, retaining the model's own hue.
  const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cy=pts.reduce((a,p)=>a+p[1],0)/pts.length;
  ctx.save();ctx.clip();
  const sheen=ctx.createRadialGradient(cx-24,cy-28,2,cx,cy,95);
  sheen.addColorStop(0,'#eee9dc55');sheen.addColorStop(.45,'#ffffff08');sheen.addColorStop(1,'#050914bb');
  ctx.fillStyle=sheen;ctx.fillRect(0,0,360,360);
  // Fixed object-space grain avoids flicker while the die rolls.
  for(let k=0;k<24;k++){
   const a=pts[k%pts.length],b=pts[(k+1)%pts.length],u=((k*37+face.i*11)%97)/100;
   const px=cx*.25+(a[0]*u+b[0]*(1-u))*.75,py=cy*.25+(a[1]*u+b[1]*(1-u))*.75;
   ctx.fillStyle=k%2?'#fff2':'#0004';ctx.fillRect(px,py,1.4,1.4);
  }
  ctx.restore();
  ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.stroke();
  ctx.beginPath();pts.forEach((p,i)=>{const q=[cx+(p[0]-cx)*.88,cy+(p[1]-cy)*.88];i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.closePath();ctx.strokeStyle='#efe0b755';ctx.lineWidth=1;ctx.stroke();
  if(face.z>0.1){
   const x=pts.reduce((a,p)=>a+p[0],0)/pts.length,y=pts.reduce((a,p)=>a+p[1],0)/pts.length;
   const num=((face.i-front+value-1+G.diceSides)%G.diceSides)+1;
   ctx.fillStyle='#f4d68e';ctx.font='bold '+(face.i===front?36:19)+'px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.save();ctx.shadowColor='#211707';ctx.shadowBlur=2;ctx.shadowOffsetY=2;ctx.fillText(num,x,y);ctx.restore();
  }
 }
 canvas.setAttribute('aria-label','D'+G.diceSides+' • '+(rolling?'rolando':'resultado '+value));
}

function openDiceModalBase2(){
 openDiceModalBase1();
 const card=document.getElementById('dice-objective-card');
 const count=Array.from({length:G.diceSides},(_,i)=>i+1).filter(diceRollPassesBase1).length;
 card.insertAdjacentHTML('beforeend','<div style="font-size:11px;margin-top:6px;color:#d1c3df">Chance base: '+Math.round(count/G.diceSides*100)+'% • Sorte e bênção podem ajudar</div>');
}

function importProgress(){
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
 input.onchange=async()=>{
  try{
   const data=JSON.parse(await input.files[0].text());
   if(data.schemaVersion!==SAVE_SCHEMA||data.G?.schemaVersion!==SAVE_SCHEMA){notify('Saves anteriores à v10.2.1 não são aceitos. Inicie uma nova jornada.');return;}
   if(!data.G||!Number.isFinite(data.G.height)||!Array.isArray(data.G.pieces))throw Error('Arquivo inválido');
   for(const [k,v] of Object.entries(data.G)){
    if(typeof v==='number'&&(!Number.isFinite(v)||Math.abs(v)>1e15))throw Error('Valor inválido');
   }
   // Imported saves use known piece definitions, never supplied HTML.
   data.G.pieces=data.G.pieces.slice(-10).map(p=>resolvePiece(p.id));
   if(!confirm('Substituir o progresso atual pelo arquivo selecionado?'))return;
   G=restoreCurrentState(data);gameLog=Array.isArray(data.gameLog)?data.gameLog:[];saveGame();continuarJogo();
  }catch(e){notify('Não foi possível importar: arquivo de progresso inválido.');}
 };input.click();
}

window.addEventListener('pagehide',saveGame);

let audioPrefs={music:.52,effects:.78}; // volumes aumentados: menu/boss/instabilidade mais altos
try{Object.assign(audioPrefs,JSON.parse(localStorage.getItem('totemAudioMix')||'{}'));}catch(e){}
function setMix(kind,value){
 audioPrefs[kind]=Math.max(0,Math.min(1,Number(value)));
 if(musicGain)musicGain.gain.value=audioPrefs.music;
 if(sfxGain)sfxGain.gain.value=soundEnabled?audioPrefs.effects:0;
 if(kind==='music')fadeMusicTo(currentMusicName);
 try{localStorage.setItem('totemAudioMix',JSON.stringify(audioPrefs));}catch(e){}
}

function initAudio(){initAudioBase1();if(musicGain)musicGain.gain.value=audioPrefs.music;if(sfxGain)sfxGain.gain.value=soundEnabled?audioPrefs.effects:0;}

/* Navegação limpa: telas secundárias lembram de onde foram abertas. */
let sectionOrigin='game';

function menuGo(id){
 sectionOrigin='menu';
 if(!G||!Object.keys(G).length) loadGame();
 goScreen(id);
}
function closeSection(){goScreen(sectionOrigin==='menu'?'menu':'game');}
function toggleMenuTools(){
 const box=document.getElementById('menu-tools');
 if(box) box.hidden=!box.hidden;
}
function toggleGameNav(force){
 const dock=document.getElementById('nav-dock'),btn=document.getElementById('nav-toggle');
 if(!dock)return;
 const open=typeof force==='boolean'?force:dock.classList.contains('collapsed');
 dock.classList.toggle('collapsed',!open);
 if(btn){btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'×':'☰';}
}

function goScreenBase2(id){
 if(id!=='menu'&&id!=='game'&&curScreen==='game') sectionOrigin='game';
 goScreenBase1(id);
 if(id==='game') toggleGameNav(false);
}

window.addEventListener('resize',()=>{if(curScreen==='game')updateJourney();});

/* v8 presentation and lifecycle: mechanics keep the same save key. */
const ELEMENT_ART={ember:0,water:1,forest:2,light:3,shadow:4,wind:5,crystal:6,stone:7,chaos:8,ancient:9,gold:10,divine:11,rainbow:11};
const BOSS_THEMES={wind:1,forest:3,serpent:1,storm:1,titan:0,alien:2,death:2,pixel:2,ghost:2,doll:2,drama:3};

function newStateBase2(){return Object.assign(newStateBase1(),{playerName:'',hasRun:false,elementCounts:{},battlePieces:[],savedTower:[],collectionVersion:1});}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function resolvePiece(id){
 const p=PIECES.find(x=>x.id===id);if(p)return {...p};
 const b=BOSSES.find(x=>'boss-'+x.id===id);
 return b?{id:'boss-'+b.id,name:b.name,rune:b.emoji,cls:'tp-boss',hv:0,cv:0,rarity:'legendary'}:{...PIECES[0]};
}
function artIndex(piece){return piece.id.startsWith('boss-')?12+(BOSS_THEMES[piece.id.slice(5)]||0):(ELEMENT_ART[piece.id]??0);}
function spriteMarkupBase1(piece,extra=''){
 const i=artIndex(piece);return '<span class="stone-sprite '+(i>=12?'boss-stone ':'')+extra+'" role="img" aria-label="'+esc(piece.name)+'" style="--col:'+i%4+';--row:'+Math.floor(i/4)+'"></span>';
}

function getPlayerName(){return G?.playerName||getPlayerNameBase1();}
function normalizeV8(){
 if(!G.playerName)G.playerName=getPlayerNameBase1();
 if(!G.elementCounts||typeof G.elementCounts!=='object')G.elementCounts={};
 if(!Array.isArray(G.pieces))G.pieces=[];
 if(!Array.isArray(G.battlePieces))G.battlePieces=[];
 if(!Array.isArray(G.savedTower))G.savedTower=[];
 G.hasRun=!!(G.hasRun||G.hits||G.height||(G.prestige||0)||G.bossActive);
 G.pieces=G.pieces.slice(-10).map(p=>resolvePiece(p.id));
}

function updateMenuRun(){
 const btn=document.getElementById('continue-run'),label=document.getElementById('continue-name');
 if(btn)btn.disabled=!G.hasRun;
 if(label)label.textContent=G.hasRun?G.playerName+' • Andar '+G.height:'Nenhuma partida salva';
}
function newRunPrompt(){
 openModal('<h2>Nova jornada</h2><p class="msub">Dê um nome ao construtor desta torre.</p>'+
 '<label class="form-field">Nome do jogador<input id="new-player-name" maxlength="24" autocomplete="off" placeholder="Seu nome" value="'+esc(getPlayerNameBase1())+'"></label>'+
 (G.hasRun?'<p class="msub">A nova jornada substitui a partida em andamento. O recorde continua no ranking.</p>':'')+
 '<button class="modal-action" onclick="beginNamedRun()">JOGAR</button><button class="modal-close" onclick="closeModal()">Voltar</button>');
}
function beginNamedRun(){
 const name=(document.getElementById('new-player-name').value||'Jogador').trim().slice(0,24)||'Jogador';
 if(G.hasRun)updateRanking(G.playerName,G.bestHeight,(G.prestige||0),G.bossDefeated.length);
 closeModal();savePlayerName(name);battleVictory=false;clearTimeout(victoryTimer);startNewGame();
 G.playerName=name;G.hasRun=true;saveGame();updateMenuRun();syncBattle();
}
function resumeRun(){if(!G.hasRun)return;continuarJogo();syncBattle();}
function continuarOuJogar(){G.hasRun?resumeRun():newRunPrompt();}
function openRanking(){
 if(G.hasRun)updateRanking(G.playerName,G.bestHeight,(G.prestige||0),G.bossDefeated.length);
 const rows=getRanking();
 openModal('<h2>Ranking</h2><p class="msub">Os 10 maiores recordes neste navegador.</p><table class="ranking-table"><thead><tr><th>#</th><th>CONSTRUTOR</th><th>ANDAR</th></tr></thead><tbody>'+
 (rows.length?rows.map((r,i)=>'<tr class="'+(r.name===G.playerName?'mine':'')+'"><td>'+String(i+1).padStart(2,'0')+'</td><td>'+esc(r.name)+'</td><td>'+esc(r.score)+'</td></tr>').join(''):'<tr><td colspan="3">Sua primeira torre começa uma nova história.</td></tr>')+
 '</tbody></table><button class="modal-close" onclick="closeModal()">Fechar</button>');
}
// Ranking names must always be text, including legacy names.
function renderRanking(){const list=document.getElementById('ranking-list');if(list)list.textContent=getRanking().map((r,i)=>(i+1)+'. '+r.name+' — '+r.score).join('\n');}

/* Actual persisted tower, including boss trophies. */
function addPieceVisual(pt,perf,crit){
 if(!pt)return;
 G._lastPieceWeight=RARITY_WEIGHT[pt.id]||1;
 if(!G.elementCounts)G.elementCounts={};
 if(!pt.id.startsWith('boss-'))G.elementCounts[pt.id]=(Number(G.elementCounts[pt.id])||0)+1;
 const inBattle=G.bossActive&&!pt.id.startsWith('boss-');
 if(inBattle){
  const trophy=resolvePiece('boss-'+BOSSES[G.bossIdx%BOSSES.length].id);
 G.battlePieces.push(trophy);G.battlePieces=G.battlePieces.slice(-10);renderBossTower(true);
 }else{
  G.pieces.push({...pt});G.pieces=G.pieces.slice(-10);renderTotem(true);
 }
}
function renderTotem(animate=false){
 const stack=document.getElementById('totem-stack');if(!stack)return;
 const visible=(G.pieces||[]).slice(-10);
 stack.innerHTML=visible.map((p,i)=>spriteMarkup(resolvePiece(p.id),animate&&i===visible.length-1?'arrive':'')).join('');
 const empty=document.getElementById('empty-tower');if(empty)empty.hidden=visible.length>0;
 fitTower();
}
/** Anima blocos caindo quando a altura é perdida (erro em boss / queda parcial). */
function animateHeightLoss(lostHeight){
  if(!lostHeight||lostHeight<=0)return;
  const stack=document.getElementById('totem-stack');
  if(!stack)return;
  const count=Math.min((G.pieces||[]).length, Math.max(1, Math.ceil(lostHeight/Math.max(1, (G.pieces||[]).slice(-1)[0]?.hv||2))));
  const children=[...stack.children];
  const toFall=children.slice(-count);
  toFall.forEach((el,i)=>{
    el.classList.remove('arrive');
    el.classList.add('fall-away');
    el.style.animationDelay=(Math.min(i,3)*0.1)+'s';
  });
  setTimeout(()=>{
    if(G.pieces && G.pieces.length){
      G.pieces=G.pieces.slice(0, Math.max(0, G.pieces.length-count));
    }
    renderTotem(false);
  }, 1650+Math.min(count-1,3)*100);
}
function fitTower(){
 const arena=document.getElementById('arena'),stack=document.getElementById('totem-stack');if(!arena||!stack)return;
 // Ten fixed slots from the first block; same dimensions for guardian and regular blocks.
 // Uses filled arena art so the stack rests on the visual base and 10 blocks fit.
 // Overlap between stacked blocks is ~16% of tile height (see .stone-sprite margin-top),
 // so each of the 9 upper blocks adds ~.58*tile of visible height; divisor below matches that.
 const tile=Math.min(150,Math.max(26,((arena.clientHeight||450)*.77-20)/(10*.58)));
 stack.style.setProperty('--tile',tile+'px');
}

function doPrestige(){const name=G.playerName,collection={...G.elementCounts};doPrestigeBase1();G.playerName=name;G.elementCounts=collection;G.hasRun=true;saveGame();}
let lastEventId=null;

/* A battle is an overlay of the existing run, never a replacement game state. */
let battleVictory=false,victoryTimer=null,lastBattleId=null;
function renderBossTower(animate=false){
 const tower=document.getElementById('boss-tower');if(!tower)return;
 const id='boss-'+BOSSES[G.bossIdx%BOSSES.length].id;
 const count=Math.min(4,(G.battlePieces||[]).length);
 // Render only the latest four trophies. The actual battle history and height are unchanged.
 tower.innerHTML=(G.battlePieces||[]).slice(-4).map((piece,i)=>spriteMarkup(resolvePiece(piece.id||id),animate&&i===count-1?'arrive':'')).join('');
 const field=tower.parentElement?.clientHeight||540;tower.style.setProperty('--tile',Math.max(26,Math.min(150,(field*.77-20)/(10*.58)))+'px');
}

function updateBossUI(){updateBossUIBase1();syncBattle();}

function finishBossVictory(){
 if(!battleVictory||victoryVisualPending)return;
 if(window.rollBusy||actionPresentation){clearTimeout(victoryTimer);victoryTimer=setTimeout(finishBossVictory,250);return;}
 battleVictory=false;clearTimeout(victoryTimer);
 const fb=document.getElementById('battle-feedback');if(fb){fb.textContent='';fb.classList.remove('victory-pop');}
 syncBattle();updateActionButton();saveGame();
 actionPresentation={stage:'trophy'};
 setTimeout(()=>{renderTotem(true);showActionFeedback('BLOCO CONQUISTADO','Guardião integrado à torre','boss');setTimeout(()=>{actionPresentation=null;updateActionButton();},2000);},450);
}
function attackBoss(){if(G.bossActive&&!battleVictory)handleAction();}
function pauseBattle(){if(window.rollBusy||actionPresentation)return;exitToMenu();syncBattle();updateMenuRun();}

function goScreenBase3(id){goScreenBase2(id);if(id==='menu')updateMenuRun();syncBattle();}

function bossImpact(fail){
 const tower=document.getElementById('boss-tower');tower.classList.remove('hit');void tower.offsetWidth;tower.classList.add('hit');
 if(battleVictory)return;
 const feedback=document.getElementById('battle-feedback');feedback.textContent=fail?'DEFESA DO GUARDIÃO':'IMPACTO';feedback.style.color=fail?'#ea8a93':'#ffd591';
 setTimeout(()=>{if(!battleVictory)feedback.textContent='';},700);
}
// Use the original modal opening routine: battle info already has its own screen.
function openModalBase3(html){openModalBase1(html);}

/* Inventory: selectable icons, exact counts and a single detail panel. */
let inventoryTab='elements',inventorySelected=null;

function chooseInventoryTab(tab){inventoryTab=tab;inventorySelected=null;renderInventory();}
function chooseInventoryItem(id){inventorySelected=id;renderInventory();}

/* Layered sounds with short tails and a separate boss soundscape. */
SFX.piece=()=>{playNoise(.12,.09,700);playTone(130,.13,'triangle',.12);playTone(523,.28,'sine',.045,.06);};
SFX.dice=()=>{for(let i=0;i<6;i++){playTone(190+i*43,.05,'triangle',.055,i*.09);setTimeout(()=>playNoise(.035,.05,2200),i*90);}};
SFX.perfect=()=>{[523,659,784,1047,1318].forEach((f,i)=>playTone(f,.27,'triangle',.105,i*.065));playTone(1568,.45,'sine',.10,.34);playNoise(.18,.055,2600,'highpass');};
SFX.boss=()=>{playSlide(280,38,.95,'sawtooth',.42);playNoise(.55,.22,350,'lowpass');playTone(110,.95,'square',.38);playTone(55,1.25,'sine',.32,.12);};
SFX.bossHit=()=>{playNoise(.22,.24,900,'bandpass');playTone(220,.38,'sawtooth',.36);playTone(165,.34,'square',.30,.05);};
SFX.bossDefeat=()=>{[261,329,392,523,659,784].forEach((f,i)=>playTone(f,.7,'triangle',.065,i*.09));};
SFX.event=()=>{playSlide(230,920,.5,'sine',.07);[392,587,784].forEach((f,i)=>playTone(f,.55,'sine',.045,.1+i*.11));};

let audioWasBoss=false;

function openSettings(){
 openModal('<h2>Configurações</h2><label class="form-field">Música<input aria-label="Volume da música" type="range" min="0" max="1" step=".05" value="'+audioPrefs.music+'" oninput="setMix(\'music\',this.value)"></label>'+
 '<label class="form-field">Efeitos<input aria-label="Volume dos efeitos" type="range" min="0" max="1" step=".05" value="'+audioPrefs.effects+'" oninput="setMix(\'effects\',this.value)"></label>'+
 '<button class="modal-action" onclick="openAudioSettings()">Música e efeitos sonoros</button><button class="modal-action" onclick="exportProgress()">Exportar progresso</button><button class="modal-action" onclick="importProgress()">Importar progresso</button><button class="modal-close" onclick="closeModal()">Fechar</button>');
}

window.addEventListener('resize',()=>{fitTower();if(G.bossActive)renderBossTower();});
document.getElementById('boss-overlay')?.addEventListener('pointermove',e=>{const el=e.currentTarget,r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.setProperty('--boss-bg-x',(-x*8)+'px');el.style.setProperty('--boss-bg-y',(-y*8)+'px');el.style.setProperty('--boss-far-x',(x*11)+'px');el.style.setProperty('--boss-far-y',(y*8)+'px');el.style.setProperty('--boss-near-x',(x*20)+'px');el.style.setProperty('--boss-near-y',(y*14)+'px');el.style.setProperty('--boss-face-x',(x*16)+'px');el.style.setProperty('--boss-face-y',(y*10)+'px');});
document.addEventListener('visibilitychange',()=>{if(document.hidden){saveGame();stopMusic(true);}else if(musicEnabled){curScreen==='menu'?playMenuMusic():curScreen==='game'?playGameMusic():null;}});

/* v9: additive presentation, collectibles and fourth action. */

const GUARDIAN_TILES={titan:0,wind:1,forest:2,serpent:3,storm:4,ghost:5,death:6,doll:7,alien:8,pixel:9,drama:10};
function spriteMarkup(piece,extra=''){
 if(!piece.id.startsWith('boss-'))return spriteMarkupBase1(piece,extra);
 const tile=GUARDIAN_TILES[piece.id.slice(5)]??0;
 return '<span class="stone-sprite boss-stone guardian-block '+extra+'" role="img" aria-label="'+esc(piece.name)+'" style="--gx:'+(tile%4*100/3)+'%;--gy:'+(Math.floor(tile/4)*50)+'%"></span>';
}
/* inventory already simplified to elements / bosses / gold */

let sealState=null,sealTimer=null;
function openSealModalBase1(){
 const level=mechanicLevel();sealState={hits:0,target:0,done:false,epoch:0,deadline:0,level,required:3+Math.floor((level-1)/3),choices:Math.min(RUNES.length,4+Math.floor(level/2)),perfectEligible:true,assisted:false};
 openModal('<h2>✦ Selos Elementais</h2><p class="msub">Encontre o selo indicado. Mais opções e rodadas a cada nível.</p><div id="seal-target"></div><progress id="seal-time" max="1" value="1"></progress><div id="seal-grid"></div><p id="seal-status" aria-live="polite">0 / 3 selos</p><button class="modal-close" onclick="closeModal()">Fechar</button>');
 sealState.epoch=window.modalEpoch;nextSeal();
 sealTimer=setInterval(()=>{if(!sealState||sealState.done||!modalOpen||sealState.epoch!==window.modalEpoch){clearInterval(sealTimer);return;}const left=sealState.deadline-performance.now();const p=document.getElementById('seal-time');if(p)p.value=Math.max(0,left/sealState.duration);if(left<=0)finishSeal(false);},50);
}
function nextSeal(){
 const order=RUNES.map((_,i)=>i);for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const choices=order.slice(0,sealState.choices);sealState.target=choices[Math.floor(Math.random()*choices.length)];
 const rune=RUNES[sealState.target];document.getElementById('seal-target').textContent=rune.glyph+' • '+rune.name;
 document.getElementById('seal-grid').innerHTML=choices.map(i=>'<button class="seal-option" onclick="chooseSeal('+i+')" aria-label="'+RUNES[i].name+'">'+RUNES[i].glyph+'</button>').join('');
 document.getElementById('seal-status').textContent='Nível '+sealState.level+' • '+sealState.hits+' / '+sealState.required+' selos • '+sealState.choices+' opções';sealState.duration=Math.max(2200,5200-(sealState.level-1)*280)*(G.bossActive?.85:1)/(G.eventId==='gale'?1.2:1);sealState.deadline=performance.now()+sealState.duration;
}
function chooseSeal(i){if(!sealState||sealState.done||!modalOpen||sealState.epoch!==window.modalEpoch)return;if(performance.now()>sealState.deadline||i!==sealState.target){finishSeal(false);return;}if((sealState.deadline-performance.now())/sealState.duration<0.70)sealState.perfectEligible=false;sealState.hits++;SFX.click();if(sealState.hits>=sealState.required){finishSeal(true);return;}document.getElementById('seal-status').textContent=sealState.hits+' / 3 selos';nextSeal();}
function finishSealBase1(won){
 if(!sealState||sealState.done)return;sealState.done=true;clearInterval(sealTimer);window.rollBusy=true;
 document.getElementById('seal-status').textContent=won?'SELOS HARMONIZADOS':'SELO ROMPIDO';
 try{if(won){onSuccess('seal',sealState.perfectEligible&&!sealState.assisted?'perfect':'strong',6);SFX.perfect();}else {SFX.fail();onFail();}}finally{window.rollBusy=false;}
 window.rollBusy=true;setTimeout(()=>{window.rollBusy=false;closeModal();checkPhaseShift();checkAchievements();saveGame();},700);
}

function closeModalBase2(){if(window.rollBusy)return;clearInterval(sealTimer);sealState=null;closeModalBase1();}

function openModal(html){
  openModalBase3(html);
  const b=document.getElementById('modal-box');
  const ov=document.getElementById('modal-overlay');
  const action=html.includes('timing-track')?'timing':html.includes('seq-symbols')?'sequence':html.includes('dice-stage')?'dice':html.includes('seal-grid')?'seals':html.includes('nucleus-canvas')?'nucleus':'';
  b.dataset.action=action;
  // Mecânicas de jogo: modal compacto na parte inferior, fundo transparente para ver a arena
  const isMechanic=['dice','timing','sequence','seals','nucleus'].includes(action);
  ov.classList.toggle('mechanic-modal', isMechanic);
  b.classList.toggle('mechanic-sheet', isMechanic);
}

function addAtmosphere(parent,id,count){
 if(!parent||document.getElementById(id))return;const layer=document.createElement('div');layer.id=id;layer.className='atmosphere';layer.setAttribute('aria-hidden','true');
 for(let i=0;i<count;i++){const p=document.createElement('span');p.textContent=['ᚠ','✦','◇','ᚨ','✧'][i%5];p.style.cssText='--x:'+((i*73)%100)+'%;--speed:'+(7+i%7)+'s;--delay:-'+(i*.77)+'s;--size:'+(9+i%16)+'px;';layer.appendChild(p);}parent.appendChild(layer);
}


function updateDanger(){
 const danger=curScreen==='game'&&G.stab/Math.max(1,G.maxStab)<=.30;
 document.getElementById('screen-game').classList.toggle('danger-mode',danger);document.getElementById('boss-overlay').classList.toggle('danger-mode',danger);
 syncDangerMusic();
}

function goScreenBase4(id){goScreenBase3(id);updateDanger();}

/* Current rules, progression and presentation */

'use strict';

/*
 * Totem Ascension v10.0
 * Implementação canônica da Especificação Técnica v2.1.
 * Saves novos, sem migração das versões anteriores.
 */
const SAVE_SCHEMA=11;
const GAME_VERSION='v10.3.16';


const ERA_DATA=[
  {name:'Primordial',subtitle:'O início da jornada',desc:'Natureza, pedra e runas discretas.',art:'linear-gradient(135deg,#184b2b,#2f7d47,#9ac85c)'},
  {name:'Elemental',subtitle:'O poder desperta',desc:'Fogo, lava, energia e blocos com veios vivos.',art:'linear-gradient(135deg,#5a1409,#d64a12,#ffb02e)'},
  {name:'Sombria',subtitle:'A escuridão se ergue',desc:'Corrupção, névoa, sombras e distorções.',art:'linear-gradient(135deg,#130823,#542070,#b037d1)'},
  {name:'Astral',subtitle:'Além do mundo físico',desc:'Cosmos, portais, nebulosas e energia orbital.',art:'linear-gradient(135deg,#071b49,#245dcc,#8d4ce8)'},
  {name:'Divina',subtitle:'O topo é apenas o começo',desc:'Luz, ouro, halos e efeitos transcendentes.',art:'linear-gradient(135deg,#5d3d0a,#d2a52e,#fff2a7)'}
];

const ELEMENT_RULES=[
  ['ember','Fogo',0,[35,32,30],30],['stone','Terra',60,[15,18,20],20],
  ['forest','Natureza',120,[12,15,18],18],['water','Água',250,[10,13,15],15],
  ['wind','Vento',400,[8,12,15],15],['light','Luz',600,[6,10,15],15],
  ['shadow','Sombra',900,[4,8,12],12],['crystal','Cristal',1300,[3,6,10],10],
  ['chaos','Caos',1800,[2,4,8],8],['ancient','Ancestral',2500,[1,3,5],5],
  ['gold','Divino',3500,[1,2,4],4],['divine','Celestial',6000,[.5,1.5,3],3]
];


// Distribuições reais por faixa; 1/3 é exato na faixa com três elementos.
const DROP_BANDS=[
 [0,[100]],[60,[50,50]],[120,[100/3,100/3,100/3]], [250,[25,25,25,25]],
 [400,[22,21,20,19,18]],[600,[20,19,18,17,15,11]],
 [900,[18,17,17,16,14,10,8]],[1300,[18,17,16,15,13,9,7,5]],
 [1800,[17,16,15,14,12,9,7,5,5]],[2500,[17,16,15,13,11,9,7,5,4,3]],
 [3500,[16,15,15,13,11,9,7,5,4,3,2]],[6000,[17,15,14,13,11,9,7,5,3,3,2,1]]
];
const ELEMENT_EFFECTS={
 ember:{height:1,desc:'Sem efeito adicional.'},
 stone:{height:2,desc:'Fundação: +1 Estabilidade; +3 se estiver em 30% ou menos.'},
 forest:{height:2,desc:'Regeneração: +2 Estabilidade se estiver abaixo de 50%.'},
 water:{height:3,desc:'Equilíbrio: reduz em 50% a perda de Estabilidade do próximo erro.'},
 wind:{height:3,desc:'Mudança dos Ventos: chance de Evento passa de 8% a 16% nas próximas 2 ações fora de Boss.'},
 light:{height:6,desc:'Purificação: −5 p.p. de Ameaça e +3 Estabilidade.'},
 shadow:{height:10,desc:'Invocação: +7 p.p. de Ameaça e +3 Estabilidade.'},
 crystal:{height:9,desc:'Presságio: inicia um Evento se não houver Evento ou Boss ativo.'},
 chaos:{height:15,desc:'Anomalia: encerra imediatamente o Evento ativo.'},
 ancient:{height:20,desc:'Legado Ancestral: +50 p.p. de Ameaça e −20 Estabilidade.'},
 gold:{height:50,desc:'Intervenção Divina: −50 p.p. de Ameaça.'},
 divine:{height:100,desc:'Intervenção Celestial: +10 Estabilidade e −10 p.p. de Ameaça.'}
};

const EVENT_RULES=[
  {id:'storm',name:'⛈ Tempestade',weight:16,dur:5,cooldown:12,desc:'Erro soma +7% de Ameaça em vez de +4%.',col:'#5a79ff'},
  {id:'gale',name:'💨 Ventania',weight:18,dur:5,cooldown:12,desc:'Mecânicas de ações ficam 20% mais rápidas.',col:'#72d7ff'},
  {id:'blessing',name:'✦ Bênção',weight:14,dur:5,cooldown:15,desc:'A primeira perda de estabilidade de cada ação é anulada.',col:'#f0ca62'},
  {id:'eclipse',name:'🌑 Eclipse',weight:12,dur:5,cooldown:15,desc:'Os 4 elementos mais raros desbloqueados recebem peso x3.',col:'#9a4adb'},
  {id:'quake',name:'🌋 Tremor',weight:10,dur:3,cooldown:18,desc:'A estabilidade atual cai 50% no início, com mínimo de 20%.',col:'#e06a36'},
  {id:'festival',name:'🎉 Festival',weight:14,dur:5,cooldown:15,desc:'Todo Gold recebido é dobrado.',col:'#42d696'},
  {id:'spring',name:'🌸 Primavera',weight:10,dur:6,cooldown:12,desc:'Recupera 5% da Estabilidade atual por ação.',col:'#f47eb9'},
  {id:'corruption',name:'🕳️ Ruptura Sombria',weight:13,dur:4,cooldown:16,desc:'A torre perde 5 de estabilidade ao fim de cada uma das 4 ações.',col:'#df65ef'},
  {id:'convergence',name:'🌀 Convergência',weight:6,dur:7,cooldown:20,desc:'Cristal, Caos, Ancestral, Divino e Celestial recebem peso x2,5.',col:'#57aef5'}
];

const POWERUPS={
  goldenDice:{name:'Dados Dourados',icon:'🎲',price:25000,desc:'Converte automaticamente erros dos próximos 3 Dados em acertos normais; nunca concede Perfect.'},
  timing:{name:'Timing Garantido',icon:'⏱',price:12000,desc:'Os próximos 2 Timing viram ACERTO normal automático, nunca Perfect.'},
  seals:{name:'Selos Automáticos',icon:'✦',price:20000,desc:'As próximas 3 ações de Selos viram ACERTO normal automático.'},
  nucleus:{name:'Núcleo Assistido',icon:'🌀',price:30000,desc:'As próximas 3 ações de Núcleo começam com 2 anéis alinhados.'}
};

const NUCLEUS_LEVELS=[
  {rings:2,time:15,perfect:5,modifier:'Rotação simples'},
  {rings:2,time:14,perfect:4,modifier:'Posições iniciais mais distantes'},
  {rings:3,time:14,perfect:7,modifier:'Rotação simples'},
  {rings:3,time:13,perfect:6,modifier:'Um anel começa próximo do oposto'},
  {rings:3,time:12,perfect:6,modifier:'Anel externo em qualquer posição'},
  {rings:4,time:12,perfect:9,modifier:'Anel 2 contra-rotaciona o Anel 3'},
  {rings:4,time:11,perfect:8,modifier:'Ligação entre anéis'},
  {rings:4,time:10.5,perfect:8,modifier:'Uma ligação muda por rodada'},
  {rings:4,time:10,perfect:7,modifier:'Duas ligações possíveis'},
  {rings:4,time:9.5,perfect:7,modifier:'Configuração ancestral'}
];

const HEIGHT_REGIONS=[
  {h:0,label:'Iniciante',mult:1,accent:'#56c978',bg:'#071a12'},
  {h:101,label:'Crescente',mult:1.10,accent:'#75c5e8',bg:'#071521'},
  {h:201,label:'Desafio',mult:1.18,accent:'#d5bd5b',bg:'#201806'},
  {h:351,label:'Avançado',mult:1.28,accent:'#e48b3d',bg:'#211006'},
  {h:601,label:'Épico',mult:1.40,accent:'#b36ce0',bg:'#170823'},
  {h:1001,label:'Lendário',mult:1.55,accent:'#e3b64e',bg:'#211804'},
  {h:2001,label:'Ancestral',mult:1.72,accent:'#6f8fea',bg:'#090d24'},
  {h:4001,label:'Divino',mult:1.90,accent:'#f4e7a0',bg:'#211d0e'},
  {h:6001,label:'Divino 2',mult:2.05,accent:'#f4e7a0',bg:'#211d0e'},
  {h:8501,label:'Universo',mult:2.20,accent:'#f4e7a0',bg:'#211d0e'}
];

function clamp(n,min,max){return Math.min(max,Math.max(min,Number(n)||0));}
function currentEra(){return clamp(G.era,0,4);}
function bossStar(){return Math.max(1,Math.floor((G.bossDefeated?.length||0)/BOSSES.length)+1);}
function visualBossStar(){return Math.min(5,G.bossStar||bossStar());}
function mechanicLevel(){return HEIGHT_REGIONS.filter(r=>G.height>=r.h).length||1;}
function unlockedMechanics(state=G){return [1,3,5,7].filter(n=>(state.level||1)>=n).length||1;}
function normalizeDiceState(state=G){
  const raw=Number(state.diceType),count=DICE_TYPES.length;
  state.diceType=Number.isFinite(raw)?((Math.trunc(raw)%count)+count)%count:0;
  const type=DICE_TYPES[state.diceType];
  state.diceSides=type.sides;
  return type;
}
function heightRegion(){return HEIGHT_REGIONS.reduce((current,r)=>G.height>=r.h?r:current,HEIGHT_REGIONS[0]);}

function configureCanonicalData(){
  const byId=Object.fromEntries(PIECES.map(p=>[p.id,p]));
  ELEMENT_RULES.forEach(([id,name,unlock,weights,max],order)=>{
    const p=byId[id]; if(!p)return;
    p.name=name;p.minH=unlock;p.unlockH=unlock;p.weights=weights;p.maxWeight=max;p.order=order;
    p.hv=ELEMENT_EFFECTS[id].height;p.effectDesc=ELEMENT_EFFECTS[id].desc;
  });
  PIECES.splice(0,PIECES.length,...ELEMENT_RULES.map(r=>byId[r[0]]).filter(Boolean));
  EVENTS.splice(0,EVENTS.length,...EVENT_RULES);
  ACHIEVEMENTS.forEach(a=>{a.desc=a.desc.replace(/Sequência de/g,'Série de').replace(/prestígio/gi,'Ascensão');});
}
configureCanonicalData();
TIERS=HEIGHT_REGIONS.map(r=>({h:r.h,label:r.label,accent:r.accent,bg:r.bg}));
function refreshTiersForHeight(){}
function getDifficultyMult(){return heightRegion().mult;}
function getHeightInstabilityPenalty(){return 0;}
function upLv(){return 0;}

function totalXpForLevel(level){
  const fixed=[0,0,100,250,450,700,1000,1400,1900,2500,3200];
  level=Math.max(1,Math.floor(level||1));
  if(level<=10)return fixed[level];
  let prev=fixed[10],increment=fixed[10]-fixed[9];
  for(let l=11;l<=level;l++){increment=Math.max(1,Math.round(increment*1.35));prev+=increment;}
  return prev;
}
function xpNeeded(level){return totalXpForLevel((level||1)+1);}
function levelFromTotalXp(xp){let level=1;while(level<200&&xp>=totalXpForLevel(level+1))level++;return level;}
function awardXP(amount){
  G.xpTotal=Math.max(0,Number(G.xpTotal)||0)+Math.max(0,amount||0);
  const before=G.level||1;G.level=levelFromTotalXp(G.xpTotal);G.xp=G.xpTotal;
  if(G.level>before){showEventToast('Nível '+G.level+' alcançado');SFX.perfect();}
}

function newState(){
  const s=newStateBase2();
  return Object.assign(s,{
    schemaVersion:SAVE_SCHEMA,progressionVersion:2,waterShield:false,windActions:0,xpTotal:0,xp:0,level:1,threat:0,bossPending:false,bossStar:1,
    era:0,ascensions:0,prestige:0,ascensionReady:false,prestigeAvailable:0,
    actionIndex:0,phase:1,mechanicBag:[],mechanicHistory:[],eventCooldowns:{},eventTriggerCooldown:0,eventId:null,eventLeft:0,
    powerUps:{goldenDice:0,timing:0,seals:0,nucleus:0},activePowerUps:{goldenDice:0,timing:0,seals:0,nucleus:0},
    elementCounts:{},bossBlockCounts:{},runStats:newRunStats(),runHistory:[],divineProtection:0,
    nucleusProgress:{attempts:0,wins:0},consecutiveErrors:0,hasRun:false,collectionVersion:2
  });
}

function newRunStats(){return {startedAt:Date.now(),startEra:0,actions:0,perfects:0,errors:0,bosses:0,goldEarned:0,goldSpent:0,essenceEarned:0,essenceSpent:0,powerUpsUsed:0,finalHeight:0};}
function sanitizeState(s){
  ['wood','stone','goldR','crystal','resources','relics','buildings','upgrades','presBonus','prestigeDifficulty','activeProgressions','piecesSinceBoss','bossThreshold'].forEach(k=>delete s[k]);
  return s;
}
// Limpeza restrita ao progresso e ranking antigos deste jogo. Preferências são mantidas.
function clearOldProgress(){
  for(const key of ['totemAsc_v9','totemAsc_v9_backup_pre_v10','totemAsc_backup_pre_v10_2','totemRanking_v1']){
    try{localStorage.removeItem(key);}catch(e){}
  }
}
function restoreCurrentState(data){
  if(!data||data.schemaVersion!==SAVE_SCHEMA||!data.G||data.G.schemaVersion!==SAVE_SCHEMA)
    throw Error('Este save pertence a uma versão antiga. Use um save criado a partir da v10.2.1.');
  const raw=data.G;
  if(!Number.isFinite(raw.height)||raw.height<0||!Number.isFinite(raw.xpTotal)||raw.xpTotal<0||!Array.isArray(raw.pieces))
    throw Error('Save inválido');
  const state=Object.assign(newState(),raw);
  state.level=levelFromTotalXp(state.xpTotal);state.xp=state.xpTotal;
  state.phase=clamp(state.phase,1,unlockedMechanics(state));
  state.mechanicBag=Array.isArray(raw.mechanicBag)?raw.mechanicBag.filter(n=>Number.isInteger(n)&&n>=1&&n<=unlockedMechanics(state)).slice(0,8):[];
  state.mechanicHistory=Array.isArray(raw.mechanicHistory)?raw.mechanicHistory.filter(n=>Number.isInteger(n)&&n>=1&&n<=4).slice(-7):[];
  delete state.mechanicsUnlocked;delete state.powerUpsUnlocked;
  state.powerUps=Object.assign({goldenDice:0,timing:0,seals:0,nucleus:0},raw.powerUps||{});
  state.activePowerUps=Object.assign({goldenDice:0,timing:0,seals:0,nucleus:0},raw.activePowerUps||{});
  state.runStats=Object.assign(newRunStats(),raw.runStats||{});
  state.pieces=raw.pieces.slice(-10).map(p=>resolvePiece(p.id));
  state.battlePieces=(Array.isArray(raw.battlePieces)?raw.battlePieces:[]).slice(-10).map(p=>resolvePiece(p.id));
  rebalanceBossHealth(state);
  normalizeDiceState(state);
  return sanitizeState(state);
}
function loadGame(){
  clearOldProgress();
  let raw=null;
  try{raw=localStorage.getItem(SAVE_KEY);}catch(e){}
  if(!raw){G=newState();gameLog=[];return;}
  try{
    const parsed=JSON.parse(raw);G=restoreCurrentState(parsed);
    gameLog=Array.isArray(parsed.gameLog)?parsed.gameLog.slice(0,5000):[];
  }catch(e){G=newState();gameLog=[];}
  normalizeV8();repairAscensionUnlock();applyEraVisuals();
}
function saveGame(){
  try{sanitizeState(G);G.schemaVersion=SAVE_SCHEMA;localStorage.setItem(SAVE_KEY,JSON.stringify({schemaVersion:SAVE_SCHEMA,version:GAME_VERSION,G,gameLog}));}catch(e){console.error('Falha ao salvar',e);}
}

function preservePermanent(){return {
  nucleusProgress:{...G.nucleusProgress},playerName:G.playerName,coins:G.coins,totalCoins:G.totalCoins,xpTotal:G.xpTotal,level:G.level,divineEssence:G.divineEssence,
  bestHeight:G.bestHeight,bossDefeated:[...(G.bossDefeated||[])],elementCounts:{...(G.elementCounts||{})},bossBlockCounts:{...(G.bossBlockCounts||{})},
  achievements:{...(G.achievements||{})},prestige:G.prestige,prestigeAvailable:G.prestigeAvailable,ascensions:G.ascensions,era:G.era,
  powerUps:{...(G.powerUps||{})},runHistory:[...(G.runHistory||[])],hasRun:true,
  hits:G.hits||0,misses:G.misses||0,bestStreak:G.bestStreak||0,perfectHits:G.perfectHits||0,
  luckyMax:G.luckyMax||0,critHits:G.critHits||0,bestCombo:G.bestCombo||0
};}
function resetJourney(permanent){G=Object.assign(newState(),permanent||{});G.stab=G.maxStab=100;G.runStats=Object.assign(newRunStats(),{startEra:G.era});G.phase=1;G.hasRun=true;}
function archiveRun(reason){
  if(!G.runStats)return;G.runStats.finalHeight=G.height;G.runStats.endedAt=Date.now();G.runStats.reason=reason;
  G.runHistory=[...(G.runHistory||[]),G.runStats].slice(-20);
}
function startNewGame(){
  const permanent=G&&G.schemaVersion?preservePermanent():{};resetJourney(permanent);goScreen('game');renderTotem();setPhaseUI();updateHUD();startTimingLoop();startAutoLoop();startStabCheckLoop();saveGame();
}

function heightBandSinceUnlock(p,h){const d=h-p.minH;return d<500?0:d<1000?1:2;}
function pieceWeight(p){
  const band=DROP_BANDS.reduce((a,b)=>G.height>=b[0]?b:a,DROP_BANDS[0]);
  let w=band[1][p.order]||0;
  const unlocked=PIECES.filter(x=>G.height>=x.minH);
  if(G.eventId==='eclipse'&&unlocked.slice(-4).includes(p))w*=3;
  if(G.eventId==='convergence'&&['crystal','chaos','ancient','gold','divine'].includes(p.id))w*=2.5;
  return w;
}
function choosePiece(){
  const pool=PIECES.filter(p=>G.height>=p.minH),weights=pool.map(pieceWeight),total=weights.reduce((a,b)=>a+b,0);
  let roll=Math.random()*total;for(let i=0;i<pool.length;i++){roll-=weights[i];if(roll<=0)return pool[i];}return pool[0];
}
function applyPieceRarityEffect(){}
function applyProgressions(){G.activeProgressions=[];G._progCoinMult=1;G._progBossHpMult=1;}

function addThreat(result){
  if(G.bossActive)return;
  const gain=result==='perfect'?1:result==='hit'?2:(G.eventId==='storm'?7:4);
  G.threat=clamp(G.threat+gain,0,100);if(G.threat>=100)G.bossPending=true;
  addLog('Ameaça +'+gain+' p.p. • atual '+G.threat+'%', '',G.actionContext);
}
function updateSeries(success){
  if(success){G.streak=(G.streak||0)+1;G.bestStreak=Math.max(G.bestStreak||0,G.streak);G.consecutiveErrors=0;}
  else{G.streak=0;G.consecutiveErrors=(G.consecutiveErrors||0)+1;}
}
function rewardAction(perfect){
  const gold=10*(perfect?2:1)*(G.eventId==='festival'?2:1);G.coins+=gold;G.totalCoins+=gold;G.runStats.goldEarned+=gold;awardXP(10*(perfect?2:1));return gold;
}

// Combat and face placement; arms and spells come exclusively from BossSprites.ATLAS.
const BOSS_MOTION = {
 wind:{color:'#b2eeff',hand:'Garras do Vento',meteor:'Turbilhão dos Ventos',headY:43,bodyY:63},
 forest:{color:'#95e36f',hand:'Golpe das Raízes',meteor:'Tempestade de Folhas',headY:39,bodyY:62},
 serpent:{color:'#52f5bc',hand:'Golpe da Cauda',meteor:'Veneno Ancestral',headY:39,bodyY:62},
 storm:{color:'#6fbeff',hand:'Garras da Tempestade',meteor:'Descarga Dracônica',headY:39,bodyY:63},
 titan:{color:'#ff9b48',hand:'Punho do Titã',meteor:'Chuva de Meteoros',headY:34,bodyY:55},
 alien:{color:'#d29aff',hand:'Investida das Quatro Garras',meteor:'Ruptura Cósmica',headY:30,bodyY:55},
 death:{color:'#6df4ff',hand:'Garras do Ceifador',meteor:'Colheita Espectral',headY:34,bodyY:55},
 pixel:{color:'#c777ff',hand:'Punhos do Monólito',meteor:'Colapso de Cubos',headY:38,bodyY:60},
 ghost:{color:'#80bbff',hand:'Garras do Errante',meteor:'Selo Espectral',headY:28,bodyY:56},
 doll:{color:'#ff6c82',hand:'Abraço de Espinhos',meteor:'Maldição das Bonecas',headY:28,bodyY:58},
 drama:{color:'#ffe69b',hand:'Mãos do Disfarce',meteor:'Cartas do Destino',headY:39,bodyY:61}
};
function guardianMotion(){return BOSS_MOTION[BOSSES[G.bossIdx]?.id];}
function configureGuardianMotion(id){
 const cfg=BOSS_MOTION[id],ov=document.getElementById('boss-overlay');if(!cfg||!ov)return;
 ov.dataset.motion='atlas';ov.dataset.strike='paired';
 ov.style.setProperty('--motion-color',cfg.color);
 ov.style.setProperty('--head-y',cfg.headY+'%');ov.style.setProperty('--body-y',cfg.bodyY+'%');
 // The old arena-body fragments and gradient missiles are no longer used.
 document.querySelectorAll('#titan-motion .titan-hand,#titan-motion .titan-meteors').forEach(el=>el.remove());
 buildGuardianSprites(id);
 window.TitanAnimation?.setBoss(id);
}
let guardianSpriteRequest=0;
function buildGuardianSprites(id){
 const field=document.querySelector('.battle-field');if(!field)return;
 const request=++guardianSpriteRequest;
 document.getElementById('boss-limbs')?.remove();
 const rig=document.createElement('div');rig.id='boss-limbs';rig.setAttribute('aria-hidden','true');field.appendChild(rig);
 const cfg=BossSprites.ATLAS[id];if(!cfg)return;
 rig.style.setProperty('--arm-top',cfg.top+'%');rig.style.setProperty('--arm-width',cfg.width+'%');rig.style.setProperty('--arm-height',cfg.height+'%');
 BossSprites.load(id).then(urls=>{
  if(request!==guardianSpriteRequest||!rig.isConnected)return;
  const arm=(side,lower=false)=>'<div class="guardian-limb '+side+(lower?' lower':'')+'"><div class="limb-strike"><div class="limb-recoil"><div class="limb-breathe"><img src="'+urls[side==='left'?0:1]+'" alt="" draggable="false"></div></div></div></div>';
  rig.innerHTML=(id==='serpent'?arm('right').replace(urls[1],'img/serpent-tail.png'):(cfg.arms===4?arm('left',true)+arm('right',true):'')+arm('left')+arm('right'))+
   '<div class="guardian-spell spell-charge"><img src="'+urls[2]+'" alt="" draggable="false"></div><div class="guardian-spell spell-projectile"><img src="'+urls[3]+'" alt="" draggable="false"></div>';
  rig.dataset.ready='true';
 }).catch(error=>{console.error('Tileset do Boss: '+id,error);rig.dataset.ready='error';});
}

let titanAnimationTimer=null;
let titanAttackTimer=null;
function titanState(){
 if(!G.bossActive||!guardianMotion())return null;
 if(!G.titanAttack||typeof G.titanAttack!=='object')G.titanAttack={hand:0,meteor:0,turn:0};
 return G.titanAttack;
}
function titanChargeRate(){
 const star=G.bossStar||1,level=Math.max(1,Number(G.level)||1);
 const averageDamage=(2+(level-1)*.15)*1.125*(1-(BOSSES[G.bossIdx].damageReduction||0));
 const estimated=Math.max(2,Math.ceil(G.bossMaxHp/Math.max(.5,averageDamage)));
 return Math.min(55,Math.max(20,100/Math.max(2,Math.ceil(estimated*.65))))+Math.min(15,(star-1)*4);
}
function renderTitanMeters(){
 const root=document.getElementById('titan-attack-ui');if(!root)return;
 const st=titanState();root.hidden=!st;if(!st)return;
 const two=(G.bossStar||1)>=2;document.getElementById('titan-meteor-meter').hidden=!two;const cfg=guardianMotion();document.getElementById('titan-hand-label').textContent=cfg.hand;document.getElementById('titan-meteor-label').textContent=cfg.meteor;
 for(const key of ['hand','meteor']){
  const n=Math.max(0,Math.min(100,st[key]||0));
  document.getElementById('titan-'+key+'-fill').style.width=n+'%';
  document.getElementById('titan-'+key+'-value').textContent=Math.round(n)+'%';
 }
}
function clearTitanAnimation(){window.TitanAnimation?.reset();clearTimeout(titanAnimationTimer);titanAnimationTimer=null;clearTimeout(titanAttackTimer);titanAttackTimer=null;document.getElementById('boss-overlay')?.classList.remove('titan-hit','titan-punch','titan-meteor','titan-screen-shake');}
function titanTakeHit(perfect,damage){
 if(BOSSES[G.bossIdx]?.id==='titan')window.TitanAnimation?.play('hurt');
 const ov=document.getElementById('boss-overlay');if(!ov)return;
 ov.classList.remove('titan-hit');void ov.offsetWidth;ov.classList.add('titan-hit');
 SFX.bossHurt();
 clearTimeout(titanAnimationTimer);titanAnimationTimer=setTimeout(()=>ov.classList.remove('titan-hit'),1400);
}
function titanCharge(result){
 const st=titanState();if(!st)return;
 st.turn=(st.turn||0)+1;
 const base=titanChargeRate(),extra=result==='error'?(G.consecutiveErrors>=2?25:15):0;
 for(const key of ['hand','meteor']){
  if(key==='meteor'&&(G.bossStar||1)<2)continue;
  const gain=key==='hand'?base:base*.62;
  // Perfect still suppresses charge, but the first placed block always registers.
  const floor=result==='perfect'?Math.min(5,gain):0;
  st[key]=Math.max(floor,Math.min(100,(st[key]||0)+gain+extra-(result==='perfect'?25:0)));
 }
 if(result==='perfect')addLog('Perfect • desconto de até 25 p.p. na carga; mínimo 5%','s','boss');
 if(result==='error')addLog('Erro • energia dos ataques do Boss acelerada','f','boss');
 renderTitanMeters();
 // Do not interrupt the block placement: attack animation starts after the existing resolution delay.
 if(st.hand>=100)titanExecute('hand');
 else if((G.bossStar||1)>=2&&st.meteor>=100)titanExecute('meteor');
}
function titanExecute(kind){
 const st=titanState();if(!st||st[kind]<100||titanAttackTimer!==null)return;
 const attackState=st;
 st[kind]=0;renderTitanMeters();
 const ov=document.getElementById('boss-overlay');
 const label=guardianMotion()[kind];
 addLog(BOSSES[G.bossIdx].name+' prepara '+label,'e','boss');
 const valid=()=>titanState()===attackState&&G.bossActive&&!battleVictory&&G.stab>0;
 const finish=()=>{titanAttackTimer=null;ov?.classList.remove('titan-punch','titan-meteor','titan-screen-shake');};
 titanAttackTimer=setTimeout(()=>{
  if(!valid()){finish();return;}
  ov?.classList.remove('titan-hit','titan-punch','titan-meteor');
  if(ov){prepareGuardianStrike();void ov.offsetWidth;ov.classList.add(kind==='hand'?'titan-punch':'titan-meteor');}
  if(BOSSES[G.bossIdx]?.id==='titan')window.TitanAnimation?.play(kind);
  // Let preparation, advance and contact finish before the camera reacts.
  titanAttackTimer=setTimeout(()=>{
   if(!valid()){finish();return;}
   spawnGuardianDebris();
   if(BOSSES[G.bossIdx]?.id==='titan')window.TitanAnimation?.impact();
   ov?.classList.add('titan-screen-shake');
   showBossDamageSlash(1);SFX.bossHit();
   const critical=Math.random()<.30;
   const applied=loseStability((kind==='hand'?6:3)*(critical?1.5:1),label);
   if(kind==='meteor'){
    const previous=G.height;G.height=Math.max(0,G.height-1);
    if(previous>G.height)animateHeightLoss(previous-G.height);
    G.titanMeteorDebuff=2;
   }
   updateHUD();saveGame();
   titanAttackTimer=setTimeout(()=>{
    if(titanState()!==attackState||!G.bossActive||battleVictory){finish();return;}
    ov?.classList.remove('titan-screen-shake');
    addLog(label+(critical?' • CRÍTICO ×1,5':'')+' • −'+applied+' estabilidade'+(kind==='meteor'?' • −1 altura • próximo erro agravado por 2 turnos':''),'f','boss');
    showCombatResult('DANO RECEBIDO',applied,critical,false,true);
    showActionFeedback(critical?'CRÍTICO DO BOSS':label,'−'+applied+' estabilidade','error');
    syncBattle();saveGame();
    if(G.stab<=0){finish();gameOver();return;}
    titanAttackTimer=setTimeout(finish,3400);
   },1050);
  },kind==='hand'?3100:3300);
 },Math.max(2000,feedbackUntil-performance.now()+100));
}
function playerBaseDamage(level=G.level){return Math.round((2+(Math.max(1,Number(level)||1)-1)*.15)*100)/100;}
function rebalanceBossHealth(state){
 if(state.bossHealthRevision===1)return;
 if(state.bossActive&&BOSSES[state.bossIdx]){
  const ratio=Math.max(0,Math.min(1,state.bossHp/Math.max(1,state.bossMaxHp)));
  state.bossMaxHp=Math.ceil(BOSSES[state.bossIdx].hp*bossHpMultiplier(state.bossStar||1));
  state.bossHp=state.bossMaxHp*ratio;
 }
 state.bossHealthRevision=1;
}
function bossHitOutcome(b,star,perfect){
 const base=playerBaseDamage();const critical=Math.random()<.25;const damage=base*(perfect?2:1)*(critical?1.5:1)*(1-(b.damageReduction||0));if(critical)addLog('CRÍTICO • dano ×1,5','s','boss');
 const requestedRegen=(b.hpRegenOnHit||0)+(star>=3?(star>=5?.45:.2):0);
 // Resistance remains intact; regeneration can never erase a successful hit.
 const regen=Math.min(requestedRegen,Math.max(0,damage-.5));
 return {damage,regen,critical};
}
function onSuccess(src,quality){
  if(queueMechanicResult(()=>onSuccess(src,quality)))return;
  beginActionResolution();
  const perfect=quality==='perfect',context=G.actionContext;
  G.hits=(G.hits||0)+1;if(perfect){G.perfectHits=(G.perfectHits||0)+1;G.runStats.perfects++;}
  G.runStats.actions++;updateSeries(true);
  const before=G.stab;G.stab=Math.round(Math.min(G.maxStab,G.stab+2*(perfect?2:1)));
  const gold=rewardAction(perfect),pt=choosePiece(),hGain=pt.hv*(perfect?2:1);G.height+=hGain;G.bestHeight=Math.max(G.bestHeight,G.height);
  addLog((perfect?'Perfect':'Acerto')+' • '+src+' • +'+hGain+' Altura • +'+gold+' Gold • +'+(perfect?20:10)+' XP • Estabilidade '+before+' → '+G.stab,'s',context);
  addPieceVisual(pt,perfect,false);
  if(!G.bossActive)addThreat(perfect?'perfect':'hit');
  applyElementEffect(pt,perfect);
  if(G.bossActive){
    const b=BOSSES[G.bossIdx],star=G.bossStar||1;
    const {damage,regen,critical}=bossHitOutcome(b,star,perfect);
    if(guardianMotion())titanTakeHit(perfect,damage);
    const gains='+'+(G.stab-before)+' estabilidade • +'+hGain+' altura • +'+gold+' ouro • +'+(perfect?20:10)+' XP';
    scheduleCombatResult(()=>showCombatResult('DANO NO BOSS',damage,critical,perfect,false,gains),1550);
    G.bossHp=Math.max(0,G.bossHp-damage);
    addLog('Bloco de '+b.name+' colocado na torre do Boss (visual; sem altura extra). Dano '+damage.toFixed(2)+' • HP '+G.bossHp.toFixed(2)+'/'+G.bossMaxHp,'s','boss');
    if(G.bossHp>0){
      updateBossPhase();
      const old=G.bossHp;G.bossHp=Math.min(G.bossMaxHp,G.bossHp+regen);
      if(G.bossHp>old)addLog('Regeneração • +'+(G.bossHp-old).toFixed(2)+' HP • dano líquido '+(damage-(G.bossHp-old)).toFixed(2)+' • HP '+G.bossHp.toFixed(2),'e','boss');
      if(star>=2)loseStability(G.bossPhaseTwo&&!G.bossPhaseJustStarted?3:2,'Pressão desperta anunciada');G.bossPhaseJustStarted=false;
      if(guardianMotion())titanCharge(perfect?'perfect':'hit');
      updateBossUI();
    }else defeatBoss(perfect);
  }else{
    const gained=G.stab-before;
    scheduleCombatResult(()=>showActionFeedback(perfect?'PERFECT':'ACERTO','+'+gained+' estabilidade • +'+hGain+' altura • +'+gold+' ouro • +'+(perfect?20:10)+' XP',perfect?'perfect':'hit'),1600);
  }
  if(src==='dice'&&G.activePowerUps.goldenDice>0){G.activePowerUps.goldenDice--;if(!G.activePowerUps.goldenDice)showEventToast('Dados Dourados concluídos');}
  if(G.titanMeteorDebuff>0)G.titanMeteorDebuff--;
  finishActionEffects(perfect);spawnFloat('+'+hGain+' 📏','#3de87a');spawnFloat('+'+gold+' 💰','#f0c040',28);
  checkMilestones();checkAchievements();updateHUD();if(G.stab<=0)gameOver();saveGame();
}
function onFail(){
  if(queueMechanicResult(onFail))return;
  animateRejectedPiece();
  beginActionResolution();
  G.misses=(G.misses||0)+1;G.runStats.actions++;G.runStats.errors++;updateSeries(false);awardXP(3);
  
  let loss=G.consecutiveErrors>=2?15:10;
  if(G.bossActive&&guardianMotion()&&G.titanMeteorDebuff>0)loss+=3;
  if(G.waterShield){loss*=.5;G.waterShield=false;addLog('Equilíbrio da Água consumido: perda do erro reduzida em 50%','',''+G.actionContext);}
  loss=loseStability(loss,'Erro • +3 XP');
  if(G.bossActive){
    const b=BOSSES[G.bossIdx],before=G.bossHp,h=G.height;
    G.bossHp=Math.min(G.bossMaxHp,G.bossHp+(b.hpRegenOnFail||0));G.height=Math.max(0,G.height-(b.heightLoss||0));
    const lostH=h-G.height;
    if(lostH>0) animateHeightLoss(lostH);
    addLog(b.name+' • regeneração +'+(G.bossHp-before).toFixed(2)+' HP • HP '+G.bossHp.toFixed(2)+' • −'+lostH+' Altura • altura restante '+G.height,'f','boss');
    if(guardianMotion())titanCharge('error');
  }else addThreat('error');
  if(G.titanMeteorDebuff>0)G.titanMeteorDebuff--;
  finishActionEffects();spawnFloat(loss?'−'+loss+' ⚖':'PERDA ANULADA',loss?'#e84050':'#f3d36a');
  scheduleCombatResult(()=>showActionFeedback('ERRO',loss?'−'+loss+' estabilidade':'Perda anulada','error'),1850);
  applyTilt();updateHUD();if(G.stab<=0)gameOver();saveGame();
}
function updateBossPhase(){
  if(!['titan','alien','death'].includes(BOSSES[G.bossIdx]?.id)&&(G.bossStar||1)>=4&&G.bossHp>0&&G.bossHp<=G.bossMaxHp*.5&&!G.bossPhaseTwo){
    G.bossPhaseTwo=true;showEventToast('FASE 2 • pressão passa a −3 Estabilidade por acerto');
    addLog('Fase 2 anunciada aos 50% HP • pressão −3 Estabilidade por acerto a partir da próxima ação','e','boss');
    G.bossPhaseJustStarted=true;
  }
}

function bossHpMultiplier(star){if(star===1)return 1;if(star===2)return 2.35;if(star===3)return 3;if(star===4)return 3.75;return 3.8*Math.pow(1.2,star-5);}
function spawnGuardian(){
  if(G.bossActive||!G.bossPending)return;
  if(G.eventId)endWorldEvent("entrada do Boss");
  G.bossIdx=(G.bossDefeated?.length||0)%BOSSES.length;G.bossStar=bossStar();victoryVisualPending=false;const b=BOSSES[G.bossIdx];
  clearTitanAnimation();G.bossMaxHp=Math.ceil(b.hp*bossHpMultiplier(G.bossStar));G.bossHp=G.bossMaxHp;G.bossHealthRevision=1;G.bossActive=true;G.titanAttack={hand:0,meteor:0,turn:0};G.bossPending=false;G.bossPhaseTwo=false;G.battlePieces=[];battleVictory=false;lastBattleId=null;updateThreatState();
  addLog('Início: '+b.name+' • ciclo '+G.bossStar+' • HP '+G.bossHp+' • Estabilidade '+G.stab+' • '+bossModifiers(G.bossStar)+' • kit: resistência '+Math.round(b.damageReduction*100)+'%, regeneração por acerto '+b.hpRegenOnHit+', por erro '+b.hpRegenOnFail+', perda de altura por erro '+b.heightLoss,'e','boss');
  G.savedTower=(G.pieces||[]).map(p=>({...p}));showEventToast(b.name+' chegou • '+bossModifiers(G.bossStar));syncBattle();saveGame();
}
function checkBossSpawn(){if(G.bossPending&&!G.bossActive)spawnGuardian();}
function defeatBoss(perfect=false){
  if(!G.bossActive)return;
  const b=BOSSES[G.bossIdx],star=G.bossStar||bossStar(),mult=perfect?2:1;G.titanAttack=null;G.titanMeteorDebuff=0;G.bossDefeated.push(G.bossIdx);G.bossBlockCounts[b.id]=(G.bossBlockCounts[b.id]||0)+1;G.bossActive=false;G.threat=0;G.bossPending=false;updateThreatState();
  const stabilityBefore=G.stab;G.stab=Math.round(Math.min(G.maxStab,G.stab+Math.max(5,G.maxStab*.25)*mult));G.lastBossRecovery=G.stab-stabilityBefore;
  const gold=150*star*mult*(G.eventId==='festival'?2:1),xp=100*star*mult;G.coins+=gold;G.totalCoins+=gold;G.runStats.goldEarned+=gold;awardXP(xp);
  const essence=(star>=5?3:star===4?2:star===3?1:(Math.random()<(star===2?.80:.70)?1:0))*mult;G.divineEssence+=essence;G.runStats.essenceEarned+=essence;G.runStats.bosses++;
  const trophy=resolvePiece('boss-'+b.id);G.pieces.push({...trophy});G.pieces=G.pieces.slice(-10);battleVictory=true;victoryVisualPending=true;
  if(G.bossDefeated.length%BOSSES.length===0){G.prestige=(G.prestige||0)+1;G.prestigeAvailable=(G.prestigeAvailable||0)+1;repairAscensionUnlock();showEventToast(G.ascensionReady?'Rotação completa • próximo card de Era liberado':'Rotação completa • próxima rotação de Bosses mais forte');}
  addLog('🎉 '+b.name+' '+ '★'.repeat(Math.min(5,star))+' • +'+xp+' XP • +'+gold+' Gold'+(essence?' • +'+essence+' Essência':' • sem Essência')+' • +'+G.lastBossRecovery+' Estabilidade • bloco troféu '+b.name+' adicionado • batalha encerrada','e','boss');flushLogBuffer();syncBattle();updateHUD();saveGame();
  const fb=document.getElementById('battle-feedback');
  if(fb){fb.classList.add('victory-pop');fb.textContent='VITÓRIA • +'+G.lastBossRecovery+' ⚖';}
  clearTimeout(victoryTimer);victoryTimer=setTimeout(()=>{
    victoryVisualPending=false;clearTitanAnimation();prepareGuardianDefeat();if(b.id==='titan')window.TitanAnimation?.play('defeat');syncBattle();
    document.getElementById('battle-feedback').textContent='VITÓRIA';SFX.bossDefeat();spawnBossParticles();
    showActionFeedback('GUARDIÃO SUPERADO','+'+G.lastBossRecovery+' estabilidade • bloco conquistado','boss');
    victoryTimer=setTimeout(finishBossVictory,3600);
  },2500);
}

// Single final battle presenter: no older presentation wrappers execute here.
let displayedGuardian=null,victoryVisualPending=false;
const guardianImageCache=new Map();
function warmGuardian(index){
 const b=BOSSES[index%BOSSES.length];if(!b||guardianImageCache.has(b.id))return;
 const image=new Image();image.decoding='async';image.onload=alignBossPlatform;image.src='img/boss-'+b.id+'.webp';guardianImageCache.set(b.id,image);
 BossSprites.load(b.id).catch(()=>{});
 if(typeof image.decode==='function')image.decode().catch(()=>{});
}
function syncBattle(){
 updateDamageHUD();watchBossPlatform();
 const overlay=document.getElementById('boss-overlay');if(!overlay)return;
 const visible=curScreen==='game'&&(G.bossActive||battleVictory),opening=overlay.hidden&&visible;
 if(curScreen==='game'&&musicEnabled&&!document.hidden)playGameMusic();renderLastGuardian();
 // Bind image and particles before revealing the overlay.
 if(!visible){
  if(!overlay.hidden){
   clearTimeout(overlay._hideTimer);
   overlay.classList.remove('shown');
   overlay._hideTimer=setTimeout(()=>{overlay.hidden=true;},480);
  }
  document.getElementById('screen-game')?.classList.remove('battle-covered');
  return;
 }
 clearTimeout(overlay._hideTimer);
 const star=visualBossStar(),b=BOSSES[G.bossIdx%BOSSES.length],form=['','Original','Desperta','Corrompida','Astral','Divina'][star];
 if(displayedGuardian!==b.id){
   displayedGuardian=b.id;warmGuardian(G.bossIdx);warmGuardian(G.bossIdx+1);
   overlay.style.setProperty('--guardian-art',"url('img/boss-"+b.id+".webp')");
   overlay.dataset.family=String(BOSS_THEMES[b.id]||0);overlay.dataset.guardian=b.id;configureGuardianMotion(b.id);
   buildGuardianEffects(b.id);renderBossTower();
 }
 if(opening){renderBossTower();if(musicEnabled)playGameMusic();}
 if(b.id==='titan')window.TitanAnimation?.setState({health:G.bossHp/Math.max(1,G.bossMaxHp),victory:battleVictory});
 overlay.dataset.star=String(star);overlay.dataset.era=String(currentEra());renderTitanMeters();
 document.getElementById('battle-name').textContent=(battleVictory?'Guardião superado':b.name)+' • '+'★'.repeat(star);
 document.querySelector('.boss-header .eyebrow').textContent=form.toUpperCase()+' • ROTAÇÃO '+(G.bossStar||1);
 document.getElementById('battle-hp').textContent=Math.max(0,G.bossHp).toFixed(1)+' / '+G.bossMaxHp.toFixed(1)+' HP';
 document.getElementById('battle-floor').textContent='ANDAR '+G.height;const stab=document.getElementById('battle-stability');if(stab)stab.textContent='⚖ '+G.stab+' / '+G.maxStab;
 const bar=document.getElementById('battle-progress');bar.max=G.bossMaxHp||1;bar.value=Math.max(0,G.bossHp);
 document.getElementById('battle-action').hidden=battleVictory;document.getElementById('battle-return').hidden=!battleVictory||victoryVisualPending;overlay.classList.toggle('victory',battleVictory&&!victoryVisualPending);
 document.getElementById('battle-rewards').textContent=battleVictory?'Bloco conquistado • +'+(G.lastBossRecovery||0)+' estabilidade':'Recompensa • '+(150*(G.bossStar||1))+' Gold • '+(100*(G.bossStar||1))+' XP';
 const names=['','Dados','Timing','Selos Elementais','Núcleo Rúnico'];document.getElementById('battle-mechanic').textContent=battleVictory?'Continue sua jornada.':names[G.phase]+' • nível '+(G.phase===4?nucleusLevel():mechanicLevel())+' • '+bossModifiers(G.bossStar);
 overlay.hidden=false;document.getElementById('screen-game')?.classList.add('battle-covered');
 if(opening){overlay.classList.remove('shown');void overlay.offsetWidth;requestAnimationFrame(()=>requestAnimationFrame(()=>overlay.classList.add('shown')));}
 else overlay.classList.add('shown');
}
function buildGuardianEffects(id){
 // The old unsynchronised attack loop must not compete with the charged strike.
 if(window._archAtkTimer){clearInterval(window._archAtkTimer);window._archAtkTimer=null;}
 document.getElementById('guardian-effects')?.remove();
 buildGuardianForeground(id);
}

function spawnArchAttackFromCenter(){
 const effects=document.getElementById('guardian-effects');if(!effects||!G.bossActive) return;
 for(let k=0;k<3;k++){
   const p=document.createElement('i');
   p.className='arch-attack-burst';
   p.style.cssText='--bx:'+(35+Math.random()*30)+'%;--ang:'+(-30+Math.random()*60)+'deg;';
   effects.appendChild(p);
   setTimeout(()=>p.remove(), 1200);
 }
}
/* Distribuição controlada: pesos configurados após o desbloqueio das quatro mecânicas.
   Bolsa de oito ações: 2 de cada mecânica, com duas vagas extras distribuídas
   conforme os pesos 30/20/25/25. Evita sequências longas e mantém variedade. */
const MECHANIC_WEIGHTS={1:[100],2:[60,40],3:[40,30,30],4:[30,20,25,25]};
function selectNextMechanic(state=G){
  const count=unlockedMechanics(state);
  if(count===1)return 1;
  const history=Array.isArray(state.mechanicHistory)?state.mechanicHistory:[];
  const last=history[history.length-1],previous=history[history.length-2];
  const weights=MECHANIC_WEIGHTS[count];
  let candidates=weights.map((w,i)=>({phase:i+1,weight:w}));
  // Nenhuma mecânica aparece três vezes consecutivas.
  if(last===previous)candidates=candidates.filter(x=>x.phase!==last);
  // Ao desbloquear todas, cada mecânica deve aparecer em até oito ações.
  if(count===4&&history.length>=7){
    const missing=candidates.filter(x=>!history.slice(-7).includes(x.phase));
    if(missing.length)candidates=missing;
  }
  const sum=candidates.reduce((n,x)=>n+x.weight,0);
  let roll=Math.random()*sum;
  for(const item of candidates){roll-=item.weight;if(roll<0)return item.phase;}
  return candidates[candidates.length-1].phase;
}
function completeResolvedAction(){
  G.highStabTurns=(G.stab>=90?Math.max(0,G.highStabTurns||0)+1:0);
  if(G.divineProtection>0)G.divineProtection--;if(!G.lastActionWasBoss){advanceEvent();if(G.windActions>0&&G.windStartedAction!==G.actionIndex)G.windActions--;}G.lastActionWasBoss=false;flushLogBuffer();G.actionIndex=(G.actionIndex||0)+1;G.mechanicHistory=Array.isArray(G.mechanicHistory)?G.mechanicHistory:[];G.mechanicHistory.push(G.phase);G.mechanicHistory=G.mechanicHistory.slice(-7);G.phase=selectNextMechanic();setPhaseUI();updateHUD();saveGame();
}
function checkPhaseShift(){if(actionPresentation)return;completeResolvedAction();}
function handleAction(){
  if(titanAttackTimer!==null||actionPresentation||modalOpen||battleVictory||G.stab<=0||performance.now()<feedbackUntil||curScreen!=='game'||document.hidden)return;
  if(G.bossPending&&!G.bossActive){spawnGuardian();return;}
  SFX.click();initAudio();if(G.phase===1)openDiceModal();else if(G.phase===2)openTimingModal();else if(G.phase===3)openSealModal();else openNucleusModal();
}
function setPhaseUI(){updateActionButton();}
function updateActionButton(){
  const b=document.getElementById('action-btn'),label=document.getElementById('phase-label');if(!b)return;
  const info={1:['🎲 Jogar Dados','Mecânica: Dados • Sorte + risco','btn-dice'],2:['⏱ Iniciar Timing','Mecânica: Timing • Reflexo + precisão','btn-timing'],3:['✦ Selos Elementais','Mecânica: Selos • Percepção visual','btn-seq'],4:['🌀 Núcleo Rúnico','Mecânica: Núcleo • Raciocínio espacial','btn-seq']}[G.phase];
  b.textContent=info[0];b.className=info[2];if(label)label.textContent=info[1]+' • Nível '+(G.phase===4?nucleusLevel():mechanicLevel());
}

function updateThreatState(){
  const value=clamp(G.threat,0,100);
  warmGuardian((G.bossDefeated?.length||0)%BOSSES.length);
  const fill=document.getElementById('power-fill'),pct=document.getElementById('power-pct'),row=document.getElementById('power-row');
  if(fill)fill.style.width=value+'%';
  if(pct)pct.textContent=Math.round(value);
  if(row)row.classList.toggle('threat-high',value>=90&&!G.bossActive);

  const screen=document.getElementById('screen-game');
  if(screen){
    const active=!G.bossActive&&curScreen==='game';
    screen.dataset.threat=String(active?(value>=100?5:value>=90?4:value>=75?3:value>=50?2:value>=25?1:0):0);
    screen.classList.toggle('threat-watch',active&&value>=50&&value<75);
    screen.classList.toggle('threat-react',active&&value>=75&&value<90);
    // Em 100% mantém o feedback crítico existente enquanto o Boss aguarda o próximo turno.
    screen.classList.toggle('threat-critical',active&&value>=90);
  }

  syncDangerMusic();
}
function updatePowerUI(){updateThreatState();}

function updateStabilityPresentation(){
  const ratio=G.stab/Math.max(1,G.maxStab);
  // Recupera apenas a apresentação boa da versão anterior; o minigame crítico continua desativado.
  applyTilt();
  const danger=curScreen==='game'&&G.stab>0&&ratio<=.30;
  const game=document.getElementById('screen-game'),boss=document.getElementById('boss-overlay');
  const stage=ratio<=0?5:ratio<=.1?4:ratio<=.3?3:ratio<=.5?2:ratio<=.7?1:0;
  if(game){game.dataset.stability=String(curScreen==='game'?stage:0);game.classList.toggle('danger-mode',danger);}
  if(boss)boss.dataset.stability=String(G.bossActive?stage:0);
  if(boss)boss.classList.toggle('danger-mode',danger&&G.bossActive);

  syncDangerMusic();
}

function updateHUD(){
  // O HUD base já chama dinamicamente updateJourney() e updatePowerUI(); evita duplicar render/timers.
  updateHUDBase1();
  applyEraVisuals();
  updateStabilityPresentation();
}
function updateJourney(){
 updateDamageHUD();
  repairAscensionUnlock();const eraButton=document.getElementById('era-ready-btn');if(eraButton){eraButton.hidden=!G.ascensionReady||G.bossActive||battleVictory;eraButton.textContent=currentEra()<4?'✦ AVANÇAR ERA • 11 GUARDIÕES SUPERADOS':'✦ RITUAL DISPONÍVEL';}
  const level=document.getElementById('level-label'),xp=document.getElementById('xp-label'),bar=document.getElementById('xp-progress');
  const next=totalXpForLevel((G.level||1)+1),prev=totalXpForLevel(G.level||1);
  if(level)level.textContent='NÍVEL '+G.level+' • ERA '+ERA_DATA[currentEra()].name.toUpperCase();if(xp)xp.textContent=G.xpTotal+' / '+next+' XP total';if(bar){bar.min=prev;bar.value=G.xpTotal;bar.max=next;}
  const e=EVENTS.find(x=>x.id===G.eventId),status=document.getElementById('event-status');if(status)status.textContent=e?e.name+' • '+G.eventLeft+' ações • '+e.desc:G.bossActive?'Ameaça congelada • batalha ativa':G.ascensionReady?'Próxima Era liberada • selecione o card em Eras':'Próximo Guardião em '+Math.max(0,100-G.threat)+'% de Ameaça';
  renderEventSide();fitTower();const side=document.getElementById('combo-side');if(side){side.hidden=!G.streak&&!G.bestStreak;side.innerHTML='<span class="side-label">SÉRIE</span><span class="side-value">'+G.streak+'</span><span class="side-note">Recorde<br>'+G.bestStreak+'</span>';}
  syncBattle();
}
function applyEraVisuals(){
  const screen=document.getElementById('screen-game');if(!screen)return;screen.dataset.era=String(currentEra());screen.style.setProperty('--era-image',"url('img/era-"+currentEra()+".webp')");
  let badge=screen.querySelector('.era-badge');if(!badge){badge=document.createElement('div');badge.className='era-badge';screen.appendChild(badge);}badge.textContent='ERA '+currentEra()+' • '+ERA_DATA[currentEra()].name.toUpperCase();
}
function updateTierBackground(){
  applyEraVisuals();const glow=document.getElementById('totem-glow'),colors=['#53c86e','#f05a22','#9e42cf','#4c88f0','#f3d76c'];if(glow)glow.style.background='radial-gradient(ellipse,'+colors[currentEra()]+'55,transparent 70%)';
}

function endWorldEvent(reason='duração concluída'){
  if(!G.eventId)return;
  const e=EVENTS.find(e=>e.id===G.eventId);
  addLog((e?.name||G.eventId)+' encerrado • '+reason,'e','event');
  G.eventTriggerCooldown=Math.max(G.eventTriggerCooldown||0,e?.cooldown||0);
  const weather=document.getElementById('event-weather');
  const side=document.getElementById('event-side');
  if(weather){weather.classList.add('event-leaving');}
  if(side){side.classList.add('event-leaving');}
  const prevId=G.eventId;
  setTimeout(()=>{
    if(G.eventId===prevId||!G.eventId){
      G.eventId=null;G.eventLeft=0;
      if(weather)weather.classList.remove('event-leaving');
      if(side)side.classList.remove('event-leaving');
      renderEventSide();
    }
  },420);
  G.eventId=null;G.eventLeft=0;
}
function startWorldEvent(forced=false){
  if(G.bossActive||G.eventId)return false;
  const available=EVENTS.filter(e=>forced||(G.eventCooldowns[e.id]||0)<=0);
  const weight=e=>e.weight*((G.highStabTurns||0)>5&&['quake','corruption'].includes(e.id)?3:1);const total=available.reduce((n,e)=>n+weight(e),0);if(!total)return false;
  let roll=Math.random()*total,event=available[0];
  for(const e of available){roll-=weight(e);if(roll<0){event=e;break;}}
  G.eventId=event.id;G.eventLeft=event.dur;G.eventStartedAction=G.actionIndex;
  G.eventCooldowns[event.id]=event.cooldown;
  addLog(event.name+' iniciado • '+event.desc+' • '+event.dur+' ações','e','event');
  if(event.id==='quake'){
    const before=G.stab;G.stab=Math.round(Math.max(Math.ceil(G.maxStab*.2),G.stab*.5));
    addLog('Tremor: Estabilidade '+before+' → '+G.stab,'e','event');
  }
  showEventToast(event.name+' • '+event.desc);SFX.event();renderEventSide();
  const weather=document.getElementById('event-weather');
  const side=document.getElementById('event-side');
  if(weather){weather.classList.remove('event-leaving');weather.classList.add('event-entering');setTimeout(()=>weather.classList.remove('event-entering'),500);}
  if(side){side.classList.remove('event-leaving');side.classList.add('event-entering');setTimeout(()=>side.classList.remove('event-entering'),500);}
  return true;
}
function advanceEvent(){
  if(G.bossActive)return;
  Object.keys(G.eventCooldowns||{}).forEach(id=>G.eventCooldowns[id]=Math.max(0,G.eventCooldowns[id]-1));
  if(G.eventId){
    if(G.eventStartedAction===G.actionIndex)return;
    G.eventLeft=Math.max(0,G.eventLeft-1);
    addLog(EVENTS.find(e=>e.id===G.eventId)?.name+' • '+G.eventLeft+' ações restantes','e','event');
    if(G.eventLeft===0)endWorldEvent();return;
  }
  if(G.eventTriggerCooldown>0){G.eventTriggerCooldown--;return;}
  // O Vento afeta duas ações futuras fora de Boss, nunca a ação que o colocou.
  const wind=G.windActions>0&&G.windStartedAction!==G.actionIndex;
  const high=G.highStabTurns>5; if(Math.random()<(high?.26:(wind?.16:.08)))startWorldEvent();
}
function beginActionResolution(){
  G.lastActionWasBoss=!!G.bossActive;G.actionEventId=G.eventId;
  G.actionContext=G.bossActive?'boss':G.eventId?'event':'partida';G.blessingUsed=false;
  if(G.eventId)addLog('Ação em '+EVENTS.find(e=>e.id===G.eventId)?.name+' • '+G.eventLeft+' ações restantes','','event');
}
function loseStability(amount,reason){
  const before=G.stab;
  if(G.eventId==='blessing'&&!G.blessingUsed){G.blessingUsed=true;amount=0;}
  G.stab=Math.round(Math.max(G.divineProtection>0?1:0,G.stab-Math.max(0,amount)));
  const lost=before-G.stab;
  addLog(reason+' • −'+lost+' Estabilidade • restante '+G.stab,'f',G.actionContext);
  return lost;
}
function changeThreat(amount){
  G.threat=clamp(G.threat+amount,0,100);G.bossPending=!G.bossActive&&G.threat>=100;
}
function applyElementEffect(pt,perfect=false){
  const before=G.stab,threat=G.threat;
  const heal=n=>G.stab=Math.round(Math.min(G.maxStab,G.stab+n*(perfect?2:1)));
  switch(pt.id){
    case 'stone':heal(G.stab<=G.maxStab*.3?3:1);break;
    case 'forest':if(G.stab<G.maxStab*.5)heal(2);break;
    case 'water':G.waterShield=true;break;
    case 'wind':G.windActions=2;G.windStartedAction=G.actionIndex;break;
    case 'light':changeThreat(-5);heal(3);break;
    case 'shadow':changeThreat(7);heal(3);break;
    case 'crystal':startWorldEvent(true);break;
    case 'chaos':endWorldEvent('efeito do bloco Caos');break;
    case 'ancient':changeThreat(50);loseStability(20,'Legado Ancestral');break;
    case 'gold':changeThreat(-50);break;
    case 'divine':heal(10);changeThreat(-10);break;
  }
  addLog('Bloco '+pt.name+' • bônus'+(perfect?' Perfect ×2':'')+' • '+pt.effectDesc+' Estabilidade '+before+' → '+G.stab+' • Ameaça '+threat+'% → '+G.threat+'%','s',G.actionContext);
}
function finishActionEffects(perfect=false){
  if(G.actionEventId==='corruption'&&!G.lastActionWasBoss&&G.stab>0){loseStability(5,'Ruptura Sombria • desgaste da torre');}
  if(G.actionEventId==='spring'&&!G.lastActionWasBoss&&G.stab>0){
    const before=G.stab;G.stab=Math.round(Math.min(G.maxStab,G.stab*(perfect?1.10:1.05)));
    addLog('Primavera • +'+(G.stab-before)+' Estabilidade • restante '+G.stab,'e','event');
  }
}

function renderEventSide(){
  const displayId=G.eventId||(performance.now()<springVisualUntil?'spring':null);
  const side=document.getElementById('event-side'),weather=document.getElementById('event-weather'),e=EVENTS.find(x=>x.id===displayId);
  const arena=document.getElementById('arena');
  if(arena){
    arena.dataset.event=displayId||'';
    const family={storm:1,gale:1,blessing:3,eclipse:2,quake:0,festival:0,spring:3,convergence:2,corruption:2}[displayId];
    arena.style.setProperty('--event-art',"url('img/ambiente-evento-"+(family??0)+".webp')");
    // Individual images use the same centered framing as the normal arena.
    arena.style.setProperty('--event-position','50% 50%');
    let evLayer=document.getElementById('arena-event-layer');
    if(!evLayer){evLayer=document.createElement('div');evLayer.id='arena-event-layer';evLayer.setAttribute('aria-hidden','true');arena.insertBefore(evLayer,arena.firstChild);}
  }
  if(!side||!weather)return;
  side.hidden=!e;
  weather.classList.toggle('event-intense',!!e);
  const sideKey=(displayId||'')+':'+G.eventLeft;
  if(e&&side.dataset.renderKey!==sideKey){
    const parts=e.name.split(' ');
    side.style.setProperty('--event-color',e.col);
    side.innerHTML='<span class="side-label">EVENTO</span><img class="event-art" src="img/event-'+e.id+'.webp" alt=""><span class="event-icon">'+parts.shift()+'</span><strong class="side-title">'+esc(parts.join(' '))+'</strong><span class="side-note">'+esc(e.desc)+'</span><progress value="'+G.eventLeft+'" max="'+Math.max(1,e.dur)+'"></progress><span class="side-note">'+(e.dur?G.eventLeft+' ações':'Imediato')+'</span>';
  }else if(!e){side.innerHTML='';side.style.removeProperty('--event-color');}
  side.dataset.renderKey=sideKey;
  const eventId=String(displayId||'');
  if(weather.dataset.eventId===eventId)return;
  weather.dataset.eventId=eventId;
  weather.dataset.event=eventId;
  weather.innerHTML='';
  if(!e)return;
  for(let i=0;i<40;i++){
    const p=document.createElement('span');p.className='weather-particle'+(e.id==='festival'?' coin-particle':'');
    if(e.id==='festival'){
      // Partículas de moeda - festival de Gold
      p.textContent='🪙';
      p.classList.add('gold-coin');
    } else if(e.id==='blessing'){
      p.textContent='✦';
    } else if(e.id==='eclipse'){
      p.textContent='◆';
    } else if(e.id==='spring'){
      p.textContent='✿';
    } else if(e.id==='gale'){
      p.textContent='〜';
    } else if(e.id==='storm'){
      p.textContent='';
    } else {
      p.textContent='·';
    }
    p.style.cssText='--left:'+((i*71)%100)+'%;--duration:'+(e.id==='festival'?(1.8+i%2.2):(2+i%4))+'s;--delay:-'+i/4+'s;--size:'+(e.id==='festival'?(12+i%10):(7+i%12))+'px;--weather-color:'+e.col;
    if(e.id==='festival'){
      p.style.setProperty('--coin-rot', (i*37)+'deg');
    }
    weather.appendChild(p);
  }
}

function renderPowerButton(id){
  const def=POWERUPS[id],count=G.powerUps[id]||0;if(!def)return '';
  return '<button class="powerup-activate" data-power="'+id+'" onclick="activatePowerUp(\''+id+'\')" '+(!count||(G.activePowerUps[id]||0)>0?'disabled':'')+'>'+def.icon+' Ativar '+esc(def.name)+' • '+count+' disponível</button>';
}
function injectPowerButton(id){const box=document.getElementById('modal-box');if(!box||box.querySelector('[data-power="'+id+'"]'))return;const close=box.querySelector('.modal-close');(close||box).insertAdjacentHTML(close?'beforebegin':'beforeend',renderPowerButton(id));}
function activatePowerUp(id){
  if(window.rollBusy||window.nucleusState?.done||(G.powerUps[id]||0)<=0||(G.activePowerUps[id]||0)>0||!POWERUPS[id]||!modalOpen)return;
  const phase={goldenDice:1,timing:2,seals:3,nucleus:4}[id];if(G.phase!==phase)return;G.powerUps[id]--;G.runStats.powerUpsUsed++;G.runStats.goldSpent+=0;
  if(id==='goldenDice'){G.activePowerUps.goldenDice=3;showEventToast('Dados Dourados: 3 erros podem virar acertos');injectPowerButton(id);}
  if(id==='timing'){G.activePowerUps.timing=2;resolveAssistedTiming();}
  if(id==='seals'){G.activePowerUps.seals=3;finishSeal(true);}
  if(id==='nucleus'){G.activePowerUps.nucleus=3;if(window.nucleusState){window.nucleusState.steps[0]=0;window.nucleusState.steps[1]=0;G.activePowerUps.nucleus=2;window.nucleusState.initial[0]=0;window.nucleusState.initial[1]=0;window.nucleusState.assisted=true;drawNucleus();if(window.nucleusState.steps.every(n=>n===0))finishNucleus(true);}}
  saveGame();
}
function diceMaxIndexForLevel(level){
  // Progressão automática: nível da mecânica libera dados maiores (igual outras mecânicas)
  // 1–2: só D6 | 3–4: D6–D8 | 5–7: D6–D12 | 8+: D6–D20
  if(level>=8) return 3;
  if(level>=5) return 2;
  if(level>=3) return 1;
  return 0;
}
function pickDiceTypeByProgression(){
  const maxIdx=diceMaxIndexForLevel(mechanicLevel());
  return Math.floor(Math.random()*(maxIdx+1));
}
function selectDice(index){ /* seleção manual desativada — dado vem da progressão */ }
function openDiceModal(){
  // Escolhe o dado aleatoriamente entre os liberados pelo nível da mecânica
  G.diceType=pickDiceTypeByProgression();
  normalizeDiceState();
  G.diceNeedsRequirement=true;
  updateDiceReq();
  G.diceNeedsRequirement=false;
  openDiceModalBase2();
  const dt=DICE_TYPES[G.diceType%DICE_TYPES.length];
  const card=document.getElementById('dice-objective-card');
  if(card){
    const badge=document.createElement('div');
    badge.className='dice-progress-badge';
    badge.innerHTML='<span class="dpb-die">D'+dt.sides+'</span><span class="dpb-label">'+dt.label+' • Nível '+mechanicLevel()+'</span>';
    card.parentNode.insertBefore(badge, card);
  }
  injectPowerButton('goldenDice');
}
function resolveAssistedTiming(){
  if(G.activePowerUps.timing<=0||window.rollBusy)return;
  G.activePowerUps.timing--;tRunning=false;window.rollBusy=true;
  setTimeout(()=>{onSuccess('timing','strong');window.rollBusy=false;closeModal();checkPhaseShift();},350);
}
function openTimingModal(){
  G.timingSpd=(.62+(mechanicLevel()-1)*.045)*heightRegion().mult;G.tGreenW=Math.max(7,19-mechanicLevel());
  startTimingLoop();openTimingModalBase1();injectPowerButton('timing');if(G.activePowerUps.timing>0)resolveAssistedTiming();
}
function openSealModal(){openSealModalBase1();injectPowerButton('seals');if(G.activePowerUps.seals>0)finishSeal(true);}
function finishSeal(won){if(!sealState||sealState.done)return;if(won&&G.activePowerUps.seals>0){G.activePowerUps.seals--;sealState.assisted=true;}finishSealBase1(won);}

function diceRollPasses(roll){
  const direct=diceRollPassesBase1(roll);if(direct||G.activePowerUps.goldenDice<=0)return direct;
  if(G._advantageCache?.roll===roll&&performance.now()-G._advantageCache.at<120)return G._advantageCache.pass;
  const second=rnd(G.diceSides),pass=diceRollPassesBase1(second);G._advantageCache={roll,second,pass,at:performance.now()};return pass;
}

function renderUpgrades(){
  const body=document.getElementById('upg-body');if(!body)return;document.getElementById('upg-coins').textContent=G.coins||0;
  if((G.level||1)<8){body.innerHTML='<div class="ascension-panel"><h3>Loja de Power-Ups</h3><p>Desbloqueia no Nível 8. Gold nunca compra poder permanente.</p></div>';return;}
  body.innerHTML='<div class="powerup-grid">'+Object.entries(POWERUPS).map(([id,p])=>'<article class="powerup-card"><span class="powerup-icon">'+p.icon+'</span><div><h3>'+p.name+'</h3><p>'+p.desc+'</p></div><button onclick="buyPowerUp(\''+id+'\')" '+(G.coins<p.price?'disabled':'')+'><span class="powerup-price">'+p.price+' Gold</span>COMPRAR</button></article>').join('')+'</div>';
}
function buyPowerUp(id){const p=POWERUPS[id];if(!p||G.coins<p.price||((G.level||1)<8))return;G.coins-=p.price;G.powerUps[id]=(G.powerUps[id]||0)+1;G.runStats.goldSpent+=p.price;SFX.buy();renderUpgrades();updateHUD();saveGame();}

function inventoryEntries(){
  if(inventoryTab==='elements')return PIECES.map(p=>({id:p.id,name:p.name,piece:p,count:Number(G.elementCounts[p.id])||0,desc:'Altura +'+p.hv+'. '+p.effectDesc+' Desbloqueio: '+p.minH+'. Chance atual: '+(100*pieceWeight(p)/PIECES.reduce((n,x)=>n+pieceWeight(x),0)).toFixed(2)+'%.',kind:'Blocos construídos'}));
  if(inventoryTab==='bosses')return BOSSES.map(b=>({id:'boss-'+b.id,name:b.name,piece:resolvePiece('boss-'+b.id),count:G.bossBlockCounts[b.id]||0,desc:'Bloco de '+b.name+'. Troféu sem altura adicional ou bônus passivo. Vitória: recupera 25% da Estabilidade máxima (mínimo +5), concede 150 × estrela Gold, 100 × estrela XP e Essência conforme o ciclo.',kind:'Vitórias registradas'}));
  if(inventoryTab==='gold')return [{id:'coins',name:'Gold',icon:'💰',count:G.coins||0,desc:'Usado somente em Power-Ups temporários.',kind:'Quantidade'}];
  if(inventoryTab==='powerups')return Object.entries(POWERUPS).map(([id,p])=>({id,name:p.name,icon:p.icon,count:G.powerUps[id]||0,desc:p.desc,kind:'Disponíveis'}));return [];
}
function renderInventory(){
  const body=document.getElementById('inv-body');if(!body)return;const ie=document.getElementById('inv-essence');if(ie)ie.textContent=G.divineEssence||0;
  const entries=inventoryEntries(),selected=entries.find(x=>x.id===inventorySelected)||entries[0];inventorySelected=selected?.id;const artwork=e=>e.piece?spriteMarkup(e.piece):'<span class="item-symbol">'+esc(e.icon||'◉')+'</span>';
  body.innerHTML='<nav class="inventory-tabs" aria-label="Categorias">'+[['elements','ELEMENTOS'],['bosses','BOSSES'],['gold','GOLD'],['powerups','POWER-UPS']].map(([id,label])=>'<button class="'+(id===inventoryTab?'active':'')+'" onclick="chooseInventoryTab(\''+id+'\')">'+label+'</button>').join('')+'</nav><div class="item-grid">'+entries.map(e=>'<button class="inventory-item '+(e.id===selected?.id?'selected':'')+'" onclick="chooseInventoryItem(\''+e.id+'\')"><span class="item-name">'+esc(e.name)+'</span>'+artwork(e)+'<span class="item-count">'+e.count+'</span></button>').join('')+'</div>'+(selected?'<article class="item-detail"><div class="detail-art">'+artwork(selected)+'</div><div><h3>'+esc(selected.name)+'</h3><p>'+esc(selected.desc)+'</p><strong>'+esc(selected.kind)+': '+selected.count+'</strong></div></article>':'');
}

function renderCodex(){
  const body=document.getElementById('codex-body');if(!body)return;const unlocked=PIECES.filter(p=>G.bestHeight>=p.minH).length;document.getElementById('codex-counter').textContent=unlocked+'/'+PIECES.length;
  const mechanics=[['🎲','Dados','Sorte + risco'],['⏱','Timing','Reflexo + precisão'],['✦','Selos Elementais','Percepção + busca visual'],['🌀','Núcleo Rúnico','Raciocínio espacial + manipulação']];
  body.innerHTML='<div class="codex-section">Blocos elementais</div>'+PIECES.map(p=>{const ok=G.bestHeight>=p.minH;return '<div class="codex-entry '+(ok?'unlocked':'locked')+'"><div class="codex-icon codex-block-art">'+spriteMarkup(p)+'</div><div class="codex-info"><div class="codex-name">'+(ok?p.name:'???')+'</div><div class="codex-unlock">'+(ok?'Desbloqueado na Altura '+p.minH:'Desbloqueie na Altura '+p.minH)+'</div><div class="codex-desc">Altura +'+p.hv+' • '+p.effectDesc+'</div></div></div>';}).join('')+
  '<div class="codex-section">Quatro mecânicas</div>'+mechanics.map((m,i)=>'<div class="codex-entry '+(unlockedMechanics()>=i+1?'unlocked':'locked')+'"><div class="codex-icon">'+m[0]+'</div><div class="codex-info"><div class="codex-name">'+m[1]+'</div><div class="codex-effect">'+m[2]+'</div><div class="codex-desc">Nível atual '+(i===3?nucleusLevel():mechanicLevel())+'/10</div></div></div>').join('')+
  '<div class="codex-section">Guardiões</div>'+BOSSES.map((b,i)=>{const count=G.bossBlockCounts[b.id]||0;return '<div class="codex-entry '+(count?'unlocked':'locked')+'"><div class="codex-icon codex-guardian-art" role="img" aria-label="'+esc(b.name)+'" style="background-image:url(img/boss-'+b.id+'.webp);background-size:cover;background-position:center 25%"></div><div class="codex-info"><div class="codex-name">'+(count?b.name:'Guardão '+(i+1))+'</div><div class="codex-desc">'+(count?count+' vitória(s) • próxima forma '+ '★'.repeat(Math.min(5,bossStar())):'Ainda não derrotado')+'</div></div></div>';}).join('')+
  '<div class="codex-section">Eventos do mundo</div>'+EVENTS.map(e=>'<div class="codex-entry unlocked"><div class="codex-icon">'+e.name.split(' ')[0]+'</div><div class="codex-info"><div class="codex-name">'+e.name.replace(/^\S+\s/,'')+'</div><div class="codex-effect">'+e.desc+'</div><div class="codex-desc">'+(e.dur?e.dur+' ações':'Imediato')+' • cooldown '+e.cooldown+'</div></div></div>').join('');
}

function renderStats(){
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};set('sc-h',G.height);set('sc-best',G.bestHeight);set('sc-coins',G.coins);set('sc-essence',G.divineEssence);set('sc-diff',ERA_DATA[currentEra()].name);set('sc-boss',G.bossDefeated.length);set('sc-hits',G.hits);set('sc-miss',G.misses);set('sc-streak',G.streak);set('sc-bstreak',G.bestStreak);
  const box=document.getElementById('tier-box'),card=document.getElementById('tier-current-card');if(card)card.innerHTML='<div class="sc-label">Progressão permanente</div><div id="tier-current-label">Era '+currentEra()+' • '+ERA_DATA[currentEra()].name+'</div><p class="inventory-caption">'+G.prestige+' Prestígio • '+G.xpTotal+' XP total'+((G.level||1)>=10?' • Título Ascendente':'')+' • Ameaça '+G.threat+'%</p>';if(box)box.innerHTML=(G.runHistory||[]).slice(-5).reverse().map(r=>'<div class="tier-row"><span>'+esc(r.reason||'Jornada')+'</span><span>'+r.finalHeight+' Altura</span></div>').join('')||'<p class="inventory-caption">Nenhuma jornada arquivada.</p>';
}

function openHowTo(){openModal('<h2>Como jogar</h2><p class="msub">Construa, evolua, supere e ascenda.</p><div class="htp-step"><div class="htp-num">1</div><div class="htp-text"><strong>Quatro mecânicas:</strong> Dados, Timing, Selos e Núcleo Rúnico.</div></div><div class="htp-step"><div class="htp-num">2</div><div class="htp-text"><strong>Ameaça:</strong> Perfect +1%, Acerto +2%, Erro +4% (Tempestade +7%). O Guardião chega no turno seguinte a 100%.</div></div><div class="htp-step"><div class="htp-num">3</div><div class="htp-text"><strong>Ascensão:</strong> complete a rotação dos 11 Guardiões, abra Eras e toque no próximo card liberado. Sua altura e torre continuam na nova Era.</div></div><button class="modal-close" onclick="closeModal()">Entendi</button>');}
openInfoModal=openHowTo;

function gameOver(){
  addLog('Queda • Altura '+G.height+' • Estabilidade '+G.stab+(G.bossActive?' • batalha interrompida: '+BOSSES[G.bossIdx].name+' • HP restante '+G.bossHp:''),'f',G.bossActive?'boss':null);SFX.death();archiveRun('Queda');updateRanking(getPlayerName(),G.bestHeight,G.prestige,G.bossDefeated.length);const ov=document.getElementById('go-overlay');if(!ov)return;
  document.getElementById('go-score').textContent='Altura '+G.height+' • Recorde '+G.bestHeight;document.getElementById('go-extra').textContent='Ameaça '+G.threat+'% • '+G.bossDefeated.length+' Guardiões derrotados';
  document.getElementById('go-revive-essence').disabled=G.divineEssence<1;document.getElementById('go-intervention').disabled=G.divineEssence<3;setTimeout(()=>{if(G.stab<=0)ov.classList.add('show');},2000);saveGame();
}
function triggerCriticalState(){} // LEGADO DESATIVADO: não restaurar o minigame crítico; queda usa o fluxo atual de revive.
function restoreAfterFall(stability){G.stab=Math.ceil(G.maxStab*stability);G.consecutiveErrors=0;G.bossPending=G.threat>=100&&!G.bossActive;G._inCritical=false;if(G.runStats?.endedAt)G.runStats=Object.assign(newRunStats(),{startEra:G.era});document.getElementById('go-overlay').classList.remove('show');addLog('Retomada • Altura '+G.height+' • Estabilidade '+G.stab+' • Ameaça '+G.threat+'%'+(G.bossActive?' • batalha retomada com HP '+G.bossHp:''),'e');updateHUD();saveGame();}
function continueAfterFall(){if(G.stab>0)return;const prev=G.height;G.height=Math.max(0,Math.floor(G.height*.8));const lost=prev-G.height;G.streak=0;G.combo=0;if(lost>0)animateHeightLoss(lost);restoreAfterFall(.5);showEventToast('Jornada retomada • −20% da Altura');}
function reviveWithEssence(){if(G.stab>0||G.divineEssence<1)return;G.divineEssence--;G.runStats.essenceSpent++;const prev=G.height;G.height=Math.floor(G.height*.9);const lost=prev-G.height;G.threat=Math.max(0,G.threat-20);if(lost>0)animateHeightLoss(lost);restoreAfterFall(.8);SFX.revive();showEventToast('Revive • Ameaça −20 p.p.');}
function divineIntervention(){if(G.stab>0||G.divineEssence<3)return;G.divineEssence-=3;G.runStats.essenceSpent+=3;G.threat=Math.max(0,G.threat-50);G.divineProtection=3;restoreAfterFall(1);SFX.revive();showEventToast('Intervenção Divina • 3 ações protegidas');}
function reviveWithGold(){notify('Gold é usado somente em Power-Ups.');}
function restartGame(){continueAfterFall();}

function renderEras(){
 repairAscensionUnlock();
 const body=document.getElementById('eras-body');if(!body)return;
 const era=currentEra(),last=ERA_DATA.length-1,blocked=G.bossActive||battleVictory||!!actionPresentation;
 document.getElementById('era-prestige-count').textContent=(G.prestige||0)+' Prestígio';
 body.innerHTML='<div class="era-list">'+ERA_DATA.map((e,i)=>{
  const ready=i===era+1&&G.ascensionReady;
  const state=i<era?'CONCLUÍDA':i===era?'ERA ATUAL':ready?'LIBERADA • TOQUE PARA ENTRAR':'BLOQUEADA';
  const cls='era-card '+(i===era?'current':ready?'available':i>era?'locked':'completed');
  const content='<span class="era-title">Era '+i+' • '+e.name+'</span><span class="era-desc">'+e.subtitle+'<br>'+e.desc+'</span><span class="era-state">'+state+'</span>';
  return ready?'<button type="button" class="'+cls+'" style="--era-art:url(img/era-'+i+'.webp)" onclick="enterEra('+i+')" '+(blocked?'disabled':'')+' aria-label="Entrar na Era '+i+' • '+e.name+'">'+content+'</button>':'<article class="'+cls+'" style="--era-art:url(img/era-'+i+'.webp)">'+content+'</article>';
 }).join('')+'</div><div class="ascension-panel"><h3>'+(era===last?'Última Era alcançada':G.ascensionReady?'Próxima Era liberada':'Próxima Era')+'</h3><p>'+(era===last?'A jornada continua: os Bosses ficam mais fortes a cada nova rotação.':G.ascensionReady?'Toque no card liberado para continuar na arena com a nova Era.':'Supere os 11 Guardiões da rotação para liberar o próximo card. Progresso: '+((G.bossDefeated.length%BOSSES.length))+'/11.')+'</p><p>Altura, torre, estabilidade, itens e progresso são mantidos.</p>'+(blocked?'<p>Conclua a batalha ou a animação atual para entrar na nova Era.</p>':'')+'</div>';
}
// Compatibility entry point: navigation only. The unlocked card commits the change.
function startAscensionRitual(){goScreen('eras');}
function enterEra(index){
 repairAscensionUnlock();
 if(curScreen!=='eras'||!Number.isInteger(index)||index!==currentEra()+1||index>=ERA_DATA.length||!G.ascensionReady||G.bossActive||battleVictory||actionPresentation||modalOpen)return false;
 const previous=currentEra();
 // Continue the exact same run: never resetJourney, archiveRun or replace G here.
 G.era=index;G.ascensions=(Number(G.ascensions)||0)+1;
 G.bossStar=bossStar();repairAscensionUnlock();
 addLog('Era '+ERA_DATA[previous].name+' → '+ERA_DATA[index].name+' • Altura '+G.height+' preservada • próxima rotação de Bosses: nível '+G.bossStar,'e','partida');
 goScreen('game');renderTotem(false);setPhaseUI();updateHUD();saveGame();
 SFX.prestige();showEventToast('Era '+ERA_DATA[index].name+' • Altura '+G.height+' • Bosses nível '+G.bossStar);
 return true;
}
function goScreen(id){goScreenBase4(id);if(id==='eras')renderEras();applyEraVisuals();updateThreatState();updateStabilityPresentation();renderEventSide();}

/* Núcleo Rúnico — Canvas responsivo, seleção por toque e progressão 1–10. */
function openNucleusModal(){
  const level=nucleusLevel(),cfg=NUCLEUS_LEVELS[level-1];
  openModal('<div class="nucleus-head"><h2>NÚCLEO RÚNICO<br><small>ALINHE OS ANÉIS</small></h2><strong>NÍVEL '+String(level).padStart(2,'0')+'</strong></div><div class="nucleus-hud"><div class="nucleus-pill">TEMPO<b id="nucleus-time">'+cfg.time.toFixed(1)+'s</b></div><div class="nucleus-pill">MOVIMENTOS<b id="nucleus-moves">0 / '+cfg.perfect+'</b></div><div class="nucleus-pill">ALVO<b>▽</b></div></div><canvas id="nucleus-canvas" width="560" height="560" aria-label="Anéis do Núcleo Rúnico"></canvas><div id="nucleus-rings" class="nucleus-rings"></div><div class="nucleus-status" id="nucleus-status">'+cfg.modifier+'</div><div class="nucleus-controls"><button onclick="rotateNucleus(-1)">↺ ESQUERDA</button><button class="reset" onclick="resetNucleus()">↻ RESETAR</button><button onclick="rotateNucleus(1)">DIREITA ↻</button></div>'+renderPowerButton('nucleus')+'<button class="modal-close" onclick="closeModal()">Voltar</button>');
  document.getElementById('modal-box').dataset.action='nucleus';initNucleus(level);
}
function initialNucleusSteps(level,rings){const a=[];for(let i=0;i<rings;i++){let min=level===2?3:1,max=7;if(level===4&&i===rings-1){a.push(4);continue;}a.push(min+Math.floor(Math.random()*(max-min+1)));}return a;}
function nucleusLevel(){return mechanicLevel();}
function nucleusLinks(level,rings){
  if(level<6)return [];
  if(level===6)return [[1,2,-1]];
  // Acyclic links guarantee every initial configuration is solvable.
  const source=Math.floor(Math.random()*(rings-1)),target=source+1+Math.floor(Math.random()*(rings-source-1));
  const links=[[source,target,Math.random()<.5?-1:1]];
  if(level>=9){const second=[0,source===0?1:2,-1];if(!links.some(l=>l[0]===second[0]&&l[1]===second[1]))links.push(second);else links.push([1,3,1]);}
  return links;
}
function initNucleus(level){
  const cfg={...NUCLEUS_LEVELS[level-1],time:NUCLEUS_LEVELS[level-1].time/(G.eventId==='gale'?1.2:1)},steps=initialNucleusSteps(level,cfg.rings),assisted=G.activePowerUps.nucleus>0;if(assisted){steps[0]=0;steps[1]=0;G.activePowerUps.nucleus--;}
  window.nucleusState={level,cfg,steps,assisted,initial:[...steps],selected:Math.max(0,steps.findIndex(n=>n!==0)),moves:0,resets:0,links:nucleusLinks(level,cfg.rings),started:performance.now(),done:false,raf:0,linkedUntil:{}};
  G.nucleusProgress.attempts++;saveGame();
  const canvas=document.getElementById('nucleus-canvas');canvas.addEventListener('pointerdown',selectNucleusRing);renderNucleusButtons();drawNucleus();if(steps.every(n=>n===0))finishNucleus(true);else tickNucleus();
}
function renderNucleusButtons(){const s=window.nucleusState,el=document.getElementById('nucleus-rings');if(!s||!el)return;el.innerHTML=s.steps.map((_,i)=>'<button class="nucleus-ring '+(i===s.selected?'active':'')+'" onclick="selectNucleus('+i+')">Anel '+(i+1)+'</button>').join('');}
function selectNucleus(i){const s=window.nucleusState;if(!s||s.done)return;SFX.click();s.selected=i;renderNucleusButtons();drawNucleus();}
const NUCLEUS_GEOMETRY={x:280,y:230,scale:.78,radii:[82,132,182,232]};
function selectNucleusRing(e){const s=window.nucleusState,c=e.currentTarget,r=c.getBoundingClientRect(),x=((e.clientX-r.left)*560/r.width-NUCLEUS_GEOMETRY.x)/NUCLEUS_GEOMETRY.scale,y=((e.clientY-r.top)*560/r.height-NUCLEUS_GEOMETRY.y)/NUCLEUS_GEOMETRY.scale,d=Math.hypot(x,y),radii=NUCLEUS_GEOMETRY.radii;let best=999,idx=0;radii.slice(0,s.cfg.rings).forEach((n,i)=>{const delta=Math.abs(d-n);if(delta<best){best=delta;idx=i;}});selectNucleus(idx);}
function rotateNucleus(dir){
  const s=window.nucleusState;if(!s||s.done)return;
  if(performance.now()>s.started+s.cfg.time*1000+200){finishNucleus(s.steps.every(n=>n===0));return;}
  const selected=s.selected;s.steps[selected]=(s.steps[selected]+dir+8)%8;
  s.links.filter(l=>l[0]===selected).forEach(l=>{s.steps[l[1]]=(s.steps[l[1]]+dir*l[2]+8)%8;s.linkedUntil[l[1]]=performance.now()+250;});
  SFX.click();s.moves++;document.getElementById('nucleus-moves').textContent=s.moves+' / '+s.cfg.perfect;drawNucleus();
  if(s.steps.every(n=>n===0)){finishNucleus(true);return;}
  if(s.steps[selected]===0){for(let n=1;n<=s.steps.length;n++){const i=(selected+n)%s.steps.length;if(s.steps[i]!==0){s.selected=i;break;}}}
  renderNucleusButtons();drawNucleus();
}
function resetNucleus(){
  const s=window.nucleusState;if(!s||s.done||s.resets>=2)return;SFX.click();
  if(performance.now()>s.started+s.cfg.time*1000+200){finishNucleus(s.steps.every(n=>n===0));return;}
  s.resets++;s.steps=[...s.initial];s.moves=0;s.started=performance.now();s.linkedUntil={};s.selected=Math.max(0,s.steps.findIndex(n=>n!==0));
  document.getElementById('nucleus-moves').textContent='0 / '+s.cfg.perfect;
  const button=document.querySelector('.nucleus-controls .reset');button.textContent='↻ RESETAR '+(2-s.resets)+'/2';button.disabled=s.resets>=2;
  renderNucleusButtons();drawNucleus();
}
const mechanicMaterial=new Image();mechanicMaterial.src='img/mechanics-atlas.png';
function drawNucleus(){
 const s=window.nucleusState,c=document.getElementById('nucleus-canvas');if(!s||!c)return;
 const x=c.getContext('2d'),radii=NUCLEUS_GEOMETRY.radii,step=Math.PI/4;
 x.clearRect(0,0,560,560);x.save();x.translate(280,280);
 const ready=mechanicMaterial.complete&&mechanicMaterial.naturalWidth;
 const size=mechanicMaterial.naturalWidth/2;
 if(ready)x.drawImage(mechanicMaterial,size,size,size,size,-280,-280,560,560);
 else{x.fillStyle='#17231e';x.beginPath();x.arc(0,0,270,0,Math.PI*2);x.fill();}
 x.translate(NUCLEUS_GEOMETRY.x-280,NUCLEUS_GEOMETRY.y-280);x.scale(NUCLEUS_GEOMETRY.scale,NUCLEUS_GEOMETRY.scale);
 for(let i=s.cfg.rings-1;i>=0;i--){
  const r=radii[i],aligned=s.steps[i]===0,selected=i===s.selected;
  x.save();x.rotate(s.steps[i]*step);
  x.beginPath();x.arc(0,0,r+17,-Math.PI/2+.16,Math.PI*1.5-.16);x.arc(0,0,r-17,Math.PI*1.5-.16,-Math.PI/2+.16,true);x.closePath();
  x.fillStyle='#48554b';x.fill();
  if(ready){x.save();x.clip();x.drawImage(mechanicMaterial,0,size,size,size,-260,-260,520,520);x.restore();}
  x.lineWidth=selected?4:2;x.strokeStyle=aligned?'#71efb1':selected?'#e9c16a':'#738071';x.shadowColor=aligned?'#39e494':'#cf9d43';x.shadowBlur=selected||aligned?14:0;x.stroke();x.shadowBlur=0;
  for(let k=1;k<8;k++){const a=-Math.PI/2+k*step;x.save();x.translate(Math.cos(a)*r,Math.sin(a)*r);x.rotate(a+Math.PI/2);x.font='bold 20px Georgia';x.textAlign='center';x.textBaseline='middle';x.fillStyle=aligned?'#91ffd1':selected?'#f0d393':'#a7b9a5';x.fillText(['ᚠ','ᚱ','ᚨ','ᛟ','ᚹ','ᛉ','ᛒ'][k-1],0,0);x.restore();}
  x.restore();
 }
 x.fillStyle='#edcf83';x.shadowColor='#ebc46d';x.shadowBlur=12;x.beginPath();x.moveTo(0,-266);x.lineTo(-12,-248);x.lineTo(12,-248);x.closePath();x.fill();
 const pulse=.75+.25*Math.sin(performance.now()/400);x.shadowColor='#69ffb7';x.shadowBlur=18*pulse;
 const gem=x.createLinearGradient(-30,-40,30,40);gem.addColorStop(0,'#caffd8');gem.addColorStop(.5,'#42ba85');gem.addColorStop(1,'#123a35');x.fillStyle=gem;x.strokeStyle='#c6aa65';x.lineWidth=4;x.beginPath();x.moveTo(0,-42);x.lineTo(32,0);x.lineTo(0,42);x.lineTo(-32,0);x.closePath();x.fill();x.stroke();x.restore();
}
function tickNucleus(){
  const s=window.nucleusState;if(!s||s.done)return;
  const left=s.cfg.time-(performance.now()-s.started)/1000,el=document.getElementById('nucleus-time');
  if(el){el.textContent=Math.max(0,left).toFixed(1)+'s';el.classList.toggle('urgent',left<=2);}
  if(left<=0&&s.steps.every(n=>n===0)){finishNucleus(true);return;}
  if(left<=-.2){finishNucleus(s.steps.every(n=>n===0));return;}
  drawNucleus();s.raf=requestAnimationFrame(tickNucleus);
}
function finishNucleus(won){
  const s=window.nucleusState;if(!s||s.done)return;s.done=true;cancelAnimationFrame(s.raf);window.rollBusy=true;
  document.querySelectorAll('.nucleus-controls button,.nucleus-ring,[data-power="nucleus"]').forEach(b=>b.disabled=true);
  const perfect=won&&!s.assisted&&s.moves<=s.cfg.perfect;if(won){perfect?SFX.perfect():SFX.success();}else SFX.fail();const st=document.getElementById('nucleus-status');st.textContent=won?(perfect?'PERFECT • NÚCLEO ATIVADO':'ACERTO • NÚCLEO ATIVADO'):'ERRO • TEMPO ESGOTADO';st.style.color=won?'#64e6ad':'#ff7180';
  document.getElementById('nucleus-canvas').classList.toggle('activated',won);
  if(won)G.nucleusProgress.wins++;
  const epoch=window.modalEpoch;
  setTimeout(()=>{if(window.nucleusState!==s||window.modalEpoch!==epoch)return;if(won)onSuccess('nucleus',perfect?'perfect':'strong');else onFail();setTimeout(()=>{if(window.nucleusState!==s)return;window.rollBusy=false;closeModal();checkPhaseShift();checkAchievements();},650);},220);
}
function closeModal(){if(window.rollBusy)return;const s=window.nucleusState;if(s)cancelAnimationFrame(s.raf);window.nucleusState=null;closeModalBase2();}

function exportProgress(){saveGame();const blob=new Blob([JSON.stringify({schemaVersion:SAVE_SCHEMA,version:GAME_VERSION,G,gameLog},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='totem-ascension-'+GAME_VERSION+'-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

let feedbackUntil=0,springVisualUntil=0,feedbackTimer=null;
function showActionFeedback(title,detail,kind){
 if(kind==='error'&&title!=='ERRO')return; // Boss damage already has its own complete result.
 presentResult(title,detail,kind==='perfect'?'perfect':kind==='error'?'error':'hit');
}

function bossModifiers(star){return star>=4?'Pressão −2 estabilidade/acerto • Regeneração • fase 2 aos 50% HP: pressão −3':star>=3?'Pressão −2 estabilidade/acerto • Regeneração':star>=2?'Pressão desperta: −2 estabilidade/acerto':'Kit original do Guardião';}

function renderLastGuardian(){
 const arena=document.getElementById('arena');if(!arena)return;
 let badge=document.getElementById('last-guardian');
 if(!badge){badge=document.createElement('aside');badge.id='last-guardian';arena.appendChild(badge);}
 const victories=G.bossDefeated||[],b=BOSSES[victories[victories.length-1]];
 badge.hidden=!b;if(!b)return;
 if(badge.dataset.boss!==b.id){badge.dataset.boss=b.id;badge.innerHTML='<span>ÚLTIMO BOSS</span>'+spriteMarkup(resolvePiece('boss-'+b.id))+'<strong>'+esc(b.name)+'</strong>';}
}
/* MP3 por cena: transições interrompíveis, sem reiniciar a faixa ativa. */
const MUSIC_FILES={menu:'music/menu_surgite_in_altum.mp3',game:'music/arena-before_the_final_horn.mp3',boss:'music/boss_ran-da-kor.mp3',threat:'music/ameaca_crown_of_the_monolith.mp3',danger:'music/queda_instrumental_sol_niger_cadit.mp3'};
const musicTracks=new Map();
let musicFade=0,musicRequest=0;
function getMusicTrack(name){
 if(!musicTracks.has(name)){const a=new Audio(MUSIC_FILES[name]);a.loop=true;a.preload='metadata';a.volume=0;musicTracks.set(name,a);}
 return musicTracks.get(name);
}
function fadeMusicTo(name,immediate=false){
 cancelAnimationFrame(musicFade);
 const start=performance.now(),entries=[...musicTracks].map(([key,a])=>({a,from:a.volume,to:key===name&&musicEnabled?audioPrefs.music:0}));
 const frame=now=>{const t=immediate?1:Math.min(1,(now-start)/1400),ease=t*t*(3-2*t);
  for(const e of entries){e.a.volume=Math.max(0,Math.min(1,e.from+(e.to-e.from)*ease));if(t===1&&e.to===0)e.a.pause();}
  if(t<1)musicFade=requestAnimationFrame(frame);
 };frame(start);
}
function stopMusic(immediate=false){musicRequest++;currentMusicName=null;currentMusic=null;fadeMusicTo(null,immediate);}
function resumeSceneMusic(){if(curScreen==='menu')playMenuMusic();else playGameMusic();}
function playSceneMusic(name){
 if(!musicEnabled||document.hidden)return;
 const a=getMusicTrack(name);
 if(currentMusicName===name&&!a.paused)return;
 const request=++musicRequest;currentMusicName=name;currentMusic=a;
 // play is called inside the user gesture, including on mobile browsers.
 const started=a.play();
 Promise.resolve(started).then(()=>{if(request!==musicRequest)return;fadeMusicTo(name);}).catch(()=>{if(request===musicRequest){currentMusicName=null;currentMusic=null;}});
}
function playMenuMusic(){playSceneMusic('menu');}
function gameMusicScene(){
 if(G.bossActive)return 'boss';
 if(G.stab/Math.max(1,G.maxStab)<.30)return 'danger';
 if(G.threat>=91)return 'threat';
 return 'game';
}
function playGameMusic(){playSceneMusic(gameMusicScene());}
function syncDangerMusic(){if(curScreen==='game'&&musicEnabled&&!document.hidden)playGameMusic();}

SFX.boss=()=>{
  // BOSS - RUGIDO CAÓTICO ALTO E ANIMADO
  playSlide(280,38,.95,'sawtooth',.42);
  playNoise(.55,.22,350,'lowpass');
  playTone(110,.95,'square',.38);
  playTone(55,1.25,'sine',.32,.12);
  playTone(185,.45,'triangle',.28,.08);
  playTone(92,.65,'sawtooth',.24,.20);
};
SFX.bossHit=()=>{
  if(BOSSES[G.bossIdx]?.id==='titan'&&window.TitanAudio){if(soundEnabled){initAudio();TitanAudio.play(audioCtx,sfxGain,'impact');}return;}
  // Impacto curto e grave no contato das garras com a torre.
  playNoise(.16,.11,630,'lowpass');
  playSlide(135,65,.20,'triangle',.17);
  playTone(55,.20,'sine',.13);
};
SFX.bossHurt=()=>{
  if(BOSSES[G.bossIdx]?.id==='titan'&&window.TitanAudio){if(soundEnabled){initAudio();TitanAudio.play(audioCtx,sfxGain,'hurt');}return;}
  // Golpe seco seguido de um grunhido da fera, junto ao recuo do Boss.
  playNoise(.10,.10,680,'lowpass');
  playTone(92,.13,'sine',.13);
  playSlide(195,72,.44,'sawtooth',.10);
  playSlide(115,58,.36,'triangle',.10);
};
document.addEventListener('pointerdown',()=>{if(soundEnabled||musicEnabled){initAudio();window.TitanAudio?.preload(audioCtx);if(curScreen==='menu')playMenuMusic();else if(curScreen==='game')playGameMusic();}}, {passive:true});

// Atualiza também os rodapés do HTML anterior: basta substituir game.js.
function updateVersionFooters(){
  const menu=document.getElementById('menu-version');
  if(menu){menu.textContent=GAME_VERSION+' • Eras da Ascensão • Contato: edsony1@gmail.com';menu.style.setProperty('color','#ffdf55','important');}
  document.querySelectorAll('.game-version').forEach(footer=>{
    footer.textContent='TOTEM ASCENSION • '+GAME_VERSION+' • Contato: edsony1@gmail.com';
    footer.style.setProperty('color','#ffdf55','important');
  });
}

/* One initialization entry point, after all systems are defined. */
function initializeGame(){
 installInteractionFeedback();
{
  clearOldProgress();
  loadSoundPref();
  initMenuBackground();
  // Carrega nome do jogador
  const nameInput=document.getElementById('player-name-input');
  if(nameInput) nameInput.value=getPlayerName();
  // Renderiza ranking
  renderRanking();
  const sb=document.getElementById('sound-btn');
  if(sb) sb.textContent=soundEnabled?'🔊':'🔇';
  loadGame();

  // Init dice sides
  if(G.diceSides){
    const dt=DICE_TYPES[G.diceType%DICE_TYPES.length];
    G.diceSides=dt.sides;
  }
}
{
 const menu=document.getElementById('menu-version');
 document.addEventListener('keydown',e=>{
  if(e.code==='Space'&&tRunning&&e.target.tagName!=='INPUT'){e.preventDefault();execTiming();}
 });
 document.addEventListener('pointerdown',e=>{
  if(e.target.id==='timing-go-btn'&&tRunning){e.preventDefault();execTiming();}
 });
}
{
 const tools=document.getElementById('menu-tools');
 if(tools) tools.insertAdjacentHTML('beforeend','<div id="backup-actions"><button onclick="exportProgress()">Exportar progresso</button><button onclick="importProgress()">Importar progresso</button></div>');
}
{normalizeV8();updateMenuRun();renderTotem();syncBattle();}
{addAtmosphere(document.getElementById('screen-menu'),'menu-particles',22);addAtmosphere(document.getElementById('boss-overlay'),'battle-particles',30);addAtmosphere(document.getElementById('arena'),'danger-debris',12);}
{
  loadGame();updateVersionFooters();updateMenuRun();renderTotem();setPhaseUI();updateHUD();
}
}
window.addEventListener('load',initializeGame);

/* v10.2.7 — modal result → clear arena → block animation → next action. */
let actionPresentation=null;
function queueMechanicResult(resolve){
 if(!modalOpen)return false;
 if(actionPresentation)return true;
 actionPresentation={resolve,stage:'result'};
 return true;
}
function startActionPresentation(){
 const pending=actionPresentation;if(!pending||pending.stage!=='result')return;
 pending.stage='arena';
 setTimeout(()=>{
  if(actionPresentation!==pending)return;
  pending.stage='animation';
  try{pending.resolve();}finally{
   setTimeout(()=>{if(actionPresentation!==pending)return;actionPresentation=null;completeResolvedAction();checkAchievements();saveGame();},2000);
  }
 },450);
}
function animateRejectedPiece(){
 const host=document.getElementById(G.bossActive?'boss-tower':'totem-stack');if(!host)return;
 const pt=G.bossActive?resolvePiece('boss-'+BOSSES[G.bossIdx%BOSSES.length].id):resolvePiece((G.pieces||[]).at(-1)?.id||PIECES[0].id);
 const ghost=document.createElement('div');ghost.className='rejected-piece';ghost.innerHTML=spriteMarkup(pt);host.appendChild(ghost);setTimeout(()=>ghost.remove(),1900);
}

function openBossLog(){sectionOrigin='game';flushLogBuffer();goScreen('log');}

// Foreground is a sibling of the animated artwork, so particles cannot be covered by it.
function buildGuardianForeground(id){
 const field=document.querySelector('.battle-field');
 document.getElementById('guardian-foreground')?.remove();
 if(!field||!BOSS_MOTION[id])return;
 const layer=document.createElement('div');layer.id='guardian-foreground';layer.setAttribute('aria-hidden','true');
 layer.style.setProperty('--debris-color',BOSS_MOTION[id].color);
 layer.innerHTML=Array.from({length:26},(_,i)=>'<i class="boss-dust" style="--x:'+((i*37+7)%100)+'%;--y:'+((i*23)%100)+'%;--delay:-'+(i*.73)+'s;--duration:'+(7+i%6)+'s;--size:'+(2+i%4)+'px"></i>').join('');
 field.appendChild(layer);
}
function spawnGuardianDebris(){
 const layer=document.getElementById('guardian-foreground');if(!layer)return;
 for(let i=0;i<22;i++){
  const shard=document.createElement('i');shard.className='boss-debris';
  const angle=Math.PI*2*i/22;
  shard.style.cssText='--dx:'+Math.round(Math.cos(angle)*(65+i%5*22))+'px;--dy:'+Math.round(-55+Math.sin(angle)*95)+'px;--spin:'+(120+i*47)+'deg;--size:'+(4+i%6)+'px';
  layer.appendChild(shard);setTimeout(()=>shard.remove(),1700);
 }
}

/* v10.3.11 — keep the shoulder fixed and aim the distal end of the sprite. */
function guardianAim(dx,dy,reach){
 return {angle:-Math.atan2(dx,dy)*180/Math.PI,scale:Math.max(.9,Math.min(1.55,Math.hypot(dx,dy)/Math.max(1,reach)))};
}
function prepareGuardianStrike(){
 const field=document.querySelector('.battle-field'),tower=document.getElementById('boss-tower');if(!field)return;
 const fr=field.getBoundingClientRect(),tr=tower?.getBoundingClientRect();
 const targetX=fr.left+fr.width*.5,targetY=tr&&tr.height>0?tr.top+Math.min(20,tr.height*.25):fr.top+fr.height*.82;
 document.querySelectorAll('#boss-limbs .guardian-limb').forEach(limb=>{
  const r=limb.getBoundingClientRect(),img=limb.querySelector('img'),strike=limb.querySelector('.limb-strike');if(!img||!strike||!r.height)return;
  const ratio=Math.min(r.width/(img.naturalWidth||r.width),r.height/(img.naturalHeight||r.height));
  const height=(img.naturalHeight||r.height)*ratio,top=(r.height-height)/2;
  const pivotY=top+height*.12,reach=height*.79;
  const aim=guardianAim(targetX-(r.left+r.width*.5),targetY-(r.top+pivotY),reach);
  strike.style.transformOrigin='50% '+(pivotY/r.height*100)+'%';
  limb.style.setProperty('--aim-angle',aim.angle+'deg');limb.style.setProperty('--aim-scale',aim.scale);
 });
}
function prepareGuardianDefeat(){
 const field=document.querySelector('.battle-field');if(!field)return;const fr=field.getBoundingClientRect();
 document.querySelectorAll('#boss-limbs .guardian-limb').forEach(limb=>{
  const r=limb.getBoundingClientRect();limb.style.setProperty('--fall-y',Math.max(0,fr.top+fr.height*.87-r.top-r.height*.5)+'px');
 });
}
function showBossDamageSlash(damage){
 const field=document.querySelector('.battle-field');if(!field||damage<=0)return;
 field.querySelector('.boss-damage-slash')?.remove();const slash=document.createElement('div');slash.className='boss-damage-slash';slash.setAttribute('aria-hidden','true');
 slash.innerHTML='<i></i><i></i><i></i>';field.appendChild(slash);setTimeout(()=>slash.remove(),850);
}
function repairAscensionUnlock(){
 const rotations=Math.floor((G.bossDefeated||[]).length/BOSSES.length),used=Math.max(0,Number(G.ascensions)||0),pending=Math.min(Math.max(0,ERA_DATA.length-1-currentEra()),Math.max(0,rotations-used));
 G.ascensionReady=pending>0;G.prestigeAvailable=pending;G.prestige=Math.max(Number(G.prestige)||0,rotations);
 return pending;
}
let interactionFeedbackInstalled=false;
function installInteractionFeedback(){
 if(interactionFeedbackInstalled)return;interactionFeedbackInstalled=true;
 const originalClick=SFX.click;let lastSound=-Infinity,lastPointer=null,lastPointerAt=-Infinity;
 // One sound for the gesture, including actions whose existing handler calls SFX.click.
 SFX.click=()=>{if(performance.now()-lastSound>450)originalClick();};
 const feedback=target=>{
  initAudio();lastSound=performance.now();originalClick();
  target.classList.remove('control-tap');void target.offsetWidth;target.classList.add('control-tap');setTimeout(()=>target.classList.remove('control-tap'),300);
  // Remains visible even when a seal/ring button is rebuilt immediately after the tap.
  const r=target.getBoundingClientRect();if(!r.width||!r.height)return;
  const flash=document.createElement('div');flash.className='control-tap-flash';flash.setAttribute('aria-hidden','true');
  Object.assign(flash.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});document.body.appendChild(flash);setTimeout(()=>flash.remove(),300);
 };
 const control=e=>{const el=e.target.closest?.('button,[role="button"],#nucleus-canvas');return el&&!el.disabled&&el.getAttribute('aria-disabled')!=='true'?el:null;};
 document.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;const el=control(e);if(!el)return;lastPointer=el;lastPointerAt=performance.now();feedback(el);},true);
 document.addEventListener('click',e=>{const el=control(e);if(!el)return;if(el===lastPointer&&e.detail!==0&&performance.now()-lastPointerAt<800)return;feedback(el);},true);
 document.addEventListener('keydown',e=>{if(e.repeat||e.code!=='Space'||!tRunning||e.target.tagName==='INPUT')return;const el=document.getElementById('timing-go-btn');if(el&&!el.disabled)feedback(el);},true);
}

// Dedicated combat results stay readable independently of placement/victory notices.
let combatResultTimer=null,combatSplashTimer=null;
function scheduleCombatResult(render,delay){
 clearTimeout(combatResultTimer);
 combatResultTimer=setTimeout(()=>{combatResultTimer=null;render();},delay);
}
function updateDamageHUD(){
 for(const id of ['arena-damage','battle-damage']){const el=document.getElementById(id);if(el)el.textContent=(id==='battle-damage'?'⚔ ':'⚔ Dano base: ')+playerBaseDamage().toFixed(2).replace('.',',')+' HP';}
}
function showCombatSplash(title,kind){
 const el=document.getElementById('action-result');
 presentResult(title,el?.dataset.detail||'',kind);
}
function presentResult(title,detail,kind){
 let el=document.getElementById('action-result');
 if(!el){el=document.createElement('div');el.id='action-result';el.setAttribute('role','status');document.body.appendChild(el);}
 clearTimeout(feedbackTimer);el.className='unified-result '+kind;el.dataset.detail=detail;
 el.innerHTML='<div class="result-art"><strong>'+esc(title)+'</strong></div><span>'+esc(detail)+'</span>';
 el.hidden=false;feedbackUntil=performance.now()+2200;
 feedbackTimer=setTimeout(()=>el.hidden=true,2200);
}
function showCombatResult(title,damage,critical,perfect,enemy=false,gains=''){
 const label=critical?(enemy?'CRÍTICO DO BOSS':perfect?'PERFECT • CRÍTICO':'CRÍTICO'):perfect?'PERFECT':enemy?'ATAQUE DO BOSS':'ACERTO';
 const detail=(enemy?'Dano recebido: ':'Dano no Boss: ')+damage.toFixed(2).replace('.',',')+(enemy?' estabilidade':' HP')+(gains?' • '+gains:'');
 presentResult(label,detail,critical?'critical':perfect?'perfect':enemy?'error':'hit');
}
// Map the original platform anchor through the same center/cover crop as the art.
function alignBossPlatform(){
 const field=document.querySelector('.battle-field');if(!field)return;
 const im=guardianImageCache.get(BOSSES[G.bossIdx%BOSSES.length]?.id);
 if(!im?.naturalWidth)return;
 const w=field.clientWidth,h=field.clientHeight;if(!w||!h)return;
 const scaledHeight=im.naturalHeight*Math.max(w/im.naturalWidth,h/im.naturalHeight);
 field.style.setProperty('--tower-foot',(.095*scaledHeight-(scaledHeight-h)/2)+'px');
}
let bossFieldObserver;
function watchBossPlatform(){
 const field=document.querySelector('.battle-field');if(!field)return;
 if(!bossFieldObserver&&typeof ResizeObserver!=='undefined'){bossFieldObserver=new ResizeObserver(()=>{alignBossPlatform();renderBossTower();});bossFieldObserver.observe(field);}
 alignBossPlatform();
}
