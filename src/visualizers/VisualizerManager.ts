/**
 * VisualizerManager
 *
 * Central manager for all visualizers. Handles registration, switching,
 * preloading, and performance monitoring.
 *
 * @module VisualizerManager
 */

import { BaseVisualizer } from "./BaseVisualizer";
import { SpectrumAnalyzer } from "./SpectrumAnalyzer";
import { Oscilloscope } from "./Oscilloscope";
import { MilkdropVisualizer } from "./MilkdropVisualizer";
import { VUMeter } from "./VUMeter";
import type {
  AudioData,
  VisualizerType,
  VisualizerConfigUnion,
  SpectrumConfig,
  OscilloscopeConfig,
  MilkdropConfig,
  BarsConfig,
} from "../types";
import type { VUMeterConfig } from "./VUMeter";

/**
 * Visualizer metadata
 */
interface VisualizerMetadata {
  id: string;
  type: VisualizerType;
  name: string;
  description: string;
  thumbnail?: string;
  supportedFeatures: string[];
  defaultConfig: Partial<VisualizerConfigUnion>;
}

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  gpuTime: number;
}

/**
 * Manager class for all visualizer instances
 */
export class VisualizerManager {
  // Registry
  private visualizers: Map<string, BaseVisualizer<VisualizerConfigUnion>> =
    new Map();
  private metadata: Map<string, VisualizerMetadata> = new Map();

  // Active state
  private activeVisualizerId: string | null = null;
  private activeVisualizer: BaseVisualizer<VisualizerConfigUnion> | null = null;

  // Canvas reference
  private canvas: HTMLCanvasElement | null = null;

