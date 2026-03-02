// @ts-nocheck
(function () {
    const vscode = acquireVsCodeApi();

    // --- State ---
    let words = [];
    let currentWordIndex = 0;
    let currentCharIndex = 0;
    let correctChars = 0;
    let incorrectChars = 0;
    let totalChars = 0;
    let isRunning = false;
    let isFinished = false;
    let duration = 30;
    let timeLeft = 30;
    let mode = 'common';
    let timerInterval = null;
    let startTime = null;
    let wpmSnapshots = [];
    let keystrokeEvents = [];

    // --- DOM Elements ---
    const wordsDisplay = document.getElementById('wordsDisplay');
    const hiddenInput = document.getElementById('hiddenInput');
    const timerDisplay = document.getElementById('timerDisplay');
    const liveWpm = document.getElementById('liveWpm');
    const liveAccuracy = document.getElementById('liveAccuracy');
    const configBar = document.getElementById('configBar');
    const liveStats = document.getElementById('liveStats');
    const resultsScreen = document.getElementById('resultsScreen');
    const restartBtn = document.getElementById('restartBtn');

    // --- Config Handlers ---
    document.getElementById('durationOptions').addEventListener('click', (e) => {
        if (e.target.classList.contains('config-btn') && !isRunning) {
            document.querySelectorAll('#durationOptions .config-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            duration = parseInt(e.target.dataset.value);
            timeLeft = duration;
            timerDisplay.textContent = duration;
            requestWords();
        }
    });

    document.getElementById('modeOptions').addEventListener('click', (e) => {
        if (e.target.classList.contains('config-btn') && !isRunning) {
            document.querySelectorAll('#modeOptions .config-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            mode = e.target.dataset.value;
            requestWords();
        }
    });

    // --- Focus Handling ---
    document.addEventListener('click', () => {
        if (!isFinished) { hiddenInput.focus(); }
    });

    // Block paste
    hiddenInput.addEventListener('paste', (e) => {
        e.preventDefault();
    });

    // --- Keyboard Input ---
    hiddenInput.addEventListener('keydown', (e) => {
        if (isFinished) { return; }

        // Block Tab key to prevent focus loss
        if (e.key === 'Tab') {
            e.preventDefault();
            return;
        }

        // Escape cancels the current test
        if (e.key === 'Escape') {
            e.preventDefault();
            if (isRunning) {
                resetState();
                requestWords();
            }
            return;
        }

        // Record keystroke timing for anti-cheat
        const now = performance.now();
        const event = { key: e.key, downTime: now, upTime: 0 };

        if (!isRunning && e.key.length === 1) {
            startTest();
        }

        if (!isRunning) { return; }

        if (e.key === ' ') {
            e.preventDefault();
            if (currentCharIndex > 0) {
                moveToNextWord();
            }
            totalChars++;
            event.upTime = performance.now();
            keystrokeEvents.push(event);
            return;
        }

        if (e.key === 'Backspace') {
            e.preventDefault();
            handleBackspace();
            event.upTime = performance.now();
            keystrokeEvents.push(event);
            return;
        }

        if (e.key.length === 1) {
            e.preventDefault();
            handleCharacterInput(e.key);
            keystrokeEvents.push(event);
        }
    });

    hiddenInput.addEventListener('keyup', (e) => {
        // Update upTime for anti-cheat
        const now = performance.now();
        for (let i = keystrokeEvents.length - 1; i >= 0; i--) {
            if (keystrokeEvents[i].key === e.key && keystrokeEvents[i].upTime === 0) {
                keystrokeEvents[i].upTime = now;
                break;
            }
        }
    });

    // --- Focus loss detection ---
    let blurTime = null;
    window.addEventListener('blur', () => {
        if (isRunning) {
            blurTime = Date.now();
        }
    });

    window.addEventListener('focus', () => {
        if (blurTime && isRunning) {
            const blurDuration = Date.now() - blurTime;
            if (blurDuration > 5000) {
                // Invalidate test if unfocused for more than 5 seconds
                endTest(true);
            }
            blurTime = null;
        }
        if (!isFinished) { hiddenInput.focus(); }
    });

    // --- Core Logic ---
    function startTest() {
        isRunning = true;
        startTime = performance.now();
        timerDisplay.classList.add('running');
        configBar.style.pointerEvents = 'none';
        configBar.style.opacity = '0.4';

        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;

            if (timeLeft <= 5) {
                timerDisplay.classList.add('warning');
            }

            // Snapshot WPM each second
            const elapsed = (performance.now() - startTime) / 60000;
            const currentWpm = elapsed > 0 ? Math.round((correctChars / 5) / elapsed) : 0;
            wpmSnapshots.push(currentWpm);
            liveWpm.textContent = currentWpm;

            const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
            liveAccuracy.textContent = accuracy;

            if (timeLeft <= 0) {
                endTest(false);
            }
        }, 1000);

        hiddenInput.focus();
    }

    function handleCharacterInput(char) {
        const word = words[currentWordIndex];
        if (!word || currentCharIndex >= word.length) { return; }

        const expected = word[currentCharIndex];
        totalChars++;

        if (char === expected) {
            correctChars++;
            markLetter(currentWordIndex, currentCharIndex, 'correct');
        } else {
            incorrectChars++;
            markLetter(currentWordIndex, currentCharIndex, 'incorrect');
        }

        currentCharIndex++;

        // Auto-advance to next word if at end of current word
        if (currentCharIndex >= word.length && currentWordIndex < words.length - 1) {
            // Don't auto-advance, wait for space
        }

        // Update cursor position
        updateCursor();
    }

    function handleBackspace() {
        if (currentCharIndex > 0) {
            currentCharIndex--;
            const letterEl = getLetterEl(currentWordIndex, currentCharIndex);
            if (letterEl) {
                if (letterEl.classList.contains('correct')) {
                    correctChars--;
                } else if (letterEl.classList.contains('incorrect')) {
                    incorrectChars--;
                }
                letterEl.classList.remove('correct', 'incorrect');
                totalChars--;
            }
            updateCursor();
        }
    }

    function moveToNextWord() {
        // Mark remaining letters in current word as skipped (incorrect)
        const word = words[currentWordIndex];
        for (let i = currentCharIndex; i < word.length; i++) {
            markLetter(currentWordIndex, i, 'incorrect');
            incorrectChars++;
            totalChars++;
        }

        currentWordIndex++;
        currentCharIndex = 0;

        if (currentWordIndex >= words.length) {
            endTest(false);
            return;
        }

        updateCursor();
        scrollWordsIfNeeded();
    }

    function endTest(invalidated) {
        isRunning = false;
        isFinished = true;
        clearInterval(timerInterval);
        timerDisplay.classList.remove('running', 'warning');

        const elapsedMs = performance.now() - startTime;

        const data = {
            correctChars,
            incorrectChars,
            totalChars,
            elapsedMs,
            mode,
            wpmSnapshots,
            cheatFlags: invalidated ? ['FOCUS_LOSS_INVALIDATED'] : [],
            isSuspicious: invalidated
        };

        vscode.postMessage({
            command: 'testComplete',
            data,
            keystrokeEvents: keystrokeEvents.map(e => ({
                key: e.key,
                downTime: Math.round(e.downTime),
                upTime: Math.round(e.upTime)
            }))
        });
    }

    // --- Rendering ---
    function renderWords() {
        wordsDisplay.innerHTML = '';
        words.forEach((word, wi) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            wordSpan.dataset.index = wi;

            word.split('').forEach((char, ci) => {
                const letterSpan = document.createElement('span');
                letterSpan.className = 'letter';
                letterSpan.textContent = char;
                letterSpan.dataset.word = wi;
                letterSpan.dataset.char = ci;
                wordSpan.appendChild(letterSpan);
            });

            wordsDisplay.appendChild(wordSpan);
        });
        updateCursor();
    }

    function markLetter(wordIdx, charIdx, cls) {
        const el = getLetterEl(wordIdx, charIdx);
        if (el) {
            el.classList.remove('correct', 'incorrect', 'current');
            el.classList.add(cls);
        }
    }

    function getLetterEl(wordIdx, charIdx) {
        return wordsDisplay.querySelector(`[data-word="${wordIdx}"][data-char="${charIdx}"]`);
    }

    function updateCursor() {
        // Remove all current markers
        wordsDisplay.querySelectorAll('.current').forEach(el => el.classList.remove('current'));

        // Set current
        const el = getLetterEl(currentWordIndex, currentCharIndex);
        if (el) {
            el.classList.add('current');
        }
    }

    function scrollWordsIfNeeded() {
        const currentWordEl = wordsDisplay.querySelector(`[data-index="${currentWordIndex}"]`);
        if (currentWordEl) {
            const container = document.querySelector('.word-container');
            const wordTop = currentWordEl.offsetTop;
            const containerHeight = container.clientHeight;
            if (wordTop > containerHeight * 0.6) {
                wordsDisplay.style.transform = `translateY(-${wordTop - 20}px)`;
            }
        }
    }

    // --- Results Rendering ---
    function showResults(result, newBadges, profile, cheatReport, xpBreakdown, leveledUp, newMilestones, previousLevel, newLevel) {
        // Hide test UI, show results
        document.querySelector('.word-container').style.display = 'none';
        liveStats.style.display = 'none';
        configBar.style.display = 'none';
        timerDisplay.style.display = 'none';
        resultsScreen.classList.remove('hidden');

        // Populate results
        document.getElementById('resultWpm').textContent = result.wpm;
        document.getElementById('resultAccuracy').textContent = result.accuracy + '%';
        document.getElementById('resultRaw').textContent = result.rawWpm;
        document.getElementById('resultConsistency').textContent = result.consistency + '%';
        document.getElementById('resultChars').textContent = `${result.correctChars}/${result.totalChars}`;
        document.getElementById('resultRank').textContent = profile.currentRankBadge;
        document.getElementById('resultRankLabel').textContent = profile.currentRank;

        // Cheat warning
        if (cheatReport && cheatReport.isSuspicious) {
            document.getElementById('cheatWarning').classList.remove('hidden');
        }

        // Draw WPM chart
        drawWpmChart(result.wpmOverTime);

        // --- XP & Level ---
        if (xpBreakdown) {
            document.getElementById('xpEarned').textContent = '+' + xpBreakdown.totalXp + ' XP';

            // XP detail breakdown
            const details = document.getElementById('xpDetails');
            details.innerHTML = '';
            const items = [
                { label: 'Base', value: xpBreakdown.baseXp },
                { label: 'WPM', value: xpBreakdown.wpmBonus },
                { label: 'Accuracy', value: xpBreakdown.accuracyBonus },
                { label: 'Consistency', value: xpBreakdown.consistencyBonus },
                { label: 'Duration', value: xpBreakdown.durationBonus },
            ];
            items.forEach(item => {
                if (item.value > 0) {
                    const el = document.createElement('span');
                    el.className = 'xp-detail-item';
                    el.textContent = item.label + ' +' + item.value;
                    details.appendChild(el);
                }
            });

            // Streak
            document.getElementById('streakCount').textContent = profile.dailyStreak;
            document.getElementById('streakMultiplier').textContent = xpBreakdown.streakMultiplier + 'x';
        }

        // Level display
        if (profile) {
            document.getElementById('levelIcon').textContent = profile.levelIcon;
            document.getElementById('levelNumber').textContent = profile.level;
            document.getElementById('levelTitle').textContent = profile.levelTitle;
            document.getElementById('xpText').textContent = profile.currentXp + ' / ' + profile.xpForNextLevel + ' XP';

            // Animate XP bar
            setTimeout(() => {
                document.getElementById('xpBar').style.width = (profile.levelProgress * 100) + '%';
            }, 300);
        }

        // Level up banner
        if (leveledUp) {
            const section = document.getElementById('levelUpSection');
            section.classList.remove('hidden');
            document.getElementById('levelUpLevels').textContent =
                'Level ' + previousLevel + ' → Level ' + newLevel;
        }

        // Milestones
        if (newMilestones && newMilestones.length > 0) {
            const section = document.getElementById('milestoneSection');
            const list = document.getElementById('milestonesList');
            section.classList.remove('hidden');
            list.innerHTML = '';
            newMilestones.forEach((m, i) => {
                const item = document.createElement('div');
                item.className = 'milestone-item';
                item.style.animationDelay = (i * 0.2) + 's';
                item.innerHTML = `
                    <span class="milestone-icon">${m.icon}</span>
                    <span class="milestone-name">${m.title}</span>
                    <span class="milestone-desc">${m.description}</span>
                    <span class="milestone-reward">${m.reward}</span>
                `;
                list.appendChild(item);
            });
        }

        // Show new badges
        if (newBadges && newBadges.length > 0) {
            const section = document.getElementById('newBadgesSection');
            const grid = document.getElementById('badgesGrid');
            section.classList.remove('hidden');
            grid.innerHTML = '';

            newBadges.forEach((badge, i) => {
                const item = document.createElement('div');
                item.className = 'badge-item';
                item.style.animationDelay = `${i * 0.15}s`;
                item.innerHTML = `
          <span class="badge-icon">${badge.icon}</span>
          <span class="badge-name">${badge.name}</span>
          <span class="badge-desc">${badge.description}</span>
        `;
                grid.appendChild(item);
            });
        }
    }

    function drawWpmChart(wpmData) {
        const canvas = document.getElementById('wpmChart');
        if (!canvas || !wpmData || wpmData.length < 2) { return; }

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const padding = 30;

        ctx.clearRect(0, 0, w, h);

        const max = Math.max(...wpmData, 1);
        const min = Math.min(...wpmData);
        const range = max - min || 1;

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding + (i / 4) * (h - padding * 2);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(w - padding, y);
            ctx.stroke();
        }

        // WPM line
        const gradient = ctx.createLinearGradient(0, padding, 0, h - padding);
        gradient.addColorStop(0, '#4fc1ff');
        gradient.addColorStop(1, '#4ec9b0');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();

        wpmData.forEach((wpm, i) => {
            const x = padding + (i / (wpmData.length - 1)) * (w - padding * 2);
            const y = h - padding - ((wpm - min) / range) * (h - padding * 2);
            if (i === 0) { ctx.moveTo(x, y); }
            else { ctx.lineTo(x, y); }
        });
        ctx.stroke();

        // Fill under line
        const fillGradient = ctx.createLinearGradient(0, padding, 0, h - padding);
        fillGradient.addColorStop(0, 'rgba(79, 193, 255, 0.15)');
        fillGradient.addColorStop(1, 'rgba(78, 201, 176, 0.02)');

        ctx.lineTo(padding + (w - padding * 2), h - padding);
        ctx.lineTo(padding, h - padding);
        ctx.closePath();
        ctx.fillStyle = fillGradient;
        ctx.fill();

        // Labels
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(max + '', padding - 5, padding + 4);
        ctx.fillText(min + '', padding - 5, h - padding + 4);
        ctx.textAlign = 'center';
        ctx.fillText('0s', padding, h - 10);
        ctx.fillText(wpmData.length + 's', w - padding, h - 10);
    }

    // --- Restart ---
    restartBtn.addEventListener('click', () => {
        resetState();
        requestWords();
    });

    function resetState() {
        words = [];
        currentWordIndex = 0;
        currentCharIndex = 0;
        correctChars = 0;
        incorrectChars = 0;
        totalChars = 0;
        isRunning = false;
        isFinished = false;
        timeLeft = duration;
        startTime = null;
        wpmSnapshots = [];
        keystrokeEvents = [];
        clearInterval(timerInterval);

        timerDisplay.textContent = duration;
        timerDisplay.classList.remove('running', 'warning');
        timerDisplay.style.display = '';
        liveWpm.textContent = '0';
        liveAccuracy.textContent = '100';

        document.querySelector('.word-container').style.display = '';
        liveStats.style.display = '';
        configBar.style.display = '';
        configBar.style.pointerEvents = '';
        configBar.style.opacity = '';
        resultsScreen.classList.add('hidden');
        document.getElementById('cheatWarning').classList.add('hidden');
        document.getElementById('newBadgesSection').classList.add('hidden');
        document.getElementById('levelUpSection').classList.add('hidden');
        document.getElementById('milestoneSection').classList.add('hidden');
        document.getElementById('xpBar').style.width = '0%';
        wordsDisplay.style.transform = '';

        hiddenInput.value = '';
        hiddenInput.focus();
    }

    function requestWords() {
        vscode.postMessage({ command: 'requestWords', duration, mode });
    }

    // --- Message Listener ---
    window.addEventListener('message', (event) => {
        const msg = event.data;
        switch (msg.command) {
            case 'loadWords':
                // Reset state when new words arrive (handles re-open)
                if (isRunning || isFinished) {
                    resetState();
                }
                words = msg.words;
                duration = msg.duration;
                timeLeft = msg.duration;
                timerDisplay.textContent = msg.duration;
                renderWords();
                hiddenInput.focus();
                break;

            case 'showResults':
                showResults(msg.result, msg.newBadges, msg.profile, msg.cheatReport, msg.xpBreakdown, msg.leveledUp, msg.newMilestones, msg.previousLevel, msg.newLevel);
                break;
        }
    });

    // --- Initial load ---
    requestWords();
})();
