// Web Audio API Mock Utilities
// Provides mock implementations for Web Audio API objects used in tests

import { vi } from 'vitest';

// ============================================================================
// Audio Data Types
// ============================================================================

export interface MockAudioData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  sampleRate: number;
  timestamp: number;
}

export interface AudioBufferOptions {
  numberOfChannels?: number;
  length?: number;
  sampleRate?: number;
}

// ============================================================================
// Mock AudioBuffer
// ============================================================================

export class MockAudioBuffer {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  duration: number;
  private channelData: Float32Array[];

  constructor(options: AudioBufferOptions = {}) {
    this.numberOfChannels = options.numberOfChannels ?? 2;
    this.length = options.length ?? 48000;
    this.sampleRate = options.sampleRate ?? 48000;
    this.duration = this.length / this.sampleRate;
    
    // Initialize channel data with zeros
    this.channelData = Array(this.numberOfChannels)
      .fill(null)
      .map(() => new Float32Array(this.length));
    
    // Fill with synthetic audio data (sine wave + noise)
    this.fillWithSyntheticData();
  }

  private fillWithSyntheticData(): void {
    const frequency = 440; // A4 note
    
    for (let ch = 0; ch < this.numberOfChannels; ch++) {
      for (let i = 0; i < this.length; i++) {
        const time = i / this.sampleRate;
        // Combine sine wave with some harmonics and noise
        const sample = 
          Math.sin(2 * Math.PI * frequency * time) * 0.5 +
          Math.sin(2 * Math.PI * frequency * 2 * time) * 0.25 +
          (Math.random() - 0.5) * 0.1;
        
        this.channelData[ch][i] = Math.max(-1, Math.min(1, sample));
      }
    }
  }

  getChannelData(channel: number): Float32Array {
    if (channel < 0 || channel >= this.numberOfChannels) {
      throw new Error(`Channel index ${channel} out of bounds`);
    }
    return this.channelData[channel];
  }

  copyFromChannel(
    destination: Float32Array,
    channelNumber: number,
    startInChannel = 0
  ): void {
    const channelData = this.getChannelData(channelNumber);
    const length = Math.min(destination.length, channelData.length - startInChannel);
    
    for (let i = 0; i < length; i++) {
      destination[i] = channelData[startInChannel + i];
    }
  }

  copyToChannel(
    source: Float32Array,
    channelNumber: number,
    startInChannel = 0
  ): void {
    const channelData = this.getChannelData(channelNumber);
    const length = Math.min(source.length, channelData.length - startInChannel);
    
    for (let i = 0; i < length; i++) {
      channelData[startInChannel + i] = source[i];
    }
  }
}

// ============================================================================
// Mock AudioBufferSourceNode
// ============================================================================

export class MockAudioBufferSourceNode {
  context: MockAudioContext;
  buffer: MockAudioBuffer | null = null;
  playbackRate = { value: 1 };
  detune = { value: 0 };
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  onended: ((this: AudioBufferSourceNode, ev: Event) => any) | null = null;
  
  private playing = false;
  private startTime = 0;

  constructor(context: MockAudioContext) {
    this.context = context;
  }

  connect(destination: AudioNode | AudioParam): AudioNode | AudioParam {
    return destination;
  }

  disconnect(destination?: AudioNode | AudioParam): void {
    // Mock disconnect
  }

  start(when?: number, offset?: number, duration?: number): void {
    if (this.playing) {
      throw new Error('Cannot start a source that is already playing');
    }
    
    this.playing = true;
    this.startTime = when ?? this.context.currentTime;
    
    // Simulate playback ending after buffer duration
    if (this.buffer && !this.loop) {
      const duration = this.buffer.duration;
      setTimeout(() => {
        this.playing = false;
        if (this.onended) {
          this.onended.call(this as any, new Event('ended'));
        }
      }, duration * 1000);
    }
  }

  stop(when?: number): void {
    this.playing = false;
    if (this.onended) {
      this.onended.call(this as any, new Event('ended'));
    }
  }
}

// ============================================================================
// Mock AnalyserNode
// ============================================================================

export class MockAnalyserNode {
  context: MockAudioContext;
  fftSize = 2048;
  frequencyBinCount = 1024;
  minDecibels = -100;
  maxDecibels = -30;
  smoothingTimeConstant = 0.8;
  
  private frequencyData: Uint8Array;
  private timeDomainData: Uint8Array;
  private floatFrequencyData: Float32Array;
  private floatTimeDomainData: Float32Array;

