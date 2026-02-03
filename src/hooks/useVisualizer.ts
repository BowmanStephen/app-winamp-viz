/**
 * useVisualizer Hook
 *
 * React hook for managing visualizer state and switching between visualizers.
 *
 * @module useVisualizer
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { VisualizerManager } from "../visualizers/VisualizerManager";
import type { VisualizerConfigUnion } from "../types";

/**
 * Visualizer metadata for UI display
 */
interface VisualizerInfo {
  id: string;
  name: string;
  description: string;
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

  /** Current visualizer metadata */
  currentInfo: VisualizerInfo | null;

  /** All available visualizers */
  availableVisualizers: VisualizerInfo[];

  /** Switch to a different visualizer */
  switchVisualizer: (id: string) => Promise<void>;

  /** Whether a visualizer is currently loading */
  isLoading: boolean;

  /** Error state */
  error: Error | null;

  /** Current visualizer configuration */
  config: VisualizerConfigUnion | null;

  /** Update visualizer configuration */
  updateConfig: (config: Partial<VisualizerConfigUnion>) => void;

  /** Enable/disable demo mode */
  setDemoMode: (enabled: boolean) => void;

  /** Current performance metrics */
  fps: number;
  frameTime: number;

  /** Whether currently transitioning between visualizers */
  isTransitioning: boolean;

  /** Reference to the VisualizerManager instance */
  manager: VisualizerManager | null;
}

/**
 * React hook for visualizer management
 *
 * Provides reactive access to the VisualizerManager and manages visualizer state.
 *
 * @example
 * ```tsx
 * const canvasRef = useRef<HTMLCanvasElement>(null);
 * const {
 *   currentVisualizer,
 *   availableVisualizers,
 *   switchVisualizer,
 *   isLoading
 * } = useVisualizer({
 *   initialVisualizer: 'spectrum',
 *   canvas: canvasRef.current
 * });
 *
 * return (
 *   <div>
 *     <canvas ref={canvasRef} />
 *     <select onChange={(e) => switchVisualizer(e.target.value)}>
 *       {availableVisualizers.map(v => (
 *         <option key={v.id} value={v.id}>{v.name}</option>
 *       ))}
 *     </select>
 *   </div>
 * );
 * ```
 */
export function useVisualizer(
  options: UseVisualizerOptions = {},
): UseVisualizerReturn {
  const { initialVisualizer = "spectrum", canvas } = options;

  // Manager reference
  const managerRef = useRef<VisualizerManager | null>(null);

  // State
  const [currentVisualizer, setCurrentVisualizer] = useState<string | null>(
    null,
  );
  const [currentInfo, setCurrentInfo] = useState<VisualizerInfo | null>(null);
  const [availableVisualizers, setAvailableVisualizers] = useState<
    VisualizerInfo[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [config, setConfig] = useState<VisualizerConfigUnion | null>(null);
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);

  // Initialize manager
  useEffect(() => {
    managerRef.current = new VisualizerManager();

    // Get available visualizers
    const metadata = managerRef.current.getAvailableVisualizers();
    setAvailableVisualizers(
      metadata.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        type: m.type,
      })),
    );

    // Cleanup
    return () => {
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
    };
  }, []);

  // Initialize with canvas when available
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager || !canvas) return;

    const init = async () => {
      try {
        setIsLoading(true);
        await manager.initialize(canvas);

        // Switch to initial visualizer
        if (initialVisualizer) {
          await switchVisualizer(initialVisualizer);
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

  // Update metrics on animation frame
  useEffect(() => {
    const manager = managerRef.current;
    if (!manager) return;

    let animationId: number;

    const updateMetrics = () => {
      const metrics = manager.getMetrics();
      setFps(metrics.fps);
      setFrameTime(metrics.frameTime);
      animationId = requestAnimationFrame(updateMetrics);
    };

    animationId = requestAnimationFrame(updateMetrics);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Switch visualizer
  const switchVisualizer = useCallback(
    async (id: string): Promise<void> => {
      const manager = managerRef.current;
      if (!manager) {
        throw new Error("VisualizerManager not initialized");
      }

      if (currentVisualizer === id) return;

      setIsTransitioning(true);
      setIsLoading(true);
      setError(null);

      try {
        await manager.switchVisualizer(id);

        setCurrentVisualizer(id);

        // Update current info
        const metadata = manager.getVisualizerMetadata(id);
        if (metadata) {
          setCurrentInfo({
            id: metadata.id,
            name: metadata.name,
            description: metadata.description,
            type: metadata.type,
          });
        }

        // Update config
        const newConfig = manager.getVisualizerConfig();
        setConfig(newConfig);

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
        setIsTransitioning(false);
      }
    },
    [currentVisualizer],
  );

  // Update config
  const updateConfig = useCallback(
    (newConfig: Partial<VisualizerConfigUnion>): void => {
      const manager = managerRef.current;
      if (!manager) return;

      manager.setVisualizerConfig(newConfig);
      setConfig(manager.getVisualizerConfig());
    },
    [],
  );

  // Set demo mode
  const setDemoMode = useCallback((enabled: boolean): void => {
    const manager = managerRef.current;
    if (!manager) return;

    manager.setDemoMode(enabled);
  }, []);

  return {
    currentVisualizer,
    currentInfo,
    availableVisualizers,
    switchVisualizer,
    isLoading,
    error,
    config,
    updateConfig,
    setDemoMode,
    fps,
    frameTime,
    isTransitioning,
    manager: managerRef.current,
  };
}

export default useVisualizer;
