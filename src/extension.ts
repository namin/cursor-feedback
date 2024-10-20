import * as vscode from 'vscode';
import { exec, ChildProcess } from 'child_process';

// Define an enum for feedback capture options to enforce strict typing
enum FeedbackSource {
    Stdout = "stdout",
    Stderr = "stderr",
    Both = "both"
}

// Function to trigger the Composer prompt instead of using osascript
function sendToCursorChat(cursorCommand: string, errorMessage: string) {
    vscode.commands.executeCommand(cursorCommand)
        .then(() => {
            const safeMessage = errorMessage.replace(/'/g, "\\'").replace(/\n/g, ' '); // Escape single quotes and remove newlines
            vscode.env.clipboard.writeText(safeMessage).then(() => {
                vscode.window.showInformationMessage('Message copied to clipboard. Paste it.');
            });
        }, (error) => {
        });
}

let runningProcess: ChildProcess | null = null;  // Keep track of the running process

function runCommandAndSendFeedback(cursorCommand: string, commandToRun: string, captureFeedbackFrom: string) {
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Running ${commandToRun}...`,
        cancellable: true
    }, (progress, token) => {
        return new Promise<void>((resolve, reject) => {
            // Start progress reporting
            progress.report({ increment: 0, message: 'Initializing...' });

            // Kill any previous process if it's still running
            if (runningProcess) {
                runningProcess.kill();
            }

            // Start the new process and store the reference
            runningProcess = exec(commandToRun, { cwd: vscode.workspace.rootPath });

            // Handle cancellation request from the user (no reporting of cancellation)
            token.onCancellationRequested(() => {
                if (runningProcess) {
                    runningProcess.kill();  // Terminate the process if the user cancels
                }
                reject(new Error("Process canceled by user"));
            });

            // Capture feedback from stdout or stderr based on the user's configuration
            if (captureFeedbackFrom === FeedbackSource.Stdout || captureFeedbackFrom === FeedbackSource.Both) {
                runningProcess.stdout?.on('data', (data) => {
                    vscode.window.showInformationMessage(`Output: ${data}`);
                    sendToCursorChat(cursorCommand, `Output: ${data.toString()}`);
                    progress.report({ increment: 50, message: 'Processing...' });
                });
            }

            if (captureFeedbackFrom === FeedbackSource.Stderr || captureFeedbackFrom === FeedbackSource.Both) {
                runningProcess.stderr?.on('data', (data) => {
                    vscode.window.showErrorMessage(`Error: ${data}`);
                    sendToCursorChat(cursorCommand, `Error: ${data.toString()}`);
                    progress.report({ increment: 70, message: 'Error encountered, check the terminal...' });
                });
            }

            setTimeout(() => {
                resolve();
            }, 5000);

            // Handle process termination
            runningProcess.on('close', (code) => {
                if (code !== 0) {
                    progress.report({ increment: 100, message: `Process failed with code ${code}` });
                    reject(new Error(`Process exited with code ${code}`));
                } else {
                    progress.report({ increment: 100, message: 'Process completed successfully!' });;
                    resolve();
                }
            });
        });
    });
}

export function activate(context: vscode.ExtensionContext) {
    // Read the configuration settings from user's settings.json
    const config = vscode.workspace.getConfiguration('cursor-feedback');
    const commandToRun = config.get('runCommand', 'npm start');
    const captureFeedbackFrom = config.get<FeedbackSource>('captureFeedbackFrom', FeedbackSource.Stderr);
    const cursorCommand = config.get('cursorCommand', 'composer.startComposerPrompt');

    // Watch for file changes in the workspace for specific file types
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.{js,ts,json}');
    
    vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
        if (document.languageId === 'javascript' || document.languageId === 'typescript' || document.fileName.endsWith('.json')) {
            vscode.window.showInformationMessage(`File ${document.fileName} was saved.`);
            runCommandAndSendFeedback(cursorCommand!, commandToRun!, captureFeedbackFrom!);
        }
    });

    // Trigger when files change
    watcher.onDidChange((uri) => {
        vscode.window.showInformationMessage(`File ${uri.fsPath} changed.`);
		runCommandAndSendFeedback(cursorCommand, commandToRun!, captureFeedbackFrom!);
    });

    // Handle created or deleted files (optional, you can remove if unnecessary)
    watcher.onDidCreate((uri) => {
        vscode.window.showInformationMessage(`File ${uri.fsPath} created.`);
    });

    watcher.onDidDelete((uri) => {
        vscode.window.showInformationMessage(`File ${uri.fsPath} deleted.`);
    });

    context.subscriptions.push(watcher);

	let disposable = vscode.commands.registerCommand('cursorFeedback.triggerFeedback', () => {
        runCommandAndSendFeedback(cursorCommand, commandToRun!, captureFeedbackFrom!);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
    // Clean up any resources or subscriptions when the extension is deactivated
}
