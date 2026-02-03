/**
 * Zustand Audio Store
 *
 * Central state management for audio playback and Web Audio API.
 * Manages playback state, audio element, Web Audio context, and analyzer.
 *
 * @module useAudioStore
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AudioData } from "../types";

/**
 * Audio store state interface
 */
interface AudioState {
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;

  // Audio element and Web Audio API
  audioElement: HTMLAudioElement | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  sourceNode: MediaElementAudioSourceNode | null;

  // Error state
  error: Error | null;
  isLoading: boolean;

  // Audio data cache (last frame)
  audioData: AudioData | null;

  // Actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setAudioElement: (element: HTMLAudioElement | null) => void;
  setAudioContext: (context: AudioContext | null) => void;
  setAnalyser: (analyser: AnalyserNode | null) => void;
  setSourceNode: (node: MediaElementAudioSourceNode | null) => void;
  setError: (error: Error | null) => void;
  setLoading: (loading: boolean) => void;
  setDuration: (duration: number) => void;
  updateCurrentTime: (time: number) => void;
  setAudioData: (data: AudioData | null) => void;
  reset: () => void;
}

/**
 * Initial state values (excluding actions)
 */
const initialState: Omit<
  AudioState,
  keyof Pick<
    AudioState,
    | "play"
    | "pause"
    | "stop"
    | "seek"
    | "setVolume"
    | "toggleMute"
    | "setAudioElement"
    | "setAudioContext"
    | "setAnalyser"
    | "setSourceNode"
    | "setError"
    | "setLoading"
    | "setDuration"
    | "updateCurrentTime"
    | "setAudioData"
    | "reset"
  >
> = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  muted: false,
  audioElement: null,
  audioContext: null,
  analyser: null,
  sourceNode: null,
  error: null,
  isLoading: false,
  audioData: null,
};

/**
 * Zustand audio store with persistence for volume settings
 *
 * @example
 * ```tsx
 * const { isPlaying, play, pause, volume, setVolume } = useAudioStore();
 *
 * return (
 *   <button onClick={isPlaying ? pause : play}>
 *     {isPlaying ? 'Pause' : 'Play'}
 *   </button>
 * );
 * ```
 */
export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Start or resume audio playback
       */
      play: () => {
        const { audioElement, audioContext, isPlaying } = get();

        if (!audioElement) {
          console.warn("[AudioStore] No audio element available");
          return;
        }

        if (isPlaying) return;

        // Resume AudioContext if suspended (browser autoplay policy)
        if (audioContext && audioContext.state === "suspended") {
          audioContext.resume().catch((err) => {
            console.error("[AudioStore] Failed to resume audio context:", err);
          });
        }

        audioElement
          .play()
          .then(() => {
            set({ isPlaying: true, error: null });
          })
          .catch((err) => {
            console.error("[AudioStore] Failed to play:", err);
            set({ error: err instanceof Error ? err : new Error(String(err)) });
          });
      },

      /**
       * Pause audio playback
       */
      pause: () => {
        const { audioElement, isPlaying } = get();

        if (!audioElement || !isPlaying) return;

        audioElement.pause();
        set({ isPlaying: false });
      },

      /**
       * Stop playback and reset to beginning
       */
      stop: () => {
        const { audioElement } = get();

        if (!audioElement) return;

        audioElement.pause();
        audioElement.currentTime = 0;
        set({ isPlaying: false, currentTime: 0 });
      },

      /**
       * Seek to a specific time in seconds
       * @param time - Time in seconds
       */
      seek: (time: number) => {
        const { audioElement, duration } = get();

        if (!audioElement) return;

        const clampedTime = Math.max(0, Math.min(time, duration || Infinity));
        audioElement.currentTime = clampedTime;
        set({ currentTime: clampedTime });
      },

      /**
       * Set volume level (0-1)
       * @param volume - Volume level between 0 and 1
       */
      setVolume: (volume: number) => {
        const { audioElement } = get();

        const clampedVolume = Math.max(0, Math.min(1, volume));

        if (audioElement) {
          audioElement.volume = clampedVolume;
        }

        set({ volume: clampedVolume });
      },

      /**
       * Toggle mute state
       */
      toggleMute: () => {
        const { audioElement, muted } = get();

        if (audioElement) {
          audioElement.muted = !muted;
        }

        set({ muted: !muted });
      },

      /**
       * Set the audio element
       * @param element - HTMLAudioElement or null
       */
      setAudioElement: (element: HTMLAudioElement | null) => {
        const { audioElement } = get();

        // Clean up old element
        if (audioElement && audioElement !== element) {
          audioElement.pause();
        }

        set({ audioElement: element });
      },

      /**
       * Set the Web Audio context
       * @param context - AudioContext or null
       */
      setAudioContext: (context: AudioContext | null) => {
        set({ audioContext: context });
      },

      /**
       * Set the analyzer node
       * @param analyser - AnalyserNode or null
       */
      setAnalyser: (analyser: AnalyserNode | null) => {
        set({ analyser });
      },

      /**
       * Set the media element source node
       * @param node - MediaElementAudioSourceNode or null
       */
      setSourceNode: (node: MediaElementAudioSourceNode | null) => {
        set({ sourceNode: node });
      },

      /**
       * Set error state
       * @param error - Error object or null
       */
      setError: (error: Error | null) => {
        set({ error, isPlaying: false });
      },

      /**
       * Set loading state
       * @param loading - Whether audio is loading
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      /**
       * Set audio duration
       * @param duration - Duration in seconds
       */
      setDuration: (duration: number) => {
        set({ duration: isFinite(duration) ? duration : 0 });
      },

      /**
       * Update current playback time
       * @param time - Current time in seconds
       */
      updateCurrentTime: (time: number) => {
        set({ currentTime: isFinite(time) ? time : 0 });
      },

      /**
       * Set latest audio analysis data
       * @param data - AudioData from analyzer
       */
      setAudioData: (data: AudioData | null) => {
        set({ audioData: data });
      },

      /**
       * Reset store to initial state
       */
      reset: () => {
        const { audioElement, audioContext } = get();

        // Clean up resources
        if (audioElement) {
          audioElement.pause();
          audioElement.src = "";
        }

        if (audioContext && audioContext.state !== "closed") {
          audioContext.close().catch(console.error);
        }

        set({
          ...initialState,
          volume: get().volume, // Keep persisted volume
          muted: get().muted, // Keep muted state
        });
      },
    }),
    {
      name: "winamp-viz-audio-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        volume: state.volume,
        muted: state.muted,
      }),
    },
  ),
);

/**
 * Selector hook for common audio state combinations
 */
export const useAudioPlayback = () =>
  useAudioStore((state) => ({
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
    play: state.play,
    pause: state.pause,
    stop: state.stop,
    seek: state.seek,
  }));

/**
 * Selector hook for audio volume/mute controls
 */
export const useAudioVolume = () =>
  useAudioStore((state) => ({
    volume: state.volume,
    muted: state.muted,
    setVolume: state.setVolume,
    toggleMute: state.toggleMute,
  }));

/**
 * Selector hook for Web Audio API nodes
 */
export const useAudioNodes = () =>
  useAudioStore((state) => ({
    audioElement: state.audioElement,
    audioContext: state.audioContext,
    analyser: state.analyser,
    sourceNode: state.sourceNode,
  }));

/**
 * Selector hook for audio error state
 */
export const useAudioError = () =>
  useAudioStore((state) => ({
    error: state.error,
    isLoading: state.isLoading,
    setError: state.setError,
    setLoading: state.setLoading,
  }));

export default useAudioStore;
