/**
 * Cyber Theme
 *
 * Cyberpunk neon theme:
 * - Neon pink/cyan/purple
 * - Glowing effects
 * - Dark background
 * - Modern retro aesthetic
 *
 * Inspired by cyberpunk aesthetics, synthwave, and neon-noir
 *
 * @module themes/Cyber
 */

import type { Theme, ColorPalette } from "../types";

// ============================================================================
// Cyberpunk Color Palette
// ============================================================================

/**
 * Cyberpunk neon color palette
 *
 * Vibrant neon colors against dark backgrounds
 * inspired by synthwave and cyberpunk aesthetics
 */
export const CYBER_PALETTE: ColorPalette = {
  /** Primary accent - Neon pink/magenta */
  primary: "#FF00FF",

  /** Secondary accent - Cyan */
  secondary: "#00FFFF",

  /** Background - Dark cyberpunk black/purple */
  background: "#0D0D1A",

  /** Foreground/text - Bright white */
  foreground: "#E0E0E0",

  /** Muted/subtle - Dark purple/gray */
  muted: "#4A4A6A",

  /**
   * Spectrum analyzer - full neon spectrum
   * Pink → Red → Orange → Yellow → Cyan → Blue → Purple
   */
  spectrum: [
    "#FF0040", // Neon red-pink
    "#FF0080", // Hot pink
    "#FF00C0", // Magenta
    "#FF00FF", // Neon pink
    "#C000FF", // Violet
    "#8000FF", // Purple
    "#4000FF", // Indigo
    "#0040FF", // Blue
    "#0080FF", // Light blue
    "#00C0FF", // Cyan-blue
    "#00FFFF", // Neon cyan
    "#00FFC0", // Cyan-green
    "#40FF80", // Neon green
    "#80FF40", // Lime
    "#C0FF00", // Yellow-green
    "#FFFF00", // Neon yellow
  ],

  /**
   * Gradients for cyberpunk effects
   */
  gradients: [
    {
      name: "neon_pink",
      colors: ["#FF00FF", "#FF0080", "#FF0040"],
      positions: [0, 0.5, 1] as number[],
    },
    {
      name: "neon_cyan",
      colors: ["#00FFFF", "#00C0FF", "#0080FF"],
      positions: [0, 0.5, 1] as number[],
    },
    {
      name: "cyber_sunset",
      colors: ["#FF00FF", "#FF8000", "#FFFF00"],
      positions: [0, 0.5, 1] as number[],
    },
    {
      name: "cyber_ocean",
      colors: ["#00FFFF", "#0080FF", "#4000FF"],
      positions: [0, 0.5, 1] as number[],
    },
    {
      name: "cyber_matrix",
      colors: ["#00FF00", "#00FFFF", "#FF00FF"],
      positions: [0, 0.5, 1] as number[],
    },
    {
      name: "cyber_danger",
      colors: ["#FF0000", "#FF0040", "#FF0080"],
      positions: [0, 0.5, 1] as number[],
    },
    {
      name: "cyber_purple_haze",
      colors: ["#8000FF", "#C000FF", "#FF00FF"],
      positions: [0, 0.5, 1] as number[],
    },
  ],
};

// ============================================================================
// Shader Uniforms for Cyberpunk Effects
// ============================================================================