  constructor(context: MockAudioContext) {
    this.context = context;
    this.frequencyData = new Uint8Array(this.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.fftSize);
    this.floatFrequencyData = new Float32Array(this.frequencyBinCount);
    this.floatTimeDomainData = new Float32Array(this.fftSize);
    
    // Fill with mock data
    this.updateMockData();
  }

  private updateMockData(): void {
    // Generate synthetic frequency data
    for (let i = 0; i < this.frequencyBinCount; i++) {
      // More energy in lower frequencies
      const freqRatio = i / this.frequencyBinCount;
      const baseAmplitude = Math.exp(-freqRatio * 3) * 200 + 20;
      const variation = Math.sin(Date.now() * 0.01 + i * 0.1) * 30;
      
      this.frequencyData[i] = Math.max(0, Math.min(255, baseAmplitude + variation));
      this.floatFrequencyData[i] = -100 + (this.frequencyData[i] / 255) * 70;
    }
    
    // Generate synthetic time domain data
    for (let i = 0; i < this.fftSize; i++) {
      const time = i / this.fftSize;
      const sample = 
        Math.sin(2 * Math.PI * 440 * time) * 0.5 + // 440Hz sine
        Math.sin(2 * Math.PI * 880 * time) * 0.25 + // Harmonic
        (Math.random() - 0.5) * 0.1; // Noise
      
      this.floatTimeDomainData[i] = sample;
      this.timeDomainData[i] = 128 + Math.floor(sample * 127);
    }
  }

  getFloatFrequencyData(array: Float32Array): void {
    this.updateMockData();
    for (let i = 0; i < Math.min(array.length, this.frequencyBinCount); i++) {
      array[i] = this.floatFrequencyData[i];
    }
  }

  getByteFrequencyData(array: Uint8Array): void {
    this.updateMockData();
    for (let i = 0; i < Math.min(array.length, this.frequencyBinCount); i++) {
      array[i] = this.frequencyData[i];
    }
  }

  getFloatTimeDomainData(array: Float32Array): void {
    this.updateMockData();
    for (let i = 0; i < Math.min(array.length, this.fftSize); i++) {
      array[i] = this.floatTimeDomainData[i];
    }
  }

  getByteTimeDomainData(array: Uint8Array): void {
    this.updateMockData();
    for (let i = 0; i < Math.min(array.length, this.fftSize); i++) {
      array[i] = this.timeDomainData[i];
    }
  }

  connect(destination: AudioNode | AudioParam): AudioNode | AudioParam {
    return destination;
  }

  disconnect(destination?: AudioNode | AudioParam): void {
    // Mock disconnect
  }
}

// ============================================================================
// Mock GainNode
// ============================================================================

export class MockGainNode {
  context: MockAudioContext;
  gain: AudioParam;

  constructor(context: MockAudioContext) {
    this.context = context;
    this.gain = this.createParam(1);
  }

  private createParam(defaultValue: number): AudioParam {
    return {
      value: defaultValue,
      defaultValue,
      minValue: -3.4028235e38,
      maxValue: 3.4028235e38,
      setValueAtTime: vi.fn((value: number, startTime: number) => this),
      linearRampToValueAtTime: vi.fn((value: number, endTime: number) => this),
      exponentialRampToValueAtTime: vi.fn((value: number, endTime: number) => this),
      setTargetAtTime: vi.fn((target: number, startTime: number, timeConstant: number) => this),
      setValueCurveAtTime: vi.fn((values: Float32Array, startTime: number, duration: number) => this),
      cancelScheduledValues: vi.fn((cancelTime: number) => this),
      cancelAndHoldAtTime: vi.fn((cancelTime: number) => this),
    } as AudioParam;
  }

  connect(destination: AudioNode | AudioParam): AudioNode | AudioParam {
    return destination;
  }

  disconnect(destination?: AudioNode | AudioParam): void {
    // Mock disconnect
  }
}

// ============================================================================
// Mock OscillatorNode
// ============================================================================

export class MockOscillatorNode {
  context: MockAudioContext;
  type: OscillatorType = 'sine';
  frequency: AudioParam;
  detune: AudioParam;
  onended: ((this: OscillatorNode, ev: Event) => any) | null = null;
  
  private playing = false;

  constructor(context: MockAudioContext) {
    this.context = context;
    this.frequency = this.createParam(440);
    this.detune = this.createParam(0);
  }

  private createParam(defaultValue: number): AudioParam {
    return {
      value: defaultValue,
      defaultValue,
      minValue: -3.4028235e38,
      maxValue: 3.4028235e38,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
      setValueCurveAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
      cancelAndHoldAtTime: vi.fn(),
    } as AudioParam;
  }

