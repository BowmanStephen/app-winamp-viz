// Test Helper Utilities
// Common functions and utilities for testing
import { vi } from 'vitest';
// ============================================================================
// Timing Utilities
// ============================================================================
/**
 * Wait for all pending promises to resolve
 */
export async function flushPromises() {
    return new Promise(resolve => setTimeout(resolve, 0));
}
/**
 * Wait for a specified duration
 */
export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Advance time by a specified number of milliseconds
 * Useful for testing animations and timeouts
 */
export async function advanceTime(ms) {
    vi.advanceTimersByTime(ms);
    await flushPromises();
}
/**
 * Run all pending timers
 */
export async function runAllTimers() {
    vi.runAllTimers();
    await flushPromises();
}
// ============================================================================
// Audio Data Helpers
// ============================================================================
/**
 * Create mock audio data with specific characteristics
 */
export function createMockAudioData(options = {}) {
    const sampleRate = options.sampleRate ?? 48000;
    const length = options.length ?? 1024;
    let frequencyData;
    if (options.frequencyData) {
        frequencyData = options.frequencyData instanceof Uint8Array
            ? options.frequencyData
            : new Uint8Array(options.frequencyData);
    }
    else {
        frequencyData = new Uint8Array(length);
        // Generate realistic frequency data (more bass)
        for (let i = 0; i < length; i++) {
            const ratio = i / length;
            // Exponential decay for frequency distribution
            const baseValue = Math.exp(-ratio * 2) * 200;
            // Add some variation
            const variation = Math.sin(Date.now() * 0.001 + i) * 30;
            frequencyData[i] = Math.max(0, Math.min(255, baseValue + variation + 20));
        }
    }
    let timeDomainData;
    if (options.timeDomainData) {
        timeDomainData = options.timeDomainData instanceof Uint8Array
            ? options.timeDomainData
            : new Uint8Array(options.timeDomainData);
    }
    else {
        timeDomainData = new Uint8Array(length * 2);
        // Generate synthetic waveform
        const frequency = 440; // A4 note
        for (let i = 0; i < length * 2; i++) {
            const time = i / sampleRate;
            const sample = Math.sin(2 * Math.PI * frequency * time) * 0.5 +
                Math.sin(2 * Math.PI * frequency * 2 * time) * 0.25 +
                (Math.random() - 0.5) * 0.1;
            // Convert to unsigned byte (0-255, centered at 128)
            timeDomainData[i] = 128 + Math.floor(sample * 127);
        }
    }
    return {
        frequencyData,
        timeDomainData,
        sampleRate,
        timestamp: Date.now(),
    };
}
/**
 * Create silent audio data (all zeros)
 */
export function createSilentAudioData(length = 1024, sampleRate = 48000) {
    return {
        frequencyData: new Uint8Array(length).fill(0),
        timeDomainData: new Uint8Array(length * 2).fill(128),
        sampleRate,
        timestamp: Date.now(),
    };
}
/**
 * Create full-scale audio data (max volume)
 */
export function createFullScaleAudioData(length = 1024, sampleRate = 48000) {
    return {
        frequencyData: new Uint8Array(length).fill(255),
        timeDomainData: new Uint8Array(length * 2).fill(255),
        sampleRate,
        timestamp: Date.now(),
    };
}
/**
 * Create audio data with a specific frequency distribution
 */
export function createFrequencyAudioData(distribution, length = 1024, sampleRate = 48000) {
    const frequencyData = new Uint8Array(length);
    switch (distribution) {
        case 'flat':
            // Even distribution
            for (let i = 0; i < length; i++) {
                frequencyData[i] = 128 + Math.floor(Math.random() * 100);
            }
            break;
        case 'bass':
            // More energy in low frequencies
            for (let i = 0; i < length; i++) {
                const ratio = i / length;
                frequencyData[i] = Math.floor(Math.exp(-ratio * 4) * 250);
            }
            break;
        case 'treble':
            // More energy in high frequencies
            for (let i = 0; i < length; i++) {
                const ratio = i / length;
                frequencyData[i] = Math.floor(Math.exp(ratio * 4 - 4) * 250);
            }
            break;
        case 'mid':
            // Peak in middle frequencies
            for (let i = 0; i < length; i++) {
                const ratio = i / length;
                const midPeak = Math.exp(-Math.pow((ratio - 0.5) * 6, 2));
                frequencyData[i] = Math.floor(midPeak * 250);
            }
            break;
    }
    return createMockAudioData({ frequencyData, length, sampleRate });
}
// ============================================================================
// DOM Helpers
// ============================================================================
/**
 * Create a mock canvas element
 */
