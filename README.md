<p align="center">
  <img src="https://raw.githubusercontent.com/AmanVarshney01/type-rank/main/media/icon.png" width="128" height="128" alt="TypeRank Icon" />
</p>

<h1 align="center">TypeRank</h1>

<p align="center">
  A Monkeytype-inspired typing test with rankings, badges, and anti-cheat — right inside VS Code.
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=iamharshil.type-rank"><img src="https://img.shields.io/badge/VS%20Code-Marketplace-007ACC?style=flat-square&logo=visual-studio-code" alt="Marketplace" /></a>
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
</p>

---

## Features

### ⌨️ Typing Test
- **3 modes** — Common words · Programming keywords · Quotes
- **4 durations** — 15s · 30s · 60s · 120s
- Real-time WPM and accuracy tracking
- WPM-over-time chart on the results screen
- Clean, distraction-free Monkeytype-inspired UI

### 🏆 Rank System

Climb through 6 tiers based on your average WPM:

| Rank | WPM | Badge |
|------|-----|-------|
| Bronze Typer | 0–30 | 🥉 |
| Silver Typer | 31–50 | 🥈 |
| Gold Typer | 51–75 | 🥇 |
| Diamond Typer | 76–100 | 💎 |
| Master Typer | 101–130 | 👑 |
| Legendary Typer | 131+ | ⚡ |

### 🎖️ Badges

| Badge | Condition |
|-------|-----------|
| 🎯 First Strike | Complete your first test |
| 🔥 On Fire | 5 tests in one session |
| 🎯 Sharpshooter | 100% accuracy on a 30s+ test |
| 🚀 Speed Demon | Hit 100+ WPM |
| 🏔️ Summit | Hit 150+ WPM |
| 📈 Consistent | 90%+ consistency over 10 tests |
| 🛡️ Anti-Cheat Verified | 50 clean tests |
| 🗓️ Daily Grinder | Test 7 consecutive days |

### 🛡️ Anti-Cheat

Multi-layered protection keeps results fair:

- Paste detection and blocking
- Keystroke interval analysis
- Key hold duration checking
- Burst speed detection
- Focus loss monitoring
- Robotic rhythm detection

Suspicious results are flagged and marked **unranked**.

### 📊 Passive Coding Tracker

Tracks your real coding speed in the background:
- Rolling WPM from editor keystrokes (paste/autocomplete filtered)
- Accuracy estimated from backspace ratio
- XP awarded every 60s of active coding

### 📋 Sidebar & Status Bar

- **Status bar** — Live test WPM, coding WPM, and rank badge
- **Sidebar panel** — Profile card, top 10 leaderboard, badge showcase

---

## Getting Started

### Install from Marketplace

1. Open VS Code → Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
2. Search **TypeRank**
3. Click **Install**

### Quick Start

1. Open command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run **TypeRank: Start Typing Test**
3. Pick your mode and duration — the timer starts on your first keystroke

---

## Commands

| Command | Description |
|---------|-------------|
| `TypeRank: Start Typing Test` | Open the typing test |
| `TypeRank: Show Profile` | Open the sidebar panel |
| `TypeRank: Reset All Data` | Clear all scores, badges, and history |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Any character | Start the test |
| `Space` | Next word |
| `Backspace` | Delete last character |
| `Escape` | Cancel test |

---

## Theme Support

TypeRank adapts to your VS Code theme automatically — dark, light, and high-contrast themes all supported.

---

## License

MIT © [Harshil Chudasam](https://github.com/iamharshil)
