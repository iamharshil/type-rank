<p align="center">
  <img src="media/icon.png" width="128" height="128" alt="TypeRank Icon" />
</p>

<h1 align="center">⚡ TypeRank</h1>

<p align="center">
  <strong>A Monkeytype-inspired typing test — right inside VS Code</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/engine-VS%20Code%201.85%2B-purple?style=flat-square" alt="VS Code" />
  <img src="https://img.shields.io/badge/lang-TypeScript-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/anti--cheat-enabled-red?style=flat-square" alt="Anti-Cheat" />
</p>

---

## 🎯 What is TypeRank?

TypeRank is a **competitive typing test extension** for VS Code that measures your typing speed, awards badges, tracks your progress, and keeps you cheat-free — all without leaving your editor.

Whether you're warming up before a coding session or competing with yourself to hit 150+ WPM, TypeRank turns your editor into a typing arena.

---

## ✨ Features

### ⌨️ Typing Test
- **3 modes**: Common words · Programming keywords · Quotes
- **4 durations**: 15s · 30s · 60s · 120s
- Real-time **WPM** and **accuracy** tracking
- Beautiful **WPM-over-time chart** on the results screen
- Minimalist, distraction-free Monkeytype-inspired UI

### 🏆 Rank System

Climb through 6 competitive tiers based on your average WPM:

| Rank | WPM Range | Badge |
|------|-----------|-------|
| Bronze Typer | 0–30 | 🥉 |
| Silver Typer | 31–50 | 🥈 |
| Gold Typer | 51–75 | 🥇 |
| Diamond Typer | 76–100 | 💎 |
| Master Typer | 101–130 | 👑 |
| Legendary Typer | 131+ | ⚡ |

### 🎖️ Achievement Badges

Unlock achievements to prove your skills:

| Badge | Condition |
|-------|-----------|
| 🎯 **First Strike** | Complete your first test |
| 🔥 **On Fire** | 5 tests in one session |
| 🎯 **Sharpshooter** | 100% accuracy on a 30s+ test |
| 🚀 **Speed Demon** | Hit 100+ WPM |
| 🏔️ **Summit** | Hit 150+ WPM |
| 📈 **Consistent** | 90%+ consistency over 10 tests |
| 🛡️ **Anti-Cheat Verified** | 50 clean tests |
| 🗓️ **Daily Grinder** | Test 7 consecutive days |

### 🛡️ Anti-Cheat Protection

TypeRank includes a multi-layered anti-cheat engine:

- **Paste detection** — Clipboard paste is completely blocked
- **Keystroke analysis** — Detects uniform bot-like typing patterns
- **Key hold duration** — Flags impossibly fast keypresses (< 5ms)
- **Burst speed detection** — Catches superhuman 5-char typing bursts
- **Focus monitoring** — Pauses or invalidates on extended tab switching
- **Robotic rhythm detection** — Identifies identical interval patterns

Suspicious results are flagged and marked **unranked**.

### 📊 Passive Coding Tracker

TypeRank tracks your **real coding speed** passively as you type in any file:
- Rolling WPM calculated from editor keystrokes (paste/autocomplete filtered out)
- Accuracy estimated from backspace ratio
- XP awarded every 60 seconds of active coding
- Coding avg WPM shown in the sidebar alongside test stats

### 📊 Dual WPM Status Bar

Your typing stats live in the VS Code status bar:
- **⌨️ Test WPM** — Your average typing test speed. Click to start a test.
- **$(code) Coding WPM** — Your live/average coding speed (passive).
- **🥇 Rank | Lv.** — Your rank badge and level. Click to view profile.

### 📋 Sidebar Panel

Click the **TypeRank** icon in the activity bar to see:
- **Profile card** — Current rank, best WPM, average WPM, total tests
- **Personal leaderboard** — Top 10 scores sorted by WPM
- **Badge showcase** — All badges with earned/locked status

---

## 🚀 Getting Started

### Install

1. Open VS Code
2. Press `Cmd+Shift+X` (macOS) or `Ctrl+Shift+X` (Windows/Linux)
3. Search for **TypeRank**
4. Click **Install**

### Or install from VSIX

```bash
code --install-extension type-rank-0.1.0.vsix
```

### Quick Start

1. Open the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type **"TypeRank: Start Typing Test"**
3. Choose your duration and mode
4. Start typing — the timer begins on your first keystroke!

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Any character | Start the test (first keystroke) |
| `Space` | Move to next word |
| `Backspace` | Delete last character |
| `Escape` | Cancel current test |
| `Tab` | Blocked (prevents focus loss) |

---

## 🎨 Theme Support

TypeRank automatically adapts to your VS Code theme using CSS custom properties. It looks great in:
- ✅ Dark themes (default, One Dark Pro, GitHub Dark, etc.)
- ✅ Light themes (GitHub Light, Quiet Light, etc.)
- ✅ High contrast themes

---

## 📟 Commands

| Command | Description |
|---------|-------------|
| `TypeRank: Start Typing Test` | Open the typing test panel |
| `TypeRank: Show Profile` | Focus the sidebar panel |
| `TypeRank: Reset All Data` | Clear all scores, badges, and history |

---

## 🏗️ Development

### Prerequisites

- Node.js 18+
- VS Code 1.85+

### Setup

```bash
git clone https://github.com/your-username/type-rank.git
cd type-rank
npm install
npm run compile
```

### Run in Dev Mode

1. Open the project in VS Code
2. Press `F5` to launch the Extension Development Host
3. Test the extension in the new VS Code window

### Build VSIX

```bash
npx @vscode/vsce package
```

---

## 📁 Project Structure

```
type-rank/
├── src/
│   ├── extension.ts              # Entry point — registers commands & providers
│   ├── storageService.ts         # Persistence layer (VS Code globalState)
│   ├── codingTracker.ts          # Passive editor keystroke monitor
│   ├── statusBar.ts              # Dual WPM + rank display
│   ├── engine/
│   │   ├── wordGenerator.ts      # Word lists (common/code/quotes)
│   │   ├── statsCalculator.ts    # WPM, accuracy, consistency math
│   │   └── antiCheat.ts          # Multi-layered bot detection
│   ├── badges/
│   │   ├── badgeDefinitions.ts   # Rank tiers + achievement definitions
│   │   └── badgeEvaluator.ts     # Evaluates badge conditions
│   └── webview/
│       ├── typingTestPanel.ts    # Typing test webview host
│       └── sidebarProvider.ts    # Sidebar webview host
├── media/
│   ├── typingTest.css/js         # Typing test UI
│   ├── sidebar.css/js            # Sidebar UI
│   ├── icon.png                  # Extension marketplace icon
│   └── icon.svg                  # Activity bar icon
├── package.json
├── tsconfig.json
├── CONTRIBUTING.md               # Development guide
├── CHANGELOG.md                  # Version history
└── README.md                     # This file
```

---

## 📄 License

MIT © TypeRank
