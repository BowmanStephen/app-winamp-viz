/**
 * WinampClassic Theme
 *
 * Complete Winamp 1997 theme configuration:
 * - Color palette (green #00FF00, black background)
 * - Font stack (Courier New, monospace)
 * - Button styles
 * - Window chrome
 * - Equalizer colors
 *
 * Authentic recreation of the classic Winamp 2.x aesthetic
 *
 * @module themes/WinampClassic
 */

import type { Theme, ColorPalette } from "../types";

// ============================================================================
// Winamp Classic 1997 Color Palette
// ============================================================================

/**
 * Authentic Winamp 2.x color palette
 *
 * The iconic lime green (#00FF00) on black defined an era of digital music.
 */
export const WINAMP_CLASSIC_PALETTE: ColorPalette = {
  /** Primary accent - the iconic Winamp green */
  primary: "#00FF00",

  /** Secondary accent - blue for variety */
  secondary: "#0088FF",

  /** Background - pure black for contrast */
  background: "#000000",

  /** Foreground/text - silver gray */
  foreground: "#C0C0C0",

  /** Muted/subtle - dark gray */
  muted: "#404040",

  /**
   * Spectrum analyzer colors
   * Classic Winamp spectrum: Red → Yellow → Green → Cyan → Blue
   */
  spectrum: [
    "#FF0000", // Red (low frequencies)
    "#FF4000", // Red-orange
    "#FF8000", // Orange
    "#FFC000", // Orange-yellow
    "#FFFF00", // Yellow
    "#C0FF00", // Yellow-green
    "#80FF00", // Light green
    "#00FF00", // Green (mid frequencies)
    "#00FF80", // Green-cyan
    "#00FFFF", // Cyan
    "#0080FF", // Light blue
    "#0040FF", // Blue
    "#0000FF", // Blue (high frequencies)
    "#4000FF", // Blue-purple
    "#8000FF", // Purple
    "#C000FF", // Purple-magenta
  ],

  /**
   * Gradients for various UI elements
   */
  gradients: [
    {
      name: "winamp_green",
      colors: ["#000000", "#00FF00"],
      positions: [0, 1],
    },
    {
      name: "winamp_spectrum",
      colors: [
        "#FF0000",
        "#FFFF00",
        "#00FF00",
        "#00FFFF",
        "#0000FF",
        "#FF00FF",
      ],
      positions: [0, 0.2, 0.4, 0.6, 0.8, 1],
    },
    {
      name: "title_bar",
      colors: ["#2B2B2B", "#1A1A1A"],
      positions: [0, 1],
    },
    {
      name: "equalizer_bg",
      colors: ["#000000", "#101010"],
      positions: [0, 1],
    },
  ],
};

// ============================================================================
// Shader Uniforms for Milkdrop
// ============================================================================

export const WINAMP_SHADER_UNIFORMS = {
  /** Base brightness */
  u_brightness: 1.2,

  /** Contrast level */
  u_contrast: 1.1,

  /** Saturation boost */
  u_saturation: 1.3,

  /** Glow intensity */
  u_glow: 0.4,

  /** Motion blur amount */
  u_motionBlur: 0.15,

  /** Color cycling speed */
  u_colorCycleSpeed: 0.5,

  /** Warp/distortion amount */
  u_warp: 0.25,

  /** Zoom sensitivity to audio */
  u_zoomSensitivity: 1.5,

  /** Rotation speed */
  u_rotationSpeed: 0.3,

  /** Particle trail length */
  u_trailLength: 0.3,

  /** Phosphor decay rate */
  u_phosphorDecay: 0.85,

  /** Grid overlay opacity */
  u_gridOpacity: 0.1,

  /** Scanline intensity */
  u_scanlineIntensity: 0.2,

  /** RGB separation amount */
  u_rgbSeparation: 0.02,
} as const;

// ============================================================================
// Complete Winamp Classic Theme
// ============================================================================

export const WinampClassicTheme: Theme = {
  id: "winamp-classic-1997",
  name: "Winamp Classic (1997)",
  author: "Winamp Viz Team",
  version: "2.0.0",
  description:
    "Authentic Winamp 2.x aesthetic - the legendary lime green on black that defined digital music visualization",

  palette: WINAMP_CLASSIC_PALETTE,

  shaderUniforms: WINAMP_SHADER_UNIFORMS,

  builtIn: true,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
};

// ============================================================================
// Winamp Classic UI Styles
// ============================================================================

/**
 * CSS custom properties for Winamp Classic theme
 * These can be applied to :root or a container element
 */
