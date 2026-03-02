import * as vscode from 'vscode';
import { StorageService } from './storageService';
import { StatusBarManager } from './statusBar';
import { BadgeEvaluator } from './badges/badgeEvaluator';
import { TypingTestPanel } from './webview/typingTestPanel';
import { SidebarProvider } from './webview/sidebarProvider';
import { CodingTracker } from './codingTracker';

export function activate(context: vscode.ExtensionContext) {
    // Initialize core services
    const storage = new StorageService(context);
    const badgeEvaluator = new BadgeEvaluator(storage);
    const statusBar = new StatusBarManager(storage);
    const sidebarProvider = new SidebarProvider(context.extensionUri, storage);
    const codingTracker = new CodingTracker(storage, statusBar);

    // Register sidebar webview provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SidebarProvider.viewType,
            sidebarProvider
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('typerank.startTest', () => {
            TypingTestPanel.createOrShow(
                context.extensionUri,
                storage,
                badgeEvaluator,
                statusBar,
                sidebarProvider
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('typerank.showProfile', () => {
            vscode.commands.executeCommand('typerank.sidebarView.focus');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('typerank.resetData', async () => {
            const confirm = await vscode.window.showWarningMessage(
                'Reset all TypeRank data? This cannot be undone.',
                { modal: true },
                'Reset'
            );
            if (confirm === 'Reset') {
                await storage.clearAll();
                statusBar.refresh();
                sidebarProvider.refresh();
                vscode.window.showInformationMessage('TypeRank data has been reset.');
            }
        })
    );

    // Add services to disposables
    context.subscriptions.push({ dispose: () => statusBar.dispose() });
    context.subscriptions.push({ dispose: () => codingTracker.dispose() });

    console.log('TypeRank extension activated! 🎯');
}

export function deactivate() {
    // Cleanup handled by disposables
}
