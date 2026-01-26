import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Badge } from "./ui/badge"
import { Mic, Search, Volume2, Navigation, MessageSquare, Settings, BookOpen } from "lucide-react"

interface VoiceCommand {
  phrase: string
  description: string
  example?: string
  category: string
  icon: typeof Mic
}

const voiceCommands: VoiceCommand[] = [
  // Navigation
  {
    phrase: "Go to [section name]",
    description: "Navigate to a specific documentation section",
    example: "Go to Getting Started",
    category: "Navigation",
    icon: Navigation
  },
  {
    phrase: "Open [topic]",
    description: "Open a documentation topic",
    example: "Open voice commands",
    category: "Navigation",
    icon: BookOpen
  },
  {
    phrase: "Go back",
    description: "Return to the previous section",
    category: "Navigation",
    icon: Navigation
  },
  {
    phrase: "Go home",
    description: "Return to the main documentation page",
    category: "Navigation",
    icon: Navigation
  },

  // Search
  {
    phrase: "Search for [query]",
    description: "Search the documentation",
    example: "Search for voice recognition",
    category: "Search",
    icon: Search
  },
  {
    phrase: "Find [topic]",
    description: "Find content related to a topic",
    example: "Find keyboard shortcuts",
    category: "Search",
    icon: Search
  },
  {
    phrase: "What is [term]?",
    description: "Get an explanation of a term or concept",
    example: "What is Talk Mode?",
    category: "Search",
    icon: Search
  },

  // Voice Control
  {
    phrase: "Start listening",
    description: "Activate continuous voice recognition",
    category: "Voice Control",
    icon: Mic
  },
  {
    phrase: "Stop listening",
    description: "Deactivate voice recognition",
    category: "Voice Control",
    icon: Mic
  },
  {
    phrase: "Enable Talk Mode",
    description: "Turn on hands-free continuous listening",
    category: "Voice Control",
    icon: Mic
  },
  {
    phrase: "Disable Talk Mode",
    description: "Turn off continuous listening mode",
    category: "Voice Control",
    icon: Mic
  },

  // Audio/Speech
  {
    phrase: "Read this",
    description: "Read the current section aloud",
    category: "Audio",
    icon: Volume2
  },
  {
    phrase: "Read [section name]",
    description: "Read a specific section aloud",
    example: "Read the introduction",
    category: "Audio",
    icon: Volume2
  },
  {
    phrase: "Stop reading",
    description: "Stop text-to-speech playback",
    category: "Audio",
    icon: Volume2
  },
  {
    phrase: "Speak faster / slower",
    description: "Adjust speech rate",
    category: "Audio",
    icon: Volume2
  },

  // AI Assistant
  {
    phrase: "Ask [question]",
    description: "Ask the AI assistant a question",
    example: "Ask how to configure voice settings",
    category: "AI Assistant",
    icon: MessageSquare
  },
  {
    phrase: "Explain [topic]",
    description: "Get an explanation of a topic",
    example: "Explain speech recognition",
    category: "AI Assistant",
    icon: MessageSquare
  },
  {
    phrase: "Help me with [task]",
    description: "Get assistance with a specific task",
    example: "Help me with voice setup",
    category: "AI Assistant",
    icon: MessageSquare
  },

  // Settings
  {
    phrase: "Open settings",
    description: "Open the voice settings panel",
    category: "Settings",
    icon: Settings
  },
  {
    phrase: "Change voice to [name]",
    description: "Switch to a different TTS voice",
    category: "Settings",
    icon: Settings
  },
]

interface VoiceCommandReferenceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VoiceCommandReference({ open, onOpenChange }: VoiceCommandReferenceProps) {
  const categories = [...new Set(voiceCommands.map(c => c.category))]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Commands Reference
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mb-6">
          These voice commands work in Talk Mode or when the microphone is active.
          Phrases in [brackets] should be replaced with your specific query.
        </p>

        <div className="space-y-8">
          {categories.map(category => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
                  {category}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {voiceCommands.filter(c => c.category === category).length} commands
                </Badge>
              </div>

              <div className="grid gap-3">
                {voiceCommands
                  .filter(c => c.category === category)
                  .map((command, i) => {
                    const Icon = command.icon
                    return (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <code className="text-sm font-semibold bg-primary/10 px-2 py-0.5 rounded text-primary">
                                "{command.phrase}"
                              </code>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {command.description}
                            </p>
                            {command.example && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Example: <span className="italic">"{command.example}"</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <h4 className="font-semibold text-sm mb-2">Tips for Better Recognition</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Speak clearly and at a natural pace</li>
            <li>• Wait for the listening indicator before speaking</li>
            <li>• Reduce background noise when possible</li>
            <li>• Use headphones to prevent echo</li>
            <li>• Adjust silence timeout in settings if commands are cut off</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
