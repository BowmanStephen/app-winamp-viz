/**
 * SpectrumAnalyzer Visualizer
 *
 * FFT frequency bars visualizer with LED segment style (classic Winamp VU meter).
 * Each bar is a column of stacked segments that light up based on amplitude.
 * Green at bottom → Yellow → Red at top.
 *
 * @module SpectrumAnalyzer
 */

import * as THREE from "three";
import { BaseVisualizer } from "./BaseVisualizer";
import type { AudioData, SpectrumConfig } from "../types";

/**
 * Peak hold data structure
 */
interface PeakHold {
  value: number;
  time: number;
}

/** Number of LED segments per frequency bar */
const SEGMENTS_PER_BAR = 20;

/** Gap between segments (fraction of segment height) */
const SEGMENT_GAP = 0.15;

/**
 * Spectrum analyzer using LED segment style with instanced rendering
 */
export class SpectrumAnalyzer extends BaseVisualizer<SpectrumConfig> {
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private segmentMesh: THREE.InstancedMesh | null = null;
  private segmentGeometry: THREE.BoxGeometry | null = null;
  private segmentMaterial: THREE.MeshBasicMaterial | null = null;

  // Bar data
  private barCount: number = 64;
  private barWidth: number = 0;
  private barSpacing: number = 0;
  private barHeights: Float32Array = new Float32Array(0);
  private targetHeights: Float32Array = new Float32Array(0);
  private peakHolds: PeakHold[] = [];

  // Layout info
  private segmentHeight: number = 0;
  private baseY: number = 0;
  private logicalHeight: number = 0;
  private startX: number = 0;

  // Demo mode
  private isDemoMode: boolean = false;
  private demoTime: number = 0;

  // Frequency mapping
  private frequencyBins: number[] = [];
  private minFreq: number = 20;
  private maxFreq: number = 20000;

  // Precomputed segment colors (green → yellow → red)
  private segmentColors: THREE.Color[] = [];

  constructor(config: SpectrumConfig) {
    super(config);
    this.barCount = config.barCount || 64;
    this.minFreq = config.minFrequency || 20;
    this.maxFreq = config.maxFrequency || 20000;

    // Precompute segment colors (bottom to top)
    this.precomputeSegmentColors();
  }

  /**
   * Precompute the LED segment colors (green → yellow → red)
   */
  private precomputeSegmentColors(): void {
    this.segmentColors = [];
    for (let seg = 0; seg < SEGMENTS_PER_BAR; seg++) {
      const t = seg / (SEGMENTS_PER_BAR - 1); // 0=bottom, 1=top
      const color = new THREE.Color();

      if (t < 0.5) {
        // Green to yellow (bottom half)
        color.setRGB(t * 2, 1, 0);
      } else {
        // Yellow to red (top half)
        color.setRGB(1, 1 - (t - 0.5) * 2, 0);
      }

      this.segmentColors.push(color);
    }
  }

