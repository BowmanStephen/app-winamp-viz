/**
 * CRTEffects Component
 *
 * CRT monitor simulation overlay with authentic 90s monitor effects:
 * - Scanlines (CSS repeating-linear-gradient)
 * - Phosphor glow (CSS box-shadow/text-shadow)
 * - Screen curvature (CSS border-radius subtle)
 * - Vignetting (CSS radial-gradient)
 * - Flicker animation (CSS keyframes)
 * - RGB channel separation (CSS filter)
 * - Toggle on/off
 * - Configurable intensity
 *
 * @module CRTEffects
 */

import React, { useEffect, useRef } from "react";

// ============================================================================
// Timing Constants - AUTHENTIC_90S_TIMING
// ============================================================================

export const AUTHENTIC_90S_TIMING = {
  /** CRT refresh rate: 60Hz but with variance for authenticity */
  REFRESH_RATE: 1000 / 60,

  /** Phosphor persistence in milliseconds (how long pixels stay lit) */
  PHOSPHOR_PERSISTENCE: 16.67,

  /** Flicker frequency for CRT hum effect (NTSC: 59.94Hz, PAL: 50Hz) */
  FLICKER_FREQUENCY_NTSC: 59.94,
  FLICKER_FREQUENCY_PAL: 50,

  /** Frame interval with jitter for authentic feel */
  FRAME_INTERVAL: 16.67,
  FRAME_JITTER: 0.5,

  /** Scanline spacing in pixels (based on 480i/576i CRTs) */
  SCANLINE_SPACING: 2,

  /** Phosphor decay curve exponent */
  PHOSPHOR_DECAY_EXPONENT: 0.85,

  /** RGB separation offset in pixels */
  RGB_SEPARATION_OFFSET: 1.5,

  /** Curvature radius for screen bend effect */
  CURVATURE_RADIUS: 800,

  /** Vignette darkness (0-1) */
  VIGNETTE_DARKNESS: 0.4,

  /** Glow intensity for phosphor bloom */
  PHOSPHOR_GLOW_INTENSITY: 0.3,
} as const;

// ============================================================================
// Types
// ============================================================================

export interface CRTEffectsConfig {
  /** Enable/disable all effects */
  enabled: boolean;

  /** Scanline intensity (0-1) */
  scanlineIntensity: number;

  /** Phosphor glow intensity (0-1) */
  phosphorGlow: number;

  /** Screen curvature amount (0-1) */
  curvature: number;

  /** Vignette darkness (0-1) */
  vignette: number;

  /** Flicker intensity (0-1) */
  flicker: number;

  /** RGB channel separation (0-1) */
  rgbSeparation: number;

  /** Noise/grain intensity (0-1) */
  noise: number;

  /** Color temperature (warm/cool) */
  colorTemperature: "warm" | "cool" | "neutral";
}

export interface CRTEffectsProps {
  /** Configuration for effects */
  config?: Partial<CRTEffectsConfig>;

  /** Children to render under the effect */
  children?: React.ReactNode;

  /** CSS class for container */
  className?: string;

