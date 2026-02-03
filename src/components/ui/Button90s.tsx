/**
 * Button90s Component
 *
 * Authentic 90s button component with period-accurate styling:
 * - 3D beveled border (border-style: outset)
 * - :active state with inset border
 * - Instant state change (no transition)
 * - Bitmap font styling
 * - Disabled state styling
 * - Hover effects
 *
 * Based on classic Windows 95/98 and Winamp button aesthetics
 *
 * @module Button90s
 */

import React, { ButtonHTMLAttributes, forwardRef } from "react";

// ============================================================================
// Types
// ============================================================================

export interface Button90sProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant - affects color scheme */
  variant?: "primary" | "secondary" | "danger" | "success" | "default";

  /** Size variant */
  size?: "sm" | "md" | "lg";

  /** Makes button fill container width */
  fullWidth?: boolean;

  /** Winamp-style rectangular (no rounding) */
  winampStyle?: boolean;

  /** Extra pixelated/aliased appearance */
  pixelated?: boolean;

  /** Optional icon element */
  icon?: React.ReactNode;

  /** Icon position */
  iconPosition?: "left" | "right";
}

// ============================================================================
// Style Constants - AUTHENTIC 90S COLORS
// ============================================================================

const WIN95_COLORS = {
  // Button bevel colors
  highlight: "#ffffff",
  light: "#dfdfdf",
  face: "#c0c0c0",
  shadow: "#808080",
  darkShadow: "#404040",
  black: "#000000",

  // Text colors
  text: "#000000",
  textDisabled: "#808080",

  // Accent colors
  primary: "#000080", // Navy blue
  danger: "#800000", // Dark red
  success: "#008000", // Dark green
} as const;

const WINAMP_COLORS = {
  face: "#c0c0c0",
  highlight: "#ffffff",
  shadow: "#808080",
  darkShadow: "#404040",
  active: "#a0a0a0",
  text: "#000000",
} as const;

// ============================================================================
// CSS Styles - Complete 90s Button System
// ============================================================================

