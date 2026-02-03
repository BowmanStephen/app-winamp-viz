/**
 * ThemeManager
 *
 * Manages theme loading, validation, and application for the visualizer system.
 * Provides default themes and handles theme serialization/deserialization.
 *
 * @module ThemeManager
 */

import type { Theme, ColorPalette, ColorValue } from "../types";

/**
 * Default color palette used when no theme is specified
 */
export const DEFAULT_PALETTE: ColorPalette = {
  primary: "#00ff9d",
  secondary: "#00d9ff",
  background: "#0a0a1a",
  foreground: "#eaeaea",
  muted: "#4a4a6a",
  spectrum: [
    "#ff0066", // Deep pink
    "#ff3366", // Pink
    "#ff6633", // Orange
    "#ffcc00", // Yellow
    "#66ff00", // Lime
    "#00ff9d", // Teal
    "#00d9ff", // Cyan
    "#0066ff", // Blue
    "#6600ff", // Purple
    "#cc00ff", // Magenta
  ],
  gradients: [
    {
      name: "neon",
      colors: ["#00ff9d", "#00d9ff"],
    },
    {
      name: "sunset",
      colors: ["#ff0066", "#ff6633", "#ffcc00"],
    },
    {
      name: "ocean",
      colors: ["#0066ff", "#00d9ff"],
    },
  ],
};

/**
 * Winamp Classic theme palette (nostalgic default)
 */
export const WINAMP_CLASSIC_PALETTE: ColorPalette = {
  primary: "#00ff00",
  secondary: "#0088ff",
  background: "#000000",
  foreground: "#c0c0c0",
  muted: "#404040",
  spectrum: [
    "#ff0000", // Red
    "#ff8800", // Orange
    "#ffff00", // Yellow
    "#00ff00", // Green
    "#00ffff", // Cyan
    "#0088ff", // Blue
    "#8800ff", // Purple
    "#ff00ff", // Magenta
  ],
  gradients: [
    {
      name: "classic",
      colors: ["#00ff00", "#0088ff"],
    },
  ],
};

/**
 * Cyberpunk theme palette (modern aesthetic)
 */
export const CYBERPUNK_PALETTE: ColorPalette = {
  primary: "#ff00ff",
  secondary: "#00ffff",
  background: "#0d0d1a",
  foreground: "#e0e0e0",
  muted: "#4a4a6a",
  spectrum: [
    "#ff0040", // Deep red
    "#ff0080", // Hot pink
    "#ff00c0", // Magenta
    "#ff00ff", // Purple
    "#c000ff", // Violet
    "#8000ff", // Indigo
    "#4000ff", // Blue
    "#0040ff", // Cyan
    "#0080ff", // Light blue
    "#00c0ff", // Cyan
    "#00ffff", // Bright cyan
  ],
  gradients: [
    {
      name: "neon_pink",
      colors: ["#ff00ff", "#ff0080"],
    },
    {
      name: "neon_cyan",
      colors: ["#00ffff", "#0080ff"],
    },
    {
      name: "cyber",
      colors: ["#ff00ff", "#00ffff"],
    },
  ],
};

/**
 * Monochrome theme palette (minimalist)
 */
export const MONOCHROME_PALETTE: ColorPalette = {
  primary: "#ffffff",
  secondary: "#a0a0a0",
  background: "#0a0a0a",
  foreground: "#eaeaea",
  muted: "#404040",
  spectrum: [
    "#404040",
    "#606060",
    "#808080",
    "#a0a0a0",
    "#c0c0c0",
    "#e0e0e0",
    "#ffffff",
  ],
  gradients: [
    {
      name: "mono",
      colors: ["#808080", "#ffffff"],
    },
  ],
};

/**
 * Built-in themes available by default
 */
export const BUILT_IN_THEMES: Theme[] = [
  {
    id: "winamp-classic",
    name: "Winamp Classic",
    author: "Winamp Viz Team",
    version: "1.0.0",
    description: "Classic Winamp green/black aesthetic",
    palette: WINAMP_CLASSIC_PALETTE,
    builtIn: true,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    author: "Winamp Viz Team",
    version: "1.0.0",
    description: "Neon cyberpunk aesthetic with pink and cyan",
    palette: CYBERPUNK_PALETTE,
    builtIn: true,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  },
  {
    id: "monochrome",
    name: "Monochrome",
    author: "Winamp Viz Team",
    version: "1.0.0",
    description: "Clean black and white minimal aesthetic",
    palette: MONOCHROME_PALETTE,
    builtIn: true,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  },
  {
    id: "default",
    name: "Default",
    author: "Winamp Viz Team",
    version: "1.0.0",
    description: "Modern default theme with vibrant colors",
    palette: DEFAULT_PALETTE,
    builtIn: true,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  },
];

