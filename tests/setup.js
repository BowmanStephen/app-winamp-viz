// Vitest test setup and global mocks
import { vi } from 'vitest';
import 'vitest-canvas-mock';
// ============================================================================
// Global Test Configuration
// ============================================================================
// Set up test environment
globalThis.IS_TEST = true;
// ============================================================================
// WebGL Mock Setup
// ============================================================================
// Mock WebGL context
const mockWebGLContext = {
    // Context attributes
    canvas: null,
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    // Constants
    COLOR_BUFFER_BIT: 0x00004000,
    DEPTH_BUFFER_BIT: 0x00000100,
    STENCIL_BUFFER_BIT: 0x00000400,
    // Methods
    viewport: vi.fn(),
    clear: vi.fn(),
    clearColor: vi.fn(),
    clearDepth: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    useProgram: vi.fn(),
    deleteProgram: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    deleteBuffer: vi.fn(),
    createTexture: vi.fn(() => ({})),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texParameteri: vi.fn(),
    deleteTexture: vi.fn(),
    createFramebuffer: vi.fn(() => ({})),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    deleteFramebuffer: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({})),
    uniform1f: vi.fn(),
    uniform1i: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    uniform4f: vi.fn(),
    uniformMatrix4fv: vi.fn(),
    vertexAttribPointer: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    disableVertexAttribArray: vi.fn(),
    drawArrays: vi.fn(),
    drawElements: vi.fn(),
    blendFunc: vi.fn(),
    depthFunc: vi.fn(),
    cullFace: vi.fn(),
    frontFace: vi.fn(),
    scissor: vi.fn(),
    getExtension: vi.fn((name) => {
        if (name === 'WEBGL_lose_context') {
            return {
                loseContext: vi.fn(),
                restoreContext: vi.fn(),
            };
        }
        return {};
    }),
    getParameter: vi.fn((param) => {
        // Return reasonable defaults
        if (param === 0x0D31)
            return 4096; // MAX_TEXTURE_SIZE
        if (param === 0x0D33)
            return 1024; // MAX_VIEWPORT_DIMS
        return 0;
    }),
    getSupportedExtensions: vi.fn(() => []),
    // Rendering
    flush: vi.fn(),
    finish: vi.fn(),
    // State queries
    isEnabled: vi.fn(() => false),
    getError: vi.fn(() => 0),
    // Read pixels
    readPixels: vi.fn(),
    // Active texture
    activeTexture: vi.fn(),
    // Pixel store
    pixelStorei: vi.fn(),
    // Line width
    lineWidth: vi.fn(),
    // Polygon offset
    polygonOffset: vi.fn(),
    // Sample coverage
    sampleCoverage: vi.fn(),
    // Stencil
    stencilFunc: vi.fn(),
    stencilOp: vi.fn(),
    stencilMask: vi.fn(),
    // Depth
    depthMask: vi.fn(),
    depthRange: vi.fn(),
    // Color mask
    colorMask: vi.fn(),
    // Clear stencil
    clearStencil: vi.fn(),
};
// Mock canvas getContext
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: vi.fn((contextId) => {
        if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl') {
            return mockWebGLContext;
        }
        if (contextId === '2d') {
            return {
                fillRect: vi.fn(),
                clearRect: vi.fn(),
                getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
                putImageData: vi.fn(),
                createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
                setTransform: vi.fn(),
                drawImage: vi.fn(),
                save: vi.fn(),
                fillText: vi.fn(),
                restore: vi.fn(),
                beginPath: vi.fn(),
                moveTo: vi.fn(),
                lineTo: vi.fn(),
                closePath: vi.fn(),
                stroke: vi.fn(),
                translate: vi.fn(),
                scale: vi.fn(),
                rotate: vi.fn(),
                arc: vi.fn(),
                fill: vi.fn(),
                measureText: vi.fn(() => ({ width: 0 })),
                transform: vi.fn(),
                rect: vi.fn(),
                clip: vi.fn(),
                fillStyle: '',
                strokeStyle: '',
                font: '',
                canvas: null,
            };
        }
        return null;
    }),
});
// ============================================================================
// Web Audio API Mock Setup
// ============================================================================
class MockAudioBuffer {
    constructor() {
        this.sampleRate = 48000;
        this.length = 48000;
        this.duration = 1;
        this.numberOfChannels = 2;
    }
    getChannelData(channel) {
        return new Float32Array(this.length);
    }
    copyFromChannel(destination, channelNumber, startInChannel = 0) {
        const data = this.getChannelData(channelNumber);
        for (let i = 0; i < destination.length; i++) {
            destination[i] = data[startInChannel + i] || 0;
        }
    }
    copyToChannel(source, channelNumber, startInChannel = 0) {
        // Mock implementation
    }
}
class MockAudioBufferSourceNode {
    constructor() {
        this.buffer = null;
        this.onended = null;
    }
    connect(destination) {
        return destination;
    }
    disconnect() { }
    start(when, offset, duration) {
        // Simulate playing
    }
    stop(when) {
        if (this.onended) {
            this.onended();
        }
    }
}
class MockAnalyserNode {
    constructor() {
        this.fftSize = 2048;
        this.frequencyBinCount = 1024;
        this.minDecibels = -100;
        this.maxDecibels = -30;
        this.smoothingTimeConstant = 0.8;
    }
    getFloatFrequencyData(array) {
        // Fill with mock frequency data
        for (let i = 0; i < array.length; i++) {
            array[i] = -100 + Math.random() * 70; // -100 to -30 dB
        }
    }
    getByteFrequencyData(array) {
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    getFloatTimeDomainData(array) {
        // Generate sine wave
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.sin(i * 0.1) * 0.5;
        }
    }
    getByteTimeDomainData(array) {
        for (let i = 0; i < array.length; i++) {
            array[i] = 128 + Math.floor(Math.sin(i * 0.1) * 127);
        }
    }
    connect(destination) {
        return destination;
    }
    disconnect() { }
}
class MockGainNode {
    constructor() {
        this.gain = {
            value: 1,
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
        };
    }
    connect(destination) {
        return destination;
    }
    disconnect() { }
}
class MockAudioContext {
    constructor(options) {
        this.sampleRate = 48000;
        this.currentTime = 0;
        this.state = 'suspended';
        this.destination = {};
        this.listener = {};
        if (options?.sampleRate) {
            this.sampleRate = options.sampleRate;
        }
    }
    async resume() {
        this.state = 'running';
    }
    async suspend() {
        this.state = 'suspended';
    }
    async close() {
        this.state = 'closed';
    }
    createBuffer(numberOfChannels, length, sampleRate) {
        const buffer = new MockAudioBuffer();
        buffer.numberOfChannels = numberOfChannels;
        buffer.length = length;
        buffer.sampleRate = sampleRate;
        buffer.duration = length / sampleRate;
        return buffer;
    }
    createBufferSource() {
        return new MockAudioBufferSourceNode();
    }
    createAnalyser() {
        return new MockAnalyserNode();
    }
    createGain() {
        return new MockGainNode();
    }
    createOscillator() {
        return {
            frequency: { value: 440, setValueAtTime: vi.fn() },
            type: 'sine',
            connect: vi.fn((dest) => dest),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
        };
    }
    decodeAudioData(audioData, successCallback, errorCallback) {
        const buffer = new MockAudioBuffer();
        if (successCallback) {
            successCallback(buffer);
        }
        return Promise.resolve(buffer);
    }
}
// Mock AudioContext constructor
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;
// ============================================================================
// Three.js Mock Setup
// ============================================================================
vi.mock('three', async () => {
    const actual = await vi.importActual('three');
    return {
        ...actual,
        // Override specific classes for testing
        WebGLRenderer: vi.fn().mockImplementation(() => ({
            domElement: document.createElement('canvas'),
            setSize: vi.fn(),
            setPixelRatio: vi.fn(),
            render: vi.fn(),
            dispose: vi.fn(),
            info: {
                render: { calls: 0, triangles: 0, points: 0, lines: 0 },
                memory: { geometries: 0, textures: 0 },
            },
        })),
    };
});
// ============================================================================
// Match Media Mock (for responsive tests)
// ============================================================================
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
// ============================================================================
// Resize Observer Mock
// ============================================================================
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
// ============================================================================
// Intersection Observer Mock
// ============================================================================
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
// ============================================================================
// Request Animation Frame Mock
// ============================================================================
global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(() => callback(performance.now()), 16);
});
global.cancelAnimationFrame = vi.fn((id) => {
    clearTimeout(id);
});
// ============================================================================
// Performance API Mock
// ============================================================================
Object.defineProperty(global, 'performance', {
    value: {
        now: vi.fn(() => Date.now()),
        mark: vi.fn(),
        measure: vi.fn(),
        getEntriesByType: vi.fn(() => []),
        getEntriesByName: vi.fn(() => []),
        clearMarks: vi.fn(),
        clearMeasures: vi.fn(),
    },
});
// ============================================================================
// Local Storage Mock
// ============================================================================
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index) => Object.keys(store)[index] || null),
    };
})();
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});
// ============================================================================
// Console Mock (for testing console outputs)
// ============================================================================
const originalConsole = { ...console };
export function mockConsole() {
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.info = vi.fn();
    console.debug = vi.fn();
}
export function restoreConsole() {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
}
// ============================================================================
// Test Helpers
// ============================================================================
// Helper to wait for promises to resolve
export function flushPromises() {
    return new Promise(resolve => setTimeout(resolve, 0));
}
// Helper to create mock audio data
export function createMockAudioData(options = {}) {
    const sampleRate = options.sampleRate ?? 48000;
    const frequencyData = new Uint8Array(options.frequencyData ?? new Array(1024).fill(128));
    const timeDomainData = new Uint8Array(options.timeDomainData ?? new Array(2048).fill(128));
    return {
        frequencyData,
        timeDomainData,
        sampleRate,
        timestamp: Date.now(),
    };
}
// Helper to simulate audio time passing
export async function advanceAudioTime(ms) {
    const currentTime = Date.now();
    const targetTime = currentTime + ms;
    while (Date.now() < targetTime) {
        await new Promise(resolve => setTimeout(resolve, 16));
    }
}
// ============================================================================
// Cleanup
// ============================================================================
afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
});
beforeAll(() => {
    // Any global setup
});
afterAll(() => {
    // Any global cleanup
});
//# sourceMappingURL=setup.js.map