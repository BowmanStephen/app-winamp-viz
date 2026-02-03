// WebGL and Three.js Mock Utilities
// Provides mock implementations for WebGL/Three.js objects used in tests

import { vi } from 'vitest';

// ============================================================================
// Mock WebGL Context with Enhanced Capabilities
// ============================================================================

export class MockWebGLRenderingContext {
  // Canvas reference
  canvas: HTMLCanvasElement | null = null;
  
  // Drawing buffer dimensions
  drawingBufferWidth = 800;
  drawingBufferHeight = 600;
  
  // Context attributes
  attributes = {
    alpha: true,
    depth: true,
    stencil: false,
    antialias: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'default',
  };
  
  // State tracking
  currentProgram: WebGLProgram | null = null;
  boundBuffer: WebGLBuffer | null = null;
  boundTexture: WebGLTexture | null = null;
  boundFramebuffer: WebGLFramebuffer | null = null;
  
  // Tracking calls for assertions
  calls: { method: string; args: unknown[] }[] = [];
  
  private trackCall(method: string, args: unknown[]): void {
    this.calls.push({ method, args });
  }
  
  // Constants
  readonly COLOR_BUFFER_BIT = 0x00004000;
  readonly DEPTH_BUFFER_BIT = 0x00000100;
  readonly STENCIL_BUFFER_BIT = 0x00000400;
  readonly TRIANGLES = 0x0004;
  readonly TRIANGLE_STRIP = 0x0005;
  readonly TRIANGLE_FAN = 0x0006;
  readonly LINES = 0x0001;
  readonly LINE_STRIP = 0x0003;
  readonly LINE_LOOP = 0x0002;
  readonly POINTS = 0x0000;
  readonly ARRAY_BUFFER = 0x8892;
  readonly ELEMENT_ARRAY_BUFFER = 0x8893;
  readonly STATIC_DRAW = 0x88E4;
  readonly DYNAMIC_DRAW = 0x88E8;
  readonly STREAM_DRAW = 0x88E0;
  readonly FLOAT = 0x1406;
  readonly UNSIGNED_BYTE = 0x1401;
  readonly UNSIGNED_SHORT = 0x1403;
  readonly UNSIGNED_INT = 0x1405;
  readonly DEPTH_TEST = 0x0B71;
  readonly BLEND = 0x0BE2;
  readonly CULL_FACE = 0x0B44;
  readonly SCISSOR_TEST = 0x0C11;
  readonly TEXTURE_2D = 0x0DE1;
  readonly TEXTURE0 = 0x84C0;
  readonly FRAMEBUFFER = 0x8D40;
  readonly RENDERBUFFER = 0x8D41;
  readonly COLOR_ATTACHMENT0 = 0x8CE0;
  readonly DEPTH_ATTACHMENT = 0x8D00;
  readonly VERTEX_SHADER = 0x8B31;
  readonly FRAGMENT_SHADER = 0x8B30;
  readonly COMPILE_STATUS = 0x8B81;
  readonly LINK_STATUS = 0x8B82;
  readonly ACTIVE_UNIFORMS = 0x8B86;
  readonly ACTIVE_ATTRIBUTES = 0x8B89;
  
  // Methods
  viewport = vi.fn((x: number, y: number, width: number, height: number) => {
    this.trackCall('viewport', [x, y, width, height]);
  });
  
  clear = vi.fn((mask: number) => {
    this.trackCall('clear', [mask]);
  });
  
  clearColor = vi.fn((r: number, g: number, b: number, a: number) => {
    this.trackCall('clearColor', [r, g, b, a]);
  });
  
  clearDepth = vi.fn((depth: number) => {
    this.trackCall('clearDepth', [depth]);
  });
  
  enable = vi.fn((cap: number) => {
    this.trackCall('enable', [cap]);
  });
  
  disable = vi.fn((cap: number) => {
    this.trackCall('disable', [cap]);
  });
  
  isEnabled = vi.fn((cap: number) => {
    this.trackCall('isEnabled', [cap]);
    return false;
  });
  
  // Shader methods
  createShader = vi.fn((type: number) => {
    this.trackCall('createShader', [type]);
    return { type, compiled: false } as unknown as WebGLShader;
  });
  
