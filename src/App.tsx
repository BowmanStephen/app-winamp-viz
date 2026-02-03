/**
 * App Component - Visualizer-First Architecture
 * Full-screen canvas with minimal floating controls
 */

import { useRef, useEffect, useState, useCallback, type FC } from "react";

import { FloatingControls } from "./components/FloatingControls";
import { DropZone } from "./components/DropZone";
import { CRTOverlay } from "./components/CRTOverlay";
import { ErrorBoundary } from "./components/ErrorBoundary";

import { useAudioAnalyzer } from "./hooks/useAudioAnalyzer";
import { useVisualizer } from "./hooks/useVisualizer";
import { ThemeManager, BUILT_IN_THEMES } from "./themes/ThemeManager";
import { VisualizerManager } from "./visualizers/VisualizerManager";
import type { AudioData } from "./types";

const THEMES = ["winamp-classic", "cyberpunk", "monochrome"] as const;

const App: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioDataRef = useRef<AudioData | null>(null);
  const managerRef = useRef<VisualizerManager | null>(null);
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);

  const [crtEnabled, setCrtEnabled] = useState(true);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const themeManager = ThemeManager.getInstance();

  // Audio hook
  const { audioData, initWithFile } = useAudioAnalyzer({ demoMode: true });

  // Visualizer hook
  const {
    currentVisualizer,
    availableVisualizers,
    switchVisualizer,
    manager,
  } = useVisualizer({
    initialVisualizer: "spectrum",
    canvas: canvasElement,
  });

  // Apply initial theme
  useEffect(() => {
    const themeId = THEMES[0];
    themeManager.applyTheme(themeManager.loadTheme(themeId));
  }, [themeManager]);

  // Keep refs in sync for animation loop
  useEffect(() => {
    managerRef.current = manager;
  }, [manager]);

  useEffect(() => {
    audioDataRef.current = audioData;
  }, [audioData]);

  // Animation loop - starts once when we have a visualizer
  useEffect(() => {
    if (!currentVisualizer || !manager) return;

    console.log("[App] Starting animation loop for:", currentVisualizer);
    let running = true;

    const animate = () => {
      if (!running) return;

      const data = audioDataRef.current;
      const mgr = managerRef.current;
      if (data && mgr) {
        mgr.update(data);
        mgr.render();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      console.log("[App] Stopping animation loop");
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentVisualizer, manager]);

  // Canvas resize handler - notify visualizer manager
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        // Notify visualizer of resize
        manager?.resize?.(width, height);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [manager]);

  const handleVisualizerSelect = useCallback(
    (id: string) => {
      switchVisualizer(id).catch(console.error);
    },
    [switchVisualizer]
  );

  const handleThemeCycle = useCallback(() => {
    const nextIndex = (currentThemeIndex + 1) % THEMES.length;
    setCurrentThemeIndex(nextIndex);
    const themeId = THEMES[nextIndex];
    if (themeId) {
      themeManager.applyTheme(themeManager.loadTheme(themeId));
    }
  }, [currentThemeIndex, themeManager]);

  const handleFileDrop = useCallback(
    (file: File) => {
      initWithFile(file).catch(console.error);
    },
    [initWithFile]
  );

  const currentThemeName =
    BUILT_IN_THEMES.find((t) => t.id === THEMES[currentThemeIndex])?.name ?? "Theme";

  return (
    <ErrorBoundary onRetry={() => window.location.reload()}>
      <div style={{ width: "100vw", height: "100vh", background: "#000", overflow: "hidden" }}>
        <canvas
          ref={(el) => {
            canvasRef.current = el;
            if (el && el !== canvasElement) {
              // Wait for next frame to ensure CSS is computed
              requestAnimationFrame(() => {
                el.width = window.innerWidth;
                el.height = window.innerHeight;
                setCanvasElement(el);
              });
            }
          }}
          style={{
            display: "block",
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
          }}
        />

        <DropZone onFileDrop={handleFileDrop} />

        <FloatingControls
          visualizers={availableVisualizers.map((v) => ({ id: v.id, name: v.name }))}
          currentVisualizer={currentVisualizer}
          onVisualizerSelect={handleVisualizerSelect}
          crtEnabled={crtEnabled}
          onCrtToggle={() => setCrtEnabled(!crtEnabled)}
          onThemeCycle={handleThemeCycle}
          themeName={currentThemeName}
        />

        <CRTOverlay enabled={crtEnabled} />
      </div>
    </ErrorBoundary>
  );
};

export default App;
