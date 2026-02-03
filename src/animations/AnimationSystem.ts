/**
 * AnimationSystem
 *
 * Animation utilities for 90s-style visualizers:
 * - RAF loop manager
 * - AUTHENTIC_90S_TIMING constants
 * - Phosphor decay calculation
 * - Beat sync utilities
 * - Animation scheduling
 * - requestAnimationFrame wrapper
 * - Performance monitoring
 *
 * @module animations/AnimationSystem
 */

// ============================================================================
// Timing Constants - AUTHENTIC_90S_TIMING
// ============================================================================

/**
 * Authentic 90s timing constants based on:
 * - CRT refresh rates (60Hz NTSC, 50Hz PAL)
 * - Phosphor persistence characteristics
 * - Hardware limitations of the era
 * - Human visual perception at the time
 */
export const AUTHENTIC_90S_TIMING = {
  // Display refresh rates
  /** Standard NTSC refresh rate in milliseconds */
  NTSC_REFRESH: 1000 / 60, // 16.67ms

  /** Standard PAL refresh rate in milliseconds */
  PAL_REFRESH: 1000 / 50, // 20ms

  /** NTSC actual refresh (59.94Hz) */
  NTSC_ACTUAL: 1000 / 59.94, // 16.68ms

  /** PAL actual refresh (50Hz) */
  PAL_ACTUAL: 1000 / 50, // 20ms

  // Phosphor characteristics
  /** P31 phosphor (green) persistence in ms */
  P31_PHOSPHOR_PERSISTENCE: 50,

  /** P39 phosphor (blue) persistence in ms */
  P39_PHOSPHOR_PERSISTENCE: 30,

  /** P4 phosphor (white) persistence in ms */
  P4_PHOSPHOR_PERSISTENCE: 40,

  /** Short persistence phosphor (amber/red) */
  SHORT_PERSISTENCE: 20,

  /** Long persistence phosphor (used in some oscilloscopes) */
  LONG_PERSISTENCE: 100,

  // Decay curves
  /** Standard phosphor decay exponent */
  PHOSPHOR_DECAY_EXPONENT: 0.92,

  /** Fast decay for quick transitions */
  FAST_DECAY_EXPONENT: 0.85,

  /** Slow decay for trails */
  SLOW_DECAY_EXPONENT: 0.97,

  // Animation frame timing
  /** Target 60 FPS frame time */
  TARGET_FRAME_TIME: 1000 / 60,

  /** Acceptable frame variance for 60 FPS */
  FRAME_VARIANCE: 2,

  /** Minimum frame time (120 FPS cap) */
  MIN_FRAME_TIME: 1000 / 120,

  /** Maximum frame time (30 FPS floor) */
  MAX_FRAME_TIME: 1000 / 30,

  // Beat detection timing
  /** Typical BPM range minimum */
  MIN_BPM: 60,

  /** Typical BPM range maximum */
  MAX_BPM: 180,

  /** Beat hold time in ms */
  BEAT_HOLD_TIME: 150,

  /** Beat decay rate */
  BEAT_DECAY_RATE: 0.95,

  /** Minimum beat energy threshold */
  BEAT_THRESHOLD: 0.3,

  // Smoothing constants
  /** Default smoothing factor (0-1) */
  DEFAULT_SMOOTHING: 0.8,

  /** Fast smoothing for responsive visuals */
  FAST_SMOOTHING: 0.6,

  /** Slow smoothing for smooth trails */
  SLOW_SMOOTHING: 0.95,

  // VSync and jitter
  /** VSync target (assume 60Hz) */
  VSYNC_INTERVAL: 16.67,

  /** Jitter threshold for frame dropping */
  JITTER_THRESHOLD: 3,

  /** Maximum allowed jitter compensation */
  MAX_JITTER_COMPENSATION: 5,

  // Update intervals
  /** Audio analysis update interval */
  AUDIO_UPDATE_INTERVAL: 16,

  /** Visualizer render interval */
  RENDER_INTERVAL: 16,

  /** UI update interval (less frequent) */
  UI_UPDATE_INTERVAL: 50,

  /** State save interval */
  STATE_SAVE_INTERVAL: 5000,

  // Performance budgets
  /** Max time for audio processing per frame (ms) */
  AUDIO_BUDGET: 5,

  /** Max time for visualizer rendering (ms) */
  RENDER_BUDGET: 10,

  /** Max time for UI updates (ms) */
  UI_BUDGET: 2,
} as const;

