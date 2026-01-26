import { useEffect, useState, useCallback } from "react"

/**
 * Hook for global keyboard shortcuts
 */
export function useKeyboardShortcuts() {
  const [showShortcuts, setShowShortcuts] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    // Show shortcuts dialog with ?
    if (e.key === '?' && !isInput) {
      e.preventDefault()
      setShowShortcuts(true)
      return
    }

    // Close with Escape
    if (e.key === 'Escape') {
      setShowShortcuts(false)
      return
    }

    const isMod = e.metaKey || e.ctrlKey

    // Ctrl/Cmd + K - Focus search
    if (isMod && e.key === 'k') {
      e.preventDefault()
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement
      searchInput?.focus()
      return
    }

    // Ctrl/Cmd + J - Open AI Assistant
    if (isMod && e.key === 'j') {
      e.preventDefault()
      const aiButton = document.querySelector('[data-ai-assistant-trigger]') as HTMLButtonElement
      aiButton?.click()
      return
    }

    // Ctrl/Cmd + , - Open settings
    if (isMod && e.key === ',') {
      e.preventDefault()
      const settingsButton = document.querySelector('[data-voice-settings-trigger]') as HTMLButtonElement
      settingsButton?.click()
      return
    }

    // Ctrl/Cmd + M - Toggle microphone
    if (isMod && e.key === 'm' && !e.shiftKey) {
      e.preventDefault()
      const micButton = document.querySelector('[data-mic-toggle]') as HTMLButtonElement
      micButton?.click()
      return
    }

    // Ctrl/Cmd + Shift + M - Toggle Talk Mode
    if (isMod && e.shiftKey && e.key === 'M') {
      e.preventDefault()
      const talkModeToggle = document.querySelector('[data-talk-mode-toggle]') as HTMLButtonElement
      talkModeToggle?.click()
      return
    }

    // Ctrl/Cmd + S - Stop speaking
    if (isMod && e.key === 's' && !isInput) {
      e.preventDefault()
      window.speechSynthesis?.cancel()
      return
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { showShortcuts, setShowShortcuts }
}