  shaderSource = vi.fn((shader: WebGLShader, source: string) => {
    this.trackCall('shaderSource', [shader, source]);
  });
  
  compileShader = vi.fn((shader: WebGLShader) => {
    this.trackCall('compileShader', [shader]);
    (shader as any).compiled = true;
  });
  
  getShaderParameter = vi.fn((shader: WebGLShader, pname: number) => {
    this.trackCall('getShaderParameter', [shader, pname]);
    if (pname === this.COMPILE_STATUS) {
      return (shader as any).compiled;
    }
    return true;
  });
  
  getShaderInfoLog = vi.fn(() => {
    this.trackCall('getShaderInfoLog', []);
    return '';
  });
  
  deleteShader = vi.fn((shader: WebGLShader) => {
    this.trackCall('deleteShader', [shader]);
  });
  
  // Program methods
  createProgram = vi.fn(() => {
    this.trackCall('createProgram', []);
    return { linked: false } as unknown as WebGLProgram;
  });
  
  attachShader = vi.fn((program: WebGLProgram, shader: WebGLShader) => {
    this.trackCall('attachShader', [program, shader]);
  });
  
  linkProgram = vi.fn((program: WebGLProgram) => {
    this.trackCall('linkProgram', [program]);
    (program as any).linked = true;
  });
  
  getProgramParameter = vi.fn((program: WebGLProgram, pname: number) => {
    this.trackCall('getProgramParameter', [program, pname]);
    if (pname === this.LINK_STATUS) {
      return (program as any).linked;
    }
    return 0;
  });
  
  getProgramInfoLog = vi.fn(() => {
    this.trackCall('getProgramInfoLog', []);
    return '';
  });
  
  useProgram = vi.fn((program: WebGLProgram | null) => {
    this.trackCall('useProgram', [program]);
    this.currentProgram = program;
  });
  
  deleteProgram = vi.fn((program: WebGLProgram) => {
    this.trackCall('deleteProgram', [program]);
  });
  
  // Buffer methods
  createBuffer = vi.fn(() => {
    this.trackCall('createBuffer', []);
    return {} as WebGLBuffer;
  });
  
  bindBuffer = vi.fn((target: number, buffer: WebGLBuffer | null) => {
    this.trackCall('bindBuffer', [target, buffer]);
    this.boundBuffer = buffer;
  });
  
  bufferData = vi.fn((target: number, data: BufferSource | number, usage: number) => {
    this.trackCall('bufferData', [target, data, usage]);
  });
  
  bufferSubData = vi.fn((target: number, offset: number, data: BufferSource) => {
    this.trackCall('bufferSubData', [target, offset, data]);
  });
  
  deleteBuffer = vi.fn((buffer: WebGLBuffer) => {
    this.trackCall('deleteBuffer', [buffer]);
  });
  
  // Texture methods
  createTexture = vi.fn(() => {
    this.trackCall('createTexture', []);
    return {} as WebGLTexture;
  });
  
  bindTexture = vi.fn((target: number, texture: WebGLTexture | null) => {
    this.trackCall('bindTexture', [target, texture]);
    this.boundTexture = texture;
  });
  
  texImage2D = vi.fn((
    target: number,
    level: number,
    internalformat: number,
    width: number,
    height: number,
    border: number,
    format: number,
    type: number,
    pixels: ArrayBufferView | null
  ) => {
    this.trackCall('texImage2D', [target, level, internalformat, width, height, border, format, type, pixels]);
  });
  
  texParameteri = vi.fn((target: number, pname: number, param: number) => {
    this.trackCall('texParameteri', [target, pname, param]);
  });
  
  deleteTexture = vi.fn((texture: WebGLTexture) => {
    this.trackCall('deleteTexture', [texture]);
  });
  
  // Framebuffer methods
  createFramebuffer = vi.fn(() => {
    this.trackCall('createFramebuffer', []);
    return {} as WebGLFramebuffer;
  });
  
  bindFramebuffer = vi.fn((target: number, framebuffer: WebGLFramebuffer | null) => {
    this.trackCall('bindFramebuffer', [target, framebuffer]);
    this.boundFramebuffer = framebuffer;
  });
  
