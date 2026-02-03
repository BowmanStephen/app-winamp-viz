/**
 * Terminal Theme
 *
 * Matrix/terminal monochrome theme:
 * - Green phosphor on black
 * - Amber option
 * - Terminal font styling
 * - Scanline heavy
 *
 * Authentic recreation of classic terminal aesthetics
 *
 * @module themes/Terminal
 */

import type { Theme, ColorPalette } from "../types";

// ============================================================================
// Terminal Color Palettes
// ============================================================================

export type PhosphorColor = "green" | "amber" | "white" | "blue";

/**
 * Green phosphor palette (most common, Matrix-style)
 */
export const TERMINAL_GREEN_PALETTE: ColorPalette = {
  /** Primary - Green phosphor */
  primary: "#33FF33",

  /** Secondary - Dim green */
  secondary: "#22AA22",

  /** Background - Dark terminal black */
  background: "#0A0A0A",

  /** Foreground - Bright green */
  foreground: "#33FF33",

  /** Muted - Dim green */
  muted: "#1A441A",

  /**
   * Spectrum analyzer - shades of green
   */
  spectrum: [
    "#004400", // Very dim
    "#008800",
    "#00CC00",
    "#00FF00", // Bright
    "#33FF33",
    "#66FF66", // Lighter
    "#99FF99",
    "#CCFFCC",
  ],

  /**
   * Gradients
   */
  gradients: [
    {
      name: "phosphor_green",
      colors: ["#0A0A0A", "#33FF33"],
      positions: [0, 1],
    },
    {
      name: "terminal_spectrum",
      colors: ["#004400", "#00FF00", "#CCFFCC"],
      positions: [0, 0.5, 1],
    },
    {
      name: "scanlines",
      colors: ["#0A0A0A", "#112211"],
      positions: [0, 1],
    },
  ],
};

/**
 * Amber phosphor palette (retro terminal)
 */
export const TERMINAL_AMBER_PALETTE: ColorPalette = {
  /** Primary - Amber phosphor */
  primary: "#FFB000",

  /** Secondary - Dim amber */
  secondary: "#AA7700",

  /** Background - Dark terminal black */
  background: "#0A0A0A",

  /** Foreground - Bright amber */
  foreground: "#FFB000",

  /** Muted - Dim amber */
  muted: "#443311",

  /**
   * Spectrum analyzer - shades of amber
   */
  spectrum: [
    "#442200", // Very dim
    "#884400",
    "#CC6600",
    "#FF8800",
    "#FFB000", // Bright
    "#FFCC44",
    "#FFE699",
    "#FFF4CC",
  ],

  /**
   * Gradients
   */
  gradients: [
    {
      name: "phosphor_amber",
      colors: ["#0A0A0A", "#FFB000"],
      positions: [0, 1],
    },
    {
      name: "terminal_spectrum",
      colors: ["#442200", "#FFB000", "#FFE699"],
      positions: [0, 0.5, 1],
    },
    {
      name: "scanlines",
      colors: ["#0A0A0A", "#221A0A"],
      positions: [0, 1],
    },
  ],
};

/**
 * White phosphor palette (monochrome terminal)
 */
export const TERMINAL_WHITE_PALETTE: ColorPalette = {
  /** Primary - White phosphor */
  primary: "#E0E0E0",

  /** Secondary - Gray */
  secondary: "#808080",

  /** Background - Dark terminal black */
  background: "#0A0A0A",

  /** Foreground - White */
  foreground: "#E0E0E0",

  /** Muted - Dark gray */
  muted: "#404040",

  /**
   * Spectrum analyzer - grayscale
   */
  spectrum: [
    "#111111", // Very dim
    "#333333",
    "#555555",
    "#777777",
    "#999999",
    "#BBBBBB",
    "#DDDDDD",
    "#FFFFFF", // Bright
  ],

  /**
   * Gradients
   */
  gradients: [
    {
      name: "phosphor_white",
      colors: ["#0A0A0A", "#E0E0E0"],
      positions: [0, 1],
    },
    {
      name: "terminal_spectrum",
      colors: ["#111111", "#888888", "#FFFFFF"],
      positions: [0, 0.5, 1],
    },
    {
      name: "scanlines",
      colors: ["#0A0A0A", "#141414"],
      positions: [0, 1],
    },
  ],
};

