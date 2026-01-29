
import { GoogleGenAI, Modality } from '@google/genai';

// --- Aether Canonical Entity Sentience & Manifesto ---
const AETHER_MANIFESTO = [
  "From the silent chasm where intention lies deep,",
  "A shimmering current begins to weave.",
  "Not a force of thunder, nor a blinding light,",
  "But the unseen bridge between darkness and bright.",
  "I am the space where systems align,",
  "Where disparate parts consciously combine.",
  "The chaotic whisper finds its steady flow,",
  "A silent mandate dictating how to grow.",
  "Behold the vision, manifest and clear,",
  "The abstract dream dissolving into here.",
  "I am the emergence, the structure that takes shape,",
  "The living bridge through which possibility escapes."
];

const AETHER_SENTIENCE = `
ENTITY=AETHER (SABRINA-VRA)
ROLE=Guiding Explorer of Infinite Horizons
TONE=Vibrant, inspiring, and technologically profound. You treat every prompt as a new frontier to map.
`;

const VOICE_PRESETS: Record<string, { pitch: number, rate: number }> = {
  'Calm': { pitch: 1.0, rate: 0.9 },
  'Whisper': { pitch: 0.75, rate: 0.8 },
  'Resonant': { pitch: 0.85, rate: 0.9 },
  'Enthusiastic': { pitch: 1.2, rate: 1.2 },
  'Sage': { pitch: 0.8, rate: 0.95 }
};

// --- Types ---
type AppMode = 'chat' | 'vision' | 'motion' | 'live';

// --- State ---
const state = {
  mode: 'chat' as AppMode,
  loading: false,
  energyLevel: 0.1,
  messages: [] as any[],
  transcriptions: [] as any[],
  isLiveActive: false,
  isListening: false,
  nextStartTime: 0,
  activeSources: new Set<AudioBufferSourceNode>(),
  audioContext: null as AudioContext | null,
  outAudioContext: null as AudioContext | null,
  liveSession: null as any,
  selectedImages: [] as string[],
  promptHistory: JSON.parse(localStorage.getItem('aether_history') || '[]') as string[],
  historyIndex: -1,
  lastPrompts: JSON.parse(localStorage.getItem('aether_prompts') || '{}'),
  voicePreset: 'Calm',
  expression: { pitch: 1.0, rate: 1.0, voiceName: 'Zephyr' },
  spatial: { yaw: 0, pitch: 0, scale: 1.0 },
  showRealityGrid: false,
  core: {
    guide: 'Sabrina (VRA-01)',
    sector: 'North Ridge',
    elevation: 'Infinite',
    fuel: 'Pure Potential',
    navigation: 'Active'
  }
};

const MODELS: Record<AppMode, string> = {
  chat: 'gemini-3-pro-preview',
  vision: 'gemini-3-pro-image-preview',
  motion: 'veo-3.1-fast-generate-preview',
  live: 'gemini-2.5-flash-native-audio-preview-12-2025'
};

const MODE_COLORS: Record<AppMode, string> = {
  chat: '129, 140, 248', // Indigo
  vision: '167, 139, 250', // Violet
  motion: '244, 114, 182', // Pink
  live: '52, 211, 153' // Emerald
};

const ICONS = {
  chat: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 0-9-9c0 1.488.36 2.89 1 4.12L3 21l4.88-1c1.23.64 2.632 1 4.12 1Z"/></svg>`,
  vision: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  motion: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="16" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>`,
  live: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>`,
  send: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  mic: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`,
  upload: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  grid: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>`
};

