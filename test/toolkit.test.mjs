import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  extractYouTubeVideoId,
  formatMarkdown,
  formatSRT,
  formatTXT,
  formatVTT,
  parseJson3Captions,
  parseTimedSubtitles,
  stripTimestamps,
} from '../src/index.mjs';

test('extractYouTubeVideoId handles watch, youtu.be, shorts, live, and embed URLs', () => {
  const urls = [
    'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    'https://youtu.be/jNQXAC9IVRw?si=test',
    'https://www.youtube.com/shorts/jNQXAC9IVRw',
    'https://www.youtube.com/live/jNQXAC9IVRw',
    'https://www.youtube.com/embed/jNQXAC9IVRw',
  ];
  for (const url of urls) {
    assert.equal(extractYouTubeVideoId(url), 'jNQXAC9IVRw');
  }
  assert.equal(extractYouTubeVideoId('https://vimeo.com/123456'), null);
});

test('parseJson3Captions and formatters produce valid SRT, VTT, TXT, and Obsidian Markdown', () => {
  const segments = parseJson3Captions({
    events: [
      { tStartMs: 1200, dDurationMs: 3150, segs: [{ utf8: 'Hello ' }, { utf8: 'world\n' }] },
      { tStartMs: 65000, dDurationMs: 3100, segs: [{ utf8: 'Second line.' }] },
    ],
  });
  const payload = {
    videoId: 'jNQXAC9IVRw',
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    title: 'Sample Video',
    author: 'Example Channel',
    language: 'en',
    segments,
  };

  assert.ok(formatSRT(payload).includes('1\n00:00:01,200 --> 00:00:04,350\nHello world'));
  assert.ok(formatVTT(payload).startsWith('WEBVTT\n\n00:00:01.200 --> 00:00:04.350\nHello world'));
  assert.equal(formatTXT(payload, { includeTimestamps: false, joinLines: true }), 'Hello world Second line.\n');

  const md = formatMarkdown(payload, { includeTimestamps: true, includeFrontmatter: true });
  assert.ok(md.startsWith('---\ntitle: "Sample Video"\n'));
  assert.ok(md.includes('- **[01:05]** Second line.'));
});

test('parseTimedSubtitles cleans yt-dlp rolling VTT inline tags and duplicate cues', () => {
  const vtt = `WEBVTT

00:00:01.000 --> 00:00:03.000
Hello <00:00:01.500><c>world</c>

00:00:03.000 --> 00:00:05.000
Hello world

00:00:05.000 --> 00:00:08.000
Next sentence
`;
  const parsed = parseTimedSubtitles(vtt);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].text, 'Hello world');
  assert.equal(parsed[0].endMs, 5000);
  assert.equal(parsed[1].text, 'Next sentence');
});

test('stripTimestamps cleans raw YouTube panel copies into continuous prose', () => {
  const raw = `0:00
when you copy from the panel
0:03
every three seconds breaks a sentence
1:04:12
across rows`;
  assert.equal(
    stripTimestamps(raw, { joinLines: true }),
    'when you copy from the panel every three seconds breaks a sentence across rows',
  );
});
