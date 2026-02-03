/**
 * Lazy Loading Utilities
 *
 * Provides utilities for lazy loading visualizer components with Suspense.
 * Includes preloading capabilities for better performance.
 *
 * @module lazyLoad
 */

import {
  lazy,
  Suspense,
  type LazyExoticComponent,
  type ComponentType,
  type ReactNode,
} from "react";

/**
 * Map of visualizer IDs to their module paths
 */
const VISUALIZER_MODULES: Record<
  string,
  () => Promise<{ default: ComponentType }>
> = {
  spectrum: () =>
    import("../visualizers/SpectrumAnalyzer") as unknown as Promise<{
      default: ComponentType;
    }>,
  oscilloscope: () =>
    import("../visualizers/Oscilloscope") as unknown as Promise<{
      default: ComponentType;
    }>,
  milkdrop: () =>
    import("../visualizers/MilkdropVisualizer") as unknown as Promise<{
      default: ComponentType;
    }>,
  bars: () =>
    import("../visualizers/SpectrumAnalyzer") as unknown as Promise<{
      default: ComponentType;
    }>,
  circular: () =>
    import("../visualizers/VUMeter") as unknown as Promise<{
      default: ComponentType;
    }>,
  particles: () =>
    import("../visualizers/MilkdropVisualizer") as unknown as Promise<{
      default: ComponentType;
    }>,
};

/**
 * Cache of loaded visualizers
 */
const visualizerCache = new Map<string, LazyExoticComponent<ComponentType>>();

/**
 * Preload cache to track what's being preloaded
 */
const preloadCache = new Set<string>();

/**
 * Lazy load a visualizer component
 *
 * Returns a lazy-loaded component that can be rendered with Suspense.
 * Components are cached after first load.
 *
 * @param visualizerId - ID of the visualizer to load
 * @returns Lazy-loaded component
 * @throws Error if visualizer ID is unknown
 *
 * @example
 * ```tsx
 * const SpectrumVisualizer = lazyVisualizer('spectrum');
 *
 * function App() {
 *   return (
 *     <Suspense fallback={<LoadingSpinner />}>
 *       <SpectrumVisualizer config={config} />
 *     </Suspense>
 *   );
 * }
 * ```
 */
export function lazyVisualizer(
  visualizerId: string,
): LazyExoticComponent<ComponentType> {
  // Return cached component if available
  if (visualizerCache.has(visualizerId)) {
    return visualizerCache.get(visualizerId)!;
  }

  // Get module loader
  const moduleLoader = VISUALIZER_MODULES[visualizerId];

  if (!moduleLoader) {
    throw new Error(
      `Unknown visualizer: ${visualizerId}. ` +
        `Available visualizers: ${Object.keys(VISUALIZER_MODULES).join(", ")}`,
    );
  }

  // Create lazy component
  const LazyComponent = lazy(moduleLoader);

  // Cache it
  visualizerCache.set(visualizerId, LazyComponent);

  return LazyComponent;
}

/**
 * Preload a visualizer component
 *
 * Starts loading the visualizer module in the background.
 * Useful for improving perceived performance.
 *
 * @param visualizerId - ID of the visualizer to preload
 * @returns Promise that resolves when preloading is complete
 *
 * @example
 * ```tsx
 * // Preload spectrum visualizer when hovering over a menu item
 * <button
 *   onMouseEnter={() => preloadVisualizer('spectrum')}
 *   onClick={() => setActiveVisualizer('spectrum')}
 * >
 *   Spectrum
 * </button>
 * ```
 */
export async function preloadVisualizer(visualizerId: string): Promise<void> {
  // Skip if already cached or preloading
  if (visualizerCache.has(visualizerId) || preloadCache.has(visualizerId)) {
    return;
  }

  const moduleLoader = VISUALIZER_MODULES[visualizerId];

  if (!moduleLoader) {
    console.warn(`[lazyLoad] Unknown visualizer for preload: ${visualizerId}`);
    return;
  }

  preloadCache.add(visualizerId);

  try {
    await moduleLoader();
    console.log(`[lazyLoad] Preloaded visualizer: ${visualizerId}`);
  } catch (error) {
    console.error(
      `[lazyLoad] Failed to preload visualizer: ${visualizerId}`,
      error,
    );
    preloadCache.delete(visualizerId);
  }
}

