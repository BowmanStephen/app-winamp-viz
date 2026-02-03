import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpectrumAnalyzer } from '../../../src/visualizers/SpectrumAnalyzer';
import { createMockAudioData, createSilentAudioData, createFullScaleAudioData } from '../../utils/test-helpers';
import * as THREE from 'three';

// Mock THREE.js
vi.mock('three', () => ({
  Scene: vi.fn(() => ({
    add: vi.fn(),
    remove: vi.fn(),
  })),
  WebGLRenderer: vi.fn(() => ({
    render: vi.fn(),
    setSize: vi.fn(),
    dispose: vi.fn(),
  })),
  PerspectiveCamera: vi.fn(() => ({
    position: { set: vi.fn() },
    lookAt: vi.fn(),
  })),
  BoxGeometry: vi.fn(() => ({
    dispose: vi.fn(),
  })),
  MeshBasicMaterial: vi.fn(() => ({
    dispose: vi.fn(),
    color: { set: vi.fn() },
  })),
  Mesh: vi.fn((geometry, material) => ({
    geometry,
    material,
    position: { y: 0, set: vi.fn() },
    scale: { y: 0, set: vi.fn() },
    clone: vi.fn(function() { return this; }),
  })),
  Color: vi.fn((hex) => ({ hex })),
  InstancedMesh: vi.fn(() => ({
    setMatrixAt: vi.fn(),
    instanceMatrix: { needsUpdate: false },
    dispose: vi.fn(),
  })),
  Object3D: vi.fn(() => ({
    position: { set: vi.fn(), x: 0, y: 0, z: 0 },
    scale: { set: vi.fn(), x: 1, y: 1, z: 1 },
    matrix: { elements: new Float32Array(16) },
    updateMatrix: vi.fn(),
  })),
}));

