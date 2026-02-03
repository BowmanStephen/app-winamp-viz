/**
 * MilkdropVisualizer
 *
 * Beat-reactive particle system with custom shaders, color cycling,
 * and multiple presets for a Milkdrop-style visualization experience.
 *
 * @module MilkdropVisualizer
 */

import * as THREE from "three";
import { BaseVisualizer } from "./BaseVisualizer";
import type { AudioData, MilkdropConfig } from "../types";

/**
 * Preset definition
 */
interface Preset {
  name: string;
  particleCount: number;
  particleLife: number;
  colorSpeed: number;
  motionType: "orbit" | "explode" | "wave" | "swirl";
  sizeRange: [number, number];
  shaderVariant: number;
}

/**
 * Particle data structure
 */
interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
  initialPosition: THREE.Vector3;
}

/**
 * Milkdrop-style particle visualizer with custom shaders
 */
export class MilkdropVisualizer extends BaseVisualizer<MilkdropConfig> {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private particleSystem: THREE.Points | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particleMaterial: THREE.ShaderMaterial | null = null;

  // Particle data
  private particles: Particle[] = [];
  private particleCount: number = 2000;
  private maxParticles: number = 5000;

  // Presets
  private presets: Preset[] = [
    {
      name: "Cosmic Orbit",
      particleCount: 2000,
      particleLife: 5,
      colorSpeed: 0.5,
      motionType: "orbit",
      sizeRange: [2, 8],
      shaderVariant: 0,
    },
    {
      name: "Beat Explosion",
      particleCount: 3000,
      particleLife: 3,
      colorSpeed: 1.0,
      motionType: "explode",
      sizeRange: [1, 12],
      shaderVariant: 1,
    },
    {
      name: "Wave Flow",
      particleCount: 2500,
      particleLife: 8,
      colorSpeed: 0.3,
      motionType: "wave",
      sizeRange: [3, 10],
      shaderVariant: 2,
    },
    {
      name: "Vortex Swirl",
      particleCount: 3500,
      particleLife: 6,
      colorSpeed: 0.8,
      motionType: "swirl",
      sizeRange: [2, 6],
      shaderVariant: 0,
    },
  ];
  private currentPresetIndex: number = 0;

  // Shader uniforms
  private uniforms: {
    uTime: { value: number };
    uBeatIntensity: { value: number };
    uColorCycle: { value: number };
    uResolution: { value: THREE.Vector2 };
    uAudioLow: { value: number };
    uAudioMid: { value: number };
    uAudioHigh: { value: number };
  } | null = null;

  // Color cycling
  private colorCycle: number = 0;
  private colorCycleSpeed: number = 0.5;

  // Beat detection (local - avoid conflict with BaseVisualizer)
  private localBeatIntensity: number = 0;
  private lastBeatTime: number = 0;

  // Demo mode
  private demoTime: number = 0;

  // Feedback/warp effect
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private feedbackScene: THREE.Scene | null = null;
  private feedbackCamera: THREE.OrthographicCamera | null = null;
  private feedbackMaterial: THREE.ShaderMaterial | null = null;
  private feedbackMesh: THREE.Mesh | null = null;

  constructor(config: MilkdropConfig) {
    super(config);
    this.particleCount = config.particleCount || 2000;
    this.maxParticles = Math.min(5000, Math.max(1000, this.particleCount * 2));
    this.colorCycleSpeed = config.colorCycleSpeed || 0.5;
  }

  /**
   * Initialize the Milkdrop visualizer
   */
  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;

