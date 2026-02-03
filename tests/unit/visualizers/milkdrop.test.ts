import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MilkdropRenderer } from '../../../src/visualizers/MilkdropRenderer';
import { createMockAudioData, createFrequencyAudioData } from '../../utils/test-helpers';
import * as THREE from 'three';

// Mock THREE.js
vi.mock('three', () => ({
  Scene: vi.fn(() => ({
    add: vi.fn(),
    remove: vi.fn(),
  })),
  WebGLRenderer: vi.fn(() => ({
    render: vi.fn(),
  })),
  PerspectiveCamera: vi.fn(),
  BufferGeometry: vi.fn(() => ({
    setAttribute: vi.fn(),
    dispose: vi.fn(),
  })),
  Float32BufferAttribute: vi.fn((array, itemSize) => ({ array, itemSize })),
  Points: vi.fn(() => ({
    geometry: {
      attributes: {
        position: { array: new Float32Array(0), needsUpdate: false },
        velocity: { array: new Float32Array(0), needsUpdate: false },
        size: { array: new Float32Array(0), needsUpdate: false },
      },
      dispose: vi.fn(),
    },
    material: {
      dispose: vi.fn(),
      uniforms: {},
    },
  })),
  ShaderMaterial: vi.fn((params) => ({
    uniforms: params.uniforms || {},
    dispose: vi.fn(),
  })),
  AdditiveBlending: 2,
  Color: vi.fn((r, g, b) => ({ r, g, b })),
  Vector2: vi.fn((x, y) => ({ x, y })),
}));

