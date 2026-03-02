/**
 * TypeRank Leveling System
 *
 * - 500 max level (well above the 400 minimum)
 * - XP earned from each test based on WPM, accuracy, consistency, and duration
 * - Daily streak multiplier for bonus XP
 * - Level milestones every 10/25/50/100 levels with special rewards
 */

// --- XP Curve ---
// Each level requires progressively more XP.
// Formula: XP_required(level) = 50 * level + 10 * level^1.3
// This creates a smooth, rewarding curve where early levels are fast
// and later levels require dedication.

export const MAX_LEVEL = 500;

export function getXpRequiredForLevel(level: number): number {
    if (level <= 0) { return 0; }
    if (level > MAX_LEVEL) { return Infinity; }
    return Math.floor(50 * level + 10 * Math.pow(level, 1.3));
}

export function getTotalXpForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i <= level; i++) {
        total += getXpRequiredForLevel(i);
    }
    return total;
}

export function getLevelFromTotalXp(totalXp: number): { level: number; currentXp: number; xpForNext: number; progress: number } {
    let remaining = totalXp;
    let level = 0;

    while (level < MAX_LEVEL) {
        const required = getXpRequiredForLevel(level + 1);
        if (remaining < required) {
            return {
                level,
                currentXp: remaining,
                xpForNext: required,
                progress: required > 0 ? remaining / required : 1
            };
        }
        remaining -= required;
        level++;
    }

    return { level: MAX_LEVEL, currentXp: 0, xpForNext: 0, progress: 1 };
}

// --- XP Calculation ---
// XP earned from a single test, based on performance metrics.

export interface XpBreakdown {
    baseXp: number;
    wpmBonus: number;
    accuracyBonus: number;
    consistencyBonus: number;
    durationBonus: number;
    streakMultiplier: number;
    totalXp: number;
}

export function calculateXpFromTest(
    wpm: number,
    accuracy: number,
    consistency: number,
    durationMs: number,
    dailyStreak: number,
    isSuspicious: boolean
): XpBreakdown {
    // Suspicious tests earn zero XP
    if (isSuspicious) {
        return { baseXp: 0, wpmBonus: 0, accuracyBonus: 0, consistencyBonus: 0, durationBonus: 0, streakMultiplier: 1, totalXp: 0 };
    }

    // XP is based strictly on speed + accuracy.
    const baseXp = 0;
    const wpmBonus = Math.floor(wpm);
    const accuracyBonus = Math.floor(accuracy);

    // No distinct bonus for consistency or duration to keep it purely speed+accuracy
    const consistencyBonus = 0;
    const durationBonus = 0;

    // Streak multiplier: consecutive days boost XP
    // Day 1: 1x, Day 2: 1.1x, Day 3: 1.2x, ..., Day 7+: 1.6x, Day 14+: 2x, Day 30+: 2.5x
    let streakMultiplier = 1.0;
    if (dailyStreak >= 30) { streakMultiplier = 2.5; }
    else if (dailyStreak >= 14) { streakMultiplier = 2.0; }
    else if (dailyStreak >= 7) { streakMultiplier = 1.6; }
    else if (dailyStreak >= 2) { streakMultiplier = 1.0 + (dailyStreak - 1) * 0.1; }

    const rawXp = wpmBonus + accuracyBonus;
    const totalXp = Math.floor(rawXp * streakMultiplier);

    return {
        baseXp,
        wpmBonus,
        accuracyBonus,
        consistencyBonus,
        durationBonus,
        streakMultiplier,
        totalXp
    };
}

// --- Level Milestones ---
// Special rewards and titles at specific levels

export interface Milestone {
    level: number;
    title: string;
    icon: string;
    description: string;
    reward: string;
}

export const MILESTONES: Milestone[] = [
    { level: 1, title: 'Newbie', icon: '🌱', description: 'Welcome to TypeRank!', reward: 'Unlocked: TypeRank' },
    { level: 5, title: 'Getting Started', icon: '📝', description: 'Your journey has begun', reward: '+5% base XP' },
    { level: 10, title: 'Warm Fingers', icon: '🔥', description: 'Heating up!', reward: 'Unlocked: Code mode' },
    { level: 25, title: 'Keyboard Warrior', icon: '⚔️', description: 'Battle-tested typist', reward: '+10% base XP' },
    { level: 50, title: 'Half Century', icon: '🎯', description: '50 levels of dedication', reward: 'Unlocked: Quotes mode' },
    { level: 75, title: 'Committed', icon: '💪', description: 'No turning back now', reward: '+15% base XP' },
    { level: 100, title: 'Centurion', icon: '🏛️', description: 'One hundred levels strong', reward: 'Title: Centurion' },
    { level: 125, title: 'Flow State', icon: '🌊', description: 'You\'re in the zone', reward: '+20% base XP' },
    { level: 150, title: 'Speed Freak', icon: '💨', description: 'Unstoppably fast', reward: 'Title: Speed Freak' },
    { level: 175, title: 'Relentless', icon: '🔄', description: 'Nothing can stop you', reward: '+25% base XP' },
    { level: 200, title: 'Double Century', icon: '⭐', description: '200 levels of mastery', reward: 'Title: Double Century' },
    { level: 225, title: 'Precision Engine', icon: '🎪', description: 'Every keystroke counts', reward: '+30% base XP' },
    { level: 250, title: 'Quarter Thousand', icon: '🌟', description: 'The midpoint of legends', reward: 'Title: Quarter K' },
    { level: 275, title: 'Unstoppable', icon: '🚂', description: 'A train with no brakes', reward: '+35% base XP' },
    { level: 300, title: 'Triple Century', icon: '🏆', description: '300 levels deep', reward: 'Title: Triple Century' },
    { level: 325, title: 'Machine', icon: '🤖', description: 'Are you even human?', reward: '+40% base XP' },
    { level: 350, title: 'Legendary Fingers', icon: '✨', description: 'Your fingers are legendary', reward: 'Title: Legendary Fingers' },
    { level: 375, title: 'Almost There', icon: '🏔️', description: 'The summit is in sight', reward: '+45% base XP' },
    { level: 400, title: 'Transcendent', icon: '🔮', description: 'Beyond mortal typing', reward: 'Title: Transcendent' },
    { level: 425, title: 'Otherworldly', icon: '🌌', description: 'Typing from another dimension', reward: '+50% base XP' },
    { level: 450, title: 'Ascended', icon: '👼', description: 'You\'ve ascended to a higher plane', reward: 'Title: Ascended' },
    { level: 475, title: 'Infinite', icon: '♾️', description: 'Limitless potential', reward: '+60% base XP' },
    { level: 500, title: 'GOAT', icon: '🐐', description: 'Greatest Of All Typers', reward: 'Title: GOAT ⚡' },
];

export function getMilestoneForLevel(level: number): Milestone | undefined {
    return MILESTONES.find(m => m.level === level);
}

export function getHighestMilestone(level: number): Milestone | undefined {
    let highest: Milestone | undefined;
    for (const m of MILESTONES) {
        if (m.level <= level) { highest = m; }
        else { break; }
    }
    return highest;
}

export function getNextMilestone(level: number): Milestone | undefined {
    return MILESTONES.find(m => m.level > level);
}

// --- Level Title ---
// Returns a display title based on the highest milestone reached

export function getLevelTitle(level: number): string {
    const milestone = getHighestMilestone(level);
    return milestone ? milestone.title : 'Newbie';
}

export function getLevelIcon(level: number): string {
    const milestone = getHighestMilestone(level);
    return milestone ? milestone.icon : '🌱';
}
