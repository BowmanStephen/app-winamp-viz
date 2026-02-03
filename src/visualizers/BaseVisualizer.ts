/**
 * BaseVisualizer Abstract Class
 *
 * Abstract base class for all visualizers. Defines the contract that all
 * visualizer implementations must follow. Provides common functionality for
 * FPS tracking, beat detection, and lifecycle management.
 *
 * @module BaseVisualizer
 */

import type { AudioData, VisualizerConfigUnion, Theme } from "../types";

/**
 * Configuration for beat detection
 */
interface BeatDetectionConfig {
  /** Minimum beat interval in milliseconds */
  minInterval: number;
  /** Sensitivity threshold (0-1) */
  threshold: number;
  /** Energy history size for averaging */
  historySize: number;
}

/**
 * Beat detection state
 */
interface BeatState {
  /** History of energy values */
  energyHistory: number[];
  /** Timestamp of last beat */
  lastBeatTime: number;
  /** Whether a beat was detected this frame */
  isBeat: boolean;
  /** Current beat intensity (0-1) */
  beatIntensity: number;
}

/**
 * Abstract base class that all visualizers must extend.
 *
 * @template T - Specific visualizer configuration type
 *
 * @example
 * ```typescript
 * class MyVisualizer extends BaseVisualizer<SpectrumConfig> {
 *   async initialize(): Promise<void> {
 *     // Setup canvas, shaders, etc.
 *   }
 *
 *   update(audioData: AudioData): void {
 *     // Process audio data
 *   }
 *
 *   render(): void {
 *     // Draw to canvas
 *   }
 *
 *   dispose(): void {
 *     // Clean up resources
 *   }
 * }
 * ```
 */
export abstract class BaseVisualizer<
  T extends VisualizerConfigUnion = VisualizerConfigUnion,
