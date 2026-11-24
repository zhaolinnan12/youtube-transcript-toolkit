# SRT vs WebVTT Subtitle Validation Checklist

Use this checklist before importing subtitle files into NLEs (Premiere Pro, DaVinci Resolve, CapCut) or HTML5 `<track>` elements.

## SubRip (`.srt`) Checklist

- [ ] No `WEBVTT` header at the top of the file.
- [ ] Sequential 1-based integer cue numbers (`1`, `2`, `3`, ...).
- [ ] Millisecond separator is a **comma** (`,`), e.g. `00:00:03,120 --> 00:00:06,480`.
- [ ] Every cue has `endMs > startMs`.
- [ ] Cues are separated by a single blank line (`\n\n`) and UTF-8 encoded.

## WebVTT (`.vtt`) Checklist

- [ ] File begins with `WEBVTT` followed by a blank line (`\n\n`).
- [ ] Millisecond separator is a **period** (`.`), e.g. `00:00:03.120 --> 00:00:06.480`.
- [ ] Rolling auto-caption inline `<c>` / `<00:00:00.000>` tags are stripped if clean static captions are needed.
- [ ] Adjacent duplicate cues (common in `yt-dlp --write-auto-subs`) are deduplicated.
- [ ] Served with `Content-Type: text/vtt; charset=utf-8` on web servers.
