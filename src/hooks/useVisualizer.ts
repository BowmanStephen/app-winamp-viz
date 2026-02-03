/**
 * useVisualizer Hook
 *
 * React hook for managing visualizer state and switching between visualizers.
 *
 * @module useVisualizer
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { VisualizerManager } from "../visualizers/VisualizerManager";

/**
 * Visualizer info for UI display
 */
interface VisualizerInfo {
  id: string;
  name: string;
  type: string;
}

/**
 * Hook options
 */
interface UseVisualizerOptions {
  /** Initial visualizer ID */
  initialVisualizer?: string;
  /** Canvas element to render to */
  canvas?: HTMLCanvasElement | null;
}

/**
 * Hook return value
 */
interface UseVisualizerReturn {
  /** Currently active visualizer ID */
  currentVisualizer: string | null;
  /** All available visualizers */
  availableVisualizers: VisualizerInfo[];
  /** Switch to a different visualizer */
  switchVisualizer: (id: string) => Promise<void>;
  /** Whether a visualizer is currently loading */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Enable/disable demo mode */
  setDemoMode: (enabled: boolean) => void;
  /** Current FPS */
  fps: number;
  /** Reference to the VisualizerManager instance */
  manager: VisualizerManager | null;
}

/**
 * React hook for visualizer management
 */
export function useVisualizer(
  options: UseVisualizerOptions = {},
): UseVisualizerReturn {
  const { initialVisualizer = "spectrum", canvas } = options;

  const managerRef = useRef<VisualizerManager | null>(null);

  const [currentVisualizer, setCurrentVisualizer] = useState<string | null>(
    null,
  );
  const [availableVisualizers, setAvailableVisualizers] = useState<
    VisualizerInfo[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fps, setFps] = useState(0);

  // Initialize manager
  useEffect(() => {
    managerRef.current = new VisualizerManager();
    const metadata = managerRef.current.getAvailableVisualizers();
    setAvailableVisualizers(metadata);

    return () => {
      managerRef.current?.dispose();
      managerRef.current = null;
    };
  }, []);

  // Initialize with canvas
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager || !canvas) return;

    const init = async () => {
      try {
        setIsLoading(true);
        await manager.initialize(canvas);
        if (initialVisualizer) {
          await manager.switchVisualizer(initialVisualizer);
          setCurrentVisualizer(initialVisualizer);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);

  // Update FPS on animation frame
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;

    let animationId: number;
    const updateFps = () => {
      setFps(manager.fps);
      animationId = requestAnimationFrame(updateFps);
    };
    animationId = requestAnimationFrame(updateFps);

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Switch visualizer
  const switchVisualizer = useCallback(
    async (id: string): Promise<void> => {
      const manager = managerRef.current;
      if (!manager) throw new Error("VisualizerManager not initialized");
      if (currentVisualizer === id) return;

      setIsLoading(true);
      setError(null);

      try {
        await manager.switchVisualizer(id);
        setCurrentVisualizer(id);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentVisualizer],
  );

  // Set demo mode
  const setDemoMode = useCallback((enabled: boolean): void => {
    managerRef.current?.setDemoMode(enabled);
  }, []);

  return {
    currentVisualizer,
    availableVisualizers,
    switchVisualizer,
    isLoading,
    error,
    setDemoMode,
    fps,
    manager: managerRef.current,
  };
}

export default useVisualizer;
