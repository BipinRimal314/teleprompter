/**
 * Parse a markdown-like script into blocks for the teleprompter.
 *
 * Format:
 *   ## Section Title        → section marker (green)
 *   [WEBCAM]                → stage direction (orange)
 *   **[WEBCAM]**            → also a direction (markdown bold stripped)
 *   > Pause 2 seconds.      → cue/note to self (red, italic)
 *   *Italic note*           → also a cue (markdown italic stripped)
 *   Regular text            → speech (white, large)
 *   "Quoted speech"         → speech with quotes stripped
 *   ---                     → visual separator
 *   Empty lines             → ignored
 */
export function parseScript(raw) {
  const lines = raw.split('\n')
  const blocks = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (!line) continue

    // --- separator
    if (line === '---') {
      blocks.push({ type: 'separator' })
      continue
    }

    // ## Section Header
    if (line.startsWith('## ')) {
      blocks.push({ type: 'section', text: line.slice(3) })
      continue
    }

    // # Top-level heading (also treat as section)
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      continue // skip doc title lines like "# Drift — Video Script"
    }

    // Stage direction: [WEBCAM], **[SLIDE]**, **[SLIDE + PIP]**
    // Strip markdown bold ** wrapper if present
    const dirMatch = line.match(/^\*{0,2}\[(.+)\]\*{0,2}$/)
    if (dirMatch) {
      blocks.push({ type: 'direction', text: `[${dirMatch[1]}]` })
      continue
    }

    // Cue: > text, or *italic text* (markdown italic)
    if (line.startsWith('> ')) {
      blocks.push({ type: 'cue', text: line.slice(2) })
      continue
    }
    const italicMatch = line.match(/^\*([^*]+)\*$/)
    if (italicMatch) {
      blocks.push({ type: 'cue', text: italicMatch[1] })
      continue
    }

    // Skip lines that are just metadata-like (e.g., "Target length:", "Format:", "Tone:")
    if (/^(Target|Format|Tone|Music|Length):/.test(line)) continue

    // Speech: strip surrounding quotes if present
    const quoteMatch = line.match(/^"(.+)"$/)
    if (quoteMatch) {
      blocks.push({ type: 'speech', text: quoteMatch[1] })
      continue
    }

    // Multi-line quoted speech (starts with " but doesn't end with ")
    if (line.startsWith('"') && !line.endsWith('"')) {
      let speech = line.slice(1) // remove opening quote
      // Gather continuation lines until closing quote
      while (i + 1 < lines.length) {
        i++
        const next = lines[i].trim()
        if (!next) continue
        if (next.endsWith('"')) {
          speech += ' ' + next.slice(0, -1)
          break
        }
        speech += ' ' + next
      }
      blocks.push({ type: 'speech', text: speech })
      continue
    }

    // Anything else that looks like prose (not a markdown artifact)
    // Skip short non-speech lines like bullet metadata
    if (line.startsWith('- **') || line.startsWith('- ')) continue

    blocks.push({ type: 'speech', text: line })
  }

  return blocks
}

/**
 * Count speakable words (speech blocks only).
 */
export function countWords(blocks) {
  return blocks
    .filter(b => b.type === 'speech')
    .reduce((sum, b) => sum + b.text.split(/\s+/).filter(Boolean).length, 0)
}

/**
 * Estimate speaking duration in seconds.
 * ~150 words per minute is natural narration pace.
 */
export function estimateDuration(blocks, wpm = 150) {
  const words = countWords(blocks)
  const pauses = blocks.filter(b => b.type === 'cue').length * 3 // ~3s per cue
  return Math.ceil((words / wpm) * 60) + pauses
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
