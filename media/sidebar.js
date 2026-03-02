// @ts-nocheck
(function () {
    const vscode = acquireVsCodeApi();

    const startTestBtn = document.getElementById('startTestBtn');
    startTestBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'startTest' });
    });

    // Request data on load
    vscode.postMessage({ command: 'requestData' });

    window.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg.command === 'loadData') {
            renderProfile(msg.profile);
            renderLeaderboard(msg.topScores);
            renderBadges(msg.allBadges, msg.earnedBadges);
        }
    });

    function renderProfile(profile) {
        document.getElementById('rankBadge').textContent = profile.currentRankBadge;
        document.getElementById('profileName').textContent = profile.displayName;
        document.getElementById('profileRank').textContent = profile.currentRank + ' Typer';
        document.getElementById('statBestWpm').textContent = profile.bestWpm;
        document.getElementById('statAvgWpm').textContent = profile.averageWpm;
        document.getElementById('statCodingWpm').textContent = profile.codingAvgWpm || '—';
        document.getElementById('statTests').textContent = profile.totalTests;

        // Level section
        document.getElementById('sidebarLevelIcon').textContent = profile.levelIcon;
        document.getElementById('sidebarLevel').textContent = profile.level;
        document.getElementById('sidebarLevelTitle').textContent = profile.levelTitle;
        document.getElementById('sidebarXpLabel').textContent = profile.currentXp + ' / ' + profile.xpForNextLevel + ' XP';
        document.getElementById('sidebarXpBar').style.width = (profile.levelProgress * 100) + '%';
        document.getElementById('sidebarStreak').textContent = '🔥 ' + profile.dailyStreak;
        document.getElementById('sidebarMilestone').textContent =
            'Next: Lv.' + profile.nextMilestoneLevel + ' ' + profile.nextMilestoneTitle;
    }

    function renderLeaderboard(scores) {
        const container = document.getElementById('leaderboard');
        if (!scores || scores.length === 0) {
            container.innerHTML = '<div class="empty-state">No tests yet. Start your first test!</div>';
            return;
        }
        container.innerHTML = '';
        scores.forEach((score, i) => {
            const posClass = i < 3 ? ` top-${i + 1}` : '';
            const date = new Date(score.timestamp).toLocaleDateString();
            const item = document.createElement('div');
            item.className = 'leaderboard-item' + posClass;
            item.innerHTML = `
        <span class="lb-position">#${i + 1}</span>
        <span class="lb-wpm">${score.wpm} WPM</span>
        <span class="lb-accuracy">${score.accuracy}%</span>
        <span class="lb-date">${date}</span>
      `;
            container.appendChild(item);
        });
    }

    function renderBadges(allBadges, earnedBadges) {
        const container = document.getElementById('badgesShowcase');
        if (!allBadges) { return; }
        container.innerHTML = '';
        const earnedIds = new Set((earnedBadges || []).map(b => b.id));

        allBadges.forEach((badge) => {
            const isEarned = earnedIds.has(badge.id);
            const item = document.createElement('div');
            item.className = 'showcase-badge ' + (isEarned ? 'earned' : 'locked');
            item.title = badge.description;
            item.innerHTML = `
        <span class="showcase-badge-icon">${badge.icon}</span>
        <span class="showcase-badge-name">${badge.name}</span>
      `;
            container.appendChild(item);
        });
    }
})();
