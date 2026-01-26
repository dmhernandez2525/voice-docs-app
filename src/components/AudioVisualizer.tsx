import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AudioVisualizerProps {
  isActive: boolean
  variant?: "bars" | "wave" | "circle"
  className?: string
  barCount?: number
  color?: string
}

// Bars-style visualizer
function BarsVisualizer({
  isActive,
  barCount = 5,
  className
}: {
  isActive: boolean
  barCount: number
  className?: string
}) {
  const [heights, setHeights] = useState<number[]>(Array(barCount).fill(4))

  useEffect(() => {
    if (!isActive) {
      setHeights(Array(barCount).fill(4))
      return
    }

    const interval = setInterval(() => {
      setHeights(prev => prev.map(() => Math.random() * 24 + 8))
    }, 100)

    return () => clearInterval(interval)
  }, [isActive, barCount])

  return (
    <div className={cn("flex items-end gap-1 h-8", className)}>
      {heights.map((height, i) => (
        <div
          key={i}
          className="w-1 bg-primary rounded-full transition-all duration-100"
          style={{
            height: `${height}px`,
            opacity: isActive ? 1 : 0.3,
            transitionDelay: `${i * 30}ms`
          }}
        />
      ))}
    </div>
  )
}

// Wave-style visualizer (uses canvas)
function WaveVisualizer({
  isActive,
  className
}: {
  isActive: boolean
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const phaseRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)

      if (isActive) {
        ctx.beginPath()
        ctx.strokeStyle = 'hsl(var(--primary))'
        ctx.lineWidth = 2

        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin((x * 0.05) + phaseRef.current) * (height / 3) * Math.random()
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.stroke()
        phaseRef.current += 0.2
      } else {
        // Flat line when inactive
        ctx.beginPath()
        ctx.strokeStyle = 'hsl(var(--muted-foreground))'
        ctx.lineWidth = 1
        ctx.moveTo(0, height / 2)
        ctx.lineTo(width, height / 2)
        ctx.stroke()
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive])

  return (
    <canvas
      ref={canvasRef}
      width={100}
      height={32}
      className={cn("rounded", className)}
    />
  )
}

// Circle-style pulsing visualizer
function CircleVisualizer({
  isActive,
  className
}: {
  isActive: boolean
  className?: string
}) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!isActive) {
      setScale(1)
      return
    }

    const interval = setInterval(() => {
      setScale(1 + Math.random() * 0.3)
    }, 150)

    return () => clearInterval(interval)
  }, [isActive])

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer pulse ring */}
      <div
        className={cn(
          "absolute w-12 h-12 rounded-full bg-primary/20 transition-transform duration-150",
          isActive && "animate-ping"
        )}
        style={{ transform: `scale(${isActive ? scale : 1})` }}
      />
      {/* Inner circle */}
      <div
        className={cn(
          "relative w-8 h-8 rounded-full transition-all duration-150",
          isActive ? "bg-primary" : "bg-primary/30"
        )}
        style={{ transform: `scale(${isActive ? scale * 0.9 : 1})` }}
      />
    </div>
  )
}

export function AudioVisualizer({
  isActive,
  variant = "bars",
  className,
  barCount = 5
}: AudioVisualizerProps) {
  switch (variant) {
    case "wave":
      return <WaveVisualizer isActive={isActive} className={className} />
    case "circle":
      return <CircleVisualizer isActive={isActive} className={className} />
    case "bars":
    default:
      return <BarsVisualizer isActive={isActive} barCount={barCount} className={className} />
  }
}

// Microphone input audio visualizer using Web Audio API
export function MicrophoneVisualizer({
  isListening,
  className
}: {
  isListening: boolean
  className?: string
}) {
  const [levels, setLevels] = useState<number[]>(Array(16).fill(0))
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isListening) {
      setLevels(Array(16).fill(0))
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      return
    }

    const startAnalyzing = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream

        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        audioContextRef.current = audioContext

        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 32
        analyserRef.current = analyser

        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const analyze = () => {
          analyser.getByteFrequencyData(dataArray)
          const normalized = Array.from(dataArray).map(v => v / 255)
          setLevels(normalized)
          animationRef.current = requestAnimationFrame(analyze)
        }

        analyze()
      } catch (err) {
        console.warn("Could not access microphone for visualization:", err)
      }
    }

    startAnalyzing()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isListening])

  return (
    <div className={cn("flex items-end gap-0.5 h-8", className)}>
      {levels.map((level, i) => (
        <div
          key={i}
          className="w-1 bg-primary rounded-full transition-all duration-75"
          style={{
            height: `${Math.max(4, level * 32)}px`,
            opacity: isListening ? 0.5 + level * 0.5 : 0.2
          }}
        />
      ))}
    </div>
  )
}
