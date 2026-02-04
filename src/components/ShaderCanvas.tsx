import { type FC, useEffect, useRef } from "react";
import type { ShaderChannel, ShaderDefinition } from "../shaders";

interface ShaderCanvasProps {
  shader: ShaderDefinition;
}

const MAX_DEVICE_PIXEL_RATIO = 1;
const CHANNEL_COUNT = 4;

interface ShaderUniforms {
  resolution: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  timeDelta: WebGLUniformLocation | null;
  frame: WebGLUniformLocation | null;
  mouse: WebGLUniformLocation | null;
  frameRate: WebGLUniformLocation | null;
  channelResolution: WebGLUniformLocation | null;
  channelSamplers: Array<WebGLUniformLocation | null>;
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const createShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("[ShaderCanvas] Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const createProgram = (
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram | null => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("[ShaderCanvas] Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
};

const extractPrecision = (
  source: string,
): { precision: "lowp" | "mediump" | "highp"; body: string } => {
  const ifdefRegex =
    /#ifdef\s+GL_ES[\s\S]*?precision\s+(lowp|mediump|highp)\s+float\s*;[\s\S]*?#endif/;
  const ifdefMatch = source.match(ifdefRegex);
  if (ifdefMatch) {
    const precision = ifdefMatch[1] as "lowp" | "mediump" | "highp";
    return { precision, body: source.replace(ifdefRegex, "") };
  }

  const precisionRegex = /precision\s+(lowp|mediump|highp)\s+float\s*;/;
  const precisionMatch = source.match(precisionRegex);
  if (precisionMatch) {
    const precision = precisionMatch[1] as "lowp" | "mediump" | "highp";
    return { precision, body: source.replace(precisionRegex, "") };
  }

  return { precision: "highp", body: source };
};

const buildFragmentShader = (source: string): string => {
  const { precision, body } = extractPrecision(source);

  return `
precision ${precision} float;

uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec4 iMouse;
uniform float iFrameRate;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
uniform vec3 iChannelResolution[4];

#if __VERSION__ < 300
#define texture texture2D
#endif

void mainImage(out vec4 fragColor, in vec2 fragCoord);

void main() {
  vec4 fragColor = vec4(0.0);
  mainImage(fragColor, gl_FragCoord.xy);
  gl_FragColor = fragColor;
}

${body}
`;
};

const isPowerOfTwo = (value: number) => (value & (value - 1)) === 0;

const createFallbackTexture = (gl: WebGLRenderingContext): WebGLTexture | null => {
  const texture = gl.createTexture();
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 255]),
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
};

const applyTextureParams = (
  gl: WebGLRenderingContext,
  channel: ShaderChannel | undefined,
  width: number,
  height: number,
) => {
  const wrap = channel?.wrap === "repeat" ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  const filter = channel?.filter === "nearest" ? gl.NEAREST : gl.LINEAR;

  const pow2 = isPowerOfTwo(width) && isPowerOfTwo(height);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, pow2 ? wrap : gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, pow2 ? wrap : gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);

  if (pow2 && filter === gl.LINEAR) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }
};

