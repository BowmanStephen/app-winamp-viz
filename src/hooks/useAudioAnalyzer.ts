/**
 * useAudioAnalyzer Hook
 *
 * React hook for connecting to AudioEngine and managing audio analysis data.
 * Returns frequency and time domain data, handles play/pause, and supports demo mode.
 *
 * @module useAudioAnalyzer
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { AudioEngine } from "../audio/AudioEngine";
import type { AudioData } from "../types";

/**
 * Hook options
 */
interface UseAudioAnalyzerOptions {
  /** Enable demo mode with synthesized audio */
  demoMode?: boolean;

  /** Update interval in milliseconds (default: 16ms for 60fps) */
  updateInterval?: number;

  /** FFT size for analysis (default: 2048) */
  fftSize?: number;

  /** Smoothing time constant (0-1, default: 0.8) */
  smoothingTimeConstant?: number;
}

/**
 * Hook return value
 */
interface UseAudioAnalyzerReturn {
  /** Current frequency data (0-255) */
  frequencyData: Uint8Array;

  /** Current time domain data (0-255, centered at 128) */
  timeDomainData: Uint8Array;

  /** Float frequency data in dB */
  floatFrequencyData: Float32Array;

  /** Float time domain data (-1 to 1) */
  floatTimeDomainData: Float32Array;

  /** Complete audio data package */
  audioData: AudioData | null;

  /** Whether audio is currently playing */
  isPlaying: boolean;

  /** Whether in demo mode */
  isDemoMode: boolean;

  /** Peak amplitude (0-1) */
  peak: number;

  /** RMS amplitude (0-1) */
  rms: number;

  /** Per-band energy levels */
  bands: Record<string, number>;

  /** Start audio playback */
  play: () => void;

  /** Pause audio playback */
  pause: () => void;

  /** Toggle play/pause */
  togglePlay: () => void;

  /** Enable/disable demo mode */
  setDemoMode: (enabled: boolean) => void;

  /** Initialize with an audio element */
  initWithElement: (element: HTMLAudioElement) => Promise<void>;

  /** Initialize with an audio file */
  initWithFile: (file: File) => Promise<void>;

  /** Resume audio context (required after browser autoplay policy) */
  resume: () => Promise<void>;

  /** Whether audio engine is initialized */
  isInitialized: boolean;

  /** Error state */
  error: Error | null;
}

/**
 * React hook for audio analysis
 *
 * Connects to the AudioEngine singleton and provides reactive access to audio data.
 * Automatically updates on each animation frame when playing.
 *
 * @example
 * ```tsx
 * const {
 *   frequencyData,
 *   timeDomainData,
 *   isPlaying,
 *   play,
 *   pause,
 *   setDemoMode
 * } = useAudioAnalyzer({ demoMode: true });
 *
 * // Use data in visualizer
 * useEffect(() => {
 *   visualizer.update({ frequencyData, timeDomainData });
 * }, [frequencyData]);
 * ```
 */
export function useAudioAnalyzer(
  options: UseAudioAnalyzerOptions = {},
): UseAudioAnalyzerReturn {
  const { demoMode: initialDemoMode = false, updateInterval = 16 } = options;

  // AudioEngine reference
  const engineRef = useRef<AudioEngine | null>(null);

  // State
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(
    new Uint8Array(1024),
  );
  const [timeDomainData, setTimeDomainData] = useState<Uint8Array>(
    new Uint8Array(2048),
  );
  const [floatFrequencyData, setFloatFrequencyData] = useState<Float32Array>(
    new Float32Array(1024),
  );
  const [floatTimeDomainData, setFloatTimeDomainData] = useState<Float32Array>(
    new Float32Array(2048),
  );
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(initialDemoMode);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [peak, setPeak] = useState(0);
  const [rms, setRms] = useState(0);
  const [bands, setBands] = useState<Record<string, number>>({});

  // Animation frame reference
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Initialize AudioEngine
  useEffect(() => {
    try {
      engineRef.current = AudioEngine.getInstance();
      setIsInitialized(true);

      // Start demo mode if requested
      if (initialDemoMode) {
        engineRef.current.startDemoMode();
        setIsDemoMode(true);
        setIsPlaying(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initialDemoMode]);

  // Update loop
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const updateData = (timestamp: number) => {
      // Throttle updates based on interval
      if (timestamp - lastUpdateRef.current < updateInterval) {
        animationFrameRef.current = requestAnimationFrame(updateData);
        return;
      }
      lastUpdateRef.current = timestamp;

      try {
        // Get all audio data
        const data = engine.getAudioData();

        setFrequencyData(data.frequencyData);
        setTimeDomainData(data.timeDomainData);
        setFloatFrequencyData(data.floatFrequencyData);
        setFloatTimeDomainData(data.floatTimeDomainData);
        setAudioData(data);
        setPeak(data.peak);
        setRms(data.rms);
        setBands(data.bands);
      } catch (err) {
        console.error("[useAudioAnalyzer] Error getting audio data:", err);
      }

      animationFrameRef.current = requestAnimationFrame(updateData);
    };

    // Start the loop
    animationFrameRef.current = requestAnimationFrame(updateData);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateInterval]);

  // Audio element ref for file playback
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Initialize with audio element
  const initWithElement = useCallback(
    async (element: HTMLAudioElement): Promise<void> => {
      const engine = engineRef.current;
      if (!engine) {
        throw new Error("AudioEngine not initialized");
      }

      try {
        await engine.init(element);
        setIsInitialized(true);
        setIsDemoMode(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [],
  );

  // Initialize with audio file
  const initWithFile = useCallback(
    async (file: File): Promise<void> => {
      const engine = engineRef.current;
      if (!engine) {
        throw new Error("AudioEngine not initialized");
      }

      try {
        // Stop demo mode
        engine.stopDemoMode();
        setIsDemoMode(false);

        // Create audio element if needed
        if (!audioElementRef.current) {
          audioElementRef.current = new Audio();
          audioElementRef.current.loop = true;
        }

        // Create object URL for file
        const url = URL.createObjectURL(file);
        audioElementRef.current.src = url;

        // Initialize engine with element
        await engine.init(audioElementRef.current);

        // Start playback
        await audioElementRef.current.play();
        setIsInitialized(true);
        setIsPlaying(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [],
  );

  // Play
  const play = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (isDemoMode) {
      // In demo mode, just mark as playing
      setIsPlaying(true);
    } else {
      // Try to resume context first
      engine
        .resumeContext()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("[useAudioAnalyzer] Failed to resume:", err);
          setError(err);
        });
    }
  }, [isDemoMode]);

  // Pause
  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Set demo mode
  const setDemoMode = useCallback((enabled: boolean) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (enabled) {
      engine.startDemoMode();
      setIsDemoMode(true);
      setIsPlaying(true);
    } else {
      engine.stopDemoMode();
      setIsDemoMode(false);
      setIsPlaying(false);
    }
  }, []);

  // Resume audio context
  const resume = useCallback(async (): Promise<void> => {
    const engine = engineRef.current;
    if (!engine) return;

    try {
      await engine.resumeContext();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, []);

  return {
    frequencyData,
    timeDomainData,
    floatFrequencyData,
    floatTimeDomainData,
    audioData,
    isPlaying,
    isDemoMode,
    peak,
    rms,
    bands,
    play,
    pause,
    togglePlay,
    setDemoMode,
    initWithElement,
    initWithFile,
    resume,
    isInitialized,
    error,
  };
}

export default useAudioAnalyzer;
