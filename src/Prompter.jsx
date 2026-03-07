import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react'
import { parseScript, countWords, estimateDuration, formatTime } from './parser.js'

const THEMES = {
  dark: {
    bg: '#000', text: '#fff', section: '#4ADE80', direction: '#FB923C',
    cue: '#F87171', hud: '#8892a4', accent: '#4ADE80', hudBg: '#1a1f2e',
    separator: '#2d3548', fade: '#000', warn: '#FACC15',
  },
  contrast: {
    bg: '#000', text: '#00FF41', section: '#FFD700', direction: '#FF6B00',
    cue: '#FF3333', hud: '#00FF41', accent: '#00FF41', hudBg: '#0a1a0a',
    separator: '#003300', fade: '#000', warn: '#FFD700',
  },
  light: {
    bg: '#f5f3ee', text: '#1a1a1a', section: '#16a34a', direction: '#c2410c',
    cue: '#dc2626', hud: '#666', accent: '#16a34a', hudBg: '#e5e3de',
    separator: '#ccc', fade: '#f5f3ee', warn: '#b45309',
  },
}

const FONTS = [
  { name: 'Sans', value: 'Inter, -apple-system, sans-serif' },
  { name: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { name: 'Mono', value: "'JetBrains Mono', 'SF Mono', monospace" },
]

const THEME_KEYS = Object.keys(THEMES)

export default function Prompter({ scriptText, wpm, countdownDuration = 3, targetDuration = 0, onExit }) {
  const blocks = useMemo(() => parseScript(scriptText), [scriptText])
  const totalWords = useMemo(() => countWords(blocks), [blocks])
  const estSeconds = useMemo(() => {
    if (targetDuration > 0) return targetDuration
    return estimateDuration(blocks, wpm)
  }, [blocks, wpm, targetDuration])

  // Scroll mode state
  const [scrolling, setScrolling] = useState(false)
  const [speed, setSpeed] = useState(1.8)
  const [mirrored, setMirrored] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [fontSize, setFontSize] = useState(42)
  const [showHud, setShowHud] = useState(true)
  const [guidePos, setGuidePos] = useState(33)
  const [columnWidth, setColumnWidth] = useState(78)
  const [hudPosition, setHudPosition] = useState(0)
  const [finished, setFinished] = useState(false)

  // Phase 2 features
  const [focusMode, setFocusMode] = useState(false)
  const [rehearsalMode, setRehearsalMode] = useState(false)
  const [rehearsalIdx, setRehearsalIdx] = useState(0)
  const [marker, setMarker] = useState(null)
  const [fontIdx, setFontIdx] = useState(0)
  const [themeIdx, setThemeIdx] = useState(0)

  const theme = THEMES[THEME_KEYS[themeIdx]]
  const fontFamily = FONTS[fontIdx].value

  const scrollRef = useRef(scrolling)
  const speedRef = useRef(speed)
  const posRef = useRef(0)
  const timerRef = useRef(null)
  const rafRef = useRef(null)
  const hudIntervalRef = useRef(null)
  const contentRef = useRef(null)
  const sectionOffsetsRef = useRef([])
  const touchStartRef = useRef(null)
  const initialSpeedSet = useRef(false)

  scrollRef.current = scrolling
  speedRef.current = speed

  // Split blocks into sections for rehearsal mode
  const sections = useMemo(() => {
    const result = []
    let current = []
    for (const block of blocks) {
      if (block.type === 'section') {
        if (current.length > 0) result.push(current)
        current = [block]
      } else {
        current.push(block)
      }
    }
    if (current.length > 0) result.push(current)
    return result
  }, [blocks])

  // Section indices for navigation
  const sectionIndices = useMemo(() => {
    return blocks.reduce((acc, b, i) => {
      if (b.type === 'section') acc.push(i)
      return acc
    }, [])
  }, [blocks])

  // Measure section positions after render
  useEffect(() => {
    if (!contentRef.current || rehearsalMode) return
    const els = contentRef.current.querySelectorAll('[data-section]')
    sectionOffsetsRef.current = Array.from(els).map(el => el.offsetTop)
  }, [blocks, fontSize, columnWidth, rehearsalMode])

  // Calculate initial speed from WPM (or target duration)
  useLayoutEffect(() => {
    if (initialSpeedSet.current || rehearsalMode) return
    if (!contentRef.current || estSeconds <= 0) return
    const contentHeight = contentRef.current.scrollHeight - window.innerHeight
    if (contentHeight > 0) {
      const pxPerFrame = contentHeight / (estSeconds * 60)
      const s = Math.max(0.4, Math.min(6, pxPerFrame))
      setSpeed(s)
      speedRef.current = s
      initialSpeedSet.current = true
    }
  }, [estSeconds, rehearsalMode])

  // Apply scroll position directly to DOM
  const applyPosition = useCallback((pos) => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(-${pos}px)`
    }
  }, [])

  // Re-apply position after React re-renders
  useEffect(() => {
    if (!rehearsalMode) applyPosition(posRef.current)
  })

  // Scroll loop
  const tick = useCallback(() => {
    if (!scrollRef.current) return
    const next = posRef.current + speedRef.current
    const max = contentRef.current
      ? contentRef.current.scrollHeight - window.innerHeight
      : Infinity
    if (next >= max) {
      posRef.current = max
      applyPosition(max)
      setScrolling(false)
      setFinished(true)
      return
    }
    posRef.current = next
    applyPosition(next)
    rafRef.current = requestAnimationFrame(tick)
  }, [applyPosition])

  // Timer + throttled HUD
  useEffect(() => {
    if (scrolling) {
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000)
      hudIntervalRef.current = setInterval(() => setHudPosition(posRef.current), 200)
      rafRef.current = requestAnimationFrame(tick)
    } else {
      clearInterval(timerRef.current)
      clearInterval(hudIntervalRef.current)
      cancelAnimationFrame(rafRef.current)
      setHudPosition(posRef.current)
    }
    return () => {
      clearInterval(timerRef.current)
      clearInterval(hudIntervalRef.current)
      cancelAnimationFrame(rafRef.current)
    }
  }, [scrolling, tick])

  // Fullscreen on mount
  useEffect(() => {
    const el = document.documentElement
    if (el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {})
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [])

  // Countdown then start
  const startWithCountdown = useCallback(() => {
    if (rehearsalMode) return
    if (scrolling) {
      setScrolling(false)
      return
    }
    if (finished) setFinished(false)
    let count = countdownDuration
    setCountdown(count)
    const interval = setInterval(() => {
      count--
      if (count > 0) {
        setCountdown(count)
      } else {
        setCountdown(null)
        setScrolling(true)
        clearInterval(interval)
      }
    }, 1000)
  }, [scrolling, finished, countdownDuration, rehearsalMode])

  // Jump to position helper
  const jumpTo = useCallback((pos) => {
    const p = Math.max(0, pos)
    posRef.current = p
    applyPosition(p)
    setHudPosition(p)
    setFinished(false)
  }, [applyPosition])

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      // Rehearsal mode controls
      if (rehearsalMode) {
        switch (e.key) {
          case ' ':
          case 'ArrowRight':
          case 'PageDown':
            e.preventDefault()
            setRehearsalIdx(i => Math.min(i + 1, sections.length - 1))
            return
          case 'ArrowLeft':
          case 'PageUp':
            e.preventDefault()
            setRehearsalIdx(i => Math.max(i - 1, 0))
            return
          case 'p':
          case 'P':
            setRehearsalMode(false)
            return
          case 'Escape':
            setScrolling(false)
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
            onExit()
            return
          case 't':
          case 'T':
            setThemeIdx(i => (i + 1) % THEME_KEYS.length)
            return
          case 'd':
          case 'D':
            setFontIdx(i => (i + 1) % FONTS.length)
            return
          case '+':
          case '=':
            setFontSize(s => Math.min(s + 4, 80))
            return
          case '-':
          case '_':
            setFontSize(s => Math.max(s - 4, 24))
            return
          default:
            if (e.key >= '1' && e.key <= '9') {
              const idx = parseInt(e.key) - 1
              if (idx < sections.length) setRehearsalIdx(idx)
            }
            return
        }
      }

      // Scroll mode controls
      switch (e.key) {
        case ' ':
          e.preventDefault()
          startWithCountdown()
          break
        case 'ArrowUp':
          e.preventDefault()
          setSpeed(s => { const n = Math.min(s + 0.2, 8); speedRef.current = n; return n })
          break
        case 'ArrowDown':
          e.preventDefault()
          setSpeed(s => { const n = Math.max(s - 0.2, 0.2); speedRef.current = n; return n })
          break
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault()
          jumpTo(posRef.current + 300)
          break
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          jumpTo(posRef.current - 300)
          break
        case 'r':
        case 'R':
          setScrolling(false)
          jumpTo(0)
          setElapsed(0)
          setFinished(false)
          break
        case 'm':
        case 'M':
          setMirrored(m => !m)
          break
        case '+':
        case '=':
          setFontSize(s => Math.min(s + 4, 80))
          break
        case '-':
        case '_':
          setFontSize(s => Math.max(s - 4, 24))
          break
        case 'h':
        case 'H':
          setShowHud(h => !h)
          break
        case 'g':
        case 'G':
          setGuidePos(g => g === 33 ? 50 : 33)
          break
        case 'w':
        case 'W':
          setColumnWidth(w => {
            const widths = [40, 50, 60, 70, 78, 90]
            const idx = widths.indexOf(w)
            return widths[idx === -1 ? 4 : (idx + 1) % widths.length]
          })
          break
        case 'f':
        case 'F':
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {})
          } else {
            document.documentElement.requestFullscreen().catch(() => {})
          }
          break
        case 'o':
        case 'O':
          setFocusMode(f => !f)
          break
        case 'p':
        case 'P':
          setScrolling(false)
          setRehearsalMode(true)
          setRehearsalIdx(0)
          break
        case 'b':
        case 'B':
          setMarker(posRef.current)
          break
        case 'j':
        case 'J':
          if (marker !== null) jumpTo(marker)
          break
        case 't':
        case 'T':
          setThemeIdx(i => (i + 1) % THEME_KEYS.length)
          break
        case 'd':
        case 'D':
          setFontIdx(i => (i + 1) % FONTS.length)
          break
        case 'Escape':
          setScrolling(false)
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
          onExit()
          break
        default:
          if (e.key >= '1' && e.key <= '9') {
            const idx = parseInt(e.key) - 1
            if (idx < sectionOffsetsRef.current.length) {
              const guideOffset = (window.innerHeight * guidePos) / 100
              jumpTo(sectionOffsetsRef.current[idx] - guideOffset)
            }
          }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [startWithCountdown, onExit, jumpTo, guidePos, rehearsalMode, sections.length, marker])

  // Touch support
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = {
      y: e.touches[0].clientY,
      time: Date.now(),
      pos: posRef.current,
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!touchStartRef.current) return
    if (rehearsalMode) return
    const deltaY = touchStartRef.current.y - e.touches[0].clientY
    const newPos = Math.max(0, touchStartRef.current.pos + deltaY)
    posRef.current = newPos
    applyPosition(newPos)
  }, [applyPosition, rehearsalMode])

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return
    const dt = Date.now() - touchStartRef.current.time
    const dy = Math.abs(posRef.current - touchStartRef.current.pos)
    if (dt < 300 && dy < 15) {
      if (rehearsalMode) {
        setRehearsalIdx(i => Math.min(i + 1, sections.length - 1))
      } else {
        startWithCountdown()
      }
    } else if (!rehearsalMode) {
      setHudPosition(posRef.current)
    }
    touchStartRef.current = null
  }, [startWithCountdown, rehearsalMode, sections.length])

  // Progress
  const maxScroll = contentRef.current
    ? contentRef.current.scrollHeight - window.innerHeight
    : 1
  const progress = Math.min(hudPosition / Math.max(maxScroll, 1), 1)
  const wordsRead = Math.floor(totalWords * progress)
  const estRemaining = Math.max(0, estSeconds - elapsed)
  const markerProgress = marker !== null ? Math.min(marker / Math.max(maxScroll, 1), 1) : null

  // Render helper for blocks
  const renderBlock = (block, i, sectionStart) => {
    if (block.type === 'separator') {
      return <div key={i} style={{
        height: 1, background: theme.separator, margin: '40px 0',
      }} />
    }
    if (block.type === 'section') {
      return <div key={i} data-section style={{
        color: theme.section, fontSize: 20, letterSpacing: 3,
        fontFamily: "'JetBrains Mono', monospace",
        textTransform: 'uppercase',
        marginTop: sectionStart ? 0 : 56,
        marginBottom: 14, opacity: 0.75,
      }}>{block.text}</div>
    }
    if (block.type === 'direction') {
      return <div key={i} style={{
        color: theme.direction, fontSize: 22, fontStyle: 'italic',
        marginBottom: 10, opacity: 0.85,
      }}>{block.text}</div>
    }
    if (block.type === 'cue') {
      return <div key={i} style={{
        color: theme.cue, fontSize: 22, fontStyle: 'italic',
        marginBottom: 16, opacity: 0.85,
      }}>{block.text}</div>
    }
    return <div key={i} style={{
      color: theme.text, fontSize, lineHeight: 1.55,
      fontWeight: 400, marginBottom: 32, letterSpacing: '0.01em',
      fontFamily,
    }}>{block.text}</div>
  }

  // ─── Rehearsal Mode ───
  if (rehearsalMode) {
    const currentSection = sections[rehearsalIdx] || []
    return (
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100vw', height: '100vh', background: theme.bg,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', touchAction: 'none',
        }}
      >
        {/* Section content */}
        <div style={{
          width: `${columnWidth}%`, maxWidth: columnWidth >= 90 ? 1200 : 900,
          maxHeight: '70vh', overflowY: 'auto', padding: '0 24px',
        }}>
          {currentSection.map((block, i) => renderBlock(block, i, i === 0))}
        </div>

        {/* Section counter */}
        <div style={{
          position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: theme.hud,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, color: theme.accent, fontWeight: 700, marginBottom: 8 }}>
            Section {rehearsalIdx + 1} / {sections.length}
          </div>
          <div style={{ opacity: 0.6 }}>
            SPACE/&rarr; next &nbsp; &larr; prev &nbsp; 1-9 jump &nbsp; P scroll mode &nbsp; ESC exit
          </div>
        </div>

        {/* Section pills */}
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 6, fontFamily: "'JetBrains Mono', monospace",
        }}>
          {sections.map((_, idx) => (
            <div key={idx} onClick={() => setRehearsalIdx(idx)} style={{
              width: 28, height: 28, borderRadius: 6,
              background: idx === rehearsalIdx ? theme.accent : 'rgba(128,128,128,0.15)',
              color: idx === rehearsalIdx ? theme.bg : theme.hud,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.15s',
            }}>{idx + 1}</div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Scroll Mode ───
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100vw', height: '100vh', background: theme.bg, overflow: 'hidden',
        cursor: scrolling ? 'none' : 'default',
        transform: mirrored ? 'scaleX(-1)' : 'none',
        touchAction: 'none',
      }}
    >
      {/* Fade overlays */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '28vh',
        background: `linear-gradient(to bottom, ${theme.fade}, transparent)`,
        pointerEvents: 'none', zIndex: 5,
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '28vh',
        background: `linear-gradient(to top, ${theme.fade}, transparent)`,
        pointerEvents: 'none', zIndex: 5,
      }} />

      {/* Focus mode spotlight */}
      {focusMode && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: `linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.7) ${guidePos - 10}%, transparent ${guidePos - 4}%, transparent ${guidePos + 4}%, rgba(0,0,0,0.7) ${guidePos + 10}%, rgba(0,0,0,0.7) 100%)`,
          pointerEvents: 'none', zIndex: 6,
          transition: 'opacity 0.3s',
        }} />
      )}

      {/* Guide line */}
      <div style={{
        position: 'fixed', top: `${guidePos}%`, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent 5%, ${theme.accent} 20%, ${theme.accent} 80%, transparent 95%)`,
        opacity: 0.35, pointerEvents: 'none', zIndex: 10,
      }} />

      {/* Countdown */}
      {countdown !== null && (
        <div style={{
          position: 'fixed', top: `${guidePos}%`, left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 140,
          color: theme.accent, zIndex: 30,
        }}>{countdown}</div>
      )}

      {/* Finished indicator */}
      {finished && (
        <div style={{
          position: 'fixed', top: `${guidePos}%`, left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 48,
          color: theme.accent, zIndex: 30, textAlign: 'center',
        }}>
          <div>DONE</div>
          <div style={{ fontSize: 18, color: theme.hud, marginTop: 12 }}>
            {formatTime(elapsed)} elapsed &middot; R to reset &middot; ESC to exit
          </div>
        </div>
      )}

      {/* Retake marker indicator */}
      {marker !== null && showHud && (
        <div style={{
          position: 'fixed', top: 70, right: 28, zIndex: 20,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
          color: theme.warn, opacity: 0.7,
        }}>
          Marker set &middot; J to jump
        </div>
      )}

      {/* Content */}
      <div ref={contentRef} style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        margin: '0 auto',
        width: `${columnWidth}%`, maxWidth: columnWidth >= 90 ? 1200 : 900,
        paddingTop: `${guidePos}vh`, paddingBottom: '60vh',
      }}>
        {blocks.map((block, i) => renderBlock(block, i, i === 0))}
      </div>

      {/* HUD */}
      {showHud && (
        <>
          {/* Timer — top left */}
          <div style={{
            position: 'fixed', top: 20, left: 28, zIndex: 20,
            fontFamily: "'JetBrains Mono', monospace",
            opacity: scrolling ? 0.8 : 0.5,
            transition: 'opacity 0.3s ease',
          }}>
            <div style={{ fontSize: 32, color: theme.accent, fontWeight: 700 }}>
              {formatTime(elapsed)}
            </div>
            <div style={{ fontSize: 14, color: theme.hud, marginTop: 4 }}>
              elapsed
            </div>
          </div>

          {/* Remaining — top right */}
          <div style={{
            position: 'fixed', top: 20, right: 28, zIndex: 20,
            fontFamily: "'JetBrains Mono', monospace", textAlign: 'right',
            opacity: scrolling ? 0.8 : 0.5,
            transition: 'opacity 0.3s ease',
          }}>
            <div style={{
              fontSize: 32, fontWeight: 700,
              color: estRemaining < 30 ? theme.cue : estRemaining < 60 ? theme.warn : theme.hud,
            }}>
              -{formatTime(estRemaining)}
            </div>
            <div style={{ fontSize: 14, color: theme.hud, marginTop: 4 }}>
              est. remaining
            </div>
          </div>

          {/* Section nav — left edge (when paused) */}
          {sectionIndices.length > 0 && !scrolling && (
            <div style={{
              position: 'fixed', left: 12, top: '50%', transform: 'translateY(-50%)',
              zIndex: 20, fontFamily: "'JetBrains Mono', monospace",
              opacity: 0.6, display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {sectionIndices.map((_, idx) => (
                <div key={idx} style={{
                  fontSize: 13, color: theme.accent, cursor: 'pointer',
                  padding: '4px 8px', borderRadius: 4,
                  background: `${theme.accent}14`,
                  textAlign: 'center', transition: 'background 0.15s',
                }} onClick={() => {
                  if (idx < sectionOffsetsRef.current.length) {
                    const guideOffset = (window.innerHeight * guidePos) / 100
                    jumpTo(sectionOffsetsRef.current[idx] - guideOffset)
                  }
                }}
                onMouseEnter={(e) => e.target.style.background = `${theme.accent}33`}
                onMouseLeave={(e) => e.target.style.background = `${theme.accent}14`}
                >{idx + 1}</div>
              ))}
            </div>
          )}

          {/* Speed + Progress — bottom left */}
          <div style={{
            position: 'fixed', bottom: 20, left: 28, zIndex: 20,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: theme.hud,
            opacity: scrolling ? 0.4 : 0.7,
            transition: 'opacity 0.3s ease',
          }}>
            <span style={{ color: theme.warn }}>Speed {speed.toFixed(1)}</span>
            <span style={{ margin: '0 12px', opacity: 0.4 }}>|</span>
            <span>{FONTS[fontIdx].name} {fontSize}px</span>
            <span style={{ margin: '0 12px', opacity: 0.4 }}>|</span>
            <span>Width {columnWidth}%</span>
            <span style={{ margin: '0 12px', opacity: 0.4 }}>|</span>
            <span>{wordsRead} / {totalWords} words</span>
            {focusMode && <>
              <span style={{ margin: '0 12px', opacity: 0.4 }}>|</span>
              <span style={{ color: theme.accent }}>Focus</span>
            </>}
          </div>

          {/* Controls — bottom right */}
          <div style={{
            position: 'fixed', bottom: 20, right: 28, zIndex: 20,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: theme.hud,
            textAlign: 'right', lineHeight: 1.8,
            opacity: scrolling ? 0 : 0.6,
            transition: 'opacity 0.3s ease',
          }}>
            SPACE play/pause &nbsp; &uarr;&darr; speed &nbsp; &larr;&rarr; jump<br />
            1-9 sections &nbsp; +/- font &nbsp; W width &nbsp; G guide<br />
            O focus &nbsp; P rehearse &nbsp; B mark &nbsp; J jump-to-mark<br />
            D font &nbsp; T theme &nbsp; F fullscreen &nbsp; M mirror<br />
            H hud &nbsp; R reset &nbsp; ESC exit
          </div>

          {/* Progress bar */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, height: 3,
            background: theme.hudBg, zIndex: 20,
          }}>
            <div style={{
              width: `${progress * 100}%`, height: '100%',
              background: `linear-gradient(90deg, ${theme.accent}, ${theme.warn}, ${theme.direction}, ${theme.cue})`,
              transition: 'width 0.2s linear',
            }} />
            {/* Marker indicator on progress bar */}
            {markerProgress !== null && (
              <div style={{
                position: 'absolute', left: `${markerProgress * 100}%`, top: -4,
                width: 2, height: 10, background: theme.warn,
                transform: 'translateX(-1px)',
              }} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
