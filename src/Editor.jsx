import React, { useState, useEffect } from 'react'
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

export default function Editor({ onStart }) {
  const [text, setText] = useState('')
  const [saveName, setSaveName] = useState('')
  const [saved, setSaved] = useState({})
  const [wpm, setWpm] = useState(150)

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
  const duration = estimateDuration(blocks, wpm)
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

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      maxWidth: 1000, margin: '0 auto', padding: '40px 24px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8,
        }}>Teleprompter</h1>
        <p style={{ fontSize: 16, color: '#8892a4', lineHeight: 1.5 }}>
          Write your script below. Use <code style={{ color: '#4ADE80' }}>## </code> for sections,
          <code style={{ color: '#FB923C' }}> [WEBCAM]</code> for directions,
          <code style={{ color: '#F87171' }}> {'>'} </code> for cues to yourself.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex', gap: 32, marginBottom: 20, flexWrap: 'wrap',
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

      {/* Editor */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={SAMPLE}
        spellCheck={false}
        style={{
          width: '100%', minHeight: 400, flex: 1,
          background: '#111318', border: '1px solid #2d3548', borderRadius: 12,
          color: '#e8ecf1', fontSize: 18, lineHeight: 1.7,
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          padding: 24, resize: 'vertical', outline: 'none',
        }}
        onFocus={(e) => e.target.style.borderColor = '#4ADE80'}
        onBlur={(e) => e.target.style.borderColor = '#2d3548'}
      />

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <button onClick={() => onStart(text, wpm)} disabled={!text.trim()}
          style={{
            background: text.trim() ? '#4ADE80' : '#2d3548',
            color: text.trim() ? '#000' : '#555',
            border: 'none', borderRadius: 10, padding: '14px 36px',
            fontSize: 18, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default',
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
          }}>
          Start Prompter
        </button>

        <label style={{
          background: '#1a1f2e', border: '1px solid #2d3548', borderRadius: 10,
          padding: '14px 24px', fontSize: 15, color: '#8892a4', cursor: 'pointer',
        }}>
          Load .md / .txt
          <input type="file" accept=".md,.txt,.markdown" onChange={handleFile}
            style={{ display: 'none' }} />
        </label>

        <button onClick={() => setText(SAMPLE)} style={{
          background: 'none', border: '1px solid #2d3548', borderRadius: 10,
          padding: '14px 24px', fontSize: 15, color: '#8892a4', cursor: 'pointer',
        }}>
          Load Sample
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
