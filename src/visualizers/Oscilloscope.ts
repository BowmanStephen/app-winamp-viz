/**
 * Oscilloscope Visualizer
 *
 * Waveform display with configurable time window, trigger modes,
 * and XY mode support for classic oscilloscope feel.
 *
 * @module Oscilloscope
 */

import * as THREE from "three";
import { BaseVisualizer } from "./BaseVisualizer";
import type { AudioData, OscilloscopeConfig, RGB } from "../types";

/**
 * Trigger mode types
 */
type TriggerMode = "auto" | "normal" | "rising" | "falling" | "none";

/**
 * Oscilloscope-style waveform visualizer
 */
export class Oscilloscope extends BaseVisualizer<OscilloscopeConfig> {
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private waveformLine: THREE.Line | null = null;
  private lineGeometry: THREE.BufferGeometry | null = null;
  private lineMaterial: THREE.LineBasicMaterial | null = null;

  // Waveform data
  private waveformData: Float32Array = new Float32Array(0);
  private displaySamples: number = 512;
  private timeWindow: number = 100; // milliseconds

  // Trigger state
  private triggerMode: TriggerMode = "auto";
  private triggerLevel: number = 0;
  private lastTriggerTime: number = 0;
  private triggerHoldoff: number = 10; // ms

  // Demo mode
  private isDemoMode: boolean = false;
  private demoTime: number = 0;
  private demoPhase: number = 0;

  // Phosphor persistence effect
  private persistenceBuffer: Float32Array[] = [];
  private persistenceFrames: number = 3;

  // XY mode
  private xyMode: boolean = false;

  constructor(config: OscilloscopeConfig) {
    super(config);
    this.displaySamples = config.samples || 512;
    this.timeWindow = this.calculateTimeWindow(config.samples || 512);
    this.triggerMode = (config.trigger as TriggerMode) || "auto";
    this.waveformData = new Float32Array(this.displaySamples);
  }

  /**
   * Initialize the oscilloscope
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;

    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 400;

    // Setup Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Orthographic camera
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    this.camera.position.z = 10;

    // WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create waveform line
    this.createWaveformLine();

    // Initialize persistence buffer
    this.persistenceBuffer = [];
    for (let i = 0; i < this.persistenceFrames; i++) {
      this.persistenceBuffer.push(new Float32Array(this.displaySamples));
    }

    this.markInitialized();
  }

  /**
   * Calculate time window from sample count
   */
  private calculateTimeWindow(samples: number): number {
    // At 44.1kHz, ~44 samples = 1ms
    // Default 512 samples = ~11.6ms, but we want 10-500ms range
    // So we use a scaling factor
    return Math.max(10, Math.min(500, samples / 44.1));
  }

