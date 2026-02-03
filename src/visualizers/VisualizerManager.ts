/**
 * VisualizerManager
 *
 * Manages visualizer switching and rendering. Simplified from enterprise version.
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

/** Visualizer definition */
interface VisualizerDef {
  id: string;
  type: VisualizerType;
  name: string;
  config: VisualizerConfigUnion;
}

/** Available visualizers */
const VISUALIZERS: VisualizerDef[] = [
  {
    id: "spectrum",
    type: "spectrum",
    name: "Spectrum Analyzer",
    config: {
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
  },
  {
    id: "oscilloscope",
    type: "oscilloscope",
    name: "Oscilloscope",
    config: {
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
  },
  {
    id: "milkdrop",
    type: "milkdrop",
    name: "Milkdrop",
    config: {
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
  },
  {
    id: "vumeter",
    type: "bars",
    name: "VU Meter",
    config: {
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
  },
];

/**
 * Manager class for visualizer instances
 */
export class VisualizerManager {
  private activeVisualizerId: string | null = null;
  private activeVisualizer: BaseVisualizer<VisualizerConfigUnion> | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isTransitioning: boolean = false;

  /**
   * Get all available visualizers
   */
  getAvailableVisualizers(): { id: string; name: string; type: VisualizerType }[] {
    return VISUALIZERS.map((v) => ({ id: v.id, name: v.name, type: v.type }));
  }

  /**
   * Initialize the manager with a canvas
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
  }

  /**
   * Switch to a different visualizer
   */
  async switchVisualizer(id: string): Promise<void> {
    if (this.isTransitioning) return;
    if (this.activeVisualizerId === id) return;

    const def = VISUALIZERS.find((v) => v.id === id);
    if (!def) {
      throw new Error(`Unknown visualizer: ${id}`);
    }

    this.isTransitioning = true;

    try {
      // Dispose current
      if (this.activeVisualizer) {
        this.activeVisualizer.setActive(false);
        this.activeVisualizer.dispose();
        this.activeVisualizer = null;
      }

      // Create new
      const visualizer = this.createVisualizer(def);

      if (!this.canvas) {
        throw new Error("Canvas not initialized");
      }

      await visualizer.initialize(this.canvas);
      visualizer.setActive(true);

      this.activeVisualizer = visualizer;
      this.activeVisualizerId = id;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Create a visualizer instance
   */
  private createVisualizer(
    def: VisualizerDef,
  ): BaseVisualizer<VisualizerConfigUnion> {
    const config = { ...def.config };

    switch (def.type) {
      case "spectrum":
        return new SpectrumAnalyzer(config as SpectrumConfig);
      case "oscilloscope":
        return new Oscilloscope(config as OscilloscopeConfig);
      case "milkdrop":
        return new MilkdropVisualizer(config as MilkdropConfig);
      case "bars":
        return new VUMeter(config as VUMeterConfig);
      default:
        throw new Error(`Unsupported visualizer type: ${def.type}`);
    }
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
   * Update the active visualizer with audio data
   */
  update(audioData: AudioData): void {
    if (this.activeVisualizer?.isActive) {
      this.activeVisualizer.update(audioData);
    }
  }

  /**
   * Render the active visualizer
   */
  render(): void {
    if (this.activeVisualizer?.isActive) {
      this.activeVisualizer.render();
    }
  }

  /**
   * Enable demo mode for active visualizer
   */
  setDemoMode(enabled: boolean): void {
    const v = this.activeVisualizer;
    if (!v) return;

    if (v instanceof SpectrumAnalyzer) v.setDemoMode(enabled);
    else if (v instanceof Oscilloscope) v.setDemoMode(enabled);
    else if (v instanceof MilkdropVisualizer) v.setDemoMode(enabled);
    else if (v instanceof VUMeter) v.setDemoMode(enabled);
  }

  /**
   * Handle canvas resize
   */
  resize(width: number, height: number): void {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.activeVisualizer?.resize(width, height);
  }

  /**
   * Get current FPS
   */
  get fps(): number {
    return this.activeVisualizer?.fps ?? 0;
  }

  /**
   * Check if currently transitioning
   */
  isInTransition(): boolean {
    return this.isTransitioning;
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    if (this.activeVisualizer) {
      this.activeVisualizer.dispose();
      this.activeVisualizer = null;
    }
    this.activeVisualizerId = null;
    this.canvas = null;
  }
}

export default VisualizerManager;
