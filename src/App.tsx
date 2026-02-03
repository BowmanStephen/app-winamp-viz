/**
 * App Component
 *
 * Main application component that integrates all features:
 * - MainWindow90s as root container
 * - VisualizerManager integration
 * - CRTEffects overlay
 * - ThemeProvider wrapper
 * - Control panel with buttons
 * - Visualizer selector (tabs/buttons)
 * - Playlist panel
 * - Status bar with fake info
 * - Demo mode toggle
 * - ErrorBoundary wrapper
 * - Responsive layout
 *
 * @module App
 */

import { useRef, useEffect, useState, useCallback } from "react";
import type { FC } from "react";

// Components
import { Window90s } from "./components/ui/Window90s";
import { Button90s, ToggleButton90s } from "./components/ui/Button90s";
import { ControlPanel } from "./components/ControlPanel";
import { VisualizerSelector } from "./components/VisualizerSelector";
import { CRTEffects } from "./components/CRTEffects";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Hooks
import { useAudioAnalyzer } from "./hooks/useAudioAnalyzer";
import { useVisualizer } from "./hooks/useVisualizer";

// Theme
import { ThemeManager } from "./themes/ThemeManager";

// Types

// ============================================================================
// Types
// ============================================================================

interface PlaylistItem {
  id: string;
  title: string;
  artist: string;
  duration: number;
}

// ============================================================================
// Fake Playlist Data
// ============================================================================

const FAKE_PLAYLIST: PlaylistItem[] = [
  { id: "1", title: "Demo Track 1", artist: "Synthesizer", duration: 184 },
  { id: "2", title: "Oscillator Wave", artist: "Audio Lab", duration: 245 },
  { id: "3", title: "Frequency Sweep", artist: "Spectrum", duration: 198 },
  { id: "4", title: "Bass Test", artist: "Subwoofer", duration: 156 },
];

// ============================================================================
// Styles
// ============================================================================

const APP_STYLES = `
.app-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0a0a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.app-window {
  width: 900px;
  max-width: 95vw;
  height: 700px;
  max-height: 95vh;
}

.app-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 4px;
}

.visualizer-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #000000;
  border: 2px solid;
  border-color: #404040 #ffffff #ffffff #404040;
  position: relative;
  overflow: hidden;
  min-height: 300px;
}

.visualizer-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.visualizer-overlay {
  position: absolute;
  top: 4px;
  left: 4px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #00ff00;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border: 1px solid #333;
  pointer-events: none;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.top-controls {
  display: flex;
  gap: 4px;
  align-items: flex-start;
}

.visualizer-selector-wrapper {
  flex: 1;
}

.options-panel {
  display: flex;
  gap: 4px;
  align-items: center;
}

.playlist-section {
  background-color: #c0c0c0;
  border: 2px solid;
  border-color: #ffffff #404040 #404040 #ffffff;
  max-height: 150px;
  overflow-y: auto;
}

.playlist-header {
  background: linear-gradient(to right, #000080 0%, #1084d0 100%);
  color: #ffffff;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.playlist-item {
  display: flex;
  padding: 4px 8px;
  font-size: 11px;
  border-bottom: 1px solid #a0a0a0;
  cursor: pointer;
}

.playlist-item:hover {
  background-color: #000080;
  color: #ffffff;
}

.playlist-item.active {
  background-color: #000080;
  color: #ffffff;
}

.playlist-item-number {
  width: 24px;
  color: #808080;
}

.playlist-item:hover .playlist-item-number,
.playlist-item.active .playlist-item-number {
  color: #c0c0c0;
}

.playlist-item-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
}

.playlist-item-title {
  font-weight: bold;
}

.playlist-item-duration {
  color: #808080;
}

.playlist-item:hover .playlist-item-duration,
.playlist-item.active .playlist-item-duration {
  color: #c0c0c0;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 2px 8px;
  background-color: #c0c0c0;
  border-top: 1px solid #808080;
  font-size: 11px;
}

.status-panel {
  display: flex;
  gap: 16px;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-label {
  color: #404040;
}

.status-value {
  font-family: 'Courier New', monospace;
  color: #000000;
  background-color: #e0e0e0;
  padding: 0 4px;
  border: 1px solid;
  border-color: #808080 #ffffff #ffffff #808080;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .app-window {
    width: 100%;
    height: 100%;
    max-width: 100vw;
    max-height: 100vh;
  }
  
  .top-controls {
    flex-direction: column;
  }
  
  .options-panel {
    flex-wrap: wrap;
  }
}
`;

