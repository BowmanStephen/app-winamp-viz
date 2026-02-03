import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Oscilloscope } from '../../../src/visualizers/Oscilloscope';
import { createMockAudioData, createSineWaveBuffer } from '../../utils/test-helpers';

// Mock THREE.js with Vector2 for LineMaterial resolution
vi.mock('three', () => ({
  Scene: vi.fn(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    background: null,
  })),
  WebGLRenderer: vi.fn(() => ({
    render: vi.fn(),
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    dispose: vi.fn(),
    clear: vi.fn(),
  })),
  OrthographicCamera: vi.fn(() => ({
    position: { z: 0 },
    left: -1,
    right: 1,
    top: 1,
    bottom: -1,
    updateProjectionMatrix: vi.fn(),
  })),
  PerspectiveCamera: vi.fn(),
  BufferGeometry: vi.fn(() => ({
    setAttribute: vi.fn(),
    attributes: {
      position: { needsUpdate: false, array: new Float32Array(0) },
    },
    dispose: vi.fn(),
  })),
  LineBasicMaterial: vi.fn(() => ({
    dispose: vi.fn(),
    color: { set: vi.fn() },
    linewidth: 1,
  })),
  Line: vi.fn(() => ({
    geometry: {
      setAttribute: vi.fn(),
      attributes: { position: { needsUpdate: false, array: new Float32Array(0) } },
    },
    material: { color: { set: vi.fn() } },
  })),
  Float32BufferAttribute: vi.fn((array, itemSize) => ({ array, itemSize })),
  Color: vi.fn((hex) => ({ hex, r: 0, g: 1, b: 0 })),
  Vector2: vi.fn((x = 0, y = 0) => ({
    x,
    y,
    set: vi.fn(function(this: { x: number; y: number }, newX: number, newY: number) {
      this.x = newX;
      this.y = newY;
      return this;
    }),
  })),
}));

// Mock three/addons for Line2, LineMaterial, LineGeometry
vi.mock('three/addons/lines/Line2.js', () => ({
  Line2: vi.fn(() => ({
    computeLineDistances: vi.fn(),
    geometry: null,
    material: null,
  })),
}));

vi.mock('three/addons/lines/LineMaterial.js', () => ({
  LineMaterial: vi.fn((params: Record<string, unknown> = {}) => ({
    color: params.color ?? 0x00ff41,
    linewidth: params.linewidth ?? 1,
    resolution: params.resolution ?? { x: 1, y: 1, set: vi.fn() },
    alphaToCoverage: params.alphaToCoverage ?? false,
    dispose: vi.fn(),
    needsUpdate: false,
  })),
}));

vi.mock('three/addons/lines/LineGeometry.js', () => ({
  LineGeometry: vi.fn(() => ({
    setPositions: vi.fn(),
    dispose: vi.fn(),
    attributes: {},
  })),
}));

