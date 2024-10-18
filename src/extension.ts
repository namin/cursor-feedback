import * as vscode from 'vscode';
import { exec } from 'child_process';

// Define an enum for feedback capture options to enforce strict typing
enum FeedbackSource {
    Stdout = "stdout",
    Stderr = "stderr",
    Both = "both"
}

// Function to send error to Cursor chat window using osascript (macOS)
function sendToCursorChat(errorMessage: string) {
    const safeMessage = errorMessage.replace(/'/g, "\\'").replace(/\n/g, ' '); // Escape single quotes and remove newlines
    
    // Trigger Cmd-K to open the Cursor chat window
    exec(`osascript -e 'tell application "System Events" to keystroke "k" using {command down}'`, (error) => {
        if (error) {
            vscode.window.showErrorMessage("Error triggering Cmd-K: " + error.message);
        } else {
            // Send the error message after a short delay to ensure the chat window is open
            setTimeout(() => {
                exec(`osascript -e 'tell application "System Events" to keystroke "${safeMessage}"'`, (err) => {
                    if (err) {
                        vscode.window.showErrorMessage("Error sending message: " + err.message);
                    } else {
                        exec(`osascript -e 'tell application "System Events" to keystroke return'`);
                    }
                });
            }, 500);  // Adjust delay if necessary
        }
    });
}

function runCommandAndSendFeedback(commandToRun: string, captureFeedbackFrom: string) {
	vscode.window.showInformationMessage(`Running ${commandToRun}...`);

	// Run the user-specified command
	const process = exec(commandToRun, { cwd: vscode.workspace.rootPath });

	// Capture feedback from stdout or stderr based on user's configuration
	if (captureFeedbackFrom === FeedbackSource.Stdout || captureFeedbackFrom === FeedbackSource.Both) {
		process.stdout?.on('data', (data) => {
			vscode.window.showInformationMessage(`Output: ${data}`);
		});
	}

	if (captureFeedbackFrom === FeedbackSource.Stderr || captureFeedbackFrom === FeedbackSource.Both) {
		process.stderr?.on('data', (data) => {
			vscode.window.showErrorMessage(`Error: ${data}`);
			sendToCursorChat(data.toString());  // Send error to Cursor chat
		});
	}

	// Handle process termination
	process.on('close', (code) => {
		if (code !== 0) {
			vscode.window.showErrorMessage(`${commandToRun} exited with code ${code}`);
			sendToCursorChat(`Process terminated unexpectedly with exit code ${code}`);
		} else {
			vscode.window.showInformationMessage(`${commandToRun} completed successfully.`);
		}
	});
}

export function activate(context: vscode.ExtensionContext) {
    // Read the configuration settings from user's settings.json
    const config = vscode.workspace.getConfiguration('cursor-feedback');
    const commandToRun = config.get('runCommand', 'npm start');  // Default to "npm start"
    const captureFeedbackFrom = config.get<FeedbackSource>('captureFeedbackFrom', FeedbackSource.Stderr);  // Default to "stderr"

    // Watch for file changes in the workspace for specific file types
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.{js,ts,json}');
    
    // Trigger when files change
    watcher.onDidChange((uri) => {
        vscode.window.showInformationMessage(`File ${uri.fsPath} changed.`);
		runCommandAndSendFeedback(commandToRun!, captureFeedbackFrom!);
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
        runCommandAndSendFeedback(commandToRun!, captureFeedbackFrom!);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
    // Clean up any resources or subscriptions when the extension is deactivated
}