// ============================================================================
// Types
// ============================================================================

export type AnimationCallback = (timestamp: number, deltaTime: number) => void;
export type AnimationCleanup = () => void;

export interface AnimationStats {
  /** Current FPS */
  fps: number;

  /** Average frame time in ms */
  frameTime: number;

  /** Time spent in last callback (ms) */
  lastFrameDuration: number;

  /** Total frames rendered */
  totalFrames: number;

  /** Frames dropped (over budget) */
  droppedFrames: number;

  /** Average FPS over last second */
  averageFps: number;

  /** Jitter amount (frame time variance) */
  jitter: number;
}

export interface AnimationLoopConfig {
  /** Callback to execute each frame */
  callback: AnimationCallback;

  /** Target FPS (default: 60) */
  targetFps?: number;

  /** Whether to run immediately */
  autoStart?: boolean;

  /** Time budget per frame (ms) */
  budget?: number;

  /** Enable frame dropping when over budget */
  dropFrames?: boolean;
}

export interface PhosphorConfig {
  /** Phosphor type */
  type: "p31" | "p39" | "p4" | "short" | "long" | "custom";

  /** Custom persistence time in ms (for 'custom' type) */
  customPersistence?: number;

  /** Decay curve exponent */
  decayExponent: number;
}

export interface BeatState {
  /** Current beat intensity (0-1) */
  intensity: number;

  /** Whether currently in a beat */
  isBeat: boolean;

  /** Time of last beat (timestamp) */
  lastBeatTime: number;

  /** Estimated BPM */
  bpm: number;

  /** Confidence in BPM detection (0-1) */
  bpmConfidence: number;
}

// ============================================================================
// RAF Loop Manager
// ============================================================================

/**
 * Animation loop manager using requestAnimationFrame
 * Provides performance monitoring and frame rate control
 */
export class AnimationLoop {
  private animationId: number | null = null;
  private callback: AnimationCallback;
  private targetFrameTime: number;
  private budget: number;
  private dropFrames: boolean;

  // Stats tracking
  private stats: AnimationStats = {
    fps: 0,
    frameTime: 0,
    lastFrameDuration: 0,
    totalFrames: 0,
    droppedFrames: 0,
    averageFps: 0,
    jitter: 0,
  };

  private lastTimestamp = 0;
  private frameTimes: number[] = [];
  private isRunning = false;

  constructor(config: AnimationLoopConfig) {
    this.callback = config.callback;
    this.targetFrameTime = 1000 / (config.targetFps ?? 60);
    this.budget = config.budget ?? AUTHENTIC_90S_TIMING.RENDER_BUDGET;
    this.dropFrames = config.dropFrames ?? true;

    if (config.autoStart) {
      this.start();
    }
  }

  /**
   * Start the animation loop
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.animate(this.lastTimestamp);
  }

  /**
   * Stop the animation loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Check if loop is running
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Get current animation stats
   */
  getStats(): AnimationStats {
    return { ...this.stats };
  }

  /**
   * Set target FPS
   */
  setTargetFps(fps: number): void {
    this.targetFrameTime = 1000 / fps;
  }

  /**
   * Set time budget
   */
  setBudget(budget: number): void {
    this.budget = budget;
  }

  /**
   * Main animation frame handler
   */
  private animate = (timestamp: number): void => {
    if (!this.isRunning) return;

    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Track frame time
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    // Calculate stats
    this.stats.lastFrameDuration = deltaTime;
    this.stats.totalFrames++;
    this.stats.frameTime =
      this.frameTimes.length > 0
        ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
        : 0;
    this.stats.fps =
      this.stats.frameTime > 0 ? Math.round(1000 / this.stats.frameTime) : 0;

    // Calculate average FPS
    if (this.frameTimes.length >= 60 && this.stats.frameTime > 0) {
      this.stats.averageFps = Math.round(1000 / this.stats.frameTime);
    }

    // Calculate jitter
    if (this.frameTimes.length > 1 && this.stats.frameTime > 0) {
      const variance =
        this.frameTimes.reduce((sum, time) => {
          const diff = time - this.stats.frameTime;
          return sum + diff * diff;
        }, 0) / this.frameTimes.length;
      this.stats.jitter = Math.sqrt(variance);
    }

    // Check frame budget
    const startTime = performance.now();

    // Call the animation callback
    this.callback(timestamp, deltaTime);

    const duration = performance.now() - startTime;

    // Handle over-budget frames
    if (duration > this.budget) {
      this.stats.droppedFrames++;

      if (this.dropFrames && deltaTime < this.targetFrameTime) {
        // Skip next frame to catch up
        this.lastTimestamp = timestamp - (this.targetFrameTime - deltaTime) / 2;
      }
    }

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.animate);
  };
}

