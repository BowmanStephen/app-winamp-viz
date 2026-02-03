// Web Audio API Mock Utilities
// Provides mock implementations for Web Audio API objects used in tests
import { vi } from 'vitest';
// ============================================================================
// Mock AudioBuffer
// ============================================================================
export class MockAudioBuffer {
    constructor(options = {}) {
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
    fillWithSyntheticData() {
        const frequency = 440; // A4 note
        for (let ch = 0; ch < this.numberOfChannels; ch++) {
            for (let i = 0; i < this.length; i++) {
                const time = i / this.sampleRate;
                // Combine sine wave with some harmonics and noise
                const sample = Math.sin(2 * Math.PI * frequency * time) * 0.5 +
                    Math.sin(2 * Math.PI * frequency * 2 * time) * 0.25 +
                    (Math.random() - 0.5) * 0.1;
                this.channelData[ch][i] = Math.max(-1, Math.min(1, sample));
            }
        }
    }
    getChannelData(channel) {
        if (channel < 0 || channel >= this.numberOfChannels) {
            throw new Error(`Channel index ${channel} out of bounds`);
        }
        return this.channelData[channel];
    }
    copyFromChannel(destination, channelNumber, startInChannel = 0) {
        const channelData = this.getChannelData(channelNumber);
        const length = Math.min(destination.length, channelData.length - startInChannel);
        for (let i = 0; i < length; i++) {
            destination[i] = channelData[startInChannel + i];
        }
    }
    copyToChannel(source, channelNumber, startInChannel = 0) {
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
    constructor(context) {
        this.buffer = null;
        this.playbackRate = { value: 1 };
        this.detune = { value: 0 };
        this.loop = false;
        this.loopStart = 0;
        this.loopEnd = 0;
        this.onended = null;
        this.playing = false;
        this.startTime = 0;
        this.context = context;
    }
    connect(destination) {
        return destination;
    }
    disconnect(destination) {
        // Mock disconnect
    }
    start(when, offset, duration) {
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
                    this.onended.call(this, new Event('ended'));
                }
            }, duration * 1000);
        }
    }
    stop(when) {
        this.playing = false;
        if (this.onended) {
            this.onended.call(this, new Event('ended'));
        }
    }
}
// ============================================================================
// Mock AnalyserNode
// ============================================================================
export class MockAnalyserNode {
    constructor(context) {
        this.fftSize = 2048;
        this.frequencyBinCount = 1024;
        this.minDecibels = -100;
        this.maxDecibels = -30;
        this.smoothingTimeConstant = 0.8;
        this.context = context;
        this.frequencyData = new Uint8Array(this.frequencyBinCount);
        this.timeDomainData = new Uint8Array(this.fftSize);
        this.floatFrequencyData = new Float32Array(this.frequencyBinCount);
        this.floatTimeDomainData = new Float32Array(this.fftSize);
        // Fill with mock data
        this.updateMockData();
    }
    updateMockData() {
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
            const sample = Math.sin(2 * Math.PI * 440 * time) * 0.5 + // 440Hz sine
                Math.sin(2 * Math.PI * 880 * time) * 0.25 + // Harmonic
                (Math.random() - 0.5) * 0.1; // Noise
            this.floatTimeDomainData[i] = sample;
            this.timeDomainData[i] = 128 + Math.floor(sample * 127);
        }
    }
    getFloatFrequencyData(array) {
        this.updateMockData();
        for (let i = 0; i < Math.min(array.length, this.frequencyBinCount); i++) {
            array[i] = this.floatFrequencyData[i];
        }
    }
    getByteFrequencyData(array) {
        this.updateMockData();
        for (let i = 0; i < Math.min(array.length, this.frequencyBinCount); i++) {
            array[i] = this.frequencyData[i];
        }
    }
    getFloatTimeDomainData(array) {
        this.updateMockData();
        for (let i = 0; i < Math.min(array.length, this.fftSize); i++) {
            array[i] = this.floatTimeDomainData[i];
        }
    }
    getByteTimeDomainData(array) {
        this.updateMockData();
        for (let i = 0; i < Math.min(array.length, this.fftSize); i++) {
            array[i] = this.timeDomainData[i];
        }
    }
    connect(destination) {
        return destination;
    }
    disconnect(destination) {
        // Mock disconnect
    }
}
// ============================================================================
// Mock GainNode
// ============================================================================
export class MockGainNode {
    constructor(context) {
        this.context = context;
        this.gain = this.createParam(1);
    }
    createParam(defaultValue) {
        return {
            value: defaultValue,
            defaultValue,
            minValue: -3.4028235e38,
            maxValue: 3.4028235e38,
            setValueAtTime: vi.fn((value, startTime) => this),
            linearRampToValueAtTime: vi.fn((value, endTime) => this),
            exponentialRampToValueAtTime: vi.fn((value, endTime) => this),
            setTargetAtTime: vi.fn((target, startTime, timeConstant) => this),
            setValueCurveAtTime: vi.fn((values, startTime, duration) => this),
            cancelScheduledValues: vi.fn((cancelTime) => this),
            cancelAndHoldAtTime: vi.fn((cancelTime) => this),
        };
    }
    connect(destination) {
        return destination;
    }
    disconnect(destination) {
        // Mock disconnect
    }
}
// ============================================================================
// Mock OscillatorNode
// ============================================================================
export class MockOscillatorNode {
    constructor(context) {
        this.type = 'sine';
        this.onended = null;
        this.playing = false;
        this.context = context;
        this.frequency = this.createParam(440);
        this.detune = this.createParam(0);
    }
    createParam(defaultValue) {
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
        };
    }
    connect(destination) {
        return destination;
    }
    disconnect(destination) {
        // Mock disconnect
    }
    start(when) {
        this.playing = true;
    }
    stop(when) {
        this.playing = false;
        if (this.onended) {
            this.onended.call(this, new Event('ended'));
        }
    }
    setPeriodicWave(periodicWave) {
        // Mock implementation
    }
}
// ============================================================================
// Mock AudioContext
// ============================================================================
export class MockAudioContext {
    constructor(options) {
        this.currentTime = 0;
        this.state = 'suspended';
        this.destination = {};
        this.listener = {};
        this.intervalId = null;
        this.onstatechange = null;
        this.sampleRate = options?.sampleRate ?? 48000;
        this.startTimeTracking();
    }
    startTimeTracking() {
        // Simulate time passing
        this.intervalId = setInterval(() => {
            this.currentTime += 0.016; // ~60fps
        }, 16);
    }
    async resume() {
        if (this.state === 'closed') {
            throw new Error('Cannot resume a closed AudioContext');
        }
        this.state = 'running';
    }
    async suspend() {
        if (this.state === 'closed') {
            throw new Error('Cannot suspend a closed AudioContext');
        }
        this.state = 'suspended';
    }
    async close() {
        this.state = 'closed';
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
    createBuffer(numberOfChannels, length, sampleRate) {
        return new MockAudioBuffer({ numberOfChannels, length, sampleRate });
    }
    createBufferSource() {
        return new MockAudioBufferSourceNode(this);
    }
    createAnalyser() {
        return new MockAnalyserNode(this);
    }
    createGain() {
        return new MockGainNode(this);
    }
    createOscillator() {
        return new MockOscillatorNode(this);
    }
    decodeAudioData(audioData, successCallback, errorCallback) {
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
            }
            catch (error) {
                if (errorCallback) {
                    errorCallback(error);
                }
                reject(error);
            }
        });
    }
    // Additional node creation methods
    createBiquadFilter() {
        return {
            type: 'lowpass',
            frequency: { value: 350, setValueAtTime: vi.fn() },
            Q: { value: 1, setValueAtTime: vi.fn() },
            gain: { value: 0, setValueAtTime: vi.fn() },
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
    }
    createDelay(maxDelayTime) {
        return {
            delayTime: { value: 0, setValueAtTime: vi.fn() },
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
    }
    createDynamicsCompressor() {
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
    createWaveShaper() {
        return {
            curve: null,
            oversample: 'none',
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
    }
    createPanner() {
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
    createStereoPanner() {
        return {
            pan: { value: 0, setValueAtTime: vi.fn() },
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
    }
    createConvolver() {
        return {
            buffer: null,
            normalize: true,
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
    }
    createChannelSplitter(numberOfOutputs = 6) {
        return {
            numberOfOutputs,
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
    }
    createChannelMerger(numberOfInputs = 6) {
        return {
            numberOfInputs,
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
    }
    createMediaElementSource(mediaElement) {
        return {
            mediaElement,
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
    }
    createMediaStreamSource(mediaStream) {
        return {
            mediaStream,
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
    }
    createMediaStreamDestination() {
        return {
            stream: new MediaStream(),
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
    }
    createPeriodicWave(real, imag, constraints) {
        return {};
    }
    createScriptProcessor(bufferSize = 0, numberOfInputChannels = 2, numberOfOutputChannels = 2) {
        return {
            bufferSize,
            numberOfInputChannels,
            numberOfOutputChannels,
            onaudioprocess: null,
            connect: vi.fn(),
            disconnect: vi.fn(),
        };
    }
    getOutputTimestamp() {
        return {
            contextTime: this.currentTime,
            performanceTime: performance.now(),
        };
    }
    suspend() {
        return this.suspend();
    }
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Create a mock AudioContext for testing
 */
export function createMockAudioContext(options) {
    return new MockAudioContext(options);
}
/**
 * Create mock audio data with specified characteristics
 */
export function createMockAudioData(options = {}) {
    const sampleRate = options.sampleRate ?? 48000;
    const length = options.length ?? 1024;
    // Create frequency data
    let frequencyData;
    if (options.frequencyData) {
        frequencyData = new Uint8Array(options.frequencyData);
    }
    else {
        frequencyData = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            // More energy in lower frequencies
            const ratio = i / length;
            frequencyData[i] = Math.floor(Math.exp(-ratio * 3) * 200 + Math.random() * 55);
        }
    }
    // Create time domain data
    let timeDomainData;
    if (options.timeDomainData) {
        timeDomainData = new Uint8Array(options.timeDomainData);
    }
    else {
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
export function createSineWaveBuffer(frequency, duration, sampleRate = 48000, amplitude = 1) {
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
export function createNoiseBuffer(duration, sampleRate = 48000, amplitude = 0.5) {
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
export function calculateRMS(buffer) {
    let sum = 0;
    for (const sample of buffer) {
        sum += sample * sample;
    }
    return Math.sqrt(sum / buffer.length);
}
/**
 * Calculate peak amplitude of an audio buffer
 */
export function calculatePeak(buffer) {
    let peak = 0;
    for (const sample of buffer) {
        peak = Math.max(peak, Math.abs(sample));
    }
    return peak;
}
/**
 * Apply a simple low-pass filter (for testing)
 */
export function applyLowPassFilter(input, cutoff, sampleRate) {
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
//# sourceMappingURL=webaudio.js.map