/**
 * AudioEngine Singleton
 *
 * Web Audio API wrapper providing a singleton interface for audio analysis.
 * Handles AudioContext lifecycle, analyzer node creation, and demo mode with oscillators.
 *
 * @module AudioEngine
 */

import type { AudioData } from "../types";

/**
 * Default configuration for the audio engine
 */
const DEFAULT_CONFIG = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
} as const;

/**
 * AudioEngine singleton class
 *
 * Manages Web Audio API resources and provides audio analysis capabilities.
 * Implements the singleton pattern to ensure only one audio context exists.
 *
 * @example
 * ```typescript
 * const engine = AudioEngine.getInstance();
 * await engine.init(audioElement);
 *
 * const frequencyData = engine.getFrequencyData();
 * const timeDomainData = engine.getTimeDomainData();
 * ```
 */
export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private demoOscillators: OscillatorNode[] = [];
  private demoGainNodes: GainNode[] = [];
  private isDemoMode: boolean = false;

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {}

  /**
   * Get the singleton instance of AudioEngine
   * @returns AudioEngine instance
   */
  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initialize the audio engine with an audio element
   * @param audioElement - HTMLAudioElement to connect to the audio context
   * @returns Promise that resolves when initialization is complete
   * @throws Error if Web Audio API is not supported
   */
  public async init(audioElement: HTMLAudioElement): Promise<void> {
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      throw new Error("Web Audio API is not supported in this browser");
    }

    try {
      // Create or resume audio context
      if (!this.audioContext) {
        this.audioContext = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }

      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      // Stop demo mode if active
      if (this.isDemoMode) {
        this.stopDemoMode();
      }

      // Disconnect existing source
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }

      // Create new analyzer
      this.analyser = this.createAnalyser();

      // Connect audio element to analyzer
      this.sourceNode =
        this.audioContext.createMediaElementSource(audioElement);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      console.log("[AudioEngine] Initialized successfully");
    } catch (error) {
      console.error("[AudioEngine] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Create and configure an AnalyserNode
   * @returns Configured AnalyserNode
   */
  public createAnalyser(): AnalyserNode {
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized. Call init() first.");
    }

    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = DEFAULT_CONFIG.fftSize;
    analyser.smoothingTimeConstant = DEFAULT_CONFIG.smoothingTimeConstant;
    analyser.minDecibels = DEFAULT_CONFIG.minDecibels;
    analyser.maxDecibels = DEFAULT_CONFIG.maxDecibels;

    return analyser;
  }

  /**
   * Get current frequency data from the analyzer
   * @returns Uint8Array of frequency values (0-255)
   */
  public getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(DEFAULT_CONFIG.fftSize / 2);
    }

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Get current time domain (waveform) data from the analyzer
   * @returns Uint8Array of time domain values (0-255, centered at 128)
   */
  public getTimeDomainData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(DEFAULT_CONFIG.fftSize);
    }

    const dataArray = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  /**
   * Get frequency data as Float32Array in dB
   * @returns Float32Array of frequency values in decibels
   */
  public getFloatFrequencyData(): Float32Array {
    if (!this.analyser) {
      return new Float32Array(DEFAULT_CONFIG.fftSize / 2);
    }

    const dataArray = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Get time domain data as Float32Array (-1 to 1)
   * @returns Float32Array of time domain values normalized to -1..1
   */
  public getFloatTimeDomainData(): Float32Array {
    if (!this.analyser) {
      return new Float32Array(DEFAULT_CONFIG.fftSize);
    }

    const dataArray = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(dataArray);
    return dataArray;
  }

  /**
   * Get comprehensive audio data package for visualizers
   * @returns AudioData object with all analysis data
   */
  public getAudioData(): AudioData {
    const frequencyData = this.getFrequencyData();
    const timeDomainData = this.getTimeDomainData();
    const floatFrequencyData = this.getFloatFrequencyData();
    const floatTimeDomainData = this.getFloatTimeDomainData();

    // Calculate peak amplitude
    let peak = 0;
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const rawValue = frequencyData[i];
      if (rawValue === undefined) continue;
      const value = rawValue / 255;
      peak = Math.max(peak, value);
      sum += value * value;
    }
    const rms = Math.sqrt(sum / frequencyData.length);

    // Calculate band energies (simplified)
    const bands = this.calculateBands(frequencyData);

    return {
      frequencyData,
      timeDomainData,
      floatFrequencyData,
      floatTimeDomainData,
      sampleRate: this.audioContext?.sampleRate || 44100,
      fftSize: this.analyser?.fftSize || DEFAULT_CONFIG.fftSize,
      frequencyBinCount:
        this.analyser?.frequencyBinCount || DEFAULT_CONFIG.fftSize / 2,
      peak,
      rms,
      bands,
      timestamp: performance.now(),
    };
  }

  /**
   * Calculate per-band energy levels
   * @param frequencyData - Raw frequency data
   * @returns Record of band energies
   */
  private calculateBands(frequencyData: Uint8Array): Record<string, number> {
    const binCount = frequencyData.length;
    const nyquist = (this.audioContext?.sampleRate || 44100) / 2;

    // Define frequency ranges for each band
    const bandRanges: Record<string, [number, number]> = {
      sub: [20, 60],
      bass: [60, 250],
      lowMid: [250, 500],
      mid: [500, 2000],
      highMid: [2000, 4000],
      treble: [4000, 8000],
      air: [8000, 20000],
    };

    const bands: Record<string, number> = {};

    for (const [band, [minFreq, maxFreq]] of Object.entries(bandRanges)) {
      const minIndex = Math.floor((minFreq / nyquist) * binCount);
      const maxIndex = Math.floor((maxFreq / nyquist) * binCount);

      let sum = 0;
      let count = 0;

      for (
        let i = Math.max(0, minIndex);
        i < Math.min(binCount, maxIndex);
        i++
      ) {
        const value = frequencyData[i];
        if (value !== undefined) {
          sum += value / 255;
          count++;
        }
      }

      bands[band] = count > 0 ? sum / count : 0;
    }

    return bands;
  }

  /**
   * Start demo mode with synthesized audio (oscillators)
   * Useful for testing visualizers without actual audio
   */
  public startDemoMode(): void {
    if (!this.audioContext) {
      this.audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }

    if (this.isDemoMode) return;

    // Clean up any existing demo
    this.stopDemoMode();

    // Create multiple oscillators for richer demo
    const frequencies = [110, 220, 440, 880]; // A2, A3, A4, A5

    for (const freq of frequencies) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type =
        freq < 200 ? "sine" : freq < 500 ? "triangle" : "sawtooth";
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);

      // Lower gain for higher frequencies
      const volume = freq < 200 ? 0.3 : freq < 500 ? 0.2 : 0.1;
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();

      this.demoOscillators.push(oscillator);
      this.demoGainNodes.push(gainNode);
    }

    // Create analyzer if needed
    if (!this.analyser) {
      this.analyser = this.createAnalyser();
      // Connect last gain node to analyser
      const lastGainNode = this.demoGainNodes[this.demoGainNodes.length - 1];
      if (lastGainNode !== undefined && this.analyser) {
        lastGainNode.connect(this.analyser);
      }
    }

    this.isDemoMode = true;
    console.log("[AudioEngine] Demo mode started");
  }

  /**
   * Stop demo mode and clean up oscillators
   */
  public stopDemoMode(): void {
    for (const oscillator of this.demoOscillators) {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch (e) {
        // Oscillator might already be stopped
      }
    }

    for (const gainNode of this.demoGainNodes) {
      gainNode.disconnect();
    }

    this.demoOscillators = [];
    this.demoGainNodes = [];
    this.isDemoMode = false;

    console.log("[AudioEngine] Demo mode stopped");
  }

  /**
   * Resume the AudioContext (required after browser autoplay policies)
   * @returns Promise that resolves when context is resumed
   */
  public async resumeContext(): Promise<void> {
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized");
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
      console.log("[AudioEngine] AudioContext resumed");
    }
  }

  /**
   * Suspend the AudioContext
   * @returns Promise that resolves when context is suspended
   */
  public async suspendContext(): Promise<void> {
    if (!this.audioContext) return;

    if (this.audioContext.state === "running") {
      await this.audioContext.suspend();
      console.log("[AudioEngine] AudioContext suspended");
    }
  }

  /**
   * Get the current AudioContext
   * @returns AudioContext or null if not initialized
   */
  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get the current AnalyserNode
   * @returns AnalyserNode or null if not initialized
   */
  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * Get the current sample rate
   * @returns Sample rate in Hz, or 0 if not initialized
   */
  public getSampleRate(): number {
    return this.audioContext?.sampleRate || 0;
  }

  /**
   * Check if currently in demo mode
   * @returns True if demo mode is active
   */
  public isInDemoMode(): boolean {
    return this.isDemoMode;
  }

  /**
   * Check if AudioContext is running
   * @returns True if context is in 'running' state
   */
  public isRunning(): boolean {
    return this.audioContext?.state === "running";
  }

  /**
   * Dispose of all resources and clean up
   * This destroys the singleton instance
   */
  public dispose(): void {
    this.stopDemoMode();

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(console.error);
      this.audioContext = null;
    }

    AudioEngine.instance = null;
    console.log("[AudioEngine] Disposed");
  }
}

/**
 * Export singleton getter for convenience
 */
export const getAudioEngine = AudioEngine.getInstance;

export default AudioEngine;
