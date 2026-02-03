/**
 * VUMeter Visualizer
 *
 * Analog-style VU meter with peak/RMS level calculation, needle physics,
 * and authentic 300ms decay ballistics.
 *
 * @module VUMeter
 */

import * as THREE from "three";
import { BaseVisualizer } from "./BaseVisualizer";
import type { AudioData, BarsConfig, RGB } from "../types";

/**
 * Extended VU meter configuration interface
 */
export interface VUMeterConfig extends BarsConfig {
  mode: "stereo" | "mono";
  showPeak: boolean;
  showScale: boolean;
  decayTime: number;
  damping: number;
  minDb: number;
  maxDb: number;
}

/**
 * Meter channel data
 */
interface MeterChannel {
  /** Current RMS level (0-1) */
  rms: number;
  /** Current peak level (0-1) */
  peak: number;
  /** Held peak value */
  peakHold: number;
  /** Time when peak was set */
  peakTime: number;
  /** Needle angle/current value */
  needleValue: number;
  /** Needle velocity for physics */
  needleVelocity: number;
  /** Target value */
  targetValue: number;
}

/**
 * Analog-style VU meter visualizer
 */
export class VUMeter extends BaseVisualizer<VUMeterConfig> {
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;

  // Meter meshes
  private meterGroup: THREE.Group | null = null;
  private needleLeft: THREE.Line | null = null;
  private needleRight: THREE.Line | null = null;
  private scaleMesh: THREE.Group | null = null;
  private ledBarsLeft: THREE.InstancedMesh | null = null;
  private ledBarsRight: THREE.InstancedMesh | null = null;

  // Channel data
  private leftChannel: MeterChannel;
  private rightChannel: MeterChannel;

  // Demo mode
  private isDemoMode: boolean = false;
  private demoTime: number = 0;
  private demoBeatPhase: number = 0;

  // Constants
  private readonly PEAK_HOLD_TIME = 1000; // ms
  private readonly LED_COUNT = 24;
  private readonly SCALE_TICKS = [-20, -10, -7, -5, -3, 0, 3, 5, 7, 10];

  constructor(config: VUMeterConfig) {
    super(config);

    // Initialize channels
    this.leftChannel = {
      rms: 0,
      peak: 0,
      peakHold: 0,
      peakTime: 0,
      needleValue: 0,
      needleVelocity: 0,
      targetValue: 0,
    };

    this.rightChannel = {
      rms: 0,
      peak: 0,
      peakHold: 0,
      peakTime: 0,
      needleValue: 0,
      needleVelocity: 0,
      targetValue: 0,
    };
  }

  /**
   * Initialize the VU meter
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;

    // Use window dimensions to avoid DPR multiplication on re-init
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Setup Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    // Orthographic camera
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

    // Create meter elements
    this.createMeter(width, height);

    this.markInitialized();
  }

  /**
   * Create the VU meter geometry and materials
   */
  private createMeter(width: number, height: number): void {
    this.meterGroup = new THREE.Group();

    const isStereo = this.config.mode === "stereo";
    const meterWidth = width * 0.8;
    const meterHeight = height * 0.6;

    if (this.config.orientation === "horizontal") {
      // Horizontal meters (classic VU style)
      const meterSize = meterWidth / (isStereo ? 2 : 1) - 20;

      // Left channel
      this.createHorizontalMeter(
        -meterWidth / 4,
        0,
        meterSize,
        meterHeight,
        "left",
      );

      if (isStereo) {
        // Right channel
        this.createHorizontalMeter(
          meterWidth / 4,
          0,
          meterSize,
          meterHeight,
          "right",
        );
      }
    } else {
      // Vertical meters (bar style)
      const barWidth = meterWidth / (isStereo ? 2 : 1) - 20;

      // Left channel bars
      this.createVerticalBars(
        -barWidth / 2 - 10,
        0,
        barWidth,
        meterHeight,
        "left",
      );

      if (isStereo) {
        // Right channel bars
        this.createVerticalBars(
          barWidth / 2 + 10,
          0,
          barWidth,
          meterHeight,
          "right",
        );
      }
    }

    // Add scale if enabled
    if (this.config.showScale) {
      this.createScale(width, height);
    }

    this.scene!.add(this.meterGroup);
  }

