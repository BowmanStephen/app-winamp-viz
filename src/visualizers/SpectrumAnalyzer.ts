/**
 * SpectrumAnalyzer Visualizer
 *
 * FFT frequency bars visualizer with logarithmic frequency distribution,
 * instanced mesh rendering for performance, and phosphor glow effects.
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

/**
 * Spectrum analyzer using FFT frequency bars with instanced rendering
 */
export class SpectrumAnalyzer extends BaseVisualizer<SpectrumConfig> {
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private barMesh: THREE.InstancedMesh | null = null;
  private barGeometry: THREE.BoxGeometry | null = null;
  private barMaterial: THREE.ShaderMaterial | null = null;

  // Bar data
  private barCount: number = 64;
  private barWidth: number = 0;
  private barSpacing: number = 0;
  private barHeights: Float32Array = new Float32Array(0);
  private targetHeights: Float32Array = new Float32Array(0);
  private peakHolds: PeakHold[] = [];
  private barXPositions: number[] = []; // Store X positions for each bar
  private baseY: number = 0; // Base Y position for bars
  private logicalHeight: number = 0; // Store logical height for render calculations

  // Demo mode
  private isDemoMode: boolean = false;
  private demoTime: number = 0;

  // Frequency mapping
  private frequencyBins: number[] = [];
  private minFreq: number = 20;
  private maxFreq: number = 20000;

  constructor(config: SpectrumConfig) {
    super(config);
    this.barCount = config.barCount || 64;
    this.minFreq = config.minFrequency || 20;
    this.maxFreq = config.maxFrequency || 20000;
  }

  /**
   * Initialize the spectrum analyzer with a canvas
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;

    // Use window dimensions to avoid DPR multiplication on re-init
    // canvas.width may already include DPR scaling from a previous visualizer
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.logicalHeight = height; // Store for render calculations

    // Setup Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

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

    // Initialize bars
    this.initializeBars(width, height);

    // Initialize frequency mapping
    this.calculateFrequencyBins();

    this.markInitialized();
  }

  /**
   * Initialize the instanced bar mesh
   */
  private initializeBars(width: number, height: number): void {
    this.barCount = Math.min(Math.max(this.config.barCount, 32), 256);

    // Calculate bar dimensions
    const totalWidth = width * 0.9;
    this.barSpacing = (totalWidth / this.barCount) * 0.1;
    this.barWidth =
      (totalWidth - this.barSpacing * (this.barCount - 1)) / this.barCount;

    // Create bar geometry (box)
    this.barGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.barGeometry.translate(0, 0.5, 0); // Pivot at bottom

    // Custom shader material for phosphor glow (works with InstancedMesh)
    this.barMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uGlowIntensity: { value: 1.0 },
        uBarCount: { value: this.barCount },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vHeight;

        void main() {
          vUv = uv;
          vHeight = position.y;

          // Apply instance transform for InstancedMesh
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uGlowIntensity;
        uniform float uBarCount;

        varying vec2 vUv;
        varying float vHeight;

        void main() {
          // Use vUv.y for color gradient (height-based coloring)
          float t = vUv.y;

          // Classic spectrum colors: green at bottom -> yellow -> red at top
          vec3 color;
          if (t < 0.5) {
            color = mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), t * 2.0);
          } else {
            color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), (t - 0.5) * 2.0);
          }

          // Phosphor glow effect - brighter at bottom
          float glow = exp(-vUv.y * 1.5) * uGlowIntensity;
          color += color * glow * 0.3;

          // Gentle edge softening (minimum 0.7 brightness at edges)
          float edge = 0.7 + 0.3 * (1.0 - abs(vUv.x - 0.5) * 2.0);

          gl_FragColor = vec4(color * edge, 1.0);
        }
      `,
      transparent: true,
    });

    // Create instanced mesh
    this.barMesh = new THREE.InstancedMesh(
      this.barGeometry,
      this.barMaterial,
      this.barCount,
    );

    // Initialize instance matrices and store positions
    const dummy = new THREE.Object3D();
    const startX = -totalWidth / 2 + this.barWidth / 2;
    this.baseY = -height / 2 + 10; // Store base Y position
    this.barXPositions = []; // Reset X positions array

    for (let i = 0; i < this.barCount; i++) {
      const x = startX + i * (this.barWidth + this.barSpacing);
      this.barXPositions.push(x); // Store X position
      dummy.position.set(x, this.baseY, 0);
      dummy.scale.set(this.barWidth, 1, 1);
      dummy.updateMatrix();
      this.barMesh.setMatrixAt(i, dummy.matrix);
    }

    this.barMesh.instanceMatrix.needsUpdate = true;
    this.scene!.add(this.barMesh);

    // Initialize height arrays
    this.barHeights = new Float32Array(this.barCount);
    this.targetHeights = new Float32Array(this.barCount);
    this.peakHolds = new Array(this.barCount).fill({ value: 0, time: 0 });
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

      // Skip if frequency bins are undefined
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

      // Skip if peak data is missing
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
      !this.barMesh
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
    // Use stored logical height to match camera coordinates (not DPR-scaled canvas.height)
    const maxBarHeight = this.logicalHeight * 0.85;

    // Update bar heights with smoothing
    for (let i = 0; i < this.barCount; i++) {
      const targetHeight = this.targetHeights[i] ?? 0;
      const currentHeight = this.barHeights[i] ?? 0;

      // Apply smoothing
      const newHeight =
        currentHeight + (targetHeight - currentHeight) * (1 - smoothing);
      this.barHeights[i] = newHeight;

      // Scale to pixel height
      const barHeight = newHeight * maxBarHeight;

      // Update instance matrix using stored positions (not extracting from matrix)
      const x = this.barXPositions[i] ?? 0;
      dummy.position.set(x, this.baseY, 0);
      dummy.scale.set(this.barWidth, Math.max(barHeight, 1), 1);
      dummy.updateMatrix();
      this.barMesh.setMatrixAt(i, dummy.matrix);
    }

    this.barMesh.instanceMatrix.needsUpdate = true;

    // Update peaks
    this.updatePeaks();

    // Update shader uniforms
    const uniforms = this.barMaterial?.uniforms;
    if (uniforms?.uTime) {
      uniforms.uTime.value = performance.now() / 1000;
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle canvas resize
   */
  protected onResize(width: number, height: number): void {
    if (!this.camera || !this.renderer) return;

    // Update camera
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(width, height);

    // Reinitialize bars with new dimensions
    if (this.barMesh) {
      this.scene!.remove(this.barMesh);
      this.barMesh.dispose();
    }
    this.initializeBars(width, height);
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
    if (this.barMesh) {
      this.barMesh.dispose();
      this.barMesh = null;
    }

    if (this.barGeometry) {
      this.barGeometry.dispose();
      this.barGeometry = null;
    }

    if (this.barMaterial) {
      this.barMaterial.dispose();
      this.barMaterial = null;
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
