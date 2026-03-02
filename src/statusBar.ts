import * as vscode from 'vscode';
import { StorageService } from './storageService';
import { getLevelIcon } from './engine/levelSystem';

export class StatusBarManager {
    private wpmItem: vscode.StatusBarItem;
    private rankItem: vscode.StatusBarItem;
    private storage: StorageService;

    constructor(storage: StorageService) {
        this.storage = storage;

        // WPM status bar item (right side, high priority)
        this.wpmItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
        this.wpmItem.command = 'typerank.startTest';
        this.wpmItem.tooltip = 'Click to start a TypeRank typing test';

        // Rank badge status bar item
        this.rankItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.rankItem.command = 'typerank.showProfile';
        this.rankItem.tooltip = 'Click to view your TypeRank profile';

        this.refresh();
        this.wpmItem.show();
        this.rankItem.show();
    }

    refresh(): void {
        const profile = this.storage.getProfile();

        // WPM display
        if (profile.totalTests > 0) {
            this.wpmItem.text = `$(keyboard) ${profile.bestWpm} WPM`;
        } else {
            this.wpmItem.text = '$(keyboard) TypeRank';
        }

        // Rank badge + level display
        const lvlIcon = getLevelIcon(profile.level);
        this.rankItem.text = `${profile.currentRankBadge} ${profile.currentRank} | ${lvlIcon} Lv.${profile.level}`;
    }

    updateAfterTest(wpm: number): void {
        this.wpmItem.text = `$(keyboard) ${wpm} WPM`;
        this.refresh();
    }

    dispose(): void {
        this.wpmItem.dispose();
        this.rankItem.dispose();
    }
}
