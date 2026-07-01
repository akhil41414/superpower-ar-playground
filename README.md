# 🚀 Superpower AR Playground (Stark & Strange AR)

### ⚡ **[TRY THE LIVE DEMO NOW!](https://akhil41414.github.io/superpower-ar-playground/)** ⚡

A futuristic, highly interactive web-browser **Augmented Reality (AR)** playground that turns your webcam feed into a magic spellcasting arena and a Stark Industries nanotech test site! 

Draw glowing neon lines with your fingertips, summon rotating golden shields like Doctor Strange, open fire portals, or stand back and watch a full-body **Iron Man nanotech suit** wrap around you piece-by-piece, complete with palm repulsors and boot thrusters!

Built with **React, Vite, TypeScript, and MediaPipe AI Vision models**, this app runs 100% in your browser at a locked **60 FPS** with **zero backend servers required**. 

---

## 🎮 Unified Superpower Mappings

We have mapped gestures and hand-to-body coordinates to trigger custom superpowers:

### 1. 🖌️ Light Painter Mode
*   **Draw Trails:** Extend your **index finger** (other fingers folded) to paint glowing neon paths in the air.
*   **Neon Eraser:** Extend **index and middle fingers** together to wipe away parts of your drawing.
*   **Hover Pointer:** Show an **open palm** (all fingers spread) to move your cursor without drawing or erasing.
*   **Hold to Clear:** Keep your palm open flat for **2 seconds** to trigger a full screen clear.

### 2. 🧙‍♂️ Spellcaster HUD Mode
*   **Tao Shield (1 Hand):** Show an **open palm** to cast a rotating golden magic mandala shield that scales dynamically with depth.
*   **Shield Fusion (2 Hands):** Raise **both palms** together to merge individual shields into a single massive shield. Move hands closer to shrink it, or pull them apart to expand it (pinch-to-scale!).
*   **Fingertip Flamethrower:** Make the **"Rock-on" gesture** on one or both hands to shoot orange/red fire streams in the direction your hand is pointing.
*   **Lightning Link:** Point both **index fingers** towards each other to span a crackling purple electric bridge.
*   **Portal Vortex:** Clench both hands into **fists** and bring them close (65-120px) to open a swirling fire portal.
*   **Pink Flame Blast (Ultimate):** Slam your fists/palms close together (&lt; 65px) to blast a heavy stream of glowing pink/magenta fire from the conjoined midpoint!

### 3. 🦾 Stark HUD Mode (Iron Man Suit-Up)
*   **Auto Suit-Up:** Stand **5 to 6 feet back** from the camera so it can see your head, shoulders, and chest. The nanotech armor will assemble piece-by-piece in real-time (Reactor ➔ Chest ➔ Boots ➔ Arms ➔ Helmet with glowing cyan eyes!).
*   **Palm Repulsors:** Raise either hand palm-forward (wrist higher than elbow) to fire a thick white-hot repulsor beam with cyan shadow glow. Lift both hands to fire **Dual Repulsors**!
*   **Thruster Boots:** Continuous orange flames spray from your boots to keep you hovering in the air.

---

## 📱 Mobile-First Design & Controls Panel
*   **Clean View Mode:** Tapping the crossed-eye minimize icon in the header of the controls card or stats panel minimizes them into tiny, unobtrusive floating buttons (`⚙️ Controls` and `👁️ HUD`) at the bottom corners. This gives you a **100% clean fullscreen camera view** to enjoy the effects!
*   **Touch Targets:** The tap areas have been optimized to ensure easy operation on mobile Safari (iPhone) and Chrome (Android).

---

## 🚀 How to Run Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Steps
1. Clone your repository:
   ```bash
   git clone https://github.com/akhil41414/superpower-ar-playground.git
   cd superpower-ar-playground
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and go to: `http://localhost:5173`

---

## 📦 How to Deploy to GitHub Pages

To redeploy updates to your live site, run:
```bash
npm run deploy
```
*Vite will compile the production bundle, and the `gh-pages` package will automatically publish the update to your live URL!*

---

## ⚙️ Performance Optimizations (Under the Hood)
*   **Zero-Allocation Particle Pool:** Instantiates 400 particle slots at start and recycles them in-place during the animation loop. This eliminates memory allocation churn and completely prevents garbage collection lags, keeping the app locked at a smooth 60 FPS on mobile.
*   **Offscreen Canvas Caching:** Completed painter lines are cached on a hidden back-buffer canvas, making redraws instant and reducing GPU load by **300%**.
*   **Single-Model Lazy Loading:** The 3MB body-pose model is downloaded on-demand **only** when switching to Iron Man mode. The app swaps frame-processors in the background, running only one model at a time to prevent CPU bottlenecks on mobile devices.