  framebufferTexture2D = vi.fn((
    target: number,
    attachment: number,
    textarget: number,
    texture: WebGLTexture,
    level: number
  ) => {
    this.trackCall('framebufferTexture2D', [target, attachment, textarget, texture, level]);
  });
  
  deleteFramebuffer = vi.fn((framebuffer: WebGLFramebuffer) => {
    this.trackCall('deleteFramebuffer', [framebuffer]);
  });
  
  // Uniform methods
  getUniformLocation = vi.fn((program: WebGLProgram, name: string) => {
    this.trackCall('getUniformLocation', [program, name]);
    return { name } as WebGLUniformLocation;
  });
  
  uniform1f = vi.fn((location: WebGLUniformLocation | null, x: number) => {
    this.trackCall('uniform1f', [location, x]);
  });
  
  uniform1i = vi.fn((location: WebGLUniformLocation | null, x: number) => {
    this.trackCall('uniform1i', [location, x]);
  });
  
  uniform2f = vi.fn((location: WebGLUniformLocation | null, x: number, y: number) => {
    this.trackCall('uniform2f', [location, x, y]);
  });
  
  uniform3f = vi.fn((location: WebGLUniformLocation | null, x: number, y: number, z: number) => {
    this.trackCall('uniform3f', [location, x, y, z]);
  });
  
  uniform4f = vi.fn((location: WebGLUniformLocation | null, x: number, y: number, z: number, w: number) => {
    this.trackCall('uniform4f', [location, x, y, z, w]);
  });
  
  uniformMatrix4fv = vi.fn((
    location: WebGLUniformLocation | null,
    transpose: boolean,
    value: Float32List
  ) => {
    this.trackCall('uniformMatrix4fv', [location, transpose, value]);
  });
  
  // Attribute methods
  getAttribLocation = vi.fn((program: WebGLProgram, name: string) => {
    this.trackCall('getAttribLocation', [program, name]);
    return 0;
  });
  
  vertexAttribPointer = vi.fn((
    index: number,
    size: number,
    type: number,
    normalized: boolean,
    stride: number,
    offset: number
  ) => {
    this.trackCall('vertexAttribPointer', [index, size, type, normalized, stride, offset]);
  });
  
  enableVertexAttribArray = vi.fn((index: number) => {
    this.trackCall('enableVertexAttribArray', [index]);
  });
  
  disableVertexAttribArray = vi.fn((index: number) => {
    this.trackCall('disableVertexAttribArray', [index]);
  });
  
  // Drawing methods
  drawArrays = vi.fn((mode: number, first: number, count: number) => {
    this.trackCall('drawArrays', [mode, first, count]);
  });
  
  drawElements = vi.fn((mode: number, count: number, type: number, offset: number) => {
    this.trackCall('drawElements', [mode, count, type, offset]);
  });
  
  // State methods
  blendFunc = vi.fn((sfactor: number, dfactor: number) => {
    this.trackCall('blendFunc', [sfactor, dfactor]);
  });
  
  depthFunc = vi.fn((func: number) => {
    this.trackCall('depthFunc', [func]);
  });
  
  cullFace = vi.fn((mode: number) => {
    this.trackCall('cullFace', [mode]);
  });
  
  frontFace = vi.fn((mode: number) => {
    this.trackCall('frontFace', [mode]);
  });
  
  scissor = vi.fn((x: number, y: number, width: number, height: number) => {
    this.trackCall('scissor', [x, y, width, height]);
  });
  
