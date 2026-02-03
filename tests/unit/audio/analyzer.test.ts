import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AudioEngine } from '../../../src/audio/AudioEngine';
import { MockAudioContext, createMockAudioBuffer } from '../../mocks/webaudio';

describe('AudioEngine', () => {
  let audioEngine: AudioEngine;
  let mockContext: MockAudioContext;

  beforeEach(() => {
    mockContext = new MockAudioContext({ sampleRate: 48000 });
    audioEngine = new AudioEngine(mockContext as any);
  });

  afterEach(() => {
    audioEngine.dispose();
  });

  describe('initialization', () => {
    it('should initialize with provided audio context', () => {
      expect(audioEngine).toBeDefined();
      expect(audioEngine.context).toBe(mockContext);
    });

    it('should create audio context if not provided', () => {
      const engine = new AudioEngine();
      expect(engine.context).toBeDefined();
    });

    it('should be in suspended state initially', () => {
      expect(audioEngine.isPlaying).toBe(false);
      expect(audioEngine.state).toBe('suspended');
    });

    it('should create analyser node', () => {
      expect(audioEngine.analyser).toBeDefined();
    });

    it('should create gain node', () => {
      expect(audioEngine.gainNode).toBeDefined();
    });

    it('should set default FFT size', () => {
      expect(audioEngine.fftSize).toBe(2048);
    });

    it('should set default volume', () => {
      expect(audioEngine.volume).toBe(1.0);
    });
  });

  describe('playback control', () => {
    it('should play audio', async () => {
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      
      await audioEngine.play();
      
      expect(audioEngine.isPlaying).toBe(true);
      expect(audioEngine.state).toBe('running');
    });

    it('should pause audio', async () => {
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      await audioEngine.pause();
      
      expect(audioEngine.isPlaying).toBe(false);
      expect(audioEngine.state).toBe('suspended');
    });

    it('should stop audio', async () => {
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      await audioEngine.stop();
      
      expect(audioEngine.isPlaying).toBe(false);
      expect(audioEngine.currentTime).toBe(0);
    });

    it('should seek to position', async () => {
      const buffer = createMockAudioBuffer({ duration: 10 });
      await audioEngine.loadBuffer(buffer);
      
      audioEngine.seek(5.0);
      
      expect(audioEngine.currentTime).toBeCloseTo(5.0, 1);
    });

    it('should clamp seek to valid range', async () => {
      const buffer = createMockAudioBuffer({ duration: 10 });
      await audioEngine.loadBuffer(buffer);
      
      audioEngine.seek(-5);
      expect(audioEngine.currentTime).toBe(0);
      
      audioEngine.seek(20);
      expect(audioEngine.currentTime).toBeCloseTo(10, 1);
    });
  });

  describe('audio analysis', () => {
    beforeEach(async () => {
      const buffer = createMockAudioBuffer({ duration: 10 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
    });

    it('should get frequency data', () => {
      const data = audioEngine.getFrequencyData();
      
      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBe(1024); // fftSize / 2
    });

    it('should get time domain data', () => {
      const data = audioEngine.getTimeDomainData();
      
      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBe(2048); // fftSize
    });

    it('should get float frequency data', () => {
      const data = audioEngine.getFloatFrequencyData();
      
      expect(data).toBeInstanceOf(Float32Array);
      expect(data.length).toBe(1024);
    });

    it('should get float time domain data', () => {
      const data = audioEngine.getFloatTimeDomainData();
      
      expect(data).toBeInstanceOf(Float32Array);
      expect(data.length).toBe(2048);
    });

    it('should reuse data buffers for performance', () => {
      const data1 = audioEngine.getFrequencyData();
      const data2 = audioEngine.getFrequencyData();
      
      // Should be same buffer, updated with new data
      expect(data1).toBe(data2);
    });
  });

  describe('volume control', () => {
    it('should set volume', () => {
      audioEngine.setVolume(0.5);
      
      expect(audioEngine.volume).toBe(0.5);
    });

    it('should clamp volume to 0-1 range', () => {
      audioEngine.setVolume(-0.5);
      expect(audioEngine.volume).toBe(0);
      
      audioEngine.setVolume(1.5);
      expect(audioEngine.volume).toBe(1);
    });

    it('should mute audio', () => {
      audioEngine.setVolume(0.5);
      audioEngine.mute();
      
      expect(audioEngine.isMuted).toBe(true);
      expect(audioEngine.volume).toBe(0);
    });

    it('should unmute audio', () => {
      audioEngine.setVolume(0.5);
      audioEngine.mute();
      audioEngine.unmute();
      
      expect(audioEngine.isMuted).toBe(false);
      expect(audioEngine.volume).toBe(0.5);
    });

    it('should toggle mute', () => {
      audioEngine.setVolume(0.5);
      
      audioEngine.toggleMute();
      expect(audioEngine.isMuted).toBe(true);
      
      audioEngine.toggleMute();
      expect(audioEngine.isMuted).toBe(false);
    });
  });

  describe('FFT configuration', () => {
    it('should set FFT size', () => {
      audioEngine.setFFTSize(4096);
      
      expect(audioEngine.fftSize).toBe(4096);
    });

    it('should validate FFT size is power of 2', () => {
      expect(() => {
        audioEngine.setFFTSize(1000);
      }).toThrow('FFT size must be a power of 2');
    });

    it('should clamp FFT size to valid range', () => {
      audioEngine.setFFTSize(64);
      expect(audioEngine.fftSize).toBe(128); // Min
      
      audioEngine.setFFTSize(65536);
      expect(audioEngine.fftSize).toBe(32768); // Max
    });

    it('should set smoothing time constant', () => {
      audioEngine.setSmoothing(0.5);
      
      expect(audioEngine.smoothing).toBe(0.5);
    });

    it('should clamp smoothing to 0-1 range', () => {
      audioEngine.setSmoothing(-0.5);
      expect(audioEngine.smoothing).toBe(0);
      
      audioEngine.setSmoothing(1.5);
      expect(audioEngine.smoothing).toBe(1);
    });
  });

  describe('file loading', () => {
    it('should load audio file', async () => {
      const file = new File([''], 'test.mp3', { type: 'audio/mpeg' });
      
      const loaded = await audioEngine.loadFile(file);
      
      expect(loaded).toBe(true);
      expect(audioEngine.duration).toBeGreaterThan(0);
    });

    it('should reject invalid file types', async () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      
      await expect(audioEngine.loadFile(file)).rejects.toThrow('Invalid file type');
    });

    it('should reject oversized files', async () => {
      // Create a large fake file (over 50MB limit)
      const largeContent = new Array(51 * 1024 * 1024).fill('x').join('');
      const file = new File([largeContent], 'large.mp3', { type: 'audio/mpeg' });
      
      await expect(audioEngine.loadFile(file)).rejects.toThrow('File too large');
    });

    it('should load from URL', async () => {
      const url = 'https://example.com/audio.mp3';
      
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1000)),
      });
      
      await audioEngine.loadFromURL(url);
      
      expect(global.fetch).toHaveBeenCalledWith(url);
    });
  });

  describe('synthetic/demo mode', () => {
    it('should create synthetic audio source', () => {
      audioEngine.createSyntheticSource();
      
      expect(audioEngine.isSynthetic).toBe(true);
      expect(audioEngine.source).toBeDefined();
    });

    it('should play synthetic audio', async () => {
      audioEngine.createSyntheticSource();
      await audioEngine.play();
      
      expect(audioEngine.isPlaying).toBe(true);
    });

    it('should generate audio data in demo mode', async () => {
      audioEngine.createSyntheticSource();
      await audioEngine.play();
      
      const data = audioEngine.getFrequencyData();
      
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
    });

    it('should support multiple oscillator types', () => {
      audioEngine.createSyntheticSource({ type: 'sine', frequency: 440 });
      expect(audioEngine.getOscillatorType()).toBe('sine');
      
      audioEngine.createSyntheticSource({ type: 'square', frequency: 220 });
      expect(audioEngine.getOscillatorType()).toBe('square');
      
      audioEngine.createSyntheticSource({ type: 'sawtooth', frequency: 110 });
      expect(audioEngine.getOscillatorType()).toBe('sawtooth');
      
      audioEngine.createSyntheticSource({ type: 'triangle', frequency: 880 });
      expect(audioEngine.getOscillatorType()).toBe('triangle');
    });
  });

  describe('event handling', () => {
    it('should emit play event', async () => {
      const playHandler = vi.fn();
      audioEngine.on('play', playHandler);
      
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      expect(playHandler).toHaveBeenCalled();
    });

    it('should emit pause event', async () => {
      const pauseHandler = vi.fn();
      audioEngine.on('pause', pauseHandler);
      
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      await audioEngine.pause();
      
      expect(pauseHandler).toHaveBeenCalled();
    });

    it('should emit ended event', async () => {
      const endedHandler = vi.fn();
      audioEngine.on('ended', endedHandler);
      
      const buffer = createMockAudioBuffer({ duration: 0.1 }); // Very short
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      // Wait for audio to end
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(endedHandler).toHaveBeenCalled();
    });

    it('should emit timeupdate event', async () => {
      const timeHandler = vi.fn();
      audioEngine.on('timeupdate', timeHandler);
      
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      // Should emit time updates periodically
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(timeHandler).toHaveBeenCalled();
    });

    it('should remove event listeners', async () => {
      const handler = vi.fn();
      audioEngine.on('play', handler);
      audioEngine.off('play', handler);
      
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle context creation failure', () => {
      // Mock AudioContext to throw
      const originalAudioContext = global.AudioContext;
      global.AudioContext = vi.fn().mockImplementation(() => {
        throw new Error('AudioContext not supported');
      });
      
      expect(() => {
        new AudioEngine();
      }).toThrow('AudioContext not supported');
      
      // Restore
      global.AudioContext = originalAudioContext;
    });

    it('should handle decode error', async () => {
      // Mock decode to fail
      mockContext.decodeAudioData = vi.fn().mockRejectedValue(new Error('Decode failed'));
      
      const file = new File([''], 'corrupt.mp3', { type: 'audio/mpeg' });
      
      await expect(audioEngine.loadFile(file)).rejects.toThrow('Decode failed');
    });

    it('should handle resume error', async () => {
      mockContext.resume = vi.fn().mockRejectedValue(new Error('Resume failed'));
      
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      
      await expect(audioEngine.play()).rejects.toThrow('Resume failed');
    });
  });

  describe('resource management', () => {
    it('should dispose all resources', async () => {
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      audioEngine.dispose();
      
      expect(audioEngine.isPlaying).toBe(false);
      expect(audioEngine.source).toBeNull();
    });

    it('should close audio context on dispose', async () => {
      const closeSpy = vi.spyOn(mockContext, 'close');
      
      audioEngine.dispose();
      
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should disconnect nodes on dispose', async () => {
      const disconnectSpy = vi.spyOn(audioEngine.gainNode, 'disconnect');
      
      audioEngine.dispose();
      
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('performance', () => {
    it('should update audio data efficiently', async () => {
      const buffer = createMockAudioBuffer({ duration: 10 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        audioEngine.getFrequencyData();
        audioEngine.getTimeDomainData();
      }
      
      const duration = performance.now() - start;
      
      // Should handle 100 updates in under 50ms
      expect(duration).toBeLessThan(50);
    });
  });
});

// Helper function
function createMockAudioBuffer(options: { duration: number }): any {
  return {
    duration: options.duration,
    sampleRate: 48000,
    numberOfChannels: 2,
    length: options.duration * 48000,
    getChannelData: vi.fn(() => new Float32Array(options.duration * 48000)),
  };
}
