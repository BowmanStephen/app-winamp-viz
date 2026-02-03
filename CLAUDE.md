# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A 90s Winamp-style music visualizer built with React, Three.js, TypeScript, and the Web Audio API. Features classic visualizers (Spectrum Analyzer, Oscilloscope, Milkdrop, VU Meter) with authentic CRT effects and themeable UI.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # TypeScript compile + Vite build
npm run verify       # Typecheck + lint + format check (run before commits)
npm test             # Run Vitest tests
npm test -- --watch  # Watch mode
npm test -- tests/unit/visualizers/spectrum.test.ts  # Single test
npm run test:coverage  # Coverage report
npm run test:e2e     # Playwright e2e tests
npm run lint:fix     # Auto-fix lint issues
npm run format       # Auto-format code
```

## Architecture

### Core Data Flow
```
AudioEngine (Web Audio API) → AudioData (FFT/TimeDomain)
    → VisualizerManager → Active Visualizer → Three.js Scene
    → Post-processing (CRT Effects) → Canvas
```

### Key Systems

**AudioEngine** (`src/audio/AudioEngine.ts`): Web Audio API wrapper providing FFT frequency data and time-domain waveform data. Supports both real audio files and synthetic demo mode.

**BaseVisualizer** (`src/visualizers/BaseVisualizer.ts`): Abstract class all visualizers extend. Implements `initialize(canvas)`, `update(audioData)`, `render()`, `dispose()`, `setTheme(theme)`. Provides built-in beat detection and FPS tracking.

**VisualizerManager** (`src/visualizers/VisualizerManager.ts`): Registry that holds all visualizers and manages switching between them.

**ThemeManager** (`src/themes/ThemeManager.ts`): Handles theme loading, validation, and dynamic switching. Themes are TypeScript objects defining colors, palettes, and CRT effects.

### State Management
Zustand store at `src/store/useAudioStore.ts` - manages playback state, visualizer selection, and audio data flow.

### Path Aliases (defined in vite.config.ts)
- `@/` → `./src`
- `@visualizers/` → `./src/visualizers`
- `@themes/` → `./src/themes`
- `@audio/` → `./src/audio`
- `@components/` → `./src/components`
- `@hooks/` → `./src/hooks`
- `@store/` → `./src/store`
- `@utils/` → `./src/utils`
- `@types/` → `./src/types`

## Adding a New Visualizer

1. Create class extending `BaseVisualizer` in `src/visualizers/`
2. Implement required methods: `initialize(canvas)`, `update(audioData)`, `render()`, `dispose()`
3. Register in `VisualizerManager`
4. Add tests in `tests/unit/visualizers/`

## Adding a New Theme

Themes are TypeScript objects in `src/themes/` defining:
- `palette`: primary, secondary, background, foreground, spectrum colors
- `shaderUniforms`: optional custom uniforms for Milkdrop

See `src/themes/WinampClassic.ts` for reference.

## Testing

- Unit tests: `tests/unit/` (Vitest + happy-dom)
- Mocks for WebGL/Three.js: `tests/mocks/webgl.ts`
- Mocks for Web Audio: `tests/mocks/webaudio.ts`
- Coverage thresholds: 80% statements/functions/lines, 75% branches