/**
 * Theme storage key for localStorage
 */
const THEME_STORAGE_KEY = "winamp-viz-themes";

/**
 * Singleton theme manager class
 *
 * Manages theme loading, validation, and application throughout the application.
 * Provides methods to load built-in themes, custom themes, and persist user themes.
 *
 * @example
 * ```typescript
 * const manager = ThemeManager.getInstance();
 *
 * // Load a theme
 * const theme = manager.loadTheme('cyberpunk');
 *
 * // Apply to document
 * manager.applyTheme(theme);
 *
 * // Get all available themes
 * const themes = manager.getAvailableThemes();
 * ```
 */
export class ThemeManager {
  private static instance: ThemeManager | null = null;

  private customThemes: Map<string, Theme> = new Map();
  private currentTheme: Theme | null = null;
  private listeners: Set<(theme: Theme) => void> = new Set();

  /**
   * Get the singleton instance
   */
  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Private constructor - use getInstance()
   */
  private constructor() {
    this.loadCustomThemesFromStorage();
  }

  /**
   * Load a theme by ID
   * @param themeId - Theme identifier
   * @returns Theme object or default theme if not found
   */
  public loadTheme(themeId: string): Theme {
    // Check built-in themes first
    const builtIn = BUILT_IN_THEMES.find((t) => t.id === themeId);
    if (builtIn) {
      return { ...builtIn };
    }

    // Check custom themes
    const custom = this.customThemes.get(themeId);
    if (custom) {
      return { ...custom };
    }

    // Return default if not found
    console.warn(`[ThemeManager] Theme '${themeId}' not found, using default`);
    return { ...BUILT_IN_THEMES.find((t) => t.id === "default")! };
  }

  /**
   * Apply a theme to the application
   * Sets CSS custom properties and notifies listeners
   *
   * @param theme - Theme to apply
   */
  public applyTheme(theme: Theme): void {
    this.currentTheme = theme;

    // Set CSS custom properties
    const root = document.documentElement;
    const palette = theme.palette;

    // Helper to convert color to CSS value
    const colorToCss = (color: ColorValue): string => {
      if (typeof color === "string") return color;
      return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    };

    // Set primary colors
    root.style.setProperty("--theme-primary", colorToCss(palette.primary));
    root.style.setProperty("--theme-secondary", colorToCss(palette.secondary));
    root.style.setProperty(
      "--theme-background",
      colorToCss(palette.background),
    );
    root.style.setProperty(
      "--theme-foreground",
      colorToCss(palette.foreground),
    );
    root.style.setProperty("--theme-muted", colorToCss(palette.muted));

    // Set spectrum colors as CSS variables
    palette.spectrum.forEach((color, index) => {
      root.style.setProperty(`--theme-spectrum-${index}`, colorToCss(color));
    });

    // Notify listeners
    this.listeners.forEach((listener) => listener(theme));

    console.log(`[ThemeManager] Applied theme: ${theme.name}`);
  }