// ============================================================================
// Phosphor Decay Calculations
// ============================================================================

/**
 * Calculate phosphor decay based on time elapsed
 * @param initialValue - Starting value (0-1)
 * @param timeMs - Time elapsed in milliseconds
 * @param config - Phosphor configuration
 * @returns Decayed value (0-1)
 */
export function calculatePhosphorDecay(
  initialValue: number,
  timeMs: number,
  config: Partial<PhosphorConfig> = {},
): number {
  const type = config.type ?? "p31";
  const decayExponent =
    config.decayExponent ?? AUTHENTIC_90S_TIMING.PHOSPHOR_DECAY_EXPONENT;

  let persistence: number;
  switch (type) {
    case "p31":
      persistence = AUTHENTIC_90S_TIMING.P31_PHOSPHOR_PERSISTENCE;
      break;
    case "p39":
      persistence = AUTHENTIC_90S_TIMING.P39_PHOSPHOR_PERSISTENCE;
      break;
    case "p4":
      persistence = AUTHENTIC_90S_TIMING.P4_PHOSPHOR_PERSISTENCE;
      break;
    case "short":
      persistence = AUTHENTIC_90S_TIMING.SHORT_PERSISTENCE;
      break;
    case "long":
      persistence = AUTHENTIC_90S_TIMING.LONG_PERSISTENCE;
      break;
    case "custom":
      persistence = config.customPersistence ?? 50;
      break;
    default:
      persistence = AUTHENTIC_90S_TIMING.P31_PHOSPHOR_PERSISTENCE;
  }

  const decayFactor = Math.pow(decayExponent, timeMs / persistence);
  return initialValue * decayFactor;
}

/**
 * Calculate decayed RGB values
 * @param initialColor - Starting RGB array [r, g, b]
 * @param timeMs - Time elapsed
 * @param config - Phosphor configuration
 * @returns Decayed RGB array
 */
export function calculateRGBDecay(
  initialColor: [number, number, number],
  timeMs: number,
  config?: Partial<PhosphorConfig>,
): [number, number, number] {
  return initialColor.map((channel) =>
    calculatePhosphorDecay(channel, timeMs, config),
  ) as [number, number, number];
}

/**
 * Create a decay curve lookup table for performance
 * @param steps - Number of steps in the curve
 * @param maxTimeMs - Maximum time to calculate
 * @param config - Phosphor configuration
 * @returns Array of decay values
 */
export function createDecayLUT(
  steps: number = 256,
  maxTimeMs: number = 100,
  config?: Partial<PhosphorConfig>,
): number[] {
  const lut: number[] = [];
  for (let i = 0; i < steps; i++) {
    const time = (i / steps) * maxTimeMs;
    lut.push(calculatePhosphorDecay(1, time, config));
  }
  return lut;
}

// ============================================================================
// Beat Sync Utilities
// ============================================================================

/**
 * Beat detector for audio synchronization
 */
export class BeatDetector {
  private state: BeatState = {
    intensity: 0,
    isBeat: false,
    lastBeatTime: 0,
    bpm: 120,
    bpmConfidence: 0,
  };

  private energyHistory: number[] = [];
  private beatTimes: number[] = [];
  private readonly HISTORY_SIZE = 43; // ~1 second at 60fps

  /**
   * Process audio energy and detect beats
   * @param energy - Current audio energy (0-1)
   * @param timestamp - Current timestamp
   * @returns Updated beat state
   */
  process(energy: number, timestamp: number): BeatState {
    // Add to history
    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.HISTORY_SIZE) {
      this.energyHistory.shift();
    }

    // Calculate average energy
    const averageEnergy =
      this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;

    // Check for beat
    const now = timestamp;
    const timeSinceLastBeat = now - this.state.lastBeatTime;

