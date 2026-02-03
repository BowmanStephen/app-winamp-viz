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
export declare class MockAudioBuffer {
    numberOfChannels: number;
    length: number;
    sampleRate: number;
    duration: number;
    private channelData;
    constructor(options?: AudioBufferOptions);
    private fillWithSyntheticData;
    getChannelData(channel: number): Float32Array;
    copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel?: number): void;
    copyToChannel(source: Float32Array, channelNumber: number, startInChannel?: number): void;
}
export declare class MockAudioBufferSourceNode {
    context: MockAudioContext;
    buffer: MockAudioBuffer | null;
    playbackRate: {
        value: number;
    };
    detune: {
        value: number;
    };
    loop: boolean;
    loopStart: number;
    loopEnd: number;
    onended: ((this: AudioBufferSourceNode, ev: Event) => any) | null;
    private playing;
    private startTime;
    constructor(context: MockAudioContext);
    connect(destination: AudioNode | AudioParam): AudioNode | AudioParam;
    disconnect(destination?: AudioNode | AudioParam): void;
    start(when?: number, offset?: number, duration?: number): void;
    stop(when?: number): void;
}
export declare class MockAnalyserNode {
    context: MockAudioContext;
    fftSize: number;
    frequencyBinCount: number;
    minDecibels: number;
    maxDecibels: number;
    smoothingTimeConstant: number;
    private frequencyData;
    private timeDomainData;
    private floatFrequencyData;
    private floatTimeDomainData;
    constructor(context: MockAudioContext);
    private updateMockData;
    getFloatFrequencyData(array: Float32Array): void;
    getByteFrequencyData(array: Uint8Array): void;
    getFloatTimeDomainData(array: Float32Array): void;
    getByteTimeDomainData(array: Uint8Array): void;
    connect(destination: AudioNode | AudioParam): AudioNode | AudioParam;
    disconnect(destination?: AudioNode | AudioParam): void;
}
export declare class MockGainNode {
    context: MockAudioContext;
    gain: AudioParam;
    constructor(context: MockAudioContext);
    private createParam;
    connect(destination: AudioNode | AudioParam): AudioNode | AudioParam;
    disconnect(destination?: AudioNode | AudioParam): void;
}
export declare class MockOscillatorNode {
    context: MockAudioContext;
    type: OscillatorType;
    frequency: AudioParam;
    detune: AudioParam;
    onended: ((this: OscillatorNode, ev: Event) => any) | null;
    private playing;
    constructor(context: MockAudioContext);
    private createParam;
    connect(destination: AudioNode | AudioParam): AudioNode | AudioParam;
    disconnect(destination?: AudioNode | AudioParam): void;
    start(when?: number): void;
    stop(when?: number): void;
    setPeriodicWave(periodicWave: PeriodicWave): void;
}
export declare class MockAudioContext {
    sampleRate: number;
    currentTime: number;
    state: AudioContextState;
    destination: AudioDestinationNode;
    listener: AudioListener;
    private intervalId;
    constructor(options?: AudioContextOptions);
    private startTimeTracking;
    resume(): Promise<void>;
    close(): Promise<void>;
    createBuffer(numberOfChannels: number, length: number, sampleRate: number): MockAudioBuffer;
    createBufferSource(): MockAudioBufferSourceNode;
    createAnalyser(): MockAnalyserNode;
    createGain(): MockGainNode;
    createOscillator(): MockOscillatorNode;
    decodeAudioData(audioData: ArrayBuffer, successCallback?: (decodedData: MockAudioBuffer) => void, errorCallback?: (error: Error) => void): Promise<MockAudioBuffer>;
    createBiquadFilter(): any;
    createDelay(maxDelayTime?: number): any;
    createDynamicsCompressor(): any;
    createWaveShaper(): any;
    createPanner(): any;
    createStereoPanner(): any;
    createConvolver(): any;
    createChannelSplitter(numberOfOutputs?: number): any;
    createChannelMerger(numberOfInputs?: number): any;
    createMediaElementSource(mediaElement: HTMLMediaElement): any;
    createMediaStreamSource(mediaStream: MediaStream): any;
    createMediaStreamDestination(): any;
    createPeriodicWave(real: number[] | Float32Array, imag: number[] | Float32Array, constraints?: PeriodicWaveConstraints): PeriodicWave;
    createScriptProcessor(bufferSize?: number, numberOfInputChannels?: number, numberOfOutputChannels?: number): any;
    getOutputTimestamp(): AudioTimestamp;
    onstatechange: ((this: AudioContext, ev: Event) => any) | null;
}
/**
 * Create a mock AudioContext for testing
 */
export declare function createMockAudioContext(options?: AudioContextOptions): MockAudioContext;
/**
 * Create mock audio data with specified characteristics
 */
export declare function createMockAudioData(options?: {
    frequencyData?: number[];
    timeDomainData?: number[];
    sampleRate?: number;
    length?: number;
}): MockAudioData;
/**
 * Create a sine wave buffer for testing
 */
export declare function createSineWaveBuffer(frequency: number, duration: number, sampleRate?: number, amplitude?: number): Float32Array;
/**
 * Create white noise buffer for testing
 */
export declare function createNoiseBuffer(duration: number, sampleRate?: number, amplitude?: number): Float32Array;
/**
 * Calculate RMS (Root Mean Square) of an audio buffer
 */
export declare function calculateRMS(buffer: Float32Array): number;
/**
 * Calculate peak amplitude of an audio buffer
 */
export declare function calculatePeak(buffer: Float32Array): number;
/**
 * Apply a simple low-pass filter (for testing)
 */
export declare function applyLowPassFilter(input: Float32Array, cutoff: number, sampleRate: number): Float32Array;
//# sourceMappingURL=webaudio.d.ts.map