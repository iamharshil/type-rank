import * as vscode from 'vscode';
import { StorageService } from '../storageService';
import { ALL_BADGES } from '../badges/badgeDefinitions';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'typerank.sidebarView';
  private view?: vscode.WebviewView;
  private storage: StorageService;
  private extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri, storage: StorageService) {
    this.extensionUri = extensionUri;
    this.storage = storage;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')]
    };

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'requestData':
          this.sendDataToWebview();
          break;
        case 'startTest':
          vscode.commands.executeCommand('typerank.startTest');
          break;
      }
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.sendDataToWebview();
      }
    });
  }

  public refresh(): void {
    if (this.view) {
      this.sendDataToWebview();
    }
  }

  private sendDataToWebview(): void {
    if (!this.view) { return; }

    const profile = this.storage.getProfile();
    const history = this.storage.getTestHistory();
    const earnedBadges = this.storage.getEarnedBadges();

    // Top 10 scores
    const topScores = [...history]
      .filter(r => !r.isSuspicious)
      .sort((a, b) => b.wpm - a.wpm)
      .slice(0, 10);

    this.view.webview.postMessage({
      command: 'loadData',
      profile,
      topScores,
      earnedBadges,
      allBadges: ALL_BADGES
    });
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const mediaUri = vscode.Uri.joinPath(this.extensionUri, 'media');
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'sidebar.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaUri, 'sidebar.js'));
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${cssUri}">
  <title>TypeRank</title>
</head>
<body>
  <div id="sidebar">
    <!-- Profile Card (Unified Profile & Level) -->
    <div class="profile-card">
      <div class="profile-header">
        <div class="profile-avatar">
          <span class="rank-badge" id="rankBadge">🥉</span>
        </div>
        <div class="profile-info">
          <h2 class="profile-name" id="profileName">Typer</h2>
          <span class="profile-rank" id="profileRank">Bronze Typer</span>
        </div>
      </div>
      
      <div class="level-section">
        <div class="level-header">
          <span class="level-icon" id="sidebarLevelIcon">🌱</span>
          <span class="level-text">Lv. <strong id="sidebarLevel">0</strong> <span id="sidebarLevelTitle">Newbie</span></span>
          <span class="streak-badge" id="sidebarStreak" title="Daily Streak">🔥 0</span>
        </div>
        <div class="sidebar-xp-bar-wrap">
          <div class="sidebar-xp-bar" id="sidebarXpBar" style="width: 0%"></div>
        </div>
        <div class="level-footer">
          <div class="next-milestone" id="sidebarMilestone">Next: 🌱 Lv.1 Newbie</div>
          <div class="xp-label" id="sidebarXpLabel">0 / 0 XP</div>
        </div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat">
          <span class="profile-stat-value" id="statBestWpm">0</span>
          <span class="profile-stat-label">Best WPM</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat-value" id="statAvgWpm">0</span>
          <span class="profile-stat-label">Avg WPM</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat-value" id="statTests">0</span>
          <span class="profile-stat-label">Tests</span>
        </div>
      </div>
    </div>

    <!-- Quick Start -->
    <button class="start-btn" id="startTestBtn">
      <span class="start-icon">⌨️</span> Start Typing Test
    </button>

    <!-- Leaderboard -->
    <div class="section">
      <h3 class="section-title">🏆 Personal Best</h3>
      <div class="leaderboard" id="leaderboard">
        <div class="empty-state">No tests yet. Start your first test!</div>
      </div>
    </div>

    <!-- Badges -->
    <div class="section">
      <h3 class="section-title">🎖️ Badges</h3>
      <div class="badges-showcase" id="badgesShowcase">
        <div class="empty-state">Complete tests to earn badges!</div>
      </div>
    </div>
  </div>

  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
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