    // Beat detection logic
    const isBeatNow =
      energy > AUTHENTIC_90S_TIMING.BEAT_THRESHOLD &&
      energy > averageEnergy * 1.3 &&
      timeSinceLastBeat > AUTHENTIC_90S_TIMING.BEAT_HOLD_TIME;

    if (isBeatNow) {
      this.state.isBeat = true;
      this.state.intensity = Math.min(1, energy);
      this.state.lastBeatTime = now;

      // Track beat times for BPM calculation
      this.beatTimes.push(now);
      if (this.beatTimes.length > 8) {
        this.beatTimes.shift();
      }

      // Calculate BPM
      if (this.beatTimes.length >= 4) {
        const intervals: number[] = [];
        for (let i = 1; i < this.beatTimes.length; i++) {
          const current = this.beatTimes[i];
          const previous = this.beatTimes[i - 1];
          if (current !== undefined && previous !== undefined) {
            intervals.push(current - previous);
          }
        }

        const avgInterval =
          intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const newBpm = 60000 / avgInterval;

        // Clamp to reasonable range
        if (
          newBpm >= AUTHENTIC_90S_TIMING.MIN_BPM &&
          newBpm <= AUTHENTIC_90S_TIMING.MAX_BPM
        ) {
          this.state.bpm = Math.round(newBpm);
          this.state.bpmConfidence = Math.min(1, this.beatTimes.length / 8);
        }
      }
    } else {
      // Decay beat intensity
      this.state.isBeat = false;
      this.state.intensity *= AUTHENTIC_90S_TIMING.BEAT_DECAY_RATE;
    }

    return { ...this.state };
  }

  /**
   * Get current beat state
   */
  getState(): BeatState {
    return { ...this.state };
  }

  /**
   * Reset beat detector
   */
  reset(): void {
    this.state = {
      intensity: 0,
      isBeat: false,
      lastBeatTime: 0,
      bpm: 120,
      bpmConfidence: 0,
    };
    this.energyHistory = [];
    this.beatTimes = [];
  }
}

/**
 * Get beat-synchronized timing
 * @param bpm - Beats per minute
 * @returns Time per beat in milliseconds
 */
export function getBeatTime(bpm: number): number {
  return 60000 / bpm;
}

/**
 * Calculate phase within beat cycle (0-1)
 * @param timestamp - Current timestamp
 * @param bpm - Beats per minute
 * @param offset - Phase offset in ms
 * @returns Phase value (0-1, where 1 is end of beat)
 */
export function getBeatPhase(
  timestamp: number,
  bpm: number,
  offset: number = 0,
): number {
  const beatTime = getBeatTime(bpm);
  return ((timestamp + offset) % beatTime) / beatTime;
}

/**
 * Get time to next beat
 * @param timestamp - Current timestamp
 * @param bpm - Beats per minute
 * @returns Milliseconds until next beat
 */
export function getTimeToNextBeat(timestamp: number, bpm: number): number {
  const beatTime = getBeatTime(bpm);
  const phase = ((timestamp % beatTime) / beatTime) * beatTime;
  return beatTime - phase;
}

// ============================================================================
// Animation Scheduling
// ============================================================================

export interface ScheduledAnimation {
  id: string;
  callback: AnimationCallback;
  interval: number;
  lastRun: number;
  runOnce: boolean;
  active: boolean;
}

/**
 * Animation scheduler for coordinated animations
 */
export class AnimationScheduler {
  private animations: Map<string, ScheduledAnimation> = new Map();
  private loop: AnimationLoop | null = null;

  /**
   * Add a scheduled animation
   * @param id - Unique identifier
   * @param callback - Animation callback
   * @param interval - Run interval in ms
   * @param runOnce - Whether to run only once
   */
  schedule(
    id: string,
    callback: AnimationCallback,
    interval: number,
    runOnce: boolean = false,
  ): void {
    this.animations.set(id, {
      id,
      callback,
      interval,
      lastRun: 0,
      runOnce,
      active: true,
    });

    // Start the scheduler if not running
    if (!this.loop) {
      this.start();
    }
  }

  /**
   * Remove a scheduled animation
   * @param id - Animation ID to remove
   */
  unschedule(id: string): void {
    this.animations.delete(id);

    // Stop if no animations left
    if (this.animations.size === 0 && this.loop) {
      this.stop();
    }
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.loop) return;

