import * as vscode from 'vscode';
import { StorageService } from './storageService';
import { StatusBarManager } from './statusBar';

/**
 * CodingTracker — Passive keystroke monitor
 * 
 * Listens to editor and terminal typing to calculate a rolling coding WPM.
 * Every 60 seconds of active typing, saves a sample and awards XP.
 * Filters out paste events and autocomplete bursts.
 */
export class CodingTracker implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    private storage: StorageService;
    private statusBar: StatusBarManager;

    // Rolling keystroke buffer: timestamps of individual keystrokes within the last 30s
    private keystrokeTimestamps: number[] = [];
    private backspaceCount: number = 0;
    private forwardCount: number = 0;

    // Session tracking
    private sessionStartTime: number = 0;
    private sessionKeystrokes: number = 0;
    private isActive: boolean = false;

    // Timers
    private sampleInterval: ReturnType<typeof setInterval> | undefined;
    private statusUpdateInterval: ReturnType<typeof setInterval> | undefined;
    private inactivityTimeout: ReturnType<typeof setTimeout> | undefined;

    // Constants
    private static readonly ROLLING_WINDOW_MS = 30_000;       // 30s rolling window for live WPM
    private static readonly SAMPLE_INTERVAL_MS = 60_000;       // Save a sample every 60s of active typing
    private static readonly INACTIVITY_TIMEOUT_MS = 10_000;    // 10s of no typing = inactive
    private static readonly STATUS_UPDATE_MS = 5_000;          // Update status bar every 5s
    private static readonly MAX_CHARS_PER_CHANGE = 10;         // Changes above this are paste/autocomplete
    private static readonly CHARS_PER_WORD = 5;                // Standard WPM convention

    constructor(storage: StorageService, statusBar: StatusBarManager) {
        this.storage = storage;
        this.statusBar = statusBar;

        this.registerListeners();
        this.startStatusUpdater();
    }

    private registerListeners(): void {
        // Listen to text document changes (editor typing, notebooks, etc.)
        const docChangeDisposable = vscode.workspace.onDidChangeTextDocument(event => {
            // Ignore output channels, git, etc. — only track file and untitled schemes
            if (event.document.uri.scheme !== 'file' && event.document.uri.scheme !== 'untitled') {
                return;
            }
            this.processDocumentChanges(event.contentChanges);
        });
        this.disposables.push(docChangeDisposable);

        // Note: Terminal typing is tracked indirectly.
        // `onDidWriteTerminalData` is a proposed API and unavailable in stable VS Code.
        // Typing in the integrated terminal where a pty writes to a pseudoterminal
        // is not captured here, but all file-based coding is.
    }

    private processDocumentChanges(changes: readonly vscode.TextDocumentContentChangeEvent[]): void {
        for (const change of changes) {
            const insertedLength = change.text.length;
            const deletedLength = change.rangeLength;

            // Skip paste events / autocomplete bursts
            if (insertedLength > CodingTracker.MAX_CHARS_PER_CHANGE) {
                continue;
            }

            if (deletedLength > 0 && insertedLength === 0) {
                // Pure deletion (backspace/delete)
                this.recordKeystrokes(1, true);
            } else if (insertedLength > 0) {
                // Typed character(s)
                this.recordKeystrokes(insertedLength, false);
            }
        }
    }

    private recordKeystrokes(count: number, isBackspace: boolean): void {
        const now = Date.now();

        for (let i = 0; i < count; i++) {
            this.keystrokeTimestamps.push(now);
        }

        if (isBackspace) {
            this.backspaceCount += count;
        } else {
            this.forwardCount += count;
        }

        // Start or continue session
        if (!this.isActive) {
            this.startSession();
        }
        this.sessionKeystrokes += count;

        // Reset inactivity timer
        this.resetInactivityTimer();

        // Prune old keystrokes from the rolling window
        this.pruneOldKeystrokes(now);
    }

    private startSession(): void {
        this.isActive = true;
        this.sessionStartTime = Date.now();
        this.sessionKeystrokes = 0;
        this.backspaceCount = 0;
        this.forwardCount = 0;

        // Start the sample interval
        if (!this.sampleInterval) {
            this.sampleInterval = setInterval(() => {
                this.saveSample();
            }, CodingTracker.SAMPLE_INTERVAL_MS);
        }
    }

    private endSession(): void {
        this.isActive = false;

        // Save a final sample if we have enough data
        if (this.sessionKeystrokes > 20) {
            this.saveSample();
        }

        if (this.sampleInterval) {
            clearInterval(this.sampleInterval);
            this.sampleInterval = undefined;
        }
    }

    private resetInactivityTimer(): void {
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
        }
        this.inactivityTimeout = setTimeout(() => {
            this.endSession();
        }, CodingTracker.INACTIVITY_TIMEOUT_MS);
    }

    private pruneOldKeystrokes(now: number): void {
        const cutoff = now - CodingTracker.ROLLING_WINDOW_MS;
        while (this.keystrokeTimestamps.length > 0 && this.keystrokeTimestamps[0] < cutoff) {
            this.keystrokeTimestamps.shift();
        }
    }

    /**
     * Calculate live coding WPM from the rolling keystroke window.
     */
    getLiveWpm(): number {
        const now = Date.now();
        this.pruneOldKeystrokes(now);

        if (this.keystrokeTimestamps.length < 2) {
            return 0;
        }

        const oldest = this.keystrokeTimestamps[0];
        const spanMs = now - oldest;
        if (spanMs < 1000) { return 0; } // Not enough time elapsed

        const spanMinutes = spanMs / 60_000;
        const words = this.keystrokeTimestamps.length / CodingTracker.CHARS_PER_WORD;
        return Math.round(words / spanMinutes);
    }

    /**
     * Estimate accuracy from backspace ratio in the current session.
     */
    private getSessionAccuracy(): number {
        const total = this.forwardCount + this.backspaceCount;
        if (total === 0) { return 100; }
        return Math.round((this.forwardCount / total) * 100);
    }

    /**
     * Save a coding sample: WPM + accuracy → XP.
     */
    private async saveSample(): Promise<void> {
        if (!this.isActive || this.sessionKeystrokes < 20) {
            return;
        }

        const wpm = this.getLiveWpm();
        if (wpm < 5) { return; } // Too slow to count

        const accuracy = this.getSessionAccuracy();

        // Award passive XP: wpm * 0.3 + accuracy * 0.2
        const xp = Math.floor(wpm * 0.3 + accuracy * 0.2);

        await this.storage.addCodingSample(wpm, accuracy);
        if (xp > 0) {
            await this.storage.addXp(xp);
        }

        // Update status bar
        this.statusBar.updateCodingWpm(this.storage.getCodingAvgWpm());

        // Reset session counters for next interval
        this.backspaceCount = 0;
        this.forwardCount = 0;
        this.sessionKeystrokes = 0;
    }

    private startStatusUpdater(): void {
        // Periodically update the status bar with live WPM
        this.statusUpdateInterval = setInterval(() => {
            const liveWpm = this.getLiveWpm();
            if (this.isActive && liveWpm > 0) {
                this.statusBar.updateCodingWpm(liveWpm);
            } else {
                // Show stored average when not actively typing
                this.statusBar.updateCodingWpm(this.storage.getCodingAvgWpm());
            }
        }, CodingTracker.STATUS_UPDATE_MS);
    }

    dispose(): void {
        if (this.sampleInterval) { clearInterval(this.sampleInterval); }
        if (this.statusUpdateInterval) { clearInterval(this.statusUpdateInterval); }
        if (this.inactivityTimeout) { clearTimeout(this.inactivityTimeout); }
        this.disposables.forEach(d => d.dispose());
    }
}