  /**
   * Validate a theme object
   * @param theme - Theme to validate
   * @returns True if theme is valid
   */
  public validateTheme(theme: unknown): theme is Theme {
    if (!theme || typeof theme !== "object") {
      console.error("[ThemeManager] Theme must be an object");
      return false;
    }

    const t = theme as Partial<Theme>;

    // Required fields
    if (!t.id || typeof t.id !== "string") {
      console.error("[ThemeManager] Theme must have a string id");
      return false;
    }

    if (!t.name || typeof t.name !== "string") {
      console.error("[ThemeManager] Theme must have a string name");
      return false;
    }

    if (!t.palette || typeof t.palette !== "object") {
      console.error("[ThemeManager] Theme must have a palette object");
      return false;
    }

    const palette = t.palette as Partial<ColorPalette>;

    // Required palette fields
    const requiredColors: (keyof ColorPalette)[] = [
      "primary",
      "secondary",
      "background",
      "foreground",
      "muted",
      "spectrum",
    ];

    for (const color of requiredColors) {
      if (palette[color] === undefined) {
        console.error(`[ThemeManager] Theme palette must have ${color}`);
        return false;
      }
    }

    // Validate spectrum is an array
    if (!Array.isArray(palette.spectrum) || palette.spectrum.length === 0) {
      console.error(
        "[ThemeManager] Theme palette.spectrum must be a non-empty array",
      );
      return false;
    }

    // Validate color values
    const isValidColor = (color: unknown): boolean => {
      if (typeof color === "string") {
        // Hex color validation
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
      }
      if (Array.isArray(color) && color.length >= 3) {
        // RGB array validation
        return color.every((v) => typeof v === "number" && v >= 0 && v <= 255);
      }
      return false;
    };

    for (const [key, value] of Object.entries(palette)) {
      if (key === "spectrum") {
        if (!Array.isArray(value) || !value.every(isValidColor)) {
          console.error(`[ThemeManager] Invalid spectrum colors`);
          return false;
        }
      } else if (key === "gradients") {
        // Gradients are optional
        continue;
      } else if (!isValidColor(value)) {
        console.error(
          `[ThemeManager] Invalid color value for ${key}: ${value}`,
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Get all available themes (built-in + custom)
   * @returns Array of all themes
   */
  public getAvailableThemes(): Theme[] {
    const custom = Array.from(this.customThemes.values());
    return [...BUILT_IN_THEMES, ...custom];
  }

  /**
   * Get all built-in themes
   * @returns Array of built-in themes
   */
  public getBuiltInThemes(): Theme[] {
    return [...BUILT_IN_THEMES];
  }

  /**
   * Get all custom themes
   * @returns Array of custom themes
   */
  public getCustomThemes(): Theme[] {
    return Array.from(this.customThemes.values());
  }

  /**
   * Add a custom theme
   * @param theme - Theme to add
   * @returns True if added successfully
   */
  public addCustomTheme(theme: Theme): boolean {
    if (!this.validateTheme(theme)) {
      return false;
    }

    // Ensure timestamps are set
    const now = Date.now();
    const newTheme: Theme = {
      ...theme,
      builtIn: false,
      createdAt: theme.createdAt || now,
      modifiedAt: now,
    };

    this.customThemes.set(newTheme.id, newTheme);
    this.saveCustomThemesToStorage();

    console.log(`[ThemeManager] Added custom theme: ${newTheme.name}`);
    return true;
  }

  /**
   * Remove a custom theme
   * @param themeId - ID of theme to remove
   * @returns True if removed
   */
  public removeCustomTheme(themeId: string): boolean {
    const removed = this.customThemes.delete(themeId);
    if (removed) {
      this.saveCustomThemesToStorage();
      console.log(`[ThemeManager] Removed custom theme: ${themeId}`);
    }
    return removed;
  }

  /**
   * Get the currently applied theme
   * @returns Current theme or null
   */
  public getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  /**
   * Subscribe to theme changes
   * @param callback - Function to call when theme changes
   * @returns Unsubscribe function
   */
  public subscribe(callback: (theme: Theme) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Export theme to JSON string
   * @param theme - Theme to export
   * @returns JSON string
   */
  public exportTheme(theme: Theme): string {
    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme from JSON string
   * @param json - JSON string containing theme
   * @returns Theme object or null if invalid
   */
  public importTheme(json: string): Theme | null {
    try {
      const parsed = JSON.parse(json);
      if (this.validateTheme(parsed)) {
        return parsed as Theme;
      }
      return null;
    } catch (error) {
      console.error("[ThemeManager] Failed to import theme:", error);
      return null;
    }
  }

  /**
   * Create a new theme from a palette
   * @param id - Theme ID
   * @param name - Theme name
   * @param palette - Color palette
   * @returns New theme object
   */
  public createTheme(
    id: string,
    name: string,
    palette: ColorPalette,
    options?: Partial<Omit<Theme, "id" | "name" | "palette">>,
  ): Theme {
    const now = Date.now();
    return {
      id,
      name,
      palette,
      builtIn: false,
      createdAt: now,
      modifiedAt: now,
      ...options,
    };
  }

  /**
   * Load custom themes from localStorage
   */
  private loadCustomThemesFromStorage(): void {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const themes = JSON.parse(stored) as Theme[];
        themes.forEach((theme) => {
          if (this.validateTheme(theme)) {
            this.customThemes.set(theme.id, theme);
          }
        });
        console.log(
          `[ThemeManager] Loaded ${this.customThemes.size} custom themes`,
        );
      }
    } catch (error) {
      console.error("[ThemeManager] Failed to load custom themes:", error);
    }
  }

  /**
   * Save custom themes to localStorage
   */
  private saveCustomThemesToStorage(): void {
    try {
      const themes = Array.from(this.customThemes.values());
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themes));
    } catch (error) {
      console.error("[ThemeManager] Failed to save custom themes:", error);
    }
  }

  /**
   * Get CSS custom property value for a color
   * @param property - CSS variable name (without --)
   * @returns Color value or null
   */
  public getCssVariable(property: string): string | null {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--${property}`)
      .trim();
  }

  /**
   * Apply a color to a CSS variable
   * @param property - CSS variable name (without --)
   * @param color - Color value
   */
  public setCssVariable(property: string, color: ColorValue): void {
    const value =
      typeof color === "string"
        ? color
        : `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    document.documentElement.style.setProperty(`--${property}`, value);
  }
}

/**
 * Export singleton getter for convenience
 */
export const getThemeManager = ThemeManager.getInstance;

export default ThemeManager;