  /**
   * Create the waveform line geometry and material
   */
  private createWaveformLine(): void {
    const positions = new Float32Array(this.displaySamples * 3);
    const colors = new Float32Array(this.displaySamples * 3);

    this.lineGeometry = new THREE.BufferGeometry();
    this.lineGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    this.lineGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3),
    );

    // Phosphor green color (#00FF41 - classic phosphor)
    this.lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: this.config.lineWidth || 2,
    });

    this.waveformLine = new THREE.Line(this.lineGeometry, this.lineMaterial);

    this.scene!.add(this.waveformLine);
  }

  /**
   * Update with audio data
   */
  update(audioData: AudioData): void {
    if (!this.isInitialized) return;

    const timeData = audioData.floatTimeDomainData;
    const sampleRate = audioData.sampleRate;

    // Calculate samples to display based on time window
    const samplesToShow = Math.floor((this.timeWindow / 1000) * sampleRate);
    const startSample = this.findTriggerPoint(timeData, samplesToShow);

    // Resample to display resolution
    const step = Math.max(1, samplesToShow / this.displaySamples);
    const startIndex = startSample ?? 0;

    for (let i = 0; i < this.displaySamples; i++) {
      const sourceIndex = Math.floor(startIndex + i * step);
      if (sourceIndex < timeData.length && sourceIndex >= 0) {
        const value = timeData[sourceIndex];
        if (value !== undefined) {
          this.waveformData[i] = value;
        }
      }
    }
  }

  /**
   * Find trigger point in time domain data
   */
  private findTriggerPoint(data: Float32Array, windowSize: number): number {
    if (this.triggerMode === "none") {
      return 0;
    }

    const now = performance.now();
    if (now - this.lastTriggerTime < this.triggerHoldoff) {
      return 0; // Holdoff period
    }

    const searchEnd = Math.min(data.length - windowSize, data.length / 2);

    for (let i = 0; i < searchEnd; i++) {
      const prev = i > 0 ? (data[i - 1] ?? 0) : 0;
      const curr = data[i] ?? 0;

      let triggered = false;

      if (this.triggerMode === "rising" || this.triggerMode === "auto") {
        if (prev < this.triggerLevel && curr >= this.triggerLevel) {
          triggered = true;
        }
      }

      if (this.triggerMode === "falling") {
        if (prev > this.triggerLevel && curr <= this.triggerLevel) {
          triggered = true;
        }
      }

      if (triggered) {
        this.lastTriggerTime = now;
        return Math.max(0, i - 10); // Small pre-trigger
      }
    }

    // Auto mode falls back to 0 if no trigger found
    if (this.triggerMode === "auto") {
      return 0;
    }

    // Normal mode: wait for trigger
    return 0;
  }

  /**
   * Enable demo mode
   */
  setDemoMode(enabled: boolean): void {
    this.isDemoMode = enabled;
    if (enabled) {
      this.demoTime = 0;
      this.demoPhase = 0;
    }
  }

  /**
   * Generate synthetic waveform for demo
   */
  private generateDemoWaveform(): void {
    this.demoTime += 0.016;
    this.demoPhase += 0.1;

    const baseFreq = 2; // Hz
    const harmonics = [1, 0.5, 0.25, 0.125];

    for (let i = 0; i < this.displaySamples; i++) {
      const t = i / this.displaySamples;
      let amplitude = 0;

      // Build complex waveform from harmonics
      for (let h = 0; h < harmonics.length; h++) {
        const harmonic = harmonics[h] ?? 0;
        const freq = baseFreq * (h + 1) + Math.sin(this.demoTime) * 0.5;
        amplitude +=
          Math.sin(this.demoPhase * freq + t * Math.PI * 2 * (h + 1)) *
          harmonic;
      }

      // Add some noise
      amplitude += (Math.random() - 0.5) * 0.05;

      // Modulate with envelope
      const envelope = 0.5 + 0.5 * Math.sin(this.demoTime * 0.5);

      this.waveformData[i] = amplitude * envelope * 0.8;
    }
  }

  /**
   * Update persistence buffer
   */
  private updatePersistence(): void {
    // Shift buffer
    for (let i = this.persistenceBuffer.length - 1; i > 0; i--) {
      const prevBuffer = this.persistenceBuffer[i - 1];
      if (prevBuffer) {
        this.persistenceBuffer[i] = prevBuffer;
      }
    }
    // Copy current data to front
    this.persistenceBuffer[0] = new Float32Array(this.waveformData);
  }

  /**
   * Render one frame
   */
  render(): void {
    if (!this.isInitialized || !this.scene || !this.camera || !this.renderer) {
      return;
    }

    this.trackFPS();

    // Generate demo data if in demo mode
    if (this.isDemoMode) {
      this.generateDemoWaveform();
    }

    // Update persistence
    this.updatePersistence();

    // Update geometry
    if (!this.lineGeometry) {
      return;
    }

    const positionAttr = this.lineGeometry.attributes.position;
    const colorAttr = this.lineGeometry.attributes.color;

    if (!positionAttr || !colorAttr) {
      return;
    }

    const positions = positionAttr.array as Float32Array;
    const colors = colorAttr.array as Float32Array;

    const phosphorColor: RGB = [0, 255, 65]; // Classic phosphor green

    for (let i = 0; i < this.displaySamples; i++) {
      const t = i / (this.displaySamples - 1);

      if (this.xyMode) {
        // XY mode: Lissajous-like visualization
        const phase = this.demoTime * 2;
        const x = (this.waveformData[i] ?? 0) * 0.9;
        const delayedIndex = (i + 64) % this.displaySamples;
        const delayedValue = this.waveformData[delayedIndex] ?? 0;
        const y = Math.sin(t * Math.PI * 4 + phase) * 0.5 + delayedValue * 0.4;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
      } else {
        // Standard time domain display
        positions[i * 3] = t * 2 - 1; // Map to -1 to 1
        positions[i * 3 + 1] = (this.waveformData[i] ?? 0) * 0.9;
      }

      positions[i * 3 + 2] = 0;

      // Calculate color based on velocity for trail effect
      let intensity = 1;
      if (i > 0) {
        const prevX = positions[(i - 1) * 3] ?? 0;
        const prevY = positions[(i - 1) * 3 + 1] ?? 0;
        const currX = positions[i * 3] ?? 0;
        const currY = positions[i * 3 + 1] ?? 0;
        const dx = currX - prevX;
        const dy = currY - prevY;
        const velocity = Math.sqrt(dx * dx + dy * dy);
        intensity = Math.min(1, velocity * 10 + 0.5);
      }

      colors[i * 3] = (phosphorColor[0] / 255) * intensity;
      colors[i * 3 + 1] = (phosphorColor[1] / 255) * intensity;
      colors[i * 3 + 2] = (phosphorColor[2] / 255) * intensity;
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;

    // Clear and render
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    // Render persistence trails if enabled
    if (this.persistenceBuffer.length > 1) {
      this.renderPersistenceTrails();
    }
  }

  /**
   * Render persistence trails
   */
  private renderPersistenceTrails(): void {
    if (!this.lineGeometry || !this.renderer || !this.scene || !this.camera) {
      return;
    }

    const positionAttr = this.lineGeometry.attributes.position;
    const colorAttr = this.lineGeometry.attributes.color;

    if (!positionAttr || !colorAttr) {
      return;
    }

    const positions = positionAttr.array as Float32Array;
    const colors = colorAttr.array as Float32Array;

    for (let frame = 1; frame < this.persistenceBuffer.length; frame++) {
      const data = this.persistenceBuffer[frame];
      if (!data) {
        continue;
      }
      const alpha = 1 - frame / this.persistenceBuffer.length;

      for (let i = 0; i < this.displaySamples; i++) {
        const t = i / (this.displaySamples - 1);
        positions[i * 3] = t * 2 - 1;
        positions[i * 3 + 1] = (data[i] ?? 0) * 0.9;

        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.25 * alpha;
        colors[i * 3 + 2] = 0.06 * alpha;
      }

      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Set XY mode
   */
  setXYMode(enabled: boolean): void {
    this.xyMode = enabled;
  }

  /**
   * Handle resize
   */
  protected onResize(width: number, height: number): void {
    if (!this.camera || !this.renderer) return;

    const aspect = width / height;

    if (aspect > 1) {
      this.camera.left = -aspect;
      this.camera.right = aspect;
      this.camera.top = 1;
      this.camera.bottom = -1;
    } else {
      this.camera.left = -1;
      this.camera.right = 1;
      this.camera.top = 1 / aspect;
      this.camera.bottom = -1 / aspect;
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Handle configuration changes
   */
  protected onConfigChange(config: OscilloscopeConfig): void {
    if (config.samples !== this.displaySamples) {
      this.displaySamples = config.samples || 512;
      this.timeWindow = this.calculateTimeWindow(this.displaySamples);
      this.waveformData = new Float32Array(this.displaySamples);

      // Recreate line geometry
      if (this.waveformLine) {
        this.scene!.remove(this.waveformLine);
        this.lineGeometry!.dispose();
        this.lineMaterial!.dispose();
      }
      this.createWaveformLine();
    }

    if (config.trigger && config.trigger !== this.triggerMode) {
      this.triggerMode = config.trigger as TriggerMode;
    }

    if (config.lineWidth && this.lineMaterial) {
      this.lineMaterial.linewidth = config.lineWidth;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.waveformLine) {
      this.scene!.remove(this.waveformLine);
      this.waveformLine = null;
    }

    if (this.lineGeometry) {
      this.lineGeometry.dispose();
      this.lineGeometry = null;
    }

    if (this.lineMaterial) {
      this.lineMaterial.dispose();
      this.lineMaterial = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.waveformData = new Float32Array(0);
    this.persistenceBuffer = [];

    this.markDisposed();
  }
}

export default Oscilloscope;
