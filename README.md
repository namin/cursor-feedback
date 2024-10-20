# cursor-feedback VSCode extension

Use the Cursor Feedback VSCode extension to automatically run a command, such as `npm start`, and feed any errors to the Cursor chat window.

## Features

The command to run and the captured ports are configurable through setting variables `cursor-feedback.runCommand` (anything; defaults to `npm start`) and `cursor-feedback.captureFeedbackFrom` (one of `stdout`, `stderr`, `both`; default to `stderr`).

The command is deemed successfully if it hangs, as would happen when starting a server.
The server is kept running, but the started process will be killed as needed at the next invocation of the feedback routine.

The IDE command to trigger is also configurable. By default, it is set to the `composer.startComposerPrompt`, which is a Cursor-specific feature.
The IDE command is only triggered if an error is detected.
Due to programmability limitations, the error message is copied to the clipboard, and the user is left to manually paste it in the IDE.

## Requirements

This extension is expected to run in Cursor, but if the IDE command to trigger is changed, it could run in VSCode as well.
The extension should work in any VSCode derivative on any operating system.

## Extension Settings

This extension contributes the following settings:

* `cursor-feedback.runCommand`: The command-line command to run, defaults to `npm start`.
* `cursor-feedback.captureFeedbackFrom`: The port(s) to capture feedback from, defaults to `stderr`.
* `cursor-feedback.cursorCommand`: The IDE command to run on error, defaults to `composer.startComposerPrompt`.

## Known Issues

No known issues at the moment.

## Release Notes

### 1.0.1

The extension is no longer macOS-specific, and is safer, relying only on the VSCode Extension API.

While the motivation for it is still Cursor-specific, the settings support additional VSCode use cases, besides Cursor.

The started command-line process is automatically killed at the next invocation, as needed,
alleviating any process management on the client side.

### 1.0.0

Initial release.
The extension was macOS-specific, because apple script was used to trigger the Cursor chat window and paste the error in it. This approach was brittle; for example, if the focused app wasn't Cursor anymore.


