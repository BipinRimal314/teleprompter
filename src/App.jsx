import React, { useState } from 'react'
import Editor from './Editor.jsx'
import Prompter from './Prompter.jsx'

export default function App() {
  const [mode, setMode] = useState('editor')
  const [scriptText, setScriptText] = useState('')
  const [wpm, setWpm] = useState(150)
  const [countdownDuration, setCountdownDuration] = useState(3)
  const [targetDuration, setTargetDuration] = useState(0)

  if (mode === 'prompter') {
    return (
      <Prompter
        scriptText={scriptText}
        wpm={wpm}
        countdownDuration={countdownDuration}
        targetDuration={targetDuration}
        onExit={() => setMode('editor')}
      />
    )
  }

  return (
    <Editor onStart={(text, w, cd, td) => {
      setScriptText(text)
      setWpm(w)
      setCountdownDuration(cd)
      setTargetDuration(td)
      setMode('prompter')
    }} />
  )
}