  // Performance monitoring
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    gpuTime: 0,
  };
  private performanceHistory: PerformanceMetrics[] = [];
  private maxHistorySize: number = 60;

  // Preloading
  private preloadedVisualizers: Set<string> = new Set();
  private preloadQueue: string[] = [];
  private isPreloading: boolean = false;

  // Error handling
  private errorCounts: Map<string, number> = new Map();
  private maxErrorCount: number = 3;

  // Transition state
  private isTransitioning: boolean = false;

  constructor() {
    this.registerDefaultVisualizers();
  }

  /**
   * Register default built-in visualizers
   */
  private registerDefaultVisualizers(): void {
    // Spectrum Analyzer
    this.registerMetadata({
      id: "spectrum",
      type: "spectrum",
      name: "Spectrum Analyzer",
      description: "FFT frequency bars with logarithmic distribution",
      supportedFeatures: [
        "fft",
        "logarithmic",
        "instanced-mesh",
        "phosphor-glow",
      ],
      defaultConfig: {
        type: "spectrum",
        id: "spectrum-default",
        name: "Spectrum Analyzer",
        enabled: true,
        opacity: 1,
        blendMode: "normal",
        updateInterval: 16,
        themeId: "default",
        barCount: 64,
        barWidth: 0,
        barGap: 2,
        smoothing: 0.3,
        logarithmic: true,
        minFrequency: 20,
        maxFrequency: 20000,
        animationStyle: "elastic",
        mirror: false,
      } as SpectrumConfig,
    });

    // Oscilloscope
    this.registerMetadata({
      id: "oscilloscope",
      type: "oscilloscope",
      name: "Oscilloscope",
      description: "Classic waveform display with phosphor persistence",
      supportedFeatures: ["waveform", "trigger", "persistence", "xy-mode"],
      defaultConfig: {
        type: "oscilloscope",
        id: "oscilloscope-default",
        name: "Oscilloscope",
        enabled: true,
        opacity: 1,
        blendMode: "normal",
        updateInterval: 16,
        themeId: "default",
        lineWidth: 2,
        samples: 512,
        colorStyle: "solid",
        fill: false,
        fillOpacity: 0.3,
        lineStyle: "line",
        trigger: "auto",
        offset: 0,
      } as OscilloscopeConfig,
    });

    // Milkdrop
    this.registerMetadata({
      id: "milkdrop",
      type: "milkdrop",
      name: "Milkdrop",
      description: "Beat-reactive particle system with color cycling",
      supportedFeatures: [
        "particles",
        "beat-detection",
        "shaders",
        "presets",
        "feedback",
      ],
      defaultConfig: {
        type: "milkdrop",
        id: "milkdrop-default",
        name: "Milkdrop",
        enabled: true,
        opacity: 1,
        blendMode: "additive",
        updateInterval: 16,
        themeId: "default",
        particleCount: 2000,
        particleSize: [2, 8],
        particleLife: 5,
        motionBlur: 0.8,
        warp: 0.3,
        colorCycleSpeed: 0.5,
        zoomSensitivity: 1,
        rotationSpeed: 0.5,
        shaderPreset: "default",
      } as MilkdropConfig,
    });

    // VU Meter
    this.registerMetadata({
      id: "vumeter",
      type: "bars",
      name: "VU Meter",
      description: "Analog-style VU meter with peak/RMS display",
      supportedFeatures: ["rms", "peak", "needle-physics", "color-zones"],
      defaultConfig: {
        type: "bars",
        id: "vumeter-default",
        name: "VU Meter",
        enabled: true,
        opacity: 1,
        blendMode: "normal",
        updateInterval: 16,
        themeId: "default",
        count: 24,
        width: 20,
        spacing: 2,
        orientation: "vertical",
        depth: 0,
        reflection: false,
        reflectionOpacity: 0.3,
        borderRadius: 0,
        mode: "stereo",
        showPeak: true,
        showScale: true,
        decayTime: 300,
        damping: 0.85,
        minDb: -20,
        maxDb: 3,
      } as BarsConfig,
    });
  }

  /**
   * Register visualizer metadata
   */
  registerMetadata(metadata: VisualizerMetadata): void {
    this.metadata.set(metadata.id, metadata);
  }

  /**
   * Get all registered visualizer metadata
   */
  getAvailableVisualizers(): VisualizerMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Get metadata for a specific visualizer
   */
  getVisualizerMetadata(id: string): VisualizerMetadata | undefined {
    return this.metadata.get(id);
  }

  /**
   * Initialize the manager with a canvas
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;

    // Preload the first visualizer
    const available = this.getAvailableVisualizers();
    if (available.length > 0 && available[0]?.id) {
      await this.preloadVisualizer(available[0].id);
    }
  }

  /**
   * Switch to a different visualizer
   */
  async switchVisualizer(id: string): Promise<void> {
    if (this.isTransitioning) {
      console.warn(`[VisualizerManager] Switch already in progress`);
      return;
    }

    if (this.activeVisualizerId === id) {
      return; // Already active
    }

    const metadata = this.metadata.get(id);
    if (!metadata) {
      throw new Error(`[VisualizerManager] Unknown visualizer: ${id}`);
    }

    this.isTransitioning = true;

    try {
      // Cleanup current visualizer
      if (this.activeVisualizer) {
        this.activeVisualizer.setActive(false);
        this.activeVisualizer.dispose();
        this.activeVisualizer = null;
      }

      // Create new visualizer
      const visualizer = await this.createVisualizer(id, metadata);

      if (!this.canvas) {
        throw new Error("[VisualizerManager] Canvas not initialized");
      }

      await visualizer.initialize(this.canvas);
      visualizer.setActive(true);

      this.activeVisualizer = visualizer;
      this.activeVisualizerId = id;
      this.preloadedVisualizers.add(id);

      // Clear error count on success
      this.errorCounts.set(id, 0);

      console.log(`[VisualizerManager] Switched to ${metadata.name}`);
    } catch (error) {
      console.error(`[VisualizerManager] Failed to switch to ${id}:`, error);

      // Track errors
      const errorCount = (this.errorCounts.get(id) || 0) + 1;
      this.errorCounts.set(id, errorCount);

      if (errorCount >= this.maxErrorCount) {
        console.error(
          `[VisualizerManager] Visualizer ${id} disabled after ${errorCount} errors`,
        );
        this.metadata.delete(id);
      }

      throw error;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Create a visualizer instance
   */
  private async createVisualizer(
    id: string,
    metadata: VisualizerMetadata,
  ): Promise<BaseVisualizer<VisualizerConfigUnion>> {
    const config = { ...metadata.defaultConfig } as VisualizerConfigUnion;

    switch (metadata.type) {
      case "spectrum":
        return new SpectrumAnalyzer(config as SpectrumConfig);

      case "oscilloscope":
        return new Oscilloscope(config as OscilloscopeConfig);

      case "milkdrop":
        return new MilkdropVisualizer(config as MilkdropConfig);

      case "bars":
        // Use VUMeter for bars type when id is vumeter
        if (id === "vumeter") {
          return new VUMeter(config as VUMeterConfig);
        }
        // Default to spectrum for other bars configurations
        return new SpectrumAnalyzer(config as SpectrumConfig);

      default:
        throw new Error(
          `[VisualizerManager] Unsupported visualizer type: ${metadata.type}`,
        );
    }
  }

  /**
   * Preload a visualizer (without activating)
   */
  async preloadVisualizer(id: string): Promise<void> {
    if (this.preloadedVisualizers.has(id)) {
      return; // Already preloaded
    }

    const metadata = this.metadata.get(id);
    if (!metadata) {
      console.warn(
        `[VisualizerManager] Cannot preload unknown visualizer: ${id}`,
      );
      return;
    }

    // Note: We can't fully initialize without a canvas
    // This just marks it as ready to load quickly
    this.preloadedVisualizers.add(id);
    console.log(`[VisualizerManager] Preloaded ${metadata.name}`);
  }

  /**
   * Queue visualizers for preloading
   */
  queuePreload(ids: string[]): void {
    const combined = [...this.preloadQueue, ...ids];
    this.preloadQueue = Array.from(new Set(combined));

    if (!this.isPreloading) {
      this.processPreloadQueue();
    }
  }

  /**
   * Process the preload queue
   */
  private async processPreloadQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return;
    }

    this.isPreloading = true;

    while (this.preloadQueue.length > 0) {
      const id = this.preloadQueue.shift()!;

      try {
        await this.preloadVisualizer(id);
      } catch (error) {
        console.warn(`[VisualizerManager] Failed to preload ${id}:`, error);
      }

      // Yield to main thread
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    this.isPreloading = false;
  }

  /**
   * Get the currently active visualizer
   */
  getActiveVisualizer(): BaseVisualizer<VisualizerConfigUnion> | null {
    return this.activeVisualizer;
  }

  /**
   * Get the ID of the currently active visualizer
   */
  getActiveVisualizerId(): string | null {
    return this.activeVisualizerId;
  }

  /**
   * Check if a visualizer is currently active
   */
  isVisualizerActive(id: string): boolean {
    return this.activeVisualizerId === id;
  }

  /**
   * Check if a visualizer is preloaded
   */
  isPreloaded(id: string): boolean {
    return this.preloadedVisualizers.has(id);
  }

  /**
   * Update the active visualizer with audio data
   */
  update(audioData: AudioData): void {
    if (this.activeVisualizer && this.activeVisualizer.isActive) {
      this.activeVisualizer.update(audioData);
    }
  }

  /**
   * Render the active visualizer
   */
  render(): void {
    if (!this.activeVisualizer || !this.activeVisualizer.isActive) {
      return;
    }

    const frameStart = performance.now();

    this.activeVisualizer.render();

    const frameEnd = performance.now();
    const frameTime = frameEnd - frameStart;

    // Update metrics
    this.updateMetrics(frameTime);
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(frameTime: number): void {
    const fps = this.activeVisualizer?.fps || 0;

    this.metrics = {
      fps,
      frameTime,
      memoryUsage: this.getMemoryUsage(),
      gpuTime: 0, // Would need WebGL timer queries
    };

    this.performanceHistory.push({ ...this.metrics });

    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }
  }

  /**
   * Get current memory usage estimate
   */
  private getMemoryUsage(): number {
    if (performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory];
  }

  /**
   * Check if currently transitioning
   */
  isInTransition(): boolean {
    return this.isTransitioning;
  }

  /**
   * Enable demo mode for active visualizer
   */
  setDemoMode(enabled: boolean): void {
    const visualizer = this.activeVisualizer;
    if (!visualizer) return;

    // Cast to known types and call setDemoMode
    if (visualizer instanceof SpectrumAnalyzer) {
      visualizer.setDemoMode(enabled);
    } else if (visualizer instanceof Oscilloscope) {
      visualizer.setDemoMode(enabled);
    } else if (visualizer instanceof MilkdropVisualizer) {
      visualizer.setDemoMode(enabled);
    } else if (visualizer instanceof VUMeter) {
      visualizer.setDemoMode(enabled);
    }
  }

  /**
   * Handle canvas resize
   */
  resize(width: number, height: number): void {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    if (this.activeVisualizer) {
      this.activeVisualizer.resize(width, height);
    }
  }

  /**
   * Set configuration for the active visualizer
   */
  setVisualizerConfig(config: Partial<VisualizerConfigUnion>): void {
    if (this.activeVisualizer) {
      this.activeVisualizer.setConfig(config);
    }
  }

  /**
   * Get configuration for the active visualizer
   */
  getVisualizerConfig(): VisualizerConfigUnion | null {
    return this.activeVisualizer?.getConfig() || null;
  }

  /**
   * Get error count for a visualizer
   */
  getErrorCount(id: string): number {
    return this.errorCounts.get(id) || 0;
  }

  /**
   * Reset error count for a visualizer
   */
  resetErrorCount(id: string): void {
    this.errorCounts.set(id, 0);
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    // Dispose all visualizers
    this.visualizers.forEach((visualizer) => {
      visualizer.dispose();
    });
    this.visualizers.clear();

    // Clear active reference
    if (this.activeVisualizer) {
      this.activeVisualizer.dispose();
      this.activeVisualizer = null;
    }

    this.activeVisualizerId = null;
    this.preloadedVisualizers.clear();
    this.preloadQueue = [];
    this.performanceHistory = [];
    this.canvas = null;

    console.log("[VisualizerManager] Disposed all resources");
  }
}

export default VisualizerManager;
