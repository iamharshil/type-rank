import * as vscode from 'vscode';
import { StorageService } from './storageService';
import { getLevelIcon } from './engine/levelSystem';

export class StatusBarManager {
    private wpmItem: vscode.StatusBarItem;
    private codingWpmItem: vscode.StatusBarItem;
    private rankItem: vscode.StatusBarItem;
    private storage: StorageService;

    constructor(storage: StorageService) {
        this.storage = storage;

        // Test WPM status bar item (right side, high priority)
        this.wpmItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 102);
        this.wpmItem.command = 'typerank.startTest';
        this.wpmItem.tooltip = 'Typing Test Avg WPM — Click to start a test';

        // Coding WPM status bar item
        this.codingWpmItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
        this.codingWpmItem.tooltip = 'Coding Speed (passive)';

        // Rank badge status bar item
        this.rankItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.rankItem.command = 'typerank.showProfile';
        this.rankItem.tooltip = 'Click to view your TypeRank profile';

        this.refresh();
        this.wpmItem.show();
        this.codingWpmItem.show();
        this.rankItem.show();
    }

    refresh(): void {
        const profile = this.storage.getProfile();

        // Test WPM display
        if (profile.totalTests > 0) {
            this.wpmItem.text = `$(keyboard) ${profile.averageWpm} WPM`;
        } else {
            this.wpmItem.text = '$(keyboard) TypeRank';
        }

        // Coding WPM display
        if (profile.codingAvgWpm > 0) {
            this.codingWpmItem.text = `$(code) ${profile.codingAvgWpm} WPM`;
        } else {
            this.codingWpmItem.text = `$(code) —`;
        }

        // Rank badge + level display
        const lvlIcon = getLevelIcon(profile.level);
        this.rankItem.text = `${profile.currentRankBadge} ${profile.currentRank} | ${lvlIcon} Lv.${profile.level}`;
    }

    updateAfterTest(wpm: number): void {
        this.wpmItem.text = `$(keyboard) ${wpm} WPM`;
        this.refresh();
    }

    updateCodingWpm(wpm: number): void {
        if (wpm > 0) {
            this.codingWpmItem.text = `$(code) ${wpm} WPM`;
        } else {
            this.codingWpmItem.text = `$(code) —`;
        }
    }

    dispose(): void {
        this.wpmItem.dispose();
        this.codingWpmItem.dispose();
        this.rankItem.dispose();
    }
}
