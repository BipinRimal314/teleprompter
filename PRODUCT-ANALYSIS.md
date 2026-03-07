# Teleprompter — Comprehensive Product Analysis

**Date:** March 7, 2026
**Status:** Pre-launch critique — what needs to happen before this ships to the masses

---

## Executive Summary

We built a markdown-native, open-source, no-account-required web teleprompter in React+Vite. It works. But "works for me" and "ready for the masses" are separated by about 40 specific gaps. This document maps every one of them across four research dimensions: competitive landscape, UX critique, market positioning, and creator workflow alignment.

The core finding: our positioning ("markdown-native, no-account, open-source") is genuinely underserved. No existing tool checks all those boxes simultaneously. But positioning alone doesn't ship. The product needs scroll performance fixes, mobile support, section navigation, and a handful of features that creators consider table stakes before it can compete.

---

## 1. Competitive Landscape

### Direct Competitors

| Tool | Type | Price | Strengths | Weaknesses |
|------|------|-------|-----------|------------|
| **Speakflow** | Web | Free (2min), $15/mo | Flow mode (voice scroll), team collab, keyboard shortcuts | 2-min free limit, voice stops after 30s silence |
| **BIGVU** | Native | Free (2min), $19/mo | All-in-one: record + edit + teleprompter + publish | Watermarks on free, bloated, expensive |
| **PromptSmart Pro** | Native | $9.99/mo | Patented VoiceTrack scroll | Voice tracking jumps/stops randomly, subscription |
| **Teleprompter Pro** | iOS/Mac | ~$20 one-time | Hardware rig support, mirroring, Google Docs import | Apple ecosystem only |
| **CuePrompter** | Web | Free | Zero friction, no signup, instant use | Outdated UI, no offline, no mobile optimization |
| **QPrompt** | Desktop OSS | Free | Open source, cross-platform Qt app | Desktop only, no web, limited UX |
| **Best Teleprompter** | Web (PWA) | Free | Offline, no watermarks, stable, installable | No voice control, no recording |
| **Teleprompter.com** | Web + Native | Freemium | Voice scroll, AI script generation | Crashed 3x in testing, unreliable voice |
| **VODIUM** | Desktop | $8/mo | Transparent overlay on Zoom/Teams | Windows only, niche use case |
| **Power Prompter** | Mac | ~$30 | Native macOS, dual display, rich text | Mac only, no web |
| **FoxCue** | Mac | ~$20 | macOS native, clean UI, mirror mode | Mac only |
| **Parrot (Padcaster)** | Hardware | ~$100 | Affordable hardware rig, tablet-based | Requires iPad, physical setup |

### Open-Source Competitors

| Project | Stack | Stars | Notable |
|---------|-------|-------|---------|
| kenlimmj/teleprompter | JS | ~200 | Browser-based, markdown + LaTeX support |
| YC Prompter | React | ~50 | Multi-speaker color coding for cofounder demos |
| nprompter | Web | ~30 | Uses Notion as backend |
| PromptDown (Brett Terpstra) | Web | N/A | Original markdown teleprompter concept (2010) |

### What They Have That We Don't

1. **Voice-activated scrolling** (Speakflow, PromptSmart, Teleprompter.com) — unreliable everywhere, but expected
2. **In-app recording** (BIGVU, Teleprompter.com) — record video without leaving the app
3. **Google Docs / Notion import** (Teleprompter Pro, nprompter) — meet creators where scripts already live
4. **Dual-screen mode** (PromptDog, Power Prompter, Teleprompter Pro) — operator view + talent view
5. **Transparent overlay** (VODIUM, CamPrompter) — float script over Zoom/other apps
6. **Hardware mirror mode** for beam-splitter rigs (Teleprompter Pro, FoxCue)
7. **Multi-speaker color coding** (YC Prompter) — different colors per speaker
8. **Team collaboration** (Speakflow) — shared scripts, live editing
9. **PWA installability** (Best Teleprompter) — works offline, feels native
10. **Script timing calculator** tied to scroll speed (BIGVU, Teleprompter.com)