  /**
   * Create a horizontal meter with needle
   */
  private createHorizontalMeter(
    x: number,
    y: number,
    width: number,
    height: number,
    channel: "left" | "right",
  ): void {
    // Meter background
    const bgGeometry = new THREE.PlaneGeometry(width, height);
    const bgMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a0a0a,
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.position.set(x, y, 0);
    this.meterGroup!.add(background);

    // LED segments (simplified VU bar)
    const ledCount = this.LED_COUNT;
    const ledWidth = (width - 20) / ledCount;
    const ledHeight = height * 0.3;
    const ledGeometry = new THREE.PlaneGeometry(ledWidth * 0.8, ledHeight);

    // Create instanced mesh for LEDs
    const ledMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uLevels: { value: new Float32Array(ledCount) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uLevels[${ledCount}];
        varying vec2 vUv;
        
        void main() {
          int index = int(vUv.x * float(${ledCount}));
          float level = 0.0;
          
          // Get level for this LED (simplified)
          for (int i = 0; i < ${ledCount}; i++) {
            if (i == index) {
              level = uLevels[i];
              break;
            }
          }
          
          // Color zones: green (0-60%), yellow (60-80%), red (80-100%)
          float t = vUv.x;
          vec3 color;
          if (t < 0.6) {
            color = mix(vec3(0.0, 0.3, 0.0), vec3(0.0, 1.0, 0.0), level);
          } else if (t < 0.8) {
            color = mix(vec3(0.3, 0.3, 0.0), vec3(1.0, 1.0, 0.0), level);
          } else {
            color = mix(vec3(0.3, 0.0, 0.0), vec3(1.0, 0.0, 0.0), level);
          }
          
          // Glow effect
          color += color * level * 0.5;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    const ledMesh = new THREE.InstancedMesh(ledGeometry, ledMaterial, ledCount);
    ledMesh.position.set(
      x - width / 2 + 10 + ledWidth / 2,
      y - height * 0.15,
      0.1,
    );

    const dummy = new THREE.Object3D();
    for (let i = 0; i < ledCount; i++) {
      dummy.position.set(i * ledWidth, 0, 0);
      dummy.updateMatrix();
      ledMesh.setMatrixAt(i, dummy.matrix);
    }

    this.meterGroup!.add(ledMesh);

    if (channel === "left") {
      this.ledBarsLeft = ledMesh;
    } else {
      this.ledBarsRight = ledMesh;
    }

    // Needle
    const needleGeometry = new THREE.BufferGeometry();
    const needleVertices = new Float32Array([
      0,
      -height * 0.25,
      0,
      0,
      height * 0.25,
      0,
    ]);
    needleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(needleVertices, 3),
    );

    const needleMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
    });

    const needle = new THREE.Line(needleGeometry, needleMaterial);
    needle.position.set(x - width / 2 + 10, y, 0.2);

    this.meterGroup!.add(needle);

