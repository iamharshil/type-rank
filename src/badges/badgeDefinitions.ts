import { Badge } from '../storageService';

export const RANK_BADGES: Badge[] = [
    {
        id: 'rank-bronze',
        name: 'Bronze Typer',
        description: 'Reach an average of 0–30 WPM',
        icon: '🥉',
        tier: 'bronze'
    },
    {
        id: 'rank-silver',
        name: 'Silver Typer',
        description: 'Reach an average of 31–50 WPM',
        icon: '🥈',
        tier: 'silver'
    },
    {
        id: 'rank-gold',
        name: 'Gold Typer',
        description: 'Reach an average of 51–75 WPM',
        icon: '🥇',
        tier: 'gold'
    },
    {
        id: 'rank-diamond',
        name: 'Diamond Typer',
        description: 'Reach an average of 76–100 WPM',
        icon: '💎',
        tier: 'diamond'
    },
    {
        id: 'rank-master',
        name: 'Master Typer',
        description: 'Reach an average of 101–130 WPM',
        icon: '👑',
        tier: 'master'
    },
    {
        id: 'rank-legendary',
        name: 'Legendary Typer',
        description: 'Reach an average of 131+ WPM',
        icon: '⚡',
        tier: 'legendary'
    }
];

export const ACHIEVEMENT_BADGES: Badge[] = [
    {
        id: 'first-strike',
        name: 'First Strike',
        description: 'Complete your first typing test',
        icon: '🎯',
        tier: 'achievement'
    },
    {
        id: 'on-fire',
        name: 'On Fire',
        description: 'Complete 5 tests in one session',
        icon: '🔥',
        tier: 'achievement'
    },
    {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: '100% accuracy on a 30s+ test',
        icon: '🎯',
        tier: 'achievement'
    },
    {
        id: 'speed-demon',
        name: 'Speed Demon',
        description: 'Reach 100+ WPM in a single test',
        icon: '🚀',
        tier: 'achievement'
    },
    {
        id: 'summit',
        name: 'Summit',
        description: 'Reach 150+ WPM in a single test',
        icon: '🏔️',
        tier: 'achievement'
    },
    {
        id: 'consistent',
        name: 'Consistent',
        description: 'Consistency score above 90% over 10 tests',
        icon: '📈',
        tier: 'achievement'
    },
    {
        id: 'anti-cheat-verified',
        name: 'Anti-Cheat Verified',
        description: 'Complete 50 clean tests with no flags',
        icon: '🛡️',
        tier: 'achievement'
    },
    {
        id: 'daily-grinder',
        name: 'Daily Grinder',
        description: 'Test every day for 7 consecutive days',
        icon: '🗓️',
        tier: 'achievement'
    }
];

export const ALL_BADGES: Badge[] = [...RANK_BADGES, ...ACHIEVEMENT_BADGES];