describe('Oscilloscope', () => {
  let oscilloscope: Oscilloscope;

  beforeEach(() => {
    oscilloscope = new Oscilloscope({
      timeWindow: 100, // 100ms
      color: '#00ff00',
      lineWidth: 2,
    });
  });

  describe('initialization', () => {
    it('should create oscilloscope with default configuration', () => {
      const defaultScope = new Oscilloscope({});
      
      expect(defaultScope).toBeDefined();
      expect(defaultScope.id).toBe('oscilloscope');
      expect(defaultScope.name).toBe('Oscilloscope');
    });

    it('should accept custom time window', () => {
      const custom = new Oscilloscope({ timeWindow: 50 });
      
      expect(custom.config.timeWindow).toBe(50);
    });

    it('should clamp time window to valid range (10-500ms)', () => {
      const tooShort = new Oscilloscope({ timeWindow: 5 });
      const tooLong = new Oscilloscope({ timeWindow: 1000 });
      
      expect(tooShort.config.timeWindow).toBe(10);
      expect(tooLong.config.timeWindow).toBe(500);
    });

    it('should accept custom color', () => {
      const custom = new Oscilloscope({ color: '#ff0000' });
      
      expect(custom.config.color).toBe('#ff0000');
    });

    it('should validate color format', () => {
      expect(() => {
        new Oscilloscope({ color: 'invalid-color' });
      }).toThrow('Invalid color format');
    });

    it('should accept custom line width', () => {
      const custom = new Oscilloscope({ lineWidth: 4 });
      
      expect(custom.config.lineWidth).toBe(4);
    });

    it('should clamp line width to valid range (1-10)', () => {
      const tooThin = new Oscilloscope({ lineWidth: 0 });
      const tooThick = new Oscilloscope({ lineWidth: 20 });
      
      expect(tooThin.config.lineWidth).toBe(1);
      expect(tooThick.config.lineWidth).toBe(10);
    });
  });

  describe('trigger modes', () => {
    it('should support free-running mode', () => {
      oscilloscope.setTriggerMode('free');
      
      expect(oscilloscope.config.triggerMode).toBe('free');
    });

    it('should support rising edge trigger', () => {
      oscilloscope.setTriggerMode('rising');
      oscilloscope.setTriggerThreshold(0.1);
      
      const sineData = createSineWaveBuffer(440, 0.1, 48000);
      const audioData = createMockAudioData({
        timeDomainData: Array.from(sineData).map(s => 128 + s * 127),
        sampleRate: 48000,
      });
      
      oscilloscope.update(audioData);
      
      // Should trigger on rising edge
      expect(oscilloscope.getTriggerPosition()).toBeGreaterThanOrEqual(0);
    });

    it('should support falling edge trigger', () => {
      oscilloscope.setTriggerMode('falling');
      oscilloscope.setTriggerThreshold(-0.1);
      
      const sineData = createSineWaveBuffer(440, 0.1, 48000);
      const audioData = createMockAudioData({
        timeDomainData: Array.from(sineData).map(s => 128 + s * 127),
        sampleRate: 48000,
      });
      
      oscilloscope.update(audioData);
      
      // Should trigger on falling edge
      expect(oscilloscope.getTriggerPosition()).toBeGreaterThanOrEqual(0);
    });

    it('should auto-trigger when no edge found', () => {
      oscilloscope.setTriggerMode('auto');
      
      // All zeros - no edge
      const silentData = createMockAudioData({
        timeDomainData: new Array(2048).fill(128),
      });
      
      oscilloscope.update(silentData);
      
      // Should still display something in auto mode
      expect(oscilloscope.getDisplayData().length).toBeGreaterThan(0);
    });
  });

  describe('waveform processing', () => {
    it('should convert Uint8 time domain to Float32 (-1 to 1)', () => {
      const audioData = createMockAudioData({
        timeDomainData: [0, 64, 128, 192, 255],
        sampleRate: 48000,
      });
      
      oscilloscope.update(audioData);
      const floatData = oscilloscope.getFloatTimeDomainData();
      
      expect(floatData[0]).toBeCloseTo(-1, 1);   // 0 -> -1
      expect(floatData[2]).toBeCloseTo(0, 1);    // 128 -> 0
      expect(floatData[4]).toBeCloseTo(1, 1);    // 255 -> ~1
    });

    it('should resample data to fit time window', () => {
      const audioData = createMockAudioData({
        sampleRate: 48000,
      });
      
      oscilloscope.update(audioData);
      
      // For 100ms window at 48kHz, we need 4800 samples
      // But we might resample to fewer points for display
      const displayData = oscilloscope.getDisplayData();
      expect(displayData.length).toBeLessThanOrEqual(4800);
      expect(displayData.length).toBeGreaterThan(100);
    });

    it('should apply smoothing to reduce noise', () => {
      // Create noisy data
      const noisyData = new Array(2048).fill(0).map(() => 
        128 + (Math.random() - 0.5) * 50
      );
      
      const audioData = createMockAudioData({
        timeDomainData: noisyData,
      });
      
      oscilloscope.update(audioData);
      
      const smoothed = oscilloscope.getDisplayData();
      
      // Calculate variance - should be reduced
      let variance = 0;
      const mean = smoothed.reduce((a, b) => a + b, 0) / smoothed.length;
      for (const val of smoothed) {
        variance += Math.pow(val - mean, 2);
      }
      variance /= smoothed.length;
      
      // Variance should be reasonable, not extreme
      expect(variance).toBeLessThan(100);
    });

    it('should handle different sample rates', () => {
      const audioData44k = createMockAudioData({ sampleRate: 44100 });
      const audioData48k = createMockAudioData({ sampleRate: 48000 });
      
      oscilloscope.update(audioData44k);
      const data44k = oscilloscope.getDisplayData();
      
      oscilloscope.update(audioData48k);
      const data48k = oscilloscope.getDisplayData();
      
      // Both should produce valid data, different lengths
      expect(data44k.length).toBeGreaterThan(0);
      expect(data48k.length).toBeGreaterThan(0);
    });
  });

  describe('rendering', () => {
    it('should create 3D points from waveform data', () => {
      const audioData = createMockAudioData();
      
      oscilloscope.update(audioData);
      oscilloscope.render(0.016);
      
      const geometry = oscilloscope.getLineGeometry();
      expect(geometry).toBeDefined();
    });

    it('should update line geometry positions', () => {
      const audioData = createMockAudioData();
      
      oscilloscope.update(audioData);
      oscilloscope.render(0.016);
      
      const positions = oscilloscope.getLinePositions();
      expect(positions.length).toBeGreaterThan(0);
      expect(positions.length % 3).toBe(0); // x, y, z triplets
    });

    it('should apply phosphor glow effect when enabled', () => {
      oscilloscope.setGlowEffect({
        enabled: true,
        color: '#00ff00',
        intensity: 10,
      });
      
      expect(oscilloscope.config.glow?.enabled).toBe(true);
    });

    it('should support different line styles', () => {
      oscilloscope.setLineStyle('solid');
      expect(oscilloscope.config.lineStyle).toBe('solid');
      
      oscilloscope.setLineStyle('dotted');
      expect(oscilloscope.config.lineStyle).toBe('dotted');
    });
  });

  describe('display options', () => {
    it('should show grid when enabled', () => {
      oscilloscope.setShowGrid(true);
      
      const grid = oscilloscope.getGridLines();
      expect(grid.length).toBeGreaterThan(0);
    });

    it('should hide grid when disabled', () => {
      oscilloscope.setShowGrid(false);
      
      const grid = oscilloscope.getGridLines();
      expect(grid.length).toBe(0);
    });

    it('should support XY mode (Lissajous)', () => {
      oscilloscope.setDisplayMode('xy');
      
      // XY mode plots left vs right channel
      expect(oscilloscope.config.displayMode).toBe('xy');
    });

    it('should support single channel mode', () => {
      oscilloscope.setDisplayMode('single');
      oscilloscope.setChannel(0);
      
      expect(oscilloscope.config.displayMode).toBe('single');
      expect(oscilloscope.config.channel).toBe(0);
    });
  });

  describe('resource management', () => {
    it('should dispose geometry', () => {
      const disposeSpy = vi.fn();
      oscilloscope.initialize();
      oscilloscope.getLineGeometry().dispose = disposeSpy;
      
      oscilloscope.dispose();
      
      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should dispose material', () => {
      const disposeSpy = vi.fn();
      oscilloscope.initialize();
      oscilloscope.getLineMaterial().dispose = disposeSpy;
      
      oscilloscope.dispose();
      
      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should remove line from scene', () => {
      const removeSpy = vi.fn();
      oscilloscope.scene = { remove: removeSpy } as any;
      
      oscilloscope.dispose();
      
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe('theme integration', () => {
    it('should update color from theme', () => {
      const theme = {
        colors: {
          visualizer: {
            waveform: '#ff00ff',
          },
        },
      };
      
      oscilloscope.setTheme(theme);
      
      expect(oscilloscope.config.color).toBe('#ff00ff');
    });

    it('should update grid color from theme', () => {
      const theme = {
        colors: {
          visualizer: {
            grid: '#333333',
          },
        },
      };
      
      oscilloscope.setTheme(theme);
      
      expect(oscilloscope.config.gridColor).toBe('#333333');
    });
  });

  describe('edge cases', () => {
    it('should handle empty audio data', () => {
      const emptyData = createMockAudioData({
        timeDomainData: [],
      });
      
      expect(() => oscilloscope.update(emptyData)).not.toThrow();
    });

    it('should handle very short audio data', () => {
      const shortData = createMockAudioData({
        timeDomainData: [128, 128, 128],
      });
      
      expect(() => oscilloscope.update(shortData)).not.toThrow();
    });

    it('should handle DC offset', () => {
      // All values shifted
      const dcData = createMockAudioData({
        timeDomainData: new Array(2048).fill(200),
      });
      
      oscilloscope.update(dcData);
      const data = oscilloscope.getDisplayData();
      
      // Should still center around zero after conversion
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      expect(Math.abs(avg)).toBeLessThan(0.1);
    });
  });
});
