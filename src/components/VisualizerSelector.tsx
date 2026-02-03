/**
 * VisualizerSelector Component
 *
 * Visualizer switching UI with tab buttons:
 * - Tab buttons for each visualizer
 * - Icons and names
 * - Active state highlighting
 * - 90s styled
 *
 * @module VisualizerSelector
 */

import { useCallback } from "react";
import type { FC } from "react";
import { Button90s } from "./ui/Button90s";

// ============================================================================
// Types
// ============================================================================

export interface VisualizerOption {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Optional description */
  description?: string;

  /** Icon or symbol to display */
  icon?: string;
}

export interface VisualizerSelectorProps {
  /** Available visualizer options */
  options: VisualizerOption[];

  /** Currently selected visualizer ID */
  currentId: string | null;

  /** Callback when a visualizer is selected */
  onSelect: (id: string) => void;

  /** Whether the selector is disabled */
  disabled?: boolean;

  /** Whether a visualizer is loading */
  isLoading?: boolean;
}

// ============================================================================
// Styles
// ============================================================================

const STYLES = `
.visualizer-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  background-color: #c0c0c0;
  border: 2px solid;
  border-color: #ffffff #404040 #404040 #ffffff;
}

.visualizer-selector-tab {
  position: relative;
  min-width: 80px;
}

.visualizer-selector-tab.active {
  background-color: #e0e0e0;
}

.visualizer-selector-tab-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.visualizer-selector-icon {
  font-size: 14px;
  line-height: 1;
}

.visualizer-selector-name {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.visualizer-selector-loading {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
}

/* Visualizer-specific icons using CSS */
.icon-spectrum::before {
  content: '▓';
}

.icon-oscilloscope::before {
  content: '〰';
}

.icon-milkdrop::before {
  content: '✦';
}

.icon-vumeter::before {
  content: '◉';
}

/* Loading indicator */
.loading-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: #00ff00;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
`;

// ============================================================================
// Icon Mapping
// ============================================================================

const ICON_MAP: Record<string, string> = {
  spectrum: "▓",
  oscilloscope: "〰",
  milkdrop: "✦",
  vumeter: "◉",
  bars: "▮",
  circular: "◯",
  particles: "✦",
};

/**
 * Get icon for visualizer type
 */
function getIcon(id: string, name: string): string {
  // Try to match by ID
  const lowerId = id.toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lowerId.includes(key)) {
      return icon;
    }
  }

  // Try to match by name
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }

  // Default icon
  return "◆";
}

// ============================================================================
// Component
// ============================================================================

export const VisualizerSelector: FC<VisualizerSelectorProps> = ({
  options,
  currentId,
  onSelect,
  disabled = false,
  isLoading = false,
}) => {
  const handleSelect = useCallback(
    (id: string) => {
      if (id !== currentId && !disabled && !isLoading) {
        onSelect(id);
      }
    },
    [currentId, disabled, isLoading, onSelect],
  );

  if (options.length === 0) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="visualizer-selector">
          <span style={{ fontSize: "11px", color: "#808080" }}>
            No visualizers available
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="visualizer-selector">
        {options.map((option) => {
          const isActive = option.id === currentId;
          const icon = option.icon || getIcon(option.id, option.name);

          return (
            <div key={option.id} className="visualizer-selector-tab">
              <Button90s
                onClick={() => handleSelect(option.id)}
                disabled={disabled || (isLoading && !isActive)}
                winampStyle
                size="sm"
                className={isActive ? "active" : ""}
                title={option.description || option.name}
              >
                <span className="visualizer-selector-tab-content">
                  <span className="visualizer-selector-icon">{icon}</span>
                  <span className="visualizer-selector-name">
                    {option.name}
                  </span>
                  {isLoading && isActive && (
                    <span className="loading-indicator" />
                  )}
                </span>
              </Button90s>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default VisualizerSelector;