const BUTTON_STYLES = `
.button-90s {
  /* Reset all modern button styling */
  appearance: none;
  border: none;
  background: none;
  cursor: pointer;
  font-family: 'MS Sans Serif', 'Microsoft Sans Serif', 'Arial', sans-serif;
  font-weight: normal;
  text-decoration: none;
  outline: none;
  user-select: none;

  /* Base 90s button look - NO transitions for instant feel */
  background-color: ${WIN95_COLORS.face};
  color: ${WIN95_COLORS.text};
  border: 2px solid;
  border-color: 
    ${WIN95_COLORS.highlight}
    ${WIN95_COLORS.darkShadow}
    ${WIN95_COLORS.darkShadow}
    ${WIN95_COLORS.highlight};

  /* Windows 95 button padding */
  padding: 4px 12px;

  /* Ensure crisp edges */
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* Focus state - dotted outline */
.button-90s:focus {
  outline: 1px dotted #000000;
  outline-offset: -4px;
}

/* Active/pressed state - inset border */
.button-90s:active,
.button-90s.active {
  border-color: 
    ${WIN95_COLORS.darkShadow}
    ${WIN95_COLORS.highlight}
    ${WIN95_COLORS.highlight}
    ${WIN95_COLORS.darkShadow};
  padding: 5px 11px 3px 13px; /* Offset for pressed look */
  background-color: ${WIN95_COLORS.face};
}

/* Hover state - slightly lighter */
.button-90s:hover:not(:disabled):not(:active) {
  background-color: #d4d4d4;
}

/* Disabled state */
.button-90s:disabled {
  cursor: not-allowed;
  color: ${WIN95_COLORS.textDisabled};
  text-shadow: 1px 1px 0 ${WIN95_COLORS.highlight};
}

/* Disabled with the etched text effect */
.button-90s:disabled .button-text {
  color: ${WIN95_COLORS.textDisabled};
  text-shadow: 1px 1px 0 ${WIN95_COLORS.highlight};
}

/* Size variants */
.button-90s-sm {
  padding: 2px 8px;
  font-size: 11px;
  min-height: 18px;
}

.button-90s-sm:active,
.button-90s-sm.active {
  padding: 3px 7px 1px 9px;
}

.button-90s-md {
  padding: 4px 12px;
  font-size: 12px;
  min-height: 22px;
}

.button-90s-md:active,
.button-90s-md.active {
  padding: 5px 11px 3px 13px;
}

.button-90s-lg {
  padding: 6px 16px;
  font-size: 14px;
  min-height: 26px;
}

.button-90s-lg:active,
.button-90s-lg.active {
  padding: 7px 15px 5px 17px;
}

/* Full width */
.button-90s-full {
  width: 100%;
}

/* Winamp-style - rectangular, no focus outline */
.button-90s-winamp {
  border-radius: 0;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.button-90s-winamp:focus {
  outline: none;
}

/* Winamp active state */
.button-90s-winamp:active,
.button-90s-winamp.active {
  background-color: ${WINAMP_COLORS.active};
  border-color: 
    ${WINAMP_COLORS.darkShadow}
    ${WINAMP_COLORS.highlight}
    ${WINAMP_COLORS.highlight}
    ${WINAMP_COLORS.darkShadow};
}

/* Pixelated/aliased style */
.button-90s-pixelated {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  shape-rendering: crispEdges;
  text-rendering: geometricPrecision;
}

/* Variant: Primary (Navy blue accent) */
.button-90s-primary {
  background-color: ${WIN95_COLORS.primary};
  color: #ffffff;
  border-color: 
    #4040ff
    #000040
    #000040
    #4040ff;
}

.button-90s-primary:hover:not(:disabled):not(:active) {
  background-color: #2020a0;
}

.button-90s-primary:active,
.button-90s-primary.active {
  background-color: #000060;
  border-color: 
    #000040
    #4040ff
    #4040ff
    #000040;
}

/* Variant: Danger (Red accent) */
.button-90s-danger {
  background-color: ${WIN95_COLORS.danger};
  color: #ffffff;
  border-color: 
    #ff4040
    #400000
    #400000
    #ff4040;
}

.button-90s-danger:hover:not(:disabled):not(:active) {
  background-color: #a02020;
}

.button-90s-danger:active,
.button-90s-danger.active {
  background-color: #600000;
  border-color: 
    #400000
    #ff4040
    #ff4040
    #400000;
}

/* Variant: Success (Green accent) */
.button-90s-success {
  background-color: ${WIN95_COLORS.success};
  color: #ffffff;
  border-color: 
    #40ff40
    #004000
    #004000
    #40ff40;
}

.button-90s-success:hover:not(:disabled):not(:active) {
  background-color: #20a020;
}

.button-90s-success:active,
.button-90s-success.active {
  background-color: #006000;
  border-color: 
    #004000
    #40ff40
    #40ff40
    #004000;
}

/* Variant: Secondary (Lighter gray) */
.button-90s-secondary {
  background-color: #e0e0e0;
  border-color: 
    #ffffff
    #808080
    #808080
    #ffffff;
}

.button-90s-secondary:hover:not(:disabled):not(:active) {
  background-color: #f0f0f0;
}

/* Content layout */
.button-90s-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* Icon positioning */
.button-90s-icon-left {
  order: -1;
}

.button-90s-icon-right {
  order: 1;
}

/* Checkbox-style button (toggle) */
.button-90s-toggle {
  position: relative;
}

.button-90s-toggle::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  background: #ffffff;
  border: 1px solid #808080;
  margin-right: 6px;
  box-shadow: 
    inset 1px 1px 0 #000000,
    inset -1px -1px 0 #ffffff;
}

.button-90s-toggle.active::before {
  background: 
    linear-gradient(135deg, transparent 45%, #000000 45%, #000000 55%, transparent 55%),
    linear-gradient(45deg, transparent 45%, #000000 45%, #000000 55%, transparent 55%),
    #ffffff;
  background-size: 6px 6px, 6px 6px, 100% 100%;
  background-position: 2px 4px, 2px -2px, 0 0;
  background-repeat: no-repeat;
}

/* 3D raised effect variant */
.button-90s-raised {
  box-shadow: 
    1px 1px 0 ${WIN95_COLORS.darkShadow},
    2px 2px 0 ${WIN95_COLORS.darkShadow},
    3px 3px 0 ${WIN95_COLORS.darkShadow};
  margin-bottom: 3px;
  margin-right: 3px;
}

.button-90s-raised:active,
.button-90s-raised.active {
  box-shadow: 
    1px 1px 0 ${WIN95_COLORS.darkShadow};
  transform: translate(2px, 2px);
  margin-bottom: 1px;
  margin-right: 1px;
}

/* Radio button style */
.button-90s-radio::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  background: #ffffff;
  border-radius: 50%;
  border: 1px solid #808080;
  margin-right: 6px;
  box-shadow: 
    inset 1px 1px 0 #000000,
    inset -1px -1px 0 #ffffff;
}

.button-90s-radio.active::before {
  background: radial-gradient(circle, #000000 30%, #ffffff 35%);
}
`;