    this.loop = new AnimationLoop({
      callback: (timestamp) => {
        this.animations.forEach((anim) => {
          if (!anim.active) return;

          const elapsed = timestamp - anim.lastRun;
          if (elapsed >= anim.interval) {
            anim.callback(timestamp, elapsed);
            anim.lastRun = timestamp;

            if (anim.runOnce) {
              anim.active = false;
              this.animations.delete(anim.id);
            }
          }
        });

        // Stop if all animations are done
        if (this.animations.size === 0) {
          this.stop();
        }
      },
      autoStart: true,
    });
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.loop) {
      this.loop.stop();
      this.loop = null;
    }
  }

  /**
   * Check if scheduler is running
   */
  get running(): boolean {
    return this.loop?.running ?? false;
  }

  /**
   * Clear all scheduled animations
   */
  clear(): void {
    this.animations.clear();
    this.stop();
  }
}

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Performance monitor for tracking animation performance
 */
export class PerformanceMonitor {
  private measurements: number[] = [];
  private readonly maxMeasurements = 100;
  private lastReport = 0;
  private reportInterval = 5000; // Report every 5 seconds

  /**
   * Record a timing measurement
   * @param duration - Duration in milliseconds
   */
  record(duration: number): void {
    this.measurements.push(duration);
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }

    // Auto-report if interval passed
    const now = performance.now();
    if (now - this.lastReport > this.reportInterval) {
      this.report();
      this.lastReport = now;
    }
  }

  /**
   * Get average duration
   */
  getAverage(): number {
    if (this.measurements.length === 0) return 0;
    return (
      this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length
    );
  }

  /**
   * Get minimum duration
   */
  getMin(): number {
    if (this.measurements.length === 0) return 0;
    return Math.min(...this.measurements);
  }

  /**
   * Get maximum duration
   */
  getMax(): number {
    if (this.measurements.length === 0) return 0;
    return Math.max(...this.measurements);
  }

  /**
   * Get 95th percentile duration
   */
  getP95(): number {
    if (this.measurements.length === 0) return 0;
    const sorted = [...this.measurements].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] ?? 0;
  }

  /**
   * Generate performance report
   */
  report(): string {
    const avg = this.getAverage();
    const min = this.getMin();
    const max = this.getMax();
    const p95 = this.getP95();

    return `
[Performance Report]
  Average: ${avg.toFixed(2)}ms
  Min: ${min.toFixed(2)}ms
  Max: ${max.toFixed(2)}ms
  P95: ${p95.toFixed(2)}ms
  Samples: ${this.measurements.length}
  FPS: ${(1000 / avg).toFixed(1)}
`;
  }

  /**
   * Reset measurements
   */
  reset(): void {
    this.measurements = [];
    this.lastReport = performance.now();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Simple requestAnimationFrame wrapper with cleanup
 * @param callback - Animation callback
 * @returns Cleanup function
 */
export function createAnimationLoop(
  callback: AnimationCallback,
): AnimationCleanup {
  let animationId: number;
  let lastTimestamp = performance.now();
  let running = true;

  const animate = (timestamp: number) => {
    if (!running) return;

    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    callback(timestamp, deltaTime);
    animationId = requestAnimationFrame(animate);
  };

  animationId = requestAnimationFrame(animate);

  return () => {
    running = false;
    cancelAnimationFrame(animationId);
  };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Smooth step interpolation
 */
export function smoothStep(start: number, end: number, t: number): number {
  const clamped = clamp(t, 0, 1);
  const smooth = clamped * clamped * (3 - 2 * clamped);
  return lerp(start, end, smooth);
}

/**
 * Map a value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}

/**
 * Apply easing function to a value
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInCubic(t: number): number {
  return t * t * t;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  AUTHENTIC_90S_TIMING,
  AnimationLoop,
  AnimationScheduler,
  BeatDetector,
  PerformanceMonitor,
  calculatePhosphorDecay,
  calculateRGBDecay,
  createDecayLUT,
  getBeatTime,
  getBeatPhase,
  getTimeToNextBeat,
  createAnimationLoop,
  clamp,
  lerp,
  smoothStep,
  mapRange,
  easeOutCubic,
  easeInCubic,
  easeInOutCubic,
  easeOutElastic,
};