/**
 * Preload multiple visualizers at once
 *
 * @param visualizerIds - Array of visualizer IDs to preload
 *
 * @example
 * ```tsx
 * // Preload all visualizers on app start
 * useEffect(() => {
 *   preloadVisualizers(['spectrum', 'oscilloscope', 'bars']);
 * }, []);
 * ```
 */
export function preloadVisualizers(visualizerIds: string[]): void {
  visualizerIds.forEach((id) => {
    preloadVisualizer(id).catch(console.error);
  });
}

/**
 * Check if a visualizer has been loaded
 * @param visualizerId - ID of the visualizer
 * @returns True if the visualizer is cached
 */
export function isVisualizerLoaded(visualizerId: string): boolean {
  return visualizerCache.has(visualizerId);
}

/**
 * Get list of loaded visualizer IDs
 * @returns Array of loaded visualizer IDs
 */
export function getLoadedVisualizers(): string[] {
  return Array.from(visualizerCache.keys());
}

/**
 * Clear the visualizer cache
 * Useful for memory management in long-running applications
 */
export function clearVisualizerCache(): void {
  visualizerCache.clear();
  preloadCache.clear();
  console.log("[lazyLoad] Visualizer cache cleared");
}

/**
 * Props for the VisualizerLoader component
 */
interface VisualizerLoaderProps {
  /** Visualizer ID to load */
  visualizerId: string;
  /** Props to pass to the loaded visualizer */
  visualizerProps?: Record<string, unknown>;
  /** Custom fallback component while loading */
  fallback?: ReactNode;
  /** Error handler if loading fails */
  onError?: (error: Error) => void;
}

/**
 * VisualizerLoader component with built-in Suspense
 *
 * A convenient wrapper that handles lazy loading with Suspense and error boundaries.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <VisualizerLoader
 *       visualizerId="spectrum"
 *       visualizerProps={{ config: spectrumConfig }}
 *       fallback={<div>Loading visualizer...</div>}
 *       onError={(err) => console.error('Failed to load:', err)}
 *     />
 *   );
 * }
 * ```
 */
export function VisualizerLoader({
  visualizerId,
  visualizerProps = {},
  fallback,
  onError,
}: VisualizerLoaderProps): ReactNode {
  // Default fallback
  const defaultFallback = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#1a1a2e",
        color: "#eaeaea",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #4a4a6a",
            borderTopColor: "#00ff9d",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 1rem",
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <span style={{ fontSize: "0.875rem", color: "#a0a0a0" }}>
          Loading visualizer...
        </span>
      </div>
    </div>
  );

  try {
    const LazyComponent = lazyVisualizer(visualizerId);

    return (
      <Suspense fallback={fallback || defaultFallback}>
        <LazyComponent {...visualizerProps} />
      </Suspense>
    );
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#1a1a2e",
          color: "#ff6b6b",
          padding: "1rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</div>
          <div>Failed to load visualizer: {visualizerId}</div>
        </div>
      </div>
    );
  }
}

/**
 * Higher-order component for lazy loading any component
 *
 * @param importFn - Dynamic import function
 * @returns Lazy-loaded component
 *
 * @example
 * ```typescript
 * const LazySettings = createLazyComponent(() => import('./Settings'));
 * ```
 */
export function createLazyComponent<T extends ComponentType>(
  importFn: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(importFn);
}

/**
 * Dynamic import helper with retry logic
 *
 * @param importFn - Import function to execute
 * @param retries - Number of retry attempts (default: 3)
 * @returns Promise resolving to the module
 */
export async function importWithRetry<T>(
  importFn: () => Promise<T>,
  retries: number = 3,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Exponential backoff
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Import failed after retries");
}

/**
 * Get available visualizer IDs
 * @returns Array of available visualizer IDs
 */
export function getAvailableVisualizers(): string[] {
  return Object.keys(VISUALIZER_MODULES);
}

export default {
  lazyVisualizer,
  preloadVisualizer,
  preloadVisualizers,
  isVisualizerLoaded,
  getLoadedVisualizers,
  clearVisualizerCache,
  VisualizerLoader,
  createLazyComponent,
  importWithRetry,
  getAvailableVisualizers,
};