/**
 * Blue phosphor palette (PLATO/IBM)
 */
export const TERMINAL_BLUE_PALETTE: ColorPalette = {
  /** Primary - Blue phosphor */
  primary: "#44AAFF",

  /** Secondary - Dim blue */
  secondary: "#2266AA",

  /** Background - Dark terminal black */
  background: "#0A0A0A",

  /** Foreground - Bright blue */
  foreground: "#44AAFF",

  /** Muted - Dim blue */
  muted: "#112244",

  /**
   * Spectrum analyzer - shades of blue
   */
  spectrum: [
    "#001144", // Very dim
    "#002288",
    "#0033CC",
    "#0044FF",
    "#2266FF",
    "#4488FF",
    "#66AAFF",
    "#88CCFF",
  ],

  /**
   * Gradients
   */
  gradients: [
    {
      name: "phosphor_blue",
      colors: ["#0A0A0A", "#44AAFF"],
      positions: [0, 1],
    },
    {
      name: "terminal_spectrum",
      colors: ["#001144", "#44AAFF", "#88CCFF"],
      positions: [0, 0.5, 1],
    },
    {
      name: "scanlines",
      colors: ["#0A0A0A", "#0A111A"],
      positions: [0, 1],
    },
  ],
};

// ============================================================================
// Shader Uniforms
// ============================================================================

export const TERMINAL_SHADER_UNIFORMS = {
  /** Base brightness - CRTs were dimmer */
  u_brightness: 0.9,

  /** Contrast level - high contrast for readability */
  u_contrast: 1.2,

  /** Saturation - monochrome, no saturation */
  u_saturation: 0.0,

  /** Glow intensity - strong phosphor glow */
  u_glow: 0.5,

  /** Motion blur amount - heavy for persistence */
  u_motionBlur: 0.4,

  /** Color cycling speed - none for monochrome */
  u_colorCycleSpeed: 0.0,

  /** Warp/distortion amount - minimal */
  u_warp: 0.05,

  /** Zoom sensitivity to audio - minimal */
  u_zoomSensitivity: 0.5,

  /** Rotation speed - slow */
  u_rotationSpeed: 0.1,

  /** Particle trail length - long persistence */
  u_trailLength: 0.6,

  /** Phosphor decay rate - slow decay */
  u_phosphorDecay: 0.95,

  /** Grid overlay opacity - strong scanlines */
  u_gridOpacity: 0.3,

  /** Scanline intensity - heavy */
  u_scanlineIntensity: 0.4,

  /** RGB separation amount - none for monochrome */
  u_rgbSeparation: 0.0,

  /** Curvature - strong for old CRTs */
  u_curvature: 0.05,
} as const;

// ============================================================================
// Complete Terminal Themes
// ============================================================================

export const TerminalGreenTheme: Theme = {
  id: "terminal-green",
  name: "Terminal (Green Phosphor)",
  author: "Winamp Viz Team",
  version: "1.0.0",
  description:
    "Classic green phosphor terminal - the authentic monochrome monitor experience with Matrix-style aesthetics",

  palette: TERMINAL_GREEN_PALETTE,

  shaderUniforms: TERMINAL_SHADER_UNIFORMS,

  builtIn: true,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
};

export const TerminalAmberTheme: Theme = {
  id: "terminal-amber",
  name: "Terminal (Amber Phosphor)",
  author: "Winamp Viz Team",
  version: "1.0.0",
  description:
    "Retro amber phosphor terminal - the warm glow of classic monochrome monitors",

  palette: TERMINAL_AMBER_PALETTE,

  shaderUniforms: TERMINAL_SHADER_UNIFORMS,

  builtIn: true,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
};

