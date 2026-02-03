/**
 * Core Type Definitions for Winamp Visualizer
 * All shared types, interfaces, and type aliases
 */

// ============================================================================
// Vector and Geometry Types
// ============================================================================

/**
 * 2D vector/point representation
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * 3D vector/point representation
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// ============================================================================
// Color Types
// ============================================================================

/**
 * RGB color tuple
 */
export type RGB = [number, number, number];

/**
 * RGBA color tuple with alpha
 */
export type RGBA = [number, number, number, number];

/**
 * Color can be RGB tuple or hex string
 */
export type ColorValue = RGB | string;

// ============================================================================
// Audio Types
// ============================================================================

/**
 * Frequency band identifiers for audio analysis
 */
export type FrequencyBand =
  | "sub" // 20-60 Hz
  | "bass" // 60-250 Hz
  | "lowMid" // 250-500 Hz
  | "mid" // 500-2000 Hz
  | "highMid" // 2000-4000 Hz
  | "treble" // 4000-8000 Hz
  | "air"; // 8000-20000 Hz

/**
 * Audio analysis data structure passed to visualizers
 */
export interface AudioData {
  /** Raw frequency data (0-255) */
  frequencyData: Uint8Array;

  /** Raw waveform/time domain data (0-255, centered at 128) */
  timeDomainData: Uint8Array;

  /** Float version of frequency data in dB */
  floatFrequencyData: Float32Array;

  /** Float version of time domain data (-1 to 1) */
  floatTimeDomainData: Float32Array;

  /** Sample rate of the audio context */
  sampleRate: number;

  /** FFT size used for analysis */
  fftSize: number;

  /** Number of frequency bins */
  frequencyBinCount: number;

  /** Peak amplitude (0-1) */
  peak: number;

  /** RMS (average) amplitude (0-1) */
  rms: number;

  /** Per-band energy levels */
  bands: Record<FrequencyBand, number>;

  /** Timestamp of the analysis */
  timestamp: number;
}

/**
 * Audio source types supported
 */
export type AudioSourceType = "file" | "microphone" | "stream";

/**
 * Audio source configuration
 */
export interface AudioSourceConfig {
  type: AudioSourceType;
  deviceId?: string;
  file?: File;
  url?: string;
  autoPlay?: boolean;
  loop?: boolean;
  volume?: number;
}

// ============================================================================
// Visualizer Types
// ============================================================================

/**
 * Visualizer type identifiers
 */
export type VisualizerType =
  | "spectrum" // Frequency spectrum analyzer
  | "oscilloscope" // Waveform oscilloscope
  | "milkdrop" // Milkdrop-style particle/plasma
  | "bars" // Classic frequency bars
  | "circular" // Circular/radial spectrum
  | "particles"; // Particle system

/**
 * Base configuration shared by all visualizers
 */
export interface VisualizerConfig {
  /** Unique identifier */
  id: string;

  /** Visualizer type */
  type: VisualizerType;

  /** Display name */
  name: string;

  /** Whether the visualizer is enabled */
  enabled: boolean;

  /** Opacity (0-1) */
  opacity: number;

  /** Blend mode for compositing */
  blendMode: "normal" | "additive" | "multiply" | "screen";

  /** Update interval in milliseconds */
  updateInterval: number;

  /** Theme ID to use */
  themeId: string;
}

/**
 * Spectrum analyzer specific configuration
 */
export interface SpectrumConfig extends VisualizerConfig {
  type: "spectrum";

  /** Number of bars to display */
  barCount: number;

  /** Bar width in pixels (0 = auto) */
  barWidth: number;

  /** Gap between bars in pixels */
  barGap: number;

  /** Smoothing factor (0-1) */
  smoothing: number;

  /** Whether to use logarithmic scale */
  logarithmic: boolean;

  /** Minimum frequency to display */
  minFrequency: number;

  /** Maximum frequency to display */
  maxFrequency: number;

  /** Bar animation style */
  animationStyle: "grow" | "fade" | "elastic";

  /** Mirror horizontally */
  mirror: boolean;
}