export const CYBER_SHADER_UNIFORMS = {
  /** Base brightness - neon is bright */
  u_brightness: 1.3,

  /** Contrast level - high contrast for neon pop */
  u_contrast: 1.15,

  /** Saturation boost - neon needs to be vivid */
  u_saturation: 1.4,

  /** Glow intensity - strong neon bloom */
  u_glow: 0.6,

  /** Motion blur amount - smooth trails */
  u_motionBlur: 0.25,

  /** Color cycling speed - fast for energy */
  u_colorCycleSpeed: 0.8,

  /** Warp/distortion amount - digital glitch */
  u_warp: 0.35,

  /** Zoom sensitivity to audio - high */
  u_zoomSensitivity: 2.0,

  /** Rotation speed - dynamic */
  u_rotationSpeed: 0.5,

  /** Particle trail length - medium trails */
  u_trailLength: 0.35,

  /** Phosphor decay rate - medium decay */
  u_phosphorDecay: 0.75,

  /** Grid overlay opacity - strong digital grid */
  u_gridOpacity: 0.2,

  /** Scanline intensity - moderate */
  u_scanlineIntensity: 0.15,

  /** RGB separation amount - chromatic aberration */
  u_rgbSeparation: 0.03,

  /** Additional cyber effects */
  u_glitchIntensity: 0.1,
  u_gridFade: 0.3,
  u_neonPulse: 0.4,
} as const;

// ============================================================================
// Complete Cyberpunk Theme
// ============================================================================

export const CyberTheme: Theme = {
  id: "cyberpunk-neon",
  name: "Cyberpunk Neon",
  author: "Winamp Viz Team",
  version: "1.0.0",
  description:
    "Cyberpunk neon aesthetic - vibrant pink and cyan against dark backgrounds with synthwave vibes",

  palette: CYBER_PALETTE,

  shaderUniforms: CYBER_SHADER_UNIFORMS,

  builtIn: true,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
};

// ============================================================================
// Alternative Cyberpunk Variants
// ============================================================================

/**
 * Synthwave variant - pink/purple gradients
 */
export const SynthwavePalette: ColorPalette = {
  primary: "#FF00AA",
  secondary: "#00DDFF",
  background: "#1A0A2E",
  foreground: "#FFE4FF",
  muted: "#5A4A6E",
  spectrum: [
    "#FF00AA",
    "#FF00FF",
    "#AA00FF",
    "#5500FF",
    "#0055FF",
    "#00AAFF",
    "#00FFFF",
  ],
  gradients: [
    {
      name: "synthwave_sunset",
      colors: ["#FF00AA", "#FF5500", "#FFAA00"],
      positions: [0, 0.5, 1],
    },
  ],
};

export const SynthwaveTheme: Theme = {
  id: "synthwave",
  name: "Synthwave",
  author: "Winamp Viz Team",
  version: "1.0.0",
  description: "Synthwave aesthetic - pink sunsets and purple nights",

  palette: SynthwavePalette,

  shaderUniforms: {
    ...CYBER_SHADER_UNIFORMS,
    u_colorCycleSpeed: 0.5,
    u_warp: 0.25,
  },

  builtIn: true,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
};

/**
 * Matrix variant - green neon
 */
export const MatrixPalette: ColorPalette = {
  primary: "#00FF41",
  secondary: "#008F11",
  background: "#0D0208",
  foreground: "#E0FFE0",
  muted: "#1A3A1A",
  spectrum: ["#003B00", "#008F00", "#00BB00", "#00FF00", "#41FF41", "#80FF80"],
  gradients: [
    {
      name: "matrix_code",
      colors: ["#0D0208", "#008F11", "#00FF41"],
      positions: [0, 0.5, 1],
    },
  ],
};

export const MatrixTheme: Theme = {
  id: "matrix",
  name: "Matrix",
  author: "Winamp Viz Team",
  version: "1.0.0",
  description: "Matrix code aesthetic - green neon rain",

  palette: MatrixPalette,

  shaderUniforms: {
    ...CYBER_SHADER_UNIFORMS,
    u_colorCycleSpeed: 0.2,
    u_scanlineIntensity: 0.3,
  },

  builtIn: true,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
};

/**
 * Neon Noir variant - dark with bright accents
 */
export const NeonNoirPalette: ColorPalette = {
  primary: "#FF0044",
  secondary: "#00CCFF",
  background: "#050505",
  foreground: "#E0E0E0",
  muted: "#2A2A2A",
  spectrum: ["#330011", "#660022", "#990033", "#CC0044", "#FF0044", "#FF3377"],
  gradients: [
    {
      name: "noir_neon",
      colors: ["#050505", "#330011", "#FF0044"],
      positions: [0, 0.5, 1],
    },
  ],
};

