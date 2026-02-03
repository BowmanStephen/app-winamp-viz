/**
 * WindowsMediaPlayer Theme
 *
 * Complete Windows Media Player 7 theme configuration:
 * - Blue gradient scheme
 * - Metallic look
 * - Different aesthetic from Winamp
 *
 * Authentic recreation of the Windows Media Player 7 aesthetic
 *
 * @module themes/WindowsMediaPlayer
 */

import type { Theme, ColorPalette } from "../types";

// ============================================================================
// Windows Media Player 7 Color Palette
// ============================================================================

/**
 * Authentic Windows Media Player 7 color palette
 *
 * WMP7 introduced the iconic blue gradient and metallic look
 * that defined Microsoft's media player for years.
 */
export const WMP7_PALETTE: ColorPalette = {
  /** Primary accent - WMP blue */
  primary: "#0078D7",

  /** Secondary accent - lighter blue */
  secondary: "#6CB4EE",

  /** Background - silver/metallic */
  background: "#F0F0F0",

  /** Foreground/text - dark gray */
  foreground: "#202020",

  /** Muted/subtle - medium gray */
  muted: "#808080",

  /**
   * Spectrum analyzer colors
   * WMP7 used a cyan-to-blue gradient
   */
  spectrum: [
    "#00FFFF", // Cyan (low frequencies)
    "#20E0FF",
    "#40C0FF",
    "#60A0FF",
    "#8080FF",
    "#A060FF",
    "#C040FF",
    "#E020FF",
    "#FF00FF", // Magenta (high frequencies)
  ],

  /**
   * Gradients for metallic/3D effects
   */
  gradients: [
    {
      name: "wmp_titlebar",
      colors: ["#0078D7", "#005A9E"],
      positions: [0, 1],
    },
    {
      name: "wmp_metallic",
      colors: ["#FFFFFF", "#E0E0E0", "#C0C0C0", "#A0A0A0"],
      positions: [0, 0.33, 0.66, 1],
    },
    {
      name: "wmp_button",
      colors: ["#F8F8F8", "#E8E8E8"],
      positions: [0, 1],
    },
    {
      name: "wmp_spectrum",
      colors: ["#00FFFF", "#0080FF", "#0000FF", "#8000FF"],
      positions: [0, 0.33, 0.66, 1],
    },
    {
      name: "wmp_display_bg",
      colors: ["#101830", "#000000"],
      positions: [0, 1],
    },
  ],
};

// ============================================================================
// Shader Uniforms for Milkdrop
// ============================================================================

export const WMP7_SHADER_UNIFORMS = {
  /** Base brightness - slightly dimmer than Winamp */
  u_brightness: 1.0,

  /** Contrast level - more subtle */
  u_contrast: 1.05,

  /** Saturation - moderate */
  u_saturation: 1.1,

  /** Glow intensity - soft glow */
  u_glow: 0.25,

  /** Motion blur amount - smoother */
  u_motionBlur: 0.2,

  /** Color cycling speed - slower */
  u_colorCycleSpeed: 0.3,

  /** Warp/distortion amount - subtle */
  u_warp: 0.15,

  /** Zoom sensitivity to audio - moderate */
  u_zoomSensitivity: 1.0,

  /** Rotation speed - gentle */
  u_rotationSpeed: 0.2,

  /** Particle trail length - longer trails */
  u_trailLength: 0.4,

  /** Phosphor decay rate - slower */
  u_phosphorDecay: 0.9,

  /** Grid overlay opacity - subtle grid */
  u_gridOpacity: 0.08,

  /** Scanline intensity - lighter */
  u_scanlineIntensity: 0.1,

  /** RGB separation amount - minimal */
  u_rgbSeparation: 0.01,
} as const;

// ============================================================================
// Complete Windows Media Player 7 Theme
// ============================================================================

export const WindowsMediaPlayerTheme: Theme = {
  id: "windows-media-player-7",
  name: "Windows Media Player 7",
  author: "Winamp Viz Team",
  version: "7.0.0",
  description:
    "Authentic Windows Media Player 7 aesthetic - the blue gradient and metallic look that brought media playback to the mainstream",

  palette: WMP7_PALETTE,

  shaderUniforms: WMP7_SHADER_UNIFORMS,

  builtIn: true,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
};

// ============================================================================
// Windows Media Player 7 UI Styles
// ============================================================================

/**
 * CSS custom properties for Windows Media Player 7 theme
 */
