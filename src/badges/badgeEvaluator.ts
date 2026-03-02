import { StorageService, TestResult, Badge } from '../storageService';
import { RANK_BADGES, ACHIEVEMENT_BADGES } from './badgeDefinitions';

export class BadgeEvaluator {
    private storage: StorageService;

    constructor(storage: StorageService) {
        this.storage = storage;
    }

    /**
     * Evaluate all badge conditions after a test and return newly earned badges.
     */
    async evaluate(latestResult: TestResult): Promise<Badge[]> {
        const newBadges: Badge[] = [];
        const history = this.storage.getTestHistory();
        const cleanHistory = history.filter(r => !r.isSuspicious);
        const profile = this.storage.getProfile();

        // --- Rank badges ---
        const rankBadge = this.getRankBadge(profile.averageWpm);
        if (rankBadge && !this.storage.hasBadge(rankBadge.id)) {
            await this.storage.addBadge({ ...rankBadge });
            newBadges.push(rankBadge);
        }

        // --- Achievement: First Strike ---
        if (!this.storage.hasBadge('first-strike')) {
            const badge = ACHIEVEMENT_BADGES.find(b => b.id === 'first-strike')!;
            await this.storage.addBadge({ ...badge });
            newBadges.push(badge);
        }

        // --- Achievement: On Fire (5 tests in one session) ---
        if (!this.storage.hasBadge('on-fire') && this.storage.getSessionStreak() >= 5) {
            const badge = ACHIEVEMENT_BADGES.find(b => b.id === 'on-fire')!;
            await this.storage.addBadge({ ...badge });
            newBadges.push(badge);
        }

        // --- Achievement: Sharpshooter (100% accuracy, 30s+ test) ---
        if (!this.storage.hasBadge('sharpshooter') &&
            latestResult.accuracy === 100 &&
            latestResult.duration >= 30000 &&
            !latestResult.isSuspicious) {
            const badge = ACHIEVEMENT_BADGES.find(b => b.id === 'sharpshooter')!;
            await this.storage.addBadge({ ...badge });
            newBadges.push(badge);
        }

        // --- Achievement: Speed Demon (100+ WPM) ---
        if (!this.storage.hasBadge('speed-demon') &&
            latestResult.wpm >= 100 &&
            !latestResult.isSuspicious) {
            const badge = ACHIEVEMENT_BADGES.find(b => b.id === 'speed-demon')!;
            await this.storage.addBadge({ ...badge });
            newBadges.push(badge);
        }

        // --- Achievement: Summit (150+ WPM) ---
        if (!this.storage.hasBadge('summit') &&
            latestResult.wpm >= 150 &&
            !latestResult.isSuspicious) {
            const badge = ACHIEVEMENT_BADGES.find(b => b.id === 'summit')!;
            await this.storage.addBadge({ ...badge });
            newBadges.push(badge);
        }

        // --- Achievement: Consistent (avg consistency > 90 over 10 tests) ---
        if (!this.storage.hasBadge('consistent') && cleanHistory.length >= 10) {
            const last10 = cleanHistory.slice(0, 10);
            const avgConsistency = last10.reduce((sum, r) => sum + r.consistency, 0) / 10;
            if (avgConsistency >= 90) {
                const badge = ACHIEVEMENT_BADGES.find(b => b.id === 'consistent')!;
                await this.storage.addBadge({ ...badge });
                newBadges.push(badge);
            }
        }

        // --- Achievement: Anti-Cheat Verified (50 clean tests) ---
        if (!this.storage.hasBadge('anti-cheat-verified') && cleanHistory.length >= 50) {
            const badge = ACHIEVEMENT_BADGES.find(b => b.id === 'anti-cheat-verified')!;
            await this.storage.addBadge({ ...badge });
            newBadges.push(badge);
        }

        // --- Achievement: Daily Grinder (7 consecutive days) ---
        if (!this.storage.hasBadge('daily-grinder') && profile.consecutiveDays >= 7) {
            const badge = ACHIEVEMENT_BADGES.find(b => b.id === 'daily-grinder')!;
            await this.storage.addBadge({ ...badge });
            newBadges.push(badge);
        }

        return newBadges;
    }

    private getRankBadge(averageWpm: number): Badge | undefined {
        if (averageWpm >= 131) { return RANK_BADGES.find(b => b.id === 'rank-legendary'); }
        if (averageWpm >= 101) { return RANK_BADGES.find(b => b.id === 'rank-master'); }
        if (averageWpm >= 76) { return RANK_BADGES.find(b => b.id === 'rank-diamond'); }
        if (averageWpm >= 51) { return RANK_BADGES.find(b => b.id === 'rank-gold'); }
        if (averageWpm >= 31) { return RANK_BADGES.find(b => b.id === 'rank-silver'); }
        return RANK_BADGES.find(b => b.id === 'rank-bronze');
    }
}
