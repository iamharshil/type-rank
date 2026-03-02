/**
 * Anti-cheat engine for TypeRank.
 * 
 * Analyses keystroke timing data collected client-side in the webview and
 * returns a CheatReport indicating whether the session looks suspicious.
 * 
 * All thresholds are tuned to avoid false-positives on fast human typists
 * while catching bots, auto-typers, and paste abuse.
 */

export interface KeystrokeEvent {
    key: string;
    downTime: number;   // ms timestamp of keydown
    upTime: number;     // ms timestamp of keyup
}

export interface CheatReport {
    isSuspicious: boolean;
    flags: string[];
    confidence: number; // 0-100, how confident we are this is cheating
}

export function analyzeKeystrokes(events: KeystrokeEvent[], totalWpm: number): CheatReport {
    const flags: string[] = [];
    let suspicionScore = 0;

    if (events.length < 5) {
        return { isSuspicious: false, flags: [], confidence: 0 };
    }

    // --- Check 1: Key hold durations (keydown → keyup) ---
    const holdDurations = events
        .map(e => e.upTime - e.downTime)
        .filter(d => d >= 0);

    if (holdDurations.length > 0) {
        const avgHold = holdDurations.reduce((a, b) => a + b, 0) / holdDurations.length;
        const tooShort = holdDurations.filter(d => d < 5).length;
        const ratioTooShort = tooShort / holdDurations.length;

        if (avgHold < 10) {
            flags.push('AVG_HOLD_TOO_SHORT');
            suspicionScore += 30;
        }
        if (ratioTooShort > 0.5) {
            flags.push('MANY_INSTANT_KEYS');
            suspicionScore += 25;
        }
    }

    // --- Check 2: Inter-key intervals (time between consecutive keydowns) ---
    const intervals: number[] = [];
    for (let i = 1; i < events.length; i++) {
        intervals.push(events[i].downTime - events[i - 1].downTime);
    }

    if (intervals.length > 5) {
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);

        // Bots have very uniform intervals (low stdDev relative to mean)
        if (mean > 0 && stdDev / mean < 0.1 && totalWpm > 60) {
            flags.push('UNIFORM_INTERVALS');
            suspicionScore += 35;
        }

        // Check for impossibly fast intervals
        const superFast = intervals.filter(i => i < 15).length;
        if (superFast / intervals.length > 0.3 && totalWpm > 80) {
            flags.push('IMPOSSIBLY_FAST_INTERVALS');
            suspicionScore += 30;
        }
    }

    // --- Check 3: Burst speed check ---
    // Look at any 5-character sliding window
    if (events.length >= 5) {
        for (let i = 0; i <= events.length - 5; i++) {
            const windowMs = events[i + 4].downTime - events[i].downTime;
            if (windowMs > 0) {
                const windowWpm = (5 / 5) / (windowMs / 60000); // 5 chars = 1 word
                if (windowWpm > 350) {
                    flags.push('SUPERHUMAN_BURST');
                    suspicionScore += 20;
                    break; // Only flag once
                }
            }
        }
    }

    // --- Check 4: WPM sanity check ---
    if (totalWpm > 250) {
        flags.push('WPM_EXCEEDS_HUMAN_LIMIT');
        suspicionScore += 40;
    }

    // --- Check 5: Identical consecutive intervals ---
    if (intervals.length > 10) {
        let identicalCount = 0;
        for (let i = 1; i < intervals.length; i++) {
            if (Math.abs(intervals[i] - intervals[i - 1]) < 2) {
                identicalCount++;
            }
        }
        if (identicalCount / intervals.length > 0.6) {
            flags.push('ROBOTIC_RHYTHM');
            suspicionScore += 35;
        }
    }

    const confidence = Math.min(100, suspicionScore);
    const isSuspicious = confidence >= 50;

    return { isSuspicious, flags, confidence };
}

/**
 * Check if a paste event should be blocked.
 * Always returns true — pasting is never allowed during a test.
 */
export function shouldBlockPaste(): boolean {
    return true;
}

/**
 * Check if the test should be invalidated due to focus loss.
 * Returns true if focus was lost for more than the allowed threshold.
 */
export function shouldInvalidateOnBlur(blurDurationMs: number, threshold: number = 3000): boolean {
    return blurDurationMs > threshold;
}
