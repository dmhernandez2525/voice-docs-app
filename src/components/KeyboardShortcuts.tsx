import { useEffect, useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Keyboard, Mic, Search, Volume2, MessageSquare, Settings, Home, ArrowLeft } from "lucide-react"

interface Shortcut {
  keys: string[]
  description: string
  icon: typeof Keyboard
  category: string
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ["?"], description: "Show keyboard shortcuts", icon: Keyboard, category: "General" },
  { keys: ["Esc"], description: "Close dialog / Stop action", icon: ArrowLeft, category: "General" },
  { keys: ["Ctrl/Cmd", "K"], description: "Focus search", icon: Search, category: "Navigation" },
  { keys: ["Ctrl/Cmd", "H"], description: "Go to home", icon: Home, category: "Navigation" },

  // Voice
  { keys: ["Space"], description: "Toggle voice input (when focused)", icon: Mic, category: "Voice" },
  { keys: ["Ctrl/Cmd", "M"], description: "Toggle microphone", icon: Mic, category: "Voice" },
  { keys: ["Ctrl/Cmd", "Shift", "M"], description: "Toggle Talk Mode", icon: Mic, category: "Voice" },

  // AI Assistant
  { keys: ["Ctrl/Cmd", "J"], description: "Open AI Assistant", icon: MessageSquare, category: "AI Assistant" },
  { keys: ["Enter"], description: "Send message", icon: MessageSquare, category: "AI Assistant" },

  // Audio
  { keys: ["Ctrl/Cmd", "S"], description: "Stop speaking", icon: Volume2, category: "Audio" },
  { keys: ["Ctrl/Cmd", "R"], description: "Read current section", icon: Volume2, category: "Audio" },

  // Settings
  { keys: ["Ctrl/Cmd", ","], description: "Open voice settings", icon: Settings, category: "Settings" },
]

interface KeyboardShortcutsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  const categories = [...new Set(shortcuts.map(s => s.category))]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, i) => {
                    const Icon = shortcut.icon
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{shortcut.description}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, j) => (
                            <span key={j}>
                              <kbd className="px-2 py-1 text-xs font-semibold bg-muted border rounded">
                                {key}
                              </kbd>
                              {j < shortcut.keys.length - 1 && (
                                <span className="text-muted-foreground mx-1">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-muted border rounded">?</kbd> anywhere to show this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for global keyboard shortcuts
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
