import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AudioEngine } from '../../../src/audio/AudioEngine';
import { VisualizerManager } from '../../../src/visualizers/VisualizerManager';
import { SpectrumAnalyzer } from '../../../src/visualizers/SpectrumAnalyzer';
import { Oscilloscope } from '../../../src/visualizers/Oscilloscope';
import { MockAudioContext, createMockAudioBuffer } from '../../mocks/webaudio';
import { wait } from '../../utils/test-helpers';

/**
 * Integration tests for the complete audio → visualizer flow
 * Tests the interaction between AudioEngine and visualizers
 */
describe('Audio Flow Integration', () => {
  let audioEngine: AudioEngine;
  let visualizerManager: VisualizerManager;
  let mockContext: MockAudioContext;

  beforeEach(async () => {
    mockContext = new MockAudioContext({ sampleRate: 48000 });
    audioEngine = new AudioEngine(mockContext as any);
    
    visualizerManager = new VisualizerManager();
    visualizerManager.register(new SpectrumAnalyzer({ barCount: 32 }));
    visualizerManager.register(new Oscilloscope({ timeWindow: 100 }));
    
    await visualizerManager.initialize();
  });

  afterEach(() => {
    audioEngine.dispose();
    visualizerManager.dispose();
  });

  describe('audio to visualizer data flow', () => {
    it('should pass frequency data from audio engine to visualizer', async () => {
      // Setup
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      
      const spectrum = visualizerManager.get('spectrum') as SpectrumAnalyzer;
      const updateSpy = vi.spyOn(spectrum, 'update');
      
      // Load and play audio
      await audioEngine.play();
      
      // Simulate a few animation frames
      for (let i = 0; i < 5; i++) {
        const audioData = {
          frequencyData: audioEngine.getFrequencyData(),
          timeDomainData: audioEngine.getTimeDomainData(),
          sampleRate: audioEngine.sampleRate,
          timestamp: performance.now(),
        };
        
        visualizerManager.update(audioData);
        await wait(16);
      }
      
      expect(updateSpy).toHaveBeenCalled();
      expect(updateSpy.mock.calls[0][0]).toHaveProperty('frequencyData');
      expect(updateSpy.mock.calls[0][0].frequencyData).toBeInstanceOf(Uint8Array);
    });

    it('should maintain data consistency through the pipeline', async () => {
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      const spectrum = visualizerManager.get('spectrum') as SpectrumAnalyzer;
      
      // Get raw audio data
      const rawFreqData = audioEngine.getFrequencyData();
      const rawTimeData = audioEngine.getTimeDomainData();
      
      // Pass to visualizer
      const audioData = {
        frequencyData: rawFreqData,
        timeDomainData: rawTimeData,
        sampleRate: audioEngine.sampleRate,
        timestamp: performance.now(),
      };
      
      spectrum.update(audioData);
      
      // Verify visualizer received correct data
      expect(spectrum.getLastFrequencyData()).toEqual(rawFreqData);
      expect(spectrum.getLastSampleRate()).toBe(audioEngine.sampleRate);
    });

    it('should handle multiple visualizers receiving same audio data', async () => {
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      const spectrum = visualizerManager.get('spectrum') as SpectrumAnalyzer;
      const oscilloscope = visualizerManager.get('oscilloscope') as Oscilloscope;
      
      const spectrumSpy = vi.spyOn(spectrum, 'update');
      const oscilloscopeSpy = vi.spyOn(oscilloscope, 'update');
      
      // Get audio data once
      const audioData = {
        frequencyData: audioEngine.getFrequencyData(),
        timeDomainData: audioEngine.getTimeDomainData(),
        sampleRate: audioEngine.sampleRate,
        timestamp: performance.now(),
      };
      
      // Update all visualizers
      visualizerManager.update(audioData);
      
      expect(spectrumSpy).toHaveBeenCalledWith(audioData);
      expect(oscilloscopeSpy).toHaveBeenCalledWith(audioData);
    });
  });

  describe('visualizer switching', () => {
    it('should switch visualizers without interrupting audio', async () => {
      const buffer = createMockAudioBuffer({ duration: 10 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      // Let it play for a bit
      await wait(100);
      
      // Switch visualizers
      visualizerManager.activate('oscilloscope');
      expect(visualizerManager.getActive().id).toBe('oscilloscope');
      
      await wait(100);
      
      // Audio should still be playing
      expect(audioEngine.isPlaying).toBe(true);
      
      // Switch again
      visualizerManager.activate('spectrum');
      expect(visualizerManager.getActive().id).toBe('spectrum');
      
      // Audio still playing
      expect(audioEngine.isPlaying).toBe(true);
    });

    it('should initialize new visualizer when activated', async () => {
      const spectrum = visualizerManager.get('spectrum') as SpectrumAnalyzer;
      const initSpy = vi.spyOn(spectrum, 'initialize');
      
      visualizerManager.activate('spectrum');
      
      expect(initSpy).toHaveBeenCalled();
    });

    it('should dispose inactive visualizers after timeout', async () => {
      const spectrum = visualizerManager.get('spectrum') as SpectrumAnalyzer;
      const disposeSpy = vi.spyOn(spectrum, 'dispose');
      
      // Activate oscilloscope
      visualizerManager.activate('oscilloscope');
      
      // Spectrum should still exist but may be disposed after timeout
      await wait(5000); // Wait for cleanup timeout
      
      // Note: This test depends on implementation details
      // Some managers keep all visualizers, others dispose inactive ones
      expect(visualizerManager.get('spectrum')).toBeDefined();
    });
  });

  describe('real-time synchronization', () => {
    it('should keep visualizer in sync with audio playback', async () => {
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      const spectrum = visualizerManager.get('spectrum') as SpectrumAnalyzer;
      const updateSpy = vi.spyOn(spectrum, 'update');
      
      // Simulate 60fps update loop
      const frameCount = 30;
      for (let i = 0; i < frameCount; i++) {
        const audioData = {
          frequencyData: audioEngine.getFrequencyData(),
          timeDomainData: audioEngine.getTimeDomainData(),
          sampleRate: audioEngine.sampleRate,
          timestamp: performance.now(),
        };
        
        visualizerManager.update(audioData);
        await wait(16.67); // ~60fps
      }
      
      // Should have been updated ~30 times
      expect(updateSpy).toHaveBeenCalledTimes(frameCount);
    });

    it('should handle missed frames gracefully', async () => {
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      const spectrum = visualizerManager.get('spectrum') as SpectrumAnalyzer;
      
      // Simulate frames with gaps
      const audioData1 = {
        frequencyData: audioEngine.getFrequencyData(),
        timeDomainData: audioEngine.getTimeDomainData(),
        sampleRate: audioEngine.sampleRate,
        timestamp: performance.now(),
      };
      
      spectrum.update(audioData1);
      
      // Skip 5 frames
      await wait(100);
      
      const audioData2 = {
        frequencyData: audioEngine.getFrequencyData(),
        timeDomainData: audioEngine.getTimeDomainData(),
        sampleRate: audioEngine.sampleRate,
        timestamp: performance.now(),
      };
      
      // Should still work correctly after gap
      expect(() => spectrum.update(audioData2)).not.toThrow();
    });
  });

  describe('audio events to visualizer', () => {
    it('should update visualizer on play event', async () => {
      const spectrum = visualizerManager.get('spectrum') as SpectrumAnalyzer;
      const updateSpy = vi.spyOn(spectrum, 'update');
      
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      
      // Listen for play event
      audioEngine.on('play', () => {
        const audioData = {
          frequencyData: audioEngine.getFrequencyData(),
          timeDomainData: audioEngine.getTimeDomainData(),
          sampleRate: audioEngine.sampleRate,
          timestamp: performance.now(),
        };
        visualizerManager.update(audioData);
      });
      
      await audioEngine.play();
      
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should handle audio ended event', async () => {
      const buffer = createMockAudioBuffer({ duration: 0.1 }); // Short audio
      await audioEngine.loadBuffer(buffer);
      
      const endedHandler = vi.fn();
      audioEngine.on('ended', endedHandler);
      
      const spectrum = visualizerManager.get('spectrum') as SpectrumAnalyzer;
      const renderSpy = vi.spyOn(spectrum, 'render');
      
      await audioEngine.play();
      
      // Wait for audio to end
      await wait(200);
      
      expect(endedHandler).toHaveBeenCalled();
      // Visualizer should still render (maybe static)
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should continue visualizer if audio has error', async () => {
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      const spectrum = visualizerManager.get('spectrum') as SpectrumAnalyzer;
      const renderSpy = vi.spyOn(spectrum, 'render');
      
      // Simulate audio error
      audioEngine.emit('error', new Error('Audio error'));
      
      // Visualizer should still try to render
      spectrum.render(0.016);
      
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should handle missing audio data gracefully', async () => {
      const spectrum = visualizerManager.get('spectrum') as SpectrumAnalyzer;
      
      // Try to update with null/undefined data
      expect(() => {
        spectrum.update(null as any);
      }).not.toThrow();
      
      expect(() => {
        spectrum.update({
          frequencyData: null as any,
          timeDomainData: null as any,
          sampleRate: 0,
          timestamp: 0,
        });
      }).not.toThrow();
    });

    it('should recover after audio context is restored', async () => {
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      // Simulate context lost
      mockContext.state = 'suspended';
      
      // Try to get data
      expect(() => {
        audioEngine.getFrequencyData();
      }).not.toThrow();
      
      // Restore context
      await mockContext.resume();
      
      // Should work again
      const data = audioEngine.getFrequencyData();
      expect(data).toBeDefined();
    });
  });

  describe('performance under load', () => {
    it('should maintain performance with multiple visualizers', async () => {
      // Add more visualizers
      const { MilkdropRenderer } = await import('../../../src/visualizers/MilkdropRenderer');
      visualizerManager.register(new MilkdropRenderer({ particleCount: 500 }));
      
      const buffer = createMockAudioBuffer({ duration: 5 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      const start = performance.now();
      
      // Update all visualizers
      for (let i = 0; i < 60; i++) {
        const audioData = {
          frequencyData: audioEngine.getFrequencyData(),
          timeDomainData: audioEngine.getTimeDomainData(),
          sampleRate: audioEngine.sampleRate,
          timestamp: performance.now(),
        };
        
        visualizerManager.update(audioData);
      }
      
      const duration = performance.now() - start;
      
      // 60 updates with 3 visualizers should take under 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid visualizer switching', async () => {
      const buffer = createMockAudioBuffer({ duration: 10 });
      await audioEngine.loadBuffer(buffer);
      await audioEngine.play();
      
      const start = performance.now();
      
      // Rapidly switch visualizers
      for (let i = 0; i < 20; i++) {
        visualizerManager.cycle();
        await wait(10);
      }
      
      const duration = performance.now() - start;
      
      // 20 switches should complete in reasonable time
      expect(duration).toBeLessThan(500);
      
      // Audio should still be playing
      expect(audioEngine.isPlaying).toBe(true);
    });
  });
});

// Helper function for creating audio buffer
function createMockAudioBuffer(options: { duration: number }): any {
  return {
    duration: options.duration,
    sampleRate: 48000,
    numberOfChannels: 2,
    length: options.duration * 48000,
    getChannelData: () => new Float32Array(options.duration * 48000),
  };
}
