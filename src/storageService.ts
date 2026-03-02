import * as vscode from 'vscode';

export interface TestResult {
    wpm: number;
    rawWpm: number;
    accuracy: number;
    consistency: number;
    correctChars: number;
    incorrectChars: number;
    totalChars: number;
    duration: number;
    mode: string;
    timestamp: number;
    cheatFlags: string[];
    isSuspicious: boolean;
    wpmOverTime: number[];
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'master' | 'legendary' | 'achievement';
    earnedAt?: number;
}

export interface UserProfile {
    displayName: string;
    totalTests: number;
    bestWpm: number;
    averageWpm: number;
    currentRank: string;
    currentRankBadge: string;
    streak: number;
    lastTestDate: string;
    consecutiveDays: number;
}

export class StorageService {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    // --- Test History ---

    getTestHistory(): TestResult[] {
        return this.context.globalState.get<TestResult[]>('typerank.testHistory', []);
    }

    async addTestResult(result: TestResult): Promise<void> {
        const history = this.getTestHistory();
        history.unshift(result);
        // Keep only the last 100 results
        if (history.length > 100) {
            history.length = 100;
        }
        await this.context.globalState.update('typerank.testHistory', history);
    }

    // --- Badges ---

    getEarnedBadges(): Badge[] {
        return this.context.globalState.get<Badge[]>('typerank.earnedBadges', []);
    }

    async addBadge(badge: Badge): Promise<void> {
        const badges = this.getEarnedBadges();
        if (!badges.find(b => b.id === badge.id)) {
            badge.earnedAt = Date.now();
            badges.push(badge);
            await this.context.globalState.update('typerank.earnedBadges', badges);
        }
    }

    hasBadge(badgeId: string): boolean {
        return this.getEarnedBadges().some(b => b.id === badgeId);
    }

    // --- Profile ---

    getProfile(): UserProfile {
        const history = this.getTestHistory();
        const cleanHistory = history.filter(r => !r.isSuspicious);
        const last10 = cleanHistory.slice(0, 10);
        const avgWpm = last10.length > 0
            ? Math.round(last10.reduce((sum, r) => sum + r.wpm, 0) / last10.length)
            : 0;
        const bestWpm = cleanHistory.length > 0
            ? Math.max(...cleanHistory.map(r => r.wpm))
            : 0;

        const { rank, badge } = this.getRankForWpm(avgWpm);

        // Calculate consecutive days
        const consecutiveDays = this.calculateConsecutiveDays(history);

        return {
            displayName: this.context.globalState.get<string>('typerank.displayName', 'Typer'),
            totalTests: history.length,
            bestWpm,
            averageWpm: avgWpm,
            currentRank: rank,
            currentRankBadge: badge,
            streak: this.getSessionStreak(),
            lastTestDate: history.length > 0 ? new Date(history[0].timestamp).toLocaleDateString() : 'Never',
            consecutiveDays
        };
    }

    getSessionStreak(): number {
        return this.context.globalState.get<number>('typerank.sessionStreak', 0);
    }

    async incrementSessionStreak(): Promise<void> {
        const streak = this.getSessionStreak() + 1;
        await this.context.globalState.update('typerank.sessionStreak', streak);
    }

    async resetSessionStreak(): Promise<void> {
        await this.context.globalState.update('typerank.sessionStreak', 0);
    }

    getRankForWpm(wpm: number): { rank: string; badge: string } {
        if (wpm >= 131) { return { rank: 'Legendary', badge: '⚡' }; }
        if (wpm >= 101) { return { rank: 'Master', badge: '👑' }; }
        if (wpm >= 76) { return { rank: 'Diamond', badge: '💎' }; }
        if (wpm >= 51) { return { rank: 'Gold', badge: '🥇' }; }
        if (wpm >= 31) { return { rank: 'Silver', badge: '🥈' }; }
        return { rank: 'Bronze', badge: '🥉' };
    }

    private calculateConsecutiveDays(history: TestResult[]): number {
        if (history.length === 0) { return 0; }

        const days = new Set<string>();
        for (const result of history) {
            days.add(new Date(result.timestamp).toISOString().split('T')[0]);
        }

        const sortedDays = Array.from(days).sort().reverse();
        let consecutive = 1;
        for (let i = 1; i < sortedDays.length; i++) {
            const prev = new Date(sortedDays[i - 1]);
            const curr = new Date(sortedDays[i]);
            const diffMs = prev.getTime() - curr.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            if (diffDays <= 1.5) {
                consecutive++;
            } else {
                break;
            }
        }
        return consecutive;
    }

    // --- Cleanup ---

    async clearAll(): Promise<void> {
        await this.context.globalState.update('typerank.testHistory', undefined);
        await this.context.globalState.update('typerank.earnedBadges', undefined);
        await this.context.globalState.update('typerank.sessionStreak', undefined);
        await this.context.globalState.update('typerank.displayName', undefined);
    }
}