export const WINAMP_CSS_VARIABLES = `
:root[data-theme="winamp-classic"] {
  /* Core palette */
  --winamp-primary: #00FF00;
  --winamp-secondary: #0088FF;
  --winamp-background: #000000;
  --winamp-foreground: #C0C0C0;
  --winamp-muted: #404040;

  /* Window chrome */
  --winamp-titlebar-bg: #2B2B2B;
  --winamp-titlebar-text: #C0C0C0;
  --winamp-border-light: #808080;
  --winamp-border-dark: #404040;

  /* Button styling */
  --winamp-button-face: #C0C0C0;
  --winamp-button-highlight: #FFFFFF;
  --winamp-button-shadow: #808080;
  --winamp-button-dark-shadow: #404040;
  --winamp-button-text: #000000;

  /* Display elements */
  --winamp-display-bg: #000000;
  --winamp-display-text: #00FF00;
  --winamp-display-dim: #008000;

  /* Spectrum analyzer */
  --winamp-spectrum-red: #FF0000;
  --winamp-spectrum-yellow: #FFFF00;
  --winamp-spectrum-green: #00FF00;
  --winamp-spectrum-cyan: #00FFFF;
  --winamp-spectrum-blue: #0000FF;

  /* Equalizer bands */
  --winamp-eq-band1: #FF0000;
  --winamp-eq-band2: #FF8000;
  --winamp-eq-band3: #FFFF00;
  --winamp-eq-band4: #80FF00;
  --winamp-eq-band5: #00FF00;
  --winamp-eq-band6: #00FF80;
  --winamp-eq-band7: #00FFFF;
  --winamp-eq-band8: #0080FF;
  --winamp-eq-band9: #0000FF;
  --winamp-eq-band10: #8000FF;

  /* Fonts */
  --winamp-font-primary: 'Courier New', 'Courier', monospace;
  --winamp-font-display: 'Courier New', monospace;
  --winamp-font-small: 10px;
  --winamp-font-normal: 11px;
  --winamp-font-large: 12px;

  /* Spacing (1px increments for pixel-perfect look) */
  --winamp-space-1: 1px;
  --winamp-space-2: 2px;
  --winamp-space-4: 4px;
  --winamp-space-8: 8px;

  /* Animation timing */
  --winamp-animation-fast: 16.67ms;
  --winamp-animation-normal: 33.33ms;
  --winamp-animation-slow: 100ms;

  /* CRT effects */
  --winamp-scanline-opacity: 0.15;
  --winamp-phosphor-glow: 0.3;
  --winamp-curvature: 0.02;
}
`;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get spectrum color for a given frequency bin
 * @param index - Bin index (0 to barCount-1)
 * @param barCount - Total number of bars
 * @returns Hex color string
 */
export function getWinampSpectrumColor(
  index: number,
  barCount: number,
): string {
  const colors = WINAMP_CLASSIC_PALETTE.spectrum;
  const normalizedIndex = index / barCount;
  const colorIndex = Math.floor(normalizedIndex * colors.length);
  const color = colors[Math.min(colorIndex, colors.length - 1)];
  return typeof color === "string" ? color : "#00FF00";
}

/**
 * Get equalizer band color
 * @param band - Band index (0-9)
 * @returns Hex color string
 */
export function getWinampEqualizerColor(band: number): string {
  const colors = [
    "#FF0000", // 60Hz - Red
    "#FF8000", // 170Hz - Orange
    "#FFFF00", // 310Hz - Yellow
    "#80FF00", // 600Hz - Yellow-Green
    "#00FF00", // 1kHz - Green
    "#00FF80", // 3kHz - Cyan-Green
    "#00FFFF", // 6kHz - Cyan
    "#0080FF", // 12kHz - Blue
    "#0000FF", // 14kHz - Dark Blue
    "#8000FF", // 16kHz - Purple
  ];
  const clampedIndex = Math.min(Math.max(0, band), colors.length - 1);
  return colors[clampedIndex] ?? "#00FF00";
}

/**
 * Apply Winamp Classic theme to document
 */
export function applyWinampClassicTheme(): void {
  const root = document.documentElement;

  // Set theme attribute
  root.setAttribute("data-theme", "winamp-classic");

  // Apply CSS variables
  const palette = WINAMP_CLASSIC_PALETTE;

  root.style.setProperty(
    "--theme-primary",
    typeof palette.primary === "string" ? palette.primary : "#00FF00",
  );
  root.style.setProperty(
    "--theme-secondary",
    typeof palette.secondary === "string" ? palette.secondary : "#008000",
  );
  root.style.setProperty(
    "--theme-background",
    typeof palette.background === "string" ? palette.background : "#000000",
  );
  root.style.setProperty(
    "--theme-foreground",
    typeof palette.foreground === "string" ? palette.foreground : "#00FF00",
  );
  root.style.setProperty(
    "--theme-muted",
    typeof palette.muted === "string" ? palette.muted : "#404040",
  );

  // Apply spectrum colors
  palette.spectrum.forEach((color, index) => {
    const colorValue = typeof color === "string" ? color : "#00FF00";
    root.style.setProperty(`--theme-spectrum-${index}`, colorValue);
  });

  // Inject CSS
  const styleId = "winamp-classic-theme-styles";
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = WINAMP_CSS_VARIABLES;
}

/**
 * Get Winamp-style button CSS
 * @returns CSS string for buttons
 */
export function getWinampButtonStyles(): string {
  return `
    background-color: #C0C0C0;
    border: 2px solid;
    border-color: #FFFFFF #404040 #404040 #FFFFFF;
    color: #000000;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    padding: 2px 8px;
    cursor: pointer;
    image-rendering: pixelated;
  `;
}

/**
 * Get Winamp-style display CSS (for time/numbers)
 * @returns CSS string for displays
 */
export function getWinampDisplayStyles(): string {
  return `
    background-color: #000000;
    color: #00FF00;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    padding: 2px 4px;
    border: 1px solid #404040;
    text-shadow: 0 0 4px #00FF00;
  `;
}

// ============================================================================
// Default Export
// ============================================================================

export default WinampClassicTheme;
