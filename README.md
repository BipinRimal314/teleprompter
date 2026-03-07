# Teleprompter

Markdown-native teleprompter for video creators. No account, no install, no time limits, no watermarks.

Paste your script, hit Start, and read. Built for solo creators who write in markdown and don't want to pay $15/month to scroll text.

## Features

**Editor**
- Live word count, section count, and estimated duration as you type
- WPM slider (100-200) calibrates duration and scroll speed
- Configurable countdown (3s, 5s, 10s)
- Target duration mode — set a video length, scroll speed auto-calibrates
- Save/load scripts to localStorage
- Import `.md`/`.txt` files (click or drag-and-drop)
- Export scripts as `.md`

**Prompter**
- Smooth 60fps scrolling via direct DOM manipulation (no per-frame React re-renders)
- Auto-calibrated scroll speed based on WPM or target duration
- 3 color themes: Dark, High Contrast, Light
- 3 font families: Sans, Serif, Mono
- Adjustable font size (24-80px), column width (40-90%), guide line position
- Focus mode — spotlight dims everything except the active reading zone
- Rehearsal mode — practice section-by-section without scrolling
- Retake markers — drop a bookmark, jump back to it instantly
- Section navigation — press 1-9 or click to jump to any section
- Mirror mode for hardware teleprompter rigs
- Touch support — tap to play/pause, swipe to scroll manually
- Fullscreen, auto-stop at end, elapsed/remaining timers

**Markdown Format**
```markdown
## Section Title        → green section marker
[WEBCAM]                → orange stage direction
**[SLIDE]**             → also a direction (bold stripped)
> Pause here.           → red cue to yourself
*Take a breath.*        → also a cue (italic stripped)
Regular text            → white speech (large, scrolling)
"Quoted speech"         → speech with quotes stripped
---                     → visual separator
```

## Keyboard Shortcuts

| Key | Action | Key | Action |
|-----|--------|-----|--------|
| Space | Play/pause | R | Reset |
| Up/Down | Scroll speed | +/- | Font size |
| Left/Right | Jump 300px | W | Column width |
| PgUp/PgDn | Jump (clickers) | G | Guide line position |
| 1-9 | Jump to section | O | Focus spotlight |
| F | Fullscreen | P | Rehearsal mode |
| M | Mirror | B | Set retake marker |
| H | Toggle HUD | J | Jump to marker |
| T | Cycle theme | D | Cycle font |
| Escape | Exit | | |

## Install & Run

```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build
```

## PWA

Installable as a standalone app on desktop and mobile. Works offline after first visit.

## Tech

React 19 + Vite. No external dependencies beyond React. ~218KB bundled (68KB gzipped).

Scripts stay in your browser (localStorage). Nothing is sent to any server.

## License

MIT
