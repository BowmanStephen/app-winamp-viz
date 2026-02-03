# Winamp Visualizer Technical Decisions

## Executive Summary

This document resolves four critical architectural decisions for the Winamp Visualizer project. All decisions prioritize **authentic 90s aesthetics**, **WebGL performance**, and **real-time audio-visual synchronization** over modern developer conveniences.

| Decision     | Choice                    | Key Factor                 |
| ------------ | ------------------------- | -------------------------- |
| Build Tool   | **Vite**                  | WebGL hydration avoidance  |
| UI Framework | **Vanilla React + Radix** | Pixel-perfect 90s control  |
| Audio        | **Web Audio API**         | Direct FFT access          |
| Animation    | **RAF + CSS Hybrid**      | Linear timing authenticity |

---

## Decision 1: Build Tool

### Options Considered

| Criteria                 | Vite          | Next.js              |
| ------------------------ | ------------- | -------------------- |
| **Dev Server Speed**     | Instant HMR   | Slower startup       |
| **Bundle Size**          | Minimal       | Larger runtime       |
| **WebGL Hydration**      | ✅ None       | ⚠️ SSR complications |
| **Configuration**        | Simple        | Complex for SPA      |
| **ES Modules**           | Native        | Abstracted           |
| **Three.js Integration** | Tree-shakable | Hydration issues     |
| **Deployment**           | Static files  | Vercel-optimized     |

### Recommendation: **Vite**

#### Justification

**Critical Factor: WebGL Hydration**
Next.js SSR causes hydration mismatches with WebGL canvases. Three.js contexts must be client-only, requiring `useEffect` guards and dynamic imports that complicate the codebase.

```typescript
// Next.js requires this workaround
import dynamic from "next/dynamic";
const Visualizer = dynamic(() => import("./Visualizer"), { ssr: false });
```

Vite's SPA model eliminates this entirely—WebGL contexts initialize immediately on mount without server/client reconciliation.

**Secondary Factors:**

- **Faster iteration**: HMR for shader code in <100ms
- **Smaller bundles**: No Next.js runtime overhead (~50KB saved)
- **Native ES modules**: Three.js tree-shaking works perfectly
- **Simpler mental model**: No SSR/SSG/ISR concepts to manage

### Implementation

```bash
npm create vite@latest winamp-viz -- --template react-ts
```