  /** Callback when effects are toggled */
  onToggle?: (enabled: boolean) => void;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CRT_CONFIG: CRTEffectsConfig = {
  enabled: true,
  scanlineIntensity: 0.15,
  phosphorGlow: 0.25,
  curvature: 0.02,
  vignette: 0.35,
  flicker: 0.03,
  rgbSeparation: 0.02,
  noise: 0.05,
  colorTemperature: "warm",
};

// ============================================================================
// CSS Styles - Complete CRT Effect System
// ============================================================================

const CRT_STYLES = `
@keyframes crt-flicker {
  0% {
    opacity: 0.97;
  }
  5% {
    opacity: 0.95;
  }
  10% {
    opacity: 0.98;
  }
  15% {
    opacity: 0.96;
  }
  20% {
    opacity: 0.99;
  }
  25% {
    opacity: 0.97;
  }
  30% {
    opacity: 0.94;
  }
  35% {
    opacity: 0.98;
  }
  40% {
    opacity: 0.96;
  }
  45% {
    opacity: 0.99;
  }
  50% {
    opacity: 0.95;
  }
  55% {
    opacity: 0.97;
  }
  60% {
    opacity: 0.96;
  }
  65% {
    opacity: 0.98;
  }
  70% {
    opacity: 0.97;
  }
  75% {
    opacity: 0.95;
  }
  80% {
    opacity: 0.99;
  }
  85% {
    opacity: 0.96;
  }
  90% {
    opacity: 0.98;
  }
  95% {
    opacity: 0.97;
  }
  100% {
    opacity: 0.95;
  }
}

@keyframes text-flicker {
  0% {
    text-shadow: 0 0 4px currentColor;
  }
  33% {
    text-shadow: 0 0 2px currentColor, 0 0 6px currentColor;
  }
  66% {
    text-shadow: 0 0 3px currentColor;
  }
  100% {
    text-shadow: 0 0 4px currentColor, 0 0 8px currentColor;
  }
}

@keyframes phosphor-pulse {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.02);
  }
}

@keyframes scanline-shift {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(4px);
  }
}

.crt-container {
  position: relative;
  overflow: hidden;
  background: #000;
}

.crt-container.disabled {
  animation: none;
}

.crt-content {
  position: relative;
  z-index: 1;
}

.crt-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  pointer-events: none;
  overflow: hidden;
}

/* Scanlines - authentic 90s CRT look */
.crt-scanlines {
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0) 0px,
    rgba(0, 0, 0, 0) 2px,
    rgba(0, 0, 0, 0.15) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
  background-size: 100% 4px;
}

/* Interlaced variant for 480i/576i simulation */
.crt-scanlines-interlaced {
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0) 0px,
    rgba(0, 0, 0, 0.1) 1px,
    rgba(0, 0, 0, 0) 2px,
    rgba(0, 0, 0, 0.2) 2px,
    rgba(0, 0, 0, 0.2) 3px,
    rgba(0, 0, 0, 0) 4px
  );
  background-size: 100% 4px;
}

/* Vignette - darkening at edges */
.crt-vignette {
  background: radial-gradient(
    ellipse at center,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0) 60%,
    rgba(0, 0, 0, 0.4) 100%
  );
}

/* Screen curvature simulation */
.crt-curvature {
  border-radius: 20px / 600px;
  box-shadow: 
    inset 0 0 80px rgba(0, 0, 0, 0.5),
    inset 0 0 20px rgba(0, 0, 0, 0.3);
}

/* Phosphor glow effect */
.crt-phosphor-glow {
  box-shadow: 
    0 0 10px rgba(0, 255, 100, 0.1),
    0 0 20px rgba(0, 255, 100, 0.05),
    inset 0 0 30px rgba(0, 255, 100, 0.02);
}

/* Flicker animation layer */
.crt-flicker {
  animation: crt-flicker 0.15s infinite;
  background: rgba(255, 255, 255, 0.02);
}

/* RGB Channel separation - chromatic aberration */
.crt-rgb-separation {
  position: relative;
}

.crt-rgb-separation::before,
.crt-rgb-separation::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.crt-rgb-separation::before {
  mix-blend-mode: screen;
  background: rgba(255, 0, 0, 0.02);
  transform: translateX(-1px);
}

.crt-rgb-separation::after {
  mix-blend-mode: screen;
  background: rgba(0, 255, 255, 0.02);
  transform: translateX(1px);
}

/* Color temperature filters */
.crt-warm {
  filter: sepia(0.1) saturate(1.1);
}

.crt-cool {
  filter: hue-rotate(180deg) sepia(0.05) saturate(0.9);
}

.crt-neutral {
  filter: none;
}

/* Noise/scanline noise */
.crt-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.03;
}

/* Text glow for terminal/UI text */
.crt-text {
  text-shadow: 
    0 0 2px currentColor,
    0 0 4px currentColor,
    0 0 8px currentColor;
  animation: text-flicker 4s infinite;
}

/* Green phosphor specific */
.crt-green-phosphor {
  color: #33ff33;
  text-shadow: 
    0 0 4px #33ff33,
    0 0 8px #33ff33,
    0 0 16px #33ff33;
}

/* Amber phosphor specific */
.crt-amber-phosphor {
  color: #ffb000;
  text-shadow: 
    0 0 4px #ffb000,
    0 0 8px #ffb000,
    0 0 16px #ffb000;
}

/* White phosphor (monochrome) */
.crt-white-phosphor {
  color: #e0e0e0;
  text-shadow: 
    0 0 4px #e0e0e0,
    0 0 8px #e0e0e0;
}

/* Bezel shadow for depth */
.crt-bezel-shadow {
  box-shadow: 
    inset 0 0 100px rgba(0, 0, 0, 0.5),
    inset 0 0 30px rgba(0, 0, 0, 0.3),
    inset 0 0 10px rgba(0, 0, 0, 0.2);
}

/* Composite video artifacts */
.crt-composite {
  background: repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0px,
    rgba(255, 255, 255, 0.01) 1px,
    rgba(255, 255, 255, 0) 2px
  );
}
`;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate phosphor decay for a given time delta
 * @param initialIntensity - Starting intensity (0-1)
 * @param timeMs - Time elapsed in milliseconds
 * @returns Decayed intensity value
 */
export function calculatePhosphorDecay(
  initialIntensity: number,
  timeMs: number,
): number {
  const { PHOSPHOR_DECAY_EXPONENT, PHOSPHOR_PERSISTENCE } =
    AUTHENTIC_90S_TIMING;
  const decayFactor = Math.pow(
    1 - PHOSPHOR_DECAY_EXPONENT,
    timeMs / PHOSPHOR_PERSISTENCE,
  );
  return initialIntensity * decayFactor;
}

/**
 * Generate realistic flicker opacity value
 * @returns Opacity value between 0.95 and 1.0
 */
export function generateFlickerOpacity(): number {
  const base = 0.98;
  const variance = (Math.random() - 0.5) * 0.06;
  return Math.max(0.95, Math.min(1.0, base + variance));
}

/**
 * Get color temperature filter class
 * @param temperature - Color temperature setting
 * @returns CSS class name
 */
function getColorTemperatureClass(
  temperature: CRTEffectsConfig["colorTemperature"],
): string {
  switch (temperature) {
    case "warm":
      return "crt-warm";
    case "cool":
      return "crt-cool";
    case "neutral":
    default:
      return "crt-neutral";
  }
}

/**
 * Build CRT overlay style based on configuration
 * @param config - CRT effects configuration
 * @returns React CSS properties object
 */
export function buildCRTStyles(config: CRTEffectsConfig): React.CSSProperties {
  if (!config.enabled) {
    return {};
  }

  const styles: React.CSSProperties = {};

  // Phosphor glow intensity
  if (config.phosphorGlow > 0) {
    const glowSize = config.phosphorGlow * 20;
    const glowOpacity = config.phosphorGlow * 0.3;
    styles.boxShadow = `
      0 0 ${glowSize * 0.5}px rgba(0, 255, 100, ${glowOpacity}),
      0 0 ${glowSize}px rgba(0, 255, 100, ${glowOpacity * 0.5}),
      inset 0 0 ${glowSize * 1.5}px rgba(0, 255, 100, ${glowOpacity * 0.2})
    `;
  }

  // Curvature simulation via border-radius
  if (config.curvature > 0) {
    const curveRadius = config.curvature * 1000;
    styles.borderRadius = `${curveRadius}px / ${curveRadius * 30}px`;
  }

  return styles;
}

// ============================================================================
// Component
// ============================================================================

export const CRTEffects: React.FC<CRTEffectsProps> = ({
  config: userConfig = {},
  children,
  className = "",
  onToggle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const flickerRef = useRef<number>(0);

  // Merge with defaults
  const config: CRTEffectsConfig = {
    ...DEFAULT_CRT_CONFIG,
    ...userConfig,
  };

  // Handle flicker animation with RAF for performance
  useEffect(() => {
    if (!config.enabled || config.flicker <= 0) {
      return;
    }

    let animationId: number;
    const flickerElement = containerRef.current?.querySelector(".crt-flicker");

    if (!flickerElement) return;

    const animate = () => {
      const opacity = generateFlickerOpacity();
      const adjustedOpacity = 1 - (1 - opacity) * config.flicker;
      (flickerElement as HTMLElement).style.opacity = String(
        0.02 * config.flicker * adjustedOpacity,
      );

      // Random interval between 50-150ms for authentic feel
      const interval = 50 + Math.random() * 100;

      flickerRef.current = window.setTimeout(() => {
        animationId = requestAnimationFrame(animate);
      }, interval);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(flickerRef.current);
    };
  }, [config.enabled, config.flicker]);

  // Notify parent of toggle state
  useEffect(() => {
    onToggle?.(config.enabled);
  }, [config.enabled, onToggle]);

  if (!config.enabled) {
    return (
      <div className={`crt-container disabled ${className}`}>{children}</div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`crt-container crt-curvature ${className}`}
      style={buildCRTStyles(config)}
    >
      <style>{CRT_STYLES}</style>

      {/* Main content */}
      <div className="crt-content">{children}</div>

      {/* CRT Overlay Effects */}
      <div className="crt-overlay">
        {/* Scanlines */}
        {config.scanlineIntensity > 0 && (
          <div
            className="crt-scanlines"
            style={{
              position: "absolute",
              inset: 0,
              opacity: config.scanlineIntensity,
              backgroundSize: `100% ${AUTHENTIC_90S_TIMING.SCANLINE_SPACING * 2}px`,
            }}
          />
        )}

        {/* Vignette */}
        {config.vignette > 0 && (
          <div
            className="crt-vignette"
            style={{
              position: "absolute",
              inset: 0,
              opacity: config.vignette,
            }}
          />
        )}

        {/* Flicker layer */}
        {config.flicker > 0 && (
          <div
            className="crt-flicker"
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255, 255, 255, 0.02)",
            }}
          />
        )}

        {/* RGB Channel separation */}
        {config.rgbSeparation > 0 && (
          <div
            className="crt-rgb-separation"
            style={{
              position: "absolute",
              inset: 0,
              opacity: config.rgbSeparation * 50,
            }}
          />
        )}

        {/* Noise */}
        {config.noise > 0 && (
          <div
            className="crt-noise"
            style={{
              position: "absolute",
              inset: 0,
              opacity: config.noise,
            }}
          />
        )}

        {/* Bezel shadow for depth */}
        <div
          className="crt-bezel-shadow"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Color temperature filter */}
      <div
        className={`crt-temperature ${getColorTemperatureClass(config.colorTemperature)}`}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1001,
        }}
      />
    </div>
  );
};

/**
 * Hook to apply CRT text effects
 * @param phosphorType - Type of phosphor coloring
 * @returns CSS class string
 */
export function useCRTText(
  phosphorType: "green" | "amber" | "white" = "green",
): string {
  switch (phosphorType) {
    case "green":
      return "crt-text crt-green-phosphor";
    case "amber":
      return "crt-text crt-amber-phosphor";
    case "white":
      return "crt-text crt-white-phosphor";
    default:
      return "crt-text";
  }
}

export default CRTEffects;
