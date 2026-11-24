# Obsidian YAML Frontmatter Template for YouTube Transcripts

A consistent frontmatter schema for archiving YouTube transcripts in Obsidian, Notion, or Git-backed Markdown knowledge bases.

## Frontmatter Schema

```markdown
---
title: "Video Title"
source: "https://www.youtube.com/watch?v=VIDEO_ID"
channel: "Channel Name"
language: "en"
video_id: "VIDEO_ID"
tags:
  - youtube-transcript
---

# Video Title

- Source: https://www.youtube.com/watch?v=VIDEO_ID
- Channel: Channel Name
- Language: en

## Transcript

- **[00:00]** First caption segment.
- **[00:03]** Second caption segment.
```

## Field Notes

- **`title`, `source`, `channel`, `video_id`**: Always double-quoted with internal quotes escaped (`\"`) so titles containing colons (`:`) or brackets do not break Obsidian Properties parsing.
- **`tags`**: Kept as a YAML list (`youtube-transcript`) for Dataview and Bases queries.
- **Timestamp format**: `[MM:SS]` under 1 hour, `[HH:MM:SS]` at or above 1 hour.