  connect(destination: AudioNode | AudioParam): AudioNode | AudioParam {
    return destination;
  }

  disconnect(destination?: AudioNode | AudioParam): void {
    // Mock disconnect
  }

  start(when?: number): void {
    this.playing = true;
  }

  stop(when?: number): void {
    this.playing = false;
    if (this.onended) {
      this.onended.call(this as any, new Event('ended'));
    }
  }

  setPeriodicWave(periodicWave: PeriodicWave): void {
    // Mock implementation
  }
}

// ============================================================================
// Mock AudioContext
// ============================================================================

export class MockAudioContext {
  sampleRate: number;
  currentTime = 0;
  state: AudioContextState = 'suspended';
  destination = {} as AudioDestinationNode;
  listener = {} as AudioListener;
  
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(options?: AudioContextOptions) {
    this.sampleRate = options?.sampleRate ?? 48000;
    this.startTimeTracking();
  }

  private startTimeTracking(): void {
    // Simulate time passing
    this.intervalId = setInterval(() => {
      this.currentTime += 0.016; // ~60fps
    }, 16);
  }

  async resume(): Promise<void> {
    if (this.state === 'closed') {
      throw new Error('Cannot resume a closed AudioContext');
    }
    this.state = 'running';
  }

  async suspend(): Promise<void> {
    if (this.state === 'closed') {
      throw new Error('Cannot suspend a closed AudioContext');
    }
    this.state = 'suspended';
  }