    if (channel === "left") {
      this.needleLeft = needle;
    } else {
      this.needleRight = needle;
    }
  }

  /**
   * Create vertical LED bars
   */
  private createVerticalBars(
    x: number,
    y: number,
    width: number,
    height: number,
    channel: "left" | "right",
  ): void {
    const ledCount = this.LED_COUNT;
    const ledHeight = (height - 20) / ledCount;
    const ledGeometry = new THREE.PlaneGeometry(width * 0.8, ledHeight * 0.8);

    const ledMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
    });

    const ledMesh = new THREE.InstancedMesh(ledGeometry, ledMaterial, ledCount);
    ledMesh.position.set(x, y - height / 2 + 10 + ledHeight / 2, 0.1);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < ledCount; i++) {
      dummy.position.set(0, i * ledHeight, 0);
      dummy.updateMatrix();
      ledMesh.setMatrixAt(i, dummy.matrix);
    }

    this.meterGroup!.add(ledMesh);

    if (channel === "left") {
      this.ledBarsLeft = ledMesh;
    } else {
      this.ledBarsRight = ledMesh;
    }
  }

  /**
   * Create scale markings
   */
  private createScale(width: number, height: number): void {
    this.scaleMesh = new THREE.Group();

    const scaleWidth = width * 0.8;
    const minDb = this.config.minDb || -20;
    const maxDb = this.config.maxDb || 3;

    // Create tick marks
    this.SCALE_TICKS.forEach((db) => {
      if (db >= minDb && db <= maxDb) {
        const t = (db - minDb) / (maxDb - minDb);
        const x = -scaleWidth / 2 + t * scaleWidth;

        // Tick mark
        const tickGeometry = new THREE.PlaneGeometry(2, 10);
        const tickMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
        const tick = new THREE.Mesh(tickGeometry, tickMaterial);
        tick.position.set(x, -height * 0.2, 0.1);
        this.scaleMesh!.add(tick);
      }
    });

    this.meterGroup!.add(this.scaleMesh);
  }

  /**
   * Update with audio data
   */
  update(audioData: AudioData): void {
    if (!this.isInitialized) return;

    // Calculate dB levels from audio data
    const rms = audioData.rms;
    const peak = audioData.peak;

    // Convert to dB (with floor at -60dB)
    const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -60;
    const peakDb = peak > 0 ? 20 * Math.log10(peak) : -60;

    // Normalize to 0-1 range based on config
    const minDb = this.config.minDb || -20;
    const maxDb = this.config.maxDb || 3;

    const normalizeDb = (db: number): number => {
      return Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)));
    };

    // Update left channel (mono or stereo)
    this.leftChannel.targetValue = normalizeDb(rmsDb);
    this.leftChannel.peak = normalizeDb(peakDb);

    // Update peak hold
    if (this.leftChannel.peak > this.leftChannel.peakHold) {
      this.leftChannel.peakHold = this.leftChannel.peak;
      this.leftChannel.peakTime = performance.now();
    }

    // Update right channel if stereo (use same data for now, could be split)
    if (this.config.mode === "stereo") {
      this.rightChannel.targetValue = this.leftChannel.targetValue;
      this.rightChannel.peak = this.leftChannel.peak;
      this.rightChannel.peakHold = this.leftChannel.peakHold;
      this.rightChannel.peakTime = this.leftChannel.peakTime;
    }
  }

  /**
   * Enable demo mode
   */
  setDemoMode(enabled: boolean): void {
    this.isDemoMode = enabled;
    if (enabled) {
      this.demoTime = 0;
      this.demoBeatPhase = 0;
    }
  }

  /**
   * Generate simulated levels for demo mode
   */
  private generateDemoLevels(): void {
    this.demoTime += 0.016;
    this.demoBeatPhase += 0.1;

    // Simulated beat pattern
    const beat = Math.sin(this.demoBeatPhase) * 0.5 + 0.5;
    const beat2 = Math.sin(this.demoBeatPhase * 1.5 + 1) * 0.5 + 0.5;

    // Add some noise
    const noise = Math.random() * 0.1;

    // Combine for realistic VU meter movement
    const level = Math.min(1, beat * 0.7 + beat2 * 0.2 + noise);
    const peak = Math.min(1, level + Math.random() * 0.2);

    this.leftChannel.targetValue = level;
    this.leftChannel.peak = peak;

    if (peak > this.leftChannel.peakHold) {
      this.leftChannel.peakHold = peak;
      this.leftChannel.peakTime = performance.now();
    }

    if (this.config.mode === "stereo") {
      this.rightChannel.targetValue =
        level * 0.9 + Math.sin(this.demoTime * 2) * 0.1;
      this.rightChannel.peak = peak * 0.95;

      if (this.rightChannel.peak > this.rightChannel.peakHold) {
        this.rightChannel.peakHold = this.rightChannel.peak;
        this.rightChannel.peakTime = performance.now();
      }
    }
  }

  /**
   * Update needle physics with authentic 300ms ballistics
   */
  private updateNeedlePhysics(channel: MeterChannel, deltaTime: number): void {
    const decayTime = this.config.decayTime || 300; // ms
    const damping = this.config.damping || 0.85;

    // Calculate decay factor (authentic 300ms decay)
    const decayFactor = Math.exp((-deltaTime / decayTime) * 1000);

    // Apply spring physics with damping
    const displacement = channel.targetValue - channel.needleValue;
    const springForce = displacement * 0.3;

    channel.needleVelocity += springForce * deltaTime;
    channel.needleVelocity *= damping;
    channel.needleValue += channel.needleVelocity;

    // Apply decay when level drops
    if (channel.targetValue < channel.needleValue) {
      channel.needleValue =
        channel.targetValue +
        (channel.needleValue - channel.targetValue) * decayFactor;
    }

    // Clamp
    channel.needleValue = Math.max(0, Math.min(1, channel.needleValue));
    channel.rms = channel.needleValue;
  }

  /**
   * Update peak hold decay
   */
  private updatePeakHold(channel: MeterChannel): void {
    const now = performance.now();

    if (now - channel.peakTime > this.PEAK_HOLD_TIME) {
      channel.peakHold *= 0.99; // Slow decay after hold time
      if (channel.peakHold < 0.01) {
        channel.peakHold = 0;
      }
    }
  }

  /**
   * Render one frame
   */
  render(): void {
    if (!this.isInitialized || !this.scene || !this.camera || !this.renderer) {
      return;
    }

    this.trackFPS();

    const deltaTime = 0.016; // ~60fps

    // Generate demo data if in demo mode
    if (this.isDemoMode) {
      this.generateDemoLevels();
    }

    // Update needle physics
    this.updateNeedlePhysics(this.leftChannel, deltaTime);
    this.updatePeakHold(this.leftChannel);

    if (this.config.mode === "stereo") {
      this.updateNeedlePhysics(this.rightChannel, deltaTime);
      this.updatePeakHold(this.rightChannel);
    }

    // Update visual elements
    this.updateVisuals();

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update visual meter elements
   */
  private updateVisuals(): void {
    const ledCount = this.LED_COUNT;
    const dummy = new THREE.Object3D();

    // Update left channel LEDs
    if (this.ledBarsLeft) {
      for (let i = 0; i < ledCount; i++) {
        const threshold = i / ledCount;
        const isActive = this.leftChannel.needleValue >= threshold;
        const isPeak = this.leftChannel.peakHold >= threshold;

        // Scale LED based on activity
        const scaleY = isActive ? 1 : 0.2;
        const scaleX = isActive ? 1 : 0.8;

        this.ledBarsLeft.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        dummy.scale.set(scaleX, scaleY, 1);
        dummy.updateMatrix();
        this.ledBarsLeft.setMatrixAt(i, dummy.matrix);

        // Color based on zone
        let color: RGB;
        if (threshold < 0.6) {
          color = isActive ? [0, 255, 0] : [0, 50, 0];
        } else if (threshold < 0.8) {
          color = isActive ? [255, 255, 0] : [50, 50, 0];
        } else {
          color = isActive ? [255, 0, 0] : [50, 0, 0];
        }

        // Peak indicator brighter
        if (isPeak && !isActive) {
          color = color.map((c) => Math.min(255, c + 50)) as RGB;
        }

        // Apply the color
        const threeColor = new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255);
        this.ledBarsLeft.setColorAt(i, threeColor);
      }

      this.ledBarsLeft.instanceMatrix.needsUpdate = true;
      if (this.ledBarsLeft.instanceColor) {
        this.ledBarsLeft.instanceColor.needsUpdate = true;
      }
    }

    // Update right channel LEDs
    if (this.ledBarsRight && this.config.mode === "stereo") {
      for (let i = 0; i < ledCount; i++) {
        const threshold = i / ledCount;
        const isActive = this.rightChannel.needleValue >= threshold;
        const isPeak = this.rightChannel.peakHold >= threshold;

        const scaleY = isActive ? 1 : 0.2;
        const scaleX = isActive ? 1 : 0.8;

        this.ledBarsRight.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        dummy.scale.set(scaleX, scaleY, 1);
        dummy.updateMatrix();
        this.ledBarsRight.setMatrixAt(i, dummy.matrix);

        // Color based on zone
        let color: RGB;
        if (threshold < 0.6) {
          color = isActive ? [0, 255, 0] : [0, 50, 0];
        } else if (threshold < 0.8) {
          color = isActive ? [255, 255, 0] : [50, 50, 0];
        } else {
          color = isActive ? [255, 0, 0] : [50, 0, 0];
        }

        if (isPeak && !isActive) {
          color = color.map((c) => Math.min(255, c + 50)) as RGB;
        }

        const threeColor = new THREE.Color(color[0] / 255, color[1] / 255, color[2] / 255);
        this.ledBarsRight.setColorAt(i, threeColor);
      }

      this.ledBarsRight.instanceMatrix.needsUpdate = true;
      if (this.ledBarsRight.instanceColor) {
        this.ledBarsRight.instanceColor.needsUpdate = true;
      }
    }

    // Update needle rotation
    if (this.needleLeft) {
      const minAngle = -Math.PI * 0.8;
      const maxAngle = Math.PI * 0.1;
      const angle =
        minAngle + this.leftChannel.needleValue * (maxAngle - minAngle);
      this.needleLeft.rotation.z = -angle; // Negative for correct direction
    }

    if (this.needleRight && this.config.mode === "stereo") {
      const minAngle = -Math.PI * 0.8;
      const maxAngle = Math.PI * 0.1;
      const angle =
        minAngle + this.rightChannel.needleValue * (maxAngle - minAngle);
      this.needleRight.rotation.z = -angle;
    }
  }

  /**
   * Handle resize
   */
  protected onResize(width: number, height: number): void {
    if (!this.camera || !this.renderer) return;

    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);

    // Recreate meter with new dimensions
    if (this.meterGroup) {
      this.scene!.remove(this.meterGroup);
      this.meterGroup.clear();
    }
    this.createMeter(width, height);
  }

  /**
   * Handle configuration changes
   */
  protected onConfigChange(config: VUMeterConfig): void {
    // Recreate meter if mode or orientation changes
    if (
      config.mode !== this.config.mode ||
      config.orientation !== this.config.orientation
    ) {
      const { width, height } = this.getDimensions();
      this.onResize(width, height);
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.meterGroup) {
      this.scene!.remove(this.meterGroup);
      this.meterGroup.clear();
      this.meterGroup = null;
    }

    if (this.ledBarsLeft) {
      this.ledBarsLeft.dispose();
      this.ledBarsLeft = null;
    }

    if (this.ledBarsRight) {
      this.ledBarsRight.dispose();
      this.ledBarsRight = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.needleLeft = null;
    this.needleRight = null;
    this.scaleMesh = null;
    this.scene = null;
    this.camera = null;

    this.markDisposed();
  }
}

export default VUMeter;
