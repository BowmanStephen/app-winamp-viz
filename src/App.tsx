/**
 * App Component - Shader-First Architecture
 * Full-screen shader canvas with minimal floating controls
 */

import { useMemo, useState, useCallback, type FC } from "react";

import { FloatingControls } from "./components/FloatingControls";
import { CRTOverlay } from "./components/CRTOverlay";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ShaderCanvas } from "./components/ShaderCanvas";

import { SHADERS } from "./shaders";

const DEFAULT_SHADER_ID = SHADERS[0]?.id ?? null;

const App: FC = () => {
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [currentShaderId, setCurrentShaderId] = useState(DEFAULT_SHADER_ID);

  const currentShader = useMemo(
    () => SHADERS.find((shader) => shader.id === currentShaderId) ?? SHADERS[0],
    [currentShaderId],
  );

  const handleShaderSelect = useCallback((id: string) => {
    setCurrentShaderId(id);
  }, []);

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

        <FloatingControls
          visualizers={SHADERS.map((shader) => ({
            id: shader.id,
            name: shader.name,
          }))}
          currentVisualizer={currentShader?.id ?? null}
          onVisualizerSelect={handleShaderSelect}
          crtEnabled={crtEnabled}
          onCrtToggle={() => setCrtEnabled(!crtEnabled)}
        />

        <CRTOverlay enabled={crtEnabled} />
      </div>
    </ErrorBoundary>
  );
};

export default App;
