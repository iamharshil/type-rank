import { TestResult } from '../storageService';

export interface RawTestData {
    correctChars: number;
    incorrectChars: number;
    totalChars: number;
    elapsedMs: number;
    mode: string;
    wpmSnapshots: number[];  // WPM measured each second
    cheatFlags: string[];
    isSuspicious: boolean;
}

export function calculateTestResult(data: RawTestData): TestResult {
    const elapsedMinutes = data.elapsedMs / 60000;

    // Standard WPM: (correct chars / 5) / minutes
    const wpm = elapsedMinutes > 0
        ? Math.round((data.correctChars / 5) / elapsedMinutes)
        : 0;

    // Raw WPM: (all typed chars / 5) / minutes
    const rawWpm = elapsedMinutes > 0
        ? Math.round((data.totalChars / 5) / elapsedMinutes)
        : 0;

    // Accuracy
    const accuracy = data.totalChars > 0
        ? Math.round((data.correctChars / data.totalChars) * 10000) / 100
        : 0;

    // Consistency — coefficient of variation of per-second WPM
    const consistency = calculateConsistency(data.wpmSnapshots);

    return {
        wpm,
        rawWpm,
        accuracy,
        consistency,
        correctChars: data.correctChars,
        incorrectChars: data.incorrectChars,
        totalChars: data.totalChars,
        duration: data.elapsedMs,
        mode: data.mode,
        timestamp: Date.now(),
        cheatFlags: data.cheatFlags,
        isSuspicious: data.isSuspicious,
        wpmOverTime: data.wpmSnapshots
    };
}

function calculateConsistency(wpmSnapshots: number[]): number {
    if (wpmSnapshots.length < 2) { return 100; }

    const mean = wpmSnapshots.reduce((a, b) => a + b, 0) / wpmSnapshots.length;
    if (mean === 0) { return 0; }

    const variance = wpmSnapshots.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / wpmSnapshots.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100;

    // Invert: lower CV = higher consistency (return as percentage, 100 = perfect)
    return Math.round(Math.max(0, 100 - cv));
}