/**
 * Oscilloscope specific configuration
 */
export interface OscilloscopeConfig extends VisualizerConfig {
  type: "oscilloscope";

  /** Line width in pixels */
  lineWidth: number;

  /** Number of samples to display */
  samples: number;

  /** Line color style */
  colorStyle: "solid" | "gradient" | "rainbow";

  /** Whether to fill the area under the line */
  fill: boolean;

  /** Fill opacity (0-1) */
  fillOpacity: number;

  /** Line style */
  lineStyle: "line" | "dots" | "both";

  /** Trigger mode for stable display */
  trigger: "auto" | "rising" | "falling" | "none";

  /** Time domain offset (0-1) */
  offset: number;
}

/**
 * Milkdrop/particle visualizer configuration
 */
export interface MilkdropConfig extends VisualizerConfig {
  type: "milkdrop";

  /** Number of particles */
  particleCount: number;

  /** Particle size range [min, max] */
  particleSize: [number, number];

  /** Particle lifetime in seconds */
  particleLife: number;

  /** Motion blur amount (0-1) */
  motionBlur: number;

  /** Warp/feedback amount (0-1) */
  warp: number;

  /** Color cycle speed */
  colorCycleSpeed: number;

  /** Camera zoom sensitivity */
  zoomSensitivity: number;

  /** Rotation speed */
  rotationSpeed: number;

  /** Shader preset ID */
  shaderPreset: string;
}

/**
 * Bars visualizer configuration
 */
export interface BarsConfig extends VisualizerConfig {
  type: "bars";

  /** Number of bars */
  count: number;

  /** Bar width */
  width: number;

  /** Bar spacing */
  spacing: number;

  /** Bar orientation */
  orientation: "horizontal" | "vertical";

  /** 3D depth effect (0-1) */
  depth: number;

  /** Reflection effect */
  reflection: boolean;

  /** Reflection opacity */
  reflectionOpacity: number;

  /** Bar rounding radius */
  borderRadius: number;
}

/**
 * Circular/Radial spectrum configuration
 */
export interface CircularConfig extends VisualizerConfig {
  type: "circular";

  /** Inner radius (0-1 relative to canvas size) */
  innerRadius: number;

  /** Outer radius (0-1 relative to canvas size) */
  outerRadius: number;

  /** Number of segments */
  segments: number;

  /** Rotation offset in degrees */
  rotation: number;

  /** Mirror the display */
  mirror: boolean;

  /** Draw center hole */
  hole: boolean;

  /** Hole radius (0-1) */
  holeRadius: number;

  /** Connection style between bars */
  connectionStyle: "gaps" | "connected" | "smooth";
}

/**
 * Particle system configuration
 */
export interface ParticlesConfig extends VisualizerConfig {
  type: "particles";

  /** Maximum number of particles */
  maxParticles: number;

  /** Emission rate (particles per second) */
  emissionRate: number;

  /** Particle size */
  size: number;

  /** Particle size variation */
  sizeVariation: number;

  /** Particle speed */
  speed: number;

  /** Speed variation */
  speedVariation: number;

  /** Particle lifetime in seconds */
  lifetime: number;

  /** Gravity effect (-1 to 1, negative = upward) */
  gravity: number;

  /** Spread angle in degrees */
  spread: number;

  /** Audio reactivity (0-1) */
  reactivity: number;

  /** Color mode */
  colorMode: "spectrum" | "velocity" | "lifetime" | "fixed";
}

/**
 * Union type of all visualizer configs
 */
export type VisualizerConfigUnion =
  | SpectrumConfig
  | OscilloscopeConfig
  | MilkdropConfig
  | BarsConfig
  | CircularConfig
  | ParticlesConfig;

// ============================================================================
// Theme Types
// ============================================================================

/**
 * Color palette definition
 */
export interface ColorPalette {
  /** Primary accent color */
  primary: ColorValue;

  /** Secondary accent color */
  secondary: ColorValue;

  /** Background color */
  background: ColorValue;

  /** Foreground/text color */
  foreground: ColorValue;