// ============================================================================
// Component
// ============================================================================

export const Button90s = forwardRef<HTMLButtonElement, Button90sProps>(
  (
    {
      variant = "default",
      size = "md",
      fullWidth = false,
      winampStyle = false,
      pixelated = false,
      icon,
      iconPosition = "left",
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    // Build class name
    const classes = [
      "button-90s",
      `button-90s-${size}`,
      variant !== "default" && `button-90s-${variant}`,
      fullWidth && "button-90s-full",
      winampStyle && "button-90s-winamp",
      pixelated && "button-90s-pixelated",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <>
        <style>{BUTTON_STYLES}</style>
        <button ref={ref} className={classes} disabled={disabled} {...props}>
          <span className="button-90s-content">
            {icon && iconPosition === "left" && (
              <span className="button-90s-icon-left">{icon}</span>
            )}
            <span className="button-text">{children}</span>
            {icon && iconPosition === "right" && (
              <span className="button-90s-icon-right">{icon}</span>
            )}
          </span>
        </button>
      </>
    );
  },
);

Button90s.displayName = "Button90s";

// ============================================================================
// Specialized Variants
// ============================================================================

/**
 * Toggle button variant
 */
export interface ToggleButton90sProps extends Button90sProps {
  /** Current pressed state */
  pressed: boolean;
  /** Callback when pressed state changes */
  onPressedChange?: (pressed: boolean) => void;
}

export const ToggleButton90s = forwardRef<
  HTMLButtonElement,
  ToggleButton90sProps
>(
  (
    { pressed, onPressedChange, children, onClick, className = "", ...props },
    ref,
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onPressedChange?.(!pressed);
      onClick?.(e);
    };

    return (
      <Button90s
        ref={ref}
        className={`button-90s-toggle ${pressed ? "active" : ""} ${className}`}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button90s>
    );
  },
);

ToggleButton90s.displayName = "ToggleButton90s";

/**
 * Radio button style
 */
export interface RadioButton90sProps extends Button90sProps {
  selected: boolean;
  onSelectedChange?: (selected: boolean) => void;
}

export const RadioButton90s = forwardRef<
  HTMLButtonElement,
  RadioButton90sProps
>(
  (
    { selected, onSelectedChange, children, onClick, className = "", ...props },
    ref,
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onSelectedChange?.(!selected);
      onClick?.(e);
    };

    return (
      <Button90s
        ref={ref}
        className={`button-90s-radio ${selected ? "active" : ""} ${className}`}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button90s>
    );
  },
);

RadioButton90s.displayName = "RadioButton90s";

export default Button90s;