export const WMP7_CSS_VARIABLES = `
:root[data-theme="windows-media-player-7"] {
  /* Core palette - Blue gradient scheme */
  --wmp-primary: #0078D7;
  --wmp-secondary: #6CB4EE;
  --wmp-background: #F0F0F0;
  --wmp-foreground: #202020;
  --wmp-muted: #808080;

  /* Window chrome - Metallic look */
  --wmp-titlebar-bg: linear-gradient(to bottom, #0078D7, #005A9E);
  --wmp-titlebar-text: #FFFFFF;
  --wmp-border-light: #FFFFFF;
  --wmp-border-dark: #808080;
  --wmp-border-darker: #606060;

  /* Metallic surfaces */
  --wmp-metallic-light: #F8F8F8;
  --wmp-metallic-mid: #E0E0E0;
  --wmp-metallic-dark: #C0C0C0;
  --wmp-metallic-darker: #A0A0A0;

  /* Button styling - Rounded 3D */
  --wmp-button-face: linear-gradient(to bottom, #F8F8F8, #E8E8E8);
  --wmp-button-hover: linear-gradient(to bottom, #FFFFFF, #F0F0F0);
  --wmp-button-active: linear-gradient(to bottom, #D0D0D0, #E0E0E0);
  --wmp-button-border: #808080;
  --wmp-button-text: #202020;

  /* Display elements - Dark LCD style */
  --wmp-display-bg: linear-gradient(to bottom, #101830, #000000);
  --wmp-display-text: #00FFFF;
  --wmp-display-dim: #008080;

  /* Spectrum analyzer - Cyan to magenta */
  --wmp-spectrum-cyan: #00FFFF;
  --wmp-spectrum-blue: #0080FF;
  --wmp-spectrum-purple: #8000FF;
  --wmp-spectrum-magenta: #FF00FF;

  /* Control highlights */
  --wmp-play-button: #0078D7;
  --wmp-pause-button: #0078D7;
  --wmp-stop-button: #D00000;
  --wmp-seek-bar: #0078D7;

  /* Fonts - System UI fonts */
  --wmp-font-primary: 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
  --wmp-font-display: 'Lucida Console', 'Consolas', monospace;
  --wmp-font-small: 11px;
  --wmp-font-normal: 12px;
  --wmp-font-large: 14px;

  /* Spacing */
  --wmp-space-1: 1px;
  --wmp-space-2: 2px;
  --wmp-space-4: 4px;
  --wmp-space-8: 8px;
  --wmp-space-12: 12px;
  --wmp-space-16: 16px;

  /* Border radius - slightly rounded for WMP7 */
  --wmp-border-radius-sm: 2px;
  --wmp-border-radius-md: 3px;
  --wmp-border-radius-lg: 4px;

  /* Animation timing */
  --wmp-animation-fast: 100ms;
  --wmp-animation-normal: 200ms;
  --wmp-animation-slow: 300ms;

  /* CRT effects - lighter for WMP */
  --wmp-scanline-opacity: 0.08;
  --wmp-phosphor-glow: 0.15;
  --wmp-curvature: 0.01;
}
`;

// ============================================================================
// Metallic Surface Gradients
// ============================================================================

/**
 * Generate a metallic gradient for raised surfaces
 * @param direction - Gradient direction ('vertical' | 'horizontal')
 * @returns CSS gradient string
 */
export function getMetallicGradient(
  direction: "vertical" | "horizontal" = "vertical",
): string {
  const colors = ["#F8F8F8", "#E0E0E0", "#C0C0C0", "#A0A0A0"];
  const deg = direction === "vertical" ? "180deg" : "90deg";
  return `linear-gradient(${deg}, ${colors.join(", ")})`;
}

/**
 * Generate a button gradient
 * @param state - Button state ('normal' | 'hover' | 'active')
 * @returns CSS gradient string
 */
export function getButtonGradient(
  state: "normal" | "hover" | "active" = "normal",
): string {
  const gradients = {
    normal: "linear-gradient(to bottom, #F8F8F8, #E8E8E8)",
    hover: "linear-gradient(to bottom, #FFFFFF, #F0F0F0)",
    active: "linear-gradient(to bottom, #D0D0D0, #E0E0E0)",
  };
  return gradients[state];
}

// ============================================================================
// Spectrum Analyzer Functions
// ============================================================================

/**
 * Get spectrum color for a given frequency bin
 * WMP7 uses a cyan-to-magenta gradient
 * @param index - Bin index (0 to barCount-1)
 * @param barCount - Total number of bars
 * @returns Hex color string
 */
