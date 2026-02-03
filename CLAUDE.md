# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server at localhost:3000
npm run build        # TypeScript + Vite build
npm run verify       # Typecheck + lint + format (run before commits)
npm test             # Vitest
npm test -- tests/unit/visualizers/spectrum.test.ts  # Single test
npm run test:e2e     # Playwright
```

## Architecture

```
AudioEngine → AudioData → VisualizerManager → Active Visualizer → Canvas
```

State: Zustand store at `src/store/useAudioStore.ts`

## Adding a Visualizer

1. Extend `BaseVisualizer` in `src/visualizers/`
2. Implement: `initialize(canvas)`, `update(audioData)`, `render()`, `dispose()`
3. Register in `VisualizerManager`
4. Add tests in `tests/unit/visualizers/`

## Adding a Theme

Copy `src/themes/WinampClassic.ts` as template. Define `palette` and optional `shaderUniforms`.

## Testing

- Unit: `tests/unit/` with mocks at `tests/mocks/webgl.ts` and `tests/mocks/webaudio.ts`
- E2E: `tests/e2e/`

## Gotchas

- Audio requires user gesture to start (browser autoplay policy)
- WebGL context can be lost on GPU memory pressure—visualizers must handle `dispose()` cleanly
- Demo mode generates synthetic audio when no file loaded
