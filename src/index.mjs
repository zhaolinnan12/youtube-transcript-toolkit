const ALLOWED_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function extractYouTubeVideoId(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return null;

  let id = null;
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const seg = parsed.pathname.split('/').filter(Boolean)[0];
    id = seg || null;
  } else if (parsed.pathname === '/watch') {
    id = parsed.searchParams.get('v');
  } else {
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && ['shorts', 'embed', 'live', 'v'].includes(parts[0])) {
      id = parts[1];
    }
  }
  return id && VIDEO_ID_RE.test(id) ? id : null;
}

function pad(num, size = 2) {
  return String(Math.max(0, Math.floor(num))).padStart(size, '0');
}

export function formatDisplayTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatSubtitleTime(ms, separator) {
  const safeMs = Math.max(0, Math.round(ms));
  const hours = Math.floor(safeMs / 3600000);
  const minutes = Math.floor((safeMs % 3600000) / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const millis = safeMs % 1000;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${separator}${pad(millis, 3)}`;
}

function parseTimestampToMs(raw) {
  const normalized = String(raw).trim().replace(',', '.');
  const parts = normalized.split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  let hours = 0;
  let minutes = 0;
  let secPart = '0';
  if (parts.length === 3) {
    hours = Number(parts[0]);
    minutes = Number(parts[1]);
    secPart = parts[2];
  } else {
    minutes = Number(parts[0]);
    secPart = parts[1];
  }
  const seconds = Number(secPart);
  if (![hours, minutes, seconds].every(Number.isFinite)) return null;
  return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

export function parseJson3Captions(payload) {
  const events = Array.isArray(payload?.events) ? payload.events : [];
  const segments = [];
  for (const ev of events) {
    if (!Array.isArray(ev?.segs) || typeof ev.tStartMs !== 'number') continue;
    const text = ev.segs
      .map((seg) => (typeof seg?.utf8 === 'string' ? seg.utf8 : ''))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;
    const startMs = Math.max(0, Math.round(ev.tStartMs));
    const durationMs = typeof ev.dDurationMs === 'number' && ev.dDurationMs > 0 ? Math.round(ev.dDurationMs) : 2500;
    segments.push({ startMs, endMs: startMs + durationMs, text });
  }
  return segments;
}

export function parseTimedSubtitles(rawText) {
  const cleaned = String(rawText || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const blocks = cleaned.split(/\n{2,}/);
  const segments = [];
  const timingRe = /^(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3})\s+-->\s+(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3})/;

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length || lines[0].startsWith('WEBVTT') || lines[0].startsWith('NOTE')) continue;

    let timingIndex = lines.findIndex((line) => timingRe.test(line));
    if (timingIndex === -1) continue;

    const match = lines[timingIndex].match(timingRe);
    const startMs = parseTimestampToMs(match[1]);
    const endMs = parseTimestampToMs(match[2]);
    if (startMs === null || endMs === null) continue;

    const text = lines
      .slice(timingIndex + 1)
      .join(' ')
      .replace(/<\/?(?:c|v|b|i|u)(?:[^>]*)>/g, '')
      .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) continue;
    // Deduplicate adjacent identical rolling-caption lines from yt-dlp VTT output.
    if (segments.length > 0 && segments[segments.length - 1].text === text) {
      segments[segments.length - 1].endMs = Math.max(segments[segments.length - 1].endMs, endMs);
      continue;
    }
    segments.push({ startMs, endMs, text });
  }
  return segments;
}

export function stripTimestamps(rawText, { joinLines = true } = {}) {
  let out = String(rawText || '').replace(/^\uFEFF/, '');
  out = out.replace(/^WEBVTT[^\n]*\n?/im, '');
  out = out.replace(/^\d+\r?\n\d{2}:\d{2}:\d{2},\d{3}\s-->\s\d{2}:\d{2}:\d{2},\d{3}.*$/gm, '');
  out = out.replace(/^\d{2}:\d{2}:\d{2}\.\d{3}\s-->\s\d{2}:\d{2}:\d{2}\.\d{3}.*$/gm, '');
  out = out.replace(/<\/?(?:c|v|b|i|u)(?:[^>]*)>/g, '');
  out = out.replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, '');
  out = out.replace(/^\s*\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*$/gm, '');
  out = out.replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]\s*/g, '');
  if (joinLines) {
    out = out.replace(/\r?\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  } else {
    out = out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');
  }
  return out;
}

function resolveEndMs(segments, index) {
  const seg = segments[index];
  if (Number.isFinite(seg.endMs) && seg.endMs > seg.startMs) return seg.endMs;
  const next = segments[index + 1];
  if (next && next.startMs > seg.startMs) return next.startMs;
  return seg.startMs + 2500;
}

export function formatSRT(payload) {
  const segments = payload.segments || [];
  return (
    segments
      .map((seg, idx) => {
        const start = formatSubtitleTime(seg.startMs, ',');
        const end = formatSubtitleTime(resolveEndMs(segments, idx), ',');
        return `${idx + 1}\n${start} --> ${end}\n${seg.text}`;
      })
      .join('\n\n') + '\n'
  );
}

export function formatVTT(payload) {
  const segments = payload.segments || [];
  const body = segments
    .map((seg, idx) => {
      const start = formatSubtitleTime(seg.startMs, '.');
      const end = formatSubtitleTime(resolveEndMs(segments, idx), '.');
      return `${start} --> ${end}\n${seg.text}`;
    })
    .join('\n\n');
  return `WEBVTT\n\n${body}\n`;
}

export function formatTXT(payload, options = {}) {
  const includeTimestamps = options.includeTimestamps !== false;
  const joinLines = options.joinLines === true;
  const segments = payload.segments || [];
  if (!includeTimestamps && joinLines) {
    return (
      segments
        .map((seg) => seg.text.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s{2,}/g, ' ') + '\n'
    );
  }
  return (
    segments
      .map((seg) => (includeTimestamps ? `[${formatDisplayTime(seg.startMs)}] ${seg.text}` : seg.text))
      .join('\n') + '\n'
  );
}

function yamlQuote(val) {
  return `"${String(val || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ')}"`;
}

export function formatMarkdown(payload, options = {}) {
  const includeTimestamps = options.includeTimestamps !== false;
  const includeFrontmatter = options.includeFrontmatter === true;
  const title = payload.title || (payload.videoId ? `YouTube Transcript (${payload.videoId})` : 'YouTube Transcript');
  const url = payload.url || (payload.videoId ? `https://www.youtube.com/watch?v=${payload.videoId}` : '');
  const metaLines = [];
  if (includeFrontmatter) {
    metaLines.push('---');
    metaLines.push(`title: ${yamlQuote(title)}`);
    if (url) metaLines.push(`source: ${yamlQuote(url)}`);
    if (payload.author) metaLines.push(`channel: ${yamlQuote(payload.author)}`);
    if (payload.language) metaLines.push(`language: ${yamlQuote(payload.language)}`);
    if (payload.videoId) metaLines.push(`video_id: ${yamlQuote(payload.videoId)}`);
    metaLines.push('tags:');
    metaLines.push('  - youtube-transcript');
    metaLines.push('---', '');
  }
  metaLines.push(`# ${title}`, '');
  if (url) metaLines.push(`- Source: ${url}`);
  if (payload.author) metaLines.push(`- Channel: ${payload.author}`);
  if (payload.language) metaLines.push(`- Language: ${payload.language}`);
  metaLines.push('', '## Transcript', '');
  const body = (payload.segments || []).map((seg) =>
    includeTimestamps ? `- **[${formatDisplayTime(seg.startMs)}]** ${seg.text}` : `- ${seg.text}`,
  );
  return `${metaLines.join('\n')}${body.join('\n')}\n`;
}