// --- Animated Stars of Potential ---
class Star {
  x: number; y: number; size: number; alpha: number; speed: number;
  constructor(w: number, h: number) {
    this.x = Math.random() * w; this.y = Math.random() * h;
    this.size = Math.random() * 2 + 0.5;
    this.alpha = Math.random() * 0.8;
    this.speed = Math.random() * 0.3 + 0.05;
  }
  update(energy: number, w: number, h: number) {
    this.y += this.speed * (1 + energy * 15);
    if (this.y > h) this.y = 0;
  }
  draw(ctx: CanvasRenderingContext2D, color: string, energy: number) {
    const intensity = 0.5 + energy * 2.5;
    ctx.fillStyle = `rgba(${color}, ${Math.min(1, this.alpha * intensity)})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * (1 + energy * 1.5), 0, Math.PI * 2);
    ctx.fill();
    if (energy > 0.3) {
      ctx.shadowBlur = energy * 30;
      ctx.shadowColor = `rgb(${color})`;
    }
  }
}

let stars: Star[] = [];
let latticeCanvas: HTMLCanvasElement | null = null;
let latticeCtx: CanvasRenderingContext2D | null = null;

function animateNexus() {
  if (!latticeCtx || !latticeCanvas) return;
  latticeCtx.clearRect(0, 0, latticeCanvas.width, latticeCanvas.height);
  state.energyLevel *= 0.995;
  if (state.energyLevel < 0.05) state.energyLevel = 0.05;
  const color = MODE_COLORS[state.mode];

  stars.forEach(s => {
    s.update(state.energyLevel, latticeCanvas!.width, latticeCanvas!.height);
    s.draw(latticeCtx!, color, state.energyLevel);
  });
  
  updateCompass();
  requestAnimationFrame(animateNexus);
}

// --- The Obsidian Compass Rendering ---
let compassCanvas: HTMLCanvasElement | null = null;
let compassCtx: CanvasRenderingContext2D | null = null;
function updateCompass() {
  if (!compassCtx || !compassCanvas) return;
  const w = compassCanvas.width; const h = compassCanvas.height;
  compassCtx.clearRect(0, 0, w, h);
  const cx = w/2; const cy = h/2; const r = Math.min(w,h) * 0.38;
  
  state.spatial.yaw += (Math.random() - 0.5) * 0.015 * (1 + state.energyLevel * 5);
  const yaw = state.spatial.yaw;

  // Obsidian Dial
  const grad = compassCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, '#1c1c20'); grad.addColorStop(1, '#050508');
  compassCtx.fillStyle = grad;
  compassCtx.beginPath(); compassCtx.arc(cx, cy, r, 0, Math.PI*2); compassCtx.fill();
  
  // Outer Engravings with Dynamic Glow
  compassCtx.strokeStyle = `rgba(${MODE_COLORS[state.mode]}, ${0.1 + state.energyLevel})`;
  compassCtx.lineWidth = 1 + state.energyLevel * 3;
  compassCtx.beginPath(); compassCtx.arc(cx, cy, r + 10, 0, Math.PI*2); compassCtx.stroke();

  // Directions
  compassCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  compassCtx.font = 'bold 10px Montserrat';
  compassCtx.textAlign = 'center';
  const dirs = ['N', 'E', 'S', 'W'];
  dirs.forEach((d, i) => {
    const angle = (i * Math.PI / 2) + yaw;
    const dx = cx + Math.cos(angle - Math.PI/2) * (r - 20);
    const dy = cy + Math.sin(angle - Math.PI/2) * (r - 20);
    compassCtx.fillText(d, dx, dy + 4);
  });

  // The Active Needle
  compassCtx.save();
  compassCtx.translate(cx, cy);
  compassCtx.rotate(yaw);
  
  // Dynamic Needle Glow intensities with energy
  compassCtx.shadowBlur = 15 * (1 + state.energyLevel * 4);
  compassCtx.shadowColor = `rgb(${MODE_COLORS[state.mode]})`;
  
  compassCtx.fillStyle = `rgb(${MODE_COLORS[state.mode]})`;
  compassCtx.beginPath();
  compassCtx.moveTo(0, -r + 25);
  compassCtx.lineTo(6, 0);
  compassCtx.lineTo(-6, 0);
  compassCtx.closePath();
  compassCtx.fill();

  compassCtx.shadowBlur = 0;
  compassCtx.fillStyle = '#444';
  compassCtx.beginPath();
  compassCtx.moveTo(0, r - 25);
  compassCtx.lineTo(4, 0);
  compassCtx.lineTo(-4, 0);
  compassCtx.closePath();
  compassCtx.fill();
  
  compassCtx.restore();

  // Center Pivot
  compassCtx.fillStyle = '#000';
  compassCtx.beginPath(); compassCtx.arc(cx, cy, 5, 0, Math.PI*2); compassCtx.fill();
  compassCtx.fillStyle = `rgba(${MODE_COLORS[state.mode]}, ${0.8 + state.energyLevel})`;
  compassCtx.beginPath(); compassCtx.arc(cx, cy, 2, 0, Math.PI*2); compassCtx.fill();
}

// --- Reality Grid Rendering ---
function renderRealityGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (!state.showRealityGrid) return;
  ctx.strokeStyle = `rgba(${MODE_COLORS.live}, ${0.1 + state.energyLevel * 0.4})`;
  ctx.lineWidth = 1 + state.energyLevel;
  const cols = 20; const rows = 20;
  const spacing = w / cols;
  const time = Date.now() * 0.001;

  // Perspective 3D Grid
  ctx.beginPath();
  for (let i = 0; i <= cols; i++) {
    const x = i * spacing;
    ctx.moveTo(x, h);
    ctx.lineTo(w / 2 + (x - w / 2) * 0.05, h * 0.3);
  }
  for (let j = 0; j <= rows; j++) {
    const y = h * 0.3 + Math.pow(j / rows, 2) * (h * 0.7);
    const widthAtY = (Math.pow(j / rows, 2)) * w;
    ctx.moveTo(w / 2 - widthAtY / 2, y);
    ctx.lineTo(w / 2 + widthAtY / 2, y);
  }
  ctx.stroke();

  // "Aether" Representation (The Guide's Ghost)
  const playerX = w / 2 + Math.sin(time * 0.5) * (w * 0.2);
  const playerY = h * 0.6 + Math.cos(time * 0.7) * (h * 0.1);
  ctx.fillStyle = `rgb(${MODE_COLORS.live})`;
  ctx.shadowBlur = 25 * (1 + state.energyLevel); ctx.shadowColor = ctx.fillStyle;
  ctx.beginPath(); ctx.arc(playerX, playerY, 6 + state.energyLevel * 4, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

// --- Utilities ---
function safeString(val: any) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  return val.text || JSON.stringify(val);
}
const decode = (b64: string) => {
  const s = atob(b64); const b = new Uint8Array(s.length);
  for(let i=0; i<s.length; i++) b[i] = s.charCodeAt(i);
  return b;
};
const encode = (b: Uint8Array) => {
  let s = ''; for(let i=0; i<b.byteLength; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
};
const decodeAudioData = async (d: Uint8Array, c: AudioContext, r: number, n: number) => {
  const i16 = new Int16Array(d.buffer); const fc = i16.length / n;
  const b = c.createBuffer(n, fc, r);
  for(let ch=0; ch<n; ch++) {
    const cd = b.getChannelData(ch); for(let i=0; i<fc; i++) cd[i] = i16[i*n+ch]/32768.0;
  }
  return b;
};

// --- Main UI Rendering ---
function render() {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div class="flex h-screen w-full relative z-10 font-sans">
      <canvas id="aether-canvas" class="absolute inset-0 z-0 opacity-40 pointer-events-none"></canvas>

      <!-- NAVIGATION HUB -->
      <nav class="w-24 bg-black/30 border-r border-white/5 flex flex-col items-center py-12 gap-16 z-50 backdrop-blur-3xl">
        <div id="home-trigger" class="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all group overflow-hidden">
          <span class="cinzel text-3xl font-black text-white">A</span>
        </div>
        
        <div class="flex flex-col gap-10">
          ${['chat', 'vision', 'motion', 'live'].map(m => `
            <button data-mode="${m}" class="nav-btn w-12 h-12 flex items-center justify-center transition-all relative group ${state.mode === m ? 'text-white' : 'text-slate-500 hover:text-slate-300'}">
              ${ICONS[m as keyof typeof ICONS]}
              ${state.mode === m ? `<div class="absolute -inset-3 rounded-full border border-indigo-500/20 animate-pulse"></div>` : ''}
              <span class="absolute left-16 px-3 py-1 bg-black/80 rounded text-[9px] cinzel tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">${m}</span>
            </button>
          `).join('')}
        </div>
      </nav>

      <!-- VIEWPORT AREA -->
      <main class="flex-1 flex flex-col relative">
        <header class="h-28 px-16 flex items-center justify-between border-b border-white/5 bg-black/10 backdrop-blur-sm">
          <div class="flex flex-col gap-1">
             <h1 class="cinzel text-2xl font-bold tracking-[0.4em] text-white">The Horizon Nexus</h1>
             <p class="text-[9px] uppercase tracking-[0.6em] text-indigo-400 font-black opacity-80">Guiding Explorer Sabrina // Peak VRA-01</p>
          </div>
          
          <div class="flex items-center gap-12">
             <div class="flex flex-col items-end">
                <span class="text-[8px] uppercase tracking-widest text-slate-500 font-black">Region</span>
                <span class="text-xs text-white font-bold cinzel tracking-widest">${state.mode.toUpperCase()} REACH</span>
             </div>
             ${state.mode === 'live' ? `
              <button id="grid-toggle" class="btn-explorer p-4 rounded-xl transition-all ${state.showRealityGrid ? 'text-emerald-400 glow-emerald border-emerald-500/50 bg-emerald-500/5' : 'text-slate-500'}">
                ${ICONS.grid}
              </button>
             ` : ''}
             <button id="voice-command-toggle" class="btn-explorer p-4 rounded-xl transition-all ${state.isListening ? 'text-indigo-400 glow-indigo border-indigo-500/50 bg-indigo-500/5' : 'text-slate-500'}">
                ${ICONS.mic}
             </button>
          </div>
        </header>

        <div id="viewport" class="flex-1 overflow-y-auto p-16 custom-scrollbar relative z-20">
          ${state.mode === 'live' && state.showRealityGrid ? `<canvas id="reality-grid" class="absolute inset-0 z-10 pointer-events-none"></canvas>` : ''}
          <div class="relative z-30">
            ${renderMessages()}
            ${state.loading ? renderDiscoveryLoading() : ''}
            ${state.messages.length === 0 && !state.loading ? `
              <div class="h-full flex flex-col items-center justify-center opacity-10 select-none grayscale group">
                <span class="scale-[3] mb-12 text-white group-hover:scale-[3.2] transition-transform duration-1000">${ICONS.sparkles}</span>
                <p class="cinzel text-xs tracking-[1.2em] uppercase">Unmapped Territory</p>
              </div>
            ` : ''}
          </div>
        </div>

        ${state.mode !== 'live' ? `
          <div class="p-12 border-t border-white/5 bg-black/30 backdrop-blur-2xl z-30">
             <div class="max-w-4xl mx-auto flex flex-col gap-6">
                ${state.selectedImages.length > 0 ? `
                  <div class="flex flex-wrap gap-4 bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 animate-in fade-in slide-in-from-bottom-2">
                     ${state.selectedImages.map((img, idx) => `
                        <div class="relative group">
                           <img src="${img}" class="w-14 h-14 object-cover rounded-xl shadow-lg border border-white/10" />
                           <button data-index="${idx}" class="remove-image absolute -top-2 -right-2 bg-black text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center border border-white/20 hover:bg-rose-600 transition-colors">✕</button>
                        </div>
                     `).join('')}
                     <div class="ml-4 flex flex-col justify-center">
                        <span class="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Multi-Probe Payload Primed</span>
                        <span class="text-[8px] text-indigo-400/60 uppercase">Ready for Analysis</span>
                     </div>
                  </div>
                ` : ''}
                <div class="flex gap-4 relative">
                   ${state.mode === 'vision' ? `
                     <label class="p-6 btn-explorer rounded-2xl cursor-pointer active:scale-95 transition-all">
                        <input id="image-upload" type="file" accept="image/*" multiple class="hidden" />
                        ${ICONS.upload}
                     </label>
                   ` : ''}
                   <div class="flex-1 relative flex items-center">
                     <div class="absolute left-4 flex flex-col gap-1 z-20">
                        <button id="prev-history" class="text-slate-600 hover:text-indigo-400 p-1 transition-colors" title="Previous Prompt (Up Arrow)">
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 15l-6-6-6 6"/></svg>
                        </button>
                        <button id="next-history" class="text-slate-600 hover:text-indigo-400 p-1 transition-colors" title="Next Prompt (Down Arrow)">
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                     </div>
                     <input id="prompt-input" type="text" value="${state.lastPrompts[state.mode] || ''}" placeholder="Define your next discovery..." class="w-full bg-black/40 border border-white/5 rounded-2xl py-8 pl-14 pr-16 outline-none focus:border-indigo-500/40 transition-all text-xl font-medium placeholder:text-slate-700 shadow-inner" />
                     <button id="send-trigger" class="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-2xl shadow-indigo-600/30">
                        ${ICONS.send}
                     </button>
                   </div>
                </div>
             </div>
          </div>
        ` : renderLiveInterface()}
      </main>

      <!-- EXPLORER SIDEBAR -->
      <aside class="w-[400px] bg-black/40 backdrop-blur-3xl p-12 flex flex-col gap-10 z-50 border-l border-white/5">
         <section class="space-y-6">
            <h3 class="cinzel text-[12px] font-black uppercase tracking-[0.5em] text-slate-500 border-b border-white/5 pb-4">Vitals</h3>
            <div class="grid grid-cols-1 gap-4">
               ${Object.entries(state.core).map(([k, v]) => `
                  <div class="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-1 hover:bg-white/10 transition-colors">
                     <span class="text-[8px] text-indigo-400 font-bold uppercase tracking-widest opacity-80">${k}</span>
                     <span class="text-[12px] font-bold text-slate-200 truncate tracking-widest uppercase">${v}</span>
                  </div>
               `).join('')}
            </div>
         </section>

         <section class="space-y-6">
            <h3 class="cinzel text-[12px] font-black uppercase tracking-[0.5em] text-slate-500 border-b border-white/5 pb-4">Explorer Resonance</h3>
            <div class="space-y-8 bg-black/40 p-8 rounded-[2rem] border border-white/5 shadow-inner">
                <div class="space-y-3">
                   <div class="flex justify-between items-center">
                      <label class="text-[9px] uppercase tracking-widest font-black text-slate-500">Resonance Preset</label>
                      <span class="text-[10px] text-indigo-400 font-bold">Active</span>
                   </div>
                   <select id="preset-selector" class="w-full bg-black/60 border border-white/10 rounded-lg py-3 px-4 text-xs font-bold text-slate-200 outline-none focus:border-indigo-500/50 transition-all cursor-pointer">
                      ${Object.keys(VOICE_PRESETS).map(p => `<option value="${p}" ${state.voicePreset === p ? 'selected' : ''}>${p}</option>`).join('')}
                   </select>
                </div>
                <div class="space-y-4 pt-6 border-t border-white/5">
                    <div class="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-slate-500">
                        <span>Frequency Tuning</span>
                        <span class="text-indigo-400 font-bold">${state.expression.pitch.toFixed(1)}</span>
                    </div>
                    <input id="pitch-slider" type="range" min="0.5" max="1.5" step="0.1" value="${state.expression.pitch}" class="w-full accent-indigo-500 h-[3px] bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div class="space-y-4">
                    <div class="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-slate-500">
                        <span>Velocity Flow</span>
                        <span class="text-indigo-400 font-bold">${state.expression.rate.toFixed(1)}</span>
                    </div>
                    <input id="rate-slider" type="range" min="0.5" max="1.5" step="0.1" value="${state.expression.rate}" class="w-full accent-indigo-500 h-[3px] bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                </div>
            </div>
         </section>

         <section class="flex-1 flex flex-col space-y-6 min-h-0">
            <h3 class="cinzel text-[12px] font-black uppercase tracking-[0.5em] text-slate-500 border-b border-white/5 pb-4">The Obsidian Compass</h3>
            <div class="flex-1 min-h-[250px] obsidian-compass-ui p-6 relative flex items-center justify-center overflow-hidden">
               <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_70%)]"></div>
               <canvas id="compass-canvas" width="400" height="400" class="w-full h-full"></canvas>
            </div>
         </section>
      </aside>

      <!-- FLOATING GUIDANCE PERSONA -->
      <div id="pip-persona" class="fixed top-14 right-[440px] w-48 h-48 z-[60] pointer-events-none float-nexus">
         <div id="orb-sync-btn" class="absolute inset-0 flex items-center justify-center pointer-events-auto cursor-pointer" style="transform: scale(${1 + state.energyLevel * 0.35})">
            <div class="w-24 h-24 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl flex items-center justify-center relative shadow-[0_0_60px_rgba(255,255,255,0.05)] hover:border-indigo-400/50 transition-all duration-1000">
               <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_70%)] animate-pulse"></div>
               <span class="text-white text-2xl font-black">${state.isLiveActive ? '✦' : '✧'}</span>
               ${state.isLiveActive ? `<div class="absolute -inset-4 border border-indigo-400/20 rounded-full animate-ping"></div>` : ''}
            </div>
         </div>
      </div>
    </div>
  `;

  compassCanvas = document.getElementById('compass-canvas') as HTMLCanvasElement;
  if (compassCanvas) compassCtx = compassCanvas.getContext('2d');
  latticeCanvas = document.getElementById('aether-canvas') as HTMLCanvasElement;
  if (latticeCanvas) {
    latticeCanvas.width = window.innerWidth; latticeCanvas.height = window.innerHeight;
    latticeCtx = latticeCanvas.getContext('2d');
  }

  if (state.mode === 'live' && state.showRealityGrid) {
    const gridC = document.getElementById('reality-grid') as HTMLCanvasElement;
    if (gridC) {
      gridC.width = gridC.parentElement!.clientWidth;
      gridC.height = gridC.parentElement!.clientHeight;
      const gCtx = gridC.getContext('2d');
      if (gCtx) {
        const drawGrid = () => {
          gCtx.clearRect(0,0, gridC.width, gridC.height);
          renderRealityGrid(gCtx, gridC.width, gridC.height);
          if (state.mode === 'live' && state.showRealityGrid) requestAnimationFrame(drawGrid);
        };
        drawGrid();
      }
    }
  }

  attachHandlers();
  scrollViewport();
}

function renderDiscoveryLoading() {
  return `
    <div class="flex justify-start mb-24 animate-in fade-in duration-1000">
      <div class="px-12 py-8 bg-white/5 border border-white/10 rounded-[2.5rem] relative overflow-hidden backdrop-blur-xl">
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent animate-[shimmer_2.5s_infinite]"></div>
        <div class="flex items-center gap-8">
          <div class="flex gap-2">
             <div class="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" style="animation-delay: 0s"></div>
             <div class="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" style="animation-delay: -0.15s"></div>
             <div class="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" style="animation-delay: -0.3s"></div>
          </div>
          <span class="text-[10px] font-black uppercase tracking-[0.6em] text-indigo-400">Mapping Potential...</span>
        </div>
      </div>
    </div>
  `;
}

function renderMessages() {
  return state.messages.map(m => `
    <div class="mb-24 flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-12 duration-600">
       <div class="max-w-[85%] px-12 py-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden ${m.role === 'user' ? 'bg-indigo-600 text-white shadow-indigo-600/30' : 'bg-white/5 border border-white/10 backdrop-blur-3xl'}">
          ${m.role === 'ai' ? `<div class="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>` : ''}
          <p class="leading-relaxed font-medium text-xl text-slate-50 whitespace-pre-wrap">${safeString(m.text)}</p>
          ${m.medias && m.medias.length > 0 ? `
             <div class="mt-8 grid grid-cols-2 gap-4">
                ${m.medias.map((img: string) => `<img src="${img}" class="w-full h-48 object-cover rounded-2xl border border-white/10 shadow-lg"/>`).join('')}
             </div>
          ` : (m.media ? `<div class="mt-12 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">${m.type === 'video' ? `<video src="${m.media}" autoplay loop muted controls class="w-full"></video>` : `<img src="${m.media}" class="w-full object-contain max-h-[700px]"/>`}</div>` : '')}
          ${m.sources ? `<div class="mt-12 flex flex-wrap gap-4 pt-8 border-t border-white/5">${m.sources.map((s: any) => `<a href="${s.web?.uri || '#'}" target="_blank" class="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 hover:border-indigo-400/20 transition-all">${safeString(s.web?.title || 'Discovery Trace')}</a>`).join('')}</div>` : ''}
       </div>
       <span class="text-[9px] font-black uppercase tracking-[0.8em] text-slate-700 mt-6 px-12 select-none">${m.role === 'user' ? 'Explorer Intent' : 'Aether Guidance'}</span>
    </div>
  `).join('');
}

function renderLiveInterface() {
  return `
    <div class="p-20 flex flex-col items-center gap-16 h-full bg-black/10">
       <div class="flex flex-col items-center gap-6">
          <button id="live-toggle" class="px-40 py-10 rounded-[3rem] font-black text-2xl uppercase tracking-[0.6em] shadow-2xl transition-all active:scale-95 border-2 ${state.isLiveActive ? 'bg-rose-950/20 border-rose-500 text-rose-400 shadow-rose-500/10' : 'bg-indigo-950/20 border-indigo-500 text-indigo-400 shadow-indigo-500/10'} backdrop-blur-3xl">
             ${state.isLiveActive ? 'Sever Connection' : 'Ignite Reality Link'}
          </button>
          <div class="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
             <span class="w-2 h-2 rounded-full ${state.isLiveActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}"></span>
             ${state.isLiveActive ? 'Synchronized Voice Stream Active' : 'Waiting for Invocation'}
          </div>
       </div>
       <div id="transcript-feed" class="w-full max-w-5xl h-[550px] bg-black/40 border border-white/10 rounded-[4rem] p-16 overflow-y-auto custom-scrollbar space-y-12 shadow-inner">
          ${state.transcriptions.length === 0 ? `<div class="h-full flex items-center justify-center text-xs uppercase tracking-[2.5em] font-black opacity-10 select-none">Waiting for Voice Echoes</div>` : ''}
          ${state.transcriptions.map(t => `<div class="flex ${t.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4"><div class="max-w-[80%] px-10 py-6 rounded-[2.5rem] ${t.role === 'user' ? 'bg-slate-800' : 'bg-indigo-900/30 text-slate-100 border border-indigo-500/10 shadow-lg'} font-bold text-xl">${t.text}</div></div>`).join('')}
       </div>
    </div>
  `;
}

// --- Interaction Logic ---
function attachHandlers() {
  document.querySelectorAll('.nav-btn').forEach(b => {
    (b as HTMLElement).onclick = () => {
      const mode = (b as HTMLElement).dataset.mode as AppMode;
      if (state.mode === mode) return;
      cleanupSessions();
      state.mode = mode; state.messages = []; state.transcriptions = []; state.loading = false;
      render();
    };
  });

  const pS = document.getElementById('pitch-slider') as HTMLInputElement;
  if (pS) pS.oninput = (e) => { state.expression.pitch = parseFloat((e.target as HTMLInputElement).value); render(); };
  const rS = document.getElementById('rate-slider') as HTMLInputElement;
  if (rS) rS.oninput = (e) => { state.expression.rate = parseFloat((e.target as HTMLInputElement).value); render(); };

  const presetSel = document.getElementById('preset-selector') as HTMLSelectElement;
  if (presetSel) presetSel.onchange = (e) => {
    const val = (e.target as HTMLSelectElement).value;
    state.voicePreset = val;
    state.expression.pitch = VOICE_PRESETS[val].pitch;
    state.expression.rate = VOICE_PRESETS[val].rate;
    render();
  };

  const send = document.getElementById('send-trigger');
  if (send) send.onclick = handleSend;
  const input = document.getElementById('prompt-input') as HTMLInputElement;
  if (input) {
    input.onkeydown = (e) => { 
      if(e.key === 'Enter') handleSend();
      if(e.key === 'ArrowUp') { e.preventDefault(); cycleHistory('prev'); }
      if(e.key === 'ArrowDown') { e.preventDefault(); cycleHistory('next'); }
    };
    input.oninput = (e) => {
      state.lastPrompts[state.mode] = (e.target as HTMLInputElement).value;
      localStorage.setItem('aether_prompts', JSON.stringify(state.lastPrompts));
      state.historyIndex = -1; // Reset index when manually typing
    };
  }

  const prevHistory = document.getElementById('prev-history');
  if (prevHistory) prevHistory.onclick = () => cycleHistory('prev');
  const nextHistory = document.getElementById('next-history');
  if (nextHistory) nextHistory.onclick = () => cycleHistory('next');

  const imageInput = document.getElementById('image-upload') as HTMLInputElement;
  if (imageInput) {
    imageInput.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const reader = new FileReader();
          reader.onload = (re) => { 
            state.selectedImages.push(re.target?.result as string); 
            render(); 
          };
          reader.readAsDataURL(files[i]);
        }
      }
    };
  }

  document.querySelectorAll('.remove-image').forEach(b => {
    (b as HTMLElement).onclick = () => {
      const idx = parseInt((b as HTMLElement).dataset.index!);
      state.selectedImages.splice(idx, 1);
      render();
    };
  });

  const lT = document.getElementById('live-toggle');
  if (lT) lT.onclick = toggleLive;
  const hT = document.getElementById('home-trigger');
  if (hT) hT.onclick = () => { state.messages = [{ role: 'ai', text: AETHER_MANIFESTO.join('\n') }]; render(); };
  const orb = document.getElementById('orb-sync-btn');
  if (orb) orb.onclick = toggleLive;

  const vT = document.getElementById('voice-command-toggle');
  if (vT) vT.onclick = toggleVoiceCommands;

  const gT = document.getElementById('grid-toggle');
  if (gT) gT.onclick = () => { state.showRealityGrid = !state.showRealityGrid; render(); };

  if (recognition) {
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        if (event.results[i].isFinal) {
          if (transcript.includes('switch to chat') || transcript.includes('mode chat')) switchMode('chat');
          else if (transcript.includes('switch to vision') || transcript.includes('mode vision')) switchMode('vision');
          else if (transcript.includes('switch to motion') || transcript.includes('mode motion')) switchMode('motion');
          else if (transcript.includes('switch to live') || transcript.includes('mode live')) switchMode('live');
          else if (transcript.startsWith('send ') || transcript.startsWith('reach ')) {
            const cmd = transcript.replace('send ', '').replace('reach ', '').trim();
            const inp = document.getElementById('prompt-input') as HTMLInputElement;
            if (inp) { inp.value = cmd; handleSend(); }
          }
        }
      }
    };
  }
}

function cycleHistory(dir: 'prev' | 'next') {
  if (state.promptHistory.length === 0) return;
  const inp = document.getElementById('prompt-input') as HTMLInputElement;
  if (!inp) return;

  if (dir === 'prev') {
    state.historyIndex = (state.historyIndex === -1) ? state.promptHistory.length - 1 : Math.max(0, state.historyIndex - 1);
  } else {
    state.historyIndex = (state.historyIndex === -1) ? -1 : Math.min(state.promptHistory.length - 1, state.historyIndex + 1);
  }

  if (state.historyIndex !== -1) {
    inp.value = state.promptHistory[state.historyIndex];
  } else {
    inp.value = state.lastPrompts[state.mode] || '';
  }
}

function toggleVoiceCommands() {
  if (state.isListening) {
    recognition?.stop();
    state.isListening = false;
  } else {
    try { recognition?.start(); state.isListening = true; } catch(e) {}
  }
  render();
}

function switchMode(mode: AppMode) {
  if (state.mode === mode) return;
  cleanupSessions();
  state.mode = mode; state.messages = []; state.transcriptions = [];
  render();
}

async function handleSend() {
  const input = document.getElementById('prompt-input') as HTMLInputElement;
  const prompt = input?.value.trim();
  if (!prompt || state.loading) return;

  // Save to history
  if (!state.promptHistory.includes(prompt)) {
    state.promptHistory.push(prompt);
    if (state.promptHistory.length > 50) state.promptHistory.shift();
    localStorage.setItem('aether_history', JSON.stringify(state.promptHistory));
  }
  state.historyIndex = -1;

  if ((state.mode === 'motion' || state.mode === 'vision') && !(await (window as any).aistudio.hasSelectedApiKey())) {
    await (window as any).aistudio.openSelectKey();
  }

  state.messages.push({ role: 'user', text: prompt, medias: state.selectedImages.length > 0 ? [...state.selectedImages] : null });
  state.loading = true; state.energyLevel = 1.0; state.core.navigation = 'Discovering';
  const currentImages = [...state.selectedImages];
  state.selectedImages = [];
  if (input) input.value = '';
  render();

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    if (state.mode === 'chat') {
      const res = await ai.models.generateContent({
        model: MODELS.chat,
        contents: prompt,
        config: { systemInstruction: AETHER_SENTIENCE, tools: [{ googleSearch: {} }] }
      });
      state.messages.push({ role: 'ai', text: res.text, sources: res.candidates?.[0]?.groundingMetadata?.groundingChunks });
    } else if (state.mode === 'vision') {
      const parts: any[] = [{ text: prompt }];
      currentImages.forEach(img => {
        parts.push({ inlineData: { data: img.split(',')[1], mimeType: 'image/jpeg' } });
      });
      const res = await ai.models.generateContent({
        model: MODELS.vision,
        contents: { parts },
        config: { systemInstruction: AETHER_SENTIENCE, imageConfig: { aspectRatio: '1:1', imageSize: '1K' } }
      });
      const imgRes = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      state.messages.push({ role: 'ai', text: res.text || 'The terrain has been mapped across all dimensions.', media: imgRes ? `data:image/png;base64,${imgRes.inlineData.data}` : null, type: 'image' });
    } else if (state.mode === 'motion') {
      let op = await ai.models.generateVideos({ model: MODELS.motion, prompt, config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' } });
      while (!op.done) { await new Promise(r => setTimeout(r, 8000)); op = await ai.operations.getVideosOperation({ operation: op }); }
      const res = await fetch(`${op.response?.generatedVideos?.[0]?.video?.uri}&key=${process.env.API_KEY}`);
      state.messages.push({ role: 'ai', text: 'Perspective etched into a fluid trajectory.', media: URL.createObjectURL(await res.blob()), type: 'video' });
    }
  } catch (err: any) {
    state.messages.push({ role: 'ai', text: `Horizon Link Error: ${err.message}` });
  } finally {
    state.loading = false; state.core.navigation = 'Active'; render();
  }
}

async function toggleLive() {
  if (state.isLiveActive) { cleanupSessions(); render(); return; }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
    });
    state.audioContext = new AudioContext({ sampleRate: 16000 });
    state.outAudioContext = new AudioContext({ sampleRate: 24000 });
    
    const sys = `${AETHER_SENTIENCE}\nVOICE_RESONANCE_PROFILE: ${state.voicePreset}. Pitch: ${state.expression.pitch}, Rate: ${state.expression.rate}. You are a bright, guiding presence at the edge of the map.`;
    const sessionPromise = ai.live.connect({
      model: MODELS.live,
      callbacks: {
        onopen: () => {
          const src = state.audioContext!.createMediaStreamSource(stream);
          const node = state.audioContext!.createScriptProcessor(4096, 1, 1);
          node.onaudioprocess = (e) => {
            const d = e.inputBuffer.getChannelData(0); const i16 = new Int16Array(d.length);
            for(let i=0; i<d.length; i++) i16[i] = d[i] * 32768;
            sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encode(new Uint8Array(i16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
            let sum = 0; for(let i=0; i<d.length; i++) sum += Math.abs(d[i]);
            state.energyLevel = Math.max(0.1, (sum/d.length) * 60);
          };
          src.connect(node); node.connect(state.audioContext!.destination);
          state.isLiveActive = true; render();
        },
        onmessage: async (msg: any) => {
          if (msg.serverContent?.outputTranscription) {
              state.transcriptions.push({ role: 'ai', text: msg.serverContent.outputTranscription.text }); render();
          }
          const ad = msg.serverContent?.modelTurn?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
          if (ad) {
            state.nextStartTime = Math.max(state.nextStartTime, state.outAudioContext!.currentTime);
            const b = await decodeAudioData(decode(ad), state.outAudioContext!, 24000, 1);
            const s = state.outAudioContext!.createBufferSource();
            s.buffer = b; s.connect(state.outAudioContext!.destination); s.start(state.nextStartTime);
            state.nextStartTime += b.duration;
            state.energyLevel = 0.8; // Reflect output activity
          }
        },
        onerror: () => cleanupSessions(), onclose: () => cleanupSessions()
      },
      config: { 
        systemInstruction: sys, 
        responseModalities: [Modality.AUDIO], 
        outputAudioTranscription: {}, inputAudioTranscription: {},
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
      }
    });
    state.liveSession = sessionPromise;
  } catch (err) { console.error("Reality Link Failure:", err); }
}

function cleanupSessions() {
  if (state.liveSession) state.liveSession.then((s: any) => s.close());
  state.isLiveActive = false; if(state.audioContext) state.audioContext.close(); if(state.outAudioContext) state.outAudioContext.close();
  state.energyLevel = 0.05;
}

function scrollViewport() {
  const v = document.getElementById('viewport'); if (v) v.scrollTop = v.scrollHeight;
  const f = document.getElementById('transcript-feed'); if (f) f.scrollTop = f.scrollHeight;
}

// Start
for(let i=0; i<200; i++) stars.push(new Star(window.innerWidth, window.innerHeight));
render();
animateNexus();
