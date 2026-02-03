// WebGL and Three.js Mock Utilities
// Provides mock implementations for WebGL/Three.js objects used in tests
import { vi } from 'vitest';
// ============================================================================
// Mock WebGL Context with Enhanced Capabilities
// ============================================================================
export class MockWebGLRenderingContext {
    constructor() {
        // Canvas reference
        this.canvas = null;
        // Drawing buffer dimensions
        this.drawingBufferWidth = 800;
        this.drawingBufferHeight = 600;
        // Context attributes
        this.attributes = {
            alpha: true,
            depth: true,
            stencil: false,
            antialias: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            powerPreference: 'default',
        };
        // State tracking
        this.currentProgram = null;
        this.boundBuffer = null;
        this.boundTexture = null;
        this.boundFramebuffer = null;
        // Tracking calls for assertions
        this.calls = [];
        // Constants
        this.COLOR_BUFFER_BIT = 0x00004000;
        this.DEPTH_BUFFER_BIT = 0x00000100;
        this.STENCIL_BUFFER_BIT = 0x00000400;
        this.TRIANGLES = 0x0004;
        this.TRIANGLE_STRIP = 0x0005;
        this.TRIANGLE_FAN = 0x0006;
        this.LINES = 0x0001;
        this.LINE_STRIP = 0x0003;
        this.LINE_LOOP = 0x0002;
        this.POINTS = 0x0000;
        this.ARRAY_BUFFER = 0x8892;
        this.ELEMENT_ARRAY_BUFFER = 0x8893;
        this.STATIC_DRAW = 0x88E4;
        this.DYNAMIC_DRAW = 0x88E8;
        this.STREAM_DRAW = 0x88E0;
        this.FLOAT = 0x1406;
        this.UNSIGNED_BYTE = 0x1401;
        this.UNSIGNED_SHORT = 0x1403;
        this.UNSIGNED_INT = 0x1405;
        this.DEPTH_TEST = 0x0B71;
        this.BLEND = 0x0BE2;
        this.CULL_FACE = 0x0B44;
        this.SCISSOR_TEST = 0x0C11;
        this.TEXTURE_2D = 0x0DE1;
        this.TEXTURE0 = 0x84C0;
        this.FRAMEBUFFER = 0x8D40;
        this.RENDERBUFFER = 0x8D41;
        this.COLOR_ATTACHMENT0 = 0x8CE0;
        this.DEPTH_ATTACHMENT = 0x8D00;
        this.VERTEX_SHADER = 0x8B31;
        this.FRAGMENT_SHADER = 0x8B30;
        this.COMPILE_STATUS = 0x8B81;
        this.LINK_STATUS = 0x8B82;
        this.ACTIVE_UNIFORMS = 0x8B86;
        this.ACTIVE_ATTRIBUTES = 0x8B89;
        // Methods
        this.viewport = vi.fn((x, y, width, height) => {
            this.trackCall('viewport', [x, y, width, height]);
        });
        this.clear = vi.fn((mask) => {
            this.trackCall('clear', [mask]);
        });
        this.clearColor = vi.fn((r, g, b, a) => {
            this.trackCall('clearColor', [r, g, b, a]);
        });
        this.clearDepth = vi.fn((depth) => {
            this.trackCall('clearDepth', [depth]);
        });
        this.enable = vi.fn((cap) => {
            this.trackCall('enable', [cap]);
        });
        this.disable = vi.fn((cap) => {
            this.trackCall('disable', [cap]);
        });
        this.isEnabled = vi.fn((cap) => {
            this.trackCall('isEnabled', [cap]);
            return false;
        });
        // Shader methods
        this.createShader = vi.fn((type) => {
            this.trackCall('createShader', [type]);
            return { type, compiled: false };
        });
        this.shaderSource = vi.fn((shader, source) => {
            this.trackCall('shaderSource', [shader, source]);
        });
        this.compileShader = vi.fn((shader) => {
            this.trackCall('compileShader', [shader]);
            shader.compiled = true;
        });
        this.getShaderParameter = vi.fn((shader, pname) => {
            this.trackCall('getShaderParameter', [shader, pname]);
            if (pname === this.COMPILE_STATUS) {
                return shader.compiled;
            }
            return true;
        });
        this.getShaderInfoLog = vi.fn(() => {
            this.trackCall('getShaderInfoLog', []);
            return '';
        });
        this.deleteShader = vi.fn((shader) => {
            this.trackCall('deleteShader', [shader]);
        });
        // Program methods
        this.createProgram = vi.fn(() => {
            this.trackCall('createProgram', []);
            return { linked: false };
        });
        this.attachShader = vi.fn((program, shader) => {
            this.trackCall('attachShader', [program, shader]);
        });
        this.linkProgram = vi.fn((program) => {
            this.trackCall('linkProgram', [program]);
            program.linked = true;
        });
        this.getProgramParameter = vi.fn((program, pname) => {
            this.trackCall('getProgramParameter', [program, pname]);
            if (pname === this.LINK_STATUS) {
                return program.linked;
            }
            return 0;
        });
        this.getProgramInfoLog = vi.fn(() => {
            this.trackCall('getProgramInfoLog', []);
            return '';
        });
        this.useProgram = vi.fn((program) => {
            this.trackCall('useProgram', [program]);
            this.currentProgram = program;
        });
        this.deleteProgram = vi.fn((program) => {
            this.trackCall('deleteProgram', [program]);
        });
        // Buffer methods
        this.createBuffer = vi.fn(() => {
            this.trackCall('createBuffer', []);
            return {};
        });
        this.bindBuffer = vi.fn((target, buffer) => {
            this.trackCall('bindBuffer', [target, buffer]);
            this.boundBuffer = buffer;
        });
        this.bufferData = vi.fn((target, data, usage) => {
            this.trackCall('bufferData', [target, data, usage]);
        });
        this.bufferSubData = vi.fn((target, offset, data) => {
            this.trackCall('bufferSubData', [target, offset, data]);
        });
        this.deleteBuffer = vi.fn((buffer) => {
            this.trackCall('deleteBuffer', [buffer]);
        });
        // Texture methods
        this.createTexture = vi.fn(() => {
            this.trackCall('createTexture', []);
            return {};
        });
        this.bindTexture = vi.fn((target, texture) => {
            this.trackCall('bindTexture', [target, texture]);
            this.boundTexture = texture;
        });
        this.texImage2D = vi.fn((target, level, internalformat, width, height, border, format, type, pixels) => {
            this.trackCall('texImage2D', [target, level, internalformat, width, height, border, format, type, pixels]);
        });
        this.texParameteri = vi.fn((target, pname, param) => {
            this.trackCall('texParameteri', [target, pname, param]);
        });
        this.deleteTexture = vi.fn((texture) => {
            this.trackCall('deleteTexture', [texture]);
        });
        // Framebuffer methods
        this.createFramebuffer = vi.fn(() => {
            this.trackCall('createFramebuffer', []);
            return {};
        });
        this.bindFramebuffer = vi.fn((target, framebuffer) => {
            this.trackCall('bindFramebuffer', [target, framebuffer]);
            this.boundFramebuffer = framebuffer;
        });
        this.framebufferTexture2D = vi.fn((target, attachment, textarget, texture, level) => {
            this.trackCall('framebufferTexture2D', [target, attachment, textarget, texture, level]);
        });
        this.deleteFramebuffer = vi.fn((framebuffer) => {
            this.trackCall('deleteFramebuffer', [framebuffer]);
        });
        // Uniform methods
        this.getUniformLocation = vi.fn((program, name) => {
            this.trackCall('getUniformLocation', [program, name]);
            return { name };
        });
        this.uniform1f = vi.fn((location, x) => {
            this.trackCall('uniform1f', [location, x]);
        });
        this.uniform1i = vi.fn((location, x) => {
            this.trackCall('uniform1i', [location, x]);
        });
        this.uniform2f = vi.fn((location, x, y) => {
            this.trackCall('uniform2f', [location, x, y]);
        });
        this.uniform3f = vi.fn((location, x, y, z) => {
            this.trackCall('uniform3f', [location, x, y, z]);
        });
        this.uniform4f = vi.fn((location, x, y, z, w) => {
            this.trackCall('uniform4f', [location, x, y, z, w]);
        });
        this.uniformMatrix4fv = vi.fn((location, transpose, value) => {
            this.trackCall('uniformMatrix4fv', [location, transpose, value]);
        });
        // Attribute methods
        this.getAttribLocation = vi.fn((program, name) => {
            this.trackCall('getAttribLocation', [program, name]);
            return 0;
        });
        this.vertexAttribPointer = vi.fn((index, size, type, normalized, stride, offset) => {
            this.trackCall('vertexAttribPointer', [index, size, type, normalized, stride, offset]);
        });
        this.enableVertexAttribArray = vi.fn((index) => {
            this.trackCall('enableVertexAttribArray', [index]);
        });
        this.disableVertexAttribArray = vi.fn((index) => {
            this.trackCall('disableVertexAttribArray', [index]);
        });
        // Drawing methods
        this.drawArrays = vi.fn((mode, first, count) => {
            this.trackCall('drawArrays', [mode, first, count]);
        });
        this.drawElements = vi.fn((mode, count, type, offset) => {
            this.trackCall('drawElements', [mode, count, type, offset]);
        });
        // State methods
        this.blendFunc = vi.fn((sfactor, dfactor) => {
            this.trackCall('blendFunc', [sfactor, dfactor]);
        });
        this.depthFunc = vi.fn((func) => {
            this.trackCall('depthFunc', [func]);
        });
        this.cullFace = vi.fn((mode) => {
            this.trackCall('cullFace', [mode]);
        });
        this.frontFace = vi.fn((mode) => {
            this.trackCall('frontFace', [mode]);
        });
        this.scissor = vi.fn((x, y, width, height) => {
            this.trackCall('scissor', [x, y, width, height]);
        });
        // Extension methods
        this.getExtension = vi.fn((name) => {
            this.trackCall('getExtension', [name]);
            if (name === 'WEBGL_lose_context') {
                return {
                    loseContext: vi.fn(),
                    restoreContext: vi.fn(),
                };
            }
            if (name === 'OES_texture_float') {
                return {};
            }
            if (name === 'WEBGL_debug_renderer_info') {
                return {
                    UNMASKED_VENDOR_WEBGL: 0x9245,
                    UNMASKED_RENDERER_WEBGL: 0x9246,
                };
            }
            return null;
        });
        this.getSupportedExtensions = vi.fn(() => {
            this.trackCall('getSupportedExtensions', []);
            return ['WEBGL_lose_context', 'OES_texture_float'];
        });
        // Parameter methods
        this.getParameter = vi.fn((pname) => {
            this.trackCall('getParameter', [pname]);
            // Return reasonable defaults for common parameters
            const params = {
                0x0D31: 4096, // MAX_TEXTURE_SIZE
                0x0D33: 1024, // MAX_VIEWPORT_DIMS
                0x0DF5: 8, // MAX_TEXTURE_IMAGE_UNITS
                0x0B4D: 8, // MAX_VERTEX_ATTRIBS
                0x8869: 16, // MAX_COMBINED_TEXTURE_IMAGE_UNITS
                0x8B4D: 1024, // MAX_VERTEX_UNIFORM_VECTORS
                0x8B4F: 1024, // MAX_FRAGMENT_UNIFORM_VECTORS
            };
            return params[pname] ?? 0;
        });
        // Error handling
        this.getError = vi.fn(() => {
            this.trackCall('getError', []);
            return 0; // NO_ERROR
        });
        // Other methods
        this.flush = vi.fn(() => {
            this.trackCall('flush', []);
        });
        this.finish = vi.fn(() => {
            this.trackCall('finish', []);
        });
        this.readPixels = vi.fn((x, y, width, height, format, type, pixels) => {
            this.trackCall('readPixels', [x, y, width, height, format, type, pixels]);
        });
        this.activeTexture = vi.fn((texture) => {
            this.trackCall('activeTexture', [texture]);
        });
        this.pixelStorei = vi.fn((pname, param) => {
            this.trackCall('pixelStorei', [pname, param]);
        });
        this.lineWidth = vi.fn((width) => {
            this.trackCall('lineWidth', [width]);
        });
        this.polygonOffset = vi.fn((factor, units) => {
            this.trackCall('polygonOffset', [factor, units]);
        });
        this.sampleCoverage = vi.fn((value, invert) => {
            this.trackCall('sampleCoverage', [value, invert]);
        });
        this.stencilFunc = vi.fn((func, ref, mask) => {
            this.trackCall('stencilFunc', [func, ref, mask]);
        });
        this.stencilOp = vi.fn((fail, zfail, zpass) => {
            this.trackCall('stencilOp', [fail, zfail, zpass]);
        });
        this.stencilMask = vi.fn((mask) => {
            this.trackCall('stencilMask', [mask]);
        });
        this.depthMask = vi.fn((flag) => {
            this.trackCall('depthMask', [flag]);
        });
        this.depthRange = vi.fn((zNear, zFar) => {
            this.trackCall('depthRange', [zNear, zFar]);
        });
        this.colorMask = vi.fn((red, green, blue, alpha) => {
            this.trackCall('colorMask', [red, green, blue, alpha]);
        });
        this.clearStencil = vi.fn((s) => {
            this.trackCall('clearStencil', [s]);
        });
    }
    trackCall(method, args) {
        this.calls.push({ method, args });
    }
    // Reset for clean tests
    reset() {
        this.calls = [];
        this.currentProgram = null;
        this.boundBuffer = null;
        this.boundTexture = null;
        this.boundFramebuffer = null;
    }
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Create a mock WebGL canvas element
 */
export function createMockCanvas() {
    const canvas = document.createElement('canvas');
    const context = new MockWebGLRenderingContext();
    context.canvas = canvas;
    // Mock getContext
    canvas.getContext = vi.fn((contextId) => {
        if (contextId === 'webgl' || contextId === 'webgl2') {
            return context;
        }
        return null;
    });
    return canvas;
}
/**
 * Mock Three.js scene capabilities
 */
export function createMockThreeScene() {
    return {
        add: vi.fn(),
        remove: vi.fn(),
        children: [],
        traverse: vi.fn((callback) => {
            // Mock implementation
        }),
    };
}
/**
 * Mock Three.js renderer capabilities
 */
export function createMockRenderer() {
    return {
        domElement: createMockCanvas(),
        setSize: vi.fn(),
        setPixelRatio: vi.fn(),
        setClearColor: vi.fn(),
        clear: vi.fn(),
        render: vi.fn(),
        dispose: vi.fn(),
        info: {
            render: {
                calls: 0,
                vertices: 0,
                faces: 0,
                points: 0,
            },
            memory: {
                geometries: 0,
                textures: 0,
                programs: 0,
            },
        },
        shadowMap: {
            enabled: false,
        },
    };
}
/**
 * Mock Three.js camera
 */
export function createMockCamera() {
    return {
        position: { x: 0, y: 0, z: 5 },
        lookAt: vi.fn(),
        updateProjectionMatrix: vi.fn(),
        projectionMatrix: {
            elements: new Float32Array(16),
        },
        matrixWorldInverse: {
            elements: new Float32Array(16),
        },
    };
}
/**
 * Create a mock Three.js geometry
 */
export function createMockGeometry() {
    return {
        attributes: {},
        setAttribute: vi.fn(),
        getAttribute: vi.fn(() => ({ array: new Float32Array(0) })),
        dispose: vi.fn(),
        computeBoundingBox: vi.fn(),
        computeBoundingSphere: vi.fn(),
    };
}
/**
 * Create a mock Three.js material
 */
export function createMockMaterial() {
    return {
        color: { set: vi.fn(), getHex: vi.fn(() => 0xffffff) },
        transparent: false,
        opacity: 1,
        dispose: vi.fn(),
        needsUpdate: false,
        uniforms: {},
    };
}
/**
 * Create a mock Three.js mesh
 */
export function createMockMesh() {
    return {
        geometry: createMockGeometry(),
        material: createMockMaterial(),
        position: { x: 0, y: 0, z: 0, set: vi.fn() },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1, set: vi.fn() },
        visible: true,
        matrix: { elements: new Float32Array(16) },
        matrixWorld: { elements: new Float32Array(16) },
        updateMatrix: vi.fn(),
        updateMatrixWorld: vi.fn(),
        clone: vi.fn(function () { return { ...this }; }),
    };
}
// ============================================================================
// Shader Test Helpers
// ============================================================================
/**
 * Validate GLSL shader syntax (basic checks)
 */