> {
  /** Unique identifier for this visualizer instance */
  public readonly id: string;

  /** Human-readable name */
  public readonly name: string;

  /** Current configuration */
  protected config: T;

  /** Currently applied theme */
  protected theme: Theme | null = null;

  /** Whether the visualizer is active and should render */
  protected active: boolean = false;

  /** Whether the visualizer is initialized */
  protected initialized: boolean = false;

  /** Target canvas element */
  protected canvas: HTMLCanvasElement | null = null;

  /** Canvas 2D rendering context */
  protected ctx: CanvasRenderingContext2D | null = null;

  /** WebGL rendering context (if using WebGL) */
  protected gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

  /** FPS tracking */
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private _fps: number = 0;

  /** Beat detection state */
  private beatState: BeatState;
  private beatConfig: BeatDetectionConfig;

  /**
   * Create a new BaseVisualizer
   * @param config - Visualizer configuration
   * @param id - Unique identifier (auto-generated if not provided)
   */
  constructor(config: T, id?: string) {
    this.id =
      id ||
      `${config.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.name = config.name;
    this.config = { ...config };

    // Initialize beat detection
    this.beatState = {
      energyHistory: [],
      lastBeatTime: 0,
      isBeat: false,
      beatIntensity: 0,
    };

    this.beatConfig = {
      minInterval: 150, // Minimum 150ms between beats (max ~6.6 beats per second)
      threshold: 0.3,
      historySize: 43, // ~1 second at 60fps
    };
  }

  // ============================================================================
  // Abstract Methods (Must be implemented by subclasses)
  // ============================================================================

  /**
   * Initialize the visualizer with a canvas element.
   * Called once before the visualizer starts rendering.
   *
   * @param canvas - The canvas element to render to
   * @returns Promise that resolves when initialization is complete
   */
  abstract initialize(canvas: HTMLCanvasElement): Promise<void>;

  /**
   * Update the visualizer with new audio data.
   * Called every frame before render().
   *
   * @param audioData - Current audio analysis data
   */
  abstract update(audioData: AudioData): void;

  /**
   * Render one frame of the visualizer.
   * Called every frame after update().
   */
  abstract render(): void;

  /**
   * Clean up and dispose of all resources.
   * Called when the visualizer is removed or the application shuts down.
   */
  abstract dispose(): void;

  // ============================================================================
  // Concrete Methods (Shared functionality)
  // ============================================================================

  /**
   * Get the current configuration
   * @returns Current visualizer configuration
   */
  public getConfig(): T {
    return { ...this.config };
  }

  /**
   * Update the visualizer configuration
   * @param config - Partial configuration to merge
   */
  public setConfig(config: Partial<T>): void {
    this.config = { ...this.config, ...config };
    this.onConfigChange?.(this.config);
  }

  /**
   * Get the current theme
   * @returns Current theme or null
   */
  public getTheme(): Theme | null {
    return this.theme;
  }

  /**
   * Set the theme for this visualizer
   * @param theme - Theme to apply
   */
  public setTheme(theme: Theme): void {
    this.theme = theme;
    this.onThemeChange?.(theme);
  }

  /**
   * Check if the visualizer is currently active
   * @returns True if active
   */
  public get isActive(): boolean {
    return this.active;
  }

  /**
   * Set the active state
   * @param active - Whether the visualizer should be active
   */
  public setActive(active: boolean): void {
    this.active = active;
    if (active && !this.initialized) {
      console.warn(
        `[BaseVisualizer:${this.id}] Activated before initialization`,
      );
    }
  }

  /**
   * Check if the visualizer is initialized
   * @returns True if initialized
   */
  public get isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current FPS
   * @returns Frames per second
   */
  public get fps(): number {
    return this._fps;
  }

  /**
   * Get the canvas element
   * @returns Canvas element or null
   */
  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * Get the 2D rendering context
   * @returns CanvasRenderingContext2D or null
   */
  public getContext2D(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  /**
   * Get the WebGL rendering context
   * @returns WebGL context or null
   */
  public getWebGLContext():
    | WebGLRenderingContext
    | WebGL2RenderingContext
    | null {
    return this.gl;
  }

  /**
   * Resize the visualizer canvas
   * @param width - New width in pixels
   * @param height - New height in pixels
   */
  public resize(width: number, height: number): void {
    if (!this.canvas) return;

    this.canvas.width = width;
    this.canvas.height = height;

    // Handle device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    if (this.ctx) {
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.ctx.scale(dpr, dpr);
    }

    this.onResize?.(width, height);
  }

  /**
   * Get canvas dimensions
   * @returns Object with width and height
   */
  public getDimensions(): { width: number; height: number } {
    if (!this.canvas) return { width: 0, height: 0 };
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  // ============================================================================
  // Beat Detection
  // ============================================================================

  /**
   * Detect beats from audio data
   * @param audioData - Current audio analysis data
   * @returns Beat detection result
   */
  protected detectBeat(audioData: AudioData): {
    isBeat: boolean;
    intensity: number;
  } {
    const now = performance.now();
    const bassEnergy = audioData.bands.bass;

    // Add to energy history
    this.beatState.energyHistory.push(bassEnergy);
    if (this.beatState.energyHistory.length > this.beatConfig.historySize) {
      this.beatState.energyHistory.shift();
    }

    // Need enough history
    if (this.beatState.energyHistory.length < this.beatConfig.historySize / 2) {
      return { isBeat: false, intensity: 0 };
    }

    // Calculate average energy
    const avgEnergy =
      this.beatState.energyHistory.reduce((a, b) => a + b, 0) /
      this.beatState.energyHistory.length;

    // Check for beat
    const isBeat =
      bassEnergy > avgEnergy * (1 + this.beatConfig.threshold) &&
      now - this.beatState.lastBeatTime > this.beatConfig.minInterval &&
      bassEnergy > 0.1; // Minimum threshold

    if (isBeat) {
      this.beatState.lastBeatTime = now;
      this.beatState.isBeat = true;
      this.beatState.beatIntensity = Math.min(1, bassEnergy / (avgEnergy * 2));

      // Trigger beat hook
      this.onBeat?.(this.beatState.beatIntensity);
    } else {
      this.beatState.isBeat = false;
      this.beatState.beatIntensity *= 0.9; // Decay
    }

    return {
      isBeat: this.beatState.isBeat,
      intensity: this.beatState.beatIntensity,
    };
  }

  /**
   * Check if a beat was detected this frame
   * @returns True if beat detected
   */
  protected get isBeat(): boolean {
    return this.beatState.isBeat;
  }

  /**
   * Get current beat intensity (0-1)
   * @returns Beat intensity
   */
  protected get beatIntensity(): number {
    return this.beatState.beatIntensity;
  }

  // ============================================================================
  // FPS Tracking
  // ============================================================================

  /**
   * Update FPS tracking. Call at the beginning of render().
   */
  protected trackFPS(): void {
    const now = performance.now();
    this.frameCount++;

    // Update FPS every second
    if (now - this.fpsUpdateTime >= 1000) {
      this._fps = Math.round(
        (this.frameCount * 1000) / (now - this.fpsUpdateTime),
      );
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }

    this.lastFrameTime = now;
  }

  /**
   * Get time since last frame in milliseconds
   * @returns Delta time in ms
   */
  protected getDeltaTime(): number {
    const now = performance.now();
    return this.lastFrameTime > 0 ? now - this.lastFrameTime : 16.67; // Default to ~60fps
  }

  // ============================================================================
  // Lifecycle Hooks (Optional overrides)
  // ============================================================================

  /**
   * Called when configuration changes
   * @param config - New configuration
   */
  protected onConfigChange?(config: T): void;

  /**
   * Called when theme changes
   * @param theme - New theme
   */
  protected onThemeChange?(theme: Theme): void;

  /**
   * Called when canvas is resized
   * @param width - New width
   * @param height - New height
   */
  protected onResize?(width: number, height: number): void;

  /**
   * Called when a beat is detected
   * @param intensity - Beat intensity (0-1)
   */
  protected onBeat?(intensity: number): void;

  /**
   * Called when the visualizer is paused
   */
  protected onPause?(): void;

  /**
   * Called when the visualizer is resumed
   */
  protected onResume?(): void;

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Convert frequency value to color based on theme
   * @param frequency - Normalized frequency value (0-1)
   * @returns RGBA color array
   */
  protected frequencyToColor(
    frequency: number,
  ): [number, number, number, number] {
    if (!this.theme) {
      return [255, 255, 255, 255];
    }

    const spectrum = this.theme.palette.spectrum;
    if (!spectrum || spectrum.length === 0) {
      const primary = this.theme.palette.primary;
      if (typeof primary === "string") {
        // Parse hex color
        const hex = primary.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return [r, g, b, 255];
      }
      return [...(primary as [number, number, number]), 255];
    }

    // Map frequency to spectrum index
    const index = Math.floor(frequency * (spectrum.length - 1));
    const color = spectrum[Math.min(index, spectrum.length - 1)];

    if (typeof color === "string") {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return [r, g, b, 255];
    }

    return [...(color as [number, number, number]), 255];
  }

  /**
   * Protected helper to mark initialization complete
   * Subclasses should call this at the end of initialize()
   */
  protected markInitialized(): void {
    this.initialized = true;
  }

  /**
   * Protected helper to mark disposal complete
   * Subclasses should call this at the end of dispose()
   */
  protected markDisposed(): void {
    this.initialized = false;
    this.active = false;
    this.canvas = null;
    this.ctx = null;
    this.gl = null;
  }
}

export default BaseVisualizer;
