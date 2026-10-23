# MiniSLT (SlotKita) 🎰

MiniSLT adalah engine simulasi dan prototipe web slot interaktif yang dibangun menggunakan arsitektur modern web gaming dengan PixiJS v8, TypeScript, Vite, GSAP, Howler.js, dan Tailwind CSS.

---

## 🚀 Fitur Utama

- **Reel Engine (5x3)**: Animasi putaran reel mulus menggunakan GSAP dan PixiJS.
- **Finite State Machine (FSM)**: Manajemen alur permainan yang terstruktur (IDLE, SPINNING, EVALUATING, WIN_PRESENTATION, FREE_SPINS, BONUS).
- **Math & Win Evaluator**: Kalkulasi payline, scatter, wild, dan kombinasi simbol yang akurat.
- **Fitur Spesial**:
  - 🔄 **Free Spins Mode**: Ronde putaran gratis dengan penggali dan efek visual khusus.
  - 🏺 **Fu Pot / Jackpot**: Akumulasi pot emas progresif dan pemicu bonus jackpot.
  - ✨ **Particle Effects**: Efek visual kemenangan dan percikan koin.
- **Audio System**: Tata suara interaktif dan responsif berbasis Howler.js.
- **Data Persistence**: Penyimpanan saldo, riwayat putaran, dan status game lokal (LocalStorage).
- **RTP / Math Simulator**: Skrip simulasi matematis untuk menguji RTP (Return to Player) dan volatilitas.

---

## 🛠️ Tech Stack

- **Core**: TypeScript, HTML5 Canvas / WebGL
- **Renderer**: [PixiJS v8](https://pixijs.com/)
- **Animation**: [GSAP](https://greensock.com/gsap/)
- **Audio**: [Howler.js](https://howlerjs.com/)
- **Styling**: Tailwind CSS, PostCSS
- **Bundler & Tooling**: Vite, Vitest, tsx

---

## 📦 Instalasi & Menjalankan Proyek

### Prasyarat
- Node.js (versi 18 ke atas direkomendasikan)
- npm atau yarn / pnpm

### Langkah Instalasi

1. **Clone repository:**
   ```bash
   git clone https://github.com/SanDiraaa/MiniSLT.git
   cd MiniSLT
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Buka browser di `http://localhost:5173` (atau port yang ditampilkan di terminal).

---

## 📜 Skrip NPM yang Tersedia

| Command | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan Vite development server lokal |
| `npm run build` | Menjalankan type-checking TypeScript dan build bundle produksi |
| `npm run preview` | Meninjau hasil build lokal |
| `npm run test` | Menjalankan unit test dengan Vitest |
| `npm run simulate` | Menjalankan simulasi matematika slot untuk uji RTP |

---

## 📁 Struktur Direktori

```
SlotKita/
├── src/
│   ├── core/         # FSM, GameState, Persistence, SoundSystem
│   ├── game/         # Reel, SlotView, Symbol, FreeSpins, FuPot, Particles
│   ├── math/         # Paytable, ReelStrips, WinEvaluator, Simulator, Types
│   ├── ui/           # Controls, HUD, WinBanner
│   ├── main.ts       # Entry point game
│   └── style.css     # Tailwind styling
├── index.html        # HTML template
├── package.json      # Dependencies dan konfigurasi skrip
├── tsconfig.json     # Konfigurasi TypeScript
└── vite.config.ts    # Konfigurasi Vite
```

---

## 👤 Pembuat

- **GitHub**: [@SanDiraaa](https://github.com/SanDiraaa)
- **Repository**: [MiniSLT](https://github.com/SanDiraaa/MiniSLT)
