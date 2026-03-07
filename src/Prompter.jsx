import React, { useState, useEffect, useRef, useCallback } from 'react'
import { parseScript, countWords, estimateDuration, formatTime } from './parser.js'

export default function Prompter({ scriptText, wpm, onExit }) {
  const blocks = parseScript(scriptText)
  const totalWords = countWords(blocks)
  const estSeconds = estimateDuration(blocks, wpm)

  const [scrolling, setScrolling] = useState(false)
  const [speed, setSpeed] = useState(1.8)
  const [position, setPosition] = useState(0)
  const [mirrored, setMirrored] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [fontSize, setFontSize] = useState(42)
  const [showHud, setShowHud] = useState(true)

  const scrollRef = useRef(scrolling)
  const speedRef = useRef(speed)
  const posRef = useRef(position)
  const timerRef = useRef(null)
  const rafRef = useRef(null)
  const contentRef = useRef(null)

  scrollRef.current = scrolling
  speedRef.current = speed
  posRef.current = position

  // Scroll loop
  const tick = useCallback(() => {
    if (!scrollRef.current) return
    const next = posRef.current + speedRef.current
    posRef.current = next
    setPosition(next)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  // Timer
  useEffect(() => {
    if (scrolling) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)
      rafRef.current = requestAnimationFrame(tick)
    } else {
      clearInterval(timerRef.current)
      cancelAnimationFrame(rafRef.current)
    }
    return () => {
      clearInterval(timerRef.current)
      cancelAnimationFrame(rafRef.current)
    }
  }, [scrolling, tick])

  // Countdown then start
  const startWithCountdown = useCallback(() => {
    if (scrolling) {
      setScrolling(false)
      return
    }
    let count = 3
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
  }, [scrolling])

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
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
          e.preventDefault()
          setPosition(p => { const n = p + 300; posRef.current = n; return n })
          break
        case 'ArrowLeft':
          e.preventDefault()
          setPosition(p => { const n = Math.max(0, p - 300); posRef.current = n; return n })
          break
        case 'r':
        case 'R':
          setScrolling(false)
          setPosition(0)
          posRef.current = 0
          setElapsed(0)
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
        case 'Escape':
          setScrolling(false)
          onExit()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [startWithCountdown, onExit])

  // Progress estimate
  const maxScroll = contentRef.current
    ? contentRef.current.scrollHeight - window.innerHeight
    : 1
  const progress = Math.min(position / Math.max(maxScroll, 1), 1)
  const wordsRead = Math.floor(totalWords * progress)
  const estRemaining = Math.max(0, estSeconds - elapsed)

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#000', overflow: 'hidden',
      cursor: scrolling ? 'none' : 'default',
      transform: mirrored ? 'scaleX(-1)' : 'none',
    }}>
      {/* Fade overlays */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '28vh',
        background: 'linear-gradient(to bottom, #000, transparent)',
        pointerEvents: 'none', zIndex: 5,
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '28vh',
        background: 'linear-gradient(to top, #000, transparent)',
        pointerEvents: 'none', zIndex: 5,
      }} />

      {/* Guide line */}
      <div style={{
        position: 'fixed', top: '50%', left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent 5%, #4ADE80 20%, #4ADE80 80%, transparent 95%)',
        opacity: 0.35, pointerEvents: 'none', zIndex: 10,
      }} />

      {/* Countdown */}
      {countdown !== null && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 140,
          color: '#4ADE80', zIndex: 30,
        }}>{countdown}</div>
      )}

      {/* Content */}
      <div ref={contentRef} style={{
        position: 'absolute', top: 0, left: '50%',
        transform: `translateX(-50%) translateY(-${position}px)`,
        width: '78%', maxWidth: 900,
        paddingTop: '50vh', paddingBottom: '60vh',
      }}>
        {blocks.map((block, i) => {
          if (block.type === 'separator') {
            return <div key={i} style={{
              height: 1, background: '#2d3548', margin: '40px 0',
            }} />
          }
          if (block.type === 'section') {
            return <div key={i} style={{
              color: '#4ADE80', fontSize: 20, letterSpacing: 3,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase', marginTop: i === 0 ? 0 : 56,
              marginBottom: 14, opacity: 0.75,
            }}>{block.text}</div>
          }
          if (block.type === 'direction') {
            return <div key={i} style={{
              color: '#FB923C', fontSize: 22, fontStyle: 'italic',
              marginBottom: 10, opacity: 0.85,
            }}>{block.text}</div>
          }
          if (block.type === 'cue') {
            return <div key={i} style={{
              color: '#F87171', fontSize: 22, fontStyle: 'italic',
              marginBottom: 16, opacity: 0.85,
            }}>{block.text}</div>
          }
          // speech
          return <div key={i} style={{
            color: '#fff', fontSize, lineHeight: 1.55,
            fontWeight: 400, marginBottom: 32, letterSpacing: '0.01em',
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}>{block.text}</div>
        })}
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
            <div style={{ fontSize: 32, color: '#4ADE80', fontWeight: 700 }}>
              {formatTime(elapsed)}
            </div>
            <div style={{ fontSize: 14, color: '#8892a4', marginTop: 4 }}>
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
              color: estRemaining < 30 ? '#F87171' : estRemaining < 60 ? '#FACC15' : '#8892a4',
            }}>
              -{formatTime(estRemaining)}
            </div>
            <div style={{ fontSize: 14, color: '#8892a4', marginTop: 4 }}>
              est. remaining
            </div>
          </div>

          {/* Speed + Progress — bottom left */}
          <div style={{
            position: 'fixed', bottom: 20, left: 28, zIndex: 20,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#8892a4',
            opacity: scrolling ? 0.4 : 0.7,
            transition: 'opacity 0.3s ease',
          }}>
            <span style={{ color: '#FACC15' }}>Speed {speed.toFixed(1)}</span>
            <span style={{ margin: '0 12px', opacity: 0.4 }}>|</span>
            <span>Font {fontSize}px</span>
            <span style={{ margin: '0 12px', opacity: 0.4 }}>|</span>
            <span>{wordsRead} / {totalWords} words</span>
          </div>

          {/* Controls — bottom right */}
          <div style={{
            position: 'fixed', bottom: 20, right: 28, zIndex: 20,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#8892a4',
            textAlign: 'right', lineHeight: 1.8,
            opacity: scrolling ? 0 : 0.6,
            transition: 'opacity 0.3s ease',
          }}>
            SPACE play/pause &nbsp; ↑↓ speed &nbsp; ←→ jump<br />
            +/- font size &nbsp; H hud &nbsp; M mirror &nbsp; R reset &nbsp; ESC exit
          </div>

          {/* Progress bar */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, height: 3,
            background: '#1a1f2e', zIndex: 20,
          }}>
            <div style={{
              width: `${progress * 100}%`, height: '100%',
              background: 'linear-gradient(90deg, #4ADE80, #FACC15, #FB923C, #F87171)',
              transition: 'width 0.1s linear',
            }} />
          </div>
        </>
      )}
    </div>
  )
}