  /**
   * Initialize the spectrum analyzer with a canvas
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;

    // Use window dimensions to avoid DPR multiplication on re-init
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.logicalHeight = height;

    // Setup Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a12);

    // Orthographic camera for 2D bars
    this.camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      1000,
    );
    this.camera.position.z = 10;

    // WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Initialize LED segments
    this.initializeSegments(width, height);

    // Initialize frequency mapping
    this.calculateFrequencyBins();

    this.markInitialized();
  }

  /**
   * Initialize the instanced LED segment mesh
   */
  private initializeSegments(width: number, height: number): void {
    this.barCount = Math.min(Math.max(this.config.barCount, 32), 256);

    // Calculate bar dimensions
    const totalWidth = width * 0.9;
    this.barSpacing = (totalWidth / this.barCount) * 0.1;
    this.barWidth =
      (totalWidth - this.barSpacing * (this.barCount - 1)) / this.barCount;

    // Calculate segment dimensions
    const maxBarHeight = height * 0.85;
    const totalSegmentHeight = maxBarHeight / SEGMENTS_PER_BAR;
    this.segmentHeight = totalSegmentHeight * (1 - SEGMENT_GAP);

    // Create segment geometry (small box)
    this.segmentGeometry = new THREE.BoxGeometry(1, 1, 1);

    // Simple material - colors are per-instance
    this.segmentMaterial = new THREE.MeshBasicMaterial({
      vertexColors: false,
    });

    // Total instances = bars × segments per bar
    const totalInstances = this.barCount * SEGMENTS_PER_BAR;

    // Create instanced mesh
    this.segmentMesh = new THREE.InstancedMesh(
      this.segmentGeometry,
      this.segmentMaterial,
      totalInstances,
    );

    // Calculate layout
    this.startX = -totalWidth / 2 + this.barWidth / 2;
    this.baseY = -height / 2 + 10;

    // Initialize all instances with positions and colors
    const dummy = new THREE.Object3D();

    for (let bar = 0; bar < this.barCount; bar++) {
      const x = this.startX + bar * (this.barWidth + this.barSpacing);

      for (let seg = 0; seg < SEGMENTS_PER_BAR; seg++) {
        const instanceIndex = bar * SEGMENTS_PER_BAR + seg;
        const y = this.baseY + seg * totalSegmentHeight + this.segmentHeight / 2;

        // Set position and scale (all segments start "off" - very small scale)
        dummy.position.set(x, y, 0);
        dummy.scale.set(this.barWidth, 0.001, 1); // Start hidden
        dummy.updateMatrix();
        this.segmentMesh.setMatrixAt(instanceIndex, dummy.matrix);

        // Set color based on vertical position
        const color = this.segmentColors[seg];
        if (color) {
          this.segmentMesh.setColorAt(instanceIndex, color);
        }
      }
    }

    this.segmentMesh.instanceMatrix.needsUpdate = true;
    this.segmentMesh.instanceColor!.needsUpdate = true;

    this.scene!.add(this.segmentMesh);

    // Initialize height arrays
    this.barHeights = new Float32Array(this.barCount);
    this.targetHeights = new Float32Array(this.barCount);
    this.peakHolds = new Array(this.barCount)
      .fill(null)
      .map(() => ({ value: 0, time: 0 }));
  }

  /**
   * Calculate logarithmic frequency bins
   */
  private calculateFrequencyBins(): void {
    this.frequencyBins = [];
    const minLog = Math.log10(this.minFreq);
    const maxLog = Math.log10(this.maxFreq);

    for (let i = 0; i <= this.barCount; i++) {
      const logFreq = minLog + (maxLog - minLog) * (i / this.barCount);
      const freq = Math.pow(10, logFreq);
      this.frequencyBins.push(freq);
    }
  }

  /**
   * Update visualizer with audio data
   */
  update(audioData: AudioData): void {
    if (!this.isInitialized) return;

    const frequencyData = audioData.frequencyData;
    const sampleRate = audioData.sampleRate;
    const binCount = audioData.frequencyBinCount;

    // Map frequency data to bars using logarithmic distribution
    for (let i = 0; i < this.barCount; i++) {
      const freqLow = this.frequencyBins[i];
      const freqHigh = this.frequencyBins[i + 1];

      if (freqLow === undefined || freqHigh === undefined) continue;

      // Convert frequencies to bin indices
      const binLow = Math.floor((freqLow / (sampleRate / 2)) * binCount);
      const binHigh = Math.min(
        Math.ceil((freqHigh / (sampleRate / 2)) * binCount),
        binCount - 1,
      );

      // Average energy in this frequency band
      let energy = 0;
      let count = 0;
      for (let j = binLow; j <= binHigh; j++) {
        const freqValue = frequencyData[j];
        if (freqValue !== undefined) {
          energy += freqValue / 255; // Normalize to 0-1
          count++;
        }
      }

      const avgEnergy = count > 0 ? energy / count : 0;
      this.targetHeights[i] = avgEnergy;
    }
  }

  /**
   * Enable demo mode with synthetic data
   */
  setDemoMode(enabled: boolean): void {
    this.isDemoMode = enabled;
    if (enabled) {
      this.demoTime = 0;
    }
  }

  /**
   * Generate synthetic FFT data for demo
   */
  private generateDemoData(): void {
    this.demoTime += 0.016; // ~60fps

    for (let i = 0; i < this.barCount; i++) {
      // Combine multiple sine waves for realistic spectrum
      const freq = i / this.barCount;
      const wave1 = Math.sin(this.demoTime * 2 + freq * 10) * 0.5 + 0.5;
      const wave2 = Math.sin(this.demoTime * 3.5 + freq * 5) * 0.3 + 0.3;
      const wave3 = Math.sin(this.demoTime * 1.2 + freq * 20) * 0.2 + 0.2;

      // Higher frequencies usually have less energy
      const freqDecay = 1.0 - freq * 0.3;

      this.targetHeights[i] =
        (wave1 * 0.6 + wave2 * 0.3 + wave3 * 0.1) * freqDecay;
    }
  }