    // Use window dimensions to avoid DPR multiplication on re-init
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Setup Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050510);

    // Perspective camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 50;

    // WebGL renderer with alpha
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.autoClear = false;

    // Initialize shader uniforms
    this.uniforms = {
      uTime: { value: 0 },
      uBeatIntensity: { value: 0 },
      uColorCycle: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uAudioLow: { value: 0 },
      uAudioMid: { value: 0 },
      uAudioHigh: { value: 0 },
    };

    // Create feedback render target
    this.createFeedbackSystem(width, height);

    // Create particle system
    this.createParticleSystem();

    this.markInitialized();
  }

  /**
   * Create feedback/warp effect system
   */
  private createFeedbackSystem(width: number, height: number): void {
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    this.feedbackScene = new THREE.Scene();
    this.feedbackCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.feedbackCamera.position.z = 1;

    // Feedback shader for motion blur/warp
    this.feedbackMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uTime: { value: 0 },
        uWarp: { value: this.config.warp || 0.3 },
        uBeat: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform float uWarp;
        uniform float uBeat;
        
        varying vec2 vUv;
        
        void main() {
          vec2 center = vec2(0.5);
          vec2 toCenter = vUv - center;
          float dist = length(toCenter);
          
          // Warp/tunnel effect
          float warp = uWarp + uBeat * 0.1;
          vec2 warpOffset = toCenter * warp * (1.0 - dist);
          
          // Rotation
          float angle = uTime * 0.1 + uBeat * 0.5;
          float s = sin(angle * dist);
          float c = cos(angle * dist);
          vec2 rotated = vec2(
            toCenter.x * c - toCenter.y * s,
            toCenter.x * s + toCenter.y * c
          );
          
          vec2 sampleUv = center + rotated * (1.0 - warp * 0.5) + warpOffset;
          
          vec4 color = texture2D(uTexture, sampleUv);
          
          // Decay
          color.rgb *= 0.92 + uBeat * 0.05;
          
          gl_FragColor = color;
        }
      `,
    });

    const plane = new THREE.PlaneGeometry(2, 2);
    this.feedbackMesh = new THREE.Mesh(plane, this.feedbackMaterial);
    this.feedbackScene.add(this.feedbackMesh);
  }

  /**
   * Create particle system with custom shaders
   */
  private createParticleSystem(): void {
    const preset = this.presets[this.currentPresetIndex];
    if (!preset) {
      console.error("[MilkdropVisualizer] No preset available");
      return;
    }
    const count = Math.min(this.maxParticles, preset.particleCount);

    // Initialize particle data
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(i, preset));
    }

    // Create geometry
    this.particleGeometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);
    const sizes = new Float32Array(this.maxParticles);

    this.particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    this.particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3),
    );
    this.particleGeometry.setAttribute(
      "size",
      new THREE.BufferAttribute(sizes, 1),
    );

    // Custom shader material
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms!,
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        
        uniform float uTime;
        uniform float uBeatIntensity;
        uniform float uColorCycle;
        
        varying vec3 vColor;
        varying float vAlpha;
        
        // Color space conversion
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        
        void main() {
          vColor = color;
          
          // Dynamic color based on audio and time
          float hue = uColorCycle + position.x * 0.01 + uBeatIntensity * 0.2;
          vec3 dynamicColor = hsv2rgb(vec3(fract(hue), 0.8, 1.0));
          vColor = mix(color, dynamicColor, 0.5 + uBeatIntensity * 0.5);
          
          // Size pulse on beat
          float sizeScale = 1.0 + uBeatIntensity * 2.0;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * sizeScale * (300.0 / -mvPosition.z);
          
          // Alpha based on life/beat
          vAlpha = 0.6 + uBeatIntensity * 0.4;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          // Circular particle with soft edge
          vec2 toCenter = gl_PointCoord - vec2(0.5);
          float dist = length(toCenter);
          
          if (dist > 0.5) discard;
          
          // Soft glow
          float alpha = (1.0 - dist * 2.0) * vAlpha;
          alpha = pow(alpha, 0.8);
          
          // Inner bright core
          vec3 glow = vColor * (1.0 + (1.0 - dist * 2.0) * 2.0);
          
          gl_FragColor = vec4(glow, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particleSystem = new THREE.Points(
      this.particleGeometry,
      this.particleMaterial,
    );
    this.scene!.add(this.particleSystem);
  }

  /**
   * Create a single particle
   */
  private createParticle(index: number, preset: Preset): Particle {
    const motionType = preset.motionType;
    const position = new THREE.Vector3();
    const velocity = new THREE.Vector3();

    switch (motionType) {
      case "orbit":
        const angle = (index / preset.particleCount) * Math.PI * 2;
        const radius = 20 + Math.random() * 20;
        position.set(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          (Math.random() - 0.5) * 10,
        );
        velocity.set(-Math.sin(angle) * 0.5, Math.cos(angle) * 0.5, 0);
        break;

      case "explode":
        position.set(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
        );
        const vAngle = Math.random() * Math.PI * 2;
        const vElev = (Math.random() - 0.5) * Math.PI;
        const speed = 0.5 + Math.random() * 2;
        velocity.set(
          Math.cos(vAngle) * Math.cos(vElev) * speed,
          Math.sin(vElev) * speed,
          Math.sin(vAngle) * Math.cos(vElev) * speed,
        );
        break;

      case "wave":
        position.set(
          (index / preset.particleCount - 0.5) * 80,
          Math.sin(index * 0.1) * 10,
          (Math.random() - 0.5) * 20,
        );
        velocity.set(2, 0, 0);
        break;

      case "swirl":
        const sAngle = Math.random() * Math.PI * 2;
        const sRadius = Math.random() * 30;
        position.set(
          Math.cos(sAngle) * sRadius,
          Math.sin(sAngle) * sRadius,
          (Math.random() - 0.5) * 40,
        );
        velocity.set(0, 0, 0);
        break;
    }

    const color = new THREE.Color();
    color.setHSL(Math.random(), 0.8, 0.6);

    return {
      position: position.clone(),
      velocity: velocity.clone(),
      life: Math.random() * preset.particleLife,
      maxLife: preset.particleLife,
      size:
        preset.sizeRange[0] +
        Math.random() * (preset.sizeRange[1] - preset.sizeRange[0]),
      color: color,
      initialPosition: position.clone(),
    };
  }

  /**
   * Update with audio data
   */
  update(audioData: AudioData): void {
    if (!this.isInitialized) return;

    // Update audio uniforms
    if (this.uniforms) {
      this.uniforms.uAudioLow.value =
        audioData.bands.sub + audioData.bands.bass;
      this.uniforms.uAudioMid.value =
        audioData.bands.mid + audioData.bands.lowMid;
      this.uniforms.uAudioHigh.value =
        audioData.bands.treble + audioData.bands.highMid;
    }

    // Detect beat
    const bassEnergy = audioData.bands.bass;
    const now = performance.now();

    if (bassEnergy > 0.6 && now - this.lastBeatTime > 150) {
      this.localBeatIntensity = 1.0;
      this.lastBeatTime = now;
    } else {
      this.localBeatIntensity *= 0.95;
    }

    if (this.uniforms) {
      this.uniforms.uBeatIntensity.value = this.localBeatIntensity;
    }
  }

  /**
   * Enable demo mode
   */
  setDemoMode(enabled: boolean): void {
    if (enabled) {
      this.demoTime = 0;
    }
  }

  /**
   * Switch to next preset
   */
  nextPreset(): void {
    this.currentPresetIndex =
      (this.currentPresetIndex + 1) % this.presets.length;
    const preset = this.presets[this.currentPresetIndex];
    if (!preset) {
      console.error("[MilkdropVisualizer] No preset available");
      return;
    }

    // Reinitialize particles with new preset
    this.particles = [];
    for (let i = 0; i < preset.particleCount; i++) {
      this.particles.push(this.createParticle(i, preset));
    }
  }

  /**
   * Get current preset name
   */
  getCurrentPresetName(): string {
    const preset = this.presets[this.currentPresetIndex];
    return preset?.name ?? "Unknown";
  }

  /**
   * Update particle positions
   */
  private updateParticles(deltaTime: number): void {
    const preset = this.presets[this.currentPresetIndex];
    if (!preset) {
      return;
    }
    const audioBoost = 1 + this.localBeatIntensity * 2;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p) continue;

      // Update life
      p.life -= deltaTime;

      // Respawn if dead
      if (p.life <= 0) {
        const newP = this.createParticle(i, preset);
        if (newP) {
          p.position.copy(newP.position);
          p.velocity.copy(newP.velocity);
          p.life = newP.life;
          p.maxLife = newP.maxLife;
          p.color.copy(newP.color);
        }
      }

      // Apply motion based on type
      switch (preset.motionType) {
        case "orbit":
          const angle = this.demoTime * (0.5 + i * 0.001) * audioBoost;
          const radius = p.initialPosition.length();
          p.position.x = Math.cos(angle) * radius;
          p.position.y = Math.sin(angle) * radius;
          p.position.z = p.initialPosition.z + Math.sin(angle * 2) * 5;
          break;

        case "explode":
          p.position.addScaledVector(p.velocity, deltaTime * audioBoost);
          // Spiral motion
          const spiral = new THREE.Vector3(-p.position.y, p.position.x, 0)
            .normalize()
            .multiplyScalar(0.1 * audioBoost);
          p.velocity.add(spiral);
          break;

        case "wave":
          const waveX = p.position.x + p.velocity.x * deltaTime;
          const waveY =
            Math.sin(waveX * 0.1 + this.demoTime * 2) * 10 * audioBoost;
          const waveZ = Math.cos(waveX * 0.05 + this.demoTime) * 10;
          p.position.set(waveX, waveY, waveZ);

          // Wrap around
          if (p.position.x > 40) {
            p.position.x = -40;
          }
          break;

        case "swirl":
          const swirlAngle = this.demoTime * (0.3 + i * 0.0005) + p.life * 0.5;
          const swirlRadius =
            p.initialPosition.length() * (1 - (p.life / p.maxLife) * 0.5);
          p.position.x = Math.cos(swirlAngle) * swirlRadius;
          p.position.y = Math.sin(swirlAngle) * swirlRadius;
          p.position.z =
            p.initialPosition.z * (0.5 + 0.5 * Math.sin(swirlAngle * 3));
          break;
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
      !this.particleGeometry
    ) {
      return;
    }

    this.trackFPS();

    const deltaTime = 0.016; // ~60fps

    this.demoTime += deltaTime;
    this.colorCycle += deltaTime * this.colorCycleSpeed;

    // Update uniforms
    if (this.uniforms) {
      this.uniforms.uTime.value = this.demoTime;
      this.uniforms.uColorCycle.value = this.colorCycle;
    }

    // Update particles
    this.updateParticles(deltaTime);

    // Update geometry attributes
    const positionAttr = this.particleGeometry.attributes.position;
    const colorAttr = this.particleGeometry.attributes.color;
    const sizeAttr = this.particleGeometry.attributes.size;

    if (!positionAttr || !colorAttr || !sizeAttr) {
      return;
    }

    const positions = positionAttr.array as Float32Array;
    const colors = colorAttr.array as Float32Array;
    const sizes = sizeAttr.array as Float32Array;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p) {
        continue;
      }
      const lifeRatio = p.life / p.maxLife;

      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;

      colors[i * 3] = p.color.r;
      colors[i * 3 + 1] = p.color.g;
      colors[i * 3 + 2] = p.color.b;

      // Size fades with life
      sizes[i] = p.size * lifeRatio;
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;

    // Render feedback first
    if (
      this.feedbackMaterial &&
      this.renderTarget &&
      this.feedbackMaterial.uniforms
    ) {
      const uniforms = this.feedbackMaterial.uniforms;
      if (uniforms.uTexture) {
        uniforms.uTexture.value = this.renderTarget.texture;
      }
      if (uniforms.uTime) {
        uniforms.uTime.value = this.demoTime;
      }
      if (uniforms.uBeat) {
        uniforms.uBeat.value = this.localBeatIntensity;
      }

      this.renderer.setRenderTarget(this.renderTarget);
      this.renderer.render(this.feedbackScene!, this.feedbackCamera!);
    }

    // Render main scene
    this.renderer.setRenderTarget(null);

    // Clear with fade for trail effect
    this.renderer.clear();

    // Render feedback as background
    if (this.feedbackMesh && this.renderTarget) {
      const tempScene = new THREE.Scene();
      const tempMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({
          map: this.renderTarget.texture,
          transparent: true,
          opacity: this.config.motionBlur || 0.8,
        }),
      );
      tempScene.add(tempMesh);

      const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      this.renderer.render(tempScene, orthoCamera);
    }

    // Render particles
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle resize
   */
  protected onResize(width: number, height: number): void {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (this.uniforms) {
      this.uniforms.uResolution.value.set(width, height);
    }

    // Recreate render target
    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      });
    }
  }

  /**
   * Handle configuration changes
   */
  protected onConfigChange(config: MilkdropConfig): void {
    if (config.particleCount && config.particleCount !== this.particleCount) {
      this.particleCount = config.particleCount;
      const preset = this.presets[this.currentPresetIndex];
      if (preset) {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
          this.particles.push(this.createParticle(i, preset));
        }
      }
    }

    if (config.colorCycleSpeed !== undefined) {
      this.colorCycleSpeed = config.colorCycleSpeed;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.particleSystem) {
      this.scene!.remove(this.particleSystem);
      this.particleSystem = null;
    }

    if (this.particleGeometry) {
      this.particleGeometry.dispose();
      this.particleGeometry = null;
    }

    if (this.particleMaterial) {
      this.particleMaterial.dispose();
      this.particleMaterial = null;
    }

    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.particles = [];

    this.markDisposed();
  }
}

export default MilkdropVisualizer;