  async close(): Promise<void> {
    this.state = 'closed';
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  createBuffer(
    numberOfChannels: number,
    length: number,
    sampleRate: number
  ): MockAudioBuffer {
    return new MockAudioBuffer({ numberOfChannels, length, sampleRate });
  }

  createBufferSource(): MockAudioBufferSourceNode {
    return new MockAudioBufferSourceNode(this);
  }

  createAnalyser(): MockAnalyserNode {
    return new MockAnalyserNode(this);
  }

  createGain(): MockGainNode {
    return new MockGainNode(this);
  }

  createOscillator(): MockOscillatorNode {
    return new MockOscillatorNode(this);
  }

  decodeAudioData(
    audioData: ArrayBuffer,
    successCallback?: (decodedData: MockAudioBuffer) => void,
    errorCallback?: (error: Error) => void
  ): Promise<MockAudioBuffer> {
    return new Promise((resolve, reject) => {
      try {
        // Mock decoding - just create a buffer
        const buffer = new MockAudioBuffer({
          numberOfChannels: 2,
          length: 48000,
          sampleRate: this.sampleRate,
        });
        
        if (successCallback) {
          successCallback(buffer);
        }
        resolve(buffer);
      } catch (error) {
        if (errorCallback) {
          errorCallback(error as Error);
        }
        reject(error);
      }
    });
  }

  // Additional node creation methods
  createBiquadFilter(): any {
    return {
      type: 'lowpass',
      frequency: { value: 350, setValueAtTime: vi.fn() },
      Q: { value: 1, setValueAtTime: vi.fn() },
      gain: { value: 0, setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createDelay(maxDelayTime?: number): any {
    return {
      delayTime: { value: 0, setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createDynamicsCompressor(): any {
    return {
      threshold: { value: -24, setValueAtTime: vi.fn() },
      knee: { value: 30, setValueAtTime: vi.fn() },
      ratio: { value: 12, setValueAtTime: vi.fn() },
      attack: { value: 0.003, setValueAtTime: vi.fn() },
      release: { value: 0.25, setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createWaveShaper(): any {
    return {
      curve: null,
      oversample: 'none',
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createPanner(): any {
    return {
      positionX: { value: 0, setValueAtTime: vi.fn() },
      positionY: { value: 0, setValueAtTime: vi.fn() },
      positionZ: { value: 0, setValueAtTime: vi.fn() },
      orientationX: { value: 1, setValueAtTime: vi.fn() },
      orientationY: { value: 0, setValueAtTime: vi.fn() },
      orientationZ: { value: 0, setValueAtTime: vi.fn() },
      panningModel: 'equalpower',
      distanceModel: 'inverse',
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createStereoPanner(): any {
    return {
      pan: { value: 0, setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createConvolver(): any {
    return {
      buffer: null,
      normalize: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createChannelSplitter(numberOfOutputs = 6): any {
    return {
      numberOfOutputs,
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createChannelMerger(numberOfInputs = 6): any {
    return {
      numberOfInputs,
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createMediaElementSource(mediaElement: HTMLMediaElement): any {
    return {
      mediaElement,
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createMediaStreamSource(mediaStream: MediaStream): any {
    return {
      mediaStream,
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createMediaStreamDestination(): any {
    return {
      stream: new MediaStream(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createPeriodicWave(
    real: number[] | Float32Array,
    imag: number[] | Float32Array,
    constraints?: PeriodicWaveConstraints
  ): PeriodicWave {
    return {} as PeriodicWave;
  }

  createScriptProcessor(
    bufferSize = 0,
    numberOfInputChannels = 2,
    numberOfOutputChannels = 2
  ): any {
    return {
      bufferSize,
      numberOfInputChannels,
      numberOfOutputChannels,
      onaudioprocess: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  getOutputTimestamp(): AudioTimestamp {
    return {
      contextTime: this.currentTime,
      performanceTime: performance.now(),
    };
  }

  suspend(): Promise<void> {
    return this.suspend();
  }

  onstatechange: ((this: AudioContext, ev: Event) => any) | null = null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a mock AudioContext for testing
 */
export function createMockAudioContext(options?: AudioContextOptions): MockAudioContext {
  return new MockAudioContext(options);
}

/**
 * Create mock audio data with specified characteristics
 */
export function createMockAudioData(options: {
  frequencyData?: number[];
  timeDomainData?: number[];
  sampleRate?: number;
  length?: number;
} = {}): MockAudioData {
  const sampleRate = options.sampleRate ?? 48000;
  const length = options.length ?? 1024;
  
  // Create frequency data
  let frequencyData: Uint8Array;
  if (options.frequencyData) {
    frequencyData = new Uint8Array(options.frequencyData);
  } else {
    frequencyData = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      // More energy in lower frequencies
      const ratio = i / length;
      frequencyData[i] = Math.floor(Math.exp(-ratio * 3) * 200 + Math.random() * 55);
    }
  }
  
  // Create time domain data
  let timeDomainData: Uint8Array;
  if (options.timeDomainData) {
    timeDomainData = new Uint8Array(options.timeDomainData);
  } else {
    timeDomainData = new Uint8Array(length * 2);
    for (let i = 0; i < length * 2; i++) {
      const sample = Math.sin(i * 0.1) * 0.5 + (Math.random() - 0.5) * 0.1;
      timeDomainData[i] = 128 + Math.floor(sample * 127);
    }
  }
  
  return {
    frequencyData,
    timeDomainData,
    sampleRate,
    timestamp: Date.now(),
  };
}

/**
 * Create a sine wave buffer for testing
 */
export function createSineWaveBuffer(
  frequency: number,
  duration: number,
  sampleRate = 48000,
  amplitude = 1
): Float32Array {
  const length = Math.floor(duration * sampleRate);
  const buffer = new Float32Array(length);
  
  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    buffer[i] = Math.sin(2 * Math.PI * frequency * time) * amplitude;
  }
  
  return buffer;
}

/**
 * Create white noise buffer for testing
 */
export function createNoiseBuffer(
  duration: number,
  sampleRate = 48000,
  amplitude = 0.5
): Float32Array {
  const length = Math.floor(duration * sampleRate);
  const buffer = new Float32Array(length);
  
  for (let i = 0; i < length; i++) {
    buffer[i] = (Math.random() - 0.5) * 2 * amplitude;
  }
  
  return buffer;
}

/**
 * Calculate RMS (Root Mean Square) of an audio buffer
 */
export function calculateRMS(buffer: Float32Array): number {
  let sum = 0;
  for (const sample of buffer) {
    sum += sample * sample;
  }
  return Math.sqrt(sum / buffer.length);
}

/**
 * Calculate peak amplitude of an audio buffer
 */
export function calculatePeak(buffer: Float32Array): number {
  let peak = 0;
  for (const sample of buffer) {
    peak = Math.max(peak, Math.abs(sample));
  }
  return peak;
}

/**
 * Apply a simple low-pass filter (for testing)
 */
export function applyLowPassFilter(
  input: Float32Array,
  cutoff: number,
  sampleRate: number
): Float32Array {
  const output = new Float32Array(input.length);
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / sampleRate;
  const alpha = dt / (rc + dt);
  
  output[0] = input[0];
  for (let i = 1; i < input.length; i++) {
    output[i] = output[i - 1] + alpha * (input[i] - output[i - 1]);
  }
  
  return output;
}
