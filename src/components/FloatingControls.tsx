/**
 * FloatingControls Component
 * Minimal auto-hiding controls for visualizer selection and options
 */

import { useState, useEffect, useCallback, type FC } from "react";

interface VisualizerOption {
  id: string;
  name: string;
}

interface FloatingControlsProps {
  visualizers: VisualizerOption[];
  currentVisualizer: string | null;
  onVisualizerSelect: (id: string) => void;
  crtEnabled: boolean;
  onCrtToggle: () => void;
}

const STYLES = `
.floating-controls {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.floating-controls.hidden {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
  pointer-events: none;
}

.viz-pill {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-family: system-ui, sans-serif;
  cursor: pointer;
  transition: all 0.15s ease;
}

.viz-pill:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.viz-pill.active {
  background: rgba(0, 255, 157, 0.2);
  border-color: rgba(0, 255, 157, 0.5);
  color: #00ff9d;
}

.divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
}

.toggle-btn {
  padding: 8px 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-family: system-ui, sans-serif;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.toggle-btn.active {
  background: rgba(0, 217, 255, 0.2);
  border-color: rgba(0, 217, 255, 0.5);
  color: #00d9ff;
}
`;

export const FloatingControls: FC<FloatingControlsProps> = ({
  visualizers,
  currentVisualizer,
  onVisualizerSelect,
  crtEnabled,
  onCrtToggle,
}) => {
  const [visible, setVisible] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
    setVisible(true);
  }, []);

  // Auto-hide after 3s of inactivity
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastActivity > 3000) {
        setVisible(false);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [lastActivity]);

  // Mouse move listener
  useEffect(() => {
    window.addEventListener("mousemove", handleActivity);
    return () => window.removeEventListener("mousemove", handleActivity);
  }, [handleActivity]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      // 1-4 for visualizers
      const num = parseInt(e.key);
      const vizOption = visualizers[num - 1];
      if (num >= 1 && num <= 4 && vizOption) {
        onVisualizerSelect(vizOption.id);
        handleActivity();
      }

      // C for CRT
      if (e.key.toLowerCase() === "c") {
        onCrtToggle();
        handleActivity();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visualizers, onVisualizerSelect, onCrtToggle, handleActivity]);

  return (
    <>
      <style>{STYLES}</style>
      <div
        className={`floating-controls ${visible ? "" : "hidden"}`}
        data-testid="visualizer-selector"
      >
        {visualizers.map((viz, i) => (
          <button
            key={viz.id}
            className={`viz-pill ${currentVisualizer === viz.id ? "active" : ""}`}
            onClick={() => onVisualizerSelect(viz.id)}
            title={`${viz.name} (${i + 1})`}
            data-testid="visualizer-option"
            data-id={viz.id}
          >
            {viz.name}
          </button>
        ))}

        <div className="divider" />

        <button
          className={`toggle-btn ${crtEnabled ? "active" : ""}`}
          onClick={onCrtToggle}
          title="Toggle CRT (C)"
        >
          CRT
        </button>
      </div>
    </>
  );
};

export default FloatingControls;