export const ShaderCanvas: FC<ShaderCanvasProps> = ({ shader }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      console.error("[ShaderCanvas] WebGL not supported");
      return;
    }

    const fragmentSource = buildFragmentShader(shader.fragment);
    const program = createProgram(gl, VERTEX_SHADER_SOURCE, fragmentSource);
    if (!program) return;

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uniforms: ShaderUniforms = {
      resolution: gl.getUniformLocation(program, "iResolution"),
      time: gl.getUniformLocation(program, "iTime"),
      timeDelta: gl.getUniformLocation(program, "iTimeDelta"),
      frame: gl.getUniformLocation(program, "iFrame"),
      mouse: gl.getUniformLocation(program, "iMouse"),
      frameRate: gl.getUniformLocation(program, "iFrameRate"),
      channelResolution: gl.getUniformLocation(program, "iChannelResolution[0]"),
      channelSamplers: [
        gl.getUniformLocation(program, "iChannel0"),
        gl.getUniformLocation(program, "iChannel1"),
        gl.getUniformLocation(program, "iChannel2"),
        gl.getUniformLocation(program, "iChannel3"),
      ],
    };

    const channelResolution = new Float32Array(CHANNEL_COUNT * 3);
    const channelTextures: Array<WebGLTexture | null> = new Array(CHANNEL_COUNT).fill(null);

    for (let i = 0; i < CHANNEL_COUNT; i += 1) {
      const fallback = createFallbackTexture(gl);
      channelTextures[i] = fallback;
      channelResolution[i * 3] = 1;
      channelResolution[i * 3 + 1] = 1;
      channelResolution[i * 3 + 2] = 1;

      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, fallback);
      const sampler = uniforms.channelSamplers[i] ?? null;
      if (sampler) {
        gl.uniform1i(sampler, i);
      }
    }

    const channels = shader.channels ?? [];
    let disposed = false;

    channels.forEach((channel, index) => {
      if (index >= CHANNEL_COUNT) return;
      if (!channel.url || channel.url.trim().length === 0) {
        return;
      }

      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        if (disposed) return;
        gl.activeTexture(gl.TEXTURE0 + index);
        const texture = channelTextures[index] ?? gl.createTexture();
        if (!texture) return;
        channelTextures[index] = texture;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        applyTextureParams(gl, channel, image.width, image.height);

        channelResolution[index * 3] = image.width;
        channelResolution[index * 3 + 1] = image.height;
        channelResolution[index * 3 + 2] = 1;
      };
      image.onerror = () => {
        if (disposed) return;
        console.warn("[ShaderCanvas] Failed to load channel texture:", channel.url);
      };
      image.src = channel.url;
    });

    let animationId: number | null = null;
    let startTime = performance.now();
    let lastTime = startTime;
    let frame = 0;

    const mouse = {
      x: 0,
      y: 0,
      z: -1,
      w: -1,
      down: false,
    };

    const updateMousePosition = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvas.width / rect.width);
      const y = (rect.bottom - event.clientY) * (canvas.height / rect.height);
      mouse.x = x;
      mouse.y = y;
      if (!mouse.down) {
        mouse.z = -1;
        mouse.w = -1;
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      mouse.down = true;
      updateMousePosition(event);
      mouse.z = mouse.x;
      mouse.w = mouse.y;
    };

    const handleMouseUp = (event: MouseEvent) => {
      mouse.down = false;
      updateMousePosition(event);
      mouse.z = -1;
      mouse.w = -1;
    };

    const handleMouseMove = (event: MouseEvent) => {
      updateMousePosition(event);
    };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
      const width = Math.max(1, Math.floor(window.innerWidth * dpr));
      const height = Math.max(1, Math.floor(window.innerHeight * dpr));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseUp);

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (uniforms.resolution) {
        gl.uniform3f(uniforms.resolution, canvas.width, canvas.height, 1);
      }
      if (uniforms.time) gl.uniform1f(uniforms.time, elapsed);
      if (uniforms.timeDelta) gl.uniform1f(uniforms.timeDelta, delta);
      if (uniforms.frame) gl.uniform1i(uniforms.frame, frame);
      if (uniforms.mouse) {
        gl.uniform4f(uniforms.mouse, mouse.x, mouse.y, mouse.z, mouse.w);
      }
      if (uniforms.frameRate && delta > 0) {
        gl.uniform1f(uniforms.frameRate, 1 / delta);
      }
      if (uniforms.channelResolution) {
        gl.uniform3fv(uniforms.channelResolution, channelResolution);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame += 1;
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      disposed = true;
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseUp);
      channelTextures.forEach((texture) => {
        if (texture) gl.deleteTexture(texture);
      });
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    };
  }, [shader]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="winamp-visualizer"
      style={{
        position: "absolute",
        inset: 0,
        width: "100vw",
        height: "100vh",
        display: "block",
      }}
    />
  );
};

export default ShaderCanvas;