export const NeonNoirTheme: Theme = {
  id: "neon-noir",
  name: "Neon Noir",
  author: "Winamp Viz Team",
  version: "1.0.0",
  description: "Neon noir aesthetic - dark with striking red accents",

  palette: NeonNoirPalette,

  shaderUniforms: {
    ...CYBER_SHADER_UNIFORMS,
    u_brightness: 1.1,
    u_glow: 0.4,
  },

  builtIn: true,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
};

// ============================================================================
// Cyber CSS Variables
// ============================================================================

export const CYBER_CSS_VARIABLES = `
:root[data-theme="cyberpunk-neon"] {
  /* Core neon colors */
  --cyber-primary: #FF00FF;
  --cyber-secondary: #00FFFF;
  --cyber-background: #0D0D1A;
  --cyber-foreground: #E0E0E0;
  --cyber-muted: #4A4A6A;

  /* Neon glow effects */
  --cyber-glow-pink: 0 0 10px #FF00FF, 0 0 20px #FF00FF, 0 0 40px #FF00FF;
  --cyber-glow-cyan: 0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 40px #00FFFF;
  --cyber-glow-purple: 0 0 10px #8000FF, 0 0 20px #8000FF, 0 0 40px #8000FF;
  --cyber-glow-mixed: 0 0 10px #FF00FF, 0 0 20px #00FFFF;

  /* Grid colors */
  --cyber-grid: rgba(0, 255, 255, 0.2);
  --cyber-grid-bright: rgba(0, 255, 255, 0.4);

  /* Cyber UI elements */
  --cyber-border-glow: 1px solid rgba(255, 0, 255, 0.5);
  --cyber-border-cyan: 1px solid rgba(0, 255, 255, 0.5);

  /* Fonts - tech fonts */
  --cyber-font-primary: 'Courier New', 'Consolas', monospace;
  --cyber-font-display: 'Lucida Console', 'Monaco', monospace;
  --cyber-font-size: 12px;
  --cyber-font-size-large: 14px;

  /* Animation timing - faster for cyber */
  --cyber-animation-fast: 50ms;
  --cyber-animation-normal: 150ms;
  --cyber-animation-slow: 300ms;

  /* Effects */
  --cyber-scanline-opacity: 0.12;
  --cyber-glitch-intensity: 0.1;
}
`;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get neon glow color for a spectrum position
 * @param index - Position in spectrum (0-1)
 * @returns Hex color
 */
export function getCyberGlowColor(index: number): string {
  const colors = CYBER_PALETTE.spectrum;
  const colorIndex = Math.floor(index * colors.length);
  const color = colors[Math.min(colorIndex, colors.length - 1)];
  return typeof color === "string" ? color : "#FF00FF";
}

/**
 * Generate random neon color
 * @returns Random neon hex color
 */
export function getRandomNeonColor(): string {
  const neons = [
    "#FF00FF", // Pink
    "#00FFFF", // Cyan
    "#FF0040", // Red-pink
    "#8000FF", // Purple
    "#00FF80", // Green-cyan
    "#FFFF00", // Yellow
    "#FF8000", // Orange
  ];
  const randomIndex = Math.floor(Math.random() * neons.length);
  return neons[randomIndex] ?? "#FF00FF";
}

/**
 * Get glow box-shadow for a color
 * @param color - Hex color
 * @param intensity - Glow intensity (0-1)
 * @returns Box-shadow string
 */
export function getNeonGlow(color: string, intensity: number = 1): string {
  const size = 10 * intensity;
  return `
    0 0 ${size}px ${color},
    0 0 ${size * 2}px ${color},
    0 0 ${size * 4}px ${color}
  `;
}

/**
 * Get spectrum color for cyber theme
 * @param index - Bin index
 * @param barCount - Total bars
 * @returns Hex color
 */
