export declare class MockWebGLRenderingContext {
    canvas: HTMLCanvasElement | null;
    drawingBufferWidth: number;
    drawingBufferHeight: number;
    attributes: {
        alpha: boolean;
        depth: boolean;
        stencil: boolean;
        antialias: boolean;
        premultipliedAlpha: boolean;
        preserveDrawingBuffer: boolean;
        powerPreference: string;
    };
    currentProgram: WebGLProgram | null;
    boundBuffer: WebGLBuffer | null;
    boundTexture: WebGLTexture | null;
    boundFramebuffer: WebGLFramebuffer | null;
    calls: {
        method: string;
        args: unknown[];
    }[];
    private trackCall;
    readonly COLOR_BUFFER_BIT = 16384;
    readonly DEPTH_BUFFER_BIT = 256;
    readonly STENCIL_BUFFER_BIT = 1024;
    readonly TRIANGLES = 4;
    readonly TRIANGLE_STRIP = 5;
    readonly TRIANGLE_FAN = 6;
    readonly LINES = 1;
    readonly LINE_STRIP = 3;
    readonly LINE_LOOP = 2;
    readonly POINTS = 0;
    readonly ARRAY_BUFFER = 34962;
    readonly ELEMENT_ARRAY_BUFFER = 34963;
    readonly STATIC_DRAW = 35044;
    readonly DYNAMIC_DRAW = 35048;
    readonly STREAM_DRAW = 35040;
    readonly FLOAT = 5126;
    readonly UNSIGNED_BYTE = 5121;
    readonly UNSIGNED_SHORT = 5123;
    readonly UNSIGNED_INT = 5125;
    readonly DEPTH_TEST = 2929;
    readonly BLEND = 3042;
    readonly CULL_FACE = 2884;
    readonly SCISSOR_TEST = 3089;
    readonly TEXTURE_2D = 3553;
    readonly TEXTURE0 = 33984;
    readonly FRAMEBUFFER = 36160;
    readonly RENDERBUFFER = 36161;
    readonly COLOR_ATTACHMENT0 = 36064;
    readonly DEPTH_ATTACHMENT = 36096;
    readonly VERTEX_SHADER = 35633;
    readonly FRAGMENT_SHADER = 35632;
    readonly COMPILE_STATUS = 35713;
    readonly LINK_STATUS = 35714;
    readonly ACTIVE_UNIFORMS = 35718;
    readonly ACTIVE_ATTRIBUTES = 35721;
    viewport: import("vitest").Mock<[x: number, y: number, width: number, height: number], void>;
    clear: import("vitest").Mock<[mask: number], void>;
    clearColor: import("vitest").Mock<[r: number, g: number, b: number, a: number], void>;
    clearDepth: import("vitest").Mock<[depth: number], void>;
    enable: import("vitest").Mock<[cap: number], void>;
    disable: import("vitest").Mock<[cap: number], void>;
    isEnabled: import("vitest").Mock<[cap: number], boolean>;
    createShader: import("vitest").Mock<[type: number], WebGLShader>;
    shaderSource: import("vitest").Mock<[shader: WebGLShader, source: string], void>;
    compileShader: import("vitest").Mock<[shader: WebGLShader], void>;
    getShaderParameter: import("vitest").Mock<[shader: WebGLShader, pname: number], any>;
    getShaderInfoLog: import("vitest").Mock<[], string>;
    deleteShader: import("vitest").Mock<[shader: WebGLShader], void>;
    createProgram: import("vitest").Mock<[], WebGLProgram>;
    attachShader: import("vitest").Mock<[program: WebGLProgram, shader: WebGLShader], void>;
    linkProgram: import("vitest").Mock<[program: WebGLProgram], void>;
    getProgramParameter: import("vitest").Mock<[program: WebGLProgram, pname: number], any>;
    getProgramInfoLog: import("vitest").Mock<[], string>;
    useProgram: import("vitest").Mock<[program: WebGLProgram | null], void>;
    deleteProgram: import("vitest").Mock<[program: WebGLProgram], void>;
    createBuffer: import("vitest").Mock<[], WebGLBuffer>;
    bindBuffer: import("vitest").Mock<[target: number, buffer: WebGLBuffer | null], void>;
    bufferData: import("vitest").Mock<[target: number, data: number | BufferSource, usage: number], void>;
    bufferSubData: import("vitest").Mock<[target: number, offset: number, data: BufferSource], void>;
    deleteBuffer: import("vitest").Mock<[buffer: WebGLBuffer], void>;
    createTexture: import("vitest").Mock<[], WebGLTexture>;
    bindTexture: import("vitest").Mock<[target: number, texture: WebGLTexture | null], void>;
    texImage2D: import("vitest").Mock<[target: number, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, pixels: ArrayBufferView<ArrayBufferLike> | null], void>;
    texParameteri: import("vitest").Mock<[target: number, pname: number, param: number], void>;
    deleteTexture: import("vitest").Mock<[texture: WebGLTexture], void>;
    createFramebuffer: import("vitest").Mock<[], WebGLFramebuffer>;
    bindFramebuffer: import("vitest").Mock<[target: number, framebuffer: WebGLFramebuffer | null], void>;
    framebufferTexture2D: import("vitest").Mock<[target: number, attachment: number, textarget: number, texture: WebGLTexture, level: number], void>;
    deleteFramebuffer: import("vitest").Mock<[framebuffer: WebGLFramebuffer], void>;
    getUniformLocation: import("vitest").Mock<[program: WebGLProgram, name: string], WebGLUniformLocation>;
    uniform1f: import("vitest").Mock<[location: WebGLUniformLocation | null, x: number], void>;
    uniform1i: import("vitest").Mock<[location: WebGLUniformLocation | null, x: number], void>;
    uniform2f: import("vitest").Mock<[location: WebGLUniformLocation | null, x: number, y: number], void>;
    uniform3f: import("vitest").Mock<[location: WebGLUniformLocation | null, x: number, y: number, z: number], void>;
    uniform4f: import("vitest").Mock<[location: WebGLUniformLocation | null, x: number, y: number, z: number, w: number], void>;
    uniformMatrix4fv: import("vitest").Mock<[location: WebGLUniformLocation | null, transpose: boolean, value: Float32List], void>;
    getAttribLocation: import("vitest").Mock<[program: WebGLProgram, name: string], number>;
    vertexAttribPointer: import("vitest").Mock<[index: number, size: number, type: number, normalized: boolean, stride: number, offset: number], void>;
    enableVertexAttribArray: import("vitest").Mock<[index: number], void>;
    disableVertexAttribArray: import("vitest").Mock<[index: number], void>;
    drawArrays: import("vitest").Mock<[mode: number, first: number, count: number], void>;
    drawElements: import("vitest").Mock<[mode: number, count: number, type: number, offset: number], void>;
    blendFunc: import("vitest").Mock<[sfactor: number, dfactor: number], void>;
    depthFunc: import("vitest").Mock<[func: number], void>;
    cullFace: import("vitest").Mock<[mode: number], void>;
    frontFace: import("vitest").Mock<[mode: number], void>;
    scissor: import("vitest").Mock<[x: number, y: number, width: number, height: number], void>;
    getExtension: import("vitest").Mock<[name: string], {
        loseContext: import("vitest").Mock<any, any>;
        restoreContext: import("vitest").Mock<any, any>;
        UNMASKED_VENDOR_WEBGL?: undefined;
        UNMASKED_RENDERER_WEBGL?: undefined;
    } | {
        loseContext?: undefined;
        restoreContext?: undefined;
        UNMASKED_VENDOR_WEBGL?: undefined;
        UNMASKED_RENDERER_WEBGL?: undefined;
    } | {
        UNMASKED_VENDOR_WEBGL: number;
        UNMASKED_RENDERER_WEBGL: number;
        loseContext?: undefined;
        restoreContext?: undefined;
    } | null>;
    getSupportedExtensions: import("vitest").Mock<[], string[]>;
    getParameter: import("vitest").Mock<[pname: number], {}>;
    getError: import("vitest").Mock<[], number>;
    flush: import("vitest").Mock<[], void>;
    finish: import("vitest").Mock<[], void>;
    readPixels: import("vitest").Mock<[x: number, y: number, width: number, height: number, format: number, type: number, pixels: ArrayBufferView<ArrayBufferLike>], void>;
    activeTexture: import("vitest").Mock<[texture: number], void>;
    pixelStorei: import("vitest").Mock<[pname: number, param: number | boolean], void>;
    lineWidth: import("vitest").Mock<[width: number], void>;
    polygonOffset: import("vitest").Mock<[factor: number, units: number], void>;
    sampleCoverage: import("vitest").Mock<[value: number, invert: boolean], void>;
    stencilFunc: import("vitest").Mock<[func: number, ref: number, mask: number], void>;
    stencilOp: import("vitest").Mock<[fail: number, zfail: number, zpass: number], void>;
    stencilMask: import("vitest").Mock<[mask: number], void>;
    depthMask: import("vitest").Mock<[flag: boolean], void>;
    depthRange: import("vitest").Mock<[zNear: number, zFar: number], void>;
    colorMask: import("vitest").Mock<[red: boolean, green: boolean, blue: boolean, alpha: boolean], void>;
    clearStencil: import("vitest").Mock<[s: number], void>;
    reset(): void;
}
/**
 * Create a mock WebGL canvas element
 */
