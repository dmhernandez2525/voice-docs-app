import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic, MicOff, MessageSquare, Zap, Shield, Globe, Sparkles,
  Play, ChevronRight, Volume2, Keyboard, Clock, Search,
  BookOpen, Headphones, ArrowRight, Check, Star, Github
} from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"

// Audio visualizer bars component
function AudioVisualizer({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-end gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary rounded-full"
          animate={{
            height: isActive ? [8, 24, 12, 32, 16][i % 5] : 4,
            opacity: isActive ? 1 : 0.3
          }}
          transition={{
            duration: 0.3,
            repeat: isActive ? Infinity : 0,
            repeatType: "reverse",
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  )
}

// Animated feature card
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0
}: {
  icon: typeof Mic
  title: string
  description: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card className="h-full bg-card/50 backdrop-blur border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group">
        <CardContent className="p-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Stats counter
function StatCounter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isVisible, value])

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-primary">
        {count}{suffix}
      </div>
      <div className="text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

// Voice command demo
function VoiceCommandDemo() {
  const commands = [
    { text: "Show me the getting started guide", response: "Opening Getting Started documentation..." },
    { text: "Search for voice commands", response: "Found 12 results for 'voice commands'..." },
    { text: "Read this section aloud", response: "Reading: Voice recognition enables hands-free..." },
    { text: "What are the keyboard shortcuts?", response: "Here are the available shortcuts..." }
  ]

  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % commands.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [isPlaying, commands.length])

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-muted'}`} />
          <span className="text-sm font-medium">Live Demo</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Mic className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">You said:</p>
              <p className="font-medium">"{commands[activeIndex].text}"</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Response:</p>
              <p className="font-medium">{commands[activeIndex].response}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center gap-2 mt-4">
        {commands.map((_, i) => (
          <button
            key={i}
            onClick={() => { setActiveIndex(i); setIsPlaying(false) }}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === activeIndex ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// Use case card
function UseCaseCard({
  title,
  description,
  icon: Icon,
  gradient
}: {
  title: string
  description: string
  icon: typeof BookOpen
  gradient: string
}) {
  return (
    <div className={`p-6 rounded-2xl ${gradient} text-white`}>
      <Icon className="w-8 h-8 mb-4" />
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-white/80 text-sm">{description}</p>
    </div>
  )
}

export function LandingPage() {
  const [demoMicActive, setDemoMicActive] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Mic className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">VoiceDocs</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Use Cases</a>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href="https://github.com/dmhernandez2525/voice-docs-app" target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </a>
            </Button>
            <Button asChild>
              <Link to="/app">
                Launch App
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Voice-First Documentation
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Documentation that{" "}
                <span className="text-primary">listens</span> to you
              </h1>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Navigate, search, and interact with documentation using just your voice.
                Hands-free access powered by browser-native speech APIs and intelligent AI assistance.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Button size="lg" asChild className="group">
                  <Link to="/app">
                    <Play className="w-5 h-5 mr-2" />
                    Try It Now
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#how-it-works">
                    See How It Works
                  </a>
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  No API keys required
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  100% browser-based
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Free & open source
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <Card className="bg-card/80 backdrop-blur border-primary/20 shadow-2xl shadow-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Button
                        variant={demoMicActive ? "default" : "outline"}
                        size="icon"
                        className={demoMicActive ? "bg-red-500 hover:bg-red-600" : ""}
                        onClick={() => setDemoMicActive(!demoMicActive)}
                      >
                        {demoMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                      <div>
                        <p className="font-medium text-sm">
                          {demoMicActive ? "Listening..." : "Click to start"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {demoMicActive ? "Speak a command" : "Voice input ready"}
                        </p>
                      </div>
                    </div>
                    <AudioVisualizer isActive={demoMicActive} />
                  </div>

                  <VoiceCommandDemo />
                </CardContent>
              </Card>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-lg"
              >
                AI Powered
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                className="absolute -bottom-4 -left-4 bg-card border border-primary/20 px-3 py-1 rounded-full text-sm font-medium shadow-lg flex items-center gap-2"
              >
                <Volume2 className="w-3 h-3 text-primary" />
                Text-to-Speech
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter value={100} suffix="%" label="Browser Native" />
            <StatCounter value={7} label="Theme Options" />
            <StatCounter value={50} suffix="+" label="Voice Commands" />
            <StatCounter value={0} label="API Keys Needed" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need for{" "}
              <span className="text-primary">voice-first</span> docs
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make documentation accessible, intuitive, and hands-free.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Mic}
              title="Continuous Voice Recognition"
              description="Talk naturally with always-on listening mode. Automatic silence detection processes your commands seamlessly."
              delay={0}
            />
            <FeatureCard
              icon={MessageSquare}
              title="AI Documentation Assistant"
              description="Ask questions in natural language and get contextual answers with links to relevant documentation sections."
              delay={0.1}
            />
            <FeatureCard
              icon={Volume2}
              title="Text-to-Speech Reading"
              description="Have any section read aloud with customizable voice, speed, and pitch settings."
              delay={0.2}
            />
            <FeatureCard
              icon={Search}
              title="Smart Search"
              description="Voice or text search across all documentation with instant results and intelligent ranking."
              delay={0.3}
            />
            <FeatureCard
              icon={Keyboard}
              title="Keyboard Shortcuts"
              description="Power user shortcuts for quick navigation. Press ? to see all available commands."
              delay={0.4}
            />
            <FeatureCard
              icon={Globe}
              title="Multi-Language Support"
              description="Voice recognition and synthesis in multiple languages. Configure your preferred language easily."
              delay={0.5}
            />
            <FeatureCard
              icon={Clock}
              title="Conversation History"
              description="All your conversations are saved locally. Export, import, and search your history."
              delay={0.6}
            />
            <FeatureCard
              icon={Shield}
              title="Privacy First"
              description="Everything runs in your browser. No data sent to external servers. Your voice stays private."
              delay={0.7}
            />
            <FeatureCard
              icon={Zap}
              title="Zero Config"
              description="Works out of the box. No API keys, no setup, no backend. Just open and start talking."
              delay={0.8}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to hands-free documentation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Click the Mic",
                description: "Open the AI assistant and click the microphone button to start listening, or use Talk Mode for continuous hands-free interaction."
              },
              {
                step: "2",
                title: "Ask Your Question",
                description: "Speak naturally. Ask about any topic, search for content, or give navigation commands. The system understands context."
              },
              {
                step: "3",
                title: "Get Instant Answers",
                description: "Receive AI-powered responses with links to relevant sections. Have responses read aloud or continue the conversation."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perfect for
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Voice-enabled documentation fits naturally into many workflows
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
            >
              <UseCaseCard
                icon={BookOpen}
                title="Developers"
                description="Keep coding while querying docs. No context switching needed."
                gradient="bg-gradient-to-br from-blue-500 to-blue-700"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <UseCaseCard
                icon={Headphones}
                title="Accessibility"
                description="Screen reader alternative for visually impaired users."
                gradient="bg-gradient-to-br from-purple-500 to-purple-700"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <UseCaseCard
                icon={Zap}
                title="Multitaskers"
                description="Work on something else while getting documentation read to you."
                gradient="bg-gradient-to-br from-orange-500 to-orange-700"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <UseCaseCard
                icon={Star}
                title="Learners"
                description="Audio learning while following along with written content."
                gradient="bg-gradient-to-br from-green-500 to-green-700"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to try voice-first documentation?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              No sign-up required. No API keys. Just click and start talking.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild className="group">
                <Link to="/app">
                  <Mic className="w-5 h-5 mr-2" />
                  Launch VoiceDocs
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <a href="https://github.com/dmhernandez2525/voice-docs-app" target="_blank" rel="noopener noreferrer">
                  <Github className="w-5 h-5 mr-2" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Mic className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-semibold">VoiceDocs</span>
              <span className="text-muted-foreground text-sm">by Daniel Hernandez</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="https://github.com/dmhernandez2525/voice-docs-app" className="hover:text-foreground transition-colors">
                GitHub
              </a>
              <Link to="/app" className="hover:text-foreground transition-colors">
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
