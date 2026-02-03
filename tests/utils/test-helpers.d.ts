import { vi } from 'vitest';
import { MockAudioData } from '../mocks/webaudio';
/**
 * Wait for all pending promises to resolve
 */
export declare function flushPromises(): Promise<void>;
/**
 * Wait for a specified duration
 */
export declare function wait(ms: number): Promise<void>;
/**
 * Advance time by a specified number of milliseconds
 * Useful for testing animations and timeouts
 */
export declare function advanceTime(ms: number): Promise<void>;
/**
 * Run all pending timers
 */
export declare function runAllTimers(): Promise<void>;
/**
 * Create mock audio data with specific characteristics
 */
export declare function createMockAudioData(options?: {
    frequencyData?: number[] | Uint8Array;
    timeDomainData?: number[] | Uint8Array;
    sampleRate?: number;
    length?: number;
}): MockAudioData;
/**
 * Create silent audio data (all zeros)
 */
export declare function createSilentAudioData(length?: number, sampleRate?: number): MockAudioData;
/**
 * Create full-scale audio data (max volume)
 */
export declare function createFullScaleAudioData(length?: number, sampleRate?: number): MockAudioData;
/**
 * Create audio data with a specific frequency distribution
 */
export declare function createFrequencyAudioData(distribution: 'flat' | 'bass' | 'treble' | 'mid', length?: number, sampleRate?: number): MockAudioData;
/**
 * Create a mock canvas element
 */
export declare function createMockCanvas(width?: number, height?: number): HTMLCanvasElement;
/**
 * Create a mock container element
 */
export declare function createMockContainer(): HTMLDivElement;
/**
 * Trigger a mouse event on an element
 */
export declare function triggerMouseEvent(element: Element, type: string, options?: MouseEventInit): void;
/**
 * Trigger a keyboard event
 */
export declare function triggerKeyboardEvent(element: Element | Window, type: string, options?: KeyboardEventInit): void;
/**
 * Wait for an element to be rendered
 */
export declare function waitForElement(selector: string, timeout?: number): Promise<Element | null>;
/**
 * Check if two numbers are approximately equal
 */
export declare function expectCloseTo(actual: number, expected: number, tolerance?: number): void;
/**
 * Check if a value is within a range
 */
export declare function expectInRange(actual: number, min: number, max: number): void;
/**
 * Check if an array is sorted
 */
export declare function expectSorted(array: number[], direction?: 'asc' | 'desc'): void;
/**
 * Check if an array contains only unique values
 */
export declare function expectUnique(array: unknown[]): void;
/**
 * Measure function execution time
 */
export declare function measureExecutionTime<T>(fn: () => T | Promise<T>): Promise<{
    result: T;
    duration: number;
}>;
/**
 * Assert that a function executes within a time limit
 */
export declare function expectExecutionTimeUnder<T>(fn: () => T | Promise<T>, maxDuration: number): Promise<T>;
/**
 * Create a mock function that tracks calls
 */
export declare function createMockFn<T extends (...args: any[]) => any>(): MockedFunction<T>;
type MockedFunction<T extends (...args: any[]) => any> = ReturnType<typeof vi.fn<T>>;
/**
 * Create a delayed mock response
 */
export declare function createDelayedResponse<T>(value: T, delay?: number): Promise<T>;
/**
 * Create a mock that fails after a delay
 */
export declare function createDelayedError(message: string, delay?: number): Promise<never>;
/**
 * Generate a random hex color
 */
export declare function randomColor(): string;
/**
 * Generate random float in range
 */
export declare function randomFloat(min: number, max: number): number;
/**
 * Generate random integer in range
 */
export declare function randomInt(min: number, max: number): number;
/**
 * Generate random array of numbers
 */
export declare function randomArray(length: number, min?: number, max?: number): number[];
/**
 * Generate UUID v4
 */
export declare function generateUUID(): string;
export {};
//# sourceMappingURL=test-helpers.d.ts.map