// ============================================================================
// Theme Provider Component
// ============================================================================

const ThemeProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const themeManager = ThemeManager.getInstance();
    themeManager.applyTheme(themeManager.loadTheme("winamp-classic"));

    return () => {
      // Cleanup if needed
    };
  }, []);

  return <>{children}</>;
};

// ============================================================================
// Main App Component
// ============================================================================

const AppContent: FC = () => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Canvas state - needed to trigger visualizer initialization after mount
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(
    null,
  );

  // State
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [showVisualizerInfo] = useState(true);

  // Audio hook
  const {
    audioData,
    isPlaying,
    isDemoMode,
    peak,
    rms,
    play,
    pause,
    setDemoMode,
    isInitialized: audioInitialized,
    error: audioError,
  } = useAudioAnalyzer({
    demoMode: true,
    updateInterval: 16,
  });

  // Visualizer hook - uses canvasElement state instead of ref
  const {
    currentVisualizer,
    currentInfo,
    availableVisualizers,
    switchVisualizer,
    isLoading: visualizerLoading,
    error: visualizerError,
    fps,
    frameTime,
    setDemoMode: setVisualizerDemoMode,
    manager,
  } = useVisualizer({
    initialVisualizer: "spectrum",
    canvas: canvasElement,
  });

  // Sync demo mode
  useEffect(() => {
    if (isDemoMode) {
      setVisualizerDemoMode(true);
    }
  }, [isDemoMode, setVisualizerDemoMode]);

  // Animation loop for visualizer
  useEffect(() => {
    if (!audioData || !currentVisualizer || !manager) return;

    const animate = () => {
      // Update visualizer with audio data and render
      manager.update(audioData);
      manager.render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioData, currentVisualizer, manager]);

  // Handle demo mode toggle
  const handleDemoModeToggle = useCallback(
    (enabled: boolean) => {
      setDemoMode(enabled);
    },
    [setDemoMode],
  );

  // Handle visualizer switch
  const handleVisualizerSelect = useCallback(
    (id: string) => {
      switchVisualizer(id).catch((err) => {
        console.error("[App] Failed to switch visualizer:", err);
      });
    },
    [switchVisualizer],
  );

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Combined error
  const error = audioError || visualizerError;

  return (
    <>
      <style>{APP_STYLES}</style>
      <CRTEffects
        config={{
          enabled: crtEnabled,
          scanlineIntensity: 0.15,
          phosphorGlow: 0.25,
          curvature: 0.02,
          vignette: 0.35,
          flicker: 0.03,
          rgbSeparation: 0.02,
          noise: 0.05,
          colorTemperature: "warm",
        }}
      >
        <div className="app-container">
          <Window90s
            title="Winamp Visualizer v1.0"
            defaultSize={{ width: 900, height: 700 }}
            minSize={{ width: 600, height: 400 }}
            centerOnMount
            winampStyle
            className="app-window"
          >
            <div className="app-content">
              {/* Visualizer Canvas */}
              <div className="visualizer-section">
                <canvas
                  ref={(el) => {
                    canvasRef.current = el;
                    // Update state to trigger visualizer initialization
                    if (el !== canvasElement) {
                      setCanvasElement(el);
                    }
                  }}
                  className="visualizer-canvas"
                  width={800}
                  height={400}
                />

                {showVisualizerInfo && (
                  <div className="visualizer-overlay">
                    <div>FPS: {fps.toFixed(1)}</div>
                    <div>Frame: {frameTime.toFixed(2)}ms</div>
                    <div>Peak: {(peak * 100).toFixed(0)}%</div>
                    <div>RMS: {(rms * 100).toFixed(0)}%</div>
                  </div>
                )}

                {error && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      backgroundColor: "rgba(128, 0, 0, 0.9)",
                      color: "#ffffff",
                      padding: "16px",
                      border: "2px solid #ff0000",
                      textAlign: "center",
                      fontFamily: "system-ui, sans-serif",
                      maxWidth: "80%",
                    }}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                      ⚠️
                    </div>
                    <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                      Error
                    </div>
                    <div style={{ fontSize: "12px" }}>{error.message}</div>
                  </div>
                )}
              </div>

              {/* Controls Section */}
              <div className="controls-section">
                {/* Top Row: Selector + Options */}
                <div className="top-controls">
                  <div className="visualizer-selector-wrapper">
                    <VisualizerSelector
                      options={availableVisualizers.map((v) => ({
                        id: v.id,
                        name: v.name,
                        description: v.description,
                      }))}
                      currentId={currentVisualizer}
                      onSelect={handleVisualizerSelect}
                      disabled={!!error}
                      isLoading={visualizerLoading}
                    />
                  </div>

                  <div className="options-panel">
                    <ToggleButton90s
                      pressed={isDemoMode}
                      onPressedChange={handleDemoModeToggle}
                      winampStyle
                      size="sm"
                      title="Toggle Demo Mode"
                    >
                      Demo
                    </ToggleButton90s>

                    <Button90s
                      onClick={() => setShowPlaylist(!showPlaylist)}
                      winampStyle
                      size="sm"
                      className={showPlaylist ? "active" : ""}
                    >
                      Playlist
                    </Button90s>

                    <Button90s
                      onClick={() => setCrtEnabled(!crtEnabled)}
                      winampStyle
                      size="sm"
                      className={crtEnabled ? "active" : ""}
                    >
                      CRT
                    </Button90s>
                  </div>
                </div>

                {/* Control Panel */}
                <ControlPanel
                  isPlaying={isPlaying}
                  currentTime={audioInitialized ? 45 : 0}
                  duration={184}
                  volume={0.8}
                  muted={false}
                  onPlay={play}
                  onPause={pause}
                  onStop={() => pause()}
                  onSeek={() => {}}
                  onVolumeChange={() => {}}
                  onToggleMute={() => {}}
                  disabled={!!error}
                  isDemoMode={isDemoMode}
                />
              </div>

              {/* Playlist Section */}
              {showPlaylist && (
                <div className="playlist-section">
                  <div className="playlist-header">
                    <span>Playlist</span>
                    <span>{FAKE_PLAYLIST.length} tracks</span>
                  </div>
                  {FAKE_PLAYLIST.map((track, index) => (
                    <div
                      key={track.id}
                      className={`playlist-item ${index === currentTrack ? "active" : ""}`}
                      onClick={() => setCurrentTrack(index)}
                    >
                      <span className="playlist-item-number">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>
                      <div className="playlist-item-info">
                        <span className="playlist-item-title">
                          {track.title}
                        </span>
                        <span className="playlist-item-artist">
                          {track.artist}
                        </span>
                        <span className="playlist-item-duration">
                          {formatTime(track.duration)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Status Bar */}
              <div className="status-bar">
                <div className="status-panel">
                  <div className="status-item">
                    <span className="status-label">Visualizer:</span>
                    <span className="status-value">
                      {currentInfo?.name || "None"}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Audio:</span>
                    <span className="status-value">
                      {isDemoMode ? "Demo" : isPlaying ? "Playing" : "Stopped"}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Mode:</span>
                    <span className="status-value">
                      {audioInitialized ? "Ready" : "Initializing"}
                    </span>
                  </div>
                </div>
                <div className="status-panel">
                  <div className="status-item">
                    <span className="status-label">CPU:</span>
                    <span className="status-value">{fps.toFixed(0)} FPS</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Mem:</span>
                    <span className="status-value">
                      {(
                        (performance as any).memory?.usedJSHeapSize /
                          1024 /
                          1024 || 0
                      ).toFixed(0)}{" "}
                      MB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Window90s>
        </div>
      </CRTEffects>
    </>
  );
};

// ============================================================================
// App with Error Boundary
// ============================================================================

const App: FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("[App] Error caught by boundary:", error, errorInfo);
      }}
      onRetry={() => {
        window.location.reload();
      }}
    >
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
