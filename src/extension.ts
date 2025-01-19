import * as vscode from 'vscode';
import { exec, ChildProcess } from 'child_process';

// Define an enum for feedback capture options to enforce strict typing
enum FeedbackSource {
    Stdout = "stdout",
    Stderr = "stderr",
    Both = "both"
}

// Function to trigger the Composer prompt instead of using osascript
async function sendToCursorChat(cursorCommand: string, errorMessage: string) {
    try {
        // First copy the message to clipboard
        await vscode.env.clipboard.writeText(errorMessage);
        
        // Then open the composer
        await vscode.commands.executeCommand(cursorCommand);
        
        // Show instruction to user
        vscode.window.showInformationMessage('Message copied to clipboard. Please paste it into the composer.');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to send to Cursor: ${error}`);
    }
}

let runningProcess: ChildProcess | null = null;  // Keep track of the running process

function runCommandAndSendFeedback(cursorCommand: string, commandToRun: string, captureFeedbackFrom: string) {
    let accumulatedOutput = '';

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Running ${commandToRun}...`,
        cancellable: true
    }, async (progress, token) => {
        // Start progress reporting
        progress.report({ increment: 0, message: 'Initializing...' });

        // Kill any previous process if it's still running
        if (runningProcess) {
            runningProcess.kill();
        }

        return new Promise<void>((resolve) => {  // Only use resolve, no reject
            // Start the new process and store the reference
            runningProcess = exec(commandToRun, { cwd: vscode.workspace.rootPath });

            // Handle cancellation request
            token.onCancellationRequested(() => {
                if (runningProcess) {
                    runningProcess.kill();
                }
                resolve();  // Just resolve on cancel
            });

            // Handle stdout
            if (captureFeedbackFrom === FeedbackSource.Stdout || captureFeedbackFrom === FeedbackSource.Both) {
                runningProcess.stdout?.on('data', (data) => {
                    const output = `Output: ${data.toString()}`;
                    accumulatedOutput += output + '\n';
                    console.log(output);
                    progress.report({ increment: 50, message: 'Processing...' });
                });
            }

            // Handle stderr
            if (captureFeedbackFrom === FeedbackSource.Stderr || captureFeedbackFrom === FeedbackSource.Both) {
                runningProcess.stderr?.on('data', (data) => {
                    const error = `Error: ${data.toString()}`;
                    accumulatedOutput += error + '\n';
                    console.error(error);
                    progress.report({ increment: 70, message: 'Error encountered...' });
                });
            }

            // Handle process completion
            runningProcess.on('close', async (code) => {
                try {
                    if (accumulatedOutput) {
                        await sendToCursorChat(cursorCommand, accumulatedOutput);
                    }
                    
                    progress.report({ 
                        increment: 100, 
                        message: code === 0 ? 'Process completed successfully!' : `Process failed with code ${code}`
                    });
                } catch (error: any) {  // Type the error as any since we're using its message property
                    console.error('Error in process close handler:', error);
                    progress.report({ 
                        increment: 100, 
                        message: `Error handling output: ${error?.message || 'Unknown error'}`
                    });
                } finally {
                    resolve();
                }
            });

            // Handle process errors
            runningProcess.on('error', (error) => {
                console.error('Process error:', error);
                progress.report({ increment: 100, message: `Process error: ${error.message}` });
                resolve();
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
    const watchLanguages = config.get<string[]>('watchLanguages', ['javascript', 'typescript']);
    const watchExtensions = config.get<string[]>('watchExtensions', ['.js', '.ts', '.json']);

    // Create file watcher pattern from extensions
    const watchPattern = `**/*${watchExtensions.join('|**/*')}`;  // This will create "**/*.dfy" for your case
    const watcher = vscode.workspace.createFileSystemWatcher(watchPattern);
    
    vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
        // Add debug logging
        console.log(`File saved: ${document.fileName}, Language ID: ${document.languageId}`);
        
        // Check if the file matches our watched languages or extensions
        if (watchLanguages.includes(document.languageId) || 
            watchExtensions.some(ext => document.fileName.endsWith(ext))) {
            vscode.window.showInformationMessage(`File ${document.fileName} was saved.`);
            runCommandAndSendFeedback(cursorCommand!, commandToRun!, captureFeedbackFrom!);
        }
    });

    // Trigger when files change
    watcher.onDidChange((uri) => {
        console.log(`File changed: ${uri.fsPath}`);
        if (watchExtensions.some(ext => uri.fsPath.endsWith(ext))) {
            vscode.window.showInformationMessage(`File ${uri.fsPath} changed.`);
            runCommandAndSendFeedback(cursorCommand, commandToRun!, captureFeedbackFrom!);
        }
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