### What We Have That They Don't

1. **True markdown-native parsing** — headers become sections, blockquotes become cues, bold brackets become directions. No competitor does this natively.
2. **No account, no server, no tracking** — scripts never leave the browser
3. **Open source** — fully inspectable, forkable, extensible
4. **WPM-based duration estimation** built into the editor
5. **Live word count and section count** as you type
6. **Keyboard-first design** with comprehensive shortcuts

---

## 2. UX Critique — 30+ Issues

### Critical (Must Fix Before Launch)

| # | Issue | Details |
|---|-------|---------|
| 1 | **Per-frame React state updates** | `setPosition(next)` on every `requestAnimationFrame` triggers a full React re-render 60x/second. Use CSS transforms via refs or `useReducer` with batching. Current approach will stutter on longer scripts. |
| 2 | **No mobile/touch support** | Zero touch controls. No swipe to scroll, no tap to pause, no pinch to zoom. Tablets are the most common teleprompter device. |
| 3 | **No fullscreen mode** | Browser chrome wastes screen real estate. The Fullscreen API is one line of code. |
| 4 | **WPM slider disconnected from scroll speed** | Editor has a WPM setting (100-200) that estimates duration but doesn't affect actual scroll speed in the prompter. These should be linked. |
| 5 | **parseScript not memoized** | `parseScript(scriptText)` runs on every render in Prompter.jsx. Should be `useMemo`. |
| 6 | **No section navigation** | Creators need to jump to a specific section after a flubbed take. Currently: manual arrow-key scrolling. Needed: clickable section list or number keys to jump. |
| 7 | **Reading zone is center-screen** | The guide line sits at 50% (vertical center). Professional teleprompters place it at the top third, closer to the camera. Should be configurable. |

### High Priority (Expected by Users)

| # | Issue | Details |
|---|-------|---------|
| 8 | **No Bluetooth remote / clicker support** | Most presentation clickers send Page Up/Down or arrow key events. We handle arrows but not Page Up/Down. Add these keybindings. |
| 9 | **No countdown duration setting** | Hardcoded to 3 seconds. Some creators want 5 or 10. |
| 10 | **No script auto-calibrated scroll** | Input target video length → scroll speed auto-adjusts to fit. BIGVU does this. |
| 11 | **Column width not configurable** | Fixed at 78% / max 900px. Thomas Frank's #1 tip: narrow the column to reduce eye movement. Should be adjustable. |
| 12 | **No visual cue for "you're going off-pace"** | Timer turns red when remaining < 30s, but there's no indication during scrolling that you're ahead/behind your target pace. |
| 13 | **File import only supports .md/.txt** | Should also accept .docx (via mammoth.js) and Google Docs paste (clean HTML). |
| 14 | **No export** | Can't export script as .md or .txt from the app. |
| 15 | **No undo in editor** | Browser textarea has native Ctrl+Z, but there's no explicit undo/redo or version history. |

### Medium Priority (Differentiation)

| # | Issue | Details |
|---|-------|---------|
| 16 | **No rehearsal mode** | Show one section at a time, advance manually, practice delivery without scrolling. Thomas Frank recommends doing one take reading, one from memory. |
| 17 | **No auto-close prevention** | If scroll reaches the end, nothing happens. Good — but should show a "finished" indicator. |
| 18 | **No script splitting** | Course creators batch-record multiple scripts. Need tabs or a script queue to switch between scripts without losing state. |
| 19 | **No estimated remaining words** | Show "247 words left" alongside the timer for pacing awareness. |
| 20 | **No "mark from here" for retakes** | Drop a marker at the current position, rewind to it instantly for retakes. |
| 21 | **No focus-mode highlighting** | Highlight the current line/paragraph brighter than surrounding text. Some apps dim everything except the active reading zone. |
| 22 | **No font family selection** | Locked to Inter for speech, JetBrains Mono for UI. Some readers prefer serif fonts. |
| 23 | **No color theme options** | Black background only. Some creators need white-on-black, some need high-contrast green-on-black, some record in bright rooms and need dark-on-light. |
| 24 | **Accessibility: no ARIA labels** | No screen reader support, no reduced-motion support, no keyboard focus indicators beyond browser defaults. |

