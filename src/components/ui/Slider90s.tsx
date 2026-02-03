/**
 * Slider90s Component
 *
 * Chunky 90s slider component using Radix UI Slider primitive:
 * - Radix Slider primitive for accessibility
 * - Custom 90s styling (track, range, thumb)
 * - Tick marks
 * - Instant thumb movement
 * - Vertical and horizontal variants
 *
 * Based on classic Windows 95/98 and Winamp slider aesthetics
 *
 * @module Slider90s
 */

import React, { forwardRef, useCallback, useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

// ============================================================================
// Types
// ============================================================================

export interface Slider90sProps {
  /** Current value */
  value?: number;

  /** Default value (uncontrolled) */
  defaultValue?: number;

  /** Callback when value changes */
  onChange?: (value: number) => void;

  /** Callback when value changes ends (commit) */
  onCommit?: (value: number) => void;

  /** Minimum value */
  min?: number;

  /** Maximum value */
  max?: number;

  /** Step size */
  step?: number;

  /** Orientation */
  orientation?: "horizontal" | "vertical";

  /** Slider size variant */
  size?: "sm" | "md" | "lg";

  /** Winamp-style (rectangular, no thumb grab) */
  winampStyle?: boolean;

  /** Show tick marks */
  showTicks?: boolean;

  /** Number of tick marks */
  tickCount?: number;

  /** Custom tick values */
  tickValues?: number[];

  /** Show current value label */
  showValue?: boolean;

  /** Custom value formatter */
  formatValue?: (value: number) => string;

  /** Disable the slider */
  disabled?: boolean;

  /** Invert the range */
  inverted?: boolean;

  /** Custom track color */
  trackColor?: string;

  /** Custom range/fill color */
  rangeColor?: string;

  /** Custom thumb color */
  thumbColor?: string;

  /** Additional CSS class */
  className?: string;

  /** Slider label */
  label?: string;

  /** ARIA label for accessibility */
  ariaLabel?: string;
}

// ============================================================================
// Style Constants
// ============================================================================

const WIN95_COLORS = {
  face: "#c0c0c0",
  highlight: "#ffffff",
  shadow: "#808080",
  darkShadow: "#404040",
  black: "#000000",
  track: "#808080",
  trackHighlight: "#a0a0a0",
  fill: "#000080", // Navy blue
} as const;

const WINAMP_COLORS = {
  face: "#c0c0c0",
  track: "#404040",
  fill: "#00ff00", // Winamp green
  thumb: "#808080",
} as const;

// ============================================================================
// CSS Styles
// ============================================================================

const SLIDER_STYLES = `
/* Base slider container */
.slider-90s {
  position: relative;
  display: flex;
  align-items: center;
  user-select: none;
  touch-action: none;
  font-family: 'MS Sans Serif', 'Arial', sans-serif;
}

.slider-90s[data-orientation='horizontal'] {
  height: 20px;
  width: 100%;
}

.slider-90s[data-orientation='vertical'] {
  flex-direction: column;
  width: 20px;
  height: 100%;
}

/* Track - the background bar */
.slider-90s-track {
  position: relative;
  flex-grow: 1;
  background-color: ${WIN95_COLORS.track};
  border: 2px solid;
  border-color: ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.highlight} ${WIN95_COLORS.highlight} ${WIN95_COLORS.darkShadow};
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.slider-90s[data-orientation='horizontal'] .slider-90s-track {
  height: 8px;
}

.slider-90s[data-orientation='vertical'] .slider-90s-track {
  width: 8px;
}

/* Range - the filled portion */
.slider-90s-range {
  position: absolute;
  background-color: ${WIN95_COLORS.fill};
  border: 1px solid;
  border-color: ${WIN95_COLORS.highlight} ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.highlight};
}

.slider-90s[data-orientation='horizontal'] .slider-90s-range {
  height: 100%;
}

.slider-90s[data-orientation='vertical'] .slider-90s-range {
  width: 100%;
}

/* Thumb - the draggable handle */
.slider-90s-thumb {
  display: block;
  width: 16px;
  height: 20px;
  background-color: ${WIN95_COLORS.face};
  border: 2px solid;
  border-color: ${WIN95_COLORS.highlight} ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.highlight};
  cursor: pointer;
  outline: none;
  position: relative;
  z-index: 2;
}

.slider-90s-thumb:focus {
  outline: 1px dotted #000000;
  outline-offset: -2px;
}

.slider-90s[data-orientation='horizontal'] .slider-90s-thumb {
  margin-top: -6px;
}

.slider-90s[data-orientation='vertical'] .slider-90s-thumb {
  margin-left: -6px;
}

/* Thumb pressed state */
.slider-90s-thumb[data-state='active'] {
  border-color: ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.highlight} ${WIN95_COLORS.highlight} ${WIN95_COLORS.darkShadow};
  background-color: #b0b0b0;
}

/* Size variants */
.slider-90s-sm .slider-90s-track {
  height: 6px;
}

.slider-90s-sm .slider-90s-thumb {
  width: 12px;
  height: 16px;
}

.slider-90s-lg .slider-90s-track {
  height: 12px;
}

.slider-90s-lg .slider-90s-thumb {
  width: 20px;
  height: 24px;
}

/* Winamp style */
.slider-90s-winamp .slider-90s-track {
  background-color: ${WINAMP_COLORS.track};
  border: 1px solid #000000;
  box-shadow: none;
}

.slider-90s-winamp .slider-90s-range {
  background-color: ${WINAMP_COLORS.fill};
  border: none;
}

.slider-90s-winamp .slider-90s-thumb {
  width: 14px;
  height: 14px;
  background-color: ${WINAMP_COLORS.thumb};
  border: 1px solid;
  border-color: ${WIN95_COLORS.highlight} ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.darkShadow} ${WIN95_COLORS.highlight};
}

.slider-90s-winamp[data-orientation='horizontal'] .slider-90s-thumb {
  margin-top: -3px;
}

.slider-90s-winamp[data-orientation='vertical'] .slider-90s-thumb {
  margin-left: -3px;
}

/* Tick marks */
.slider-90s-ticks {
  position: absolute;
  pointer-events: none;
}

.slider-90s[data-orientation='horizontal'] .slider-90s-ticks {
  top: -8px;
  left: 0;
  right: 0;
  height: 4px;
}

.slider-90s[data-orientation='vertical'] .slider-90s-ticks {
  left: -8px;
  top: 0;
  bottom: 0;
  width: 4px;
}

.slider-90s-tick {
  position: absolute;
  background-color: ${WIN95_COLORS.darkShadow};
}

.slider-90s[data-orientation='horizontal'] .slider-90s-tick {
  width: 1px;
  height: 4px;
  top: 0;
}

.slider-90s[data-orientation='vertical'] .slider-90s-tick {
  width: 4px;
  height: 1px;
  left: 0;
}

.slider-90s-tick-label {
  position: absolute;
  font-size: 10px;
  color: ${WIN95_COLORS.darkShadow};
}

.slider-90s[data-orientation='horizontal'] .slider-90s-tick-label {
  top: -16px;
  transform: translateX(-50%);
}

.slider-90s[data-orientation='vertical'] .slider-90s-tick-label {
  left: -32px;
  transform: translateY(-50%);
}

/* Value display */
.slider-90s-value {
  position: absolute;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  background-color: #000000;
  color: ${WINAMP_COLORS.fill};
  padding: 2px 6px;
  border: 1px solid ${WIN95_COLORS.darkShadow};
}

.slider-90s[data-orientation='horizontal'] .slider-90s-value {
  top: -28px;
  transform: translateX(-50%);
}

.slider-90s[data-orientation='vertical'] .slider-90s-value {
  left: 32px;
  transform: translateY(-50%);
}

/* Disabled state */
.slider-90s[data-disabled] {
  opacity: 0.5;
  pointer-events: none;
}

.slider-90s[data-disabled] .slider-90s-thumb {
  background-color: ${WIN95_COLORS.face};
  cursor: not-allowed;
}

/* Label */
.slider-90s-label {
  font-size: 11px;
  margin-bottom: 4px;
  color: ${WIN95_COLORS.darkShadow};
}

/* Container for label + slider */
.slider-90s-container {
  display: flex;
  flex-direction: column;
}

/* 3D inset look for track */
.slider-90s-track-3d {
  background: linear-gradient(
    to bottom,
    ${WIN95_COLORS.darkShadow} 0%,
    ${WIN95_COLORS.track} 20%,
    ${WIN95_COLORS.trackHighlight} 80%,
    ${WIN95_COLORS.highlight} 100%
  );
}

.slider-90s[data-orientation='vertical'] .slider-90s-track-3d {
  background: linear-gradient(
    to right,
    ${WIN95_COLORS.darkShadow} 0%,
    ${WIN95_COLORS.track} 20%,
    ${WIN95_COLORS.trackHighlight} 80%,
    ${WIN95_COLORS.highlight} 100%
  );
}

/* Grooved thumb for grip */
.slider-90s-thumb::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 10px;
  background: repeating-linear-gradient(
    0deg,
    ${WIN95_COLORS.shadow} 0px,
    ${WIN95_COLORS.shadow} 1px,
    ${WIN95_COLORS.highlight} 1px,
    ${WIN95_COLORS.highlight} 2px
  );
}

/* Winamp style thumb (no groove) */
.slider-90s-winamp .slider-90s-thumb::after {
  display: none;
}
`;

// ============================================================================
// Component
// ============================================================================

export const Slider90s = forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  Slider90sProps
>(
  (
    {
      value,
      defaultValue,
      onChange,
      onCommit,
      min = 0,
      max = 100,
      step = 1,
      orientation = "horizontal",
      size = "md",
      winampStyle = false,
      showTicks = false,
      tickCount = 10,
      tickValues,
      showValue = false,
      formatValue = (v) => String(Math.round(v)),
      disabled = false,
      inverted = false,
      trackColor,
      rangeColor,
      thumbColor,
      className = "",
      label,
      ariaLabel,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(
      defaultValue ?? (min + max) / 2,
    );

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    // Handle value change
    const handleValueChange = useCallback(
      (values: number[]) => {
        const newValue = values[0] ?? currentValue;
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
      },
      [isControlled, onChange, currentValue],
    );

    // Handle value commit (on drag end)
    const handleValueCommit = useCallback(
      (values: number[]) => {
        const committedValue = values[0] ?? currentValue;
        onCommit?.(committedValue);
      },
      [onCommit, currentValue],
    );

    // Generate tick positions
    const range = max - min || 1; // Prevent division by zero
    const ticks = tickValues
      ? tickValues.map((v) => ((v - min) / range) * 100)
      : Array.from({ length: tickCount + 1 }, (_, i) => (i / tickCount) * 100);

    // Build class names
    const containerClasses = ["slider-90s-container", className].join(" ");

    const sliderClasses = [
      "slider-90s",
      `slider-90s-${size}`,
      winampStyle && "slider-90s-winamp",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <>
        <style>{SLIDER_STYLES}</style>
        <div className={containerClasses}>
          {label && <div className="slider-90s-label">{label}</div>}
          <SliderPrimitive.Root
            ref={ref}
            className={sliderClasses}
            value={[currentValue]}
            onValueChange={handleValueChange}
            onValueCommit={handleValueCommit}
            min={min}
            max={max}
            step={step}
            orientation={orientation}
            disabled={disabled}
            inverted={inverted}
            aria-label={ariaLabel || label}
            {...props}
          >
            <SliderPrimitive.Track
              className="slider-90s-track slider-90s-track-3d"
              style={{
                backgroundColor: trackColor,
              }}
            >
              <SliderPrimitive.Range
                className="slider-90s-range"
                style={{
                  backgroundColor: rangeColor,
                }}
              />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
              className="slider-90s-thumb"
              style={{
                backgroundColor: thumbColor,
              }}
            />

            {/* Tick marks */}
            {showTicks && (
              <div className="slider-90s-ticks">
                {ticks.map((position, i) => {
                  const posValue = typeof position === "number" ? position : 0;
                  return (
                    <div
                      key={i}
                      className="slider-90s-tick"
                      style={{
                        [orientation === "horizontal" ? "left" : "top"]:
                          inverted ? `${100 - posValue}%` : `${posValue}%`,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Value display */}
            {showValue && (
              <div
                className="slider-90s-value"
                style={{
                  [orientation === "horizontal" ? "left" : "top"]: inverted
                    ? `${100 - ((currentValue - min) / (max - min)) * 100}%`
                    : `${((currentValue - min) / (max - min)) * 100}%`,
                }}
              >
                {formatValue(currentValue)}
              </div>
            )}
          </SliderPrimitive.Root>
        </div>
      </>
    );
  },
);

Slider90s.displayName = "Slider90s";

// ============================================================================
// Specialized Variants
// ============================================================================

/**
 * Volume slider (Winamp style vertical)
 */
export interface VolumeSlider90sProps extends Omit<
  Slider90sProps,
  "orientation" | "winampStyle"
> {
  /** Volume in dB (-60 to 12 typical) */
  volumeDb?: number;
  /** Callback with dB value */
  onVolumeChange?: (db: number) => void;
}

export const VolumeSlider90s = forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  VolumeSlider90sProps
>(
  (
    { volumeDb = 0, onVolumeChange, min = -60, max = 12, onChange, ...props },
    ref,
  ) => {
    const handleChange = (value: number) => {
      onChange?.(value);
      onVolumeChange?.(value);
    };

    return (
      <Slider90s
        ref={ref}
        orientation="vertical"
        winampStyle
        value={volumeDb}
        onChange={handleChange}
        min={min}
        max={max}
        showValue
        formatValue={(v) => `${v > 0 ? "+" : ""}${v}dB`}
        {...props}
      />
    );
  },
);

VolumeSlider90s.displayName = "VolumeSlider90s";

/**
 * Pan/Balance slider (centered at 0)
 */
export interface PanSlider90sProps extends Omit<
  Slider90sProps,
  "min" | "max" | "defaultValue" | "value"
> {
  /** Minimum value (default: -100) */
  min?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Pan value (-100 to 100) */
  pan?: number;
  /** Callback with pan value */
  onPanChange?: (pan: number) => void;
}

export const PanSlider90s = forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  PanSlider90sProps
>(
  (
    { pan = 0, onPanChange, onChange, min = -100, max = 100, ...props },
    ref,
  ) => {
    const handleChange = (value: number) => {
      onChange?.(value);
      onPanChange?.(value);
    };

    return (
      <Slider90s
        ref={ref}
        orientation="horizontal"
        winampStyle
        value={pan}
        onChange={handleChange}
        min={min}
        max={max}
        defaultValue={0}
        tickValues={[-100, 0, 100]}
        showTicks
        showValue
        formatValue={(v) =>
          v === 0 ? "C" : v < 0 ? `L${Math.abs(v)}` : `R${v}`
        }
        {...props}
      />
    );
  },
);

PanSlider90s.displayName = "PanSlider90s";

export default Slider90s;