describe('SpectrumAnalyzer', () => {
  let analyzer: SpectrumAnalyzer;

  beforeEach(() => {
    analyzer = new SpectrumAnalyzer({
      barCount: 32,
      fftSize: 2048,
      smoothing: 0.8,
    });
  });

  describe('initialization', () => {
    it('should create analyzer with default configuration', () => {
      const defaultAnalyzer = new SpectrumAnalyzer({});
      
      expect(defaultAnalyzer).toBeDefined();
      expect(defaultAnalyzer.id).toBe('spectrum');
      expect(defaultAnalyzer.name).toBe('Spectrum Analyzer');
    });

    it('should accept custom bar count', () => {
      const custom = new SpectrumAnalyzer({ barCount: 64 });
      
      expect(custom).toBeDefined();
      expect(custom.config.barCount).toBe(64);
    });

    it('should clamp bar count to valid range (16-256)', () => {
      const tooLow = new SpectrumAnalyzer({ barCount: 8 });
      const tooHigh = new SpectrumAnalyzer({ barCount: 512 });
      
      expect(tooLow.config.barCount).toBe(16);
      expect(tooHigh.config.barCount).toBe(256);
    });

    it('should accept custom FFT size', () => {
      const custom = new SpectrumAnalyzer({ fftSize: 4096 });
      
      expect(custom.config.fftSize).toBe(4096);
    });

    it('should validate FFT size is power of 2', () => {
      expect(() => {
        new SpectrumAnalyzer({ fftSize: 1000 }); // Not power of 2
      }).toThrow('FFT size must be a power of 2');
    });

    it('should accept smoothing factor', () => {
      const custom = new SpectrumAnalyzer({ smoothing: 0.5 });
      
      expect(custom.config.smoothing).toBe(0.5);
    });

    it('should clamp smoothing to 0-1 range', () => {
      const tooLow = new SpectrumAnalyzer({ smoothing: -0.5 });
      const tooHigh = new SpectrumAnalyzer({ smoothing: 1.5 });
      
      expect(tooLow.config.smoothing).toBe(0);
      expect(tooHigh.config.smoothing).toBe(1);
    });
  });

  describe('audio processing', () => {
    it('should update bar heights from frequency data', () => {
      const audioData = createMockAudioData({
        frequencyData: new Uint8Array(1024).fill(200),
      });
      
      analyzer.update(audioData);
      
      const heights = analyzer.getBarHeights();
      expect(heights.length).toBe(32);
      expect(heights.some(h => h > 0)).toBe(true);
    });

    it('should apply logarithmic frequency distribution', () => {
      const audioData = createMockAudioData({ length: 1024 });
      
      analyzer.update(audioData);
      
      // More bars should be allocated to lower frequencies
      const bandWidths = analyzer.getBandWidths();
      expect(bandWidths[0]).toBeGreaterThan(bandWidths[bandWidths.length - 1]);
    });

    it('should apply exponential scaling for visual enhancement', () => {
      const lowData = createMockAudioData({
        frequencyData: new Uint8Array(1024).fill(64),
      });
      const highData = createMockAudioData({
        frequencyData: new Uint8Array(1024).fill(192),
      });
      
      analyzer.update(lowData);
      const lowHeights = analyzer.getBarHeights();
      
      analyzer.update(highData);
      const highHeights = analyzer.getBarHeights();
      
      // High values should be boosted more than low values
      const lowAvg = lowHeights.reduce((a, b) => a + b, 0) / lowHeights.length;
      const highAvg = highHeights.reduce((a, b) => a + b, 0) / highHeights.length;
      
      expect(highAvg / lowAvg).toBeGreaterThan(192 / 64);
    });

    it('should apply smoothing to prevent jitter', () => {
      const data1 = createMockAudioData({
        frequencyData: new Uint8Array(1024).fill(255),
      });
      const data2 = createMockAudioData({
        frequencyData: new Uint8Array(1024).fill(0),
      });
      
      analyzer.update(data1);
      const height1 = analyzer.getBarHeight(0);
      
      analyzer.update(data2);
      const height2 = analyzer.getBarHeight(0);
      
      // Should not jump directly to 0
      expect(height2).toBeGreaterThan(0);
      expect(height2).toBeLessThan(height1);
    });

    it('should handle silent audio (all zeros)', () => {
      const silentData = createSilentAudioData(1024);
      
      analyzer.update(silentData);
      
      const heights = analyzer.getBarHeights();
      expect(heights.every(h => h === 0)).toBe(true);
    });

    it('should handle full-scale audio (all 255s)', () => {
      const fullData = createFullScaleAudioData(1024);
      
      analyzer.update(fullData);
      
      const heights = analyzer.getBarHeights();
      expect(heights.every(h => h === 1.0)).toBe(true);
    });

    it('should handle different frequency distributions', () => {
      const bassData = createMockAudioData({
        frequencyData: new Uint8Array(1024).map((_, i) => 
          i < 100 ? 255 : 50
        ),
      });
      
      analyzer.update(bassData);
      
      // Low-frequency bars should be higher
      const heights = analyzer.getBarHeights();
      expect(heights[0]).toBeGreaterThan(heights[heights.length - 1]);
    });
  });

  describe('rendering', () => {
    it('should interpolate bar heights during render', () => {
      const audioData = createMockAudioData({
        frequencyData: new Uint8Array(1024).fill(255),
      });
      
      analyzer.update(audioData);
      analyzer.render(0.016); // 16ms frame
      
      // Bars should be closer to target after render
      const currentHeight = analyzer.getBarHeight(0);
      expect(currentHeight).toBeGreaterThan(0);
      expect(currentHeight).toBeLessThanOrEqual(1.0);
    });

    it('should respect animation frame rate', () => {
      const audioData = createMockAudioData({
        frequencyData: new Uint8Array(1024).fill(255),
      });
      
      analyzer.update(audioData);
      
      // Fast frame
      analyzer.render(0.008); // 8ms
      const height1 = analyzer.getBarHeight(0);
      
      // Slow frame
      analyzer.update(audioData);
      analyzer.render(0.032); // 32ms
      const height2 = analyzer.getBarHeight(0);
      
      // Both should still reach target eventually
      expect(height1).toBeGreaterThan(0.5);
      expect(height2).toBeGreaterThan(0.5);
    });

    it('should update mesh transforms during render', () => {
      const audioData = createMockAudioData({
        frequencyData: new Uint8Array(1024).fill(200),
      });
      
      analyzer.update(audioData);
      analyzer.render(0.016);
      
      // Verify that mesh update was called
      expect(analyzer.getMeshes().length).toBe(32);
    });
  });

  describe('gradient and colors', () => {
    it('should support gradient colors', () => {
      analyzer.setGradient([
        new THREE.Color(0x00ff00),
        new THREE.Color(0xffff00),
        new THREE.Color(0xff0000),
      ]);
      
      const audioData = createMockAudioData({
        frequencyData: new Uint8Array(1024).fill(255),
      });
      
      analyzer.update(audioData);
      analyzer.render(0.016);
      
      // Bars should have different colors based on height
      const colors = analyzer.getBarColors();
      expect(colors.length).toBe(32);
    });

    it('should apply theme colors', () => {
      const theme = {
        colors: {
          visualizer: {
            barStart: '#00ff00',
            barEnd: '#0000ff',
          },
        },
      };
      
      analyzer.setTheme(theme);
      
      const gradient = analyzer.getGradient();
      expect(gradient.length).toBeGreaterThan(0);
    });
  });

  describe('resource management', () => {
    it('should dispose all geometries', () => {
      const disposeSpy = vi.fn();
      analyzer.initialize();
      
      // Mock geometry dispose
      analyzer.getMeshes().forEach(mesh => {
        mesh.geometry.dispose = disposeSpy;
      });
      
      analyzer.dispose();
      
      expect(disposeSpy).toHaveBeenCalledTimes(32);
    });

    it('should dispose all materials', () => {
      const disposeSpy = vi.fn();
      analyzer.initialize();
      
      // Mock material dispose
      analyzer.getMeshes().forEach(mesh => {
        mesh.material.dispose = disposeSpy;
      });
      
      analyzer.dispose();
      
      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should remove meshes from scene', () => {
      const removeSpy = vi.fn();
      analyzer.scene = { remove: removeSpy } as any;
      
      analyzer.dispose();
      
      expect(removeSpy).toHaveBeenCalledTimes(32);
    });
  });

  describe('performance', () => {
    it('should maintain consistent update time', async () => {
      const audioData = createMockAudioData({ length: 2048 });
      
      const { duration } = await measureExecutionTime(() => {
        analyzer.update(audioData);
      });
      
      expect(duration).toBeLessThan(5); // Should update in under 5ms
    });

    it('should handle large bar counts efficiently', () => {
      const largeAnalyzer = new SpectrumAnalyzer({ barCount: 256 });
      const audioData = createMockAudioData({ length: 2048 });
      
      const start = performance.now();
      largeAnalyzer.update(audioData);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10); // Should handle 256 bars in under 10ms
    });
  });
});

// Helper function for measuring execution time
async function measureExecutionTime(fn: () => void): Promise<{ result: void; duration: number }> {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}
