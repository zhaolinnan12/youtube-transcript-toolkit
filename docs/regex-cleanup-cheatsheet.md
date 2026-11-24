# YouTube Transcript Regex Cleanup Cheatsheet

Tested Find & Replace patterns for stripping timestamps and rejoining broken 2–4 second caption lines in VS Code, Notepad++, Obsidian, and Google Docs.

## Quick Reference Table

| Source Format | Find (Regex) | Replace With | Notes |
| --- | --- | --- | --- |
| YouTube Panel (standalone lines) | `^\s*\d{1,2}:\d{2}(?::\d{2})?\s*$\n?` | *(empty)* | Removes standalone `0:05` and `1:24:09` lines plus trailing newline |
| Inline bracketed timestamps | `\[\d{1,2}:\d{2}(?::\d{2})?\]\s*` | *(empty)* | Removes `[04:18] ` or `[1:02:11] ` prefixes |
| SubRip (`.srt`) cue blocks | `^\d+\r?\n\d{2}:\d{2}:\d{2},\d{3}\s-->\s\d{2}:\d{2}:\d{2},\d{3}.*$` | *(empty)* | Strips cue indices and SubRip timing ranges |
| WebVTT (`.vtt`) timing lines | `^\d{2}:\d{2}:\d{2}\.\d{3}\s-->\s\d{2}:\d{2}:\d{2}\.\d{3}.*$` | *(empty)* | Strips WebVTT timing ranges and cue settings |
| WebVTT inline `<c>` tags | `</?(?:c\|v\|b\|i\|u)(?:[^>]*)>` | *(empty)* | Removes rolling auto-caption markup from `yt-dlp` VTT files |
| Broken caption newlines (Pass 2) | `\r?\n+` | ` ` *(single space)* | Joins short fragments into continuous readable prose |

## VS Code Two-Pass Recipe

1. Open Find & Replace (`Ctrl+H` on Windows/Linux, `Cmd+Option+F` on macOS) and enable Regex (`.*`).
2. **Pass 1** — Find: `^\s*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*\n?` | Replace: *(empty)* -> Replace All.
3. **Pass 2** — Find: `\r?\n+` | Replace: ` ` *(one space)* -> Replace All.

## Google Docs Two-Pass Recipe

1. Open **Edit > Find and replace** (`Ctrl+H` / `Cmd+Shift+H`) and check **Use regular expressions**.
2. **Pass 1** — Find: `^\s*\d{1,2}:\d{2}(?::\d{2})?\s*$` | Replace: *(empty)* -> Replace All.
3. **Pass 2** — Find: `\n+` | Replace: ` ` *(one space)* -> Replace All.
