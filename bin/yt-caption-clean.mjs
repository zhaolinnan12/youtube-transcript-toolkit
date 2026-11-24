#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import {
  formatMarkdown,
  formatSRT,
  formatTXT,
  formatVTT,
  parseJson3Captions,
  parseTimedSubtitles,
  stripTimestamps,
} from '../src/index.mjs';

function parseArgs(argv) {
  const opts = {
    input: null,
    format: 'txt',
    timestamps: true,
    join: false,
    obsidianYaml: false,
    title: '',
    url: '',
    channel: '',
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') opts.help = true;
    else if (arg === '--no-timestamps') opts.timestamps = false;
    else if (arg === '--join') opts.join = true;
    else if (arg === '--obsidian-yaml') opts.obsidianYaml = true;
    else if (arg === '-f' || arg === '--format') opts.format = String(argv[++i] || 'txt').toLowerCase();
    else if (arg === '--title') opts.title = String(argv[++i] || '');
    else if (arg === '--url') opts.url = String(argv[++i] || '');
    else if (arg === '--channel') opts.channel = String(argv[++i] || '');
    else if (!arg.startsWith('-') && !opts.input) opts.input = arg;
  }
  return opts;
}

function printHelp() {
  process.stdout.write(`yt-caption-clean — Clean and convert YouTube transcripts (.json3, .srt, .vtt, raw panel text)

Usage:
  yt-caption-clean <file> [options]
  cat raw-transcript.txt | yt-caption-clean [options]

Options:
  -f, --format <fmt>   Output format: txt | md | srt | vtt (default: txt)
  --no-timestamps      Omit timestamps in txt/md output
  --join               Join caption cues into continuous prose (with --no-timestamps)
  --obsidian-yaml      Include Obsidian YAML frontmatter (md format)
  --title <text>       Video title metadata (md format)
  --url <url>          Source video URL metadata (md format)
  --channel <name>     Channel name metadata (md format)
  -h, --help           Show this help message
`);
}

function readInput(filePath) {
  if (filePath) return readFileSync(filePath, 'utf8');
  return readFileSync(0, 'utf8');
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help) {
  printHelp();
  process.exit(0);
}

const raw = readInput(opts.input);
let segments = [];

if (raw.trim().startsWith('{')) {
  segments = parseJson3Captions(JSON.parse(raw));
} else if (/-->/.test(raw)) {
  segments = parseTimedSubtitles(raw);
}

if (segments.length === 0) {
  // Raw pasted YouTube panel transcript without full cue ranges.
  process.stdout.write(`${stripTimestamps(raw, { joinLines: opts.join || !opts.timestamps })}\n`);
  process.exit(0);
}

const payload = {
  title: opts.title || undefined,
  url: opts.url || undefined,
  author: opts.channel || undefined,
  segments,
};

if (opts.format === 'srt') {
  process.stdout.write(formatSRT(payload));
} else if (opts.format === 'vtt') {
  process.stdout.write(formatVTT(payload));
} else if (opts.format === 'md' || opts.format === 'markdown') {
  process.stdout.write(
    formatMarkdown(payload, {
      includeTimestamps: opts.timestamps,
      includeFrontmatter: opts.obsidianYaml,
    }),
  );
} else {
  process.stdout.write(
    formatTXT(payload, {
      includeTimestamps: opts.timestamps,
      joinLines: opts.join,
    }),
  );
}
