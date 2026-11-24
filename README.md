# youtube-transcript-toolkit

Zero-dependency Node.js library, CLI, CSV datasets, and Markdown reference checklists for cleaning and converting YouTube transcripts across `.json3`, `.srt`, `.vtt`, `.txt`, and Obsidian-ready `.md`.

## What Is Included

- **Node.js ESM Library (`src/index.mjs`)** — Parse YouTube `json3` caption payloads and `.srt`/`.vtt` files (including deduplicating rolling `yt-dlp` auto-captions and stripping inline `<c>` tags), extract YouTube video IDs across all URL formats (`watch`, `youtu.be`, `shorts`, `live`, `embed`), strip timestamps, and export valid SRT, WebVTT, TXT, or Markdown with Obsidian YAML frontmatter.
- **CLI (`bin/yt-caption-clean.mjs`)** — Clean raw pasted transcripts or convert subtitle files from stdin or disk with zero external dependencies.
- **Reference CSV Data (`data/`)**
  - [`data/subtitle-format-comparison.csv`](data/subtitle-format-comparison.csv) — Side-by-side specification table for SRT, WebVTT, Plain Text, and Markdown.
  - [`data/timestamp-overhead-benchmark.csv`](data/timestamp-overhead-benchmark.csv) — Measured character, line-break, and estimated token reduction (4 chars/token) when stripping timestamps across 5-, 30-, and 90-minute transcripts (~3.2s average cue length).
  - [`data/timestamp-cleanup-regex.csv`](data/timestamp-cleanup-regex.csv) — Tested Regex patterns for YouTube panel text, bracketed timecodes, SRT, WebVTT, and rolling `<c>` tags.
- **Markdown Checklists (`docs/`)**
  - [`docs/regex-cleanup-cheatsheet.md`](docs/regex-cleanup-cheatsheet.md) — Two-pass Find & Replace recipes for VS Code and Google Docs.
  - [`docs/obsidian-frontmatter-template.md`](docs/obsidian-frontmatter-template.md) — Obsidian YAML frontmatter schema for archived video transcripts.
  - [`docs/subtitle-format-spec-checklist.md`](docs/subtitle-format-spec-checklist.md) — Validation checklist for SRT and WebVTT files.

## Quick Start

Requires Node.js 18 or later (zero dependencies).

```bash
# Run the test suite
npm test

# Strip timestamps and join broken lines from a pasted YouTube transcript
cat raw-transcript.txt | node bin/yt-caption-clean.mjs --no-timestamps --join

# Convert a rolling yt-dlp .vtt file into Obsidian Markdown with YAML frontmatter
node bin/yt-caption-clean.mjs captions.en.vtt -f md --obsidian-yaml --title "Talk Title" --url "https://www.youtube.com/watch?v=jNQXAC9IVRw"

# Convert YouTube json3 captions to valid SubRip (.srt)
node bin/yt-caption-clean.mjs captions.json3 -f srt > captions.srt
```

## Library Usage

```js
import { parseTimedSubtitles, formatSRT, formatMarkdown, stripTimestamps } from './src/index.mjs';

const segments = parseTimedSubtitles(vttContent);
const srt = formatSRT({ segments });
const md = formatMarkdown(
  { title: 'Sample Talk', videoId: 'jNQXAC9IVRw', segments },
  { includeTimestamps: true, includeFrontmatter: true },
);
const cleanText = stripTimestamps(rawPanelCopy, { joinLines: true });
```

## Browser Version

For a browser-based version that reads public YouTube captions directly and exports SRT, VTT, TXT, or Markdown without local setup, see [CleanTranscript](https://cleantranscript.com/).

## License

MIT