### Low Priority (Nice to Have)

| # | Issue | Details |
|---|-------|---------|
| 25 | **No voice-activated scroll** | Every competitor offers it. Every competitor's implementation is unreliable. Web Speech API exists but is inconsistent. Implement as experimental/beta. |
| 26 | **No dual-screen / operator mode** | Open a second window with controls while talent sees clean script. Achievable with `window.open()` + `BroadcastChannel`. |
| 27 | **No transparent overlay mode** | Float script over Zoom/OBS. Not possible in a browser without a native wrapper. |
| 28 | **No bionic reading mode** | Bold the first few letters of each word to create fixation points. Emerging technique, mentioned in Even Realities guide. |
| 29 | **No multi-speaker color coding** | Each speaker's lines in a different color. Useful for co-hosted videos. |
| 30 | **No recording integration** | In-app recording via MediaRecorder API. Adds complexity but eliminates app-switching. |
| 31 | **No analytics** | Track speaking pace, retake count, time-per-section across sessions. Useful for improvement. |
| 32 | **PWA support** | Add a service worker + manifest for installability and offline use. One-time setup. |

---

## 3. Market Positioning

### Market Size

The teleprompter software market was valued at **$78.5M in 2024**, growing at ~12% CAGR. The broader video creation tools market exceeds $2B. The addressable segment for a free/open-source web teleprompter is the long tail: solo creators, educators, small teams who won't pay $15-20/month for Speakflow or BIGVU.

### Pricing Landscape

| Model | Examples | Price Range |
|-------|----------|-------------|
| Freemium (time-limited) | BIGVU, Speakflow, Teleprompter.com | Free 2min, $10-20/mo for unlimited |
| One-time purchase | Teleprompter Pro, Power Prompter, FoxCue | $20-40 |
| Subscription | PromptSmart, VODIUM | $8-10/mo |
| Free + open source | QPrompt, CuePrompter, ours | $0 |
| Hardware + software | Padcaster Parrot, Even G2 | $100-1,500 |

**Sweet spot for paid tiers:** $10-15/month for pro features (cloud sync, team collab, recording).

### Our Positioning (Underserved Niche)

**"Markdown-native, no-account, open-source teleprompter for developers and technical creators."**

This combination is genuinely underserved:
- CuePrompter is free and no-account, but the UI is from 2010 and has no markdown support
- QPrompt is open source, but desktop-only with no web version
- Best Teleprompter is web-based and free, but not open source and not markdown-native
- kenlimmj/teleprompter supports markdown but is unmaintained (last commit years ago)

Nobody occupies the intersection of: web-based + markdown-native + open-source + modern UI + no account required.

### Launch Strategy

| Channel | Why | When |
|---------|-----|------|
| **Show HN** | Highest-signal launch channel for dev tools. Three teleprompter Show HNs in 2025-2026 all gained traction. | After fixing Critical issues (1-7) |
| **Product Hunt** | Broader creator audience, high launch-day visibility | After Show HN, with screenshots and demo video |
| **Reddit r/NewTubers, r/videography** | Creator communities actively discussing teleprompter pain points | Same week as PH |
| **GitHub trending** | Good README + stars snowball. QPrompt got traction this way | Organic after Show HN |

### Monetization Options (If Desired)

1. **Fully free + open source** — reputation play, funnel to consulting or other products
2. **Open core** — free local version, paid cloud sync/team features ($8-12/mo)
3. **Sponsorware** — features unlock after GitHub sponsor milestone
4. **One-time tip** — "Buy me a coffee" / GitHub Sponsors, no gate

Recommendation: Stay fully free and open source. The teleprompter itself is a credibility artifact. Its value is the signal it sends (ships software, understands creators, builds in the open), not the revenue it generates.

---

## 4. Creator Workflow Alignment

### The Actual Recording Workflow (vs What We Support)