export function getWMP7SpectrumColor(index: number, barCount: number): string {
  const colors = WMP7_PALETTE.spectrum;
  const normalizedIndex = index / barCount;
  const colorIndex = Math.floor(normalizedIndex * colors.length);
  const color = colors[Math.min(colorIndex, colors.length - 1)];
  return typeof color === "string" ? color : "#00FFFF";
}

/**
 * Get equalizer band color
 * WMP7 uses cyan-to-blue spectrum
 * @param band - Band index (0-9)
 * @returns Hex color string
 */
export function getWMP7EqualizerColor(band: number): string {
  const colors = [
    "#00FFFF", // 60Hz - Cyan
    "#20E0FF", // 170Hz
    "#40C0FF", // 310Hz
    "#60A0FF", // 600Hz
    "#8080FF", // 1kHz
    "#A060FF", // 3kHz
    "#C040FF", // 6kHz
    "#E020FF", // 12kHz
    "#FF00E0", // 14kHz
    "#FF00C0", // 16kHz - Magenta
  ];
  const clampedIndex = Math.min(Math.max(0, band), colors.length - 1);
  return colors[clampedIndex] ?? "#00FFFF";
}

// ============================================================================
// UI Component Styles
// ============================================================================

/**
 * Get WMP7-style title bar CSS
 * @returns CSS string for title bar
 */
export function getWMP7TitleBarStyles(): string {
  return `
    background: linear-gradient(to bottom, #0078D7, #005A9E);
    color: #FFFFFF;
    font-family: 'Segoe UI', 'Tahoma', sans-serif;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 3px 3px 0 0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  `;
}

/**
 * Get WMP7-style button CSS
 * @returns CSS string for buttons
 */
export function getWMP7ButtonStyles(): string {
  return `
    background: linear-gradient(to bottom, #F8F8F8, #E8E8E8);
    border: 1px solid #808080;
    border-radius: 3px;
    color: #202020;
    font-family: 'Segoe UI', sans-serif;
    font-size: 12px;
    padding: 4px 12px;
    cursor: pointer;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  `;
}

/**
 * Get WMP7-style display CSS (for time/info)
 * @returns CSS string for displays
 */
export function getWMP7DisplayStyles(): string {
  return `
    background: linear-gradient(to bottom, #101830, #000000);
    color: #00FFFF;
    font-family: 'Lucida Console', 'Consolas', monospace;
    font-size: 11px;
    padding: 4px 8px;
    border: 1px solid #404040;
    border-radius: 2px;
    text-shadow: 0 0 2px #00FFFF;
  `;
}

/**
 * Get WMP7-style slider/track CSS
 * @returns CSS string for sliders
 */
export function getWMP7SliderStyles(): string {
  return `
    background: linear-gradient(to bottom, #D0D0D0, #E0E0E0);
    border: 1px solid #808080;
    border-radius: 2px;
  `;
}

// ============================================================================
// Theme Application
// ============================================================================

/**
 * Apply Windows Media Player 7 theme to document
 */
export function applyWindowsMediaPlayerTheme(): void {
  const root = document.documentElement;

  // Set theme attribute
  root.setAttribute("data-theme", "windows-media-player-7");

  // Apply CSS variables
  const palette = WMP7_PALETTE;

  root.style.setProperty(
    "--theme-primary",
    typeof palette.primary === "string" ? palette.primary : "#0078D7",
  );
  root.style.setProperty(
    "--theme-secondary",
    typeof palette.secondary === "string" ? palette.secondary : "#005A9E",
  );
  root.style.setProperty(
    "--theme-background",
    typeof palette.background === "string" ? palette.background : "#1A1A2E",
  );
  root.style.setProperty(
    "--theme-foreground",
    typeof palette.foreground === "string" ? palette.foreground : "#FFFFFF",
  );
  root.style.setProperty(
    "--theme-muted",
    typeof palette.muted === "string" ? palette.muted : "#4A4A6A",
  );

  // Apply spectrum colors
  palette.spectrum.forEach((color, index) => {
    const colorValue = typeof color === "string" ? color : "#00FFFF";
    root.style.setProperty(`--theme-spectrum-${index}`, colorValue);
  });

  // Inject CSS
  const styleId = "wmp7-theme-styles";
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = WMP7_CSS_VARIABLES;
}

// ============================================================================
// Default Export
// ============================================================================

export default WindowsMediaPlayerTheme;
