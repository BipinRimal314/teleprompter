import React, { useState, useEffect, useRef } from 'react'
import { parseScript, countWords, estimateDuration, formatTime } from './parser.js'

const STORAGE_KEY = 'teleprompter_scripts'
const LAST_SCRIPT_KEY = 'teleprompter_last'

function getSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch { return {} }
}

function saveTo(name, text) {
  const saved = getSaved()
  saved[name] = { text, updatedAt: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
}

function deleteSaved(name) {
  const saved = getSaved()
  delete saved[name]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
}

function parseTargetDuration(str) {
  if (!str || !str.trim()) return 0
  const parts = str.trim().split(':')
  if (parts.length === 2) {
    const m = parseInt(parts[0]) || 0
    const s = parseInt(parts[1]) || 0
    return m * 60 + s
  }
  const n = parseInt(str)
  return isNaN(n) ? 0 : n * 60
}

const SAMPLE = `## Slide 1 — Title
[WEBCAM]
Quick: it's 2:37. How much of your hour is left? If your brain just stalled, this video is for you.

## Slide 2 — The Problem
[SLIDE]
Here's the thing about clocks: they were designed 4,000 years ago. Base-60 was great for astronomy. Terrible for knowing how much of your hour is left.

## Slide 3 — The Fix
[SLIDE]
> Pause. Let the visual land.
So I built Drift. Instead of 2:37, you see 62%. No math. No conversion. You just know.`

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

export default function Editor({ onStart }) {
  const isMobile = useMediaQuery('(max-width: 600px)')
  const [text, setText] = useState('')
  const [saveName, setSaveName] = useState('')
  const [saved, setSaved] = useState({})
  const [wpm, setWpm] = useState(150)
  const [countdownDuration, setCountdownDuration] = useState(3)
  const [targetDurationStr, setTargetDurationStr] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    const last = localStorage.getItem(LAST_SCRIPT_KEY)
    if (last) setText(last)
    setSaved(getSaved())
  }, [])

  useEffect(() => {
    localStorage.setItem(LAST_SCRIPT_KEY, text)
  }, [text])

  const blocks = parseScript(text)
  const words = countWords(blocks)
  const targetSec = parseTargetDuration(targetDurationStr)
  const duration = targetSec > 0 ? targetSec : estimateDuration(blocks, wpm)
  const savedList = Object.entries(saved).sort((a, b) => b[1].updatedAt - a[1].updatedAt)

  const handleSave = () => {
    if (!saveName.trim()) return
    saveTo(saveName.trim(), text)
    setSaved(getSaved())
    setSaveName('')
  }

  const handleLoad = (name) => {
    setText(saved[name].text)
  }

  const handleDelete = (name) => {
    deleteSaved(name)
    setSaved(getSaved())
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setText(ev.target.result)
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (!file.name.match(/\.(md|txt|markdown)$/i)) return
    const reader = new FileReader()
    reader.onload = (ev) => setText(ev.target.result)
    reader.readAsText(file)
  }

  const handleExport = () => {
    if (!text.trim()) return
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'script.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleStart = () => {
    onStart(text, wpm, countdownDuration, parseTargetDuration(targetDurationStr))
  }

  const btnBase = {
    background: '#1a1f2e', border: '1px solid #2d3548', borderRadius: 10,
    padding: '14px 24px', fontSize: 15, color: '#8892a4', cursor: 'pointer',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      maxWidth: 1000, margin: '0 auto', padding: isMobile ? '20px 16px' : '40px 24px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#fff', marginBottom: 8,
        }}>Teleprompter</h1>
        <p style={{ fontSize: 16, color: '#8892a4', lineHeight: 1.5 }}>
          Write your script below. Use <code style={{ color: '#4ADE80' }}>## </code> for sections,
          <code style={{ color: '#FB923C' }}> [WEBCAM]</code> for directions,
          <code style={{ color: '#F87171' }}> {'>'} </code> for cues to yourself.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex', gap: isMobile ? 16 : 32, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end',
      }}>
        {[
          { label: 'Words', value: words, color: '#fff' },
          { label: 'Est. duration', value: formatTime(duration), color: '#4ADE80' },
          { label: 'Sections', value: blocks.filter(b => b.type === 'section').length, color: '#60A5FA' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: s.color,
            }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#8892a4', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="range" min={100} max={200} value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
              style={{ width: 80, accentColor: '#4ADE80' }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: '#FACC15',
            }}>{wpm}</span>
          </div>
          <div style={{ fontSize: 13, color: '#8892a4', marginTop: 2 }}>WPM</div>
        </div>
      </div>

      {/* Recording settings */}
      <div style={{
        display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#8892a4' }}>Countdown</span>
          {[3, 5, 10].map(n => (
            <button key={n} onClick={() => setCountdownDuration(n)} style={{
              background: countdownDuration === n ? '#4ADE8020' : '#111318',
              border: `1px solid ${countdownDuration === n ? '#4ADE80' : '#2d3548'}`,
              borderRadius: 6, padding: '4px 10px', fontSize: 14, cursor: 'pointer',
              color: countdownDuration === n ? '#4ADE80' : '#8892a4',
              fontFamily: "'JetBrains Mono', monospace",
            }}>{n}s</button>
          ))}
        </div>

        {/* Target duration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#8892a4' }}>Target</span>
          <input
            value={targetDurationStr}
            onChange={(e) => setTargetDurationStr(e.target.value)}
            placeholder="m:ss"
            style={{
              background: '#111318', border: '1px solid #2d3548', borderRadius: 6,
              color: targetDurationStr ? '#FACC15' : '#8892a4', fontSize: 14,
              padding: '4px 10px', width: 64, outline: 'none', textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          {targetDurationStr && (
            <span style={{ fontSize: 12, color: '#8892a4' }}>overrides WPM</span>
          )}
        </div>
      </div>

      {/* Editor with drag-and-drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{ position: 'relative', flex: 1 }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={SAMPLE}
          spellCheck={false}
          style={{
            width: '100%', minHeight: 400, height: '100%',
            background: '#111318',
            border: `2px solid ${dragOver ? '#4ADE80' : '#2d3548'}`,
            borderRadius: 12,
            color: '#e8ecf1', fontSize: isMobile ? 16 : 18, lineHeight: 1.7,
            fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
            padding: 24, resize: 'vertical', outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { if (!dragOver) e.target.style.borderColor = '#4ADE80' }}
          onBlur={(e) => { if (!dragOver) e.target.style.borderColor = '#2d3548' }}
        />
        {dragOver && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 12,
            background: 'rgba(74, 222, 128, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: '#4ADE80',
            }}>Drop .md or .txt file</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        <button onClick={handleStart} disabled={!text.trim()}
          style={{
            background: text.trim() ? '#4ADE80' : '#2d3548',
            color: text.trim() ? '#000' : '#555',
            border: 'none', borderRadius: 10,
            padding: isMobile ? '14px 0' : '14px 36px',
            width: isMobile ? '100%' : 'auto',
            fontSize: 18, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default',
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
          }}>
          Start Prompter
        </button>

        <label style={btnBase}>
          Load .md / .txt
          <input type="file" accept=".md,.txt,.markdown" onChange={handleFile}
            style={{ display: 'none' }} />
        </label>

        <button onClick={() => setText(SAMPLE)} style={btnBase}>
          Load Sample
        </button>

        <button onClick={handleExport} disabled={!text.trim()} style={{
          ...btnBase,
          opacity: text.trim() ? 1 : 0.4,
          cursor: text.trim() ? 'pointer' : 'default',
        }}>
          Export .md
        </button>
      </div>

      {/* Save / Load */}
      <div style={{
        marginTop: 32, borderTop: '1px solid #2d3548', paddingTop: 24,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Script name..."
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            style={{
              background: '#111318', border: '1px solid #2d3548', borderRadius: 8,
              color: '#e8ecf1', fontSize: 15, padding: '10px 16px', flex: 1,
              fontFamily: 'Inter, sans-serif', outline: 'none', maxWidth: 300,
            }}
          />
          <button onClick={handleSave} disabled={!saveName.trim()} style={{
            background: '#1a1f2e', border: '1px solid #2d3548', borderRadius: 8,
            padding: '10px 20px', fontSize: 15, color: '#e8ecf1', cursor: 'pointer',
          }}>Save</button>
        </div>

        {savedList.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {savedList.map(([name]) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#1a1f2e', border: '1px solid #2d3548', borderRadius: 8,
                padding: '8px 14px',
              }}>
                <span onClick={() => handleLoad(name)} style={{
                  fontSize: 14, color: '#60A5FA', cursor: 'pointer',
                }}>{name}</span>
                <span onClick={() => handleDelete(name)} style={{
                  fontSize: 13, color: '#F87171', cursor: 'pointer', opacity: 0.6,
                }}>x</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
