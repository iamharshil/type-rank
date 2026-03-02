import * as vscode from 'vscode';
import { StorageService } from '../storageService';
import { generateWords, getWordCountForDuration, WordMode } from '../engine/wordGenerator';
import { calculateTestResult, RawTestData } from '../engine/statsCalculator';
import { analyzeKeystrokes, KeystrokeEvent } from '../engine/antiCheat';
import { calculateXpFromTest, getMilestoneForLevel } from '../engine/levelSystem';
import { BadgeEvaluator } from '../badges/badgeEvaluator';
import { StatusBarManager } from '../statusBar';
import { SidebarProvider } from './sidebarProvider';

export class TypingTestPanel {
  public static currentPanel: TypingTestPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private storage: StorageService;
  private badgeEvaluator: BadgeEvaluator;
  private statusBar: StatusBarManager;
  private sidebarProvider: SidebarProvider;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    storage: StorageService,
    badgeEvaluator: BadgeEvaluator,
    statusBar: StatusBarManager,
    sidebarProvider: SidebarProvider
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.storage = storage;
    this.badgeEvaluator = badgeEvaluator;
    this.statusBar = statusBar;
    this.sidebarProvider = sidebarProvider;

    this.panel.webview.html = this.getHtmlContent();

    this.panel.webview.onDidReceiveMessage(
      async (message) => { await this.handleMessage(message); },
      null,
      this.disposables
    );

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    storage: StorageService,
    badgeEvaluator: BadgeEvaluator,
    statusBar: StatusBarManager,
    sidebarProvider: SidebarProvider
  ): void {
    const column = vscode.ViewColumn.One;

    if (TypingTestPanel.currentPanel) {
      TypingTestPanel.currentPanel.panel.reveal(column);
      // Re-send words so the panel resets if it was hidden
      const count = getWordCountForDuration(30);
      const words = generateWords(count, 'common');
      TypingTestPanel.currentPanel.panel.webview.postMessage({ command: 'loadWords', words, duration: 30 });
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'typerankTest',
      'TypeRank — Typing Test',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      }
    );

    TypingTestPanel.currentPanel = new TypingTestPanel(
      panel, extensionUri, storage, badgeEvaluator, statusBar, sidebarProvider
    );
  }

  private async handleMessage(message: any): Promise<void> {
    switch (message.command) {
      case 'requestWords': {
        const duration = message.duration || 30;
        const mode: WordMode = message.mode || 'common';
        const count = getWordCountForDuration(duration);
        const words = generateWords(count, mode);
        this.panel.webview.postMessage({ command: 'loadWords', words, duration });
        break;
      }

      case 'testComplete': {
        const data: RawTestData = message.data;

        // Run anti-cheat analysis
        const keystrokeEvents: KeystrokeEvent[] = message.keystrokeEvents || [];
        const cheatReport = analyzeKeystrokes(keystrokeEvents, data.correctChars > 0
          ? Math.round((data.correctChars / 5) / (data.elapsedMs / 60000))
          : 0);

        data.cheatFlags = cheatReport.flags;
        data.isSuspicious = cheatReport.isSuspicious;

        // Calculate results
        const result = calculateTestResult(data);

        // Save to storage
        await this.storage.addTestResult(result);
        await this.storage.incrementSessionStreak();

        // Update daily streak
        const dailyStreak = await this.storage.updateDailyStreak();

        // Calculate and award XP
        const xpBreakdown = calculateXpFromTest(
          result.wpm,
          result.accuracy,
          result.consistency,
          result.duration,
          dailyStreak,
          result.isSuspicious
        );
        const levelResult = await this.storage.addXp(xpBreakdown.totalXp);
        const leveledUp = levelResult.newLevel > levelResult.previousLevel;

        // Check for milestone unlocks
        const newMilestones = [];
        if (leveledUp) {
          for (let lvl = levelResult.previousLevel + 1; lvl <= levelResult.newLevel; lvl++) {
            const milestone = getMilestoneForLevel(lvl);
            if (milestone) { newMilestones.push(milestone); }
          }
        }

        // Evaluate badges
        const newBadges = await this.badgeEvaluator.evaluate(result);

        // Update status bar
        this.statusBar.updateAfterTest(result.wpm);

        // Refresh sidebar to show new scores and badges
        this.sidebarProvider.refresh();

        // Get current profile for the results screen
        const profile = this.storage.getProfile();

        // Send results back to webview
        this.panel.webview.postMessage({
          command: 'showResults',
          result,
          newBadges,
          profile,
          cheatReport,
          xpBreakdown,
          leveledUp,
          newMilestones,
          previousLevel: levelResult.previousLevel,
          newLevel: levelResult.newLevel
        });
        break;
      }

      case 'restart': {
        const duration = message.duration || 30;
        const mode: WordMode = message.mode || 'common';
        const count = getWordCountForDuration(duration);
        const words = generateWords(count, mode);
        this.panel.webview.postMessage({ command: 'loadWords', words, duration });
        break;
      }
    }
  }

  private getHtmlContent(): string {
    const webview = this.panel.webview;
    const mediaUri = vscode.Uri.joinPath(this.extensionUri, 'media');
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'typingTest.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'typingTest.js'));
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
  <link rel="stylesheet" href="${cssUri}">
  <title>TypeRank — Typing Test</title>
</head>
<body>
  <div id="app">
    <!-- Config Bar -->
    <div class="config-bar" id="configBar">
      <div class="config-group">
        <label class="config-label">Duration</label>
        <div class="config-options" id="durationOptions">
          <button class="config-btn" data-value="15">15s</button>
          <button class="config-btn active" data-value="30">30s</button>
          <button class="config-btn" data-value="60">60s</button>
          <button class="config-btn" data-value="120">120s</button>
        </div>
      </div>
      <div class="config-group">
        <label class="config-label">Mode</label>
        <div class="config-options" id="modeOptions">
          <button class="config-btn active" data-value="common">Words</button>
          <button class="config-btn" data-value="code">Code</button>
          <button class="config-btn" data-value="quotes">Quotes</button>
        </div>
      </div>
    </div>

    <!-- Timer -->
    <div class="timer-display" id="timerDisplay">30</div>

    <!-- Word Display -->
    <div class="word-container" id="wordContainer">
      <div class="words" id="wordsDisplay">
        <span class="loading-text">Press any key to start...</span>
      </div>
      <div class="cursor-line" id="cursorLine"></div>
    </div>

    <!-- Hidden Input -->
    <textarea id="hiddenInput" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>

    <!-- Live Stats -->
    <div class="live-stats" id="liveStats">
      <div class="stat-item">
        <span class="stat-value" id="liveWpm">0</span>
        <span class="stat-label">WPM</span>
      </div>
      <div class="stat-item">
        <span class="stat-value" id="liveAccuracy">100</span>
        <span class="stat-label">Accuracy</span>
      </div>
    </div>

    <!-- Results Screen -->
    <div class="results-screen hidden" id="resultsScreen">
      <div class="results-header">
        <h1 class="results-title">Test Complete</h1>
        <div class="cheat-warning hidden" id="cheatWarning">
          <span class="warning-icon">⚠️</span>
          <span>Suspicious activity detected — this result is unranked</span>
        </div>
      </div>

      <div class="results-grid">
        <div class="result-card primary">
          <span class="result-value" id="resultWpm">0</span>
          <span class="result-label">WPM</span>
        </div>
        <div class="result-card">
          <span class="result-value" id="resultAccuracy">0%</span>
          <span class="result-label">Accuracy</span>
        </div>
        <div class="result-card">
          <span class="result-value" id="resultRaw">0</span>
          <span class="result-label">Raw WPM</span>
        </div>
        <div class="result-card">
          <span class="result-value" id="resultConsistency">0%</span>
          <span class="result-label">Consistency</span>
        </div>
        <div class="result-card">
          <span class="result-value" id="resultChars">0/0</span>
          <span class="result-label">Characters</span>
        </div>
        <div class="result-card rank-card">
          <span class="result-value" id="resultRank">🥉</span>
          <span class="result-label" id="resultRankLabel">Bronze</span>
        </div>
      </div>

      <!-- WPM Chart -->
      <div class="chart-container">
        <canvas id="wpmChart" width="600" height="150"></canvas>
      </div>

      <!-- XP & Level -->
      <div class="xp-section" id="xpSection">
        <div class="level-display">
          <span class="level-icon" id="levelIcon">🌱</span>
          <span class="level-number">Lv. <span id="levelNumber">0</span></span>
          <span class="level-title" id="levelTitle">Newbie</span>
        </div>
        <div class="xp-bar-container">
          <div class="xp-bar" id="xpBar" style="width: 0%"></div>
          <span class="xp-text" id="xpText">0 / 0 XP</span>
        </div>
        <div class="xp-breakdown" id="xpBreakdown">
          <span class="xp-earned" id="xpEarned">+0 XP</span>
          <div class="xp-details" id="xpDetails"></div>
        </div>
        <div class="streak-display" id="streakDisplay">
          <span class="streak-fire">🔥</span>
          <span class="streak-count" id="streakCount">0</span>
          <span class="streak-label">day streak</span>
          <span class="streak-multiplier" id="streakMultiplier">1x</span>
        </div>
      </div>

      <!-- Level Up -->
      <div class="level-up hidden" id="levelUpSection">
        <div class="level-up-text">🎉 LEVEL UP!</div>
        <div class="level-up-levels" id="levelUpLevels"></div>
      </div>

      <!-- Milestone -->
      <div class="milestone-unlock hidden" id="milestoneSection">
        <div class="milestone-header">🏅 Milestone Unlocked!</div>
        <div class="milestones-list" id="milestonesList"></div>
      </div>

      <!-- New Badges -->
      <div class="new-badges hidden" id="newBadgesSection">
        <h2 class="badges-title">🏆 Badges Earned!</h2>
        <div class="badges-grid" id="badgesGrid"></div>
      </div>

      <!-- Actions -->
      <div class="results-actions">
        <button class="action-btn primary" id="restartBtn">Try Again</button>
      </div>
    </div>
  </div>

  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }

  private dispose(): void {
    TypingTestPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) { d.dispose(); }
    }
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
