/**
 * ControlPanel Component
 *
 * Playback controls with 90s styling:
 * - Play/Pause/Stop buttons
 * - Volume slider
 * - Progress bar
 * - Time display
 *
 * @module ControlPanel
 */

import { useCallback, useMemo } from "react";
import type { FC } from "react";
import { Button90s } from "./ui/Button90s";
import { Slider90s } from "./ui/Slider90s";

// ============================================================================
// Types
// ============================================================================

export interface ControlPanelProps {
  /** Whether audio is currently playing */
  isPlaying: boolean;

  /** Current playback time in seconds */
  currentTime: number;

  /** Total duration in seconds */
  duration: number;

  /** Current volume (0-1) */
  volume: number;

  /** Whether audio is muted */
  muted: boolean;

  /** Callback when play is clicked */
  onPlay: () => void;

  /** Callback when pause is clicked */
  onPause: () => void;

  /** Callback when stop is clicked */
  onStop: () => void;

  /** Callback when seeking */
  onSeek: (time: number) => void;

  /** Callback when volume changes */
  onVolumeChange: (volume: number) => void;

  /** Callback when mute is toggled */
  onToggleMute: () => void;

  /** Whether controls are disabled */
  disabled?: boolean;

  /** Whether in demo mode */
  isDemoMode?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format time in seconds to MM:SS display
 */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ============================================================================
// Styles
// ============================================================================

const STYLES = `
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background-color: #c0c0c0;
  border: 2px solid;
  border-color: #ffffff #404040 #404040 #ffffff;
}

.control-panel-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-panel-buttons {
  display: flex;
  gap: 4px;
}

.control-panel-display {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  background-color: #000000;
  color: #00ff00;
  padding: 4px 8px;
  border: 2px solid;
  border-color: #404040 #ffffff #ffffff #404040;
  min-width: 80px;
  text-align: center;
}

.control-panel-display.paused {
  color: #808080;
}

.control-panel-volume {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.control-panel-volume-label {
  font-size: 11px;
  color: #000000;
  min-width: 40px;
}

.control-panel-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-panel-time {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #000000;
  min-width: 40px;
  text-align: center;
}

.control-panel-mute-btn {
  min-width: 50px;
}

.control-panel-mute-btn.muted {
  background-color: #800000;
  color: #ffffff;
}

/* Play button icon */
.play-icon {
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 8px solid currentColor;
}

/* Pause button icon */
.pause-icon {
  display: flex;
  gap: 2px;
}

.pause-icon::before,
.pause-icon::after {
  content: '';
  width: 3px;
  height: 10px;
  background-color: currentColor;
}

/* Stop button icon */
.stop-icon {
  width: 8px;
  height: 8px;
  background-color: currentColor;
}
`;

// ============================================================================
// Component
// ============================================================================

export const ControlPanel: FC<ControlPanelProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onVolumeChange,
  onToggleMute,
  disabled = false,
  isDemoMode = false,
}) => {
  // Calculate progress percentage
  const progress = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  // Handle play/pause toggle
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause]);

  // Handle progress change
  const handleProgressChange = useCallback(
    (value: number) => {
      if (!duration || duration <= 0) return;
      const newTime = (value / 100) * duration;
      onSeek(newTime);
    },
    [duration, onSeek],
  );

  // Handle volume change (convert 0-100 to 0-1)
  const handleVolumeChange = useCallback(
    (value: number) => {
      onVolumeChange(value / 100);
    },
    [onVolumeChange],
  );

  // Volume display
  const volumePercent = Math.round(volume * 100);

  return (
    <>
      <style>{STYLES}</style>
      <div className="control-panel">
        {/* Row 1: Playback buttons and time display */}
        <div className="control-panel-row">
          <div className="control-panel-buttons">
            <Button90s
              onClick={handlePlayPause}
              disabled={disabled}
              winampStyle
              size="sm"
              title={isPlaying ? "Pause" : "Play"}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                {isPlaying ? (
                  <>
                    <span className="pause-icon" />
                    Pause
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        width: 0,
                        height: 0,
                        borderTop: "5px solid transparent",
                        borderBottom: "5px solid transparent",
                        borderLeft: "8px solid currentColor",
                        marginRight: "2px",
                      }}
                    />
                    Play
                  </>
                )}
              </span>
            </Button90s>

            <Button90s
              onClick={onStop}
              disabled={disabled}
              winampStyle
              size="sm"
              title="Stop"
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: "currentColor",
                  }}
                />
                Stop
              </span>
            </Button90s>
          </div>

          <div
            className={`control-panel-display ${!isPlaying ? "paused" : ""}`}
          >
            {formatTime(currentTime)}
          </div>

          {isDemoMode && (
            <span
              style={{
                fontSize: "10px",
                color: "#008000",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              [DEMO MODE]
            </span>
          )}
        </div>

        {/* Row 2: Progress bar */}
        <div className="control-panel-row">
          <span className="control-panel-time">{formatTime(currentTime)}</span>
          <div className="control-panel-progress">
            <Slider90s
              value={progress}
              onChange={handleProgressChange}
              min={0}
              max={100}
              step={0.1}
              disabled={disabled || !duration}
              winampStyle
              size="sm"
              ariaLabel="Seek"
            />
          </div>
          <span className="control-panel-time">{formatTime(duration)}</span>
        </div>

        {/* Row 3: Volume control */}
        <div className="control-panel-row">
          <div className="control-panel-volume">
            <Button90s
              onClick={onToggleMute}
              disabled={disabled}
              winampStyle
              size="sm"
              className={`control-panel-mute-btn ${muted ? "muted" : ""}`}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? "Muted" : "Vol"}
            </Button90s>

            <span className="control-panel-volume-label">
              {muted ? "MUTE" : `${volumePercent}%`}
            </span>

            <Slider90s
              value={muted ? 0 : volumePercent}
              onChange={handleVolumeChange}
              min={0}
              max={100}
              step={1}
              disabled={disabled}
              winampStyle
              size="sm"
              showValue
              formatValue={(v) => `${v}%`}
              ariaLabel="Volume"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ControlPanel;