export declare function createMockCanvas(): HTMLCanvasElement;
/**
 * Mock Three.js scene capabilities
 */
export declare function createMockThreeScene(): {
    add: import("vitest").Mock<any, any>;
    remove: import("vitest").Mock<any, any>;
    children: unknown[];
    traverse: import("vitest").Mock<[callback: (obj: unknown) => void], void>;
};
/**
 * Mock Three.js renderer capabilities
 */
export declare function createMockRenderer(): {
    domElement: HTMLCanvasElement;
    setSize: import("vitest").Mock<any, any>;
    setPixelRatio: import("vitest").Mock<any, any>;
    setClearColor: import("vitest").Mock<any, any>;
    clear: import("vitest").Mock<any, any>;
    render: import("vitest").Mock<any, any>;
    dispose: import("vitest").Mock<any, any>;
    info: {
        render: {
            calls: number;
            vertices: number;
            faces: number;
            points: number;
        };
        memory: {
            geometries: number;
            textures: number;
            programs: number;
        };
    };
    shadowMap: {
        enabled: boolean;
    };
};
/**
 * Mock Three.js camera
 */
export declare function createMockCamera(): {
    position: {
        x: number;
        y: number;
        z: number;
    };
    lookAt: import("vitest").Mock<any, any>;
    updateProjectionMatrix: import("vitest").Mock<any, any>;
    projectionMatrix: {
        elements: Float32Array<ArrayBuffer>;
    };
    matrixWorldInverse: {
        elements: Float32Array<ArrayBuffer>;
    };
};
/**
 * Create a mock Three.js geometry
 */