| Step | What Creators Do | What We Support | Gap |
|------|-----------------|-----------------|-----|
| 1. Write script | Google Docs, Notion, markdown files, Word | Markdown editor built in | Partial — no import from Docs/Notion |
| 2. Import/paste | Copy-paste or file upload | File upload (.md/.txt) + paste | Missing .docx, no drag-and-drop |
| 3. Setup | Font size, speed, countdown, screen position | Font size, speed | Missing: column width, reading zone position, countdown duration |
| 4. Rehearse | Read through once without recording | No rehearsal mode | Missing: section-by-section practice mode |
| 5. Countdown | 3-10 second countdown before rolling | 3-second countdown | Missing: configurable duration |
| 6. Record take 1 | Auto-scroll while speaking to camera | Auto-scroll with play/pause | Works, but scroll tied to pixels not WPM |
| 7. Flub → rewind | Jump back to the section, retake | Arrow keys to jump 300px | Missing: section jump, retake marker |
| 8. Batch record | Switch to next script, keep going | Manual: exit, load new script, re-enter | Missing: script queue, tabs |

### Pain Points We Solve

1. **"Tired of apps requiring accounts"** — we never ask for one
2. **"Script editing inside the app is terrible"** — our editor is a clean textarea with live stats, not a buggy rich-text editor
3. **"Format loss on paste"** — we parse markdown natively; headers, cues, and directions survive intact
4. **"Just need to paste and go"** — our flow is: paste → click Start → space to begin
5. **"Free tier limits are insulting"** — no time limits, no watermarks, no feature gates

### Pain Points We Don't Solve (Yet)

1. **"The teleprompter stare"** — we can't solve this in software, but we can mitigate it with narrower columns, configurable reading zone, and rehearsal mode
2. **"Voice scroll that actually works"** — we don't have voice scroll at all (arguably better than having broken voice scroll)
3. **"I need to jump to the part I messed up"** — no section navigation
4. **"My iPad is my teleprompter"** — no touch support, no PWA
5. **"I batch-record 10 videos in one session"** — no script queue
6. **"I need my operator to control the scroll"** — no dual-screen mode

---

## 5. Prioritized Roadmap

### Phase 1: "Ship It" (Fix Before Launch)

These are the minimum requirements before a Show HN or Product Hunt launch.

1. **Fix scroll performance** — move position tracking to CSS transforms via refs, eliminate per-frame React state updates
2. **Add fullscreen mode** — `document.documentElement.requestFullscreen()` on enter, Escape already exits
3. **Connect WPM to scroll speed** — use the editor's WPM value to calculate pixels-per-frame based on average words-per-screen-height
4. **Memoize parseScript** — `useMemo(() => parseScript(scriptText), [scriptText])`
5. **Add Page Up/Down keybindings** — support presentation clickers
6. **Add section navigation** — number keys 1-9 jump to section N, or show a sidebar overlay with section list
7. **Configurable reading zone** — let users move the guide line to top-third, center, or bottom-third
8. **Basic touch support** — tap to pause/play, swipe up/down for manual scroll
9. **PWA manifest + service worker** — make it installable and offline-capable
10. **Responsive design** — test and fix layout on tablet-sized screens (768px-1024px)

### Phase 2: "Delight Them" (Post-Launch, Based on Feedback)

11. Column width slider (40%-100%)
12. Configurable countdown (3, 5, 10 seconds)
13. Focus-mode highlighting (dim non-active text)
14. Rehearsal mode (section-by-section, no scroll)
15. Retake markers (drop a pin, jump back to it)
16. Font family selection (sans-serif, serif, monospace)
17. Color theme options (dark, light, high-contrast)
18. Drag-and-drop file import
19. Script export as .md
20. "Target duration" mode — input desired video length, auto-calibrate scroll speed

### Phase 3: "Compete" (If Traction Warrants It)

21. Voice-activated scroll (Web Speech API, labeled as beta/experimental)
22. Dual-screen operator mode (BroadcastChannel API)
23. Multi-speaker color coding (parse `Speaker:` prefixes)
24. Script queue / tabs for batch recording
25. Bionic reading mode
26. Session analytics (pace, retakes, time per section)
27. Google Docs import (via public share link fetch)
28. .docx import (via mammoth.js)
29. Recording integration (MediaRecorder API)
30. ARIA labels and accessibility audit