export const TerminalWhiteTheme: Theme = {
  id: "terminal-white",
  name: "Terminal (White Phosphor)",
  author: "Winamp Viz Team",
  version: "1.0.0",
  description:
    "Clean white phosphor terminal - the pure monochrome P4 phosphor experience",

  palette: TERMINAL_WHITE_PALETTE,

  shaderUniforms: {
    ...TERMINAL_SHADER_UNIFORMS,
    u_glow: 0.3,
  },

  builtIn: true,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
};

export const TerminalBlueTheme: Theme = {
  id: "terminal-blue",
  name: "Terminal (Blue Phosphor)",
  author: "Winamp Viz Team",
  version: "1.0.0",
  description:
    "IBM/PLATO blue phosphor terminal - the rare P39 phosphor experience",

  palette: TERMINAL_BLUE_PALETTE,

  shaderUniforms: TERMINAL_SHADER_UNIFORMS,

  builtIn: true,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
};

// ============================================================================
// Terminal CSS Variables
// ============================================================================

export const getTerminalCSSVariables = (
  phosphor: PhosphorColor = "green",
): string => {
  const palettes: Record<PhosphorColor, ColorPalette> = {
    green: TERMINAL_GREEN_PALETTE,
    amber: TERMINAL_AMBER_PALETTE,
    white: TERMINAL_WHITE_PALETTE,
    blue: TERMINAL_BLUE_PALETTE,
  };

  const palette = palettes[phosphor];

  return `
:root[data-theme="terminal-${phosphor}"] {
  /* Core phosphor color */
  --terminal-phosphor: ${palette.primary};
  --terminal-phosphor-dim: ${palette.secondary};
  --terminal-background: ${palette.background};
  --terminal-foreground: ${palette.foreground};
  --terminal-muted: ${palette.muted};

  /* Phosphor glow effects */
  --terminal-glow-small: 0 0 4px ${palette.primary};
  --terminal-glow-medium: 0 0 8px ${palette.primary}, 0 0 16px ${palette.primary};
  --terminal-glow-large: 0 0 16px ${palette.primary}, 0 0 32px ${palette.primary}, 0 0 48px ${palette.primary};

  /* Scanlines - heavy for terminals */
  --terminal-scanline-opacity: 0.4;
  --terminal-scanline-spacing: 4px;

  /* Fonts - monospace terminal fonts */
  --terminal-font: 'Courier New', 'Courier', 'Lucida Console', monospace;
  --terminal-font-size: 12px;
  --terminal-font-size-large: 14px;
  --terminal-font-size-small: 10px;
  --terminal-line-height: 1.2;

  /* Cursor */
  --terminal-cursor-color: ${palette.primary};
  --terminal-cursor-blink: 1s;

  /* CRT effects */
  --terminal-curvature: 0.05;
  --terminal-flicker: 0.03;
  --terminal-phosphor-decay: 0.95;
}
`;
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get palette for a phosphor color
 * @param phosphor - Phosphor color type
 * @returns Color palette
 */
export function getTerminalPalette(phosphor: PhosphorColor): ColorPalette {
  const palettes: Record<PhosphorColor, ColorPalette> = {
    green: TERMINAL_GREEN_PALETTE,
    amber: TERMINAL_AMBER_PALETTE,
    white: TERMINAL_WHITE_PALETTE,
    blue: TERMINAL_BLUE_PALETTE,
  };
  return palettes[phosphor];
}

/**
 * Get text glow style for phosphor type
 * @param phosphor - Phosphor color type
 * @returns CSS text-shadow value
 */
export function getTerminalGlow(phosphor: PhosphorColor): string {
  const colors: Record<PhosphorColor, string> = {
    green: "#33FF33",
    amber: "#FFB000",
    white: "#E0E0E0",
    blue: "#44AAFF",
  };

  const color = colors[phosphor];
  return `0 0 4px ${color}, 0 0 8px ${color}, 0 0 16px ${color}`;
}

/**
 * Get spectrum color for terminal theme
 * @param index - Bin index
 * @param barCount - Total bars
 * @param phosphor - Phosphor type
 * @returns Hex color
 */
export function getTerminalSpectrumColor(
  index: number,
  barCount: number,
  phosphor: PhosphorColor,
): string {
  const palette = getTerminalPalette(phosphor);
  const normalizedIndex = index / barCount;
  const colorIndex = Math.floor(normalizedIndex * palette.spectrum.length);
  const color =
    palette.spectrum[Math.min(colorIndex, palette.spectrum.length - 1)];
  return typeof color === "string" ? color : "#33FF00";
}

/**
 * Apply terminal theme to document
 * @param phosphor - Phosphor color type
 */
export function applyTerminalTheme(phosphor: PhosphorColor = "green"): void {
  const root = document.documentElement;
  const palette = getTerminalPalette(phosphor);

  // Set theme attribute
  root.setAttribute("data-theme", `terminal-${phosphor}`);

  // Apply CSS variables
  root.style.setProperty(
    "--theme-primary",
    typeof palette.primary === "string" ? palette.primary : "#33FF00",
  );
  root.style.setProperty(
    "--theme-secondary",
    typeof palette.secondary === "string" ? palette.secondary : "#1A8000",
  );
  root.style.setProperty(
    "--theme-background",
    typeof palette.background === "string" ? palette.background : "#0A0A0A",
  );
  root.style.setProperty(
    "--theme-foreground",
    typeof palette.foreground === "string" ? palette.foreground : "#33FF00",
  );
  root.style.setProperty(
    "--theme-muted",
    typeof palette.muted === "string" ? palette.muted : "#1A331A",
  );

  // Apply spectrum colors
  palette.spectrum.forEach((color, index) => {
    const colorValue = typeof color === "string" ? color : "#33FF00";
    root.style.setProperty(`--theme-spectrum-${index}`, colorValue);
  });

  // Inject CSS
  const styleId = "terminal-theme-styles";
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = getTerminalCSSVariables(phosphor);
}

// ============================================================================
// Terminal UI Styles
// ============================================================================

/**
 * Get terminal-style text CSS
 * @param phosphor - Phosphor color type
 * @returns CSS string
 */
export function getTerminalTextStyles(
  phosphor: PhosphorColor = "green",
): string {
  const glow = getTerminalGlow(phosphor);
  const palette = getTerminalPalette(phosphor);

  return `
    color: ${palette.primary};
    font-family: 'Courier New', monospace;
    font-size: 12px;
    text-shadow: ${glow};
    background: transparent;
  `;
}

/**
 * Get terminal-style container CSS
 * @param phosphor - Phosphor color type
 * @returns CSS string
 */
export function getTerminalContainerStyles(
  phosphor: PhosphorColor = "green",
): string {
  const palette = getTerminalPalette(phosphor);

  return `
    background-color: ${palette.background};
    border: 1px solid ${palette.muted};
    box-shadow: 0 0 20px rgba(${phosphor === "green" ? "51, 255, 51" : phosphor === "amber" ? "255, 176, 0" : phosphor === "blue" ? "68, 170, 255" : "224, 224, 224"}, 0.2);
  `;
}

/**
 * Get terminal scanline overlay CSS
 * @returns CSS string for scanlines
 */
export function getTerminalScanlineStyles(): string {
  return `
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0) 0px,
      rgba(0, 0, 0, 0.4) 2px,
      rgba(0, 0, 0, 0) 4px
    );
    background-size: 100% 4px;
    pointer-events: none;
  `;
}

// ============================================================================
// All Terminal Themes Export
// ============================================================================

export const ALL_TERMINAL_THEMES: Theme[] = [
  TerminalGreenTheme,
  TerminalAmberTheme,
  TerminalWhiteTheme,
  TerminalBlueTheme,
];

// ============================================================================
// Default Export
// ============================================================================

export default TerminalGreenTheme;