export function createMockCanvas(width = 800, height = 600) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}
/**
 * Create a mock container element
 */
export function createMockContainer() {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    return container;
}
/**
 * Trigger a mouse event on an element
 */
export function triggerMouseEvent(element, type, options = {}) {
    const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        ...options,
    });
    element.dispatchEvent(event);
}
/**
 * Trigger a keyboard event
 */
export function triggerKeyboardEvent(element, type, options = {}) {
    const event = new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        ...options,
    });
    element.dispatchEvent(event);
}
/**
 * Wait for an element to be rendered
 */
export async function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
        // Timeout fallback
        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
    });
}
// ============================================================================
// Assertion Helpers
// ============================================================================
/**
 * Check if two numbers are approximately equal
 */
export function expectCloseTo(actual, expected, tolerance = 0.001) {
    const diff = Math.abs(actual - expected);
    if (diff > tolerance) {
        throw new Error(`Expected ${actual} to be close to ${expected} (tolerance: ${tolerance}, diff: ${diff})`);
    }
}
/**
 * Check if a value is within a range
 */
export function expectInRange(actual, min, max) {
    if (actual < min || actual > max) {
        throw new Error(`Expected ${actual} to be in range [${min}, ${max}]`);
    }
}
/**
 * Check if an array is sorted
 */
export function expectSorted(array, direction = 'asc') {
    for (let i = 1; i < array.length; i++) {
        if (direction === 'asc' && array[i] < array[i - 1]) {
            throw new Error(`Array not sorted ascending at index ${i}`);
        }
        if (direction === 'desc' && array[i] > array[i - 1]) {
            throw new Error(`Array not sorted descending at index ${i}`);
        }
    }
}
/**
 * Check if an array contains only unique values
 */
export function expectUnique(array) {
    const seen = new Set();
    for (const item of array) {
        const key = JSON.stringify(item);
        if (seen.has(key)) {
            throw new Error(`Duplicate value found: ${key}`);
        }
        seen.add(key);
    }
}
// ============================================================================
// Performance Helpers
// ============================================================================
/**
 * Measure function execution time
 */
export async function measureExecutionTime(fn) {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
}
/**
 * Assert that a function executes within a time limit
 */
export async function expectExecutionTimeUnder(fn, maxDuration) {
    const { result, duration } = await measureExecutionTime(fn);
    if (duration > maxDuration) {
        throw new Error(`Function took ${duration.toFixed(2)}ms, expected under ${maxDuration}ms`);
    }
    return result;
}
// ============================================================================
// Mock Utilities
// ============================================================================
/**
 * Create a mock function that tracks calls
 */
export function createMockFn() {
    return vi.fn();
}
/**
 * Create a delayed mock response
 */
export function createDelayedResponse(value, delay = 100) {
    return new Promise(resolve => {
        setTimeout(() => resolve(value), delay);
    });
}
/**
 * Create a mock that fails after a delay
 */
export function createDelayedError(message, delay = 100) {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), delay);
    });
}
// ============================================================================
// Data Generation
// ============================================================================
/**
 * Generate a random hex color
 */
export function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}
/**
 * Generate random float in range
 */
export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}
/**
 * Generate random integer in range
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Generate random array of numbers
 */
export function randomArray(length, min = 0, max = 1) {
    return Array.from({ length }, () => randomFloat(min, max));
}
/**
 * Generate UUID v4
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
//# sourceMappingURL=test-helpers.js.map