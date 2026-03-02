# Contributing to TypeRank

## Development Setup

```bash
# Clone and install
git clone https://github.com/your-username/type-rank.git
cd type-rank
npm install

# Compile TypeScript
npm run compile

# Or watch mode (auto-recompile on save)
npm run watch
```

## Running the Extension

1. Open the `type-rank` folder in VS Code
2. Press **F5** → launches the Extension Development Host
3. In the new window, test commands via the command palette (`Cmd+Shift+P`)

## Project Architecture

### Core Flow

```
User triggers command → extension.ts
  ├── startTest → TypingTestPanel (webview)
  │     ├── Loads words from wordGenerator
  │     ├── Runs typing test in HTML/JS
  │     ├── On complete: sends keystroke data back
  │     ├── antiCheat.ts analyzes keystrokes
  │     ├── statsCalculator.ts computes WPM/accuracy
  │     ├── storageService.ts saves results
  │     ├── badgeEvaluator.ts checks for new badges
  │     ├── statusBar.ts updates status bar
  │     └── sidebarProvider.ts refreshes sidebar
  └── showProfile → Focus sidebar panel
```

### Key Files

| File | Purpose |
|------|---------|
| `src/extension.ts` | Entry point, command registration |
| `src/storageService.ts` | All persistence via `globalState` |
| `src/statusBar.ts` | Status bar items (WPM, rank) |
| `src/engine/wordGenerator.ts` | Word lists and generation |
| `src/engine/statsCalculator.ts` | WPM, accuracy, consistency formulas |
| `src/engine/antiCheat.ts` | Bot detection heuristics |
| `src/badges/badgeDefinitions.ts` | Badge and rank definitions |
| `src/badges/badgeEvaluator.ts` | Badge condition checking |
| `src/webview/typingTestPanel.ts` | Typing test webview host |
| `src/webview/sidebarProvider.ts` | Sidebar webview host |
| `media/typingTest.js` | Client-side typing test logic |
| `media/typingTest.css` | Typing test styles |
| `media/sidebar.js` | Client-side sidebar logic |
| `media/sidebar.css` | Sidebar styles |

### Adding New Features

#### New Word Mode
1. Add word array in `src/engine/wordGenerator.ts`
2. Add mode to the `WordMode` type
3. Update `generateWords()` with a new case
4. Add button in `typingTestPanel.ts` HTML (config bar)

#### New Badge
1. Add definition in `src/badges/badgeDefinitions.ts`
2. Add evaluation logic in `src/badges/badgeEvaluator.ts` → `evaluate()`
3. Badge icon will render automatically in sidebar and results

#### New Anti-Cheat Check
1. Add detection logic in `src/engine/antiCheat.ts` → `analyzeKeystrokes()`
2. Add a flag string (e.g., `'MY_NEW_CHECK'`)
3. Adjust `suspicionScore` increment

### Styling Guidelines

- All webview styles use **VS Code CSS custom properties** (`--vscode-*`)
- This ensures automatic theme compatibility (dark/light/high-contrast)
- Never hardcode colors — always reference theme tokens
- Use the `var(--vscode-editor-background)` pattern

### Data Storage

All data is stored in `vscode.ExtensionContext.globalState`:

| Key | Type | Description |
|-----|------|-------------|
| `typerank.testHistory` | `TestResult[]` | Last 100 test results |
| `typerank.earnedBadges` | `Badge[]` | Earned badges list |
| `typerank.sessionStreak` | `number` | Tests in current session |
| `typerank.displayName` | `string` | User's display name |

### Packaging

```bash
# Install vsce if needed
npm install -g @vscode/vsce

# Package the extension
npx @vscode/vsce package

# This creates type-rank-0.1.0.vsix
```

### Code Style

- TypeScript strict mode enabled
- Use `async/await` for all `globalState` operations
- Keep webview JS as vanilla — no frameworks
- All message passing uses typed command strings

## Troubleshooting

### Extension not activating?
- Check `package.json` → `activationEvents` and `contributes.commands`
- Check the "TypeRank" output channel in VS Code developer tools

### Webview blank?
- Check Content Security Policy in the HTML template
- Ensure `localResourceRoots` includes the `media/` directory
- Check browser dev tools in the webview (`Cmd+Shift+I`)

### Data not persisting?
- `globalState` persists across sessions automatically
- Use `TypeRank: Reset All Data` command to clear if corrupted