**Required Configuration:**

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@shaders": path.resolve(__dirname, "./src/shaders"),
    },
  },
  optimizeDeps: {
    include: ["three", "@react-three/fiber"],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
```

### Migration Path

If SSR needs arise later:

1. Add `vite-plugin-ssr` for selective SSR
2. Or migrate to Next.js with `next/dynamic` patterns
3. WebGL code remains unchanged—only routing layer affected

### Risk Assessment

| Risk       | Severity | Mitigation                        |
| ---------- | -------- | --------------------------------- |
| SEO needs  | Low      | Add `vite-plugin-ssr` later       |
| Deployment | Low      | Static hosting on Vercel/Netlify  |
| Ecosystem  | Low      | React ecosystem works identically |

---

## Decision 2: UI Framework

### Options Considered

| Criteria            | Vanilla + Radix     | shadcn/ui             |
| ------------------- | ------------------- | --------------------- |
| **90s Aesthetic**   | ✅ Complete control | ❌ Modern constraints |
| **Bundle Size**     | Minimal             | Component bloat       |
| **Pixel Precision** | ✅ Exact control    | Tailwind rounding     |
| **Skeuomorphic 3D** | ✅ Custom shaders   | ❌ Flat design        |
| **Bitmap Fonts**    | ✅ Native support   | Font stack conflicts  |
| **CRT Effects**     | ✅ CSS filters      | Limited               |
| **Accessibility**   | Radix primitives    | Built-in              |
| **Dev Speed**       | Slower              | Faster initial        |

### Recommendation: **Vanilla React + Radix UI Primitives**

#### Justification

**Critical Factor: 90s Authenticity**
Modern UI libraries enforce contemporary design patterns—flat aesthetics, rounded corners, and smooth animations. Replicating Winamp's:

- **3D beveled buttons** with inset shadows
- **Pixel-perfect bitmap fonts** (Winamp skins use .fon files)
- **CRT phosphor glow** and scanline effects
- **1px hairlines** without subpixel anti-aliasing

...requires fighting the library rather than using it.

**Why Radix UI?**
Radix provides unstyled, accessible primitives (dialogs, sliders, tooltips) without imposing design opinions. We layer our 90s styling on top.

```typescript
// Custom 90s slider using Radix primitive
import * as Slider from '@radix-ui/react-slider'

export const Slider90s = () => (
  <Slider.Root className="slider-90s-container">
    <Slider.Track className="slider-90s-track">
      <Slider.Range className="slider-90s-range" />
    </Slider.Track>
    <Slider.Thumb className="slider-90s-thumb" />
  </Slider.Root>
)
```

```css
/* 90s slider styling */
.slider-90s-container {
  /* 3D bevel effect */
  border-top: 1px solid #808080;
  border-left: 1px solid #808080;
  border-right: 1px solid #ffffff;
  border-bottom: 1px solid #ffffff;
  background: #c0c0c0;
}

.slider-90s-thumb {
  /* Chunky 90s slider handle */
  width: 11px;
  height: 21px;
  background: linear-gradient(to bottom, #c0c0c0, #808080);
  border: 1px outset #ffffff;
}
```

### Implementation Strategy

**CSS Architecture:**

```css
/* design-tokens.css */
:root {
  /* 90s Winamp color palette */
  --winamp-bg: #000000;
  --winamp-display: #0000aa;
  --winamp-text: #00ff00;
  --winamp-text-dim: #008000;
  --winamp-accent: #ff0000;

  /* 3D button bevels */
  --bevel-light: #ffffff;
  --bevel-shadow: #808080;
  --bevel-dark: #404040;

  /* Bitmap font stack */
  --font-pixel: "Winamp Pixel", "Courier New", monospace;
}
```

**Component Strategy:**

- `Button90s`: 3D beveled buttons with :active inset states
- `Slider90s`: Radix primitive with custom styling
- `Window90s`: Draggable panels with titlebar
- `Playlist90s`: Virtualized scrolling list
- `Equalizer90s`: Canvas-based frequency bars

### Migration Path

If design requirements shift modern:

1. Swap Radix primitives for shadcn/ui
2. Keep component API identical
3. Replace CSS modules with Tailwind classes
4. Zero React logic changes required

### Risk Assessment

| Risk           | Severity | Mitigation                        |
| -------------- | -------- | --------------------------------- |
| Dev velocity   | Medium   | Component library grows over time |
| Accessibility  | Low      | Radix provides ARIA compliance    |
| Browser compat | Low      | CSS features widely supported     |
| Maintenance    | Medium   | Document design system rigorously |

---

## Decision 3: Audio Library

### Options Considered

| Criteria            | Web Audio API          | Howler.js             |
| ------------------- | ---------------------- | --------------------- |
| **FFT Access**      | ✅ Native AnalyserNode | ❌ Not available      |
| **Latency**         | ✅ Lowest possible     | Higher abstraction    |
| **Bundle Size**     | ✅ Zero deps           | ~15KB minified        |
| **Cross-browser**   | Modern browsers        | Older browser support |
| **Autoplay Policy** | Manual handling        | Built-in workarounds  |
| **Streaming**       | Manual implementation  | Built-in              |
| **Codec Support**   | Browser dependent      | Polyfills included    |

### Recommendation: **Web Audio API (Native)**

#### Justification

**Critical Factor: FFT Data Access**
Audio visualizers require real-time frequency analysis. Web Audio API's `AnalyserNode` provides this natively:

```typescript
// Direct FFT access - impossible with Howler
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function updateVisualizer() {
  analyser.getByteFrequencyData(dataArray);
  // dataArray now contains 0-255 amplitude values for each frequency band
  renderBars(dataArray);
  requestAnimationFrame(updateVisualizer);
}
```

Howler.js abstracts the audio graph and doesn't expose analyser nodes. For visualizers, this is a dealbreaker.

**Secondary Factors:**

- **Zero dependencies**: Smaller bundle, no update risk
- **Fine-grained control**: Direct node graph manipulation
- **Best performance**: No wrapper overhead

### Implementation

```typescript
// AudioEngine.ts - Singleton pattern
class AudioEngine {
  private static instance: AudioEngine;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  async init(audioElement: HTMLAudioElement): Promise<void> {
    this.audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();

    // Safari workaround
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    this.source = this.audioContext.createMediaElementSource(audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  // Demo mode for users without audio files
  startDemoMode(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.analyser!);
    this.analyser!.connect(this.audioContext.destination);

    oscillator.frequency.value = 440;
    gainNode.gain.value = 0.1;

    oscillator.start();

    // Animate frequency for visual effect
    setInterval(() => {
      oscillator.frequency.value = 200 + Math.random() * 600;
    }, 200);
  }
}
```

**Autoplay Policy Handling:**

```typescript
// Always resume on user interaction
function handlePlayClick() {
  const engine = AudioEngine.getInstance();

  if (engine.context.state === "suspended") {
    await engine.context.resume();
  }

  audioElement.play();
}
```

### Migration Path

If advanced audio features needed:

1. Add Howler.js for streaming/playlist management
2. Connect Howler's internal audio element to Web Audio API
3. Best of both worlds: Howler for UI, Web Audio for analysis

### Risk Assessment

| Risk              | Severity | Mitigation                      |
| ----------------- | -------- | ------------------------------- |
| Browser support   | Low      | All modern browsers support     |
| Safari quirks     | Medium   | Documented workarounds in code  |
| Autoplay blocking | Medium   | Clear user interaction required |
| Codec limitations | Low      | MP3/FLAC universally supported  |

---

## Decision 4: Animation Library

### Options Considered

| Criteria            | RAF + CSS           | Framer Motion    |
| ------------------- | ------------------- | ---------------- |
| **90s Timing**      | ✅ Linear/instant   | ❌ Smooth easing |
| **Performance**     | ✅ 60fps guaranteed | React overhead   |
| **Visualizer Sync** | ✅ Synced to audio  | Decoupled        |
| **Bundle Size**     | ✅ Zero             | ~40KB            |
| **UI Transitions**  | CSS handles         | Overkill         |
| **Learning Curve**  | Low                 | Moderate         |
| **Modern Feel**     | ❌ Too authentic    | ✅ Polished      |

### Recommendation: **RAF + CSS Hybrid**

#### Justification

**Critical Factor: Authentic 90s Timing**
90s UIs used:

- **Instant state changes** (no 300ms fades)
- **Linear interpolation** (no ease-in-out)
- **Discrete steps** (sliders snap to positions)

Modern libraries like Framer Motion optimize for smooth, fluid interfaces—the opposite of the chunky, immediate feel of Winamp.

**Architecture:**

```typescript
// Visualizer loop - isolated from React
class VisualizerLoop {
  private rafId: number | null = null;
  private lastTime = 0;
  private fps = 60;
  private frameInterval = 1000 / this.fps;

  start(callback: (data: Uint8Array, deltaTime: number) => void) {
    const loop = (currentTime: number) => {
      const deltaTime = currentTime - this.lastTime;

      // Throttle to target FPS
      if (deltaTime >= this.frameInterval) {
        const audioData = AudioEngine.getInstance().getFrequencyData();
        callback(audioData, deltaTime);
        this.lastTime = currentTime - (deltaTime % this.frameInterval);
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}
```

**CSS for UI Animations:**

```css
/* Instant button states - no transitions */
.button-90s {
  border: 2px outset #c0c0c0;
}

.button-90s:active {
  border: 2px inset #c0c0c0;
  /* No transition property = instant */
}

/* Slider thumb - instant positioning */
.slider-thumb {
  position: absolute;
  left: var(--value-percent);
  /* No transition = immediate response */
}

/* Window drag - hardware accelerated */
.window-90s {
  transform: translate3d(var(--x), var(--y), 0);
  will-change: transform;
}
```

### Implementation Strategy

**Separation of Concerns:**

| Animation Type  | Technology     | Rationale                     |
| --------------- | -------------- | ----------------------------- |
| Visualizer bars | RAF + WebGL    | Synced to audio frame         |
| Equalizer LEDs  | RAF + Canvas   | Real-time frequency response  |
| Window dragging | RAF + CSS      | 60fps, GPU accelerated        |
| Button presses  | CSS :active    | Instant feedback              |
| Playlist scroll | CSS overflow   | Native performance            |
| Window minimize | CSS transition | 0ms (instant) or 50ms (retro) |

**Phosphor Decay Effect:**

```typescript
// Authentic CRT phosphor persistence
class PhosphorDecay {
  private previousFrame: Uint8Array;
  private decayFactor = 0.7; // 70% brightness retained

  applyDecay(currentData: Uint8Array): Uint8Array {
    for (let i = 0; i < currentData.length; i++) {
      currentData[i] = Math.max(
        currentData[i],
        this.previousFrame[i] * this.decayFactor,
      );
      this.previousFrame[i] = currentData[i];
    }
    return currentData;
  }
}
```

### Migration Path

If modern animations required:

1. Add Framer Motion for specific transitions
2. Keep RAF loop for visualizer (uncoupled)
3. Use `motion.div` sparingly for non-90s components

### Risk Assessment

| Risk               | Severity | Mitigation                              |
| ------------------ | -------- | --------------------------------------- |
| RAF battery drain  | Low      | Pause when hidden (Page Visibility API) |
| Mobile performance | Medium   | Reduce FFT size on low-end devices      |
| React conflicts    | Low      | Keep RAF outside React lifecycle        |
| Code complexity    | Low      | Well-established patterns               |

---

## Implementation Checklist

### Phase 1: Foundation

- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure path aliases and build optimization
- [ ] Set up CSS design tokens system
- [ ] Create AudioEngine singleton with AnalyserNode
- [ ] Implement RAF visualizer loop

### Phase 2: Core Components

- [ ] Build Button90s with 3D bevels
- [ ] Build Slider90s with Radix primitives
- [ ] Build Window90s with drag support
- [ ] Implement phosphor decay shader
- [ ] Create demo mode with oscillators

### Phase 3: Polish

- [ ] Add Safari autoplay workarounds
- [ ] Implement Page Visibility API for RAF pausing
- [ ] Performance profiling on 60Hz/144Hz displays
- [ ] Bundle analysis and optimization
- [ ] Accessibility audit (keyboard navigation, ARIA)

### Phase 4: Integration

- [ ] File drop zone for audio
- [ ] Playlist management
- [ ] Skin/theme system
- [ ] Export/share visualizations

---

## Summary

These decisions prioritize **authenticity over convenience**:

1. **Vite** gives us WebGL without SSR headaches
2. **Vanilla styling** lets us replicate 90s pixels exactly
3. **Web Audio API** provides the FFT data visualizers need
4. **RAF + CSS** delivers that chunky, immediate 90s feel

The result will feel like real Winamp—not a modern approximation.

---

_Document Version: 1.0_  
_Last Updated: 2026-02-03_  
_Status: Approved for Implementation_