  /** Muted/subtle color */
  muted: ColorValue;

  /** Array of colors for spectrum visualization */
  spectrum: ColorValue[];

  /** Gradient stops */
  gradients: Array<{
    name: string;
    colors: ColorValue[];
    positions?: number[];
  }>;
}

/**
 * Theme definition
 */
export interface Theme {
  /** Unique theme identifier */
  id: string;

  /** Theme name */
  name: string;

  /** Theme author */
  author?: string;

  /** Theme version */
  version?: string;

  /** Theme description */
  description?: string;

  /** Color palette */
  palette: ColorPalette;

  /** Custom shader uniforms for Milkdrop */
  shaderUniforms?: Record<string, number | number[]>;

  /** Whether this is a built-in theme */
  builtIn: boolean;

  /** Creation timestamp */
  createdAt: number;

  /** Last modified timestamp */
  modifiedAt: number;
}

// ============================================================================
// Abstract/Base Types
// ============================================================================

/**
 * Base visualizer interface that all visualizers must implement
 */
export interface BaseVisualizer {
  /** Visualizer configuration */
  config: VisualizerConfig;

  /** Initialize the visualizer with a canvas */
  initialize(canvas: HTMLCanvasElement): void;

  /** Render one frame with provided audio data */
  render(audioData: AudioData): void;

  /** Resize the visualizer */
  resize(width: number, height: number): void;

  /** Update configuration */
  updateConfig(config: Partial<VisualizerConfig>): void;

  /** Get current configuration */
  getConfig(): VisualizerConfig;

  /** Destroy/cleanup resources */
  destroy(): void;

  /** Check if visualizer is initialized */
  isInitialized(): boolean;
}

/**
 * Abstract constructor type for visualizers
 */
export type VisualizerConstructor = new (
  config: VisualizerConfig,
) => BaseVisualizer;

// ============================================================================
// Application State Types
// ============================================================================

/**
 * Playback state
 */
export type PlaybackState = "idle" | "loading" | "playing" | "paused" | "error";

/**
 * Application state interface for state management
 */
export interface AppState {
  // Audio
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  sourceNode: MediaElementAudioSourceNode | null;
  audioElement: HTMLAudioElement | null;
  playbackState: PlaybackState;
  volume: number;
  muted: boolean;

  // Visualizers
  activeVisualizers: VisualizerType[];
  visualizerConfigs: Record<string, VisualizerConfig>;
  currentTheme: Theme | null;

  // UI
  isFullscreen: boolean;
  showControls: boolean;
  showPlaylist: boolean;

  // Actions
  setAudioContext: (ctx: AudioContext) => void;
  setAnalyser: (analyser: AnalyserNode) => void;
  setPlaybackState: (state: PlaybackState) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  addVisualizer: (type: VisualizerType) => void;
  removeVisualizer: (type: VisualizerType) => void;
  updateVisualizerConfig: (
    id: string,
    config: Partial<VisualizerConfig>,
  ) => void;
  setTheme: (theme: Theme) => void;
  toggleFullscreen: () => void;
  toggleControls: () => void;
  togglePlaylist: () => void;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Deep partial type for nested updates
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Event callback types
 */
export type AudioDataCallback = (audioData: AudioData) => void;
export type ErrorCallback = (error: Error) => void;
export type StateChangeCallback = (state: PlaybackState) => void;

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Application configuration
 */
export interface AppConfig {
  /** Default FFT size for analysis */
  defaultFftSize: number;

  /** Default smoothing time constant */
  defaultSmoothing: number;

  /** Target FPS for rendering */
  targetFps: number;

  /** Enable debug logging */
  debug: boolean;

  /** Audio constraints */
  audioConstraints: MediaTrackConstraints;

  /** Canvas pixel ratio */
  pixelRatio: number;

  /** Default theme ID */
  defaultThemeId: string;

  /** Maximum visualizer layers */
  maxVisualizerLayers: number;

  /** Enable post-processing effects */
  postProcessing: boolean;
}

// ============================================================================
// Export all types
// ============================================================================

export * from "./index";
