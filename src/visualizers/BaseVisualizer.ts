/**
 * BaseVisualizer Abstract Class
 *
 * Minimal abstract base class for all visualizers. Defines the contract
 * for initialize, update, render, dispose lifecycle.
 *
 * @module BaseVisualizer
 */

import type { AudioData, VisualizerConfigUnion, Theme } from "../types";

/**
 * Abstract base class that all visualizers must extend.
 *
 * @template T - Specific visualizer configuration type
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
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private _fps: number = 0;

  /**
   * Create a new BaseVisualizer
   */
  constructor(config: T, id?: string) {
    this.id =
      id ||
      `${config.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.name = config.name;
    this.config = { ...config };
  }

  // ============================================================================
  // Abstract Methods (Must be implemented by subclasses)
  // ============================================================================

  /**
   * Initialize the visualizer with a canvas element.
   */
  abstract initialize(canvas: HTMLCanvasElement): Promise<void>;

  /**
   * Update the visualizer with new audio data.
   */
  abstract update(audioData: AudioData): void;

  /**
   * Render one frame of the visualizer.
   */
  abstract render(): void;

  /**
   * Clean up and dispose of all resources.
   */
  abstract dispose(): void;

  // ============================================================================
  // Concrete Methods
  // ============================================================================

  /** Get the current configuration */
  public getConfig(): T {
    return { ...this.config };
  }

  /** Update the visualizer configuration */
  public setConfig(config: Partial<T>): void {
    this.config = { ...this.config, ...config };
    this.onConfigChange?.(this.config);
  }

  /** Get the current theme */
  public getTheme(): Theme | null {
    return this.theme;
  }

  /** Set the theme for this visualizer */
  public setTheme(theme: Theme): void {
    this.theme = theme;
    this.onThemeChange?.(theme);
  }

  /** Check if the visualizer is currently active */
  public get isActive(): boolean {
    return this.active;
  }

  /** Set the active state */
  public setActive(active: boolean): void {
    this.active = active;
  }

  /** Check if the visualizer is initialized */
  public get isInitialized(): boolean {
    return this.initialized;
  }

  /** Get current FPS */
  public get fps(): number {
    return this._fps;
  }

  /** Get the canvas element */
  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /** Get the 2D rendering context */
  public getContext2D(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  /** Get the WebGL rendering context */
  public getWebGLContext():
    | WebGLRenderingContext
    | WebGL2RenderingContext
    | null {
    return this.gl;
  }

  /** Resize the visualizer canvas */
  public resize(width: number, height: number): void {
    if (!this.canvas) return;

    this.canvas.width = width;
    this.canvas.height = height;

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

  /** Get canvas dimensions */
  public getDimensions(): { width: number; height: number } {
    if (!this.canvas) return { width: 0, height: 0 };
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  // ============================================================================
  // FPS Tracking
  // ============================================================================

  /** Update FPS tracking. Call at the beginning of render(). */
  protected trackFPS(): void {
    const now = performance.now();
    this.frameCount++;

    if (now - this.fpsUpdateTime >= 1000) {
      this._fps = Math.round(
        (this.frameCount * 1000) / (now - this.fpsUpdateTime),
      );
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }
  }

  // ============================================================================
  // Lifecycle Hooks (Optional overrides)
  // ============================================================================

  /** Called when configuration changes */
  protected onConfigChange?(config: T): void;

  /** Called when theme changes */
  protected onThemeChange?(theme: Theme): void;

  /** Called when canvas is resized */
  protected onResize?(width: number, height: number): void;

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /** Protected helper to mark initialization complete */
  protected markInitialized(): void {
    this.initialized = true;
  }

  /** Protected helper to mark disposal complete */
  protected markDisposed(): void {
    this.initialized = false;
    this.active = false;
    this.canvas = null;
    this.ctx = null;
    this.gl = null;
  }
}

export default BaseVisualizer;