describe('MilkdropRenderer', () => {
  let milkdrop: MilkdropRenderer;

  beforeEach(() => {
    milkdrop = new MilkdropRenderer({
      particleCount: 1000,
      beatThreshold: 0.5,
      beatHoldTime: 100,
    });
  });

  describe('initialization', () => {
    it('should create milkdrop with default configuration', () => {
      const defaultMilkdrop = new MilkdropRenderer({});
      
      expect(defaultMilkdrop).toBeDefined();
      expect(defaultMilkdrop.id).toBe('milkdrop');
      expect(defaultMilkdrop.name).toBe('Milkdrop');
    });

    it('should accept custom particle count', () => {
      const custom = new MilkdropRenderer({ particleCount: 500 });
      
      expect(custom.config.particleCount).toBe(500);
    });

    it('should clamp particle count to valid range (100-5000)', () => {
      const tooFew = new MilkdropRenderer({ particleCount: 50 });
      const tooMany = new MilkdropRenderer({ particleCount: 10000 });
      
      expect(tooFew.config.particleCount).toBe(100);
      expect(tooMany.config.particleCount).toBe(5000);
    });

    it('should accept beat detection threshold', () => {
      const custom = new MilkdropRenderer({ beatThreshold: 0.7 });
      
      expect(custom.config.beatThreshold).toBe(0.7);
    });

    it('should clamp beat threshold to 0-1 range', () => {
      const tooLow = new MilkdropRenderer({ beatThreshold: -0.5 });
      const tooHigh = new MilkdropRenderer({ beatThreshold: 1.5 });
      
      expect(tooLow.config.beatThreshold).toBe(0);
      expect(tooHigh.config.beatThreshold).toBe(1);
    });

    it('should accept beat hold time', () => {
      const custom = new MilkdropRenderer({ beatHoldTime: 200 });
      
      expect(custom.config.beatHoldTime).toBe(200);
    });
  });

  describe('beat detection', () => {
    it('should detect beat in bass frequencies', () => {
      const bassData = createFrequencyAudioData('bass', 1024);
      
      milkdrop.update(bassData);
      
      expect(milkdrop.isBeatDetected()).toBe(true);
    });

    it('should not detect beat without bass', () => {
      const trebleData = createFrequencyAudioData('treble', 1024);
      
      milkdrop.update(trebleData);
      
      expect(milkdrop.isBeatDetected()).toBe(false);
    });

    it('should respect beat hold time (anti-spam)', () => {
      const bassData = createFrequencyAudioData('bass', 1024);
      
      // First beat
      milkdrop.update(bassData);
      expect(milkdrop.isBeatDetected()).toBe(true);
      
      // Immediate second update - should not detect
      milkdrop.update(bassData);
      expect(milkdrop.isBeatDetected()).toBe(false);
    });

    it('should decay beat intensity over time', () => {
      const bassData = createFrequencyAudioData('bass', 1024);
      
      milkdrop.update(bassData);
      const intensity1 = milkdrop.getBeatIntensity();
      
      // Wait and update without strong bass
      const weakData = createFrequencyAudioData('treble', 1024);
      milkdrop.update(weakData);
      const intensity2 = milkdrop.getBeatIntensity();
      
      expect(intensity2).toBeLessThan(intensity1);
    });

    it('should analyze frequency bands correctly', () => {
      const audioData = createMockAudioData({ length: 1024 });
      
      milkdrop.update(audioData);
      const bands = milkdrop.getFrequencyBands();
      
      expect(bands.low).toBeGreaterThanOrEqual(0);
      expect(bands.low).toBeLessThanOrEqual(1);
      expect(bands.mid).toBeGreaterThanOrEqual(0);
      expect(bands.mid).toBeLessThanOrEqual(1);
      expect(bands.high).toBeGreaterThanOrEqual(0);
      expect(bands.high).toBeLessThanOrEqual(1);
    });
  });

  describe('particle system', () => {
    it('should initialize particles in 3D space', async () => {
      await milkdrop.initialize();
      
      const particles = milkdrop.getParticles();
      expect(particles).toBeDefined();
    });

    it('should have correct number of particles', async () => {
      await milkdrop.initialize();
      
      const particleCount = milkdrop.getParticleCount();
      expect(particleCount).toBe(1000);
    });

    it('should distribute particles spherically', async () => {
      await milkdrop.initialize();
      
      const positions = milkdrop.getParticlePositions();
      
      // Check that particles are in roughly spherical distribution
      let totalRadius = 0;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        const radius = Math.sqrt(x * x + y * y + z * z);
        totalRadius += radius;
      }
      
      const avgRadius = totalRadius / (positions.length / 3);
      expect(avgRadius).toBeGreaterThan(0.5);
      expect(avgRadius).toBeLessThan(2);
    });

    it('should explode particles on beat', async () => {
      await milkdrop.initialize();
      
      const initialVelocities = milkdrop.getParticleVelocities();
      
      // Trigger beat
      const bassData = createFrequencyAudioData('bass', 1024);
      milkdrop.update(bassData);
      milkdrop.explodeParticles();
      
      const newVelocities = milkdrop.getParticleVelocities();
      
      // Velocities should have increased
      const initialAvg = initialVelocities.reduce((a, b) => a + Math.abs(b), 0) / initialVelocities.length;
      const newAvg = newVelocities.reduce((a, b) => a + Math.abs(b), 0) / newVelocities.length;
      
      expect(newAvg).toBeGreaterThan(initialAvg);
    });

    it('should apply drag to slow particles', async () => {
      await milkdrop.initialize();
      
      // Give particles some velocity
      milkdrop.explodeParticles();
      const velocities1 = milkdrop.getParticleVelocities();
      const speed1 = velocities1.reduce((a, b) => a + Math.abs(b), 0);
      
      // Render to apply drag
      milkdrop.render(0.016);
      
      const velocities2 = milkdrop.getParticleVelocities();
      const speed2 = velocities2.reduce((a, b) => a + Math.abs(b), 0);
      
      expect(speed2).toBeLessThan(speed1);
    });

    it('should wrap particles at boundaries', async () => {
      await milkdrop.initialize();
      
      // Push particle beyond boundary
      milkdrop.setParticlePosition(0, 4, 0, 0); // Beyond limit of 3
      
      milkdrop.render(0.016);
      
      const pos = milkdrop.getParticlePosition(0);
      expect(Math.abs(pos.x)).toBeLessThanOrEqual(3);
    });
  });

  describe('shader uniforms', () => {
    it('should update time uniform', async () => {
      await milkdrop.initialize();
      
      const time1 = milkdrop.getUniform('time');
      milkdrop.render(0.016);
      const time2 = milkdrop.getUniform('time');
      
      expect(time2).toBeGreaterThan(time1);
    });

    it('should update audio uniforms', async () => {
      await milkdrop.initialize();
      
      const audioData = createMockAudioData({ length: 1024 });
      milkdrop.update(audioData);
      
      expect(milkdrop.getUniform('audioLow')).toBeGreaterThanOrEqual(0);
      expect(milkdrop.getUniform('audioMid')).toBeGreaterThanOrEqual(0);
      expect(milkdrop.getUniform('audioHigh')).toBeGreaterThanOrEqual(0);
    });

    it('should update beat uniform', async () => {
      await milkdrop.initialize();
      
      const bassData = createFrequencyAudioData('bass', 1024);
      milkdrop.update(bassData);
      
      expect(milkdrop.getUniform('beat')).toBeGreaterThan(0);
    });

    it('should update color uniforms from theme', async () => {
      await milkdrop.initialize();
      
      const theme = {
        colors: {
          visualizer: {
            primary: '#ff00ff',
            secondary: '#00ffff',
          },
        },
      };
      
      milkdrop.setTheme(theme);
      
      expect(milkdrop.getUniform('color1')).toBeDefined();
      expect(milkdrop.getUniform('color2')).toBeDefined();
    });
  });

  describe('presets', () => {
    it('should support preset loading', () => {
      const preset = {
        name: 'Test Preset',
        particleCount: 2000,
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      };
      
      milkdrop.loadPreset(preset);
      
      expect(milkdrop.getCurrentPreset().name).toBe('Test Preset');
    });

    it('should transition between presets', async () => {
      await milkdrop.initialize();
      
      const preset1 = { name: 'Preset 1' };
      const preset2 = { name: 'Preset 2' };
      
      milkdrop.loadPreset(preset1);
      milkdrop.transitionToPreset(preset2);
      
      expect(milkdrop.isTransitioning()).toBe(true);
    });

    it('should cycle through presets', () => {
      const presets = [
        { name: 'Preset 1' },
        { name: 'Preset 2' },
        { name: 'Preset 3' },
      ];
      
      milkdrop.setPresets(presets);
      
      expect(milkdrop.getCurrentPreset().name).toBe('Preset 1');
      
      milkdrop.nextPreset();
      expect(milkdrop.getCurrentPreset().name).toBe('Preset 2');
      
      milkdrop.nextPreset();
      expect(milkdrop.getCurrentPreset().name).toBe('Preset 3');
      
      milkdrop.nextPreset();
      expect(milkdrop.getCurrentPreset().name).toBe('Preset 1'); // Wrap around
    });
  });

  describe('resource management', () => {
    it('should dispose geometry', async () => {
      await milkdrop.initialize();
      
      const disposeSpy = vi.fn();
      milkdrop.getParticles().geometry.dispose = disposeSpy;
      
      milkdrop.dispose();
      
      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should dispose shader material', async () => {
      await milkdrop.initialize();
      
      const disposeSpy = vi.fn();
      milkdrop.getParticles().material.dispose = disposeSpy;
      
      milkdrop.dispose();
      
      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should remove particles from scene', async () => {
      await milkdrop.initialize();
      
      const removeSpy = vi.fn();
      milkdrop.scene = { remove: removeSpy } as any;
      
      milkdrop.dispose();
      
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe('performance', () => {
    it('should maintain 60fps with default particle count', async () => {
      await milkdrop.initialize();
      
      const start = performance.now();
      
      for (let i = 0; i < 60; i++) {
        const audioData = createMockAudioData();
        milkdrop.update(audioData);
        milkdrop.render(0.016);
      }
      
      const duration = performance.now() - start;
      
      // Should render 60 frames in under 1000ms
      expect(duration).toBeLessThan(1000);
    });

    it('should handle maximum particle count efficiently', async () => {
      const largeMilkdrop = new MilkdropRenderer({ particleCount: 5000 });
      await largeMilkdrop.initialize();
      
      const start = performance.now();
      
      const audioData = createMockAudioData();
      largeMilkdrop.update(audioData);
      largeMilkdrop.render(0.016);
      
      const duration = performance.now() - start;
      
      // Single frame should render in under 32ms (30fps minimum)
      expect(duration).toBeLessThan(32);
    });
  });

  describe('edge cases', () => {
    it('should handle empty audio data', async () => {
      await milkdrop.initialize();
      
      const emptyData = createMockAudioData({
        frequencyData: new Uint8Array(0),
      });
      
      expect(() => milkdrop.update(emptyData)).not.toThrow();
    });

    it('should handle very quiet audio', async () => {
      await milkdrop.initialize();
      
      const quietData = createMockAudioData({
        frequencyData: new Uint8Array(1024).fill(10),
      });
      
      milkdrop.update(quietData);
      
      expect(milkdrop.isBeatDetected()).toBe(false);
    });

    it('should handle initialization without scene', () => {
      const isolated = new MilkdropRenderer({});
      
      expect(() => isolated.initialize()).not.toThrow();
    });
  });
});
