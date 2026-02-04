/**
 * App Component - Shader-First Architecture
 * Full-screen shader canvas with minimal floating controls
 */

import { useEffect, useMemo, useState, useCallback, type FC } from "react";

import { FloatingControls } from "./components/FloatingControls";
import { CRTOverlay } from "./components/CRTOverlay";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ShaderCanvas } from "./components/ShaderCanvas";
import { ShaderCredits } from "./components/ShaderCredits";

import { ThemeManager, BUILT_IN_THEMES } from "./themes/ThemeManager";
import { SHADERS } from "./shaders";

const THEMES = ["winamp-classic", "cyberpunk", "monochrome"] as const;
const DEFAULT_SHADER_ID = SHADERS[0]?.id ?? null;

const App: FC = () => {
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [currentShaderId, setCurrentShaderId] = useState(DEFAULT_SHADER_ID);

  const themeManager = ThemeManager.getInstance();

  const currentShader = useMemo(
    () => SHADERS.find((shader) => shader.id === currentShaderId) ?? SHADERS[0],
    [currentShaderId],
  );

  // Apply initial theme
  useEffect(() => {
    const themeId = THEMES[0];
    themeManager.applyTheme(themeManager.loadTheme(themeId));
  }, [themeManager]);

  const handleShaderSelect = useCallback((id: string) => {
    setCurrentShaderId(id);
  }, []);

  const handleThemeCycle = useCallback(() => {
    const nextIndex = (currentThemeIndex + 1) % THEMES.length;
    setCurrentThemeIndex(nextIndex);
    const themeId = THEMES[nextIndex];
    if (themeId) {
      themeManager.applyTheme(themeManager.loadTheme(themeId));
    }
  }, [currentThemeIndex, themeManager]);

  const currentThemeName =
    BUILT_IN_THEMES.find((t) => t.id === THEMES[currentThemeIndex])?.name ??
    "Theme";

  return (
    <ErrorBoundary onRetry={() => window.location.reload()}>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#000",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {currentShader ? <ShaderCanvas shader={currentShader} /> : null}
        {currentShader ? <ShaderCredits shader={currentShader} /> : null}

        <FloatingControls
          visualizers={SHADERS.map((shader) => ({
            id: shader.id,
            name: shader.name,
          }))}
          currentVisualizer={currentShader?.id ?? null}
          onVisualizerSelect={handleShaderSelect}
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