  /**
   * Update peak holds
   */
  private updatePeaks(): void {
    const now = performance.now();
    const peakDecayTime = 500; // Peak holds for 500ms

    for (let i = 0; i < this.barCount; i++) {
      const currentPeak = this.peakHolds[i];
      const barHeight = this.barHeights[i];

      if (!currentPeak || barHeight === undefined) continue;

      if (barHeight > currentPeak.value) {
        // New peak
        this.peakHolds[i] = { value: barHeight, time: now };
      } else if (now - currentPeak.time > peakDecayTime) {
        // Decay old peak
        this.peakHolds[i] = {
          value: currentPeak.value * 0.95,
          time: now,
        };
      }
    }
  }

  /**
   * Render one frame
   */
  render(): void {
    if (
      !this.isInitialized ||
      !this.scene ||
      !this.camera ||
      !this.renderer ||
      !this.segmentMesh
    ) {
      return;
    }

    this.trackFPS();

    // Generate demo data if in demo mode
    if (this.isDemoMode) {
      this.generateDemoData();
    }

    const smoothing = this.config.smoothing || 0.3;
    const dummy = new THREE.Object3D();
    const totalSegmentHeight =
      (this.logicalHeight * 0.85) / SEGMENTS_PER_BAR;

    // Update bar heights with smoothing and update segment visibility
    for (let bar = 0; bar < this.barCount; bar++) {
      const targetHeight = this.targetHeights[bar] ?? 0;
      const currentHeight = this.barHeights[bar] ?? 0;

      // Apply smoothing
      const newHeight =
        currentHeight + (targetHeight - currentHeight) * (1 - smoothing);
      this.barHeights[bar] = newHeight;

      // Calculate how many segments should be "lit"
      const activeSegments = Math.ceil(newHeight * SEGMENTS_PER_BAR);

      // Calculate X position for this bar
      const x = this.startX + bar * (this.barWidth + this.barSpacing);

      // Update each segment's visibility
      for (let seg = 0; seg < SEGMENTS_PER_BAR; seg++) {
        const instanceIndex = bar * SEGMENTS_PER_BAR + seg;
        const y = this.baseY + seg * totalSegmentHeight + this.segmentHeight / 2;

        const isActive = seg < activeSegments;

        dummy.position.set(x, y, 0);
        dummy.scale.set(
          this.barWidth,
          isActive ? this.segmentHeight : 0.001, // Show or hide
          1,
        );
        dummy.updateMatrix();
        this.segmentMesh.setMatrixAt(instanceIndex, dummy.matrix);
      }
    }

    this.segmentMesh.instanceMatrix.needsUpdate = true;

    // Update peaks
    this.updatePeaks();

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle canvas resize
   */
  protected onResize(width: number, height: number): void {
    if (!this.camera || !this.renderer) return;

    this.logicalHeight = height;

    // Update camera
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(width, height);

    // Reinitialize segments with new dimensions
    if (this.segmentMesh) {
      this.scene!.remove(this.segmentMesh);
      this.segmentMesh.dispose();
    }
    this.initializeSegments(width, height);
  }

  /**
   * Handle configuration changes
   */
  protected onConfigChange(config: SpectrumConfig): void {
    if (config.barCount !== this.barCount) {
      this.barCount = config.barCount;
      const { width, height } = this.getDimensions();
      this.onResize(width, height);
    }

    if (
      config.minFrequency !== this.minFreq ||
      config.maxFrequency !== this.maxFreq
    ) {
      this.minFreq = config.minFrequency || 20;
      this.maxFreq = config.maxFrequency || 20000;
      this.calculateFrequencyBins();
    }
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    if (this.segmentMesh) {
      this.segmentMesh.dispose();
      this.segmentMesh = null;
    }

    if (this.segmentGeometry) {
      this.segmentGeometry.dispose();
      this.segmentGeometry = null;
    }

    if (this.segmentMaterial) {
      this.segmentMaterial.dispose();
      this.segmentMaterial = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.barHeights = new Float32Array(0);
    this.targetHeights = new Float32Array(0);
    this.peakHolds = [];

    this.markDisposed();
  }
}

export default SpectrumAnalyzer;