export function validateShaderSyntax(shaderSource) {
    const errors = [];
    // Check for balanced braces
    let braceCount = 0;
    for (const char of shaderSource) {
        if (char === '{')
            braceCount++;
        if (char === '}')
            braceCount--;
        if (braceCount < 0) {
            errors.push('Unmatched closing brace');
            break;
        }
    }
    if (braceCount !== 0) {
        errors.push('Unmatched opening brace');
    }
    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of shaderSource) {
        if (char === '(')
            parenCount++;
        if (char === ')')
            parenCount--;
        if (parenCount < 0) {
            errors.push('Unmatched closing parenthesis');
            break;
        }
    }
    if (parenCount !== 0) {
        errors.push('Unmatched opening parenthesis');
    }
    // Check for main function
    if (!shaderSource.includes('void main()')) {
        errors.push('Missing main() function');
    }
    // Check for gl_Position or gl_FragColor
    if (!shaderSource.includes('gl_Position') && !shaderSource.includes('gl_FragColor')) {
        errors.push('Missing required output variable');
    }
    return { valid: errors.length === 0, errors };
}
/**
 * Check if shader compiles (mock)
 */
export function mockShaderCompile(gl, shader, source) {
    // In real tests, this would use the WebGL context
    const validation = validateShaderSyntax(source);
    return validation.valid;
}
//# sourceMappingURL=webgl.js.map