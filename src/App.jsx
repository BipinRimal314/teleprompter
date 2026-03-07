import React, { useState } from 'react'
import Editor from './Editor.jsx'
import Prompter from './Prompter.jsx'

export default function App() {
  const [mode, setMode] = useState('editor') // 'editor' | 'prompter'
  const [scriptText, setScriptText] = useState('')
  const [wpm, setWpm] = useState(150)

  if (mode === 'prompter') {
    return (
      <Prompter
        scriptText={scriptText}
        wpm={wpm}
        onExit={() => setMode('editor')}
      />
    )
  }

  return (
    <Editor onStart={(text, w) => {
      setScriptText(text)
      setWpm(w)
      setMode('prompter')
    }} />
  )
}