---

## 6. The Honest Assessment

### What's Good

- **The editor is clean.** Textarea + live stats + markdown preview-through-parsing is a better script prep experience than most competitors.
- **The prompter aesthetics are excellent.** Fade overlays, guide line, color-coded HUD, gradient progress bar — this looks professional.
- **Keyboard shortcuts are comprehensive.** Space, arrows, +/-, M, H, R, Escape — covers the common cases.
- **The parser is clever.** Markdown-native parsing that turns `##` into green section markers and `>` into red cues is a genuine differentiator.
- **Zero friction.** No signup, no install, no paywall. This is the single strongest competitive advantage.

### What's Dangerous

- **Scroll performance will fail on long scripts.** A 2,000-word video script is ~100 speech blocks. Re-rendering all of them 60x/second via React state will cause visible jank on mid-range devices. This is the most urgent technical fix.
- **No mobile = no tablets = missing the primary use case.** The most common teleprompter setup is a tablet mounted behind or next to a camera. Without touch support, that entire audience is excluded.
- **No section navigation makes retakes painful.** Every creator flubs lines. The inability to jump to a section means manual scrolling through the entire script after every mistake. This will be the first complaint.

### What's Irrelevant (Don't Build These)

- **In-app video recording** — BIGVU does this and it's a bloated mess. Let OBS/camera handle recording.
- **AI script generation** — Teleprompter.com added this and it adds zero value. Creators have their own scripts.
- **Social sharing / publishing** — scope creep. This is a teleprompter, not a video platform.
- **User accounts / cloud sync** — the no-account positioning is a feature. Don't undermine it unless building a paid team tier.

---

## 7. Competitive Moat

If we execute Phase 1, the moat is:

1. **Open source** — forkable, auditable, community-contributed. QPrompt proves OSS teleprompters attract contributors.
2. **Markdown-native** — no competitor parses markdown into a teleprompter-native format. Brett Terpstra coined "PromptDown" in 2010; nobody built it properly until now.
3. **Zero friction** — no signup, no install (PWA optional), no time limits, no watermarks. CuePrompter is the closest competitor here, and their UI is 15 years old.
4. **Developer-friendly** — Show HN audience, hackable, extensible. This is the community that will adopt first and evangelize.

The risk: this moat is easily copied. Any competitor could add markdown parsing in a weekend. The defense is speed of iteration, community building, and being the first name people think of when they search "open source teleprompter."

---

## Appendix: Sources

### Competitor Intelligence
- Even Realities: Best Teleprompter Apps & Software Comparison (2025-2026)
- OpusClip: Best Teleprompter Apps for Creators (2026)
- best-teleprompter.com: 15 Tools Tested & Ranked
- Individual app reviews: App Store, Google Play, Capterra, G2

### Creator Workflow
- Thomas Frank: "Working with a Teleprompter: My Battle-Tested Tips"
- DVXuser Forum: Teleprompter App Woes discussion
- Streaming Media: Managing Teleprompter Scrolling Speed with Elgato Stream Deck
- Teleprompter.com: Remote Control Integration with External Devices
- N2 Productions: Renting a Teleprompter with Operator vs Going Solo

### Market & Community Signals
- Hacker News: "I got tired of teleprompter apps requiring accounts" (2025)
- Hacker News: "Show HN: The Best Free Online Teleprompter?" (2024)
- Hacker News: "Show HN: Simple Teleprompter App for the Browser" (2025)
- Hacker News: "CamPrompter — Transparent Teleprompter with UVC Hardware Control" (2025)
- Hacker News: "What teleprompter solution do you use?" (2025)
- Reddit: r/NewTubers, r/videography teleprompter discussions

### Technical References
- Web Speech API (MDN)
- Fullscreen API (MDN)
- BroadcastChannel API (MDN)
- MediaRecorder API (MDN)
- mammoth.js (.docx to HTML converter)