export function getCyberSpectrumColor(index: number, barCount: number): string {
  const normalizedIndex = index / barCount;
  const colorIndex = Math.floor(
    normalizedIndex * CYBER_PALETTE.spectrum.length,
  );
  const color =
    CYBER_PALETTE.spectrum[
      Math.min(colorIndex, CYBER_PALETTE.spectrum.length - 1)
    ];
  return typeof color === "string" ? color : "#FF00FF";
}

/**
 * Apply cyber theme to document
 */
export function applyCyberTheme(): void {
  const root = document.documentElement;
  const palette = CYBER_PALETTE;

  // Set theme attribute
  root.setAttribute("data-theme", "cyberpunk-neon");

  // Apply CSS variables
  root.style.setProperty(
    "--theme-primary",
    typeof palette.primary === "string" ? palette.primary : "#FF00FF",
  );
  root.style.setProperty(
    "--theme-secondary",
    typeof palette.secondary === "string" ? palette.secondary : "#00FFFF",
  );
  root.style.setProperty(
    "--theme-background",
    typeof palette.background === "string" ? palette.background : "#0D0D1A",
  );
  root.style.setProperty(
    "--theme-foreground",
    typeof palette.foreground === "string" ? palette.foreground : "#E0E0E0",
  );
  root.style.setProperty(
    "--theme-muted",
    typeof palette.muted === "string" ? palette.muted : "#4A4A6A",
  );

  // Apply spectrum colors
  palette.spectrum.forEach((color, index) => {
    const colorValue = typeof color === "string" ? color : "#FF00FF";
    root.style.setProperty(`--theme-spectrum-${index}`, colorValue);
  });

  // Inject CSS
  const styleId = "cyber-theme-styles";
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = CYBER_CSS_VARIABLES;
}

// ============================================================================
// Cyber UI Styles
// ============================================================================

/**
 * Get cyber-style neon text CSS
 * @param color - Neon color (default pink)
 * @returns CSS string
 */
export function getCyberTextStyles(color: string = "#FF00FF"): string {
  return `
    color: ${color};
    font-family: 'Courier New', monospace;
    font-size: 12px;
    text-shadow: 0 0 4px ${color}, 0 0 8px ${color}, 0 0 16px ${color};
    letter-spacing: 1px;
    background: transparent;
  `;
}

/**
 * Get cyber-style container CSS
 * @returns CSS string
 */
export function getCyberContainerStyles(): string {
  return `
    background-color: rgba(13, 13, 26, 0.9);
    border: 1px solid rgba(255, 0, 255, 0.3);
    box-shadow: 
      0 0 20px rgba(255, 0, 255, 0.2),
      inset 0 0 40px rgba(0, 255, 255, 0.05);
    backdrop-filter: blur(4px);
  `;
}

/**
 * Get cyber-style button CSS
 * @param variant - Button variant
 * @returns CSS string
 */
export function getCyberButtonStyles(
  variant: "primary" | "secondary" | "danger" = "primary",
): string {
  const colors = {
    primary: "#FF00FF",
    secondary: "#00FFFF",
    danger: "#FF0040",
  };

  const color = colors[variant];

  return `
    background: transparent;
    color: ${color};
    border: 1px solid ${color};
    font-family: 'Courier New', monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 2px;
    padding: 6px 16px;
    cursor: pointer;
    box-shadow: 
      inset 0 0 10px rgba(${color}, 0.2),
      0 0 10px rgba(${color}, 0.3);
    transition: all 0.15s;
  `;
}

/**
 * Get cyber-style grid overlay CSS
 * @returns CSS string
 */
export function getCyberGridStyles(): string {
  return `
    background-image:
      linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  `;
}

// ============================================================================
// All Cyber Themes
// ============================================================================

export const ALL_CYBER_THEMES: Theme[] = [
  CyberTheme,
  SynthwaveTheme,
  MatrixTheme,
  NeonNoirTheme,
];

// ============================================================================
// Default Export
// ============================================================================

export default CyberTheme;