export declare function createMockGeometry(): {
    attributes: Record<string, unknown>;
    setAttribute: import("vitest").Mock<any, any>;
    getAttribute: import("vitest").Mock<[], {
        array: Float32Array<ArrayBuffer>;
    }>;
    dispose: import("vitest").Mock<any, any>;
    computeBoundingBox: import("vitest").Mock<any, any>;
    computeBoundingSphere: import("vitest").Mock<any, any>;
};
/**
 * Create a mock Three.js material
 */
export declare function createMockMaterial(): {
    color: {
        set: import("vitest").Mock<any, any>;
        getHex: import("vitest").Mock<[], number>;
    };
    transparent: boolean;
    opacity: number;
    dispose: import("vitest").Mock<any, any>;
    needsUpdate: boolean;
    uniforms: Record<string, {
        value: unknown;
    }>;
};
/**
 * Create a mock Three.js mesh
 */
export declare function createMockMesh(): {
    geometry: {
        attributes: Record<string, unknown>;
        setAttribute: import("vitest").Mock<any, any>;
        getAttribute: import("vitest").Mock<[], {
            array: Float32Array<ArrayBuffer>;
        }>;
        dispose: import("vitest").Mock<any, any>;
        computeBoundingBox: import("vitest").Mock<any, any>;
        computeBoundingSphere: import("vitest").Mock<any, any>;
    };
    material: {
        color: {
            set: import("vitest").Mock<any, any>;
            getHex: import("vitest").Mock<[], number>;
        };
        transparent: boolean;
        opacity: number;
        dispose: import("vitest").Mock<any, any>;
        needsUpdate: boolean;
        uniforms: Record<string, {
            value: unknown;
        }>;
    };
    position: {
        x: number;
        y: number;
        z: number;
        set: import("vitest").Mock<any, any>;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    scale: {
        x: number;
        y: number;
        z: number;
        set: import("vitest").Mock<any, any>;
    };
    visible: boolean;
    matrix: {
        elements: Float32Array<ArrayBuffer>;
    };
    matrixWorld: {
        elements: Float32Array<ArrayBuffer>;
    };
    updateMatrix: import("vitest").Mock<any, any>;
    updateMatrixWorld: import("vitest").Mock<any, any>;
    clone: import("vitest").Mock<[], any>;
};
/**
 * Validate GLSL shader syntax (basic checks)
 */
export declare function validateShaderSyntax(shaderSource: string): {
    valid: boolean;
    errors: string[];
};
/**
 * Check if shader compiles (mock)
 */
export declare function mockShaderCompile(gl: WebGLRenderingContext, shader: WebGLShader, source: string): boolean;
//# sourceMappingURL=webgl.d.ts.map