import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Dialog,
  DialogContent,
} from "./ui/dialog"
import { Input } from "./ui/input"
import {
  Search, Mic, MessageSquare, Settings, BookOpen,
  Volume2, Keyboard, Home, Moon, Sun, HelpCircle,
  ArrowRight, Command
} from "lucide-react"
import { useNavigate } from "react-router-dom"

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: typeof Search
  category: string
  shortcut?: string[]
  action: () => void
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenAIAssistant?: () => void
  onOpenVoiceSettings?: () => void
  onOpenKeyboardShortcuts?: () => void
  onOpenVoiceCommands?: () => void
  onToggleTheme?: () => void
  isDarkMode?: boolean
}

export function CommandPalette({
  open,
  onOpenChange,
  onOpenAIAssistant,
  onOpenVoiceSettings,
  onOpenKeyboardShortcuts,
  onOpenVoiceCommands,
  onToggleTheme,
  isDarkMode
}: CommandPaletteProps) {
  const [search, setSearch] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: "home",
      label: "Go Home",
      description: "Return to landing page",
      icon: Home,
      category: "Navigation",
      action: () => { navigate("/"); onOpenChange(false) }
    },
    {
      id: "app",
      label: "Open Documentation",
      description: "Go to the documentation app",
      icon: BookOpen,
      category: "Navigation",
      action: () => { navigate("/app"); onOpenChange(false) }
    },

    // Actions
    {
      id: "ai-assistant",
      label: "Open AI Assistant",
      description: "Ask questions about the documentation",
      icon: MessageSquare,
      category: "Actions",
      shortcut: ["Ctrl", "J"],
      action: () => { onOpenAIAssistant?.(); onOpenChange(false) }
    },
    {
      id: "voice-settings",
      label: "Voice Settings",
      description: "Configure speech recognition and synthesis",
      icon: Settings,
      category: "Actions",
      shortcut: ["Ctrl", ","],
      action: () => { onOpenVoiceSettings?.(); onOpenChange(false) }
    },
    {
      id: "stop-speech",
      label: "Stop Speaking",
      description: "Cancel any active text-to-speech",
      icon: Volume2,
      category: "Actions",
      shortcut: ["Ctrl", "S"],
      action: () => { window.speechSynthesis?.cancel(); onOpenChange(false) }
    },

    // Help
    {
      id: "keyboard-shortcuts",
      label: "Keyboard Shortcuts",
      description: "View all keyboard shortcuts",
      icon: Keyboard,
      category: "Help",
      shortcut: ["?"],
      action: () => { onOpenKeyboardShortcuts?.(); onOpenChange(false) }
    },
    {
      id: "voice-commands",
      label: "Voice Commands",
      description: "View all voice commands",
      icon: Mic,
      category: "Help",
      action: () => { onOpenVoiceCommands?.(); onOpenChange(false) }
    },
    {
      id: "help",
      label: "Help & Documentation",
      description: "Learn how to use VoiceDocs",
      icon: HelpCircle,
      category: "Help",
      action: () => { navigate("/app"); onOpenChange(false) }
    },

    // Theme
    {
      id: "toggle-theme",
      label: isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode",
      description: "Toggle between light and dark theme",
      icon: isDarkMode ? Sun : Moon,
      category: "Appearance",
      action: () => { onToggleTheme?.(); onOpenChange(false) }
    },
  ], [navigate, onOpenChange, onOpenAIAssistant, onOpenVoiceSettings, onOpenKeyboardShortcuts, onOpenVoiceCommands, onToggleTheme, isDarkMode])

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands

    const query = search.toLowerCase()
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(query) ||
      cmd.description?.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query)
    )
  }, [commands, search])

  const categories = useMemo(() => {
    const cats = [...new Set(filteredCommands.map(c => c.category))]
    return cats
  }, [filteredCommands])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Reset search when opened
  useEffect(() => {
    if (open) {
      setSearch("")
      setSelectedIndex(0)
    }
  }, [open])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
        }
        break
      case "Escape":
        onOpenChange(false)
        break
    }
  }, [filteredCommands, selectedIndex, onOpenChange])

  let itemIndex = 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 p-0 h-auto text-base"
            autoFocus
          />
          <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
            Esc
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No commands found</p>
            </div>
          ) : (
            categories.map(category => {
              const categoryCommands = filteredCommands.filter(c => c.category === category)
              if (categoryCommands.length === 0) return null

              return (
                <div key={category} className="mb-2">
                  <div className="px-2 py-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {category}
                    </span>
                  </div>
                  {categoryCommands.map(command => {
                    const currentIndex = itemIndex++
                    const Icon = command.icon
                    const isSelected = currentIndex === selectedIndex

                    return (
                      <button
                        key={command.id}
                        onClick={command.action}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{command.label}</div>
                          {command.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {command.description}
                            </div>
                          )}
                        </div>
                        {command.shortcut && (
                          <div className="flex items-center gap-1">
                            {command.shortcut.map((key, i) => (
                              <span key={i}>
                                <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded border">
                                  {key}
                                </kbd>
                                {i < command.shortcut!.length - 1 && (
                                  <span className="text-muted-foreground mx-0.5">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                        {isSelected && (
                          <ArrowRight className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="bg-muted px-1 py-0.5 rounded border">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-muted px-1 py-0.5 rounded border">↵</kbd>
              select
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>Command Palette</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
