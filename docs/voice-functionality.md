# Voice Functionality

## Overview

The system uses browser-native speech APIs for voice recognition and synthesis. No external services or tokens required.

## Speech Recognition

Uses `webkitSpeechRecognition` or `SpeechRecognition` browser APIs:

- **Continuous listening** with configurable silence timeout
- **Real-time transcription** with interim results
- **Confidence scoring** for accuracy assessment
- **Error recovery** with automatic restart

### Browser Support
- ✅ Chrome/Chromium (full support)
- ✅ Edge (full support)
- ⚠️ Firefox (limited support)
- ⚠️ Safari (partial support)

## Speech Synthesis

Uses browser's built-in `speechSynthesis` API:

- **Voice selection** from available system voices
- **Rate, pitch, volume control** for customization
- **Automatic text cleanup** for better speech output
- **Queue management** for multiple utterances

## Permissions

Requires microphone access:
- **Automatic permission request** on first use
- **Permission status checking** before activation
- **Graceful fallback** when permissions denied
- **HTTPS requirement** for production deployments

## Configuration

Voice settings are customizable:
- **Language selection** (default: en-US)
- **Silence timeout** (default: 3 seconds)
- **Voice selection** from available options
- **Speech rate/pitch/volume** adjustment

See [Talk Mode Guide](./talk-mode.md) for hands-free conversation features.
