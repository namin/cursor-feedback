# cursor-feedback VSCode extension

Use the Cursor Feedback VSCode extension to automatically run a command, such as `npm start`, and feed any errors to the Cursor chat window.

## Features

The command to run and the captured ports are configurable through setting variables.

The command is deemed successfully if it hangs, as would happen when starting a server.

For now, the extension hard codes forwarding any errors to the Cursor chat window.

## Requirements

For now, this extension is expected to run in Cursor only, not VSCode.

## Extension Settings

This extension contributes the following settings:

* `cursor-feedback.runCommand`: The command to run, defaults to `npm start`.
* `cursor-feedback.captureFeedbackFrom`: Set port to capture feedback from, defaults to `stderr`.

## Known Issues

No known issues at the moment.

## Release Notes

### 1.0.0

Initial release.

