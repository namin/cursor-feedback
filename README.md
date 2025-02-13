# cursor-feedback VSCode extension

Use the Cursor Feedback VSCode extension to automatically run a command, such as `npm start`, and feed any errors to the Cursor chat window.

## Features

The command to run and the captured ports are configurable through user setting variables `cursor-feedback.runCommand` (anything; defaults to `npm start`) and `cursor-feedback.captureFeedbackFrom` (one of `stdout`, `stderr`, `both`; default to `stderr`).

The command is deemed successfully if it hangs, as would happen when starting a server.
The server is kept running, but the started process will be killed as needed at the next invocation of the feedback routine.

The IDE command to trigger is also configurable. By default, it is set to the `composer.startComposerPrompt`, which is a Cursor-specific feature.
The IDE command is only triggered if an error is detected.
Due to programmability limitations, the error message is copied to the clipboard, and the user is left to manually paste it in the IDE.

Automatic triggering happens when a file of a watched language or extension is saved. Manual triggering can be done with `Cmd-Shift-P` and typing `Trigger Cursor Feedback Manually`. 

## Requirements

This extension is expected to run in Cursor, but if the IDE command to trigger is changed, it could run in VSCode as well.
The extension should work in any VSCode derivative on any operating system.

## Extension Settings

This extension contributes the following settings:

* `cursor-feedback.runCommand`: The command-line command to run, defaults to `npm start`.
* `cursor-feedback.captureFeedbackFrom`: The port(s) to capture feedback from, defaults to `stderr`.
* `cursor-feedback.cursorCommand`: The IDE command to run on error, defaults to `composer.startComposerPrompt`.
* `cursor-feedback.watchLanguages`: The languages to watch for, defaults to `["javascript", "typescript"]`.
* `cursor-feedback.watchExtensions`: The file extensions to watch for, defaults to `[".js", ".ts", ".json"]`.

You can add these in the `settings.json` file, which you can find by running `Cmd-Shift-P` and typing `Preferences: Open Settings (JSON)`.
To recap the default settings:
```
    "cursor-feedback.runCommand": "npm start",
    "cursor-feedback.captureFeedbackFrom": "stderr",
    "cursor-feedback.cursorCommand": "composer.startComposerPrompt"
    "cursor-feedback.watchLanguages": ["javascript", "typescript"],
    "cursor-feedback.watchExtensions": [".js", ".ts", ".json"]
```

## Known Issues

No known issues at the moment.

## Release Notes

### 1.0.2

Update the defaults, and expand settings to support broader feedback. Tested on Dafny support.

### 1.0.1

The extension is no longer macOS-specific, and is safer, relying only on the VSCode Extension API.

While the motivation for it is still Cursor-specific, the settings support additional VSCode use cases, besides Cursor.

The started command-line process is automatically killed at the next invocation, as needed,
alleviating any process management on the client side.

### 1.0.0

Initial release.
The extension was macOS-specific, because apple script was used to trigger the Cursor chat window and paste the error in it. This approach was brittle; for example, if the focused app wasn't Cursor anymore.


