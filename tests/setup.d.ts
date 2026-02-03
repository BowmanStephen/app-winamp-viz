import 'vitest-canvas-mock';
export declare function mockConsole(): void;
export declare function restoreConsole(): void;
export declare function flushPromises(): Promise<void>;
export declare function createMockAudioData(options?: {
    frequencyData?: number[];
    timeDomainData?: number[];
    sampleRate?: number;
}): any;
export declare function advanceAudioTime(ms: number): Promise<void>;
//# sourceMappingURL=setup.d.ts.map