  // Extension methods
  getExtension = vi.fn((name: string) => {
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
  
  getSupportedExtensions = vi.fn(() => {
    this.trackCall('getSupportedExtensions', []);
    return ['WEBGL_lose_context', 'OES_texture_float'];
  });
  
  // Parameter methods
  getParameter = vi.fn((pname: number) => {
    this.trackCall('getParameter', [pname]);
    
    // Return reasonable defaults for common parameters
    const params: Record<number, unknown> = {
      0x0D31: 4096, // MAX_TEXTURE_SIZE
      0x0D33: 1024, // MAX_VIEWPORT_DIMS
      0x0DF5: 8,    // MAX_TEXTURE_IMAGE_UNITS
      0x0B4D: 8,    // MAX_VERTEX_ATTRIBS
      0x8869: 16,   // MAX_COMBINED_TEXTURE_IMAGE_UNITS
      0x8B4D: 1024, // MAX_VERTEX_UNIFORM_VECTORS
      0x8B4F: 1024, // MAX_FRAGMENT_UNIFORM_VECTORS
    };
    
    return params[pname] ?? 0;
  });
  
  // Error handling
  getError = vi.fn(() => {
    this.trackCall('getError', []);
    return 0; // NO_ERROR
  });
  
  // Other methods
  flush = vi.fn(() => {
    this.trackCall('flush', []);
  });
  
  finish = vi.fn(() => {
    this.trackCall('finish', []);
  });
  
  readPixels = vi.fn((
    x: number,
    y: number,
    width: number,
    height: number,
    format: number,
    type: number,
    pixels: ArrayBufferView
  ) => {
    this.trackCall('readPixels', [x, y, width, height, format, type, pixels]);
  });
  
  activeTexture = vi.fn((texture: number) => {
    this.trackCall('activeTexture', [texture]);
  });
  
  pixelStorei = vi.fn((pname: number, param: number | boolean) => {
    this.trackCall('pixelStorei', [pname, param]);
  });
  
  lineWidth = vi.fn((width: number) => {
    this.trackCall('lineWidth', [width]);
  });
  
  polygonOffset = vi.fn((factor: number, units: number) => {
    this.trackCall('polygonOffset', [factor, units]);
  });
  
  sampleCoverage = vi.fn((value: number, invert: boolean) => {
    this.trackCall('sampleCoverage', [value, invert]);
  });
  
  stencilFunc = vi.fn((func: number, ref: number, mask: number) => {
    this.trackCall('stencilFunc', [func, ref, mask]);
  });
  
  stencilOp = vi.fn((fail: number, zfail: number, zpass: number) => {
    this.trackCall('stencilOp', [fail, zfail, zpass]);
  });
  
  stencilMask = vi.fn((mask: number) => {
    this.trackCall('stencilMask', [mask]);
  });
  
  depthMask = vi.fn((flag: boolean) => {
    this.trackCall('depthMask', [flag]);
  });
  
  depthRange = vi.fn((zNear: number, zFar: number) => {
    this.trackCall('depthRange', [zNear, zFar]);
  });
  
  colorMask = vi.fn((red: boolean, green: boolean, blue: boolean, alpha: boolean) => {
    this.trackCall('colorMask', [red, green, blue, alpha]);
  });
  
  clearStencil = vi.fn((s: number) => {
    this.trackCall('clearStencil', [s]);
  });
  
  // Reset for clean tests
  reset(): void {
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
export function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const context = new MockWebGLRenderingContext();
  context.canvas = canvas;
  
  // Mock getContext
  canvas.getContext = vi.fn((contextId: string) => {
    if (contextId === 'webgl' || contextId === 'webgl2') {
      return context as unknown as WebGLRenderingContext;
    }
    return null;
  }) as any;
  
  return canvas;
}

/**
 * Mock Three.js scene capabilities
 */
export function createMockThreeScene() {
  return {
    add: vi.fn(),
    remove: vi.fn(),
    children: [] as unknown[],
    traverse: vi.fn((callback: (obj: unknown) => void) => {
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
    attributes: {} as Record<string, unknown>,
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
    uniforms: {} as Record<string, { value: unknown }>,
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
    clone: vi.fn(function(this: unknown) { return { ...this }; }),
  };
}

// ============================================================================
// Shader Test Helpers
// ============================================================================

/**
 * Validate GLSL shader syntax (basic checks)
 */
export function validateShaderSyntax(shaderSource: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for balanced braces
  let braceCount = 0;
  for (const char of shaderSource) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
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
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
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
export function mockShaderCompile(
  gl: WebGLRenderingContext,
  shader: WebGLShader,
  source: string
): boolean {
  // In real tests, this would use the WebGL context
  const validation = validateShaderSyntax(source);
  return validation.valid;
}
